import {
  ADJACENT_WINDOW_LINES,
  type BookHit,
  type BookTarget,
  formatBookLabel,
  getBookLabel,
  type HitListResult,
  type Lang,
  MIN_BOOK_QUERY_LENGTH,
  type RenderedWindow,
} from './bookTypes'

const DEBOUNCE_MS = 300

/** Loaded windows before the viewer suggests a reset (spec §4, no virtualisation in v1). */
export const MAX_LOADED_WINDOWS = 40

/** A code target: the hit list comes from the index, ranked. */
export type CodeTarget = Extract<BookTarget, { kind: 'sv' | 'un' }>

/** What the page load hands the viewer. */
export interface ViewerInit {
  target: BookTarget | null
  term: string
  hits: BookHit[]
  totalHits: number
  capped: boolean
  windows: RenderedWindow[]
  currentIndex: number
  includeIncidental: boolean
  /** lines in the whole book, so reading forward knows where the end is */
  totalLines: number
}

/** Everything network-shaped, injected so the class never hard-wires `fetch`. */
export interface ViewerDeps {
  /** centred on `line`, or — with `dir` — starting after (1) / ending before (-1) it */
  fetchWindow: (request: { line: number, dir?: 1 | -1 }) => Promise<RenderedWindow>
  searchText: (term: string) => Promise<HitListResult>
  fetchCodeHits: (target: CodeTarget, includeIncidental: boolean) => Promise<HitListResult>
}

export interface ChapterGroup {
  label: string
  count: number
  /** `index` is the position in `hits`, so a click can `goTo` it */
  entries: { hit: BookHit, index: number }[]
}

/**
 * State for the ADR book viewer (spec §5.4).
 *
 * The hit list is index data, not DOM: it covers the whole book while only a few
 * rendered windows are loaded. Navigating to a hit outside them fetches the
 * window first and moves `currentIndex` only once it is there, so the page can
 * scroll to a mark that exists.
 */
export class AdrBookViewerState {
  target = $state<BookTarget | null>(null)
  term = $state('')
  hits = $state<BookHit[]>([])
  totalHits = $state(0)
  capped = $state(false)
  currentIndex = $state(0)
  includeIncidental = $state(false)
  /** ordered by line; gaps allowed */
  windows = $state<RenderedWindow[]>([])
  isLoading = $state(false)
  /** the last navigation wrapped around an end, for the `aria-live` message */
  wrapped = $state(false)
  /** the last window fetch failed; position is unchanged */
  loadFailed = $state(false)

  readonly totalLines: number
  readonly lang: Lang

  readonly #deps: ViewerDeps
  #debounceTimer: ReturnType<typeof setTimeout> | null = null
  #requestId = 0

  constructor(init: ViewerInit, deps: ViewerDeps, lang: Lang = 'de') {
    this.target = init.target
    this.term = init.term
    this.hits = init.hits
    this.totalHits = init.totalHits
    this.capped = init.capped
    this.windows = [...init.windows].sort((a, b) => a.lineStart - b.lineStart)
    this.currentIndex = clampIndex(init.currentIndex, init.hits.length)
    this.includeIncidental = init.includeIncidental
    this.totalLines = init.totalLines
    this.#deps = deps
    this.lang = lang
  }

  readonly currentHit = $derived<BookHit | null>(this.hits[this.currentIndex] ?? null)

  readonly canNavigate = $derived(this.hits.length > 0 && !this.isLoading)

  readonly isCapped = $derived(this.capped || this.totalHits > this.hits.length)

  readonly isOverloaded = $derived(this.windows.length >= MAX_LOADED_WINDOWS)

  /** Whether the bar is in a mode that has a hit list at all. */
  readonly #searching = $derived(
    this.target?.kind === 'sv' || this.target?.kind === 'un' || this.target?.kind === 'q'
    || this.term.trim().length >= MIN_BOOK_QUERY_LENGTH,
  )

  readonly counterLabel = $derived.by(() => {
    if (!this.#searching) return ''
    if (this.hits.length === 0) return getBookLabel(this.lang, 'noHits')
    const total = this.isCapped
      ? formatBookLabel(this.lang, 'cappedTotal', { shown: this.hits.length, total: this.totalHits })
      : String(this.hits.length)
    return formatBookLabel(this.lang, 'hitCounter', { current: this.currentIndex + 1, total })
  })

  readonly hitsByChapter = $derived.by<ChapterGroup[]>(() => {
    const groups = new Map<string, ChapterGroup>()
    this.hits.forEach((hit, index) => {
      const trail = hit.heading ? [...hit.heading.path, hit.heading.text].slice(0, 2) : []
      const label = trail.length > 0 ? trail.join(' › ') : getBookLabel(this.lang, 'noChapter')
      let group = groups.get(label)
      if (!group) {
        group = { label, count: 0, entries: [] }
        groups.set(label, group)
      }
      group.count++
      group.entries.push({ hit, index })
    })
    return [...groups.values()]
  })

  // ── navigation ─────────────────────────────────────────────

  async next(): Promise<void> {
    if (this.hits.length === 0) return
    const to = (this.currentIndex + 1) % this.hits.length
    await this.#moveTo(to, to === 0 && this.hits.length > 1)
  }

  async previous(): Promise<void> {
    if (this.hits.length === 0) return
    const to = (this.currentIndex - 1 + this.hits.length) % this.hits.length
    await this.#moveTo(to, to === this.hits.length - 1 && this.hits.length > 1)
  }

  async goTo(index: number): Promise<void> {
    if (index < 0 || index >= this.hits.length) return
    await this.#moveTo(index, false)
  }

  async #moveTo(index: number, wrapped: boolean): Promise<void> {
    // one navigation at a time: rapid presses must not queue up scroll jumps
    if (this.isLoading) return
    const hit = this.hits[index]
    if (!hit) return
    if (!(await this.ensureLineLoaded(hit.line))) return
    this.currentIndex = index
    this.wrapped = wrapped
  }

  /** Makes sure a window covers `line`. Resolves false when the fetch failed. */
  async ensureLineLoaded(line: number): Promise<boolean> {
    if (this.#covering(line)) return true

    const before = this.windows.findLast(w => w.lineEnd < line)
    const after = this.windows.find(w => w.lineStart > line)
    const request
      = before && line - before.lineEnd <= ADJACENT_WINDOW_LINES
        ? { line: before.lineEnd + 1, dir: 1 as const }
        : after && after.lineStart - line <= ADJACENT_WINDOW_LINES
          ? { line: after.lineStart - 1, dir: -1 as const }
          : { line }

    return this.#fetchInto(request)
  }

  /** Reads forward (1) or backward (-1) from the loaded range. */
  async loadAdjacent(direction: 1 | -1): Promise<void> {
    if (this.isLoading || this.windows.length === 0) return
    if (direction === 1) {
      const last = this.windows.at(-1)!
      if (last.lineEnd >= this.totalLines) return
      await this.#fetchInto({ line: last.lineEnd + 1, dir: 1 })
    }
    else {
      const first = this.windows[0]!
      if (first.lineStart <= 1) return
      await this.#fetchInto({ line: first.lineStart - 1, dir: -1 })
    }
  }

  /** Loads the gap between two loaded windows, from the earlier one's end. */
  async loadGapAfter(windowIndex: number): Promise<void> {
    const w = this.windows[windowIndex]
    if (!w || this.isLoading) return
    await this.#fetchInto({ line: w.lineEnd + 1, dir: 1 })
  }

  /** Drops every window except the one holding the current hit (or the first). */
  reset(): void {
    const line = this.currentHit?.line
    const keep = (line !== undefined ? this.#covering(line) : null) ?? this.windows[0]
    this.windows = keep ? [keep] : []
  }

  #covering(line: number): RenderedWindow | null {
    return this.windows.find(w => w.lineStart <= line && line <= w.lineEnd) ?? null
  }

  async #fetchInto(request: { line: number, dir?: 1 | -1 }): Promise<boolean> {
    this.isLoading = true
    this.loadFailed = false
    try {
      const fetched = await this.#deps.fetchWindow(request)
      this.#splice(fetched)
      return true
    }
    catch {
      this.loadFailed = true
      return false
    }
    finally {
      this.isLoading = false
    }
  }

  #splice(fetched: RenderedWindow): void {
    // a window already wholly inside a loaded one adds nothing
    if (this.windows.some(w => w.lineStart <= fetched.lineStart && fetched.lineEnd <= w.lineEnd)) return
    // loaded windows wholly inside the new one are superseded by it
    const kept = this.windows.filter(w => !(fetched.lineStart <= w.lineStart && w.lineEnd <= fetched.lineEnd))
    this.windows = [...kept, fetched].sort((a, b) => a.lineStart - b.lineStart)
  }

  // ── search ─────────────────────────────────────────────────

  /** Typing switches to free-text mode; the search runs 300 ms after the last keystroke. */
  setTerm(value: string): void {
    this.term = value
    this.target = null
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
    // invalidate any reply still in flight for an older term
    this.#requestId++

    const trimmed = value.trim()
    if (trimmed.length < MIN_BOOK_QUERY_LENGTH) {
      this.#replaceHits({ hits: [], total: 0, capped: false })
      return
    }

    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null
      void this.#runSearch(trimmed)
    }, DEBOUNCE_MS)
  }

  async #runSearch(term: string): Promise<void> {
    const id = ++this.#requestId
    try {
      const result = await this.#deps.searchText(term)
      if (id !== this.#requestId) return
      this.#replaceHits(result)
      if (result.hits[0]) await this.ensureLineLoaded(result.hits[0].line)
    }
    catch {
      if (id === this.#requestId) this.#replaceHits({ hits: [], total: 0, capped: false })
    }
  }

  /** Only meaningful for a code target; free text has no ranks to filter. */
  async setIncludeIncidental(value: boolean): Promise<void> {
    this.includeIncidental = value
    const target = this.target
    if (target?.kind !== 'sv' && target?.kind !== 'un') return

    const id = ++this.#requestId
    try {
      const result = await this.#deps.fetchCodeHits(target, value)
      if (id !== this.#requestId) return
      this.#replaceHits(result)
    }
    catch {
      // keep the current list; the checkbox state still reflects the request
    }
  }

  #replaceHits(result: HitListResult): void {
    this.hits = result.hits
    this.totalHits = result.total
    this.capped = result.capped
    this.currentIndex = 0
    this.wrapped = false
  }
}

function clampIndex(index: number, length: number): number {
  if (!Number.isInteger(index) || index < 0 || index >= length) return 0
  return index
}
