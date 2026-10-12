import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { keepListedMarks, markMatches, sourceLineOf } from '$lib/regulations/bookHighlighter'
import type { BookHit } from '$lib/regulations/bookTypes'

const { buildBookIndex } = await import('$lib/server/adrBook/index')
const { clearWindowCache, hitsFor, searchText, windowAt } = await import('$lib/server/adrBook/api')

/**
 * End to end over the fixture: the server's hit list and the client's marks must
 * agree, or "Treffer k von n" lies. Every listed hit must own exactly one mark,
 * on its own line, and no other match may stay highlighted.
 */
const FIXTURE = readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8')
const index = buildBookIndex(FIXTURE.split('\n'))

let root: HTMLElement

beforeEach(() => {
  clearWindowCache()
  document.body.innerHTML = ''
})

/** Renders the whole fixture as one window, as BookWindow would. */
function mountBook(): HTMLElement {
  const window = windowAt(index, 1, 0, index.lines.length)
  root = document.createElement('main')
  root.innerHTML = `<section class="book-window">${window.html}</section>`
  document.body.appendChild(root)
  return root
}

function expectConsistent(term: string, hits: BookHit[], wholeToken: boolean) {
  mountBook()
  const { marks, markOfHit } = keepListedMarks(markMatches(root, term, { wholeToken }), hits)
  expect(markOfHit, `every ${term} hit has a mark`).not.toContain(-1)
  expect(marks, `one mark per ${term} hit`).toHaveLength(hits.length)
  expect(new Set(markOfHit).size).toBe(hits.length)
  hits.forEach((hit, i) => expect(sourceLineOf(marks[markOfHit[i]!]!)).toBe(hit.line))
  expect(root.querySelectorAll('mark.book-hit')).toHaveLength(hits.length)
}

describe('free-text hits and highlights agree', () => {
  it('a line with the term twice gives two hits and two marks, visited in order', () => {
    const { hits, total } = searchText(index, 'Prüfzeichen')
    expect(total).toBe(2)
    expectConsistent('Prüfzeichen', hits, false)
    const { marks, markOfHit } = keepListedMarks(markMatches(mountBook(), 'Prüfzeichen'), hits)
    expect(markOfHit).toEqual([0, 1])
    expect(marks[0]!.compareDocumentPosition(marks[1]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('the heading containing the term is neither counted nor highlighted', () => {
    const { hits } = searchText(index, 'Prüfzeichen')
    mountBook()
    keepListedMarks(markMatches(root, 'Prüfzeichen'), hits)
    const heading = [...root.querySelectorAll('h3')].find(h => h.textContent === 'Prüfzeichen')!
    expect(heading.querySelector('mark')).toBeNull()
  })

  it.each(['Benzin', 'Stoffe', 'der', 'Tank', 'Kapitel 3.2', 'Gefahrzettel', '1203', 'wiederkehrende Prüfung', 'BB 2'])(
    'holds for "%s" across paragraphs, lists and tables',
    (term) => {
      expectConsistent(term, searchText(index, term).hits, false)
    },
  )
})

describe('code hits and highlights agree', () => {
  const keys = [...index.hits.keys()]

  it('covers provisions and UN numbers', () => {
    expect(keys.some(k => k.startsWith('sv:'))).toBe(true)
    expect(keys.some(k => k.startsWith('un:'))).toBe(true)
  })

  it.each(keys)('holds for %s, with and without incidental hits', (key) => {
    const [kind, code] = key.split(':') as ['sv' | 'un', string]
    for (const includeIncidental of [false, true]) {
      expectConsistent(code, hitsFor(index, kind, code, { includeIncidental }).hits, true)
    }
  })
})
