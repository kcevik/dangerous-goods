// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/server/adrBook/render', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/adrBook/render')>()
  return { ...actual, renderSlice: vi.fn(actual.renderSlice) }
})

const { renderSlice } = await import('$lib/server/adrBook/render')
const { buildBookIndex } = await import('$lib/server/adrBook/index')
const {
  clearWindowCache,
  hitsFor,
  resolvePrimaryHit,
  searchText,
  toc,
  WINDOW_CACHE_SIZE,
  windowAt,
} = await import('$lib/server/adrBook/api')

const renderSpy = vi.mocked(renderSlice)

const FIXTURE = readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8')
const fixtureIndex = buildBookIndex(FIXTURE.split('\n'))

beforeEach(() => {
  clearWindowCache()
  renderSpy.mockClear()
})

describe('resolvePrimaryHit', () => {
  it('lands on a provision definition, not on a Table A cell', () => {
    const hit = resolvePrimaryHit(fixtureIndex, { kind: 'sv', code: '163' })
    expect(hit).not.toBeNull()
    expect(hit!.role).toBe('definition')
    expect(hit!.rank).toBe(1)
  })

  it('lands on the Table A row for a UN number', () => {
    const hit = resolvePrimaryHit(fixtureIndex, { kind: 'un', code: '1203' })
    expect(hit).not.toBeNull()
    expect(hit!.role).toBe('tableARow')
    expect(fixtureIndex.lines[hit!.line - 1]).toContain('BENZIN oder OTTOKRAFTSTOFF')
  })

  it('returns null for a code that does not occur', () => {
    expect(resolvePrimaryHit(fixtureIndex, { kind: 'sv', code: '9999' })).toBeNull()
    expect(resolvePrimaryHit(fixtureIndex, { kind: 'un', code: '9999' })).toBeNull()
  })

  it('resolves a section number to its heading', () => {
    const hit = resolvePrimaryHit(fixtureIndex, { kind: 'section', sectionNo: '1.1.3.3' })
    expect(hit).not.toBeNull()
    expect(fixtureIndex.lines[hit!.line - 1]).toContain('1.1.3.3')
  })

  it('returns null for an unknown section number', () => {
    expect(resolvePrimaryHit(fixtureIndex, { kind: 'section', sectionNo: '9.9.9.9' })).toBeNull()
  })

  it('resolves a free-text target to its first match', () => {
    const hit = resolvePrimaryHit(fixtureIndex, { kind: 'q', term: 'Additivierungseinrichtungen' })
    expect(hit).not.toBeNull()
    expect(fixtureIndex.lines[hit!.line - 1]).toContain('Additivierungseinrichtungen')
  })
})

describe('resolvePrimaryHit — lettered provisions have no definition of their own', () => {
  // 640A..640O are defined only inside provision 640's paragraph, as
  // «Sondervorschrift 640X» rows, so 640D has no rank-1 hit anywhere. Without a
  // fallback the reader lands on an unrelated substance row.
  const lines = [
    '## Kapitel 3.2',
    '',
    '| UN-Nummer | Benennung | Sondervorschriften |',
    '| --- | --- | --- |',
    '| 1202 | DIESELKRAFTSTOFF | 640D |',
    '',
    '## Kapitel 3.3',
    '',
    '- 640 Die physikalischen und technischen Eigenschaften führen zu unterschiedlichen Tankcodierungen.',
    'Sondervorschrift 640D: Tankcode LGBF mit einem Dampfdruck von höchstens 110 kPa.',
    '',
    '## Kapitel 3.4',
    '',
    'Weiterer Text.',
  ]
  const index = buildBookIndex(lines)

  it('falls back to the numeric parent provision', () => {
    const hit = resolvePrimaryHit(index, { kind: 'sv', code: '640D' })
    expect(hit).not.toBeNull()
    // the 640 paragraph, not the Table A cell on line 5
    expect(hit!.line).toBeGreaterThan(6)
    expect(index.lines[hit!.line - 1]).toContain('640')
  })

  it('prefers a real definition over the parent when one exists', () => {
    const hit = resolvePrimaryHit(index, { kind: 'sv', code: '640' })
    expect(hit!.role).toBe('definition')
  })

  it('does not invent a hit when neither the code nor its parent occurs', () => {
    expect(resolvePrimaryHit(index, { kind: 'sv', code: '999Z' })).toBeNull()
  })

  it('reports that the answer came from the parent, so the UI can say so', () => {
    const resolved = resolvePrimaryHit(index, { kind: 'sv', code: '640D' })
    expect(resolved!.code).toBe('640')
  })
})

describe('hitsFor', () => {
  it('orders by rank, then by line', () => {
    const { hits } = hitsFor(fixtureIndex, 'un', '1203', { includeIncidental: true, limit: 500 })
    for (let i = 1; i < hits.length; i++) {
      const previous = hits[i - 1]!
      const current = hits[i]!
      expect(previous.rank <= current.rank).toBe(true)
      if (previous.rank === current.rank) expect(previous.line <= current.line).toBe(true)
    }
  })

  it('hides rank-5 noise unless asked', () => {
    const quiet = hitsFor(fixtureIndex, 'un', '2019', { includeIncidental: false, limit: 500 })
    const loud = hitsFor(fixtureIndex, 'un', '2019', { includeIncidental: true, limit: 500 })
    expect(quiet.hits.every(h => h.rank < 5)).toBe(true)
    expect(loud.total).toBeGreaterThanOrEqual(quiet.total)
  })

  it('reports total and capped when the limit bites', () => {
    const { hits, total, capped } = hitsFor(fixtureIndex, 'un', '1203', { includeIncidental: true, limit: 1 })
    expect(hits).toHaveLength(1)
    expect(total).toBeGreaterThan(1)
    expect(capped).toBe(true)
  })

  it('is not capped when everything fits', () => {
    const { capped } = hitsFor(fixtureIndex, 'sv', '163', { includeIncidental: true, limit: 500 })
    expect(capped).toBe(false)
  })

  it('returns an empty result for an unknown code', () => {
    const result = hitsFor(fixtureIndex, 'sv', '9999', { includeIncidental: true, limit: 500 })
    expect(result.hits).toEqual([])
    expect(result.total).toBe(0)
    expect(result.capped).toBe(false)
  })

  it('never lets the cap hide a better-ranked hit', () => {
    const { hits } = hitsFor(fixtureIndex, 'un', '1203', { includeIncidental: true, limit: 2 })
    expect(hits[0]!.rank).toBeLessThanOrEqual(hits[1]!.rank)
    const all = hitsFor(fixtureIndex, 'un', '1203', { includeIncidental: true, limit: 500 })
    expect(hits[0]!.line).toBe(all.hits[0]!.line)
  })
})

describe('searchText', () => {
  it('finds a term and reports where', () => {
    const { hits, total } = searchText(fixtureIndex, 'Ottokraftstoff', 500)
    expect(total).toBeGreaterThan(0)
    expect(hits[0]!.line).toBeGreaterThan(0)
    expect(hits[0]!.context.toLowerCase()).toContain('ottokraftstoff')
  })

  it('ignores case and diacritics', () => {
    const plain = searchText(fixtureIndex, 'gefahrzettel', 500)
    const accented = searchText(fixtureIndex, 'GEFÄHRZETTEL', 500)
    expect(plain.total).toBeGreaterThan(0)
    expect(accented.total).toBeGreaterThan(0)
  })

  it('treats the term as a literal, not a pattern', () => {
    expect(searchText(fixtureIndex, '.*', 500).total).toBe(0)
    expect(searchText(fixtureIndex, 'Kapitel 3.2', 500).total).toBeGreaterThan(0)
  })

  it('rejects a term that is too short', () => {
    expect(searchText(fixtureIndex, 'a', 500).total).toBe(0)
    expect(searchText(fixtureIndex, '', 500).total).toBe(0)
  })

  it('rejects an absurdly long term rather than scanning for it', () => {
    expect(searchText(fixtureIndex, 'x'.repeat(500), 500).total).toBe(0)
  })

  it('caps the list and still reports the true total', () => {
    const { hits, total, capped } = searchText(fixtureIndex, 'der', 2)
    expect(hits.length).toBeLessThanOrEqual(2)
    expect(total).toBeGreaterThan(2)
    expect(capped).toBe(true)
  })

  it('does not search heading lines, which would scroll the reader to a caption', () => {
    const { hits } = searchText(fixtureIndex, 'Kapitel 3.3', 500)
    for (const hit of hits) {
      expect(fixtureIndex.lines[hit.line - 1]!.startsWith('#')).toBe(false)
    }
  })
})

describe('windowAt', () => {
  it('returns sanitised HTML plus the snapped range', () => {
    const target = fixtureIndex.lines.findIndex(l => l.includes('| 1203 |')) + 1
    const win = windowAt(fixtureIndex, target, 5, 5)
    expect(win.html).toContain('<table')
    expect(win.lineStart).toBeLessThanOrEqual(target)
    expect(win.lineEnd).toBeGreaterThanOrEqual(target)
  })

  it('lists the headings the window spans', () => {
    const target = fixtureIndex.lines.findIndex(l => l.includes('- 163 Ein in Kapitel')) + 1
    const win = windowAt(fixtureIndex, target, 10, 10)
    expect(win.headings.length).toBeGreaterThan(0)
    expect(win.headings.every(h => h.slug.startsWith('h-'))).toBe(true)
  })

  it('emits only book- classes, never Tailwind utilities', () => {
    const win = windowAt(fixtureIndex, 50, 40, 40)
    for (const match of win.html.matchAll(/class="([^"]*)"/g)) {
      for (const name of match[1]!.split(/\s+/).filter(Boolean)) {
        expect(name, name).toMatch(/^book-/)
      }
    }
  })

  it('clamps a line beyond the document', () => {
    const win = windowAt(fixtureIndex, 999_999, 5, 5)
    expect(win.lineEnd).toBeLessThanOrEqual(fixtureIndex.lines.length)
  })
})

describe('windowAt — render cache', () => {
  it('renders the same range only once', () => {
    windowAt(fixtureIndex, 60, 10, 10)
    expect(renderSpy).toHaveBeenCalledTimes(1)
    windowAt(fixtureIndex, 60, 10, 10)
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('shares an entry between two targets that snap to the same window', () => {
    const a = windowAt(fixtureIndex, 60, 10, 10)
    const calls = renderSpy.mock.calls.length
    const b = windowAt(fixtureIndex, 61, 11, 9)
    if (a.lineStart === b.lineStart && a.lineEnd === b.lineEnd) {
      expect(renderSpy.mock.calls.length).toBe(calls)
      expect(b.html).toBe(a.html)
    }
  })

  it('renders again for a different range', () => {
    windowAt(fixtureIndex, 20, 5, 5)
    windowAt(fixtureIndex, 90, 5, 5)
    expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('is bounded and evicts the least recently used entry', () => {
    // fill past the cap with distinct ranges
    for (let i = 0; i < WINDOW_CACHE_SIZE + 5; i++) {
      windowAt(fixtureIndex, 3 + i, 1, 1)
    }
    const afterFill = renderSpy.mock.calls.length
    // the earliest range should have been evicted, so it renders again
    windowAt(fixtureIndex, 3, 1, 1)
    expect(renderSpy.mock.calls.length).toBeGreaterThan(afterFill)
  })

  it('keeps a recently used entry while evicting older ones', () => {
    windowAt(fixtureIndex, 3, 1, 1)
    for (let i = 0; i < WINDOW_CACHE_SIZE - 1; i++) {
      windowAt(fixtureIndex, 10 + i, 1, 1)
      windowAt(fixtureIndex, 3, 1, 1) // keep touching the first entry
    }
    const before = renderSpy.mock.calls.length
    windowAt(fixtureIndex, 3, 1, 1)
    expect(renderSpy.mock.calls.length).toBe(before)
  })

  it('does not serve one index\'s window from another index\'s cache', () => {
    const other = buildBookIndex([
      '# Anderes Dokument', '', 'Vollkommen anderer Inhalt hier.', '', 'Noch mehr Text.',
    ])
    const a = windowAt(fixtureIndex, 3, 1, 1)
    const b = windowAt(other, 3, 1, 1)
    expect(b.html).not.toBe(a.html)
  })
})

describe('toc', () => {
  it('returns headings in document order', () => {
    const entries = toc(fixtureIndex)
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i]!.line).toBeGreaterThan(entries[i - 1]!.line)
    }
  })

  it('respects maxLevel', () => {
    const shallow = toc(fixtureIndex, 2)
    expect(shallow.every(e => e.level <= 2)).toBe(true)
    expect(toc(fixtureIndex, 6).length).toBeGreaterThan(shallow.length)
  })

  it('carries the anchor slug so the viewer can link to it', () => {
    expect(toc(fixtureIndex, 3).every(e => e.slug.startsWith('h-'))).toBe(true)
  })
})

describe('windowAt source-line tags', () => {
  it('tags each table row with the book line it came from', () => {
    const tableA = fixtureIndex.hits.get('un:1203')!.find(h => h.role === 'tableARow')!
    const rendered = windowAt(fixtureIndex, tableA.line)
    const tagged = [...rendered.html.matchAll(/<tr class="book-ln-(\d+)">\s*<t[hd][^>]*>([^<]*)</g)]
    expect(tagged.length).toBeGreaterThan(0)
    for (const [, line, firstCell] of tagged) {
      const source = fixtureIndex.lines[Number(line) - 1]!
      expect(source.split('|')[1]!.trim()).toBe(firstCell!.trim())
    }
    expect(tagged.some(([, line]) => Number(line) === tableA.line)).toBe(true)
  })
})
