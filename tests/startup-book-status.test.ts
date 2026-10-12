// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string | undefined> }))
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))

const { bookStatus, resetBookIndex } = await import('$lib/server/adrBook/index')

beforeEach(() => {
  delete dynamicEnv.ADR_BOOK_PATH
  resetBookIndex()
})

describe('bookStatus (startup warm-up and health)', () => {
  it('is unconfigured when ADR_BOOK_PATH is unset', () => {
    expect(bookStatus()).toEqual({ state: 'unconfigured' })
  })

  it('reports a missing or truncated file as failed, with the reason', () => {
    dynamicEnv.ADR_BOOK_PATH = '/nonexistent/adr.md'
    const missing = bookStatus()
    expect(missing.state).toBe('failed')
    expect(missing.state === 'failed' && missing.error).toMatch(/not found/)

    const dir = mkdtempSync(join(tmpdir(), 'gg-book-'))
    writeFileSync(join(dir, 'tiny.md'), '# ADR\n')
    dynamicEnv.ADR_BOOK_PATH = join(dir, 'tiny.md')
    const tiny = bookStatus()
    expect(tiny.state === 'failed' && tiny.error).toMatch(/truncated or wrong file/)
  })

  it('indexes a real-sized file and reports ready', () => {
    const fixture = readFileSync('tests/fixtures/adr-book-sample.md', 'utf8')
    const dir = mkdtempSync(join(tmpdir(), 'gg-book-'))
    const path = join(dir, 'adr.md')
    writeFileSync(path, fixture.repeat(Math.ceil(1_100_000 / fixture.length)))
    dynamicEnv.ADR_BOOK_PATH = path
    const status = bookStatus()
    expect(status.state).toBe('ready')
    expect(status.state === 'ready' && status.lines).toBeGreaterThan(1000)
  })
})
