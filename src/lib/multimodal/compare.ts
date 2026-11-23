import { type Entry, type Modal, MODALS } from './types'

/**
 * Cross-mode comparison of one UN number (F-10).
 * Spec: docs/superpowers/specs/2026-09-28-regulatory-comparison-design.md, incl. "Revision 2026-11-08".
 * Absence is never a deviation, and only modes that share a notation are compared.
 */

export type CompareKind = 'text' | 'quantity' | 'set' | 'labels' | 'class'

/**
 * Why a mode outside a field's `modes` shows no value. "Absent" must never be read as a statement
 * about the regulation when it is really a statement about the BAM feed:
 * - `notInRegulation`: the regulation has no such column (default)
 * - `noSource`: the regulation has it, the BAM feed carries no column for it
 * - `elsewhere`: the regulation has it, shown in other rows (`seeAlso`)
 */
export type CellGap = 'notInRegulation' | 'noSource' | 'elsewhere'

export interface CompareField {
  field: keyof Entry
  /** LABELS key */
  labelKey: string
  /** modes whose mapper writes this field */
  modes: readonly Modal[]
  /** modes whose values share one notation and are compared; the others are shown only */
  compareModes: readonly Modal[]
  /** the UN Model Regulations reference column shows this field */
  reference: boolean
  /** a disagreement here can give a planner a genuinely wrong answer (spec §3) */
  critical: boolean
  kind: CompareKind
  /** modes outside `modes` whose gap is not `notInRegulation` */
  gaps: Partial<Record<Modal, Exclude<CellGap, 'notInRegulation'>>>
  /** LABELS keys of the rows that carry an `elsewhere` mode's value */
  seeAlso: readonly string[]
  /** ICAO packing instructions: "FORBIDDEN" means carriage on that aircraft type is prohibited */
  prohibition: boolean
}

const ALL: readonly Modal[] = ['ADR', 'RID', 'IMDG', 'ICAO']
const LAND: readonly Modal[] = ['ADR', 'RID']
const ROAD_RAIL_SEA: readonly Modal[] = ['ADR', 'RID', 'IMDG']
const ROAD: readonly Modal[] = ['ADR']
const SEA: readonly Modal[] = ['IMDG']
const AIR: readonly Modal[] = ['ICAO']

interface FieldOptions {
  compareModes?: readonly Modal[]
  reference?: boolean
  critical?: boolean
  gaps?: CompareField['gaps']
  seeAlso?: readonly string[]
  prohibition?: boolean
}

function field(
  name: keyof Entry,
  labelKey: string,
  kind: CompareKind,
  modes: readonly Modal[],
  options: FieldOptions = {},
): CompareField {
  return {
    field: name,
    labelKey,
    kind,
    modes,
    compareModes: options.compareModes ?? modes,
    reference: options.reference ?? false,
    critical: options.critical ?? false,
    gaps: options.gaps ?? {},
    seeAlso: options.seeAlso ?? [],
    prohibition: options.prohibition ?? false,
  }
}

/**
 * Ordered like the regulation reads: classification, quantities, packaging, road/rail, sea, air, provisions.
 *
 * Gap audit (2026-11-23, against the live BAM columns): every mode outside `modes` is
 * `notInRegulation` unless listed here —
 * - classificationCode: IMDG/ICAO have no classification code (Dangerous Goods List col. 3 is class/division only)
 * - limitedQty: ICAO LQ is the Y packing instruction + max net per package (`packing_instr_passenger_y`,
 *   `max_net_passenger_y`); a different concept from ADR/RID/IMDG "1 L" per inner packaging → shown, not compared
 * - packingInstructions: ICAO has them per aircraft type → `elsewhere` (PI Passagier / PI Fracht)
 * - portableTankInstr: ICAO has no tanks; tankCodes (ADR/RID col. 12): IMDG uses portable tanks only
 * - transportCategory, multiplier: ADR/RID 1.1.3.6 only
 * - kemlerNumber: RID has the hazard identification number (col. 20), the BAM RID feed has no column → `noSource`
 * - tunnelCode: ADR only
 * - ems / stowage / segregation / MARPOL: IMDG only
 * - air PIs / max net / state variations: ICAO only
 */
export const COMPARE_FIELDS: readonly CompareField[] = [
  field('hazardClass', 'class', 'class', ALL, { reference: true, critical: true }),
  field('classificationCode', 'classCode', 'text', LAND, { critical: true }),
  field('packingGroup', 'packingGroup', 'text', ALL, { reference: true, critical: true }),
  field('hazardLabels', 'labels', 'labels', ALL, { compareModes: LAND, critical: true }),
  field('limitedQty', 'limitedQty', 'quantity', ALL, { compareModes: ROAD_RAIL_SEA, reference: true, critical: true }),
  field('exceptedQty', 'exceptedQty', 'quantity', ALL, { reference: true, critical: true }),
  field('packingInstructions', 'packingInstr', 'set', ROAD_RAIL_SEA, {
    compareModes: LAND,
    reference: true,
    gaps: { ICAO: 'elsewhere' },
    seeAlso: ['piPassenger', 'piCargo'],
  }),
  // ADR and RID take both from the same RID/ADR Chapters 4.2/4.3 notation; IMDG uses the same
  // T codes but not ADR's "(M)" MEGC marker, so it is shown, not compared. The UN Model
  // Regulations have the portable tank instructions too (col. 10) → reference (2026-11-23)
  field('portableTankInstr', 'portableTank', 'set', ROAD_RAIL_SEA, { compareModes: LAND, reference: true }),
  field('tankCodes', 'tankCodes', 'set', LAND),
  field('transportCategory', 'transportCat', 'text', LAND),
  field('multiplier', 'multiplier', 'text', LAND),
  field('kemlerNumber', 'kemler', 'text', ROAD, { gaps: { RID: 'noSource' } }),
  field('tunnelCode', 'tunnelCode', 'text', ROAD),
  field('ems1', 'emsFire', 'text', SEA),
  field('ems2', 'emsSpill', 'text', SEA),
  field('stowageCategory', 'stowageCat', 'text', SEA),
  field('stowage', 'stowage', 'set', SEA),
  field('segregation', 'segregation', 'set', SEA),
  field('marpol', 'marpol', 'text', SEA),
  field('packingInstrPassenger', 'piPassenger', 'text', AIR, { critical: true, prohibition: true }),
  field('maxNetPassenger', 'maxNetPassenger', 'text', AIR),
  field('packingInstrCargo', 'piCargo', 'text', AIR, { critical: true, prohibition: true }),
  field('maxNetCargo', 'maxNetCargo', 'text', AIR),
  field('stateVariations', 'stateVariations', 'set', AIR),
  field('specialProvisions', 'specialProvisions', 'set', ALL, { compareModes: LAND, reference: true }),
]

export type CompareStatus = 'same' | 'differs' | 'onlyOne' | 'missing'

export interface CompareCell {
  /** what to render; null = nothing to show */
  raw: string | null
  /** the mode's dataset has this field at all */
  applicable: boolean
  /** the value takes part in the comparison (shared notation) */
  compared: boolean
  /** disagrees with the majority (or a tie) in a `differs` row */
  deviates: boolean
  /** the mode has rows but no unambiguous variant was chosen */
  unresolved: boolean
  /** why the cell is empty although the mode has rows; null = the mode carries the field */
  gap: CellGap | null
  /** the value points to a provision ("See SP277") instead of stating a quantity: shown, never compared */
  crossRef: boolean
  /** ICAO "FORBIDDEN" in a packing-instruction column */
  forbidden: boolean
}

export interface CompareRow {
  field: keyof Entry
  labelKey: string
  critical: boolean
  status: CompareStatus
  /** a mode forbids carriage here (ICAO "FORBIDDEN"); always a critical finding */
  forbidden: boolean
  /** LABELS keys of the rows an `elsewhere` cell points to */
  seeAlso: readonly string[]
  cells: Record<Modal, CompareCell>
  /** UN Model Regulations cell; null when the field has no reference */
  reference: CompareCell | null
}

export interface CompareOptions {
  reference?: Entry | null
  referenceUnresolved?: boolean
  unresolved?: readonly Modal[]
}

/** "See SP277", "siehe SV 251", "See SP 251 in Chapter 3.3": a pointer to a provision, not a value */
export function isCrossReference(raw: string | null | undefined): boolean {
  return /^\s*(?:see|siehe)\s+(?:SP|SV)\s*\d/i.test(raw ?? '')
}

/** ICAO writes "FORBIDDEN" (upper case in the 2025 feed; matched case-insensitively) */
export function isForbidden(raw: string | null | undefined): boolean {
  return (raw ?? '').trim().toUpperCase() === 'FORBIDDEN'
}

export type AirProhibition = 'all' | 'passenger' | 'cargo'

/**
 * What the ICAO entry forbids. Read from the packing-instruction columns only: the imported
 * `icao_entries.prohibited` column holds BAM's N_VERBOT ("1" = permitted), so it is not a prohibition flag.
 */
export function airProhibition(entry: Entry | null | undefined): AirProhibition | null {
  if (!entry) return null
  const passenger = isForbidden(entry.packingInstrPassenger)
  const cargo = isForbidden(entry.packingInstrCargo)
  if (passenger && cargo) return 'all'
  if (passenger) return 'passenger'
  if (cargo) return 'cargo'
  return null
}

function splitSet(raw: string): string {
  return raw
    .split(',')
    .map(part => part.replace(/[\s()]/g, '').toUpperCase())
    .filter(Boolean)
    .sort()
    .join(',')
}

export function normalizeValue(kind: CompareKind, raw: string): string {
  switch (kind) {
    case 'quantity': {
      // "siehe SV 251" (German) and "See SP251" (English) name the same provision
      const reference = raw.trim().match(/^(?:siehe\s+SV|see\s+SP)\s*(\S+)$/i)
      return reference ? `SP${reference[1]!.toUpperCase()}` : raw.replace(/\s+/g, '').toUpperCase()
    }
    case 'set':
      return splitSet(raw)
    case 'labels':
      // RID adds markers such as "(13)"; they are not hazard labels
      return splitSet(raw.replace(/\([^)]*\)/g, ''))
    default:
      return raw.trim().replace(/\s+/g, ' ').toUpperCase()
  }
}

/**
 * ADR/RID write "1" or "2" where IMDG/ICAO write the division; the division is in the
 * classification code (class 1: "1.1D"; class 2: T → 2.3, else F → 2.1, else 2.2). Review I1.
 */
function divisionFromCode(hazardClass: string, code: string | undefined): string | null {
  const c = code?.trim().toUpperCase()
  if (!c) return null
  if (hazardClass === '1') return /^1\.\d[A-Z]$/.test(c) ? c : null
  if (hazardClass === '2') return c.includes('T') ? '2.3' : c.includes('F') ? '2.1' : '2.2'
  return null
}

/** fallback without a code: a bare class is compatible with exactly one division */
function resolveClassKeys(keys: Partial<Record<Modal, string>>): Partial<Record<Modal, string>> {
  const values = Object.values(keys)
  const out = { ...keys }
  for (const [mode, value] of Object.entries(keys) as [Modal, string][]) {
    if (value.includes('.')) continue
    const divisions = [...new Set(values.filter(v => v.startsWith(`${value}.`)))]
    if (divisions.length === 1) out[mode] = divisions[0]!
  }
  return out
}

function display(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

export function buildComparison(selection: Partial<Record<Modal, Entry | null>>, options: CompareOptions = {}): CompareRow[] {
  const unresolved = new Set(options.unresolved ?? [])

  return COMPARE_FIELDS.map((def) => {
    const cells = {} as Record<Modal, CompareCell>
    let keys: Partial<Record<Modal, string>> = {}

    for (const mode of MODALS) {
      const applicable = def.modes.includes(mode)
      const isUnresolved = applicable && unresolved.has(mode)
      const raw = applicable && !isUnresolved ? display(selection[mode]?.[def.field]) : null
      // a reference in a quantity column names no quantity, so it is never compared (UN 1950: "See SP277")
      const crossRef = def.kind === 'quantity' && isCrossReference(raw)
      const compared = def.compareModes.includes(mode) && !crossRef
      const forbidden = def.prohibition && isForbidden(raw)
      const gap = applicable ? null : (def.gaps[mode] ?? 'notInRegulation')
      cells[mode] = { raw, applicable, compared, deviates: false, unresolved: isUnresolved, gap, crossRef, forbidden }
      if (compared && raw) {
        const key = def.kind === 'class'
          ? (divisionFromCode(raw, selection[mode]?.classificationCode) ?? normalizeValue(def.kind, raw))
          : normalizeValue(def.kind, raw)
        if (key) keys[mode] = key
      }
    }
    if (def.kind === 'class') keys = resolveClassKeys(keys)

    const reference: CompareCell | null = def.reference
      ? {
          raw: options.referenceUnresolved ? null : display(options.reference?.[def.field]),
          applicable: true,
          compared: false,
          deviates: false,
          unresolved: options.referenceUnresolved ?? false,
          gap: null,
          crossRef: false,
          forbidden: false,
        }
      : null

    const present = Object.entries(keys) as [Modal, string][]
    // a bare class still standing next to divisions says nothing about the division (review I2)
    const bareLeft = def.kind === 'class' && present.some(([, k]) => !k.includes('.')) && present.some(([, k]) => k.includes('.'))
    let status: CompareStatus
    if (present.length >= 2) {
      status = new Set(present.map(([, key]) => key)).size === 1 ? 'same' : 'differs'
    }
    else {
      // an unresolved mode keeps the row visible so its "?" shows (review I3)
      const anything = MODALS.some(m => cells[m].raw || cells[m].unresolved) || reference?.raw
      status = anything ? 'onlyOne' : 'missing'
    }

    if (status === 'differs') {
      const counts = new Map<string, number>()
      for (const [, key] of present) counts.set(key, (counts.get(key) ?? 0) + 1)
      const max = Math.max(...counts.values())
      const leaders = [...counts].filter(([, count]) => count === max)
      const majority = leaders.length === 1 && !bareLeft ? leaders[0]![0] : null
      for (const [mode, key] of present) cells[mode].deviates = majority === null || key !== majority
    }

    const forbidden = MODALS.some(m => cells[m].forbidden)
    return { field: def.field, labelKey: def.labelKey, critical: def.critical, status, forbidden, seeAlso: def.seeAlso, cells, reference }
  })
}

/** critical rows whose compared values disagree, and prohibitions — the facts the page states, nothing more */
export function summarizeDeviations(rows: readonly CompareRow[]): CompareRow[] {
  return rows.filter(r => r.critical && (r.status === 'differs' || r.forbidden))
}
