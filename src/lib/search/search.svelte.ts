import type { SupabaseClient } from '@supabase/supabase-js'

export interface SearchResult {
  unNumber: string
  name: string | null
  nameEn: string | null
  nameFr: string | null
  hazardClass: string | null
  packingGroup: string | null
}

const UN_NUMBER_RE = /^\d{4}$/
export const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

/**
 * Live search state for /search. Setting `query` debounces a name search
 * against adr_entries; a 4-digit UN number selects immediately without querying.
 */
export class SearchState {
  #query = $state('')
  results = $state<SearchResult[]>([])
  selectedUn = $state<string | null>(null)
  isLoading = $state(false)

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
    const trimmed = value.trim()
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)

    // 4-digit UN number: load tool immediately, skip debounce
    if (UN_NUMBER_RE.test(trimmed)) {
      this.results = []
      this.selectedUn = trimmed
      return
    }

    this.selectedUn = null
    if (trimmed.length < MIN_QUERY_LENGTH) {
      this.results = []
      return
    }
    this.#debounceTimer = setTimeout(() => this.#search(value), DEBOUNCE_MS)
  }

  select(unNumber: string): void {
    this.selectedUn = unNumber
    this.results = []
  }

  async #search(q: string): Promise<void> {
    // strip PostgREST filter delimiters so user input can't break the .or() string
    const trimmed = q.trim().replace(/[,()]/g, '')
    if (trimmed.length < MIN_QUERY_LENGTH) {
      this.results = []
      return
    }

    const currentRequest = ++this.#requestId
    this.isLoading = true
    try {
      const filters = [
        `name.ilike.%${trimmed}%`,
        `name_en.ilike.%${trimmed}%`,
        `name_fr.ilike.%${trimmed}%`,
      ]
      if (/^\d+$/.test(trimmed)) filters.push(`un_number.ilike.${trimmed}%`)

      const { data, error } = await this.#supabase
        .from('adr_entries')
        .select('un_number, name, name_en, name_fr, hazard_class, packing_group')
        .or(filters.join(','))
        .order('un_number')
        .limit(20)

      if (currentRequest !== this.#requestId) return
      if (error) throw error
      this.results = (data ?? []).map(r => ({
        unNumber: String(r.un_number),
        name: r.name as string | null,
        nameEn: r.name_en as string | null,
        nameFr: r.name_fr as string | null,
        hazardClass: r.hazard_class as string | null,
        packingGroup: r.packing_group as string | null,
      }))
    }
    catch {
      if (currentRequest === this.#requestId) this.results = []
    }
    finally {
      if (currentRequest === this.#requestId) this.isLoading = false
    }
  }
}
