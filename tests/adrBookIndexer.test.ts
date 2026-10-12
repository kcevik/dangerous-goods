// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

import type { BookHit } from '$lib/regulations/bookTypes'
import { coverageReport, indexBook } from '$lib/server/adrBook/indexer'

/**
 * The fixture reproduces every structural quirk of the real 8.2 MB conversion:
 * the three special-provision definition shapes, a Table A excerpt with its
 * `(1) (2) (3a) …` numbering row, a Table B excerpt, the quantity trap
 * ("bei 50 °C", "mehr als 60 %"), the year trap ("Vor dem 1. Juli 2019") and
 * two headings with identical text.
 */
const FIXTURE = fileURLToPath(new URL('./fixtures/adr-book-sample.md', import.meta.url))

/**
 * UN numbers are supplied by the caller, never guessed — in production from
 * `adr_entries`, here a literal set covering the fixture's Table A column 1
 * plus the numbers mentioned in prose (1223, 3475) and the year trap (2019,
 * which really is a UN number as well as a date).
 */
const UN_NUMBERS = new Set(['1202', '1203', '1223', '1263', '2019', '3475'])

let lines: string[]
let result: ReturnType<typeof indexBook>

function hitsFor(kind: 'sv' | 'un', code: string): BookHit[] {
  return result.hits.get(`${kind}:${code}`) ?? []
}

function allHits(): BookHit[] {
  return [...result.hits.values()].flat()
}

/** The 1-based line number of the single fixture line containing `needle`. */
function lineOf(needle: string): number {
  const found = lines.flatMap((line, i) => (line.includes(needle) ? [i + 1] : []))
  expect(found, `fixture line for ${JSON.stringify(needle)}`).toHaveLength(1)
  return found[0]
}

beforeAll(() => {
  lines = readFileSync(FIXTURE, 'utf8').split(/\r?\n/)
  result = indexBook(lines, { unNumbers: UN_NUMBERS })
})

describe('indexBook – headings', () => {
  it('records every markdown heading with its level and raw text', () => {
    const levels = result.headings.map((h) => h.level)
    expect(Math.min(...levels)).toBe(1)
    expect(Math.max(...levels)).toBe(6)
    expect(result.headings[0]).toMatchObject({ level: 1, text: 'ADR', line: 1 })
  })

  it('derives sectionNo and slug from a leading ADR number', () => {
    const heading = result.headings.find((h) => h.text.startsWith('1.1.1'))
    expect(heading).toMatchObject({ level: 4, sectionNo: '1.1.1', slug: 'h-1-1-1' })
  })

  it('falls back to a text slug when the heading carries no number', () => {
    const heading = result.headings.find((h) => h.text === 'Kapitel 3.3')
    expect(heading).toMatchObject({ sectionNo: null, slug: 'h-kapitel-3-3' })
  })

  it('de-duplicates identical heading texts so anchors never collide', () => {
    const repeated = result.headings.filter((h) => h.text === 'Verwendung von Verpackungen')
    expect(repeated.map((h) => h.slug)).toEqual([
      'h-verwendung-von-verpackungen',
      'h-verwendung-von-verpackungen-2',
    ])
    const slugs = result.headings.map((h) => h.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('carries the enclosing heading path, outermost first', () => {
    const heading = result.headings.find((h) => h.sectionNo === '1.1.2.1.1')
    expect(heading?.path).toEqual([
      'ADR',
      'Teil 1 Allgemeine Vorschriften',
      'Kapitel 1.1',
      '1.1.2 Geltungsbereich',
      '1.1.2.1 Anwendung',
    ])
  })
})

describe('indexBook – special-provision definitions', () => {
  it('detects all three definition shapes as rank-1 definitions', () => {
    const shapes: Array<[string, string]> = [
      ['163', '- 163 Ein in Kapitel'],
      ['363', ' 363 Diese Eintragung'],
      ['654', '**654** Abfall-Feuerzeuge'],
    ]
    for (const [code, marker] of shapes) {
      const definitions = hitsFor('sv', code).filter((h) => h.role === 'definition')
      expect(definitions, `definition for SV ${code}`).toHaveLength(1)
      expect(definitions[0].rank).toBe(1)
      expect(definitions[0].line).toBe(lineOf(marker))
    }
  })

  it('collects exactly the fixture chapter 3.3 codes', () => {
    expect([...result.svCodes].sort()).toEqual(['163', '243', '363', '534', '654', '664'])
  })

  it('does not mistake the numbered 3.3.1 lead-in paragraph for a definition', () => {
    const leadIn = lineOf('- 3.3.1 Die in Kapitel 3.2 Tabelle A')
    expect(allHits().filter((h) => h.line === leadIn)).toEqual([])
  })

  it('finds chapter 3.3 by heading, so definitions outside it are not collected', () => {
    // "163 367 650" sits in a Table A column-6 cell in chapter 3.2 and the
    // Kapitel 3.4 prose lines start with words, not codes.
    const beyond = lineOf('Der Verpackungscode')
    expect(allHits().filter((h) => h.line === beyond)).toEqual([])
    const definitionLines = allHits()
      .filter((h) => h.role === 'definition')
      .map((h) => h.line)
    const chapter33 = lineOf('## Kapitel 3.3')
    const chapter34 = lineOf('## Kapitel 3.4')
    for (const line of definitionLines) {
      expect(line).toBeGreaterThan(chapter33)
      expect(line).toBeLessThan(chapter34)
    }
  })
})

describe('indexBook – Table A', () => {
  it('indexes the column-1 UN number of a data row as a rank-1 tableARow', () => {
    const row = lineOf('| 1203 | BENZIN oder OTTOKRAFTSTOFF')
    const hit = hitsFor('un', '1203').find((h) => h.line === row)
    expect(hit).toMatchObject({ role: 'tableARow', rank: 1 })
  })

  it('keeps every rank-1 row when one UN number has several entries', () => {
    const rows = hitsFor('un', '1263').filter((h) => h.role === 'tableARow')
    expect(rows).toHaveLength(2)
    expect(rows.map((h) => h.rank)).toEqual([1, 1])
    expect(rows[0].line).toBeLessThan(rows[1].line)
  })

  it('reads provision codes from column 6 only, as rank-4 tableASvCell', () => {
    const row = lineOf('| 1203 | BENZIN oder OTTOKRAFTSTOFF')
    for (const code of ['243', '534', '664']) {
      const hit = hitsFor('sv', code).find((h) => h.line === row)
      expect(hit, `SV ${code} from the 1203 row`).toMatchObject({
        role: 'tableASvCell',
        rank: 4,
      })
    }
  })

  it('splits a column-6 cell on <br> and on spaces alike', () => {
    // 1203 uses `243<br>534<br>664`, 1202 uses `363 664`.
    const row = lineOf('| 1202 | DIESELKRAFTSTOFF')
    const codes = allHits()
      .filter((h) => h.line === row && h.kind === 'sv')
      .map((h) => h.code)
      .sort()
    expect(codes).toEqual(['363', '664'])
  })

  it('ignores every column but 1 and 6 of a Table A row', () => {
    const row = lineOf('| 1203 | BENZIN oder OTTOKRAFTSTOFF')
    const rowHits = allHits().filter((h) => h.line === row)
    // No SV 3 from the Klasse column, no SV 1 from "1 L", no UN hit for the
    // `3` / `II` / `E2` cells: only the column-1 UN number and column 6.
    expect(rowHits.map((h) => `${h.kind}:${h.code}`).sort()).toEqual([
      'sv:243',
      'sv:534',
      'sv:664',
      'un:1203',
    ])
  })

  it('never reads a Table A column-2 quantity as a provision code', () => {
    // `| 1263 | FARBE (Dampfdruck bei 50 °C höchstens 110 kPa) | …`
    const row = lineOf('FARBE (Dampfdruck bei 50 °C')
    const codes = allHits().filter((h) => h.line === row && h.kind === 'sv').map((h) => h.code)
    expect(codes.sort()).toEqual(['163', '367'])
  })

  it('does not index the header, alignment or numbering rows', () => {
    for (const marker of ['| UN-Nummer | Benennung', '| (1) | (2) | (3a) |']) {
      expect(allHits().filter((h) => h.line === lineOf(marker))).toEqual([])
    }
    const alignmentRows = lines.flatMap((line, i) => (/^\|[\s|:-]*$/.test(line) ? [i + 1] : []))
    expect(alignmentRows.length).toBeGreaterThan(1)
    for (const line of alignmentRows) {
      expect(allHits().filter((h) => h.line === line)).toEqual([])
    }
  })
})

describe('indexBook – Table B', () => {
  it('indexes an alphabetical-list row as a rank-2 tableB hit', () => {
    const row = lineOf('| OTTOKRAFTSTOFF | 1203 |')
    const hit = hitsFor('un', '1203').find((h) => h.line === row)
    expect(hit).toMatchObject({ role: 'tableB', rank: 2 })
  })

  it('treats a table without a column-6 numbering row as Table B, not Table A', () => {
    const row = lineOf('| DIESELKRAFTSTOFF | 1202 |')
    expect(hitsFor('un', '1202').find((h) => h.line === row)?.role).toBe('tableB')
  })
})

describe('indexBook – ordinal of the listed occurrence within its line', () => {
  // The viewer highlights "the n-th match on line L", so a hit must say which
  // match it is when the same number stands in the row more than once.
  const small = [
    '### Tabelle B',
    '',
    '| Benennung | UN-Nummer |',
    '| --- | --- |',
    '| BENZIN, siehe auch 1203 | 1203 |',
    '',
    'Die Eintragung UN 1203 gilt, ebenso UN 1202 und UN 1203 in Tanks.',
  ]
  const indexed = indexBook(small, { unNumbers: new Set(['1202', '1203']) })
  const hitOn = (line: number) => indexed.hits.get('un:1203')!.find(h => h.line === line)!

  it('counts an incidental match earlier in the same row', () => {
    expect(hitOn(5)).toMatchObject({ role: 'tableB', ordinal: 1 })
  })

  it('names the first match on a prose line when that one ranks best', () => {
    expect(hitOn(7)).toMatchObject({ role: 'crossReference', ordinal: 0 })
  })

  it('gives the fixture Table A row its first-column match', () => {
    const row = lineOf('| 1203 | BENZIN oder OTTOKRAFTSTOFF |')
    expect(hitsFor('un', '1203').find(h => h.line === row)).toMatchObject({ role: 'tableARow', ordinal: 0 })
  })
})

describe('indexBook – traps', () => {
  it('does not index "bei 50 °C" or "mehr als 60 %" as provisions 50 / 60', () => {
    const trap = lineOf('Obwohl Benzin bei 50 °C')
    expect(allHits().filter((h) => h.line === trap)).toEqual([])
    expect(hitsFor('sv', '50')).toEqual([])
    expect(hitsFor('sv', '60')).toEqual([])
    // The same trap inside a chapter-3.3 definition body must not add hits either.
    const inDefinition = lineOf('- 534 Obwohl Benzin unter gewissen')
    const codes = allHits().filter((h) => h.line === inDefinition).map((h) => h.code)
    expect(codes).toEqual(['534'])
  })

  it('demotes a year-shaped UN number to rank 5 incidental', () => {
    const trap = lineOf('Vor dem 1. Juli 2019 gebaute')
    const hits = hitsFor('un', '2019')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ line: trap, rank: 5, role: 'incidental' })
  })

  it('reads a prose UN list as rank-3 cross references', () => {
    const prose = lineOf('Stoffen der UN-Nummern 1202, 1203, 1223')
    for (const code of ['1202', '1203', '1223', '3475']) {
      const hit = hitsFor('un', code).find((h) => h.line === prose)
      expect(hit, `cross reference for UN ${code}`).toMatchObject({
        role: 'crossReference',
        rank: 3,
      })
    }
  })

  it('reads "siehe Kapitel 3.3 Sondervorschrift 654" as a rank-3 cross reference', () => {
    const prose = lineOf('siehe Kapitel 3.3 Sondervorschrift 654')
    const hit = hitsFor('sv', '654').find((h) => h.line === prose)
    expect(hit).toMatchObject({ role: 'crossReference', rank: 3 })
  })

  it('does not let the cross reference displace the provision’s own definition', () => {
    const sorted = hitsFor('sv', '654')
    expect(sorted.map((h) => h.role)).toEqual(['definition', 'crossReference'])
    // …even though the cross reference comes first in the document.
    expect(sorted[0].line).toBeGreaterThan(sorted[1].line)
  })
})

describe('indexBook – invariants over the whole output', () => {
  it('sorts every hit list by rank, then by line', () => {
    for (const [key, hits] of result.hits) {
      const keys = hits.map((h) => [h.rank, h.line] as const)
      const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      expect(keys, `order of ${key}`).toEqual(sorted)
    }
  })

  it('emits hits in document order', () => {
    // The map is filled while scanning, so key order follows first occurrence.
    const firstLines = [...result.hits.values()].map((hits) =>
      Math.min(...hits.map((h) => h.line)))
    expect(firstLines).toEqual([...firstLines].sort((a, b) => a - b))
    // And within one rank class, lines ascend.
    for (const hits of result.hits.values()) {
      for (const rank of new Set(hits.map((h) => h.rank))) {
        const byRank = hits.filter((h) => h.rank === rank).map((h) => h.line)
        expect(byRank).toEqual([...byRank].sort((a, b) => a - b))
        expect(new Set(byRank).size).toBe(byRank.length)
      }
    }
  })

  it('makes (kind, code, line) unique across the whole output', () => {
    const triples = allHits().map((h) => `${h.kind}:${h.code}:${h.line}`)
    expect(new Set(triples).size).toBe(triples.length)
  })

  it('gives every hit a context of at most 180 characters containing the code', () => {
    for (const hit of allHits()) {
      expect(hit.context.length, `context length at line ${hit.line}`)
        .toBeLessThanOrEqual(180)
      expect(hit.context, `context at line ${hit.line}`).toContain(hit.code)
      expect(hit.context).not.toMatch(/<[a-z/]/i)
    }
  })

  it('attaches the nearest enclosing heading to every hit', () => {
    const definition = hitsFor('sv', '163').find((h) => h.role === 'definition')
    expect(definition?.heading?.text)
      .toBe('Für bestimmte Stoffe oder Gegenstände geltende Sondervorschriften')
    const tableRow = hitsFor('un', '1203').find((h) => h.role === 'tableARow')
    expect(tableRow?.heading?.text).toBe('Tabelle A Verzeichnis der gefährlichen Güter')
    for (const hit of allHits()) {
      expect(hit.heading, `heading at line ${hit.line}`).not.toBeNull()
      expect(hit.heading!.line).toBeLessThanOrEqual(hit.line)
    }
  })

  it('puts a rank-1 hit first for every code the fixture defines or tabulates', () => {
    for (const code of result.svCodes) {
      expect(hitsFor('sv', code)[0].role, `best hit for SV ${code}`).toBe('definition')
    }
    for (const code of ['1202', '1203', '1263']) {
      expect(hitsFor('un', code)[0].role, `best hit for UN ${code}`).toBe('tableARow')
    }
  })

  it('keeps the rank consistent with RANK_BY_ROLE', async () => {
    const { RANK_BY_ROLE } = await import('$lib/regulations/bookTypes')
    for (const hit of allHits()) expect(hit.rank).toBe(RANK_BY_ROLE[hit.role])
  })

  it('never indexes a code inside a heading line', () => {
    const headingLines = new Set(result.headings.map((h) => h.line))
    for (const hit of allHits()) expect(headingLines.has(hit.line)).toBe(false)
  })

  it('never invents hits for numbers the caller did not declare as UN numbers', () => {
    for (const hit of allHits()) {
      if (hit.kind === 'un') expect(UN_NUMBERS.has(hit.code)).toBe(true)
    }
  })
})

describe('coverageReport', () => {
  it('lists the expected codes that got no rank-1 definition', () => {
    // 367 and 650 appear in Table A column 6 but the conversion produced no
    // paragraph for them — exactly the case the owner must hear about.
    const expected = new Set(['163', '243', '363', '367', '534', '650', '654', '664'])
    expect(coverageReport(result.svCodes, expected)).toEqual(['367', '650'])
  })

  it('returns an empty list when every expected code is defined', () => {
    expect(coverageReport(new Set(['163', '243']), new Set(['163']))).toEqual([])
  })

  it('sorts numerically, not lexically, and keeps letter suffixes', () => {
    const missing = coverageReport(new Set(), new Set(['640D', '60', '274', '640A', '7']))
    expect(missing).toEqual(['7', '60', '274', '640A', '640D'])
  })
})

/**
 * The real 8.2 MB source is gitignored and absent on other machines, so this
 * block skips itself rather than failing. It asserts only edition-stable
 * properties — never line numbers, which move with every ADR edition.
 */
const REAL_BOOK = fileURLToPath(new URL('../csvbase/ADR2025-konsolidiert.md', import.meta.url))
const REAL_CSV = fileURLToPath(
  new URL('../csvbase/dgg-daten-adr-un/Straßenverkehr (ADR)/ADR25_csv.txt', import.meta.url))
const haveRealSource = existsSync(REAL_BOOK) && existsSync(REAL_CSV)

describe.skipIf(!haveRealSource)('indexBook – the real consolidated ADR text', () => {
  it('finds a provision paragraph for nearly every code the BAM data uses', () => {
    // The CSV is tab-separated and ISO-8859-1, like every BAM export.
    const csv = readFileSync(REAL_CSV, 'latin1').split(/\r?\n/).filter(Boolean)
    const header = csv[0].split('\t')
    const unAt = header.indexOf('S_UNNR')
    const svAt = header.flatMap((name, i) => (/^S_SV\d+$/.test(name) ? [i] : []))
    const unNumbers = new Set<string>()
    const expected = new Set<string>()
    for (const row of csv.slice(1)) {
      const cells = row.split('\t')
      const un = (cells[unAt] ?? '').trim()
      if (/^\d{4}$/.test(un)) unNumbers.add(un)
      for (const i of svAt) {
        const code = (cells[i] ?? '').trim()
        if (code) expected.add(code)
      }
    }

    const real = indexBook(readFileSync(REAL_BOOK, 'utf8').split(/\r?\n/), { unNumbers })

    expect(real.svCodes.size).toBeGreaterThan(300)
    // The only gap is 640A…640O: the ADR defines them inside the 640 paragraph
    // as «Sondervorschrift 640X» rather than as paragraphs of their own.
    expect(coverageReport(real.svCodes, expected).filter((c) => !c.startsWith('640')))
      .toEqual([])
    // A substance lands on its own Table A row, a provision on its own paragraph.
    expect(real.hits.get('un:1203')?.[0].role).toBe('tableARow')
    expect(real.hits.get('sv:274')?.[0].role).toBe('definition')
    // The quantity trap: "bei 50 °C" must not make provision 50 ubiquitous.
    expect(real.hits.get('sv:50') ?? []).toEqual([])
  })
})
