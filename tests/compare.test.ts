// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { buildComparison, COMPARE_FIELDS, normalizeValue, summarizeDeviations } from '$lib/multimodal/compare'
import { fetchCompareForUn } from '$lib/multimodal/mappers'
import { DEMO_DATA, type Entry, type Modal } from '$lib/multimodal/types'

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const row = (rows: ReturnType<typeof buildComparison>, field: keyof Entry) => rows.find(r => r.field === field)!

const DEMO = { ADR: DEMO_DATA.ADR![0]!, RID: DEMO_DATA.RID![0]!, IMDG: DEMO_DATA.IMDG![0]!, ICAO: DEMO_DATA.ICAO![0]! }

describe('normalizeValue', () => {
  it('treats language-only quantity references as equal', () => {
    expect(normalizeValue('quantity', 'siehe SV 251')).toBe(normalizeValue('quantity', 'See SP251'))
    expect(normalizeValue('quantity', '1 L')).toBe(normalizeValue('quantity', '1L'))
  })

  it('compares sets regardless of order, spacing and parentheses', () => {
    expect(normalizeValue('set', 'P001, IBC02')).toBe(normalizeValue('set', 'IBC02,P001'))
    expect(normalizeValue('set', 'P112(b), P112(c)')).toBe(normalizeValue('set', 'P112b, P112c'))
  })

  it('drops parenthesised label markers', () => {
    expect(normalizeValue('labels', '3, 6.1, (13)')).toBe(normalizeValue('labels', '6.1, 3'))
  })

  it('maps whitespace-only values to the empty string', () => {
    expect(normalizeValue('text', '   ')).toBe('')
  })
})

describe('buildComparison', () => {
  it('finds no critical deviation for the UN 1203 demo', () => {
    const rows = buildComparison(DEMO)
    for (const field of ['hazardClass', 'packingGroup', 'limitedQty', 'exceptedQty', 'classificationCode'] as const) {
      expect(row(rows, field).status, field).toBe('same')
    }
    expect(summarizeDeviations(rows)).toEqual([])
  })

  it('compares special provisions between ADR and RID only and shows the others uncompared', () => {
    const sp = row(buildComparison(DEMO), 'specialProvisions')
    expect(sp.status).toBe('differs') // ADR 243, 534, 664 vs RID 243, 534
    expect(sp.critical).toBe(false)
    expect(sp.cells.IMDG).toMatchObject({ raw: '243', compared: false, deviates: false })
    expect(sp.cells.ICAO).toMatchObject({ compared: false, deviates: false })
  })

  it('never flags a field that only one mode defines', () => {
    const rows = buildComparison(DEMO)
    for (const field of ['tunnelCode', 'kemlerNumber', 'ems1', 'packingInstrCargo'] as const) {
      expect(row(rows, field).status, field).toBe('onlyOne')
    }
    expect(row(rows, 'tunnelCode').cells.IMDG).toMatchObject({ applicable: false, raw: null })
  })

  it('reads a class without division as compatible with one division of that class', () => {
    const rows = buildComparison({ ADR: e({ hazardClass: '1' }), RID: e({ hazardClass: '1' }), IMDG: e({ hazardClass: '1.1D' }), ICAO: e({ hazardClass: '1.1D' }) })
    expect(row(rows, 'hazardClass').status).toBe('same')
  })

  it('flags two different divisions', () => {
    const rows = buildComparison({ ADR: e({ hazardClass: '1' }), IMDG: e({ hazardClass: '1.1D' }), ICAO: e({ hazardClass: '1.4S' }) })
    expect(row(rows, 'hazardClass').status).toBe('differs')
  })

  it('derives the ADR/RID division from the classification code (review I1, UN 1950 pattern)', () => {
    const rows = buildComparison({ ADR: e({ hazardClass: '2', classificationCode: '5T' }), ICAO: e({ hazardClass: '2.2' }) })
    expect(row(rows, 'hazardClass').status).toBe('differs')
    const gas = buildComparison({ ADR: e({ hazardClass: '2', classificationCode: '2TF' }), RID: e({ hazardClass: '2', classificationCode: '2TF' }), IMDG: e({ hazardClass: '2.3' }) })
    expect(row(gas, 'hazardClass').status).toBe('same')
    const flammable = buildComparison({ ADR: e({ hazardClass: '2', classificationCode: '5F' }), IMDG: e({ hazardClass: '2.1' }), ICAO: e({ hazardClass: '2.1' }) })
    expect(row(flammable, 'hazardClass').status).toBe('same')
    const explosive = buildComparison({ ADR: e({ hazardClass: '1', classificationCode: '1.4S' }), IMDG: e({ hazardClass: '1.1D' }) })
    expect(row(explosive, 'hazardClass').status).toBe('differs')
  })

  it('never lets a bare class outvote the divisions (review I2)', () => {
    const cls = row(buildComparison({ ADR: e({ hazardClass: '2' }), RID: e({ hazardClass: '2' }), IMDG: e({ hazardClass: '2.1' }), ICAO: e({ hazardClass: '2.2' }) }), 'hazardClass')
    expect(cls.status).toBe('differs')
    expect([cls.cells.ADR.deviates, cls.cells.RID.deviates, cls.cells.IMDG.deviates, cls.cells.ICAO.deviates]).toEqual([true, true, true, true])
  })

  it('keeps a row visible when its only mode is unresolved (review I3)', () => {
    const rows = buildComparison({ ADR: e({ packingGroup: 'II' }), IMDG: null }, { unresolved: ['IMDG'] })
    expect(row(rows, 'ems1').status).toBe('onlyOne')
    expect(row(rows, 'ems1').cells.IMDG.unresolved).toBe(true)
  })

  it('marks the cell that disagrees with the majority (UN 1286 pattern)', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '5 L' }), RID: e({ limitedQty: '5 L' }), IMDG: e({ limitedQty: '1 L' }) })
    const lq = row(rows, 'limitedQty')
    expect(lq.status).toBe('differs')
    expect([lq.cells.ADR.deviates, lq.cells.RID.deviates, lq.cells.IMDG.deviates]).toEqual([false, false, true])
    expect(summarizeDeviations(rows).map(r => r.field)).toEqual(['limitedQty'])
  })

  it('marks every compared cell on a tie', () => {
    const eq = row(buildComparison({ ADR: e({ exceptedQty: 'E0' }), IMDG: e({ exceptedQty: 'E1' }) }), 'exceptedQty')
    expect([eq.cells.ADR.deviates, eq.cells.IMDG.deviates]).toEqual([true, true])
  })

  it('treats language-only differences as the same', () => {
    expect(row(buildComparison({ ADR: e({ limitedQty: 'siehe SV 251' }), IMDG: e({ limitedQty: 'See SP251' }) }), 'limitedQty').status).toBe('same')
  })

  it('compares labels across ADR and RID only, ignoring RID markers', () => {
    const labels = row(buildComparison({ ADR: e({ hazardLabels: '3, 6.1' }), RID: e({ hazardLabels: '3, 6.1, (13)' }), ICAO: e({ hazardLabels: 'Toxic' }) }), 'hazardLabels')
    expect(labels.status).toBe('same')
    expect(labels.cells.ICAO).toMatchObject({ raw: 'Toxic', compared: false })
  })

  it('keeps the raw text for display', () => {
    const pi = row(buildComparison({ ADR: e({ packingInstructions: 'P001, IBC02' }), RID: e({ packingInstructions: 'IBC02, P001' }) }), 'packingInstructions')
    expect(pi.status).toBe('same')
    expect(pi.cells.RID.raw).toBe('IBC02, P001')
  })

  it('reports missing when no mode carries the field and counts blank values as absent', () => {
    const rows = buildComparison({ ADR: e({ marpol: '   ' }) })
    expect(row(rows, 'marpol').status).toBe('missing')
    expect(row(rows, 'limitedQty').status).toBe('missing')
  })

  it('shows unresolved modes as such and leaves them out of the status', () => {
    const rows = buildComparison({ ADR: e({ packingGroup: 'II' }), RID: e({ packingGroup: 'II' }), IMDG: null }, { unresolved: ['IMDG'] })
    const pg = row(rows, 'packingGroup')
    expect(pg.status).toBe('same')
    expect(pg.cells.IMDG).toMatchObject({ unresolved: true, raw: null, deviates: false })
  })

  it('fills the reference cell for shared fields only and never lets it change the status', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '1 L' }), RID: e({ limitedQty: '1 L' }) }, { reference: e({ limitedQty: '5 L', hazardLabels: '6.1' }) })
    expect(row(rows, 'limitedQty').status).toBe('same')
    expect(row(rows, 'limitedQty').reference).toMatchObject({ raw: '5 L', compared: false })
    expect(row(rows, 'hazardLabels').reference).toBeNull()
  })

  it('marks an unmatched reference variant as unresolved', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '1 L' }) }, { referenceUnresolved: true })
    expect(row(rows, 'limitedQty').reference).toMatchObject({ unresolved: true, raw: null })
  })
})

describe('COMPARE_FIELDS', () => {
  it('lists every field the mappers write, for exactly the modes that write it', async () => {
    // every column of every table answers ['x'] → each mapper writes every field it knows
    const everything = new Proxy({}, { get: () => ['x'] })
    const builder = { select: () => builder, eq: () => builder, order: () => Promise.resolve({ data: [everything], error: null }) }
    const client = { from: () => builder } as unknown as SupabaseClient
    const data = await fetchCompareForUn(client, '1203')

    const ignored = new Set(['unNumber', 'sequenceNumber', 'name', 'nameEn', 'nameFr', 'specification', 'specificationEn', 'specificationFr', 'remark'])
    const written: Record<string, Modal[]> = {}
    for (const [mode, entries] of Object.entries(data) as [Modal, Entry[]][]) {
      for (const [field, value] of Object.entries(entries[0] ?? {})) {
        if (ignored.has(field) || value === undefined) continue
        ;(written[field] ??= []).push(mode)
      }
    }
    const registry = Object.fromEntries(COMPARE_FIELDS.map(f => [f.field, [...f.modes]]))
    expect(registry).toEqual(written)
  })

  it('only compares modes that carry the field', () => {
    for (const f of COMPARE_FIELDS) {
      for (const m of f.compareModes) expect(f.modes, f.field).toContain(m)
    }
  })
})
