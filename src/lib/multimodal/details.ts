import type { Entry, Modal } from './types'

/**
 * Table A detail columns on the UN page (persona test 2026-11-23): packaging, tank, carriage,
 * stowage, security and the environmental mark. Display only — the two tank instructions that
 * share one notation ADR↔RID are compared as well (`COMPARE_FIELDS`), everything else is not.
 *
 * Semantics of the BAM-specific columns: "Tabellenbeschreibung ADR", BAM, 17 June 2025
 * (N_SICHERUNG, S_MENGE_SICHERUNG_*, S_KENNZ_N). No text of these codes is in
 * `special_provisions` (it holds column 6 only), so ADR rows link into the ADR text instead.
 */

export type DetailGroupKey = 'packaging' | 'tank' | 'carriage' | 'stowage' | 'security' | 'other'

export type DetailKind = 'codes' | 'text' | 'securityLevel' | 'securityQty' | 'envHazard'

export interface DetailField {
  field: keyof Entry
  /** LABELS key */
  labelKey: string
  group: DetailGroupKey
  kind: DetailKind
  /** modes whose mapper writes this field */
  modes: readonly Modal[]
  /** an empty value is BAM's "no statement possible": shown as "Keine Angabe in der Quelle", never omitted */
  emptyIsNoSource?: boolean
  /** unit of a 1.10.3 threshold */
  unit?: 'l' | 'kg'
}

/** groups in reading order; LABELS key of each heading */
export const DETAIL_GROUPS: readonly { key: DetailGroupKey, labelKey: string }[] = [
  { key: 'packaging', labelKey: 'grpPackaging' },
  { key: 'tank', labelKey: 'grpTank' },
  { key: 'carriage', labelKey: 'grpCarriage' },
  { key: 'stowage', labelKey: 'grpStowage' },
  { key: 'security', labelKey: 'grpSecurity' },
  { key: 'other', labelKey: 'grpOther' },
]

const LAND: readonly Modal[] = ['ADR', 'RID']
const LAND_SEA: readonly Modal[] = ['ADR', 'RID', 'IMDG']

export const DETAIL_FIELDS: readonly DetailField[] = [
  { field: 'packingSv', labelKey: 'packingSv', group: 'packaging', kind: 'codes', modes: LAND_SEA },
  { field: 'coPacking', labelKey: 'coPacking', group: 'packaging', kind: 'codes', modes: LAND },
  { field: 'portableTankInstr', labelKey: 'portableTank', group: 'tank', kind: 'codes', modes: LAND_SEA },
  { field: 'portableTankSv', labelKey: 'portableTankSv', group: 'tank', kind: 'codes', modes: LAND_SEA },
  { field: 'tankCodes', labelKey: 'tankCodes', group: 'tank', kind: 'codes', modes: LAND },
  { field: 'tankSv', labelKey: 'tankSv', group: 'tank', kind: 'codes', modes: LAND },
  { field: 'tankVehicle', labelKey: 'tankVehicle', group: 'tank', kind: 'codes', modes: ['ADR'] },
  { field: 'packageSv', labelKey: 'packageSv', group: 'carriage', kind: 'codes', modes: LAND },
  { field: 'bulkSv', labelKey: 'bulkSv', group: 'carriage', kind: 'codes', modes: LAND },
  { field: 'handlingSv', labelKey: 'handlingSv', group: 'carriage', kind: 'codes', modes: LAND },
  { field: 'operationSv', labelKey: 'operationSv', group: 'carriage', kind: 'codes', modes: ['ADR'] },
  { field: 'expressFreight', labelKey: 'expressFreight', group: 'carriage', kind: 'codes', modes: ['RID'] },
  { field: 'imdgHandling', labelKey: 'imdgHandling', group: 'stowage', kind: 'codes', modes: ['IMDG'] },
  { field: 'segregationGroups', labelKey: 'segregationGroups', group: 'stowage', kind: 'codes', modes: ['IMDG'] },
  { field: 'securityLevel', labelKey: 'securityLevel', group: 'security', kind: 'securityLevel', modes: LAND, emptyIsNoSource: true },
  { field: 'securityQtyTank', labelKey: 'securityQtyTank', group: 'security', kind: 'securityQty', modes: LAND, unit: 'l' },
  { field: 'securityQtyBulk', labelKey: 'securityQtyBulk', group: 'security', kind: 'securityQty', modes: LAND, unit: 'kg' },
  { field: 'securityQtyPackages', labelKey: 'securityQtyPackages', group: 'security', kind: 'securityQty', modes: LAND, unit: 'kg' },
  { field: 'envHazard', labelKey: 'envHazard', group: 'other', kind: 'envHazard', modes: LAND, emptyIsNoSource: true },
  { field: 'compatibilityGroup', labelKey: 'compatibilityGroup', group: 'other', kind: 'text', modes: LAND },
]

// ── ADR text sections (all verified against the BMIMI ADR 2025 file with `findSection`) ──

/** where the ADR defines a code family; first match wins */
const CODE_SECTIONS: readonly [RegExp, string][] = [
  [/^MP\d/, '4.1.10'],
  [/^(?:PP|RR|BB|B|L)\d/, '4.1.4'],
  [/^TP\d/, '4.2.5.3'],
  [/^T\d/, '4.2.5.2.6'],
  [/^BK\d/, '7.3.2'],
  [/^TU\d/, '4.3.5'],
  [/^T[CEATM]\d/, '6.8.4'],
  [/^V\d/, '7.2.4'],
  [/^(?:VC|AP)\d/, '7.3.3'],
  [/^CV\d/, '7.5.11'],
  [/^S\d/, '8.5'],
]

function codeSection(field: keyof Entry, code: string): string | null {
  switch (field) {
    // liquids and solids (L…, S…) in 4.3.4, gases (P…, C…, R…) in 4.3.3
    case 'tankCodes': return /^[LS]/.test(code) ? '4.3.4.1.1' : '4.3.3.1.1'
    case 'tankVehicle': return '9.1.1.2'
    case 'compatibilityGroup': return '7.5.2.2'
    case 'securityLevel': return '1.10.3'
    default: return CODE_SECTIONS.find(([re]) => re.test(code))?.[1] ?? null
  }
}

/** ADR sections a row points into, in code order, each once */
export function bookSections(field: keyof Entry, codes: readonly string[]): string[] {
  const out: string[] = []
  for (const code of codes) {
    const section = codeSection(field, code)
    if (section && !out.includes(section)) out.push(section)
  }
  return out
}

// ── Rows ─────────────────────────────────────────────────────

export interface DetailRow {
  field: keyof Entry
  label: string
  /** separate codes ("T50 (M)" stays one code) — empty for plain text rows */
  codes: string[]
  /** plain text value (explained BAM values, compatibility group) */
  text: string | null
  /** the mode carries the column, the BAM feed makes no statement */
  noSource: boolean
  /** ADR text sections for this row (ADR only) */
  sections: string[]
}

export interface DetailGroup {
  key: DetailGroupKey
  label: string
  rows: DetailRow[]
}

type Label = (key: string) => string

function splitCodes(value: string): string[] {
  return value.split(',').map(code => code.trim()).filter(Boolean)
}

/** "3000" → "> 3000 l"; "0" → any quantity; "a)" moot; "b)" 1.10.3 never applies */
function securityQty(value: string, unit: 'l' | 'kg' | undefined, L: Label): string {
  const v = value.trim()
  if (v === 'a)') return L('secMoot')
  if (v === 'b)') return L('secNever')
  if (v === '0') return L('secAnyQty')
  if (/^\d+$/.test(v)) return `> ${v}${unit ? ` ${unit}` : ''}`
  return v
}

function explained(field: DetailField, value: string, L: Label): string {
  if (field.kind === 'securityLevel') return ({ 0: L('hcdg0'), 1: L('hcdg1'), 2: L('hcdg2') } as Record<string, string>)[value] ?? value
  if (field.kind === 'envHazard') return ({ '+': L('envYes'), '-': L('envNo'), E: L('envMaybe') } as Record<string, string>)[value] ?? value
  if (field.kind === 'securityQty') return securityQty(value, field.unit, L)
  return value
}

/**
 * The detail sections of one mode's entry, without empty groups. A field outside the mode's
 * regulation is left out (the tab shows one regulation); an empty Table A cell is left out
 * (it is not ours to interpret); BAM's explicit "no statement" is shown as such.
 */
export function detailGroups(entry: Entry, mode: Modal, L: Label): DetailGroup[] {
  const level = entry.securityLevel
  const groups: DetailGroup[] = []
  for (const group of DETAIL_GROUPS) {
    const rows: DetailRow[] = []
    for (const field of DETAIL_FIELDS) {
      if (field.group !== group.key || !field.modes.includes(mode)) continue
      // thresholds only mean something for a high-consequence good
      if (field.kind === 'securityQty' && level !== '1' && level !== '2') continue
      const raw = entry[field.field]
      const value = raw == null ? '' : String(raw).trim()
      if (!value) {
        if (field.emptyIsNoSource) rows.push({ field: field.field, label: L(field.labelKey), codes: [], text: null, noSource: true, sections: [] })
        continue
      }
      const codes = field.kind === 'codes' ? splitCodes(value) : []
      const text = field.kind === 'codes' ? null : explained(field, value, L)
      const sections = mode === 'ADR' ? bookSections(field.field, codes.length > 0 ? codes : [value]) : []
      rows.push({ field: field.field, label: L(field.labelKey), codes, text, noSource: false, sections })
    }
    if (rows.length > 0) groups.push({ key: group.key, label: L(group.labelKey), rows })
  }
  return groups
}
