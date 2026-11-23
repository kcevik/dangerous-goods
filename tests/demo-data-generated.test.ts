// @vitest-environment node
import { readFileSync } from 'node:fs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { buildDemo, OUTPUT, renderDemoModule } from '../scripts/generate-demo-data'
import * as generated from '$lib/multimodal/demoData.generated'
import { DATA_MODES, DEMO_DATA, DEMO_SVS, MODALS } from '$lib/multimodal/types'

const source = readFileSync(OUTPUT, 'utf8')

describe('demoData.generated.ts (committed output of pnpm generate:demo)', () => {
  it('says it is generated and names its generator', () => {
    expect(source.split('\n')[0]).toBe('// GENERATED FILE — DO NOT EDIT.')
    expect(source).toContain('scripts/generate-demo-data.ts')
    expect(source).toContain('dl-de/by-2-0')
  })

  it('is what types.ts exports — there is no second, hand-written copy', () => {
    expect(DEMO_DATA).toBe(generated.DEMO_DATA)
    expect(DEMO_SVS).toBe(generated.DEMO_SVS)
    expect(readFileSync('src/lib/multimodal/types.ts', 'utf8')).not.toMatch(/export const DEMO_(DATA|SVS)/)
  })

  it('holds exactly UN 1203 sequence 1 for every BAM mode and an empty ADN', () => {
    expect(Object.keys(DEMO_DATA).sort()).toEqual([...MODALS].sort())
    expect(DEMO_DATA.ADN).toEqual([])
    for (const mode of DATA_MODES) {
      expect(DEMO_DATA[mode], mode).toHaveLength(1)
      expect(DEMO_DATA[mode]![0], mode).toMatchObject({ unNumber: '1203', sequenceNumber: 1 })
    }
  })

  it('pins the key facts an officer would check', () => {
    expect(DEMO_DATA.ADR![0]).toMatchObject({
      hazardClass: '3', classificationCode: 'F1', packingGroup: 'II', limitedQty: '1 L', exceptedQty: 'E2',
      transportCategory: '2', multiplier: '3', kemlerNumber: '33', tunnelCode: 'D/E',
      tankCodes: 'LGBF', portableTankInstr: 'T4', securityLevel: '1', securityQtyTank: '3000', envHazard: '+',
    })
    expect(DEMO_DATA.RID![0]).toMatchObject({ tankCodes: 'LGBF', tankSv: 'TU9' })
    // IMDG column 10 (IBC) joins the packing instructions like ADR/RID column 8
    expect(DEMO_DATA.IMDG![0]!.packingInstructions).toContain('IBC02')
    // ICAO limited quantity is the Y instruction with its max net quantity
    expect(DEMO_DATA.ICAO![0]!.limitedQty).toBe('Y341 · max 1 L')
  })

  it('carries a text for every special provision the demo lists, keyed MODE:code', () => {
    for (const mode of DATA_MODES) {
      const codes = (DEMO_DATA[mode]![0]!.specialProvisions ?? '').split(',').map(c => c.trim()).filter(Boolean)
      for (const code of codes) expect(DEMO_SVS[`${mode}:${code}`], `${mode}:${code}`).toBeDefined()
    }
    expect(Object.keys(DEMO_SVS).every(k => /^(ADR|RID|IMDG|ICAO):\S+$/.test(k))).toBe(true)
  })
})

/** from(table) → select → eq → (order | in); one row per entry table, SV rows by code */
function fakeClient(rows: Record<string, Record<string, unknown>[]>) {
  const from = (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      order: () => Promise.resolve({ data: rows[table] ?? [], error: null }),
      in: (_column: string, codes: string[]) =>
        Promise.resolve({ data: (rows[table] ?? []).filter(r => codes.includes(String(r.code))), error: null }),
    }
    return query
  }
  return { from } as unknown as SupabaseClient
}

const row = (extra: Record<string, unknown>) => ({ un_number: '1203', sequence_number: 1, hazard_class: '3', ...extra })

describe('generate-demo-data', () => {
  it('maps the rows through the app mapper and picks up their SV texts', async () => {
    const client = fakeClient({
      adr_entries: [row({ tank_codes: ['LGBF'], special_provision_codes: ['243'] }), row({ sequence_number: 2 })],
      rid_entries: [row({})],
      imdg_entries: [row({ ibc_instructions: 'IBC02', packing_instructions: ['P001'] })],
      icao_entries: [row({ packing_instr_passenger_y: 'Y341', max_net_passenger_y: '1 L' })],
      special_provisions: [{ code: '243', text_de: 'Benzin …', text_en: null, text_fr: null }],
    })
    const demo = await buildDemo(client)
    expect(demo.data.ADR).toHaveLength(1)
    expect(demo.data.ADR[0]).toMatchObject({ sequenceNumber: 1, tankCodes: 'LGBF' })
    expect(demo.data.IMDG[0]!.packingInstructions).toBe('P001, IBC02')
    expect(demo.data.ICAO[0]!.limitedQty).toBe('Y341 · max 1 L')
    expect(demo.data.ADN).toEqual([])
    expect(demo.svs).toEqual({ 'ADR:243': { textDe: 'Benzin …', textEn: null, textFr: null } })
  })

  it('refuses to write a partial demo', async () => {
    const client = fakeClient({ adr_entries: [row({})], rid_entries: [], imdg_entries: [row({})], icao_entries: [row({})] })
    await expect(buildDemo(client)).rejects.toThrow(/missing in RID/)
  })

  it('renders a module that lists only the fields the mapper wrote', () => {
    const module = renderDemoModule({
      data: { ADR: [{ unNumber: '1203', sequenceNumber: 1, name: undefined, hazardClass: '3' }], RID: [], IMDG: [], ICAO: [], ADN: [] },
      svs: {},
    }, '2026-11-23')
    expect(module).toContain('on 2026-11-23')
    expect(module).not.toContain('"name"')
    expect(module).toContain('export const DEMO_DATA: Record<string, Entry[]> = {')
    expect(module).toContain('export const DEMO_SVS: Record<string, SvText> = {}')
  })
})
