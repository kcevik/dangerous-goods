import type { Synonym } from './synonyms'
import { type Modal, MODALS } from '$lib/multimodal/types'
import { foldedStem, foldText, PLACEHOLDER_UN, unPrefix } from './normalize'

export interface SearchResult {
  unNumber: string
  /** the name that matched the query best; the first name when only the UN number or a synonym matched */
  primaryName: string
  /** every other name of the UN number, case-insensitively de-duplicated */
  otherNames: string[]
  hazardClass: string | null
  /** distinct, I < II < III */
  packingGroups: string[]
  /** every mode with data for this UN number, in MODALS order (not only the modes whose name matched) */
  modes: Modal[]
  /** set when the UN number was found only through a curated synonym */
  synonym?: { term: string, note?: string }
}

export interface SearchTable {
  mode: Modal
  table: string
  nameColumns: readonly string[]
}

/** ADN has no BAM table; un_entries is deliberately not searched (spec decision 4) */
export const SEARCH_TABLES: readonly SearchTable[] = [
  { mode: 'ADR', table: 'adr_entries', nameColumns: ['name', 'name_en', 'name_fr'] },
  { mode: 'RID', table: 'rid_entries', nameColumns: ['name', 'name_en', 'name_fr'] },
  { mode: 'IMDG', table: 'imdg_entries', nameColumns: ['name', 'name_en'] },
  { mode: 'ICAO', table: 'icao_entries', nameColumns: ['name'] },
]

export const MIN_QUERY_LENGTH = 2
/** results shown at first and added per "Weitere Treffer laden" */
export const PAGE_SIZE = 20
/** matching rows fetched per table; more means the ranking may miss something → `incomplete` */
export const NAME_ROW_LIMIT = 500
/** ranked UN numbers loaded in detail; more → `incomplete` */
export const DETAIL_LIMIT = 60
/** rows per table for the detail load (PostgREST caps at 1000) */
export const DETAIL_ROW_LIMIT = 1000
const PG_ORDER = ['I', 'II', 'III']

export type Row = Record<string, unknown>
export type RowsByMode = Partial<Record<Modal, Row[]>>

export interface RankedHit {
  unNumber: string
  /** 0 UN number, 1 whole name, 2 name starts with the query, 3 a word starts with it, 4 contains it */
  rank: number
  primaryName: string | null
}

export interface SynonymHit {
  unNumber: string
  synonym: Synonym
}

const NO_MATCH = 5

function nameRank(name: string, q: string, qs: string): number {
  const n = foldText(name)
  if (!n) return NO_MATCH
  if (n === q || n === qs) return 1
  if (n.startsWith(q) || n.startsWith(qs)) return 2
  if (` ${n}`.includes(` ${qs}`)) return 3
  return 4
}

function pgIndex(pg: string): number {
  const i = PG_ORDER.indexOf(pg)
  return i === -1 ? PG_ORDER.length : i
}

/**
 * Ranks the rows the name search returned, one hit per UN number.
 * Rank: UN-number prefix, then whole name, name start, word start, contains; ties by UN number.
 * Comparison is folded (case, umlauts, separators), so "Schwefelsaeure" ranks like "Schwefelsäure".
 */
export function rankSearchRows(query: string, rowsByMode: RowsByMode): RankedHit[] {
  const q = foldText(query)
  const qs = foldedStem(query)
  const prefix = unPrefix(query)
  const byUn = new Map<string, { nameRank: number, primaryName: string | null }>()

  for (const { mode, nameColumns } of SEARCH_TABLES) {
    for (const row of rowsByMode[mode] ?? []) {
      const unNumber = String(row.un_number)
      if (unNumber === PLACEHOLDER_UN) continue
      let best = byUn.get(unNumber)
      if (!best) {
        best = { nameRank: NO_MATCH, primaryName: null }
        byUn.set(unNumber, best)
      }
      for (const column of nameColumns) {
        const name = row[column]
        if (typeof name !== 'string' || !name) continue
        const rank = nameRank(name, q, qs)
        if (best.primaryName === null || rank < best.nameRank) {
          best.nameRank = rank
          best.primaryName = name
        }
      }
    }
  }

  return [...byUn.entries()]
    .map(([unNumber, best]): RankedHit => ({
      unNumber,
      rank: prefix && unNumber.startsWith(prefix) ? 0 : best.nameRank,
      primaryName: best.primaryName,
    }))
    .sort((a, b) => a.rank - b.rank || a.unNumber.localeCompare(b.unNumber))
}

/**
 * Builds the cards: official hits in rank order, then synonym-only hits. Class, packing groups,
 * names and modes come from every row of the UN number (the detail load), so a mode is shown
 * whenever it has data — not only when its name matched. A UN number without any row is dropped.
 */
export function buildSearchResults(hits: RankedHit[], synonymHits: SynonymHit[], detail: RowsByMode): SearchResult[] {
  const rowsByUn = new Map<string, { mode: Modal, row: Row }[]>()
  for (const mode of MODALS) {
    for (const row of detail[mode] ?? []) {
      const un = String(row.un_number)
      if (!rowsByUn.has(un)) rowsByUn.set(un, [])
      rowsByUn.get(un)!.push({ mode, row })
    }
  }
  const columnsOf = (mode: Modal) => SEARCH_TABLES.find(t => t.mode === mode)?.nameColumns ?? []

  const entries: { unNumber: string, primaryName: string | null, synonym?: Synonym }[] = [
    ...hits.map(h => ({ unNumber: h.unNumber, primaryName: h.primaryName })),
    ...synonymHits.map(s => ({ unNumber: s.unNumber, primaryName: null, synonym: s.synonym })),
  ]

  const results: SearchResult[] = []
  for (const entry of entries) {
    const rows = rowsByUn.get(entry.unNumber)
    if (!rows) continue
    const names: string[] = []
    const modes = new Set<Modal>()
    const packingGroups = new Set<string>()
    let hazardClass: string | null = null
    for (const { mode, row } of rows) {
      modes.add(mode)
      if (hazardClass == null && row.hazard_class) hazardClass = String(row.hazard_class)
      if (row.packing_group) packingGroups.add(String(row.packing_group))
      for (const column of columnsOf(mode)) {
        const name = row[column]
        if (typeof name === 'string' && name && !names.some(n => n.toLowerCase() === name.toLowerCase())) names.push(name)
      }
    }
    const primaryName = entry.primaryName ?? names[0] ?? ''
    const result: SearchResult = {
      unNumber: entry.unNumber,
      primaryName,
      otherNames: names.filter(n => n.toLowerCase() !== primaryName.toLowerCase()),
      hazardClass,
      packingGroups: [...packingGroups].sort((a, b) => pgIndex(a) - pgIndex(b)),
      modes: MODALS.filter(m => modes.has(m)),
    }
    if (entry.synonym) {
      result.synonym = entry.synonym.note
        ? { term: entry.synonym.term, note: entry.synonym.note }
        : { term: entry.synonym.term }
    }
    results.push(result)
  }
  return results
}

/** UN numbers the synonyms add, in list order, skipping those the official search already found */
export function synonymHitsFor(synonyms: Synonym[], found: Iterable<string>): SynonymHit[] {
  const seen = new Set(found)
  const hits: SynonymHit[] = []
  for (const synonym of synonyms) {
    for (const unNumber of synonym.unNumbers) {
      if (seen.has(unNumber)) continue
      seen.add(unNumber)
      hits.push({ unNumber, synonym })
    }
  }
  return hits
}
