import type { Entry } from '$lib/multimodal/types'
import { groupVariants, type Variant } from '$lib/multimodal/variants'

/**
 * ADR 1.1.3.6 — exemptions related to quantities carried per transport unit.
 * Pure rules; see docs/superpowers/specs/2026-11-23-1000-punkte-rechner-design.md.
 */

/** 1.1.3.6.4: the sum "darf … einen berechneten Wert von 1000 nicht überschreiten" */
export const POINTS_LIMIT = 1000

/** 1.1.3.6.3 column 3 for transport category 2 when all goods belong to it */
export const BK2_ALONE_LIMIT = 333

/** tolerance for binary floating point (0.1 × 3 = 0.30000000000000004) */
const EPSILON = 1e-9

export const CATEGORIES = ['0', '1', '2', '3', '4'] as const
export type Category = (typeof CATEGORIES)[number]

/** kg = mass; l = litres (liquids); lw = water capacity in litres (compressed gases etc.) */
export const UNITS = ['kg', 'l', 'lw'] as const
export type Unit = (typeof UNITS)[number]

export const UNIT_LABELS: Record<Unit, string> = {
  kg: 'kg',
  l: 'L',
  lw: 'L Fassungsraum',
}

export type QuantityParse =
  | { ok: true, value: number }
  | { ok: false, reason: 'empty' | 'thousands' | 'invalid' | 'notPositive' }

/**
 * German input: "1,5" and "1.5" are one and a half; "1.000" (a thousands point) is rejected
 * rather than guessed, because reading it as 1 would understate the points a thousandfold.
 */
export function parseQuantity(text: string): QuantityParse {
  const t = text.trim()
  if (!t) return { ok: false, reason: 'empty' }
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return { ok: false, reason: 'thousands' }
  if (!/^\d+([.,]\d+)?$/.test(t)) return { ok: false, reason: 'invalid' }
  const value = Number(t.replace(',', '.'))
  if (!(value > 0)) return { ok: false, reason: 'notPositive' }
  return { ok: true, value }
}

/** Table A column 15; "-", NULL and anything unexpected mean: no category assigned */
export function categoryOf(entry: Entry): Category | null {
  const raw = entry.transportCategory == null ? '' : String(entry.transportCategory).trim()
  return (CATEGORIES as readonly string[]).includes(raw) ? raw as Category : null
}

/**
 * Factor per 1.1.3.6.4. BK 1 is 50, or 20 for the UN numbers of footnote a) to 1.1.3.6.3 —
 * the BAM data carries that as `multiplier = 20`. BK 0 has no factor: it is never exempt.
 */
export function factorFor(category: Category, multiplier?: string | null): number | null {
  switch (category) {
    case '0': return null
    case '1': return String(multiplier ?? '').trim() === '20' ? 20 : 50
    case '2': return 3
    case '3': return 1
    case '4': return 0
  }
}

/** 1.1.3.6.1: empty uncleaned packagings keep BK 0, every other category becomes BK 4 */
export function effectiveCategory(category: Category, emptyPackaging: boolean): Category {
  if (!emptyPackaging || category === '0') return category
  return '4'
}

export function isForbidden(entry: Entry): boolean {
  return /BEFÖRDERUNG VERBOTEN/i.test(entry.remark ?? '')
}

export function isNotSubject(entry: Entry): boolean {
  return /UNTERLIEGT NICHT DEN VORSCHRIFTEN DES ADR/i.test(entry.remark ?? '')
}

export type Lookup =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'failed' }
  | { state: 'done', entries: Entry[] }

export interface RowInput {
  un: string
  quantity: string
  emptyPackaging: boolean
  lookup: Lookup
  /** `Variant.key` chosen by the user; only read when the variants differ */
  variantKey: string | null
}

export type RowStatus =
  | 'empty'
  | 'invalidUn'
  | 'loading'
  | 'lookupFailed'
  | 'notFound'
  | 'needsVariant'
  | 'needsQuantity'
  | 'invalidQuantity'
  | 'forbidden'
  | 'notSubject'
  | 'noCategory'
  | 'category0'
  | 'counted'

export interface RowResult {
  un: string
  status: RowStatus
  /** the row the values come from (the chosen or only variant) */
  entry: Entry | null
  variants: Variant[]
  /** the variants differ in what matters here — the user has to pick one */
  needsChoice: boolean
  /** Table A category */
  sourceCategory: Category | null
  /** after the empty-packaging rule */
  category: Category | null
  factor: number | null
  quantity: number | null
  points: number | null
  /** footnote a) to 1.1.3.6.3 (factor 20) */
  footnoteA: boolean
  message: string | null
}

const UN_RE = /^\d{4}$/

/** what decides the points; variants with equal signatures need no choice */
function pointsSignature(entry: Entry): string {
  return [categoryOf(entry) ?? '-', String(entry.multiplier ?? ''), isForbidden(entry), isNotSubject(entry)].join('|')
}

function quantityMessage(reason: Exclude<QuantityParse, { ok: true }>['reason']): string {
  switch (reason) {
    case 'empty': return 'Bitte eine Menge eingeben.'
    case 'thousands': return 'Bitte ohne Tausenderpunkt eingeben (z. B. 1000 oder 1,5).'
    case 'notPositive': return 'Die Menge muss größer als 0 sein.'
    case 'invalid': return 'Bitte nur eine Zahl eingeben (z. B. 250 oder 12,5).'
  }
}

export function evaluateRow(input: RowInput): RowResult {
  const un = input.un.trim()
  const base: RowResult = {
    un,
    status: 'empty',
    entry: null,
    variants: [],
    needsChoice: false,
    sourceCategory: null,
    category: null,
    factor: null,
    quantity: null,
    points: null,
    footnoteA: false,
    message: null,
  }

  if (!un && !input.quantity.trim()) return base
  if (!UN_RE.test(un)) return { ...base, status: 'invalidUn', message: 'Bitte eine vierstellige UN-Nummer eingeben.' }

  const { lookup } = input
  if (lookup.state === 'idle' || lookup.state === 'loading') return { ...base, status: 'loading', message: 'Wird geladen …' }
  if (lookup.state === 'failed') {
    return { ...base, status: 'lookupFailed', message: 'Die Abfrage ist fehlgeschlagen. Diese Position kann nicht bewertet werden.' }
  }
  if (lookup.entries.length === 0) {
    return { ...base, status: 'notFound', message: `UN ${un} steht nicht im ADR (Tabelle A).` }
  }

  const variants = groupVariants(lookup.entries, 'ADR')
  const needsChoice = new Set(variants.map(v => pointsSignature(v.representative))).size > 1
  const chosen = needsChoice ? variants.find(v => v.key === input.variantKey) : variants[0]
  const withVariants = { ...base, variants, needsChoice }
  if (!chosen) {
    return {
      ...withVariants,
      status: 'needsVariant',
      message: 'Die Eintragungen dieser UN-Nummer haben unterschiedliche Beförderungskategorien. Bitte die passende wählen.',
    }
  }

  const entry = chosen.representative
  const parsed = parseQuantity(input.quantity)
  const quantity = parsed.ok ? parsed.value : null
  const resolved = { ...withVariants, entry, quantity }

  if (isForbidden(entry)) {
    return { ...resolved, status: 'forbidden', message: 'Beförderung nach ADR verboten (Tabelle A).' }
  }
  if (isNotSubject(entry)) {
    return { ...resolved, status: 'notSubject', message: `${entry.remark} – nicht mitgezählt.` }
  }

  const sourceCategory = categoryOf(entry)
  if (sourceCategory === null) {
    return {
      ...resolved,
      status: 'noCategory',
      message: 'Für diese Position ist keine Beförderungskategorie angegeben (Tabelle A Spalte 15) – nicht nach 1.1.3.6 freistellbar. Bitte prüfen.',
    }
  }

  const category = effectiveCategory(sourceCategory, input.emptyPackaging)
  const withCategory = { ...resolved, sourceCategory, category }
  if (category === '0') {
    return {
      ...withCategory,
      status: 'category0',
      message: 'Beförderungskategorie 0 – keine Freistellung nach 1.1.3.6 möglich, unabhängig von der Menge.',
    }
  }

  const factor = factorFor(category, entry.multiplier)!
  const footnoteA = category === '1' && factor === 20
  if (category === '4') {
    // "unbegrenzt": the quantity does not change the outcome
    return { ...withCategory, status: 'counted', factor, footnoteA, points: 0 }
  }
  if (!parsed.ok) {
    return {
      ...withCategory,
      factor,
      footnoteA,
      status: parsed.reason === 'empty' ? 'needsQuantity' : 'invalidQuantity',
      message: quantityMessage(parsed.reason),
    }
  }
  return { ...withCategory, status: 'counted', factor, footnoteA, points: parsed.value * factor }
}

export type Verdict = 'empty' | 'lookupFailed' | 'incomplete' | 'notExempt' | 'check' | 'noAdrGoods' | 'exempt'

export interface LoadResult {
  verdict: Verdict
  /** sum of the points of all counted rows */
  total: number
  /** why the verdict is what it is (not exempt, incomplete, check) */
  reasons: string[]
  /** rows left out on purpose (not subject to ADR) */
  notes: string[]
}

const INCOMPLETE: ReadonlySet<RowStatus> = new Set(['invalidUn', 'loading', 'notFound', 'needsVariant', 'needsQuantity', 'invalidQuantity'])

function label(row: RowResult, index: number): string {
  return `Position ${index + 1}${row.un ? ` (UN ${row.un})` : ''}`
}

export function evaluateLoad(rows: readonly RowResult[]): LoadResult {
  const filled = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.status !== 'empty')
  const total = filled.reduce((sum, { row }) => sum + (row.status === 'counted' ? row.points ?? 0 : 0), 0)
  const notes = filled.filter(({ row }) => row.status === 'notSubject').map(({ row, index }) => `${label(row, index)}: ${row.message}`)
  const describe = (statuses: ReadonlySet<RowStatus>) =>
    filled.filter(({ row }) => statuses.has(row.status)).map(({ row, index }) => `${label(row, index)}: ${row.message}`)

  if (filled.length === 0) return { verdict: 'empty', total: 0, reasons: [], notes }

  const failed = describe(new Set(['lookupFailed']))
  if (failed.length) return { verdict: 'lookupFailed', total, reasons: failed, notes }

  const incomplete = describe(INCOMPLETE)
  if (incomplete.length) return { verdict: 'incomplete', total, reasons: incomplete, notes }

  const notExempt = describe(new Set(['forbidden', 'category0']))
  if (total > POINTS_LIMIT + EPSILON) {
    notExempt.push(`Die Summe von ${formatPoints(total)} Punkten überschreitet 1.000 (1.1.3.6.4).`)
  }
  const counted = filled.filter(({ row }) => row.status === 'counted').map(({ row }) => row)
  if (counted.length > 0 && counted.every(r => r.category === '2')) {
    const quantity = counted.reduce((sum, r) => sum + (r.quantity ?? 0), 0)
    if (quantity > BK2_ALONE_LIMIT + EPSILON) {
      notExempt.push(
        `Alle Güter gehören zur Beförderungskategorie 2: Dafür gilt die Höchstmenge ${BK2_ALONE_LIMIT} je Beförderungseinheit (1.1.3.6.3, Spalte 3), eingetragen sind ${formatPoints(quantity)}.`,
      )
    }
  }
  if (notExempt.length) return { verdict: 'notExempt', total, reasons: notExempt, notes }

  const check = describe(new Set(['noCategory']))
  if (check.length) return { verdict: 'check', total, reasons: check, notes }

  if (counted.length === 0) return { verdict: 'noAdrGoods', total, reasons: [], notes }
  return { verdict: 'exempt', total, reasons: [], notes }
}

const PRESSURE_CHEMICALS = new Set(['3500', '3501', '3502', '3503', '3504', '3505'])

/** class 2 classification code group: 1 compressed, 2 liquefied, 3 refrigerated, 4 dissolved, 5 aerosols, … */
function gasGroup(entry: Entry): string {
  return (entry.classificationCode ?? '').trim().charAt(0)
}

function isBattery(entry: Entry): boolean {
  return /BATTERIE/i.test(`${entry.name ?? ''} ${entry.nameEn ?? ''}`)
}

/** a sensible default per 1.1.3.6.3; the user can always change it */
export function suggestUnit(entry: Entry): Unit {
  const hazardClass = (entry.hazardClass ?? '').trim()
  if (hazardClass === '2') {
    if (PRESSURE_CHEMICALS.has(entry.unNumber) || ['1', '9'].includes(gasGroup(entry))) return 'lw'
    return 'kg'
  }
  if (hazardClass === '3') return 'l'
  return 'kg'
}

/** which quantity 1.1.3.6.3 means for this entry, where class and code tell */
export function unitHint(entry: Entry): string | null {
  const hazardClass = (entry.hazardClass ?? '').trim()
  if (hazardClass === '1') return 'Klasse 1: Nettomasse des explosiven Stoffes in kg.'
  if (hazardClass === '2') {
    if (PRESSURE_CHEMICALS.has(entry.unNumber)) return 'Chemikalie unter Druck: mit Wasser ausgeliterter Fassungsraum des Gefäßes in Litern.'
    switch (gasGroup(entry)) {
      case '1': return 'Verdichtetes Gas: mit Wasser ausgeliterter Fassungsraum des Gefäßes in Litern.'
      case '9': return 'Adsorbiertes Gas: mit Wasser ausgeliterter Fassungsraum des Gefäßes in Litern.'
      case '2': case '3': case '4': return 'Verflüssigtes, tiefgekühlt verflüssigtes oder gelöstes Gas: Nettomasse in kg.'
      case '5': return 'Druckgaspackungen sind Gegenstände: Masse der Dosen ohne Verpackung in kg.'
      case '6': case '7': return 'Gegenstände: Masse ohne Verpackung in kg.'
      default: return null
    }
  }
  if (isBattery(entry)) return 'Gegenstände: Masse der Batterien ohne Verpackung in kg.'
  if (hazardClass === '3') return 'Flüssige Stoffe: Gesamtmenge in Litern.'
  return null
}

const NUMBER_FORMAT = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 })

export function formatPoints(value: number): string {
  return NUMBER_FORMAT.format(value)
}
