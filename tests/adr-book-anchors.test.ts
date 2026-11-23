// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

const { buildBookIndex } = await import('$lib/server/adrBook/index')
const { clearWindowCache, toc, windowAt } = await import('$lib/server/adrBook/api')

const FIXTURE = readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8')
const fixtureIndex = buildBookIndex(FIXTURE.split('\n'))

beforeEach(() => clearWindowCache())

/**
 * The viewer scrolls to a TOC entry or a `?section=` heading by its index slug,
 * so the rendered window must carry exactly that id — whatever the heading's
 * markup (bold, entities, umlauts) and however the windows are cut.
 */
describe('heading anchors: index slug === rendered id', () => {
  it('holds for every heading in a default window around it', () => {
    const missing = fixtureIndex.headings.filter(h => !windowAt(fixtureIndex, h.line).html.includes(`id="${h.slug}"`))
    expect(missing.map(h => `${h.line} ${h.text} → ${h.slug}`)).toEqual([])
  })

  it('holds in a narrow window that does not contain the first of two identical headings', () => {
    const missing = fixtureIndex.headings.filter(h => !windowAt(fixtureIndex, h.line, 2, 2).html.includes(`id="${h.slug}"`))
    expect(missing.map(h => `${h.line} ${h.text} → ${h.slug}`)).toEqual([])
  })

  it('covers a bold heading, an entity heading and a duplicate heading in the fixture', () => {
    const raw = fixtureIndex.headings.map(h => fixtureIndex.lines[h.line - 1]!)
    expect(raw.some(t => /^#+ \*\*/.test(t))).toBe(true)
    expect(raw.some(t => t.includes('&amp;'))).toBe(true)
    // the labels are clean: no emphasis markers, entities decoded
    const texts = fixtureIndex.headings.map(h => h.text)
    expect(texts.filter(t => t.includes('*'))).toEqual([])
    expect(texts).toContain('Übergangsvorschriften & Ausnahmen')
    expect(texts.filter(t => t === 'Verwendung von Verpackungen')).toHaveLength(2)
  })

  it('every level 1–3 TOC entry is reachable in the window the viewer loads for its line', () => {
    for (const entry of toc(fixtureIndex, 3)) {
      const window = windowAt(fixtureIndex, entry.line)
      expect(window.headings.map(h => h.slug)).toContain(entry.slug)
      expect(window.html).toContain(`id="${entry.slug}"`)
    }
  })

  it('leaves no internal heading-line class in the output', () => {
    expect(windowAt(fixtureIndex, 60).html).not.toContain('book-hl-')
  })
})
