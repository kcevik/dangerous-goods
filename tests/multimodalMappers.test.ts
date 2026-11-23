import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { fetchAdrEntries, fetchCompareForUn, fetchUnReference } from '$lib/multimodal/mappers'

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

describe('fetchUnReference', () => {
  it('reads un_entries for the trimmed UN number and maps the shared fields', async () => {
    const { client, from, eqCalls } = createClient({
      un_entries: {
        data: [{
          un_number: '1203', sequence_number: 1, name: 'MOTOR SPIRIT', specification: null,
          hazard_class: '3', subsidiary_risks: null, packing_group: 'II',
          special_provision_codes: ['243', '534'], limited_qty: '1 L', excepted_qty: 'E2',
          packing_instructions: ['P001', 'IBC02'], remark: null,
        }],
        error: null,
      },
    })
    const rows = await fetchUnReference(client, ' 1203 ')
    expect(from).toHaveBeenCalledWith('un_entries')
    expect(eqCalls.un_entries).toBe('1203')
    expect(rows).toEqual([{
      unNumber: '1203', sequenceNumber: 1, name: 'MOTOR SPIRIT', specification: undefined,
      hazardClass: '3', packingGroup: 'II', hazardLabels: undefined,
      exceptedQty: 'E2', limitedQty: '1 L', packingInstructions: 'P001, IBC02',
      specialProvisions: '243, 534', remark: undefined,
    }])
  })

  it('maps the UN portable tank instructions for the reference column, "(M)" kept with its code', async () => {
    const un = { un_number: '1005', sequence_number: 1, hazard_class: '2.3', un_tank_codes: ['T50', '(M)'] }
    const { client } = createClient({ un_entries: { data: [un], error: null } })
    const [row] = await fetchUnReference(client, '1005')
    expect(row!.portableTankInstr).toBe('T50 (M)')
  })

  it('throws on a query error instead of returning no rows', async () => {
    const { client } = createClient({ un_entries: { data: null, error: { message: 'down' } } })
    await expect(fetchUnReference(client, '1203')).rejects.toEqual({ message: 'down' })
  })

  it('returns no rows for a blank UN number without querying', async () => {
    const { client, from } = createClient({})
    expect(await fetchUnReference(client, '  ')).toEqual([])
    expect(from).not.toHaveBeenCalled()
  })
})

describe('fetchAdrEntries', () => {
  it('reads only adr_entries for the trimmed UN number and maps the rows', async () => {
    const { client, from, eqCalls } = createClient({ adr_entries: { data: [ADR_ROW], error: null } })
    const rows = await fetchAdrEntries(client, ' 1203 ')
    expect(from).toHaveBeenCalledTimes(1)
    expect(from).toHaveBeenCalledWith('adr_entries')
    expect(eqCalls.adr_entries).toBe('1203')
    expect(rows[0]).toMatchObject({ unNumber: '1203', name: 'BENZIN', transportCategory: '2', classificationCode: 'F1' })
  })

  it('throws on a query error instead of returning no rows', async () => {
    const { client } = createClient({ adr_entries: { data: null, error: { message: 'down' } } })
    await expect(fetchAdrEntries(client, '1203')).rejects.toEqual({ message: 'down' })
  })

  it('returns no rows for a blank UN number without querying', async () => {
    const { client, from } = createClient({})
    expect(await fetchAdrEntries(client, '  ')).toEqual([])
    expect(from).not.toHaveBeenCalled()
  })
})

// real column values of UN 1005 / 1203 / 3077 (BAM 2025), checked against the live tables 2026-11-23
const ADR_DETAIL_ROW = {
  ...ADR_ROW,
  packing_sv_codes: ['BB2'],
  co_packing: ['MP19'],
  un_tank_codes: ['T50', '(M)'],
  un_tank_sv_codes: ['TP1'],
  tank_codes: ['PxBH(M)'],
  tank_sv_codes: ['TA4', 'TT8', 'TT9'],
  tank_vehicle: 'AT',
  package_sv_codes: ['V12'],
  bulk_sv_codes: ['VC1', 'VC2'],
  handling_sv_codes: ['CV9', 'CV10', 'CV36'],
  operation_sv_codes: ['S2', 'S20'],
  security_level: 1,
  security_qty_tank: '3000',
  security_qty_bulk: 'a)',
  security_qty_packages: 'b)',
  n_mark: '+',
  compatibility_group: null,
  prohibited: true,
}

describe('fetchCompareForUn — ADR/RID/IMDG detail columns (persona test 2026-11-23)', () => {
  it('maps the ADR Table A columns 9a–19 and the 1.10 / N-mark columns', async () => {
    const { client } = createClient({ adr_entries: { data: [ADR_DETAIL_ROW], error: null } })
    const { ADR } = await fetchCompareForUn(client, '1005')
    expect(ADR[0]).toMatchObject({
      packingSv: 'BB2',
      coPacking: 'MP19',
      // "(M)" is a marker of the instruction before it, never a code of its own
      portableTankInstr: 'T50 (M)',
      portableTankSv: 'TP1',
      tankCodes: 'PxBH(M)',
      tankSv: 'TA4, TT8, TT9',
      tankVehicle: 'AT',
      packageSv: 'V12',
      bulkSv: 'VC1, VC2',
      handlingSv: 'CV9, CV10, CV36',
      operationSv: 'S2, S20',
      securityLevel: '1',
      securityQtyTank: '3000',
      securityQtyBulk: 'a)',
      securityQtyPackages: 'b)',
      envHazard: '+',
    })
    expect(ADR[0]!.compatibilityGroup).toBeUndefined()
    // BAM N_VERBOT is "1 = permitted": the imported `prohibited` column is never mapped
    expect(ADR[0]).not.toHaveProperty('prohibited')
  })

  it('keeps security level 0 (a value, not an absence)', async () => {
    const { client } = createClient({ adr_entries: { data: [{ ...ADR_DETAIL_ROW, security_level: 0 }], error: null } })
    const { ADR } = await fetchCompareForUn(client, '1203')
    expect(ADR[0]!.securityLevel).toBe('0')
  })

  it('maps the RID equivalents, including express freight (CE), and no ADR-only columns', async () => {
    const rid = {
      ...ADR_DETAIL_ROW,
      tank_sv_codes: ['TU38', 'TE22', 'TM6'],
      package_sv_codes: ['W12'],
      handling_sv_codes: ['CW9'],
      operation_sv_codes: null,
      tank_vehicle: null,
      express_freight: ['CE4'],
    }
    const { client } = createClient({ rid_entries: { data: [rid], error: null } })
    const { RID } = await fetchCompareForUn(client, '1005')
    expect(RID[0]).toMatchObject({
      tankCodes: 'PxBH(M)',
      tankSv: 'TU38, TE22, TM6',
      packageSv: 'W12',
      handlingSv: 'CW9',
      expressFreight: 'CE4',
      securityLevel: '1',
      envHazard: '+',
    })
    expect(RID[0]!.operationSv).toBeUndefined()
    expect(RID[0]!.tankVehicle).toBeUndefined()
  })

  it('maps the IMDG tank, handling and segregation-group columns; IBC provisions join the packing provisions', async () => {
    const imdg = {
      un_number: '3077', sequence_number: 1, hazard_class: '9',
      packing_instructions: ['P002', 'LP02'], ibc_instructions: 'IBC08',
      packing_sv_codes: ['PP12'], ibc_sv_codes: ['B3'],
      un_tank_codes: ['T1', 'BK1', 'BK2', 'BK3'], tank_sv_codes: ['TP33'],
      handling_codes: ['H1'], segregation_groups: ['SGG1'],
    }
    const { client } = createClient({ imdg_entries: { data: [imdg], error: null } })
    const { IMDG } = await fetchCompareForUn(client, '3077')
    expect(IMDG[0]).toMatchObject({
      packingSv: 'PP12, B3',
      portableTankInstr: 'T1, BK1, BK2, BK3',
      portableTankSv: 'TP33',
      imdgHandling: 'H1',
      segregationGroups: 'SGG1',
    })
    expect(IMDG[0]!.tankCodes).toBeUndefined()
  })
})
