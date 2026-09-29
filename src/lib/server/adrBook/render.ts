import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { getBookLabel } from '$lib/regulations/bookTypes'

/**
 * Markdown slice → sanitised HTML, safe for `{@html}`.
 *
 * The source document (`ADR_BOOK_PATH`) is a machine conversion from an
 * unverified PDF pipeline, so its inline HTML is treated as untrusted even
 * though the file is ours. Rendering is therefore three deliberate steps
 * (spec §2.4):
 *
 *   1. `marked` with GFM tables and inline HTML allowed, because the source's
 *      own `<br>`, `<sup>`, `<sub>` and `<b>` carry meaning;
 *   2. `sanitize-html` with a closed allowlist — widening it is a security
 *      change, not a formatting one;
 *   3. post-processing that sanitisation cannot express: scroll containers
 *      around wide tables, stable heading anchors, and placeholders for the
 *      57 referenced image files that do not exist.
 *
 * Pure and synchronous: no file reads, no environment access, no network.
 * Every class name it emits is `book-`-prefixed, never a Tailwind utility —
 * Tailwind v4 only scans `src/**`, so a utility built at runtime would compile
 * to nothing.
 */

// ── 2. Allowlist (spec §2.4) ─────────────────────────────────

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'br', 'b', 'strong', 'i', 'em', 'u', 'sup', 'sub',
  'blockquote', 'code', 'pre', 'a', 'span', 'div', 'hr',
  // `img` is NOT part of the rendered output: it is admitted here stripped
  // down to its `alt` text only, so step 3 can build the placeholder from an
  // already-escaped attribute value. Every `<img>` is replaced below, and a
  // test asserts the output contains none. Even a leaked one would be inert —
  // no `src`, no handlers, nothing to fetch.
  'img',
]

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['alt'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    '*': ['id', 'class'],
  },
  // drops `javascript:` and `data:` hrefs
  allowedSchemes: ['http', 'https', 'mailto'],
  // `class` survives only for our own semantic names
  allowedClasses: { '*': ['book-*'] },
  // Without this, sanitize-html drops the tag but keeps its text, so a
  // `<script>alert(1)</script>` would leave `alert(1)` as visible prose.
  // Naming the list here overrides the library default, so it repeats the
  // default entries as well as `noscript`.
  nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript'],
}

// ── 3a. Wide tables ──────────────────────────────────────────

/**
 * Table A is 25 columns wide. Without its own scroll container it widens the
 * page instead of itself. `role="region"` plus `tabindex="0"` keep the
 * container reachable for keyboard users, who would otherwise be unable to
 * scroll it at all.
 */
const TABLE_WRAPPER_OPEN
  = '<div class="book-table-scroll" role="region" tabindex="0"'
    + ` aria-label="${getBookLabel('de', 'wideTable')}">`

const TABLE_TAG = /<\/?table\b[^>]*>/gi

function wrapTables(html: string): string {
  let out = ''
  let cursor = 0
  let depth = 0
  TABLE_TAG.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TABLE_TAG.exec(html)) !== null) {
    out += html.slice(cursor, match.index)
    if (match[0].startsWith('</')) {
      out += match[0]
      depth = Math.max(0, depth - 1)
      if (depth === 0) out += '</div>'
    }
    else {
      if (depth === 0) out += TABLE_WRAPPER_OPEN
      depth += 1
      out += match[0]
    }
    cursor = match.index + match[0].length
  }
  return out + html.slice(cursor)
}

// ── 3b. Missing figures (spec §11.4) ─────────────────────────

const IMG_TAG = /<img\b[^>]*>/gi
const ALT_ATTRIBUTE = /\balt="([^"]*)"/i

/**
 * The 57 `*_img.jpg` files the document references are not in the repository,
 * so an `<img>` can only ever be a broken image. It becomes a labelled
 * placeholder instead, which keeps the Gefahrzettel description available to
 * both sighted and screen-reader users.
 *
 * The alt value comes out of sanitisation already HTML-escaped, so it is
 * reused verbatim in the attribute and in the visible text.
 */
function replaceImages(html: string): string {
  return html.replace(IMG_TAG, (tag) => {
    const alt = tag.match(ALT_ATTRIBUTE)?.[1]?.trim() ?? ''
    const label = alt.length > 0 ? `Abbildung: ${alt}` : 'Abbildung'
    const ariaLabel = alt.length > 0 ? alt : 'Abbildung'
    return `<span class="book-figure-missing" role="img" aria-label="${ariaLabel}">[${label}]</span>`
  })
}

// ── 3c. Heading anchors ──────────────────────────────────────

const HEADING = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi
const ID_ATTRIBUTE = / id="[^"]*"/gi
const LEADING_SECTION_NUMBER = /^(\d+(?:\.\d+)*)(?:\s|$)/

const TRANSLITERATIONS: [RegExp, string][] = [
  [/ä/g, 'ae'], [/ö/g, 'oe'], [/ü/g, 'ue'], [/ß/g, 'ss'],
]

/** `'1.1.3.6'` → `'h-1-1-3-6'`, `'Kapitel 3.3'` → `'h-kapitel-3-3'`. */
function slugify(headingText: string): string {
  const sectionNo = headingText.match(LEADING_SECTION_NUMBER)?.[1]
  const source = sectionNo ?? headingText
  let slug = source.toLowerCase()
  for (const [pattern, replacement] of TRANSLITERATIONS) slug = slug.replace(pattern, replacement)
  slug = slug
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remaining diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `h-${slug || 'abschnitt'}`
}

/**
 * Anchors must be unique across the whole document, not only within one
 * rendered window, so the caller passes the registry it built from the heading
 * map. Without one, each call de-duplicates only against itself.
 */
function uniqueSlug(base: string, registry: Set<string>): string {
  if (!registry.has(base)) {
    registry.add(base)
    return base
  }
  let counter = 2
  while (registry.has(`${base}-${counter}`)) counter += 1
  const slug = `${base}-${counter}`
  registry.add(slug)
  return slug
}

function addHeadingIds(html: string, registry: Set<string>): string {
  return html.replace(HEADING, (_whole, level: string, attributes: string, inner: string) => {
    // An id in the source is ignored: anchors are ours, and a stray duplicate
    // from the conversion would break deep links.
    const cleaned = attributes.replace(ID_ATTRIBUTE, '')
    const slug = uniqueSlug(slugify(toPlainText(inner)), registry)
    return `<h${level} id="${slug}"${cleaned}>${inner}</h${level}>`
  })
}

// ── 3d. Source-line tags ─────────────────────────────────────

function lineClass(line: number | null | undefined): string | null {
  return typeof line === 'number' ? `book-ln-${line}` : null
}

/** Adds a class to the first opening tag of `html`. */
function tagFirst(html: string, cls: string | null): string {
  if (!cls) return html
  return html.replace(/^(\s*<[a-z][a-z0-9]*)/i, `$1 class="${cls}"`)
}

/**
 * Renders block by block so each block knows the markdown line it starts on.
 * Pipe tables map one row to one line (header, alignment row, then the body),
 * which lets every `<tr>` carry its own line. Headings are left alone: they
 * already get stable anchors from `addHeadingIds`.
 */
function parseWithLineTags(markdown: string, sourceLines: (number | null)[]): string {
  const tokens = marked.lexer(markdown, { gfm: true, breaks: false })
  let cursor = 0
  let html = ''

  for (const token of tokens) {
    const startLine = cursor
    cursor += (token.raw.match(/\n/g) ?? []).length
    if (token.type === 'space') continue

    const single = Object.assign([token], { links: tokens.links })
    let rendered = marked.parser(single, { gfm: true, breaks: false })

    if (token.type === 'table') {
      // header row, then (after the alignment row) one body row per line
      const rowLines = [startLine, ...token.rows.map((_: unknown, i: number) => startLine + 2 + i)]
      let row = 0
      rendered = rendered.replace(/<tr>/g, () => {
        const cls = lineClass(sourceLines[rowLines[row++]!])
        return cls ? `<tr class="${cls}">` : '<tr>'
      })
    }
    else if (token.type !== 'heading') {
      rendered = tagFirst(rendered, lineClass(sourceLines[startLine]))
    }

    html += rendered
  }
  return html
}

// ── Public API ───────────────────────────────────────────────

export interface RenderOptions {
  /**
   * Slugs already taken elsewhere in the document. Mutated as anchors are
   * assigned, so consecutive slices keep producing unique ids.
   */
  slugRegistry?: Set<string>
  /**
   * Book line of each markdown line (`null` for a line that is not in the book,
   * such as a re-emitted table header). When given, every block and every table
   * row carries a `book-ln-<line>` class, so the viewer can tell which `<mark>`
   * belongs to which hit.
   */
  sourceLines?: (number | null)[]
}

/** Markdown slice → sanitised HTML with `book-*` classes and stable anchors. */
export function renderSlice(markdown: string, opts?: RenderOptions): string {
  // marked.parse is synchronous as long as no async extension is registered,
  // and none is. The cast documents that: an accidental promise would be a
  // rendering bug, not a string.
  const parsed = opts?.sourceLines
    ? parseWithLineTags(markdown, opts.sourceLines)
    : marked.parse(markdown, { gfm: true, breaks: false }) as string
  const sanitised = sanitizeHtml(parsed, SANITIZE_OPTIONS)
  const registry = opts?.slugRegistry ?? new Set<string>()
  return wrapTables(replaceImages(addHeadingIds(sanitised, registry)))
}

const SCRIPTED_ELEMENT = /<(script|style|textarea|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi
const ANY_TAG = /<[^>]*>/g
const NAMED_ENTITIES: [RegExp, string][] = [
  [/&nbsp;/g, ' '],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#0*39;/g, '\''],
  [/&apos;/g, '\''],
  [/&amp;/g, '&'], // last, so `&amp;lt;` does not decode twice
]

/**
 * HTML → readable text. Used for search context snippets and for deriving
 * heading slugs, so it must keep German characters intact and must never
 * glue two cells of a table row into one word: every tag becomes a space and
 * the whitespace is collapsed afterwards.
 */
export function toPlainText(html: string): string {
  let text = html.replace(SCRIPTED_ELEMENT, ' ').replace(ANY_TAG, ' ')
  for (const [pattern, replacement] of NAMED_ENTITIES) text = text.replace(pattern, replacement)
  return text.replace(/\s+/g, ' ').trim()
}
