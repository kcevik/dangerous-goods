import { error } from '@sveltejs/kit'
import {
  ADJACENT_WINDOW_LINES,
  type BookHit,
  type BookMode,
  type BookPageData,
  type BookTarget,
  HIT_LIMIT,
  MAX_BOOK_QUERY_LENGTH,
  MIN_BOOK_QUERY_LENGTH,
  SV_CODE_RE,
  UN_NUMBER_RE,
} from '$lib/regulations/bookTypes'
import { hitsFor, resolvePrimaryHit, searchText, toc, windowAt } from '$lib/server/adrBook/api'
import { getBookIndex } from '$lib/server/adrBook/index'
import type { PageServerLoad } from './$types'

const SECTION_RE = /^\d+(?:\.\d+){0,5}$/

/** Exactly one target is honoured: sv > un > section > q (spec §1.2). */
function parseTarget(params: URLSearchParams): BookTarget | null {
  const sv = params.get('sv')
  if (sv !== null) {
    if (!SV_CODE_RE.test(sv)) error(400, 'Ungültige Sondervorschrift')
    return { kind: 'sv', code: sv }
  }
  const un = params.get('un')
  if (un !== null) {
    if (!UN_NUMBER_RE.test(un)) error(400, 'Ungültige UN-Nummer')
    return { kind: 'un', code: un }
  }
  const section = params.get('section')
  if (section !== null) {
    if (!SECTION_RE.test(section)) error(400, 'Ungültiger Abschnitt')
    return { kind: 'section', sectionNo: section }
  }
  const q = params.get('q')?.trim()
  if (q) {
    if (q.length > MAX_BOOK_QUERY_LENGTH) error(400, 'Suchbegriff zu lang')
    if (q.length >= MIN_BOOK_QUERY_LENGTH) return { kind: 'q', term: q }
  }
  return null
}

/** `?hit` is 1-based; anything outside the list starts at the first hit. */
function parseHitIndex(raw: string | null, length: number): number {
  if (raw === null || !/^\d+$/.test(raw)) return 0
  const n = Number(raw)
  return n >= 1 && n <= length ? n - 1 : 0
}

export const load: PageServerLoad = async ({ url, params, parent }): Promise<BookPageData> => {
  const mode = params.mode as BookMode
  const { isActive } = await parent()
  // This check IS the gate: the book is a file, so no RLS stands behind it (spec §7.2).
  if (!isActive) return { locked: true, mode }

  let target = parseTarget(url.searchParams)
  const includeIncidental = url.searchParams.get('all') === '1'
  const index = getBookIndex()

  let hits: BookHit[] = []
  let totalHits = 0
  let capped = false
  let focusLine: number | null = null
  let notFound: string | null = null
  let fallbackFrom: string | null = null

  if (target?.kind === 'sv' || target?.kind === 'un') {
    const primary = resolvePrimaryHit(index, target)
    // A lettered provision without its own paragraph becomes its parent: the reader
    // lands on — and walks through — the paragraph that defines it, and the marks
    // search for the same code the hits describe.
    const codeTarget = primary && primary.code !== target.code
      ? { kind: target.kind, code: primary.code }
      : target
    if (codeTarget !== target) fallbackFrom = target.code
    target = codeTarget
    const list = hitsFor(index, codeTarget.kind, codeTarget.code, { includeIncidental, limit: HIT_LIMIT })
    ;({ hits, total: totalHits, capped } = list)
    if (hits.length === 0) notFound = codeTarget.code
  }
  else if (target?.kind === 'section') {
    const primary = resolvePrimaryHit(index, target)
    if (primary) focusLine = primary.line
    else notFound = target.sectionNo
  }
  else if (target?.kind === 'q') {
    ;({ hits, total: totalHits, capped } = searchText(index, target.term, HIT_LIMIT))
  }

  const currentIndex = parseHitIndex(url.searchParams.get('hit'), hits.length)
  focusLine = hits[currentIndex]?.line ?? focusLine

  return {
    locked: false,
    mode,
    target,
    term: target?.kind === 'q' ? target.term : target?.kind === 'section' ? '' : target?.code ?? '',
    hits,
    totalHits,
    capped,
    currentIndex,
    includeIncidental,
    // no target: read forward from the top rather than centring on line 1 (half a window)
    windows: [focusLine === null ? windowAt(index, 1, 0, ADJACENT_WINDOW_LINES) : windowAt(index, focusLine)],
    toc: toc(index, 3),
    totalLines: index.lines.length,
    focusLine,
    notFound,
    fallbackFrom,
  }
}
