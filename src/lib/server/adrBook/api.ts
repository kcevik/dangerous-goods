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

/** Stands where markup splits the rendered text: no match may span it. */
const BOUNDARY = '\u0001'
const TABLE_ROW = /^\s*\|/
const ALIGNMENT_ROW = /^\s*\|[\s:|-]*\|\s*$/
const NUMBERING_ROW = /^\s*\|\s*\(1\)\s*\|/
const EMPTY_ROW = /^\s*\|(?:\s*\|)+\s*$/
const LIST_MARKER = /^\s*(?:[-*+]|\d{1,9}[.)])\s+/
const ENTITIES: [RegExp, string][] = [
  [/&nbsp;/g, '\u00A0'], [/&lt;/g, '<'], [/&gt;/g, '>'], [/&quot;/g, '"'], [/&#0*39;|&apos;/g, '\''], [/&amp;/g, '&'],
]

/**
 * A source line as the reader sees it on the page: markup removed, and a
 * boundary wherever the rendered text is split into separate text nodes (a tag,
 * bold, a table cell). The viewer's highlighter never matches across such a
 * split, so the server must not either — otherwise the counter would promise a
 * hit the page cannot show.
 *
 * Null for lines that are structure, not text: headings, and table header,
 * alignment, numbering and filler rows. Header rows also repeat at every page
 * break of Table A and the slicer drops those repeats, so a hit on one would be
 * unreachable.
 */
function visibleText(lines: string[], i: number): string | null {
  const line = lines[i]!
  if (line.startsWith('#')) return null
  const isRow = TABLE_ROW.test(line)
  if (isRow && (ALIGNMENT_ROW.test(line) || NUMBERING_ROW.test(line) || EMPTY_ROW.test(line))) return null
  if (isRow && ALIGNMENT_ROW.test(lines[i + 1] ?? '')) return null

  let text = isRow ? line.replace(/\|/g, BOUNDARY) : line.replace(LIST_MARKER, '')
  text = text
    // an image becomes a placeholder the highlighter skips; a link shows its text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, BOUNDARY)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, `${BOUNDARY}$1${BOUNDARY}`)
    .replace(/<[^>]*>/g, BOUNDARY)
    .replace(/\*\*|__/g, BOUNDARY)
  for (const [pattern, replacement] of ENTITIES) text = text.replace(pattern, replacement)
  return text
}

/**
 * Free-text search over the source lines.
 *
 * Scans the line array rather than rendered HTML, so a search for `table` cannot
 * match `<table>`. The term is used as a literal: no regular expression is built
 * from user input, so neither metacharacters nor catastrophic backtracking apply.
 *
 * One hit per occurrence, numbered within its line (`ordinal`), found the way the
 * viewer's highlighter finds matches — so "Treffer k von n" counts exactly the
 * highlighted, reachable matches, including a term that appears twice on a line.
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
    // headings are structure, not content: a hit there scrolls to a caption
    const visible = visibleText(index.lines, i)
    if (visible === null) continue

    const haystack = loosely(visible)
    let ordinal = 0
    for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) {
      total++
      if (hits.length < limit) {
        hits.push({
          kind: 'un',
          code: trimmed,
          line: i + 1,
          rank: 3,
          role: 'crossReference',
          context: contextAround(visible.replaceAll(BOUNDARY, ' '), at),
          heading: headingFor(index, i + 1),
          ordinal,
        })
      }
      ordinal++
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
    // every heading takes the index's slug, which is unique across the whole
    // document, so an anchor never depends on which window rendered it; the
    // per-window registry only de-duplicates headings the index does not know
    html: renderSlice(slice.lines.join('\n'), {
      slugRegistry: new Set(),
      sourceLines: sourceLinesOf(index, slice),
      headingSlugs: headingSlugsOf(index),
    }),
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

/** Book line → heading slug, built once per index. */
const headingSlugMaps = new WeakMap<BookIndex, Map<number, string>>()

function headingSlugsOf(index: BookIndex): Map<number, string> {
  let map = headingSlugMaps.get(index)
  if (!map) {
    map = new Map(index.headings.map(h => [h.line, h.slug]))
    headingSlugMaps.set(index, map)
  }
  return map
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
