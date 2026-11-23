import type { SupabaseClient } from '@supabase/supabase-js'
import type { Modal } from '$lib/multimodal/types'
import { matchSynonyms } from './matchSynonyms'
import { namePatterns, parseUnNumber, PLACEHOLDER_UN, searchableLength, unPrefix } from './normalize'
import {
  buildSearchResults,
  DETAIL_LIMIT,
  DETAIL_ROW_LIMIT,
  MIN_QUERY_LENGTH,
  NAME_ROW_LIMIT,
  PAGE_SIZE,
  rankSearchRows,
  type Row,
  type RowsByMode,
  type SearchResult,
  SEARCH_TABLES,
  type SearchTable,
  synonymHitsFor,
} from './results'
import type { Synonym } from './synonyms'

export * from './results'

const DEBOUNCE_MS = 300

export interface SearchOptions {
  locked?: boolean
  /** the query the page was opened with (`/suche?q=…`); applied by start() */
  initialQuery?: string
  /** called (debounced) with the trimmed query once it settles — the page keeps `?q=` in sync */
  onCommit?: (query: string) => void
}

/**
 * Live search state for /suche and QuickSearch. Setting `query` debounces a name search across
 * the ADR, RID, IMDG and ICAO tables plus the curated synonyms; a UN number ("1203", "UN1203",
 * "un-1203") selects immediately without querying.
 * A failed request fails the whole search (`searchError`) — never shown as "no results" — and a
 * list that may be cut is flagged (`incomplete`), never presented as complete.
 */
export class SearchState {
  #query = $state('')
  results = $state<SearchResult[]>([])
  /** synonyms without UN numbers that the query hit ("in der Regel kein Gefahrgut") */
  hints = $state<Synonym[]>([])
  /** the result list may miss matches (a table hit its row limit or too many UN numbers matched) */
  incomplete = $state(false)
  visibleCount = $state(PAGE_SIZE)
  selectedUn = $state<string | null>(null)
  isLoading = $state(false)
  searchError = $state(false)
  /** a successful search for the current query has finished — only then is "no results" true */
  answered = $state(false)
  /** too short to search once separators and stripped characters are removed */
  readonly belowMinimum: boolean = $derived(searchableLength(this.#query) < MIN_QUERY_LENGTH)
  readonly visibleResults: SearchResult[] = $derived(this.results.slice(0, this.visibleCount))
  readonly hasMore: boolean = $derived(this.results.length > this.visibleCount)

  /** Locked accounts (not yet activated) never query; the page shows a lock notice instead. */
  readonly locked: boolean

  readonly #supabase: SupabaseClient
  readonly #onCommit: ((query: string) => void) | undefined
  #debounceTimer: ReturnType<typeof setTimeout> | null = null
  #commitTimer: ReturnType<typeof setTimeout> | null = null
  #requestId = 0

  constructor(supabase: SupabaseClient, options: SearchOptions = {}) {
    this.#supabase = supabase
    this.locked = options.locked ?? false
    this.#onCommit = options.onCommit
    this.#query = options.initialQuery ?? ''
  }

  get query(): string {
    return this.#query
  }

  set query(value: string) {
    this.#apply(value, false)
  }

  /** run the initial query (from `?q=`) at once — call it in the browser, after mount */
  start(): void {
    if (this.#query) this.#apply(this.#query, true)
  }

  #apply(value: string, immediate: boolean): void {
    this.#query = value
    if (this.locked) return
    // every query change invalidates in-flight responses (review fix 2026-11-08)
    this.#requestId++
    this.isLoading = false
    this.searchError = false
    this.answered = false
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
    this.#scheduleCommit(value, immediate)

    const un = parseUnNumber(value)
    if (un && un !== PLACEHOLDER_UN) {
      this.#clearResults()
      this.selectedUn = un
      return
    }

    this.selectedUn = null
    if (searchableLength(value) < MIN_QUERY_LENGTH) {
      this.#clearResults()
      return
    }
    if (immediate) void this.#search(value)
    else this.#debounceTimer = setTimeout(() => this.#search(value), DEBOUNCE_MS)
  }

  #scheduleCommit(value: string, immediate: boolean): void {
    const onCommit = this.#onCommit
    if (!onCommit) return
    if (this.#commitTimer) clearTimeout(this.#commitTimer)
    if (immediate) onCommit(value.trim())
    else this.#commitTimer = setTimeout(() => onCommit(value.trim()), DEBOUNCE_MS)
  }

  #clearResults(): void {
    this.results = []
    this.hints = []
    this.incomplete = false
    this.visibleCount = PAGE_SIZE
  }

  select(unNumber: string): void {
    this.selectedUn = unNumber
    this.#clearResults()
  }

  /** show the next page of an already loaded result list */
  showMore(): void {
    this.visibleCount += PAGE_SIZE
  }

  /** re-run the current query at once (after a failure) */
  retry(): void {
    if (this.locked) return
    void this.#search(this.#query)
  }

  #queryNames({ table, nameColumns }: SearchTable, patterns: string[], prefix: string | null) {
    const filters = patterns.flatMap(p => nameColumns.map(column => `${column}.ilike.${p}`))
    if (prefix) filters.push(`un_number.like.${prefix}%`)
    return this.#supabase
      .from(table)
      .select(['un_number', ...nameColumns].join(', '))
      .or(filters.join(','))
      .neq('un_number', PLACEHOLDER_UN)
      .order('un_number')
      .limit(NAME_ROW_LIMIT + 1)
  }

  #queryDetails({ table, nameColumns }: SearchTable, unNumbers: string[]) {
    return this.#supabase
      .from(table)
      .select(['un_number', 'hazard_class', 'packing_group', ...nameColumns].join(', '))
      .in('un_number', unNumbers)
      .limit(DETAIL_ROW_LIMIT)
  }

  async #search(q: string): Promise<void> {
    if (searchableLength(q) < MIN_QUERY_LENGTH) {
      this.#clearResults()
      return
    }
    const patterns = namePatterns(q)
    const prefix = unPrefix(q)

    const currentRequest = ++this.#requestId
    this.isLoading = true
    try {
      const nameResponses = await Promise.all(SEARCH_TABLES.map(t => this.#queryNames(t, patterns, prefix)))
      if (currentRequest !== this.#requestId) return

      let incomplete = false
      const nameRows: RowsByMode = {}
      SEARCH_TABLES.forEach(({ mode }, i) => {
        const { data, error } = nameResponses[i]!
        if (error) throw error
        let rows = (data ?? []) as unknown as Row[]
        if (rows.length > NAME_ROW_LIMIT) {
          incomplete = true
          rows = rows.slice(0, NAME_ROW_LIMIT)
        }
        nameRows[mode] = rows
      })

      const ranked = rankSearchRows(q, nameRows)
      if (ranked.length > DETAIL_LIMIT) incomplete = true
      const top = ranked.slice(0, DETAIL_LIMIT)
      const synonyms = matchSynonyms(q)
      const synonymHits = synonymHitsFor(synonyms, top.map(h => h.unNumber))
      const unNumbers = [...top.map(h => h.unNumber), ...synonymHits.map(h => h.unNumber)]

      const detail: RowsByMode = {}
      if (unNumbers.length > 0) {
        const detailResponses = await Promise.all(SEARCH_TABLES.map(t => this.#queryDetails(t, unNumbers)))
        if (currentRequest !== this.#requestId) return
        SEARCH_TABLES.forEach(({ mode }, i) => {
          const { data, error } = detailResponses[i]!
          if (error) throw error
          const rows = (data ?? []) as unknown as Row[]
          if (rows.length >= DETAIL_ROW_LIMIT) incomplete = true
          detail[mode] = rows
        })
      }

      this.results = buildSearchResults(top, synonymHits, detail)
      this.hints = synonyms.filter(s => s.unNumbers.length === 0)
      this.incomplete = incomplete
      this.visibleCount = PAGE_SIZE
      this.searchError = false
      this.answered = true
    }
    catch {
      if (currentRequest === this.#requestId) {
        this.#clearResults()
        this.searchError = true
      }
    }
    finally {
      if (currentRequest === this.#requestId) this.isLoading = false
    }
  }
}
