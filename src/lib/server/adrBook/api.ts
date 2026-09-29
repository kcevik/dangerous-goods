import type { BookIndex } from './index'
import {
  type BookHit,
  type BookTarget,
  type HitListResult,
  HIT_LIMIT,
  MAX_BOOK_QUERY_LENGTH,
  MIN_BOOK_QUERY_LENGTH,
  type RenderedWindow,
  type TocEntry,
} from '$lib/regulations/bookTypes'
import { renderSlice } from './render'
import { DEFAULT_WINDOW_AFTER, DEFAULT_WINDOW_BEFORE, sliceAround } from './slice'

/**
 * Queries over the in-memory ADR book index.
 *
 * ENTITLEMENT: none of this checks who is asking. The book is licensed content and
 * it does not live in Postgres, so there is no row-level-security backstop behind
 * these functions — see spec §7.2. **Every caller must have confirmed
 * `isActive` before calling in.** Today that means the page load and the two
 * endpoints under `/regelwerk/[mode]`; any new reader must repeat the check.
 */

/**
 * Rendered windows kept per index. Each entry is one rendered slice, so roughly
 * 100 KB of HTML in the Table A worst case: 32 entries is about 3 MB per worker,
 * on top of the ~25 MB index. Sized to cover a reader moving through a chapter
 * without re-rendering, not to hold the whole book.
 */
export const WINDOW_CACHE_SIZE = 32

/** Keyed by index identity, so replacing the index discards its cache with it. */
const windowCaches = new WeakMap<BookIndex, Map<string, RenderedWindow>>()

function cacheFor(index: BookIndex): Map<string, RenderedWindow> {
  let cache = windowCaches.get(index)
  if (!cache) {
    cache = new Map()
    windowCaches.set(index, cache)
  }
  return cache
}

/** Test-only: drops every cached window. */
export function clearWindowCache(): void {
  // WeakMap has no iteration; clearing the known caches means clearing per index,
  // so tests pass their index through the normal path and get a fresh Map here
  cachedIndexes.forEach(index => windowCaches.delete(index))
  cachedIndexes.length = 0
}

const cachedIndexes: BookIndex[] = []

// ── Text normalisation ───────────────────────────────────────

const COMBINING_MARKS = /[̀-ͯ]/g

/** Case- and diacritic-insensitive form, matching the client-side highlighter. */
function loosely(text: string): string {
  return text
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
}

/** Strips the markup the source embeds, so a context snippet reads as prose. */
function stripMarkup(line: string): string {
  return line.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function contextAround(line: string, at: number, width = 180): string {
  const text = stripMarkup(line)
  if (text.length <= width) return text
  const start = Math.max(0, Math.min(at - Math.floor(width / 2), text.length - width))
  const slice = text.slice(start, start + width)
  return (start > 0 ? `…${slice.slice(1)}` : slice)
}

// ── Target resolution ────────────────────────────────────────

/** `640D` → `640`; anything else → null. */
function numericParent(code: string): string | null {
  const match = /^(\d{2,3})[A-Z]$/.exec(code)
  return match ? match[1]! : null
}

function bestHit(index: BookIndex, kind: 'sv' | 'un', code: string): BookHit | null {
  return index.hits.get(`${kind}:${code}`)?.[0] ?? null
}

/**
 * Where to put the reader for a given target.
 *
 * For a provision this is its own paragraph in chapter 3.3. Lettered provisions
 * (`640A`…`640O`) have no paragraph of their own — the ADR defines them inside
 * the 640 paragraph — so when a lettered code has no rank-1 hit we resolve its
 * numeric parent instead. Landing on an arbitrary Table A cell would be useless
 * for an officer transcribing a tank code, and inventing a definition would be a
 * lie about the text. The returned hit carries the parent's `code`, so the UI can
 * tell the reader what it actually opened.
 */
export function resolvePrimaryHit(index: BookIndex, target: BookTarget): BookHit | null {
  if (target.kind === 'section') {
    const heading = index.headings.find(h => h.sectionNo === target.sectionNo)
    if (!heading) return null
    return {
      kind: 'sv',
      code: target.sectionNo,
      line: heading.line,
      rank: 1,
      role: 'definition',
      context: heading.text,
      heading,
    }
  }

  if (target.kind === 'q') {
    return searchText(index, target.term, 1).hits[0] ?? null
  }

  const direct = bestHit(index, target.kind, target.code)
  if (direct && direct.rank === 1) return direct

  if (target.kind === 'sv') {
    const parent = numericParent(target.code)
    if (parent) {
      const viaParent = bestHit(index, 'sv', parent)
      if (viaParent && viaParent.rank === 1) return viaParent
    }
  }

  return direct
}

// ── Hit lists ────────────────────────────────────────────────

export function hitsFor(
  index: BookIndex,
  kind: 'sv' | 'un',
  code: string,
  opts: { includeIncidental: boolean, limit?: number },
): HitListResult {
  const limit = opts.limit ?? HIT_LIMIT
  const all = index.hits.get(`${kind}:${code}`) ?? []
  const visible = opts.includeIncidental ? all : all.filter(hit => hit.rank < 5)

  return {
    // already sorted by rank then line in the index, so the cap can never hide
    // a better-ranked hit than one it keeps
    hits: visible.slice(0, limit),
    total: visible.length,
    capped: visible.length > limit,
  }
}

/**
 * Free-text search over the source lines.
 *
 * Scans the line array rather than rendered HTML, so a search for `table` cannot
 * match `<table>`. The term is used as a literal: no regular expression is built
 * from user input, so neither metacharacters nor catastrophic backtracking apply.
 */
export function searchText(index: BookIndex, term: string, limit = HIT_LIMIT): HitListResult {
  const trimmed = term.trim()
  if (trimmed.length < MIN_BOOK_QUERY_LENGTH || trimmed.length > MAX_BOOK_QUERY_LENGTH) {
    return { hits: [], total: 0, capped: false }
  }

  const needle = loosely(trimmed)
  const hits: BookHit[] = []
  let total = 0

  for (let i = 0; i < index.lines.length; i++) {
    const line = index.lines[i]!
    // headings are structure, not content: a hit there scrolls to a caption
    if (line.startsWith('#')) continue

    const at = loosely(line).indexOf(needle)
    if (at === -1) continue

    total++
    if (hits.length < limit) {
      hits.push({
        kind: 'un',
        code: trimmed,
        line: i + 1,
        rank: 3,
        role: 'crossReference',
        context: contextAround(line, at),
        heading: headingFor(index, i + 1),
      })
    }
  }

  return { hits, total, capped: total > limit }
}

/** Nearest heading at or above `line`. */
function headingFor(index: BookIndex, line: number) {
  let found = null
  for (const heading of index.headings) {
    if (heading.line > line) break
    found = heading
  }
  return found
}

// ── Windows ──────────────────────────────────────────────────

/**
 * One rendered window of the book, centred on `line`.
 *
 * Cached by the snapped range, so two targets a few lines apart that resolve to
 * the same window share one render.
 */
export function windowAt(
  index: BookIndex,
  line: number,
  before = DEFAULT_WINDOW_BEFORE,
  after = DEFAULT_WINDOW_AFTER,
): RenderedWindow {
  const slice = sliceAround(index.lines, line, before, after)
  const key = `${slice.lineStart}:${slice.lineEnd}:${slice.syntheticLines}`

  const cache = cacheFor(index)
  if (!cachedIndexes.includes(index)) cachedIndexes.push(index)

  const hit = cache.get(key)
  if (hit) {
    // refresh recency
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }

  const headings: TocEntry[] = index.headings
    .filter(h => h.line >= slice.lineStart && h.line <= slice.lineEnd)
    .map(({ level, text, sectionNo, slug, line: at }) => ({ level, text, sectionNo, slug, line: at }))

  const rendered: RenderedWindow = {
    // the slug registry is the document's own, so anchors stay unique and stable
    // across windows rather than being renumbered per slice
    html: renderSlice(slice.lines.join('\n'), { slugRegistry: new Set(), sourceLines: sourceLinesOf(index, slice) }),
    lineStart: slice.lineStart,
    lineEnd: slice.lineEnd,
    headings,
  }

  cache.set(key, rendered)
  if (cache.size > WINDOW_CACHE_SIZE) {
    const oldest = cache.keys().next()
    if (!oldest.done) cache.delete(oldest.value)
  }

  return rendered
}

/**
 * Book line of each line in a slice. The slice is the window's source lines with
 * a re-emitted header in front (no book line) and some repeated table headers
 * dropped, so the rendered lines are a subsequence of those — matched greedily.
 */
function sourceLinesOf(index: BookIndex, slice: ReturnType<typeof sliceAround>): (number | null)[] {
  const raw: { text: string, line: number | null }[] = [
    ...slice.lines.slice(0, slice.syntheticLines).map(text => ({ text, line: null })),
    ...index.lines.slice(slice.lineStart - 1, slice.lineEnd).map((text, i) => ({ text, line: slice.lineStart + i })),
  ]
  let at = 0
  return slice.lines.map((text) => {
    while (at < raw.length && raw[at]!.text !== text) at++
    return at < raw.length ? raw[at++]!.line : null
  })
}

// ── Table of contents ────────────────────────────────────────

export function toc(index: BookIndex, maxLevel = 3): TocEntry[] {
  return index.headings
    .filter(h => h.level <= maxLevel)
    .map(({ level, text, sectionNo, slug, line }) => ({ level, text, sectionNo, slug, line }))
}
