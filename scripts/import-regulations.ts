/**
 * Dangerous Goods Platform — Regulation Import Script
 *
 * Reads BAM GEFAHRGUT CSV files (tab-separated, ISO-8859-1) and upserts
 * into Supabase. Requires SUPABASE_SERVICE_ROLE_KEY in .env (bypasses RLS).
 *
 * Usage:
 *   pnpm tsx scripts/import-regulations.ts           # all modes
 *   pnpm tsx scripts/import-regulations.ts --mode adr
 *   pnpm tsx scripts/import-regulations.ts --mode special_provisions
 */

import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CSVBASE = join(import.meta.dirname, '..', 'csvbase')

const CSV_PATHS = {
  adr:  join(CSVBASE, 'dgg-daten-adr-un',  'Straßenverkehr (ADR)',    'ADR25_csv.txt'),
  rid:  join(CSVBASE, 'dgg-daten-rid-un',  'Eisenbahnverkehr (RID)',  'RID25_csv.txt'),
  icao: join(CSVBASE, 'dgg-daten-icao-un', 'Luftverkehr (ICAO)',      'ICAO25_csv.txt'),
  imdg: join(CSVBASE, 'dgg-daten-imdg-un', 'Seeverkehr (IMDG)',       'Amdt. 42-24', 'IMDG25_csv.txt'),
  un:   join(CSVBASE, 'dgg-daten-un-un',   'UN Recommendations',      'UN23_csv.txt'),
}

const SP_PATHS = {
  ADR:  join(CSVBASE, 'dgg-daten-adr-un',  'Straßenverkehr (ADR)',    'Sondervorschriften'),
  RID:  join(CSVBASE, 'dgg-daten-rid-un',  'Eisenbahnverkehr (RID)',  'Sondervorschriften'),
  ICAO: join(CSVBASE, 'dgg-daten-icao-un', 'Luftverkehr (ICAO)',      'Sondervorschriften'),
  IMDG: join(CSVBASE, 'dgg-daten-imdg-un', 'Seeverkehr (IMDG)',       'Amdt. 42-24', 'Sondervorschriften'),
  UN:   join(CSVBASE, 'dgg-daten-un-un',   'UN Recommendations',      'Sondervorschriften'),
}

const BATCH_SIZE = 500

// ---------------------------------------------------------------------------
// TSV parsing
// ---------------------------------------------------------------------------

function readTsv(filePath: string): Record<string, string>[] {
  const raw = readFileSync(filePath)
  const text = new TextDecoder('iso-8859-1').decode(raw)
  const lines = text.split('\r\n').filter(Boolean)
  const cols = lines[0].split('\t')
  return lines.slice(1).map(line => {
    const vals = line.split('\t')
    return Object.fromEntries(cols.map((c, i) => [c.trim(), (vals[i] ?? '').trim()]))
  })
}

function collapse(row: Record<string, string>, ...keys: string[]): string[] {
  return keys.map(k => row[k]).filter(v => v && v !== '')
}

function bool(val: string): boolean {
  return val === '1'
}

function int(val: string): number | null {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

// ---------------------------------------------------------------------------
// Upsert helper
// ---------------------------------------------------------------------------

async function upsert(table: string, rows: object[], conflict: string) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: conflict, ignoreDuplicates: false })
    if (error) throw new Error(`${table} batch ${i}: ${error.message}`)
    process.stdout.write(`\r  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`)
  }
  console.log()
}

// ---------------------------------------------------------------------------
// ADR
// ---------------------------------------------------------------------------

async function importAdr() {
  console.log('Importing ADR...')
  const rows = readTsv(CSV_PATHS.adr)
  const mapped = rows.map(r => ({
    un_number:               r['S_UNNR'],
    sequence_number:         int(r['N_LFDNR']),
    name_prefix:             r['S_VORSILBE']       || null,
    name:                    r['S_NAME']           || null,
    name_en:                 r['S_NAME_E']         || null,
    name_fr:                 r['S_NAME_FR']        || null,
    specification:           r['S_SPEZIFIKATION']  || null,
    specification_en:        r['S_SPEZIFIKATION_E']  || null,
    specification_fr:        r['S_SPEZIFIKATION_FR'] || null,
    hazard_class:            r['S_KLASSE']         || null,
    classification_code:     r['S_KLASSIFIZIERUNGSCODE'] || null,
    packing_group:           r['S_VP_GRUPPE']      || null,
    hazard_labels:           collapse(r, 'S_KENN1', 'S_KENN2', 'S_KENN3', 'S_KENN4'),
    // ADR inconsistently names last two SV columns SV_10, SV_11 (no S_ prefix)
    special_provision_codes: collapse(r, 'S_SV1','S_SV2','S_SV3','S_SV4','S_SV5','S_SV6','S_SV7','S_SV8','S_SV9','SV_10','SV_11'),
    limited_qty:             r['S_BEGRENZTE_MENGEN'] || null,
    excepted_qty:            r['S_FREIGEST_MENGEN']  || null,
    packing_instructions:    collapse(r, 'S_VERPACKUNGSANW1','S_VERPACKUNGSANW2','S_VERPACKUNGSANW3','S_VERPACKUNGSANW4','S_VERPACKUNGSANW5','S_VERPACKUNGSANW6','S_VERPACKUNGSANW7','S_VERPACKUNGSANW8','S_VERPACKUNGSANW9'),
    packing_sv_codes:        collapse(r, 'S_SV_VP1','S_SV_VP2','S_SV_VP3','S_SV_VP4','S_SV_VP5'),
    co_packing:              collapse(r, 'S_ZUSAMMENPACKUNG1','S_ZUSAMMENPACKUNG2'),
    un_tank_codes:           collapse(r, 'S_UN_TANK1','S_UN_TANK2','S_UN_TANK3','S_UN_TANK4'),
    un_tank_sv_codes:        collapse(r, 'S_SV_UNTANK1','S_SV_UNTANK2','S_SV_UNTANK3','S_SV_UNTANK4'),
    tank_codes:              collapse(r, 'S_TANK_CODE1','S_TANK_CODE2'),
    tank_sv_codes:           collapse(r, 'S_SV_TANK1','S_SV_TANK2','S_SV_TANK3','S_SV_TANK4','S_SV_TANK5','S_SV_TANK6','S_SV_TANK7','S_SV_TANK8'),
    tank_vehicle:            r['S_TANKFAHRZEUG']   || null,
    transport_category:      r['S_BEFOERDERUNGSKATEGORIE'] || null,
    multiplier:              int(r['N_MULTIPLIKATOR']),
    tunnel_code:             r['S_TUNNEL_CODE']    || null,
    package_sv_codes:        collapse(r, 'S_SV_VERSANDSTUECKE1','S_SV_VERSANDSTUECKE2','S_SV_VERSANDSTUECKE3'),
    bulk_sv_codes:           collapse(r, 'S_SV_LOSE_SCHUETTUNG1','S_SV_LOSE_SCHUETTUNG2','S_SV_LOSE_SCHUETTUNG3','S_SV_LOSE_SCHUETTUNG4','S_SV_LOSE_SCHUETTUNG5'),
    handling_sv_codes:       collapse(r, 'S_SV_HANDHABUNG1','S_SV_HANDHABUNG2','S_SV_HANDHABUNG3','S_SV_HANDHABUNG4','S_SV_HANDHABUNG5'),
    operation_sv_codes:      collapse(r, 'S_BETRIEB1','S_BETRIEB2','S_BETRIEB3','S_BETRIEB4'),
    kemler_number:           r['S_GEFAHRNR']       || null,
    remark:                  r['S_BEMERKUNG']      || null,
    compatibility_group:     r['S_VERTRAEGL_GR']   || null,
    prohibited:              bool(r['N_VERBOT']),
    security_level:          int(r['N_SICHERUNG']),
    security_qty_tank:       r['S_MENGE_SICHERUNG_TANK'] || null,
    security_qty_bulk:       r['S_MENGE_SICHERUNG_LS']   || null,
    security_qty_packages:   r['S_MENGE_SICHERUNG_VP']   || null,
    n_mark:                  r['S_KENNZ_N']        || null,
  }))
  await upsert('adr_entries', mapped, 'un_number,sequence_number')
}

// ---------------------------------------------------------------------------
// RID
// ---------------------------------------------------------------------------

async function importRid() {
  console.log('Importing RID...')
  const rows = readTsv(CSV_PATHS.rid)
  const mapped = rows.map(r => ({
    un_number:               r['S_UNNR'],
    sequence_number:         int(r['N_LFDNR']),
    name_prefix:             r['S_VORSILBE']       || null,
    name:                    r['S_NAME']           || null,
    name_en:                 r['S_NAME_E']         || null,
    name_fr:                 r['S_NAME_FR']        || null,
    specification:           r['S_SPEZIFIKATION']  || null,
    specification_en:        r['S_SPEZIFIKATION_E']  || null,
    specification_fr:        r['S_SPEZIFIKATION_FR'] || null,
    hazard_class:            r['S_KLASSE']         || null,
    classification_code:     r['S_KLASSIFIZIERUNGSCODE'] || null,
    packing_group:           r['S_VP_GRUPPE']      || null,
    hazard_labels:           collapse(r, 'S_KENN1','S_KENN2','S_KENN3','S_KENN4'),
    special_provision_codes: collapse(r, 'S_SV1','S_SV2','S_SV3','S_SV4','S_SV5','S_SV6','S_SV7','S_SV8','S_SV9','S_SV10','S_SV11'),
    limited_qty:             r['S_BEGRENZTE_MENGEN'] || null,
    excepted_qty:            r['S_FREIGEST_MENGEN']  || null,
    packing_instructions:    collapse(r, 'S_VERPACKUNGSANW1','S_VERPACKUNGSANW2','S_VERPACKUNGSANW3','S_VERPACKUNGSANW4','S_VERPACKUNGSANW5','S_VERPACKUNGSANW6','S_VERPACKUNGSANW7','S_VERPACKUNGSANW8','S_VERPACKUNGSANW9'),
    packing_sv_codes:        collapse(r, 'S_SV_VP1','S_SV_VP2','S_SV_VP3','S_SV_VP4','S_SV_VP5'),
    co_packing:              collapse(r, 'S_ZUSAMMENPACKUNG1','S_ZUSAMMENPACKUNG2'),
    un_tank_codes:           collapse(r, 'S_UN_TANK1','S_UN_TANK2','S_UN_TANK3','S_UN_TANK4'),
    un_tank_sv_codes:        collapse(r, 'S_SV_UNTANK1','S_SV_UNTANK2','S_SV_UNTANK3','S_SV_UNTANK4'),
    tank_codes:              collapse(r, 'S_TANK_CODE1','S_TANK_CODE2'),
    tank_sv_codes:           collapse(r, 'S_SV_TANK1','S_SV_TANK2','S_SV_TANK3','S_SV_TANK4','S_SV_TANK5','S_SV_TANK6','S_SV_TANK7','S_SV_TANK8','S_SV_TANK9','S_SV_TANK10','S_SV_TANK11','S_SV_TANK12'),
    tank_vehicle:            r['S_TANKFAHRZEUG']   || null,
    transport_category:      r['S_BEFOERDERUNGSKATEGORIE'] || null,
    multiplier:              int(r['N_MULTIPLIKATOR']),
    express_freight:         collapse(r, 'S_EXPRESSGUT1','S_EXPRESSGUT2'),
    package_sv_codes:        collapse(r, 'S_SV_VERSANDSTUECKE1','S_SV_VERSANDSTUECKE2','S_SV_VERSANDSTUECKE3'),
    bulk_sv_codes:           collapse(r, 'S_SV_LOSE_SCHUETTUNG1','S_SV_LOSE_SCHUETTUNG2','S_SV_LOSE_SCHUETTUNG3','S_SV_LOSE_SCHUETTUNG4','S_SV_LOSE_SCHUETTUNG5'),
    handling_sv_codes:       collapse(r, 'S_SV_HANDHABUNG1','S_SV_HANDHABUNG2','S_SV_HANDHABUNG3','S_SV_HANDHABUNG4','S_SV_HANDHABUNG5','S_SV_HANDHABUNG6'),
    operation_sv_codes:      null,
    remark:                  r['S_BEMERKUNG']      || null,
    compatibility_group:     r['S_VERTRAEGL_GR']   || null,
    prohibited:              bool(r['N_VERBOT']),
    security_level:          int(r['N_SICHERUNG']),
    security_qty_tank:       r['S_MENGE_SICHERUNG_TANK'] || null,
    security_qty_bulk:       r['S_MENGE_SICHERUNG_LS']   || null,
    security_qty_packages:   r['S_MENGE_SICHERUNG_VP']   || null,
    n_mark:                  r['S_KENNZ_N']        || null,
  }))
  await upsert('rid_entries', mapped, 'un_number,sequence_number')
}

// ---------------------------------------------------------------------------
// ICAO
// ---------------------------------------------------------------------------

async function importIcao() {
  console.log('Importing ICAO...')
  const rows = readTsv(CSV_PATHS.icao)
  const mapped = rows.map(r => ({
    un_number:                 r['S_UNNR'],
    sequence_number:           int(r['N_LFDNR']),
    name:                      r['S_NAME']          || null,
    specification:             r['S_SPEZIFIKATION'] || null,
    hazard_class:              r['S_KLASSE']        || null,
    subsidiary_risks:          collapse(r, 'S_ZUGEFAHR1','S_ZUGEFAHR2'),
    packing_group:             r['S_VP_GRUPPE']     || null,
    hazard_labels:             collapse(r, 'S_KENN1','S_KENN2','S_KENN3'),
    special_provision_codes:   collapse(r, 'S_SV1','S_SV2','S_SV3','S_SV4','S_SV5','S_SV6','S_SV7','S_SV8'),
    excepted_qty:              r['S_FREIGEST_MENGEN'] || null,
    packing_instr_passenger:   r['S_PI_PAS']        || null,
    packing_instr_passenger_y: r['S_PI_PAS_Y']      || null,
    max_net_passenger:         r['S_MAX_NET_PAS']   || null,
    max_net_passenger_y:       r['S_MAX_NET_PAS_Y'] || null,
    packing_instr_cargo:       r['S_PI_FRA']        || null,
    max_net_cargo:             r['S_MAX_NET_FRA']   || null,
    state_variations:          collapse(r, 'S_STATE_VAR1','S_STATE_VAR2','S_STATE_VAR3','S_STATE_VAR4','S_STATE_VAR5','S_STATE_VAR6','S_STATE_VAR7'),
    supplementary_code:        r['S_ERG_CODE']      || null,
    attachment:                r['S_ATTACHMENT']    || null,
    remark:                    r['S_BEMERKUNG']     || null,
    prohibited:                bool(r['N_VERBOT']),
  }))
  await upsert('icao_entries', mapped, 'un_number,sequence_number')
}

// ---------------------------------------------------------------------------
// IMDG
// ---------------------------------------------------------------------------

async function importImdg() {
  console.log('Importing IMDG...')
  const rows = readTsv(CSV_PATHS.imdg)
  const mapped = rows.map(r => ({
    un_number:               r['S_UNNR'],
    sequence_number:         int(r['N_LFDNR']),
    name_prefix:             r['S_VORSILBE']      || null,
    name:                    r['S_NAME']          || null,
    name_en:                 r['S_NAME_E']        || null,
    specification:           r['S_SPEZIFIKATION'] || null,
    specification_en:        r['S_SPEZIFIKATION_E'] || null,
    hazard_class:            r['S_KLASSE']        || null,
    subsidiary_risks:        collapse(r, 'S_ZUGEFAHR1','S_ZUGEFAHR2'),
    marpol:                  r['S_MARPOL']        || null,
    packing_group:           r['S_VP_GRUPPE']     || null,
    special_provision_codes: collapse(r, 'S_SV1','S_SV2','S_SV3','S_SV4','S_SV5','S_SV6','S_SV7','S_SV8','S_SV9','S_SV10'),
    limited_qty:             r['S_BEGRENZTE_MENGEN'] || null,
    excepted_qty:            r['S_FREIGEST_MENGEN']  || null,
    packing_instructions:    collapse(r, 'S_VERPACKUNGSANW1','S_VERPACKUNGSANW2','S_VERPACKUNGSANW3','S_VERPACKUNGSANW4','S_VERPACKUNGSANW5','S_VERPACKUNGSANW6','S_VERPACKUNGSANW7','S_VERPACKUNGSANW8','S_VERPACKUNGSANW9'),
    packing_sv_codes:        collapse(r, 'S_SV_VP1','S_SV_VP2','S_SV_VP3','S_SV_VP4','S_SV_VP5'),
    ibc_instructions:        r['S_IBC_ANW1']      || null,
    ibc_sv_codes:            collapse(r, 'S_SV_IBC1','S_SV_IBC2','S_SV_IBC3'),
    un_tank_codes:           collapse(r, 'S_UN_TANK1','S_UN_TANK2','S_UN_TANK3','S_UN_TANK4'),
    tank_sv_codes:           collapse(r, 'S_SV_TANK1','S_SV_TANK2','S_SV_TANK3','S_SV_TANK4'),
    ems_fire:                r['S_EMS1']          || null,
    ems_spill:               r['S_EMS2']          || null,
    stowage_category:        r['S_STAUKATEGORIE'] || null,
    stowage_codes:           collapse(r, 'S_STAUUNG1','S_STAUUNG2','S_STAUUNG3'),
    handling_codes:          collapse(r, 'S_HANDHABUNG1','S_HANDHABUNG2'),
    segregation_codes:       collapse(r, 'S_TRENNUNG1','S_TRENNUNG2','S_TRENNUNG3','S_TRENNUNG4','S_TRENNUNG5','S_TRENNUNG6','S_TRENNUNG7','S_TRENNUNG8','S_TRENNUNG9','S_TRENNUNG10'),
    segregation_groups:      collapse(r, 'S_TRENNGRUPPE1','S_TRENNGRUPPE2','S_TRENNGRUPPE3'),
    remark:                  r['S_BEMERKUNG']     || null,
    prohibited:              bool(r['N_VERBOT']),
  }))
  await upsert('imdg_entries', mapped, 'un_number,sequence_number')
}

// ---------------------------------------------------------------------------
// UN Recommendations
// ---------------------------------------------------------------------------

async function importUn() {
  console.log('Importing UN...')
  const rows = readTsv(CSV_PATHS.un)
  const mapped = rows.map(r => ({
    un_number:               r['S_UNNR'],
    sequence_number:         int(r['N_LFDNR']),
    name:                    r['S_NAME']          || null,
    specification:           r['S_SPEZIFIKATION'] || null,
    hazard_class:            r['S_KLASSE']        || null,
    subsidiary_risks:        collapse(r, 'S_KENN2','S_KENN3'),
    packing_group:           r['S_VP_GRUPPE']     || null,
    special_provision_codes: collapse(r, 'S_SV1','S_SV2','S_SV3','S_SV4','S_SV5','S_SV6','S_SV7','S_SV8','S_SV9','S_SV10'),
    limited_qty:             r['S_BEGRENZTE_MENGEN'] || null,
    excepted_qty:            r['S_FREIGEST_MENGEN']  || null,
    packing_instructions:    collapse(r, 'S_VP_ANWEISUNG1','S_VP_ANWEISUNG2','S_VP_ANWEISUNG3','S_VP_ANWEISUNG4','S_VP_ANWEISUNG5','S_VP_ANWEISUNG6','S_VP_ANWEISUNG7','S_VP_ANWEISUNG8','S_VP_ANWEISUNG9'),
    packing_sv_codes:        collapse(r, 'S_SV_VP1 ','S_SV_VP2','S_SV_VP3','S_SV_VP4','S_SV_VP5'),
    ibc_instructions:        r['S_IBC_ANWEISUNG'] || null,
    un_tank_codes:           collapse(r, 'S_UN_TANK'),
    transport_category:      null,
    remark:                  r['S_BEMERKUNG']     || null,
    prohibited:              false,
  }))
  await upsert('un_entries', mapped, 'un_number,sequence_number')
}

// ---------------------------------------------------------------------------
// Special provisions
// ---------------------------------------------------------------------------

async function importSpecialProvisions() {
  console.log('Importing special provisions...')

  // File names: D_ADR_103.TXT → lang=D (de), mode=ADR, code=103
  // Language prefixes: D = German, E = English, F = French
  const modePattern = /^([DEF])_([A-Z]+)_(\w+)\.TXT$/i
  const LANG_COLUMN: Record<string, 'text_de' | 'text_en' | 'text_fr'> = {
    D: 'text_de',
    E: 'text_en',
    F: 'text_fr',
  }

  type SpRow = { mode: string; code: string; text_de: string | null; text_en: string | null; text_fr: string | null }
  const rowsByKey = new Map<string, SpRow>()

  for (const [mode, dir] of Object.entries(SP_PATHS)) {
    let files: string[]
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.TXT'))
    } catch {
      console.warn(`  Skipping ${mode}: directory not found: ${dir}`)
      continue
    }

    for (const file of files) {
      const match = basename(file).match(modePattern)
      if (!match) continue
      const column = LANG_COLUMN[match[1].toUpperCase()]
      const code = match[3]
      const raw = readFileSync(join(dir, file))
      const text = new TextDecoder('iso-8859-1').decode(raw).trim()

      const key = `${mode}:${code}`
      let row = rowsByKey.get(key)
      if (!row) {
        row = { mode, code, text_de: null, text_en: null, text_fr: null }
        rowsByKey.set(key, row)
      }
      row[column] = text
    }
  }

  const allRows = [...rowsByKey.values()]
  console.log(`  Found ${allRows.length} special provisions (from ${Object.keys(SP_PATHS).length} modes)`)
  await upsert('special_provisions', allRows, 'mode,code')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const modeArg = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : null

const importers: Record<string, () => Promise<void>> = {
  adr:                importAdr,
  rid:                importRid,
  icao:               importIcao,
  imdg:               importImdg,
  un:                 importUn,
  special_provisions: importSpecialProvisions,
}

async function main() {
  const toRun = modeArg ? [modeArg] : Object.keys(importers)

  for (const mode of toRun) {
    if (!importers[mode]) {
      console.error(`Unknown mode: ${mode}. Valid options: ${Object.keys(importers).join(', ')}`)
      process.exit(1)
    }
    const start = Date.now()
    await importers[mode]()
    console.log(`  Done in ${((Date.now() - start) / 1000).toFixed(1)}s`)
  }

  console.log('\nImport complete.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
