import { type Entry, type Modal, MODALS } from './types'

/**
 * Cross-mode comparison of one UN number (F-10).
 * Spec: docs/superpowers/specs/2026-09-28-regulatory-comparison-design.md, incl. "Revision 2026-11-08".
 * Absence is never a deviation, and only modes that share a notation are compared.
 */

export type CompareKind = 'text' | 'quantity' | 'set' | 'labels' | 'class'

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
}

const ALL: readonly Modal[] = ['ADR', 'RID', 'IMDG', 'ICAO']
const LAND: readonly Modal[] = ['ADR', 'RID']
const ROAD_RAIL_SEA: readonly Modal[] = ['ADR', 'RID', 'IMDG']
const ROAD: readonly Modal[] = ['ADR']
const SEA: readonly Modal[] = ['IMDG']
const AIR: readonly Modal[] = ['ICAO']

function field(
  name: keyof Entry,
  labelKey: string,
  kind: CompareKind,
  modes: readonly Modal[],
  options: { compareModes?: readonly Modal[], reference?: boolean, critical?: boolean } = {},
): CompareField {
  return {
    field: name,
    labelKey,
    kind,
    modes,
    compareModes: options.compareModes ?? modes,
    reference: options.reference ?? false,
    critical: options.critical ?? false,
  }
}

/** ordered like the regulation reads: classification, quantities, packaging, road/rail, sea, air, provisions */
export const COMPARE_FIELDS: readonly CompareField[] = [
  field('hazardClass', 'class', 'class', ALL, { reference: true, critical: true }),
  field('classificationCode', 'classCode', 'text', LAND, { critical: true }),
  field('packingGroup', 'packingGroup', 'text', ALL, { reference: true, critical: true }),
  field('hazardLabels', 'labels', 'labels', ALL, { compareModes: LAND, critical: true }),
  field('limitedQty', 'limitedQty', 'quantity', ROAD_RAIL_SEA, { reference: true, critical: true }),
  field('exceptedQty', 'exceptedQty', 'quantity', ALL, { reference: true, critical: true }),
  field('packingInstructions', 'packingInstr', 'set', ROAD_RAIL_SEA, { compareModes: LAND, reference: true }),
  field('transportCategory', 'transportCat', 'text', LAND),
  field('multiplier', 'multiplier', 'text', LAND),
  field('kemlerNumber', 'kemler', 'text', ROAD),
  field('tunnelCode', 'tunnelCode', 'text', ROAD),
  field('ems1', 'emsFire', 'text', SEA),
  field('ems2', 'emsSpill', 'text', SEA),
  field('stowageCategory', 'stowageCat', 'text', SEA),
  field('stowage', 'stowage', 'set', SEA),
  field('segregation', 'segregation', 'set', SEA),
  field('marpol', 'marpol', 'text', SEA),
  field('packingInstrPassenger', 'piPassenger', 'text', AIR),
  field('maxNetPassenger', 'maxNetPassenger', 'text', AIR),
  field('packingInstrCargo', 'piCargo', 'text', AIR),
  field('maxNetCargo', 'maxNetCargo', 'text', AIR),
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
}

export interface CompareRow {
  field: keyof Entry
  labelKey: string
  critical: boolean
  status: CompareStatus
  cells: Record<Modal, CompareCell>
  /** UN Model Regulations cell; null when the field has no reference */
  reference: CompareCell | null
}

export interface CompareOptions {
  reference?: Entry | null
  referenceUnresolved?: boolean
  unresolved?: readonly Modal[]
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
      const compared = def.compareModes.includes(mode)
      const isUnresolved = applicable && unresolved.has(mode)
      const raw = applicable && !isUnresolved ? display(selection[mode]?.[def.field]) : null
      cells[mode] = { raw, applicable, compared, deviates: false, unresolved: isUnresolved }
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

    return { field: def.field, labelKey: def.labelKey, critical: def.critical, status, cells, reference }
  })
}

/** critical rows whose compared values disagree — the facts the page states, nothing more */
export function summarizeDeviations(rows: readonly CompareRow[]): CompareRow[] {
  return rows.filter(r => r.critical && r.status === 'differs')
}
