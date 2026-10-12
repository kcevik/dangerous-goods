/**
 * Occurrence indexer for the consolidated ADR text.
 *
 * Pure: it never reads a file, an environment variable or the database. The
 * caller hands in the lines and the set of numbers that really are UN numbers
 * (from `adr_entries`), because a bare four-digit scan finds mostly years.
 *
 * The whole point of this module is deciding *where a reader lands* when they
 * click `SV 243` or `UN 1203`. The same number appears in half a dozen roles,
 * so every occurrence is classified (see `HitRole`) and ranked
 * (`RANK_BY_ROLE`); the hit lists are sorted by rank, then by line, so the
 * first entry is the place the number is actually defined.
 *
 * Three things here are deliberate and easy to get wrong:
 *
 * 1. Chapter 3.3 is located **by heading**, never by line number — line
 *    numbers move with every edition.
 * 2. Provision codes inside Table A are read from **column 6 only**, with the
 *    column index taken from the `| (1) | (2) | (3a) | … | (6) | …` numbering
 *    row. The real table has 25 columns, some labelled 3a/3b/7a/7b, and the
 *    conversion occasionally merges two labels into one cell — so the index is
 *    re-derived from every numbering row rather than counted once.
 * 3. Numbers followed by a unit ("bei 50 °C", "mehr als 60 %") are dropped
 *    outright. SV 50 and SV 60 exist, and a bare `\b60\b` scan over the real
 *    document matches "60 °C" hundreds of times, which would bury the real
 *    hits under noise.
 */

import {
  type BookHeading,
  type BookHit,
  type HitRole,
  RANK_BY_ROLE,
} from '$lib/regulations/bookTypes'

export interface IndexedBook {
  headings: BookHeading[]
  /** key `${kind}:${code}`, each list sorted by rank, then line */
  hits: Map<string, BookHit[]>
  /**
   * Provision codes that have their own paragraph in chapter 3.3 — 377 in the
   * 2025 text.
   *
   * Note for the query layer: `640A`…`640O` are **not** in here and never will
   * be. The ADR defines them inside the 640 paragraph as «Sondervorschrift
   * 640X», so a reader asking for `sv=640D` has no rank-1 hit at all and would
   * otherwise land on an arbitrary Table A row. Fall back to the numeric parent
   * code (`640`) there; inventing an occurrence would be a lie about the text.
   */
  svCodes: Set<string>
}

/** Longest context string kept per hit, ellipsis included. */
const MAX_CONTEXT = 180

/** How far to the left a supporting word still counts as context. */
const SV_CONTEXT_WINDOW = 60
const UN_CONTEXT_WINDOW = 60
const YEAR_CONTEXT_WINDOW = 30

const HEADING_RE = /^(#{1,6})[ \t]+(.*?)[ \t]*$/
const SECTION_NO_RE = /^(\d+(?:\.\d+)+)(?=[\s)]|$)/
const TABLE_ROW_RE = /^[ \t]*\|/
/** `| --- | :---: |` — the GFM alignment row carries no content. */
const ALIGNMENT_ROW_RE = /^[ \t]*\|[\s|:-]*$/
const NUMBERING_CELL_RE = /^\((\d{1,2}[a-z]?)\)$/

/**
 * A provision definition in chapter 3.3, in the three shapes the machine
 * conversion produced. A single pattern finds only a fraction of the codes, so
 * all three are tried in order:
 *
 * 1. a markdown list item — `- 163 Ein in Kapitel 3.2 Tabelle A …`
 * 2. a bold code — `**654** Abfall-Feuerzeuge …`, and `**614** 2,3,7,8-Tetra…`
 *    or `**376** **Lithium-Metall-…**` whose body does *not* start with a letter
 * 3. bare, flush left or indented — `177 Bariumsulfat …`, ` 363 Diese …`
 *
 * Codes are two or three digits with an optional letter suffix (`640D`). One
 * digit is excluded on purpose: no such provision exists, while enumerations
 * like `- 1 Liter` are everywhere. Shapes 1 and 2 are unambiguous markers, so
 * their body may start with anything; shape 3 is a plain line of text and needs
 * the stricter lookahead, or every wrapped prose line that happens to begin
 * with a number would register as a provision.
 */
const DEFINITION_PATTERNS = [
  /^[ \t]*[-*+][ \t]+(?:\*\*)?(\d{2,3}[A-Z]?)(?:\*\*)?[ \t]+(?=\S)/,
  /^[ \t]*\*\*(\d{2,3}[A-Z]?)(?:\*\*)?[ \t]+(?=\S)/,
  /^[ \t]*(\d{2,3}[A-Z]?)(?:\*\*)?[ \t]+(?=[A-Za-zÄÖÜäöüß(«„"*])/,
]

/** A provision code as a standalone token: not part of a longer number. */
const SV_TOKEN_RE = /(?<![\w.,:])(\d{2,3}[A-Z]?)(?![\w])/g
/** A UN number as a standalone token. */
const UN_TOKEN_RE = /(?<![\w.,])(\d{4})(?![\w])/g

/**
 * A unit or quantity directly behind the number. "50 °C", "60 %", "250 Litern",
 * "10 kg" are measurements, not codes — the single most important filter here.
 */
const UNIT_AFTER_RE = new RegExp(
  '^[    ]?(?:'
  + '°\\s?[CF]|°|%|Masse-%|Vol\\.-%|Vol\\.|'
  + 'kPa|MPa|hPa|mbar|bar|'
  + 'kg/l|kg|mg|µg|µm|t(?![a-zäöüß])|g(?![a-zäöüß])|'
  + 'mm²|mm|cm³|cm|dm³|m³|m²|m(?![a-zäöüß])|'
  + 'ml|l(?![a-zäöüß])|L(?![a-zA-Zäöüß])|Liter[ns]?|'
  + 'kW|kJ|MJ|kN|N(?![a-zäöüß])|W(?![a-zäöüß])|V(?![a-zäöüß])|Wh|ppm|'
  + 'Sekunden?|Minuten?|Stunden?|Tage?n?|Wochen?|Monate?n?|Jahre?n?'
  + ')(?![\\wäöüßÄÖÜ])',
)

/**
 * Words that mean "this four-digit number is a date, not a substance". The top
 * four-digit tokens in the real document are 2019, 2014, 2018 and 2012 — all
 * of them real UN numbers *and* years in transitional provisions, so they
 * cannot be excluded, only demoted by what stands in front of them.
 */
const YEAR_WORD_RE
  = /\b(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|vor dem|ab dem|bis zum|seit dem|nach dem|vom|ausgabe|fassung|auflage|jahr(?:es|gang)?)\b/i
/** Standard designators, uppercase on purpose: "EN 590:2013", "ISO 1750:1981". */
const STANDARD_RE = /\b(?:ISO|EN|DIN|CEN|EWG|EG|EU|IEC|UIC)\b/
const DATE_RE = /\d{1,2}\.\d{1,2}\./

function looksLikeYear(left: string): boolean {
  return YEAR_WORD_RE.test(left) || STANDARD_RE.test(left) || DATE_RE.test(left)
}

/** Words that make a four-digit number a deliberate reference to a substance. */
const UN_MARKER_RE = /(?:un[- ]?nummer|un[- ]?nr|\bun\b|eintragung)/i

/** Words that make a two/three-digit number a deliberate reference to a provision. */
const SV_MARKER_RE = /(?:sondervorschrift|kapitel 3\.3|spalte 6)/i

// ── Headings ─────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Builds the heading list in one pass, together with the enclosing path and a
 * slug that is unique across the whole document — the registry lives here, not
 * per rendered window, so two identically named sections never share an anchor.
 */
function collectHeadings(lines: string[]): BookHeading[] {
  const headings: BookHeading[] = []
  const taken = new Set<string>()
  const stack: BookHeading[] = []

  for (let i = 0; i < lines.length; i++) {
    const match = HEADING_RE.exec(lines[i])
    if (!match) continue

    const level = match[1].length
    const text = match[2]
    const sectionNo = SECTION_NO_RE.exec(text)?.[1] ?? null

    const base = sectionNo
      ? `h-${sectionNo.replace(/\./g, '-')}`
      : `h-${slugify(text) || 'abschnitt'}`
    let slug = base
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
    taken.add(slug)

    while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop()

    const heading: BookHeading = {
      level,
      text,
      sectionNo,
      slug,
      line: i + 1,
      path: stack.map((h) => h.text),
    }
    headings.push(heading)
    stack.push(heading)
  }

  return headings
}

/**
 * The line range of chapter 3.3, found by heading. It ends at the next
 * `Kapitel` or `Teil` heading of the same or higher level; hard-coded line
 * numbers would break with the next edition.
 */
function findSpecialProvisionRange(headings: BookHeading[]): { start: number, end: number } | null {
  const start = headings.find((h) => /^(?:Kapitel[ \t]+)?3\.3\b/.test(stripEmphasis(h.text)))
  if (!start) return null

  const next = headings.find(
    (h) =>
      h.line > start.line
      && h.level <= start.level
      && /^(?:\*\*)?(?:Kapitel|Teil)\b/.test(h.text),
  )
  return { start: start.line, end: next ? next.line - 1 : Number.MAX_SAFE_INTEGER }
}

function stripEmphasis(text: string): string {
  return text.replace(/\*\*|__|\*/g, '').trim()
}

// ── Line normalisation and context ───────────────────────────

/** Markup-free single-line text, used for scanning prose and for contexts. */
function normalize(line: string): string {
  return line
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/[ \t ]+/g, ' ')
    .trim()
}

/** Cells of a pipe table row, trimmed, without the empty edges. */
function splitCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

/**
 * ≤ 180 characters centred on the code. An ellipsis replaces the first/last
 * character rather than being appended, so the cap always holds.
 */
function buildContext(text: string, code: string): string {
  if (text.length <= MAX_CONTEXT) return text

  const boundary = new RegExp(`(?<![\\w.])${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`)
  const at = boundary.exec(text)?.index ?? Math.max(0, text.indexOf(code))

  let start = Math.max(0, at - Math.floor((MAX_CONTEXT - code.length) / 2))
  start = Math.min(start, text.length - MAX_CONTEXT)
  const end = start + MAX_CONTEXT

  let out = text.slice(start, end)
  if (start > 0) out = `…${out.slice(1)}`
  if (end < text.length) out = `${out.slice(0, -1)}…`
  return out
}

// ── Occurrence ordinals ──────────────────────────────────────

/** What the viewer's whole-token highlighter treats as part of a code. */
const TOKEN_CHAR = /^[\p{L}\p{N}]$/u

/**
 * How many whole-token matches of `code` start in `text` before `before`,
 * counted exactly as the viewer's highlighter scans a rendered line: case-
 * insensitive, non-overlapping, and a match counts only when no letter or digit
 * touches it. A hit carries this number so the viewer highlights the very
 * occurrence the hit list names — not an incidental one earlier in the row.
 */
function tokenOrdinal(text: string, code: string, before = Number.POSITIVE_INFINITY): number {
  const haystack = text.toLowerCase()
  const needle = code.toLowerCase()
  let count = 0
  for (let at = haystack.indexOf(needle); at !== -1 && at < before; at = haystack.indexOf(needle, at + needle.length)) {
    if (!TOKEN_CHAR.test(text[at - 1] ?? '') && !TOKEN_CHAR.test(text[at + needle.length] ?? '')) count++
  }
  return count
}

/** Matches of `code` in the cells before `cell`, i.e. the ordinal of a match inside `cell`. */
function ordinalOfCell(cells: string[], cell: number, code: string): number {
  let count = 0
  for (let i = 0; i < cell; i++) count += tokenOrdinal(normalize(cells[i] ?? ''), code)
  return count
}

// ── Token classification ─────────────────────────────────────

/** True when the number is really a measurement: "50 °C", "60 %", "10 kg". */
function followedByUnit(text: string, afterIndex: number): boolean {
  return UNIT_AFTER_RE.test(text.slice(afterIndex))
}

/**
 * The text just before the match, snapped forward to a word start — a window
 * that cuts a word in half invents words (the tail of "UN-Nummern" reads as the
 * standard designator "EN" and demoted every hit behind it).
 */
function leftContext(text: string, index: number, window: number): string {
  const start = Math.max(0, index - window)
  const slice = text.slice(start, index)
  return start === 0 ? slice : slice.replace(/^\S*/, '')
}

// ── Indexing ─────────────────────────────────────────────────

interface TableContext {
  /** label → cell index, from the most recent `| (1) | (2) | …` row */
  columns: Map<string, number>
  /** a numbering row carrying a `(6)` column means this is chapter 3.2 Table A */
  isTableA: boolean
}

/** Per-line collector that keeps only the best-ranked hit per (kind, code). */
class LineHits {
  private readonly best = new Map<string, BookHit>()

  add(kind: 'sv' | 'un', code: string, role: HitRole, line: number, text: string, heading: BookHeading | null, ordinal: number): void {
    const key = `${kind}:${code}`
    const rank = RANK_BY_ROLE[role]
    const existing = this.best.get(key)
    if (existing && existing.rank <= rank) return
    this.best.set(key, { kind, code, line, rank, role, context: buildContext(text, code), heading, ordinal })
  }

  values(): BookHit[] {
    return [...this.best.values()]
  }
}

function scanProse(
  text: string,
  line: number,
  heading: BookHeading | null,
  known: Set<string>,
  unNumbers: Set<string>,
  out: LineHits,
): void {
  for (const match of text.matchAll(SV_TOKEN_RE)) {
    const code = match[1]
    if (!known.has(code)) continue
    const at = match.index
    if (followedByUnit(text, at + match[0].length)) continue
    const left = leftContext(text, at, SV_CONTEXT_WINDOW)
    out.add('sv', code, SV_MARKER_RE.test(left) ? 'crossReference' : 'incidental', line, text, heading, tokenOrdinal(text, code, at))
  }

  for (const match of text.matchAll(UN_TOKEN_RE)) {
    const code = match[1]
    if (!unNumbers.has(code)) continue
    const at = match.index
    const nearLeft = leftContext(text, at, YEAR_CONTEXT_WINDOW)
    const isYearish = looksLikeYear(nearLeft)
    if (!isYearish && followedByUnit(text, at + match[0].length)) continue
    const left = leftContext(text, at, UN_CONTEXT_WINDOW)
    const role: HitRole = !isYearish && UN_MARKER_RE.test(left) ? 'crossReference' : 'incidental'
    out.add('un', code, role, line, text, heading, tokenOrdinal(text, code, at))
  }
}

/**
 * One classified line. Both passes walk the document through this, so the rule
 * for where a table starts and stops lives in exactly one place — the column-6
 * index is worthless if the two passes disagree about which table they are in.
 */
type WalkedLine =
  | { shape: 'heading' }
  | { shape: 'skip' }
  | { shape: 'tableRow', cells: string[], table: TableContext | null }
  | { shape: 'prose' }

function* walk(lines: string[]): Generator<WalkedLine & { line: string, lineNo: number }> {
  let table: TableContext | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1

    if (HEADING_RE.test(line)) {
      table = null
      yield { shape: 'heading', line, lineNo }
      continue
    }

    if (TABLE_ROW_RE.test(line)) {
      const cells = splitCells(line)
      const numbering = readNumberingRow(cells)
      if (numbering) {
        // A page break repeats the numbering row, sometimes with the labels in
        // different cells — re-derive the column map instead of trusting the first.
        table = numbering
        yield { shape: 'skip', line, lineNo }
        continue
      }
      if (ALIGNMENT_ROW_RE.test(line)) {
        yield { shape: 'skip', line, lineNo }
        continue
      }
      yield { shape: 'tableRow', cells, table, line, lineNo }
      continue
    }

    table = null
    yield { shape: line.trim() === '' ? 'skip' : 'prose', line, lineNo }
  }
}

/**
 * Collects the provision codes that may be matched in prose at all: those with
 * a chapter-3.3 paragraph, plus those that appear in a Table A column-6 cell.
 * Without this set every "60" in the document would become a hit for SV 60.
 */
function collectCodes(
  lines: string[],
  range: { start: number, end: number } | null,
): { defined: Set<string>, known: Set<string> } {
  const defined = new Set<string>()
  const known = new Set<string>()

  for (const entry of walk(lines)) {
    if (entry.shape === 'tableRow') {
      if (entry.table?.isTableA) {
        for (const code of tableACodes(entry.cells, entry.table)) known.add(code)
      }
      continue
    }
    if (entry.shape !== 'prose') continue
    if (!range || entry.lineNo < range.start || entry.lineNo > range.end) continue

    const code = readDefinition(entry.line)
    if (code) {
      defined.add(code)
      known.add(code)
    }
  }

  return { defined, known }
}

function readNumberingRow(cells: string[]): TableContext | null {
  const columns = new Map<string, number>()
  let labels = 0
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (cell === '') continue
    const single = NUMBERING_CELL_RE.exec(cell)
    if (single) {
      if (!columns.has(single[1])) columns.set(single[1], i)
      labels++
      continue
    }
    // The conversion sometimes merges two labels into one cell, e.g.
    // `| (7a) (7b) |`. Accept it, but only map the first label to this index.
    const merged = cell.match(/^\((\d{1,2}[a-z]?)\)(?:[ \t\n]*(?:<br\s*\/?>)?[ \t]*\(\d{1,2}[a-z]?\))+$/)
    if (merged) {
      if (!columns.has(merged[1])) columns.set(merged[1], i)
      labels++
      continue
    }
    // Some numbering rows carry a section hint above the label: `3.1.2<br>(2a)`.
    const hinted = cell.match(/\((\d{1,2}[a-z]?)\)\s*$/)
    if (hinted && /^[\d.\s]*(?:<br\s*\/?>)?\s*\(/.test(cell)) {
      if (!columns.has(hinted[1])) columns.set(hinted[1], i)
      labels++
      continue
    }
    return null
  }
  if (labels < 2 || !columns.has('1')) return null
  return { columns, isTableA: columns.has('6') }
}

/** Provision codes in column 6, split on `<br>` and on spaces alike. */
function tableACodes(cells: string[], table: TableContext): string[] {
  return tableACodesAt(cells, table).codes
}

function tableACodesAt(cells: string[], table: TableContext): { codes: string[], at: number } {
  const at = table.columns.get('6')
  if (at === undefined) return { codes: [], at: -1 }
  return { codes: tableACodesIn(cells, at), at }
}

function tableACodesIn(cells: string[], at: number): string[] {
  const cell = cells[at]
  if (!cell) return []
  return normalize(cell)
    .split(/[\s,;]+/)
    .filter((token) => /^\d{1,3}[A-Z]{0,2}$/.test(token))
}

function readDefinition(line: string): string | null {
  for (const pattern of DEFINITION_PATTERNS) {
    const match = pattern.exec(line)
    if (!match) continue
    // "- 25 kg je Versandstück" is a quantity, not provision 25. The pattern
    // already consumed the space after the code, so the body start is where a
    // unit would sit.
    if (followedByUnit(line, match.index + match[0].length)) return null
    return match[1]
  }
  return null
}

export function indexBook(lines: string[], opts: { unNumbers: Set<string> }): IndexedBook {
  const headings = collectHeadings(lines)
  const byLine = new Map(headings.map((h) => [h.line, h] as const))
  const range = findSpecialProvisionRange(headings)
  const { defined, known } = collectCodes(lines, range)

  const hits = new Map<string, BookHit[]>()
  let heading: BookHeading | null = null

  for (const entry of walk(lines)) {
    if (entry.shape === 'heading') {
      // A heading is indexed as structure, never as an occurrence: the codes in
      // it are titles, and a hit there would scroll the reader to a caption.
      heading = byLine.get(entry.lineNo) ?? heading
      continue
    }
    if (entry.shape === 'skip') continue

    const { line, lineNo } = entry
    const text = normalize(line)
    if (text === '') continue
    const out = new LineHits()

    if (entry.shape === 'tableRow') {
      const { cells, table } = entry
      if (table?.isTableA) {
        const unColumn = table.columns.get('1') ?? 0
        const firstColumn = normalize(cells[unColumn] ?? '')
        const un = /^(\d{4})$/.exec(firstColumn)?.[1]
        if (un && opts.unNumbers.has(un)) out.add('un', un, 'tableARow', lineNo, text, heading, ordinalOfCell(cells, unColumn, un))
        const column6 = tableACodesAt(cells, table)
        for (const code of column6.codes) {
          out.add('sv', code, 'tableASvCell', lineNo, text, heading, ordinalOfCell(cells, column6.at, code))
        }
        // Every other column is deliberately left unread. Columns 9a, 11, 13 and
        // 15–19 are full of codes and quantities that look exactly like provision
        // numbers; reading them is what buries SV 60 under noise.
      } else {
        // Table B and the Teil-4 substance tables: a cell that is nothing but a
        // UN number is that substance's row in an alphabetical list.
        cells.forEach((cell, i) => {
          const un = /^(\d{4})$/.exec(normalize(cell))?.[1]
          if (un && opts.unNumbers.has(un)) out.add('un', un, 'tableB', lineNo, text, heading, ordinalOfCell(cells, i, un))
        })
        scanProse(text, lineNo, heading, known, opts.unNumbers, out)
      }
    } else {
      if (range && lineNo >= range.start && lineNo <= range.end) {
        const code = readDefinition(line)
        // the definition opens the line, so it is the line's first match
        if (code && defined.has(code)) out.add('sv', code, 'definition', lineNo, text, heading, 0)
      }
      scanProse(text, lineNo, heading, known, opts.unNumbers, out)
    }

    collect(hits, out)
  }

  for (const list of hits.values()) list.sort((a, b) => a.rank - b.rank || a.line - b.line)

  return { headings, hits, svCodes: defined }
}

function collect(hits: Map<string, BookHit[]>, out: LineHits): void {
  for (const hit of out.values()) {
    const key = `${hit.kind}:${hit.code}`
    const list = hits.get(key)
    if (list) list.push(hit)
    else hits.set(key, [hit])
  }
}

/**
 * Which provision codes the reader can look up but the text never defines.
 * `found` are the codes with a rank-1 definition, `expected` the codes the
 * database knows. A non-empty result is a warning for the owner, not a
 * failure: it means the conversion mangled that paragraph.
 */
export function coverageReport(found: Set<string>, expected: Set<string>): string[] {
  const missing = [...expected].filter((code) => !found.has(code))
  return missing.sort((a, b) => {
    const na = Number.parseInt(a, 10)
    const nb = Number.parseInt(b, 10)
    if (na !== nb) return na - nb
    return a.localeCompare(b)
  })
}
