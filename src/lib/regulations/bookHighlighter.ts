/**
 * Find-in-page highlighting for the ADR book viewer.
 *
 * Operates on the DOM, never on HTML strings. String replacement over rendered
 * HTML would corrupt tags and attributes — a search for "class" or "3" would
 * rewrite markup — so every match is located in text nodes and wrapped there.
 *
 * No rune state: this is a plain DOM utility so it can be unit-tested in jsdom.
 */

/** Elements whose text is never searchable. */
const SKIP_TAGS = new Set(['MARK', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'])

/** Generated content that is not part of the regulation text. */
const SKIP_CLASS = 'book-figure-missing'

const COMBINING_MARKS = /[̀-ͯ]/g

/** Characters that continue a code or word, for `wholeToken` matching. */
const TOKEN_CHAR = /^[\p{L}\p{N}]$/u

/**
 * Case- and diacritic-insensitive form of `source`, plus a map from each
 * character of the result back to the character of `source` it came from.
 *
 * The map is needed because normalisation is not length-preserving: `ß` becomes
 * `ss`, and some characters decompose or expand under lowercasing. A naive
 * offset arithmetic would wrap the wrong span and corrupt German text.
 */
function normalizeWithMap(source: string): { normalized: string, map: number[] } {
  let normalized = ''
  const map: number[] = []

  for (let i = 0; i < source.length; i++) {
    const lowered = source[i]!.toLocaleLowerCase('de')
    // German sharp s has no single-character lowercase equivalent that readers
    // type; treat it as "ss" so both spellings find each other
    const expanded = lowered === 'ß'
      ? 'ss'
      : lowered.normalize('NFD').replace(COMBINING_MARKS, '')

    for (const char of expanded) {
      normalized += char
      map.push(i)
    }
  }

  return { normalized, map }
}

/** True when `node` sits inside something whose text must not be searched. */
function isSkipped(node: Node, root: Element): boolean {
  let current: Node | null = node.parentNode
  while (current && current !== root.parentNode) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element
      if (SKIP_TAGS.has(el.tagName)) return true
      if (el.classList.contains(SKIP_CLASS)) return true
    }
    if (current === root) break
    current = current.parentNode
  }
  return false
}

/**
 * Source line of the window containing `node`, when the viewer wrapped it in an
 * element carrying `data-line-start`. Lets a mark report where in the book it is.
 */
function enclosingLine(node: Node, root: Element): string | null {
  const start = node.parentElement
  if (!start) return null
  const holder = start.closest('[data-line-start]')
  if (!holder) return null
  if (holder !== root && !root.contains(holder)) return null
  return holder.getAttribute('data-line-start')
}

interface NodeMatches {
  node: Text
  text: string
  /** ascending, non-overlapping `[start, end)` offsets into `text` */
  ranges: { start: number, end: number }[]
}

/**
 * Wraps every occurrence of `term` under `root` in
 * `<mark class="book-hit" data-nth="…">`, returning the marks in document order.
 *
 * Matching is case- and diacritic-insensitive, and the term is always treated as
 * a literal — regex metacharacters such as `.` or `+` match themselves, so a
 * search for "Kapitel 3.2" cannot become a wildcard.
 */
export function markMatches(root: Element, term: string, opts: { wholeToken?: boolean } = {}): HTMLElement[] {
  const { normalized: needle } = normalizeWithMap(term)
  if (needle.trim() === '') return []

  // collect first, mutate afterwards: editing the DOM during the walk would
  // invalidate the TreeWalker
  const found: NodeMatches[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node =>
      isSkipped(node, root) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })

  let current = walker.nextNode() as Text | null
  while (current) {
    const text = current.data
    if (text.length > 0) {
      const { normalized, map } = normalizeWithMap(text)
      const ranges: { start: number, end: number }[] = []

      let from = 0
      for (;;) {
        const at = normalized.indexOf(needle, from)
        if (at === -1) break
        const start = map[at]!
        const end = map[at + needle.length - 1]! + 1
        // a previous match may already cover this span when one source
        // character expanded to several normalised ones
        const overlaps = ranges.length > 0 && ranges[ranges.length - 1]!.end > start
        // a code such as 163 must not light up inside UN 1163 or 163a
        const insideToken = opts.wholeToken
          && (TOKEN_CHAR.test(text[start - 1] ?? '') || TOKEN_CHAR.test(text[end] ?? ''))
        if (!overlaps && !insideToken) {
          ranges.push({ start, end })
        }
        from = at + needle.length
      }

      if (ranges.length > 0) found.push({ node: current, text, ranges })
    }
    current = walker.nextNode() as Text | null
  }

  const marks: HTMLElement[] = []
  for (const { node, text, ranges } of found) {
    const parent = node.parentNode
    if (!parent) continue

    const line = enclosingLine(node, root)
    const fragment = document.createDocumentFragment()
    let cursor = 0

    for (const { start, end } of ranges) {
      if (start > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, start)))
      }
      const mark = document.createElement('mark')
      mark.className = 'book-hit'
      mark.dataset.nth = String(marks.length)
      if (line !== null) mark.dataset.line = line
      mark.textContent = text.slice(start, end)
      fragment.appendChild(mark)
      marks.push(mark)
      cursor = end
    }

    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)))
    }
    parent.replaceChild(fragment, node)
  }

  return marks
}

/**
 * Removes the marks this module created, restoring the original markup exactly.
 * Marks the page author put there (any `<mark>` without `book-hit`) are left alone.
 *
 * `normalize()` rejoins the split text nodes, so repeated search-term changes
 * cannot fragment the document without bound.
 */
export function clearMarks(root: Element): void {
  unmark(Array.from(root.querySelectorAll<HTMLElement>('mark.book-hit')))
}

/**
 * Moves the active-hit styling to `index`, which the find bar drives.
 * Out-of-range simply clears the active state rather than throwing, because the
 * hit list and the loaded DOM can legitimately disagree mid-fetch.
 */
export function setActiveMark(marks: HTMLElement[], index: number): void {
  marks.forEach((mark, i) => {
    if (i === index) {
      mark.classList.add('book-hit-active')
      mark.setAttribute('aria-current', 'location')
    }
    else {
      mark.classList.remove('book-hit-active')
      mark.removeAttribute('aria-current')
    }
  })
}

const LINE_CLASS = /^book-ln-(\d+)$/

function lineClassOf(el: Element): number | null {
  for (const cls of el.classList) {
    const match = LINE_CLASS.exec(cls)
    if (match) return Number(match[1])
  }
  return null
}

/**
 * Book line of the text holding `el`.
 *
 * The renderer tags every block and table row with `book-ln-<n>` for the line it
 * starts on, and puts an empty `<span class="book-ln-<n>">` where each further
 * line of a multi-line block (a list, a wrapped paragraph) begins. So the line is
 * the nearest tagged ancestor's, refined by the last marker inside it that comes
 * before `el`. Null inside a heading or a re-emitted table header, which carry
 * no line (a block opened by such a header is `book-blk`, lines only from its
 * markers).
 */
export function sourceLineOf(el: Element): number | null {
  let block: Element | null = null
  let line: number | null = null
  for (let node: Element | null = el.parentElement ?? null; node; node = node.parentElement) {
    line = lineClassOf(node)
    // `book-blk`: a block opening on a line the book does not have (a
    // re-emitted table header); only its markers carry lines
    if (line !== null || node.classList.contains('book-blk')) {
      block = node
      break
    }
  }
  if (!block) return null

  for (const marker of block.querySelectorAll('span[class^="book-ln-"]')) {
    if (!(marker.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) break
    line = lineClassOf(marker) ?? line
  }
  return line
}

/** Where a listed hit sits: its book line and which match on that line (0-based). */
export interface HitPosition {
  line: number
  ordinal?: number
}

/**
 * Keeps only the marks the hit list names and removes the rest.
 *
 * ONE RULE for the counter and the highlights: a hit is "the `ordinal`-th match
 * on book line `line`" (the server counts matches per line the way `markMatches`
 * does), and only those matches stay highlighted. So "Treffer k von n" always
 * counts exactly the reachable, highlighted hits: a match in a heading, in an
 * unlisted (incidental) cell of a listed row, or beyond the capped list is not
 * highlighted at all, rather than lit up but unreachable.
 *
 * Returns the kept marks in document order and, per hit, the index of its mark
 * among them (-1 when that part of the book is not loaded).
 */
export function keepListedMarks(marks: HTMLElement[], hits: HitPosition[]): { marks: HTMLElement[], markOfHit: number[] } {
  const byLine = new Map<number, HTMLElement[]>()
  for (const mark of marks) {
    const line = sourceLineOf(mark)
    if (line === null) continue
    const list = byLine.get(line)
    if (list) list.push(mark)
    else byLine.set(line, [mark])
  }

  const named = hits.map(hit => byLine.get(hit.line)?.[hit.ordinal ?? 0] ?? null)
  const listed = new Set(named.filter(mark => mark !== null))

  const unlisted = marks.filter(mark => !listed.has(mark))
  if (unlisted.length > 0) unmark(unlisted)

  const kept = marks.filter(mark => listed.has(mark))
  kept.forEach((mark, i) => {
    mark.dataset.nth = String(i)
  })
  const position = new Map(kept.map((mark, i) => [mark, i]))
  return { marks: kept, markOfHit: named.map(mark => (mark ? position.get(mark)! : -1)) }
}

/** Unwraps the given marks back into text, rejoining split text nodes. */
function unmark(marks: HTMLElement[]): void {
  const touched = new Set<Node>()
  for (const mark of marks) {
    const parent = mark.parentNode
    if (!parent) continue
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
    touched.add(parent)
  }
  for (const parent of touched) {
    (parent as Element).normalize?.()
  }
}
