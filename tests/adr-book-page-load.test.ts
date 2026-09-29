// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BookPageData } from '$lib/regulations/bookTypes'

const getBookIndex = vi.fn()
vi.mock('$lib/server/adrBook/index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/adrBook/index')>()
  return { ...actual, getBookIndex }
})

const { buildBookIndex } = await import('$lib/server/adrBook/index')
const { load } = await import('../src/routes/(app)/regelwerk/[mode=bookMode]/+page.server')

const fixtureIndex = buildBookIndex(readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8').split('\n'))

type Loaded = BookPageData

async function run(search: string, isActive = true): Promise<Loaded> {
  const url = new URL(`http://localhost/regelwerk/adr${search}`)
  return await load({ url, params: { mode: 'adr' }, parent: async () => ({ isActive }) } as never) as Loaded
}

beforeEach(() => {
  getBookIndex.mockReset().mockReturnValue(fixtureIndex)
})

describe('/regelwerk/adr page load', () => {
  it('returns only the lock marker for a locked account and never touches the book', async () => {
    const data = await run('?sv=163', false)
    expect(data).toEqual({ locked: true, mode: 'adr' })
    expect(getBookIndex).not.toHaveBeenCalled()
  })

  it('opens a special provision at its definition with ranked hits', async () => {
    const data = await run('?sv=163')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.target).toEqual({ kind: 'sv', code: '163' })
    expect(data.term).toBe('163')
    expect(data.hits.length).toBeGreaterThan(0)
    expect(data.hits[0]!.role).toBe('definition')
    expect(data.currentIndex).toBe(0)
    expect(data.windows).toHaveLength(1)
    const [w] = data.windows
    expect(w!.lineStart).toBeLessThanOrEqual(data.hits[0]!.line)
    expect(w!.lineEnd).toBeGreaterThanOrEqual(data.hits[0]!.line)
    expect(data.toc.every(e => e.level <= 3)).toBe(true)
    expect(data.totalLines).toBe(fixtureIndex.lines.length)
    expect(data.notFound).toBeNull()
    expect(data.fallbackFrom).toBeNull()
  })

  it('retargets a lettered provision to the paragraph that defines it', async () => {
    getBookIndex.mockReturnValue(buildBookIndex([
      '## Kapitel 3.2', '', '| UN-Nummer | Benennung | Sondervorschriften |', '| --- | --- | --- |',
      '| 1202 | DIESELKRAFTSTOFF | 640D |', '', '## Kapitel 3.3', '',
      '- 640 Die physikalischen und technischen Eigenschaften führen zu unterschiedlichen Tankcodierungen.',
      'Sondervorschrift 640D: Tankcode LGBF mit einem Dampfdruck von höchstens 110 kPa.', '',
    ]))
    const data = await run('?sv=640D')
    if (data.locked) throw new Error('expected unlocked')
    // marks and hits must describe the same code, or the active mark lands on the wrong spot
    expect(data.target).toEqual({ kind: 'sv', code: '640' })
    expect(data.term).toBe('640')
    expect(data.fallbackFrom).toBe('640D')
    expect(data.hits[0]!.role).toBe('definition')
  })

  it('opens a UN number at its Table A row', async () => {
    const data = await run('?un=1203')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.target).toEqual({ kind: 'un', code: '1203' })
    expect(data.hits[0]!.role).toBe('tableARow')
  })

  it('opens a numbered section without a hit list', async () => {
    const data = await run('?section=1.1.3.3')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.target).toEqual({ kind: 'section', sectionNo: '1.1.3.3' })
    expect(data.hits).toEqual([])
    expect(data.focusLine).toBe(fixtureIndex.headings.find(h => h.sectionNo === '1.1.3.3')!.line)
  })

  it('runs a free-text search, hits in document order', async () => {
    const data = await run('?q=Tank')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.target).toEqual({ kind: 'q', term: 'Tank' })
    const lines = data.hits.map(h => h.line)
    expect(lines).toEqual([...lines].sort((a, b) => a - b))
  })

  it('starts at the requested hit and clamps nonsense to the first', async () => {
    const all = await run('?sv=163')
    if (all.locked) throw new Error('expected unlocked')
    if (all.hits.length >= 2) {
      const second = await run('?sv=163&hit=2')
      if (second.locked) throw new Error('expected unlocked')
      expect(second.currentIndex).toBe(1)
    }
    for (const bad of ['0', '999', 'abc', '-1']) {
      const data = await run(`?sv=163&hit=${bad}`)
      if (data.locked) throw new Error('expected unlocked')
      expect(data.currentIndex).toBe(0)
    }
  })

  it('passes the incidental flag through', async () => {
    const data = await run('?sv=163&all=1')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.includeIncidental).toBe(true)
  })

  it('honours only the strongest target parameter', async () => {
    const data = await run('?sv=163&un=1203&q=Tank')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.target).toEqual({ kind: 'sv', code: '163' })
  })

  it('explains an absent provision instead of failing, keeping the TOC usable', async () => {
    const data = await run('?sv=999')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.hits).toEqual([])
    expect(data.notFound).toBe('999')
    expect(data.windows).toHaveLength(1)
    expect(data.toc.length).toBeGreaterThan(0)
  })

  it.each(['?sv=abcdefghijklmnopqrst', '?un=12', '?section=1..1', `?q=${'x'.repeat(121)}`])(
    'rejects a malformed target %s with 400',
    async (search) => {
      await expect(run(search)).rejects.toMatchObject({ status: 400 })
    },
  )

  it('opens at the start with an empty bar when no target is given', async () => {
    const data = await run('')
    if (data.locked) throw new Error('expected unlocked')
    expect(data.target).toBeNull()
    expect(data.term).toBe('')
    expect(data.hits).toEqual([])
    expect(data.windows[0]!.lineStart).toBe(1)
  })
})
