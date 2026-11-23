/**
 * Demo data generator — writes src/lib/multimodal/demoData.generated.ts
 *
 * The landing page and locked accounts show UN 1203 (sequence 1) as a demo. Safety advisers read
 * it, so it must be exactly what an activated account sees: this script reads the live BAM tables
 * through the SAME mapper the app uses (`fetchCompareForUn`), plus the special-provision texts,
 * and writes them as a generated module. Never edit the output by hand; run this instead.
 *
 * A dev tool like import-regulations.ts: it reads with SUPABASE_SERVICE_ROLE_KEY from .env
 * (read-only queries; RLS would hide the rows from the publishable key without a session).
 * The app itself never uses that key.
 *
 * Usage: pnpm generate:demo
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchCompareForUn } from '../src/lib/multimodal/mappers'
import type { Entry, Modal, SvText } from '../src/lib/multimodal/types'

export const DEMO_UN = '1203'
export const DEMO_SEQUENCE = 1
const SV_MODES = ['ADR', 'RID', 'IMDG', 'ICAO'] as const satisfies readonly Modal[]
export const OUTPUT = join(import.meta.dirname, '..', 'src', 'lib', 'multimodal', 'demoData.generated.ts')

export interface Demo {
  data: Record<Modal, Entry[]>
  svs: Record<string, SvText>
}

/** UN 1203 seq. 1 per mode, mapped like the app maps it; throws instead of writing a partial demo */
export async function buildDemo(supabase: SupabaseClient): Promise<Demo> {
  const all = await fetchCompareForUn(supabase, DEMO_UN)
  const data = { ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] } as Record<Modal, Entry[]>
  for (const mode of SV_MODES) {
    const row = all[mode].find(entry => entry.sequenceNumber === DEMO_SEQUENCE)
    if (!row) throw new Error(`UN ${DEMO_UN} sequence ${DEMO_SEQUENCE} missing in ${mode}`)
    data[mode] = [row]
  }
  // BAM ships no ADN data; the demo must show what the app shows
  data.ADN = []

  const svs: Record<string, SvText> = {}
  for (const mode of SV_MODES) {
    const codes = (data[mode][0]!.specialProvisions ?? '').split(',').map(c => c.trim()).filter(Boolean)
    if (codes.length === 0) continue
    const { data: rows, error } = await supabase
      .from('special_provisions')
      .select('code, text_de, text_en, text_fr')
      .eq('mode', mode)
      .in('code', codes)
    if (error) throw error
    const byCode = new Map((rows ?? []).map(r => [String(r.code), r]))
    for (const code of codes) {
      const r = byCode.get(code)
      if (!r) continue
      svs[`${mode}:${code}`] = { textDe: r.text_de ?? null, textEn: r.text_en ?? null, textFr: r.text_fr ?? null }
    }
  }
  return { data, svs }
}

/** drops undefined fields (JSON does) so the module lists only what the mapper wrote */
function literal(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function renderDemoModule(demo: Demo, generatedOn: string): string {
  return [
    '// GENERATED FILE — DO NOT EDIT.',
    `// Written by scripts/generate-demo-data.ts (\`pnpm generate:demo\`) on ${generatedOn}.`,
    `// UN ${DEMO_UN}, sequence ${DEMO_SEQUENCE}, read from the live BAM tables through the app's own mapper`,
    '// (fetchCompareForUn) plus the special-provision texts. Rerun after every import or mapper change.',
    '// Source: BAM GEFAHRGUT database, dl-de/by-2-0.',
    '',
    'import type { Entry, SvText } from \'./types\'',
    '',
    `export const DEMO_DATA: Record<string, Entry[]> = ${literal(demo.data)}`,
    '',
    `export const DEMO_SVS: Record<string, SvText> = ${literal(demo.svs)}`,
    '',
  ].join('\n')
}

async function main(): Promise<void> {
  await import('dotenv/config')
  const url = process.env.PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const demo = await buildDemo(supabase)
  writeFileSync(OUTPUT, renderDemoModule(demo, new Date().toISOString().slice(0, 10)))
  const counts = SV_MODES.map(m => `${m} ${demo.data[m].length}`).join(', ')
  console.log(`Wrote ${OUTPUT} (${counts}, ${Object.keys(demo.svs).length} SV texts)`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
