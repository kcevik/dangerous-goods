// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { airProhibition, buildComparison, COMPARE_FIELDS, isCrossReference, isForbidden, summarizeDeviations } from '$lib/multimodal/compare'
import { parseEms } from '$lib/multimodal/ems'
import { fetchCompareForUn, fetchUnReference } from '$lib/multimodal/mappers'
import type { Entry } from '$lib/multimodal/types'
import { groupVariants, variantLabels } from '$lib/multimodal/variants'

/**
 * Persona test 2026-11-23, section 1: the comparison must never state something false.
 * Rows mirror the live BAM tables (read-only checks on 2026-11-23).
 */

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const row = (rows: ReturnType<typeof buildComparison>, field: keyof Entry) => rows.find(r => r.field === field)!

function clientWith(table: string, rows: Record<string, unknown>[]) {
  const builder = (t: string) => ({
    select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: t === table ? rows : [], error: null }) }) }),
  })
  return { from: (t: string) => builder(t) } as unknown as SupabaseClient
}

describe('ICAO mapper: limited quantities (Y) and state variations', () => {
  it('reads the Y packing instruction and its max net quantity as ICAO limited quantity (UN 1170)', async () => {
    const client = clientWith('icao_entries', [{
      un_number: '1170', sequence_number: 1, name: 'Ethanol', hazard_class: '3', packing_group: 'II',
      packing_instr_passenger: '353', max_net_passenger: '5 L',
      packing_instr_passenger_y: 'Y341', max_net_passenger_y: '1 L',
      packing_instr_cargo: '364', max_net_cargo: '60 L', state_variations: [],
    }])
    const { ICAO } = await fetchCompareForUn(client, '1170')
    expect(ICAO[0]!.limitedQty).toBe('Y341 · max 1 L')
    expect(ICAO[0]!.stateVariations).toBeUndefined()
  })

  it('leaves the ICAO limited quantity empty when BAM has no Y instruction', async () => {
    const client = clientWith('icao_entries', [{ un_number: '3480', sequence_number: 1, packing_instr_passenger_y: null, max_net_passenger_y: null }])
    const { ICAO } = await fetchCompareForUn(client, '3480')
    expect(ICAO[0]!.limitedQty).toBeUndefined()
  })

  it('joins the state variations (UN 1005)', async () => {
    const client = clientWith('icao_entries', [{ un_number: '1005', sequence_number: 1, state_variations: ['AU 1', 'CA 9', 'IR 3', 'NL 1', 'US 3'] }])
    const { ICAO } = await fetchCompareForUn(client, '1005')
    expect(ICAO[0]!.stateVariations).toBe('AU 1, CA 9, IR 3, NL 1, US 3')
  })
})

describe('IMDG and UN mapper: IBC instructions', () => {
  it('adds the IMDG IBC instruction (column 10) to the packing instructions (UN 3077)', async () => {
    const client = clientWith('imdg_entries', [{ un_number: '3077', sequence_number: 1, packing_instructions: ['P002', 'LP02'], ibc_instructions: 'IBC08' }])
    const { IMDG } = await fetchCompareForUn(client, '3077')
    expect(IMDG[0]!.packingInstructions).toBe('P002, LP02, IBC08')
  })

  it('keeps the IMDG packing instructions as they are without an IBC instruction', async () => {
    const client = clientWith('imdg_entries', [{ un_number: '1950', sequence_number: 1, packing_instructions: ['P207', 'LP200'], ibc_instructions: null }])
    const { IMDG } = await fetchCompareForUn(client, '1950')
    expect(IMDG[0]!.packingInstructions).toBe('P207, LP200')
  })

  it('adds the IBC instruction to the UN reference too', async () => {
    const client = clientWith('un_entries', [{ un_number: '1203', sequence_number: 1, packing_instructions: ['P001'], ibc_instructions: 'IBC02' }])
    const [un] = await fetchUnReference(client, '1203')
    expect(un!.packingInstructions).toBe('P001, IBC02')
  })
})

describe('"not in the regulation" vs "no data in the source"', () => {
  it('says the BAM feed has no RID hazard identification number, not that RID lacks one', () => {
    const rows = buildComparison({ ADR: e({ kemlerNumber: '33' }), RID: e({}), IMDG: e({}), ICAO: e({}) })
    const kemler = row(rows, 'kemlerNumber')
    expect(kemler.cells.RID).toMatchObject({ applicable: false, gap: 'noSource', raw: null })
    expect(kemler.cells.IMDG).toMatchObject({ applicable: false, gap: 'notInRegulation' })
    expect(kemler.cells.ADR.gap).toBeNull()
  })

  it('points ICAO packing instructions to the passenger and cargo rows', () => {
    const pi = row(buildComparison({ ADR: e({ packingInstructions: 'P001' }), ICAO: e({ packingInstrPassenger: '353' }) }), 'packingInstructions')
    expect(pi.cells.ICAO.gap).toBe('elsewhere')
    expect(pi.seeAlso).toEqual(['piPassenger', 'piCargo'])
  })

  it('declares gaps only for modes outside the field and "elsewhere" only with a target', () => {
    for (const f of COMPARE_FIELDS) {
      for (const [mode, gap] of Object.entries(f.gaps)) {
        expect(f.modes, `${f.field} ${mode}`).not.toContain(mode)
        if (gap === 'elsewhere') expect(f.seeAlso.length, f.field).toBeGreaterThan(0)
      }
    }
  })

  it('shows the ICAO limited quantity but never compares it with ADR/RID/IMDG', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '1 L' }), RID: e({ limitedQty: '1 L' }), IMDG: e({ limitedQty: '1 L' }), ICAO: e({ limitedQty: 'Y341 · max 1 L' }) })
    const lq = row(rows, 'limitedQty')
    expect(lq.status).toBe('same')
    expect(lq.cells.ICAO).toMatchObject({ applicable: true, compared: false, deviates: false, raw: 'Y341 · max 1 L' })
  })

  it('shows ICAO state variations as an air-only row', () => {
    const sv = row(buildComparison({ ICAO: e({ stateVariations: 'US 3' }) }), 'stateVariations')
    expect(sv.status).toBe('onlyOne')
    expect(sv.cells.ADR.gap).toBe('notInRegulation')
  })
})

describe('air transport prohibition', () => {
  it('recognises FORBIDDEN in any case, and nothing else', () => {
    expect(isForbidden('FORBIDDEN')).toBe(true)
    expect(isForbidden(' Forbidden ')).toBe(true)
    expect(isForbidden('See 965')).toBe(false)
    expect(isForbidden(undefined)).toBe(false)
  })

  it('tells "forbidden on all aircraft" from "passenger aircraft only"', () => {
    expect(airProhibition(e({ packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'FORBIDDEN' }))).toBe('all')
    expect(airProhibition(e({ packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'See 965' }))).toBe('passenger')
    expect(airProhibition(e({ packingInstrPassenger: '353', packingInstrCargo: 'FORBIDDEN' }))).toBe('cargo')
    expect(airProhibition(e({ packingInstrPassenger: '353', packingInstrCargo: '364' }))).toBeNull()
    expect(airProhibition(null)).toBeNull()
  })

  it('counts an ICAO prohibition as a critical finding (UN 1005)', () => {
    const rows = buildComparison({
      ADR: e({ hazardClass: '2', classificationCode: '2TC', limitedQty: '0' }),
      RID: e({ hazardClass: '2', classificationCode: '2TC', limitedQty: '0' }),
      IMDG: e({ hazardClass: '2.3', limitedQty: '0' }),
      ICAO: e({ hazardClass: '2.3', packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'FORBIDDEN' }),
    })
    const passenger = row(rows, 'packingInstrPassenger')
    expect(passenger.forbidden).toBe(true)
    expect(passenger.cells.ICAO.forbidden).toBe(true)
    expect(summarizeDeviations(rows).map(r => r.field)).toEqual(['packingInstrPassenger', 'packingInstrCargo'])
  })

  it('flags only the forbidden aircraft type (UN 3480)', () => {
    const rows = buildComparison({ ICAO: e({ packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'See 965' }) })
    expect(row(rows, 'packingInstrCargo').forbidden).toBe(false)
    expect(summarizeDeviations(rows).map(r => r.field)).toEqual(['packingInstrPassenger'])
  })
})

describe('cross-references in quantity columns', () => {
  it('recognises "See SP…" and "siehe SV …" as references, not quantities', () => {
    expect(isCrossReference('See SP277')).toBe(true)
    expect(isCrossReference('siehe SV 251')).toBe(true)
    expect(isCrossReference('See SP 251 in Chapter 3.3')).toBe(true)
    expect(isCrossReference('1 L')).toBe(false)
    expect(isCrossReference('0')).toBe(false)
  })

  it('shows IMDG "See SP277" without calling it a deviation (UN 1950)', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '1 L' }), RID: e({ limitedQty: '1 L' }), IMDG: e({ limitedQty: 'See SP277' }) })
    const lq = row(rows, 'limitedQty')
    expect(lq.status).toBe('same')
    expect(lq.cells.IMDG).toMatchObject({ raw: 'See SP277', crossRef: true, compared: false, deviates: false })
    expect(summarizeDeviations(rows)).toEqual([])
  })

  it('never turns a lone quantity next to a reference into a deviation', () => {
    const lq = row(buildComparison({ ADR: e({ limitedQty: '1 L' }), IMDG: e({ limitedQty: 'See SP277' }) }), 'limitedQty')
    expect(lq.status).toBe('onlyOne')
  })
})

describe('IMDG EmS "!" marker', () => {
  it('reads the BAM "!" as the underlining of the IMDG Code (special case in the EmS Guide)', () => {
    expect(parseEms('S-E!')).toEqual({ code: 'S-E', underlined: true })
    expect(parseEms('F-D')).toEqual({ code: 'F-D', underlined: false })
  })
})

describe('variantLabels', () => {
  it('tells apart ICAO variants with the same specification by their name (UN 3481)', () => {
    const variants = groupVariants([
      e({ sequenceNumber: 1, name: 'Lithium ion batteries contained in equipment', specification: '(including lithium ion polymer batteries)', packingInstrPassenger: '967' }),
      e({ sequenceNumber: 2, name: 'Lithium ion batteries packed with equipment', specification: '(including lithium ion polymer batteries)', packingInstrPassenger: '966' }),
    ], 'ICAO')
    const labels = variantLabels(variants, 'de', 'ICAO', 'VP-Gr.')
    expect(labels[0]).toBe('Lithium ion batteries contained in equipment · (including lithium ion polymer batteries)')
    expect(labels[1]).toBe('Lithium ion batteries packed with equipment · (including lithium ion polymer batteries)')
  })

  it('keeps distinct labels unchanged and falls back to the row number when names match too', () => {
    const distinct = groupVariants([e({ packingGroup: 'I', limitedQty: '0' }), e({ sequenceNumber: 2, packingGroup: 'II', limitedQty: '1 L' })], 'ADR')
    expect(variantLabels(distinct, 'de', 'ADR', 'VP-Gr.')).toEqual(['VP-Gr. I', 'VP-Gr. II'])
    const same = groupVariants([e({ name: 'X', limitedQty: '0' }), e({ sequenceNumber: 2, name: 'X', limitedQty: '1 L' })], 'ADR')
    expect(variantLabels(same, 'de', 'ADR', 'VP-Gr.')).toEqual(['X (#1)', 'X (#2)'])
  })
})
