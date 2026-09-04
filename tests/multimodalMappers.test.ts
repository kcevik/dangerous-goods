import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { fetchCompareForUn } from '$lib/multimodal/mappers'

type TableResponse = { data: Record<string, unknown>[] | null, error: unknown }

/** Mocks from(table).select('*').eq('un_number', un).order(...) → Promise */
function createClient(responses: Partial<Record<string, TableResponse>>) {
  const eqCalls: Record<string, string> = {}
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: (_column: string, value: string) => {
        eqCalls[table] = value
        return {
          order: () => Promise.resolve(responses[table] ?? { data: [], error: null }),
        }
      },
    }),
  }))
  return { client: { from } as unknown as SupabaseClient, from, eqCalls }
}

const ADR_ROW = {
  un_number: '1203',
  sequence_number: 1,
  name: 'BENZIN',
  name_en: 'PETROL',
  name_fr: 'ESSENCE',
  specification: 'oder KRAFTSTOFF',
  specification_en: 'or MOTOR SPIRIT',
  specification_fr: null,
  hazard_class: '3',
  classification_code: 'F1',
  packing_group: 'II',
  hazard_labels: ['3'],
  excepted_qty: 'E2',
  limited_qty: '1 L',
  transport_category: '2',
  multiplier: '1000',
  kemler_number: '33',
  tunnel_code: 'D/E',
  packing_instructions: ['P001', 'IBC02'],
  remark: '',
  special_provision_codes: ['163', '243', '640D'],
}

describe('fetchCompareForUn', () => {
  it('returns empty results without querying when the UN number is blank', async () => {
    const { client, from } = createClient({})
    const result = await fetchCompareForUn(client, '   ')
    expect(result).toEqual({ ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] })
    expect(from).not.toHaveBeenCalled()
  })

  it('queries all four entry tables with the trimmed UN number', async () => {
    const { client, from, eqCalls } = createClient({})
    await fetchCompareForUn(client, ' 1203 ')
    expect(from.mock.calls.map(c => c[0]).sort()).toEqual([
      'adr_entries', 'icao_entries', 'imdg_entries', 'rid_entries',
    ])
    expect(Object.values(eqCalls)).toEqual(['1203', '1203', '1203', '1203'])
  })

  it('maps an ADR row: joins arrays, converts empty strings to undefined', async () => {
    const { client } = createClient({ adr_entries: { data: [ADR_ROW], error: null } })
    const { ADR } = await fetchCompareForUn(client, '1203')

    expect(ADR).toHaveLength(1)
    expect(ADR[0]).toMatchObject({
      unNumber: '1203',
      sequenceNumber: 1,
      name: 'BENZIN',
      nameEn: 'PETROL',
      hazardClass: '3',
      packingGroup: 'II',
      hazardLabels: '3',
      kemlerNumber: '33',
      tunnelCode: 'D/E',
      packingInstructions: 'P001, IBC02',
      specialProvisions: '163, 243, 640D',
    })
    // empty string and null → undefined, not ''
    expect(ADR[0]!.remark).toBeUndefined()
    expect(ADR[0]!.specificationFr).toBeUndefined()
  })

  it('drops empty and null items when joining array columns', async () => {
    const row = { ...ADR_ROW, special_provision_codes: ['163', null, '', '274'] }
    const { client } = createClient({ adr_entries: { data: [row], error: null } })
    const { ADR } = await fetchCompareForUn(client, '1203')
    expect(ADR[0]!.specialProvisions).toBe('163, 274')
  })

  it('maps empty array columns to undefined', async () => {
    const row = { ...ADR_ROW, hazard_labels: [], special_provision_codes: null }
    const { client } = createClient({ adr_entries: { data: [row], error: null } })
    const { ADR } = await fetchCompareForUn(client, '1203')
    expect(ADR[0]!.hazardLabels).toBeUndefined()
    expect(ADR[0]!.specialProvisions).toBeUndefined()
  })

  it('IMDG hazardLabels falls back to hazard_class when subsidiary_risks is empty', async () => {
    const row = {
      un_number: '1203', sequence_number: 1, name: 'GASOLINE',
      hazard_class: '3', subsidiary_risks: [],
      ems_fire: 'F-E', ems_spill: 'S-E', stowage_category: 'B',
    }
    const { client } = createClient({ imdg_entries: { data: [row], error: null } })
    const { IMDG } = await fetchCompareForUn(client, '1203')
    expect(IMDG[0]!.hazardLabels).toBe('3')
    expect(IMDG[0]!.ems1).toBe('F-E')
    expect(IMDG[0]!.ems2).toBe('S-E')
    expect(IMDG[0]!.stowageCategory).toBe('B')
  })

  it('maps ICAO passenger/cargo columns', async () => {
    const row = {
      un_number: '1203', sequence_number: 1, name: 'Gasoline',
      hazard_class: '3', packing_instr_passenger: '353', packing_instr_cargo: '364',
      max_net_passenger: '5 L', max_net_cargo: '60 L',
    }
    const { client } = createClient({ icao_entries: { data: [row], error: null } })
    const { ICAO } = await fetchCompareForUn(client, '1203')
    expect(ICAO[0]).toMatchObject({
      packingInstrPassenger: '353',
      packingInstrCargo: '364',
      maxNetPassenger: '5 L',
      maxNetCargo: '60 L',
    })
  })

  it('ADN is always empty (no ADN data in the BAM dataset)', async () => {
    const { client } = createClient({ adr_entries: { data: [ADR_ROW], error: null } })
    const { ADN } = await fetchCompareForUn(client, '1203')
    expect(ADN).toEqual([])
  })

  it('preserves multiple sequence entries per UN number', async () => {
    const rows = [ADR_ROW, { ...ADR_ROW, sequence_number: 2, packing_group: 'III' }]
    const { client } = createClient({ adr_entries: { data: rows, error: null } })
    const { ADR } = await fetchCompareForUn(client, '1203')
    expect(ADR.map(e => e.sequenceNumber)).toEqual([1, 2])
    expect(ADR[1]!.packingGroup).toBe('III')
  })

  it('throws when any table query fails', async () => {
    const { client } = createClient({
      rid_entries: { data: null, error: new Error('rid down') },
    })
    await expect(fetchCompareForUn(client, '1203')).rejects.toThrow('rid down')
  })
})
