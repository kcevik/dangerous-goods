// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dynamicEnv: Record<string, string | undefined> = {}
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))

const {
  buildBookIndex,
  getBookIndex,
  loadBookIndex,
  MIN_BOOK_BYTES,
  resetBookIndex,
} = await import('$lib/server/adrBook/index')

const FIXTURE_PATH = join(process.cwd(), 'tests/fixtures/adr-book-sample.md')
const FIXTURE = readFileSync(FIXTURE_PATH, 'utf8')

const tmp = mkdtempSync(join(tmpdir(), 'adr-book-'))

function tmpFile(name: string, content: string): string {
  const path = join(tmp, name)
  writeFileSync(path, content, 'utf8')
  return path
}

beforeEach(() => {
  resetBookIndex()
  for (const key of Object.keys(dynamicEnv)) delete dynamicEnv[key]
})

describe('buildBookIndex', () => {
  it('indexes headings, hits and provision codes from lines', () => {
    const index = buildBookIndex(FIXTURE.split('\n'))
    expect(index.headings.length).toBeGreaterThan(10)
    expect(index.svCodes.size).toBeGreaterThan(0)
    expect(index.hits.size).toBeGreaterThan(0)
    expect(index.lines.length).toBe(FIXTURE.split('\n').length)
  })

  it('records how big the source was and when it was built', () => {
    const index = buildBookIndex(FIXTURE.split('\n'))
    expect(index.bytes).toBeGreaterThan(0)
    expect(index.builtAt).toBeGreaterThan(0)
  })

  it('derives the UN numbers from Table A rather than needing them supplied', () => {
    const index = buildBookIndex(FIXTURE.split('\n'))
    // the fixture's Table A lists 1202, 1203 and 1263
    expect(index.hits.has('un:1203')).toBe(true)
    expect(index.hits.has('un:1202')).toBe(true)
  })

  it('does not treat a four-digit number that is not in Table A as a UN number', () => {
    const index = buildBookIndex(FIXTURE.split('\n'))
    // 3475 appears only in prose in the fixture, never as a Table A row
    const hits = index.hits.get('un:3475')
    if (hits) {
      expect(hits.every(h => h.role !== 'tableARow')).toBe(true)
    }
  })

  it('finds the provision definitions in all their line shapes', () => {
    const index = buildBookIndex(FIXTURE.split('\n'))
    for (const code of ['163', '363', '654']) {
      expect(index.svCodes.has(code), `provision ${code}`).toBe(true)
    }
  })
})

describe('loadBookIndex', () => {
  it('reads a file and indexes it', () => {
    const path = tmpFile('ok.md', FIXTURE)
    const index = loadBookIndex(path, { minBytes: 1 })
    expect(index.lines.length).toBeGreaterThan(50)
    expect(index.bytes).toBe(Buffer.byteLength(FIXTURE, 'utf8'))
  })

  it('throws a message naming the path when the file is missing', () => {
    const missing = join(tmp, 'does-not-exist.md')
    expect(() => loadBookIndex(missing, { minBytes: 1 })).toThrowError(/does-not-exist\.md/)
  })

  it('throws rather than serving a truncated book', () => {
    const path = tmpFile('tiny.md', '# ADR\n\nzu kurz\n')
    expect(() => loadBookIndex(path)).toThrowError(/truncated|incomplete/i)
  })

  it('names the expected and actual size when it refuses a short file', () => {
    const path = tmpFile('tiny2.md', '# ADR\n')
    let message = ''
    try {
      loadBookIndex(path)
    }
    catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain(String(MIN_BOOK_BYTES))
  })

  it('handles CRLF line endings, which the source family uses', () => {
    const path = tmpFile('crlf.md', FIXTURE.replace(/\n/g, '\r\n'))
    const index = loadBookIndex(path, { minBytes: 1 })
    expect(index.lines.some(l => l.endsWith('\r'))).toBe(false)
    expect(index.svCodes.has('163')).toBe(true)
  })
})

describe('getBookIndex', () => {
  it('throws with an explicit message when ADR_BOOK_PATH is not set', () => {
    expect(() => getBookIndex()).toThrowError(/ADR_BOOK_PATH/)
  })

  it('does not leak a stack trace about undefined when unconfigured', () => {
    let message = ''
    try {
      getBookIndex()
    }
    catch (error) {
      message = (error as Error).message
    }
    expect(message).not.toContain('undefined')
    expect(message.length).toBeGreaterThan(20)
  })

  it('reads the file once and memoises the result', () => {
    const path = tmpFile('memo.md', FIXTURE.repeat(200))
    dynamicEnv.ADR_BOOK_PATH = path
    const first = getBookIndex()
    const second = getBookIndex()
    expect(second).toBe(first)
  })

  it('resetBookIndex clears the memo so suites stay isolated', () => {
    const path = tmpFile('reset.md', FIXTURE.repeat(200))
    dynamicEnv.ADR_BOOK_PATH = path
    const first = getBookIndex()
    resetBookIndex()
    const second = getBookIndex()
    expect(second).not.toBe(first)
    expect(second.lines.length).toBe(first.lines.length)
  })

  it('enforces the size floor through the env path too', () => {
    dynamicEnv.ADR_BOOK_PATH = tmpFile('small-env.md', '# ADR\n')
    expect(() => getBookIndex()).toThrowError(/\d/)
  })
})
