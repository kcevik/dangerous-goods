import { readFileSync, statSync } from 'node:fs'
import { env } from '$env/dynamic/private'
import { indexBook, type IndexedBook } from './indexer'

/**
 * Loads the consolidated ADR text and indexes it in memory.
 *
 * The book is a file on the server, not a database table: reading and indexing
 * the whole 8.2 MB measures about 40 ms and 25 MB of heap, which is cheaper than
 * any scheme for pre-computing it. See spec §2.2 for the measurements.
 *
 * Every worker process holds its own copy, so budget roughly 25 MB per worker.
 */

/**
 * Smallest file we will accept. The real text is 8.2 MB; anything under a megabyte
 * is a truncated copy, a Git LFS pointer or the wrong file, and serving it would
 * silently give readers an incomplete regulation.
 */
export const MIN_BOOK_BYTES = 1_000_000

export interface BookIndex extends IndexedBook {
  /** the whole file, split once, without line terminators */
  lines: string[]
  /** size of the source file in bytes */
  bytes: number
  /** epoch milliseconds when this index was built */
  builtAt: number
}

let cached: BookIndex | null = null

/**
 * UN numbers actually listed in Table A, taken from column 1 of its data rows.
 *
 * Derived from the book itself rather than from the BAM CSV or the database, so
 * the index has no outside dependency at boot. A row qualifies when its first
 * cell is exactly four digits, which excludes the repeated numbering rows and the
 * continuation rows whose first cell is empty.
 */
function unNumbersFromTableA(lines: string[]): Set<string> {
  const found = new Set<string>()
  for (const line of lines) {
    const match = /^\s*\|\s*(\d{4})\s*\|/.exec(line)
    if (match) found.add(match[1]!)
  }
  return found
}

/** Indexes already-split lines. Pure apart from the clock, so it is easy to test. */
export function buildBookIndex(lines: string[]): BookIndex {
  const indexed = indexBook(lines, { unNumbers: unNumbersFromTableA(lines) })
  return {
    ...indexed,
    lines,
    bytes: lines.reduce((sum, line) => sum + Buffer.byteLength(line, 'utf8') + 1, -1),
    builtAt: Date.now(),
  }
}

/**
 * Reads and indexes the book at `path`.
 *
 * Fails loudly and specifically: a misconfigured deploy must break at startup
 * with a message an operator can act on, not with a type error on the first
 * reader's request.
 */
export function loadBookIndex(path: string, opts?: { minBytes?: number }): BookIndex {
  const minBytes = opts?.minBytes ?? MIN_BOOK_BYTES

  let bytes: number
  try {
    bytes = statSync(path).size
  }
  catch {
    throw new Error(
      `ADR book not found at ${path}. Set ADR_BOOK_PATH to the consolidated ADR markdown file. `
      + 'The file is not part of the repository and has to be deployed separately.',
    )
  }

  if (bytes < minBytes) {
    throw new Error(
      `ADR book at ${path} is only ${bytes} bytes, expected at least ${minBytes}. `
      + 'This looks like a truncated or wrong file; refusing to serve an incomplete regulation.',
    )
  }

  // CRLF is normalised away: this source family ships CRLF, and a trailing \r
  // would end up inside every rendered line and every hit context
  const raw = readFileSync(path, 'utf8')
  const index = buildBookIndex(raw.split(/\r?\n/))
  return { ...index, bytes }
}

/**
 * The process-wide index, built on first use from `ADR_BOOK_PATH`.
 *
 * Callers must have checked entitlement before reaching this: the book is
 * licensed content and there is no row-level-security backstop behind it.
 * See spec §7.2.
 */
export function getBookIndex(): BookIndex {
  if (cached) return cached

  const path = env.ADR_BOOK_PATH
  if (!path) {
    throw new Error(
      'ADR_BOOK_PATH is not set, so the ADR book viewer cannot start. '
      + 'Point it at the consolidated ADR markdown file on this server.',
    )
  }

  cached = loadBookIndex(path)
  return cached
}

/** Test-only: drops the memo so suites do not share an index. */
export function resetBookIndex(): void {
  cached = null
}

export type BookStatus =
  | { state: 'ready', lines: number }
  | { state: 'unconfigured' }
  | { state: 'failed', error: string }

/**
 * Whether the book can be served. Called once at server start (hooks.server.ts
 * `init`) so a missing or truncated file shows up in the logs immediately instead
 * of as a 500 for the first reader, and by /healthz so a deploy with a broken book
 * is rolled back. Cheap after the first successful build (memoised index).
 */
export function bookStatus(): BookStatus {
  if (!env.ADR_BOOK_PATH) return { state: 'unconfigured' }
  try {
    return { state: 'ready', lines: getBookIndex().lines.length }
  }
  catch (error) {
    return { state: 'failed', error: error instanceof Error ? error.message : String(error) }
  }
}
