import type { Entry, Lang, Modal } from './types'

/**
 * Regulatory variants of one UN number within one mode.
 *
 * BAM adds a row whenever a name exists in one language without a counterpart in another, so
 * most extra rows per UN number repeat the same regulatory data under another name. A variant is
 * the set of rows whose regulatory fields are identical; it carries every name of those rows.
 * See docs/superpowers/specs/2026-11-08-stoffsuche-variants-design.md.
 */

export interface VariantNames {
  de: string[]
  en: string[]
  fr: string[]
}

export interface Variant {
  /** serialised regulatory fields; equal keys = same variant */
  key: string
  /** rows of this mode sharing the regulatory data, in source order */
  entries: Entry[]
  /** entries[0]; the row whose values are displayed */
  representative: Entry
  packingGroup: string | null
  /** distinct names across all rows, per language, in source order */
  names: VariantNames
  /** distinct normalised English specifications of its rows ('' = row without one) */
  matchSpecs: string[]
}

/** fields that describe a row rather than regulate it */
const NON_REGULATORY: ReadonlySet<string> = new Set([
  'unNumber',
  'sequenceNumber',
  'name',
  'nameEn',
  'nameFr',
  'specification',
  'specificationEn',
  'specificationFr',
  'remark',
])

function regulatoryKey(entry: Entry): string {
  const pairs = Object.entries(entry)
    .filter(([field, value]) => !NON_REGULATORY.has(field) && value != null && value !== '')
    .map(([field, value]) => [field, String(value)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return JSON.stringify(pairs)
}

export function normalizeSpec(s: string | null | undefined): string {
  return (s ?? '').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '')
}

/** ICAO publishes English only: its `specification` column is the English one */
function englishSpec(entry: Entry, mode: Modal): string | undefined {
  return mode === 'ICAO' ? entry.specification : entry.specificationEn
}

function pushUnique(list: string[], value: string | undefined): void {
  if (value && !list.includes(value)) list.push(value)
}

export function groupVariants(entries: readonly Entry[], mode: Modal): Variant[] {
  const byKey = new Map<string, Variant>()
  for (const entry of entries) {
    const key = regulatoryKey(entry)
    let variant = byKey.get(key)
    if (!variant) {
      variant = {
        key,
        entries: [],
        representative: entry,
        packingGroup: entry.packingGroup ?? null,
        names: { de: [], en: [], fr: [] },
        matchSpecs: [],
      }
      byKey.set(key, variant)
    }
    variant.entries.push(entry)
    if (mode === 'ICAO') {
      pushUnique(variant.names.en, entry.name)
    }
    else {
      pushUnique(variant.names.de, entry.name)
      pushUnique(variant.names.en, entry.nameEn)
      pushUnique(variant.names.fr, entry.nameFr)
    }
    const spec = normalizeSpec(englishSpec(entry, mode))
    if (!variant.matchSpecs.includes(spec)) variant.matchSpecs.push(spec)
  }
  return [...byKey.values()]
}

/**
 * The variant of another mode that corresponds to `chosen`, or null when there is no
 * unambiguous one. Never guesses: two equally good candidates → null.
 */
export function matchVariant(chosen: Variant, candidates: readonly Variant[]): Variant | null {
  const samePg = candidates.filter(c => c.packingGroup === chosen.packingGroup)
  const sameSpec = samePg.filter(c => c.matchSpecs.some(s => chosen.matchSpecs.includes(s)))
  if (sameSpec.length === 1) return sameSpec[0]!
  if (samePg.length === 1) return samePg[0]!
  return null
}

const NAME_ORDER: Record<Lang, (keyof VariantNames)[]> = {
  de: ['de', 'en', 'fr'],
  en: ['en', 'de', 'fr'],
  fr: ['fr', 'en', 'de'],
  tr: ['en', 'de', 'fr'],
}

/** every name, current language first, case-insensitively de-duplicated */
export function orderedNames(names: VariantNames, lang: Lang): string[] {
  const out: string[] = []
  for (const l of NAME_ORDER[lang]) {
    for (const name of names[l]) {
      if (!out.some(o => o.toUpperCase() === name.toUpperCase())) out.push(name)
    }
  }
  return out
}

/** same fallback chain as MultimodalToolState.getSpez */
function localSpec(entry: Entry, lang: Lang, mode: Modal): string | undefined {
  if (mode === 'ICAO') return entry.specification
  if (lang === 'en' || lang === 'tr') return entry.specificationEn ?? entry.specification
  if (lang === 'fr') return entry.specificationFr ?? entry.specificationEn ?? entry.specification
  return entry.specification ?? entry.specificationEn
}

/** distinct specifications of all rows of the variant, in the current language */
export function variantSpecs(variant: Variant, lang: Lang, mode: Modal): string[] {
  const specs: string[] = []
  for (const entry of variant.entries) pushUnique(specs, localSpec(entry, lang, mode)?.trim())
  return specs
}

export function variantLabel(variant: Variant, lang: Lang, mode: Modal, pgShort: string): string {
  const spec = variantSpecs(variant, lang, mode).join(' / ')
  if (variant.packingGroup) {
    const pg = `${pgShort} ${variant.packingGroup}`
    return spec ? `${pg} · ${spec}` : pg
  }
  return spec || orderedNames(variant.names, lang)[0] || `#${variant.representative.sequenceNumber}`
}
