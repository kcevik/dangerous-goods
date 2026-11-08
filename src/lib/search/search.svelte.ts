import type { SupabaseClient } from '@supabase/supabase-js'
import { type Modal, MODALS } from '$lib/multimodal/types'

export interface SearchResult {
  unNumber: string
  /** the name that matched the query best; the first name when only the UN number matched */
  primaryName: string
  /** every other name of the UN number, case-insensitively de-duplicated */
  otherNames: string[]
  hazardClass: string | null
  /** distinct, I < II < III */
  packingGroups: string[]
  /** modes with at least one matching row, in MODALS order */
  modes: Modal[]
}

interface SearchTable {
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

const UN_NUMBER_RE = /^\d{4}$/
export const MIN_QUERY_LENGTH = 2
export const MAX_RESULTS = 20
const PER_TABLE_LIMIT = 50
const DEBOUNCE_MS = 300
const PG_ORDER = ['I', 'II', 'III']

type Row = Record<string, unknown>

/** PostgREST filter delimiters, quotes and LIKE wildcards would change what the filter means */
function sanitize(q: string): string {
  return q.trim().replace(/[,()"%*_\\]/g, '')
}

const NO_MATCH = 3

function nameRank(name: string, needle: string): number {
  const lower = name.toLowerCase()
  if (lower.startsWith(needle)) return 1
  if (lower.includes(needle)) return 2
  return NO_MATCH
}

function pgIndex(pg: string): number {
  const i = PG_ORDER.indexOf(pg)
  return i === -1 ? PG_ORDER.length : i
}

interface Accumulator {
  unNumber: string
  unMatch: boolean
  bestNameRank: number
  primaryName: string | null
  names: string[]
  hazardClass: string | null
  packingGroups: Set<string>
  modes: Set<Modal>
}

/**
 * Merges the rows of all mode tables into one result per UN number.
 * Rank: 0 UN-number prefix, 1 a name starts with the query, 2 a name contains it; ties by UN number.
 */
export function mergeSearchRows(q: string, rowsByMode: Partial<Record<Modal, Row[]>>): SearchResult[] {
  const needle = q.toLowerCase()
  const numeric = /^\d+$/.test(q)
  const byUn = new Map<string, Accumulator>()

  for (const { mode, nameColumns } of SEARCH_TABLES) {
    for (const row of rowsByMode[mode] ?? []) {
      const unNumber = String(row.un_number)
      let acc = byUn.get(unNumber)
      if (!acc) {
        acc = {
          unNumber,
          unMatch: numeric && unNumber.startsWith(q),
          bestNameRank: NO_MATCH,
          primaryName: null,
          names: [],
          hazardClass: null,
          packingGroups: new Set(),
          modes: new Set(),
        }
        byUn.set(unNumber, acc)
      }
      acc.modes.add(mode)
      if (acc.hazardClass == null && row.hazard_class) acc.hazardClass = String(row.hazard_class)
      if (row.packing_group) acc.packingGroups.add(String(row.packing_group))

      for (const column of nameColumns) {
        const name = row[column]
        if (typeof name !== 'string' || !name) continue
        if (!acc.names.some(n => n.toLowerCase() === name.toLowerCase())) acc.names.push(name)
        const rank = nameRank(name, needle)
        if (rank < acc.bestNameRank) {
          acc.bestNameRank = rank
          acc.primaryName = name
        }
      }
    }
  }

  return [...byUn.values()]
    .map((acc) => {
      const primaryName = acc.primaryName ?? acc.names[0] ?? ''
      const result: SearchResult = {
        unNumber: acc.unNumber,
        primaryName,
        otherNames: acc.names.filter(n => n.toLowerCase() !== primaryName.toLowerCase()),
        hazardClass: acc.hazardClass,
        packingGroups: [...acc.packingGroups].sort((a, b) => pgIndex(a) - pgIndex(b)),
        modes: MODALS.filter(m => acc.modes.has(m)),
      }
      return { rank: acc.unMatch ? 0 : acc.bestNameRank, result }
    })
    .sort((a, b) => a.rank - b.rank || a.result.unNumber.localeCompare(b.result.unNumber))
    .slice(0, MAX_RESULTS)
    .map(x => x.result)
}

/**
 * Live search state for /suche. Setting `query` debounces a name search across the ADR, RID,
 * IMDG and ICAO tables; a 4-digit UN number selects immediately without querying.
 * A failed table fails the whole search (`searchError`) — never shown as "no results".
 */
export class SearchState {
  #query = $state('')
  results = $state<SearchResult[]>([])
  selectedUn = $state<string | null>(null)
  isLoading = $state(false)
  searchError = $state(false)
  /** too short to search once stripped characters are removed — the page shows its empty state */
  readonly belowMinimum: boolean = $derived(sanitize(this.#query).length < MIN_QUERY_LENGTH)

  /** Locked accounts (not yet activated) never query; the page shows a lock notice instead. */
  readonly locked: boolean

  readonly #supabase: SupabaseClient
  #debounceTimer: ReturnType<typeof setTimeout> | null = null
  #requestId = 0

  constructor(supabase: SupabaseClient, options: { locked?: boolean } = {}) {
    this.#supabase = supabase
    this.locked = options.locked ?? false
  }

  get query(): string {
    return this.#query
  }

  set query(value: string) {
    this.#query = value
    if (this.locked) return
    // every query change invalidates in-flight responses (review fix 2026-11-08)
    this.#requestId++
    this.isLoading = false
    this.searchError = false
    const trimmed = value.trim()
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)

    // 4-digit UN number: load tool immediately, skip debounce
    if (UN_NUMBER_RE.test(trimmed)) {
      this.results = []
      this.selectedUn = trimmed
      return
    }

    this.selectedUn = null
    if (sanitize(value).length < MIN_QUERY_LENGTH) {
      this.results = []
      return
    }
    this.#debounceTimer = setTimeout(() => this.#search(value), DEBOUNCE_MS)
  }

  select(unNumber: string): void {
    this.selectedUn = unNumber
    this.results = []
  }

  /** re-run the current query at once (after a failure) */
  retry(): void {
    if (this.locked) return
    void this.#search(this.#query)
  }

  #queryTable({ table, nameColumns }: SearchTable, q: string) {
    const filters = nameColumns.map(column => `${column}.ilike.%${q}%`)
    if (/^\d+$/.test(q)) filters.push(`un_number.ilike.${q}%`)
    return this.#supabase
      .from(table)
      .select(['un_number', 'hazard_class', 'packing_group', ...nameColumns].join(', '))
      .or(filters.join(','))
      .order('un_number')
      .limit(PER_TABLE_LIMIT)
  }

  async #search(q: string): Promise<void> {
    const trimmed = sanitize(q)
    if (trimmed.length < MIN_QUERY_LENGTH) {
      this.results = []
      return
    }

    const currentRequest = ++this.#requestId
    this.isLoading = true
    try {
      const responses = await Promise.all(SEARCH_TABLES.map(t => this.#queryTable(t, trimmed)))
      if (currentRequest !== this.#requestId) return

      const rowsByMode: Partial<Record<Modal, Row[]>> = {}
      SEARCH_TABLES.forEach(({ mode }, i) => {
        const { data, error } = responses[i]!
        if (error) throw error
        rowsByMode[mode] = (data ?? []) as unknown as Row[]
      })
      this.results = mergeSearchRows(trimmed, rowsByMode)
      this.searchError = false
    }
    catch {
      if (currentRequest === this.#requestId) {
        this.results = []
        this.searchError = true
      }
    }
    finally {
      if (currentRequest === this.#requestId) this.isLoading = false
    }
  }
}
