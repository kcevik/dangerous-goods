import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdrBookViewerState,
  MAX_LOADED_WINDOWS,
  type ViewerDeps,
  type ViewerInit,
} from '$lib/regulations/adrBookViewer.svelte'
import type { BookHeading, BookHit, HitListResult, RenderedWindow } from '$lib/regulations/bookTypes'

// ── fixtures ─────────────────────────────────────────────────

function heading(text: string, path: string[]): BookHeading {
  return { level: path.length + 1, text, sectionNo: null, slug: `h-${text}`, line: 1, path }
}

const TABLE_A = heading('Kapitel 3.2', ['Teil 3'])
const CH_33 = heading('Kapitel 3.3', ['Teil 3'])

function hit(line: number, h: BookHeading | null = TABLE_A, code = '243'): BookHit {
  return { kind: 'sv', code, line, rank: 1, role: 'definition', context: `ctx ${line}`, heading: h }
}

function win(lineStart: number, lineEnd: number): RenderedWindow {
  return { html: `<p>${lineStart}-${lineEnd}</p>`, lineStart, lineEnd, headings: [] }
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function makeDeps(overrides: Partial<ViewerDeps> = {}): ViewerDeps & {
  fetchWindow: ReturnType<typeof vi.fn>
  searchText: ReturnType<typeof vi.fn>
  fetchCodeHits: ReturnType<typeof vi.fn>
} {
  return {
    fetchWindow: vi.fn(async ({ line }: { line: number }) => win(line - 10, line + 10)),
    searchText: vi.fn(async (): Promise<HitListResult> => ({ hits: [], total: 0, capped: false })),
    fetchCodeHits: vi.fn(async (): Promise<HitListResult> => ({ hits: [], total: 0, capped: false })),
    ...overrides,
  } as never
}

function makeInit(overrides: Partial<ViewerInit> = {}): ViewerInit {
  return {
    target: { kind: 'sv', code: '243' },
    term: '243',
    hits: [hit(100), hit(120), hit(140), hit(160), hit(180), hit(200), hit(220)],
    totalHits: 7,
    capped: false,
    windows: [win(1, 400)],
    currentIndex: 0,
    includeIncidental: false,
    totalLines: 5000,
    ...overrides,
  }
}

// ── tests ────────────────────────────────────────────────────

describe('AdrBookViewerState', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('labels the counter from the initial hit list', () => {
    const viewer = new AdrBookViewerState(makeInit(), makeDeps())
    expect(viewer.counterLabel).toBe('Treffer 1 von 7')
    expect(viewer.currentHit?.line).toBe(100)
    expect(viewer.canNavigate).toBe(true)
  })

  it('next and previous advance and wrap, flagging the wrap', async () => {
    const viewer = new AdrBookViewerState(makeInit(), makeDeps())
    await viewer.next()
    expect(viewer.currentIndex).toBe(1)
    expect(viewer.wrapped).toBe(false)

    await viewer.previous()
    await viewer.previous()
    expect(viewer.currentIndex).toBe(6)
    expect(viewer.wrapped).toBe(true)

    await viewer.next()
    expect(viewer.currentIndex).toBe(0)
    expect(viewer.wrapped).toBe(true)
  })

  it('fetches a far-away hit once, splices it in line order and resolves after', async () => {
    const init = makeInit({ hits: [hit(100), hit(3000)], totalHits: 2 })
    const deps = makeDeps({ fetchWindow: vi.fn(async () => win(2850, 3150)) })
    const viewer = new AdrBookViewerState(init, deps)

    await viewer.next()
    expect(deps.fetchWindow).toHaveBeenCalledTimes(1)
    expect(deps.fetchWindow).toHaveBeenCalledWith({ line: 3000 })
    expect(viewer.windows.map(w => w.lineStart)).toEqual([1, 2850])
    expect(viewer.currentIndex).toBe(1)
  })

  it('loads the adjacent window for a hit just past the loaded range, so no text repeats', async () => {
    const init = makeInit({ hits: [hit(100), hit(450)], totalHits: 2 })
    const deps = makeDeps({ fetchWindow: vi.fn(async () => win(401, 700)) })
    const viewer = new AdrBookViewerState(init, deps)

    await viewer.next()
    expect(deps.fetchWindow).toHaveBeenCalledWith({ line: 401, dir: 1 })
    expect(viewer.windows.map(w => [w.lineStart, w.lineEnd])).toEqual([[1, 400], [401, 700]])
  })

  it('loads the adjacent window for a hit just before a loaded range', async () => {
    const init = makeInit({ windows: [win(1000, 1300)], hits: [hit(1100), hit(900)], totalHits: 2 })
    const deps = makeDeps({ fetchWindow: vi.fn(async () => win(700, 999)) })
    const viewer = new AdrBookViewerState(init, deps)

    await viewer.next()
    expect(deps.fetchWindow).toHaveBeenCalledWith({ line: 999, dir: -1 })
    expect(viewer.windows.map(w => w.lineStart)).toEqual([700, 1000])
  })

  it('ignores a second next() while the first is still loading', async () => {
    const pending = deferred<RenderedWindow>()
    const init = makeInit({ hits: [hit(100), hit(3000), hit(4000)], totalHits: 3 })
    const deps = makeDeps({ fetchWindow: vi.fn(() => pending.promise) })
    const viewer = new AdrBookViewerState(init, deps)

    const first = viewer.next()
    expect(viewer.isLoading).toBe(true)
    await viewer.next()
    expect(deps.fetchWindow).toHaveBeenCalledTimes(1)

    pending.resolve(win(2850, 3150))
    await first
    expect(viewer.isLoading).toBe(false)
    expect(viewer.currentIndex).toBe(1)
  })

  it('keeps position and clears loading when a window fetch fails', async () => {
    const init = makeInit({ hits: [hit(100), hit(3000)], totalHits: 2 })
    const deps = makeDeps({ fetchWindow: vi.fn(async () => { throw new Error('offline') }) })
    const viewer = new AdrBookViewerState(init, deps)

    await viewer.next()
    expect(viewer.currentIndex).toBe(0)
    expect(viewer.isLoading).toBe(false)
    expect(viewer.loadFailed).toBe(true)
  })

  it('shows a capped counter when the server cut the list', async () => {
    const hits = Array.from({ length: 500 }, (_, i) => hit(10 + i * 0.1))
    const viewer = new AdrBookViewerState(makeInit({ hits, totalHits: 778, capped: true }), makeDeps())
    await viewer.next()
    await viewer.next()
    expect(viewer.counterLabel).toBe('Treffer 3 von 500+ (778 Treffer)')
    expect(viewer.isCapped).toBe(true)
  })

  it('says "Keine Treffer" and disables navigation for an empty list', () => {
    const viewer = new AdrBookViewerState(makeInit({ hits: [], totalHits: 0 }), makeDeps())
    expect(viewer.counterLabel).toBe('Keine Treffer')
    expect(viewer.canNavigate).toBe(false)
  })

  it('has no counter for a section target or an empty TOC view', () => {
    const section = new AdrBookViewerState(
      makeInit({ target: { kind: 'section', sectionNo: '1.1.3.6' }, term: '', hits: [], totalHits: 0 }),
      makeDeps(),
    )
    expect(section.counterLabel).toBe('')
    const toc = new AdrBookViewerState(makeInit({ target: null, term: '', hits: [], totalHits: 0 }), makeDeps())
    expect(toc.counterLabel).toBe('')
  })

  it('debounces free-text search, drops the target chip and resets to the first hit', async () => {
    const deps = makeDeps({
      searchText: vi.fn(async () => ({ hits: [hit(50), hit(60)], total: 2, capped: false })),
    })
    const viewer = new AdrBookViewerState(makeInit({ currentIndex: 3 }), deps)

    viewer.setTerm('Be')
    expect(viewer.target).toBeNull()
    expect(deps.searchText).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)

    expect(deps.searchText).toHaveBeenCalledTimes(1)
    expect(deps.searchText).toHaveBeenCalledWith('Be')
    expect(viewer.hits.map(h => h.line)).toEqual([50, 60])
    expect(viewer.currentIndex).toBe(0)
    expect(viewer.counterLabel).toBe('Treffer 1 von 2')
  })

  it('does not search for a single character and clears the hits', async () => {
    const deps = makeDeps()
    const viewer = new AdrBookViewerState(makeInit(), deps)
    viewer.setTerm('B')
    await vi.advanceTimersByTimeAsync(500)
    expect(deps.searchText).not.toHaveBeenCalled()
    expect(viewer.hits).toEqual([])
    expect(viewer.counterLabel).toBe('')
  })

  it('collapses rapid typing into one search and discards a stale reply', async () => {
    const slow = deferred<HitListResult>()
    const fast = deferred<HitListResult>()
    const deps = makeDeps({ searchText: vi.fn().mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise) })
    const viewer = new AdrBookViewerState(makeInit(), deps)

    viewer.setTerm('Ta')
    viewer.setTerm('Tan')
    await vi.advanceTimersByTimeAsync(300)
    expect(deps.searchText).toHaveBeenCalledTimes(1)
    expect(deps.searchText).toHaveBeenCalledWith('Tan')

    // a second settled term overtakes the first request
    viewer.setTerm('Tank')
    await vi.advanceTimersByTimeAsync(300)
    fast.resolve({ hits: [hit(70)], total: 1, capped: false })
    await vi.advanceTimersByTimeAsync(0)
    slow.resolve({ hits: [hit(1), hit(2), hit(3)], total: 3, capped: false })
    await vi.advanceTimersByTimeAsync(0)

    expect(viewer.hits.map(h => h.line)).toEqual([70])
  })

  it('re-requests code hits when incidental hits are toggled and restarts at the first', async () => {
    const deps = makeDeps({
      fetchCodeHits: vi.fn(async () => ({ hits: [hit(100), hit(4200)], total: 2, capped: false })),
    })
    const viewer = new AdrBookViewerState(makeInit({ currentIndex: 4 }), deps)

    await viewer.setIncludeIncidental(true)
    expect(deps.fetchCodeHits).toHaveBeenCalledWith({ kind: 'sv', code: '243' }, true)
    expect(viewer.includeIncidental).toBe(true)
    expect(viewer.hits).toHaveLength(2)
    expect(viewer.currentIndex).toBe(0)
  })

  it('loadAdjacent appends the next window and stops at the end of the document', async () => {
    const deps = makeDeps({ fetchWindow: vi.fn(async () => win(401, 700)) })
    const viewer = new AdrBookViewerState(makeInit(), deps)

    await viewer.loadAdjacent(1)
    expect(deps.fetchWindow).toHaveBeenCalledWith({ line: 401, dir: 1 })
    expect(viewer.windows.map(w => w.lineEnd)).toEqual([400, 700])

    const atEnd = new AdrBookViewerState(makeInit({ windows: [win(4700, 5000)] }), makeDeps())
    await atEnd.loadAdjacent(1)
    expect(atEnd.windows).toHaveLength(1)

    const atStart = makeDeps()
    const fromTop = new AdrBookViewerState(makeInit(), atStart)
    await fromTop.loadAdjacent(-1)
    expect(atStart.fetchWindow).not.toHaveBeenCalled()
  })

  it('flags overload at the window cap and reset() keeps only the current hit window', () => {
    const windows = Array.from({ length: MAX_LOADED_WINDOWS }, (_, i) => win(i * 100 + 1, i * 100 + 100))
    const viewer = new AdrBookViewerState(makeInit({ windows, hits: [hit(250)], totalHits: 1 }), makeDeps())
    expect(viewer.isOverloaded).toBe(true)

    viewer.reset()
    expect(viewer.windows.map(w => w.lineStart)).toEqual([201])
    expect(viewer.isOverloaded).toBe(false)
  })

  it('groups hits by the first two heading levels, keeping each hit index', () => {
    const hits = [hit(100, TABLE_A), hit(110, TABLE_A), hit(900, CH_33), hit(120, null)]
    const viewer = new AdrBookViewerState(makeInit({ hits, totalHits: 4 }), makeDeps())
    expect(viewer.hitsByChapter.map(g => [g.label, g.count])).toEqual([
      ['Teil 3 › Kapitel 3.2', 2],
      ['Teil 3 › Kapitel 3.3', 1],
      ['Ohne Kapitel', 1],
    ])
    expect(viewer.hitsByChapter[1]!.entries[0]!.index).toBe(2)
  })

  it('goTo jumps to a hit by index', async () => {
    const viewer = new AdrBookViewerState(makeInit(), makeDeps())
    await viewer.goTo(5)
    expect(viewer.currentIndex).toBe(5)
    await viewer.goTo(99)
    expect(viewer.currentIndex).toBe(5)
  })
})
