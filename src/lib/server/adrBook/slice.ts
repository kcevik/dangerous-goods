/**
 * Windowing over the ADR book's source lines.
 *
 * The viewer never renders the whole document. It asks for a window centred on a
 * target line, and this module decides where that window may safely begin and end
 * so the fragment still renders as valid markdown.
 *
 * Pure: no file reads, no environment, no I/O. The caller supplies the lines.
 */

/** Lines before the target in a default window. */
export const DEFAULT_WINDOW_BEFORE = 150

/** Lines after the target in a default window. */
export const DEFAULT_WINDOW_AFTER = 150

/**
 * How far snapping may walk looking for a blank line. Without a limit, a window
 * landing inside a 3,800-row table would drag the entire table in.
 */
const MAX_SNAP = 25

export interface BookSlice {
  /**
   * Markdown to render. May begin with synthetic table header lines that do not
   * exist at `lineStart` — see `syntheticLines`.
   */
  lines: string[]
  /** 1-based inclusive first real source line covered. */
  lineStart: number
  /** 1-based inclusive last real source line covered. */
  lineEnd: number
  /** Number of synthetic lines prepended to `lines` (a re-emitted table header). */
  syntheticLines: number
  /**
   * Lines dropped by table compaction (repeated headers and the blank lines that
   * would split one table into several).
   * `lines.length === lineEnd - lineStart + 1 + syntheticLines - removedLines`.
   */
  removedLines: number
}

/** A markdown pipe-table row, allowing the leading whitespace the source sometimes has. */
export function isTableRow(line: string): boolean {
  return /^\s*\|/.test(line)
}

/** The `| --- | --- |` row directly under a table's header. */
function isAlignmentRow(line: string): boolean {
  return isTableRow(line) && /^\s*\|[\s:|-]*\|\s*$/.test(line) && line.includes('-')
}

/**
 * Table A's second header row, numbering the columns `(1) (2) (3a) …`.
 * It carries the column identities the indexer relies on, so a fragment that
 * omits it is materially less useful.
 */
function isNumberingRow(line: string): boolean {
  return isTableRow(line) && /\|\s*\(1\)\s*\|/.test(line)
}

/** A fence line of a fenced code block (the source has a few flowchart blocks). */
function isFence(line: string | undefined): boolean {
  return line !== undefined && /^\s{0,3}(?:```|~~~)/.test(line)
}

/**
 * The fence opening the code block that contains `idx`, or -1 when `idx` is not
 * inside one. Fences pair up from the top of the document, so this counts them.
 */
function enclosingFenceStart(lines: string[], idx: number): number {
  let open = -1
  for (let i = 0; i < idx; i++) {
    if (isFence(lines[i])) open = open === -1 ? i : -1
  }
  return open
}

function isBlank(line: string | undefined): boolean {
  return line !== undefined && line.trim() === ''
}

/**
 * Trimmed cell contents of a table row.
 *
 * The converted source pads every column to the widest cell **of that printed
 * page**, so two copies of the same header differ in internal spacing and in
 * total length. Comparing cells rather than raw text is the only way to see that
 * they are the same header.
 */
function rowCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map(cell => cell.trim())
}

/** Case- and diacritic-insensitive form, so OCR umlaut noise compares equal. */
function loosely(cell: string): string {
  return cell.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Whether two rows are the same table header.
 *
 * Deliberately fuzzy. The conversion produced **eleven different spellings** of
 * Table A's header inside a single 300-line stretch — "Gefahrzettel" appears as
 * "Gefährzettel", "Gefährdungen" and "Gefährlichkeit", "Begrenzte" as "Begrenze"
 * and "Begrenzung" — and the column count varies between 22 and 23. Exact or even
 * cell-exact comparison therefore fails, so headers are matched by how many of
 * their non-empty cells agree.
 */
function headersLookAlike(a: string, b: string): boolean {
  const left = rowCells(a).filter(Boolean).map(loosely)
  const right = rowCells(b).filter(Boolean).map(loosely)
  if (left.length === 0 || right.length === 0) return false

  const pool = new Map<string, number>()
  for (const cell of right) pool.set(cell, (pool.get(cell) ?? 0) + 1)

  let shared = 0
  for (const cell of left) {
    const left_over = pool.get(cell) ?? 0
    if (left_over > 0) {
      pool.set(cell, left_over - 1)
      shared++
    }
  }

  return shared / Math.min(left.length, right.length) >= 0.6
}

/** A table row whose every cell is empty — filler the PDF conversion leaves behind. */
function isEmptyRow(line: string): boolean {
  return isTableRow(line) && /^\s*\|(?:\s*\|)+\s*$/.test(line)
}

/**
 * Collapses the repeated header blocks the converted source emits inside one long
 * table. The real Table A re-emits its header, alignment row, an all-empty filler
 * row and the `(1) (2) …` numbering row roughly once per printed page, separated by
 * blank lines. Markdown reads each group as a new table, so a single 300-line window
 * would render as about 22 stacked tables — each its own scroll container, its own
 * keyboard tab stop and its own scrollbar.
 *
 * Only repeats *within the same table* are dropped: a blank line between two tables
 * with different headers survives, so genuinely separate tables stay separate.
 */
/**
 * Length in lines of the table header block starting at `i`, or 0 if none starts
 * there. A header block is a row followed by an alignment row, optionally followed
 * by all-empty filler rows and Table A's `(1) (2) …` numbering row.
 *
 * Detected structurally rather than by comparing text, because a window that opens
 * mid-table has no copy of the real header to compare against.
 */
function headerBlockLength(lines: string[], i: number): number {
  const first = lines[i]
  const second = lines[i + 1]
  if (first === undefined || !isTableRow(first)) return 0
  if (second === undefined || !isAlignmentRow(second)) return 0

  let length = 2
  while (isEmptyRow(lines[i + length] ?? '')) length++
  if (lines[i + length] !== undefined && isNumberingRow(lines[i + length]!)) length++
  return length
}

function compactTableRepeats(lines: string[]): string[] {
  const out: string[] = []
  let inTable = false
  /** header row of the table currently being emitted, for spotting its repeats */
  let currentHeader: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (isBlank(line)) {
      // look past a run of blank lines to see whether the same table resumes
      let j = i
      while (j < lines.length && isBlank(lines[j])) j++
      const next = lines[j]

      if (inTable && next !== undefined && isTableRow(next)) {
        const block = headerBlockLength(lines, j)
        const sameTable = block > 0
          && currentHeader !== null
          && headersLookAlike(next, currentHeader)

        if (sameTable) {
          // a page-break repeat of this table's header: drop the gap and the repeat
          i = j + block - 1
          continue
        }
        if (block === 0) {
          // the same table continues after a stray blank line
          i = j - 1
          continue
        }
        // a different table starts here: keep the separation
      }

      out.push(line)
      inTable = false
      currentHeader = null
      continue
    }

    if (isTableRow(line)) {
      // filler rows with no content in any cell are never wanted
      if (isEmptyRow(line)) continue
      if (!inTable && headerBlockLength(lines, i) > 0) currentHeader = line
      out.push(line)
      inTable = true
      continue
    }

    out.push(line)
    inTable = false
    currentHeader = null
  }

  return out
}

/** Index (0-based) of the first row of the contiguous table block containing `i`. */
function tableStartIndex(lines: string[], i: number): number {
  let start = i
  while (start > 0 && isTableRow(lines[start - 1]!)) start--
  return start
}

/**
 * The header lines of the table block starting at `start`: the header row, its
 * alignment row, and Table A's `(1) (2) …` numbering row when present.
 */
function tableHeaderLines(lines: string[], start: number): string[] {
  const header: string[] = []
  const first = lines[start]
  if (first === undefined || !isTableRow(first)) return header
  header.push(first)

  const second = lines[start + 1]
  if (second !== undefined && isAlignmentRow(second)) {
    header.push(second)
    let k = start + 2
    while (lines[k] !== undefined && isEmptyRow(lines[k]!)) k++
    if (lines[k] !== undefined && isNumberingRow(lines[k]!)) header.push(lines[k]!)
  }
  return header
}

/**
 * Window of source lines around `centerLine` (1-based), snapped outward so the
 * fragment does not begin or end in the middle of a paragraph, and carrying a
 * re-emitted table header when it begins inside a table.
 */
export function sliceAround(
  lines: string[],
  centerLine: number,
  before: number = DEFAULT_WINDOW_BEFORE,
  after: number = DEFAULT_WINDOW_AFTER,
): BookSlice {
  if (lines.length === 0) {
    return { lines: [], lineStart: 1, lineEnd: 1, syntheticLines: 0, removedLines: 0 }
  }

  const last = lines.length
  const center = Math.min(Math.max(Math.trunc(centerLine) || 1, 1), last)

  let startIdx = Math.max(0, center - 1 - Math.max(0, before))
  let endIdx = Math.min(last - 1, center - 1 + Math.max(0, after))

  // ── start boundary ───────────────────────────────────────────
  // Inside a table, stay put and re-emit the header instead of walking back:
  // table blocks contain no blank lines, so walking would swallow the whole table.
  const startsInTable = isTableRow(lines[startIdx]!)
  // a blank first line is already a clean boundary — walking from there would
  // pull in the preceding paragraph for no reason
  if (!startsInTable && !isBlank(lines[startIdx])) {
    let walked = 0
    while (startIdx > 0 && !isBlank(lines[startIdx - 1]) && walked < MAX_SNAP) {
      startIdx--
      walked++
    }
    // land on the blank line itself when there is one, so the fragment opens cleanly
    if (startIdx > 0 && isBlank(lines[startIdx - 1])) startIdx--
  }

  // A fragment that opens inside a fenced block turns its closing fence into an
  // opening one, and the rest of the window renders as literal code — headings
  // and all. Open at the fence instead.
  const fenceStart = enclosingFenceStart(lines, startIdx)
  if (fenceStart !== -1) startIdx = fenceStart

  // ── end boundary ─────────────────────────────────────────────
  const endsInTable = isTableRow(lines[endIdx]!)
  if (!endsInTable && !isBlank(lines[endIdx])) {
    let walked = 0
    while (endIdx < last - 1 && !isBlank(lines[endIdx + 1]) && walked < MAX_SNAP) {
      endIdx++
      walked++
    }
    if (endIdx < last - 1 && isBlank(lines[endIdx + 1])) endIdx++
  }

  // likewise never stop between two fences: close the block the window is in
  const fenceEnd = enclosingFenceStart(lines, endIdx + 1)
  if (fenceEnd !== -1) {
    let close = endIdx + 1
    while (close < last && !isFence(lines[close])) close++
    if (close < last) endIdx = close
  }

  const body = lines.slice(startIdx, endIdx + 1)

  // ── synthetic table header ───────────────────────────────────
  let synthetic: string[] = []
  if (startsInTable) {
    const tableStart = tableStartIndex(lines, startIdx)
    if (tableStart < startIdx) {
      const header = tableHeaderLines(lines, tableStart)
      // only prepend rows the window does not already contain
      if (header.length > 0 && tableStart + header.length <= startIdx) synthetic = header
    }
  }

  const raw = [...synthetic, ...body]
  const compacted = compactTableRepeats(raw)

  return {
    lines: compacted,
    lineStart: startIdx + 1,
    lineEnd: endIdx + 1,
    syntheticLines: synthetic.length,
    removedLines: raw.length - compacted.length,
  }
}
