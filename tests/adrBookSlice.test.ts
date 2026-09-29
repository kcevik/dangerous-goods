// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WINDOW_AFTER,
  DEFAULT_WINDOW_BEFORE,
  isTableRow,
  sliceAround,
} from '$lib/server/adrBook/slice'

const FIXTURE = readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8')
const fixtureLines = FIXTURE.split(/\r?\n/)

/** 1-based line number of the first line containing `needle` */
function lineOf(lines: string[], needle: string): number {
  const i = lines.findIndex(l => l.includes(needle))
  if (i === -1) throw new Error(`fixture is missing: ${needle}`)
  return i + 1
}

describe('isTableRow', () => {
  it('recognises a pipe table row, with or without leading space', () => {
    expect(isTableRow('| 1203 | BENZIN |')).toBe(true)
    expect(isTableRow('  | 1203 |')).toBe(true)
  })

  it('rejects prose, headings and blank lines', () => {
    expect(isTableRow('')).toBe(false)
    expect(isTableRow('## Kapitel 3.3')).toBe(false)
    expect(isTableRow('Benzin und Ottokraftstoff sind zulässig.')).toBe(false)
  })
})

describe('sliceAround — ranges and clamping', () => {
  // blank lines every third line, so snapping has somewhere to land
  const lines = Array.from({ length: 60 }, (_, i) => (i % 3 === 2 ? '' : `Zeile ${i + 1}`))

  it('returns the requested number of lines either side of the centre', () => {
    const s = sliceAround(lines, 30, 5, 5)
    expect(s.lineStart).toBeLessThanOrEqual(25)
    expect(s.lineEnd).toBeGreaterThanOrEqual(35)
    expect(s.lines.length).toBe(s.lineEnd - s.lineStart + 1)
  })

  it('clamps at the start of the document', () => {
    const s = sliceAround(lines, 2, 50, 5)
    expect(s.lineStart).toBe(1)
    expect(s.lines[0]).toBe(lines[0])
  })

  it('clamps at the end of the document', () => {
    const s = sliceAround(lines, 58, 5, 50)
    expect(s.lineEnd).toBe(lines.length)
  })

  it('clamps when the centre is out of range', () => {
    expect(sliceAround(lines, 0, 2, 2).lineStart).toBe(1)
    expect(sliceAround(lines, 9999, 2, 2).lineEnd).toBe(lines.length)
  })

  it('handles a single-line document', () => {
    const s = sliceAround(['nur eine Zeile'], 1)
    expect(s.lineStart).toBe(1)
    expect(s.lineEnd).toBe(1)
    expect(s.lines).toEqual(['nur eine Zeile'])
  })

  it('uses the documented defaults when no window is given', () => {
    const many = Array.from({ length: 2000 }, (_, i) => (i % 5 === 4 ? '' : `Zeile ${i + 1}`))
    const s = sliceAround(many, 1000)
    expect(1000 - s.lineStart).toBeGreaterThanOrEqual(DEFAULT_WINDOW_BEFORE)
    expect(s.lineEnd - 1000).toBeGreaterThanOrEqual(DEFAULT_WINDOW_AFTER)
  })
})

describe('sliceAround — snapping out of the middle of a paragraph', () => {
  const lines = [
    'Erste Zeile',           // 1
    '',                      // 2
    'Absatz A Zeile eins',   // 3
    'Absatz A Zeile zwei',   // 4
    'Absatz A Zeile drei',   // 5
    'Absatz A Zeile vier',   // 6
    '',                      // 7
    'Absatz B',              // 8
    '',                      // 9
    'Letzte Zeile',          // 10
  ]

  it('moves the start backwards to a blank line rather than beginning mid-paragraph', () => {
    // a raw window would start at line 5, in the middle of paragraph A
    const s = sliceAround(lines, 6, 1, 1)
    expect(s.lineStart).toBe(2)
    expect(s.lines[0]).toBe('')
  })

  it('moves the end forwards to a blank line rather than ending mid-paragraph', () => {
    // a raw window would end at line 4, in the middle of paragraph A
    const s = sliceAround(lines, 3, 1, 1)
    expect(s.lineEnd).toBe(7)
  })

  it('does not move when the boundaries are already blank', () => {
    const s = sliceAround(lines, 8, 1, 1)
    expect(s.lineStart).toBe(7)
    expect(s.lineEnd).toBe(9)
  })
})

describe('sliceAround — tables', () => {
  const header = '| UN-Nummer | Benennung | Klasse |'
  const align = '| --- | --- | --- |'
  const numbering = '| (1) | (2) | (3a) |'
  const lines = [
    '## Kapitel 3.2',                 // 1
    '',                               // 2
    header,                           // 3
    align,                            // 4
    numbering,                        // 5
    '| 1202 | DIESELKRAFTSTOFF | 3 |', // 6
    '| 1203 | BENZIN | 3 |',          // 7
    '| 1263 | FARBE | 3 |',           // 8
    '| 1268 | ERDÖLDESTILLATE | 3 |', // 9
    '| 1863 | FLUGKRAFTSTOFF | 3 |',  // 10
    '',                               // 11
    'Nach der Tabelle folgt Text.',   // 12
  ]

  it('re-emits the header, alignment and numbering rows when the window begins inside a table', () => {
    const s = sliceAround(lines, 9, 1, 1)
    expect(s.lineStart).toBe(8)
    expect(s.syntheticLines).toBe(3)
    expect(s.lines.slice(0, 3)).toEqual([header, align, numbering])
    // the real content follows the synthetic header
    expect(s.lines[3]).toBe('| 1263 | FARBE | 3 |')
  })

  it('does not re-emit anything when the window already contains the table header', () => {
    const s = sliceAround(lines, 6, 5, 1)
    expect(s.syntheticLines).toBe(0)
    expect(s.lines.filter(l => l === header)).toHaveLength(1)
  })

  it('keeps table rows whole, never ending part way through one', () => {
    const s = sliceAround(lines, 7, 1, 1)
    for (const line of s.lines) {
      if (isTableRow(line)) expect(line.trimEnd().endsWith('|')).toBe(true)
    }
  })

  it('reports the real source range, excluding the synthetic header lines', () => {
    const s = sliceAround(lines, 9, 1, 1)
    expect(s.lines.length).toBe(s.lineEnd - s.lineStart + 1 + s.syntheticLines)
  })

  it('does not walk out of a long table looking for a blank line', () => {
    // a table has no blank lines; snapping must not drag in the whole table
    const big = [
      '', header, align,
      ...Array.from({ length: 400 }, (_, i) => `| ${1000 + i} | Stoff ${i} | 3 |`),
      '',
    ]
    const s = sliceAround(big, 300, 5, 5)
    expect(s.lineStart).toBeGreaterThan(200)
    expect(s.lines.length).toBeLessThan(40)
  })
})

describe('sliceAround — against the real fixture', () => {
  it('a window on the UN 1203 Table A row carries a usable table header', () => {
    const target = lineOf(fixtureLines, '| 1203 | BENZIN oder OTTOKRAFTSTOFF |')
    const s = sliceAround(fixtureLines, target, 1, 1)
    const text = s.lines.join('\n')
    expect(text).toContain('| 1203 | BENZIN oder OTTOKRAFTSTOFF |')
    expect(text).toContain('| --- |')
    expect(text).toMatch(/UN-Nummer|\(1\)/)
  })

  it('a window on a provision definition keeps the surrounding provisions', () => {
    const target = lineOf(fixtureLines, '- 243 Benzin und Ottokraftstoff')
    const s = sliceAround(fixtureLines, target, 3, 3)
    const text = s.lines.join('\n')
    expect(text).toContain('- 243 Benzin und Ottokraftstoff')
    expect(text).toContain('163')
  })
})

describe('sliceAround — the real Table A repeats its header block', () => {
  // The converted source re-emits Table A's header roughly once per printed page:
  // header row, alignment row, an all-empty row, then the (1) (2) numbering row,
  // separated by blank lines. Left alone, one 300-line window renders as ~22
  // separate tables, each its own scroll container and its own tab stop.
  const header = '| UN-Nummer | Benennung | Klasse |'
  const align = '| --- | --- | --- |'
  const empty = '| | | |'
  const numbering = '| (1) | (2) | (3a) |'

  function page(from: number): string[] {
    return [
      header,
      align,
      empty,
      numbering,
      `| ${from} | Stoff A | 3 |`,
      `| ${from + 1} | Stoff B | 3 |`,
      '',
    ]
  }

  const lines = ['## Kapitel 3.2', '', ...page(1200), ...page(1300), ...page(1400), 'Schlusstext.']

  it('emits one table, not one per repeated header block', () => {
    const s = sliceAround(lines, 10, 40, 40)
    const text = s.lines.join('\n')
    // the header survives exactly once
    expect(text.split(header).length - 1).toBe(1)
    expect(text.split(align).length - 1).toBe(1)
    expect(text.split(numbering).length - 1).toBe(1)
  })

  it('keeps every data row while dropping the repeats', () => {
    const s = sliceAround(lines, 10, 40, 40)
    const text = s.lines.join('\n')
    for (const un of [1200, 1201, 1300, 1301, 1400, 1401]) {
      expect(text, `UN ${un}`).toContain(`| ${un} |`)
    }
  })

  it('drops the blank lines that would split the table in two', () => {
    const s = sliceAround(lines, 10, 40, 40)
    const rows = s.lines.filter(l => isTableRow(l))
    const firstRow = s.lines.indexOf(rows[0]!)
    const lastRow = s.lines.lastIndexOf(rows[rows.length - 1]!)
    const inside = s.lines.slice(firstRow, lastRow + 1)
    expect(inside.filter(l => l.trim() === '')).toHaveLength(0)
  })

  it('drops the all-empty filler row', () => {
    const s = sliceAround(lines, 10, 40, 40)
    expect(s.lines.filter(l => l === empty)).toHaveLength(0)
  })

  it('reports how many lines it removed, so the range stays reconcilable', () => {
    const s = sliceAround(lines, 10, 40, 40)
    expect(s.removedLines).toBeGreaterThan(0)
    expect(s.lines.length).toBe(s.lineEnd - s.lineStart + 1 + s.syntheticLines - s.removedLines)
  })

  it('leaves prose and headings after the table alone', () => {
    const s = sliceAround(lines, 10, 40, 40)
    const text = s.lines.join('\n')
    expect(text).toContain('## Kapitel 3.2')
    expect(text).toContain('Schlusstext.')
  })

  it('does not merge two genuinely different tables', () => {
    const otherHeader = '| Code | Bedeutung |'
    const two = [
      header, align, '| 1203 | BENZIN | 3 |',
      '',
      otherHeader, '| --- | --- |', '| SV 243 | Benzin |',
    ]
    const s = sliceAround(two, 3, 10, 10)
    const text = s.lines.join('\n')
    expect(text).toContain(header)
    expect(text).toContain(otherHeader)
    // the blank line between two different tables must survive
    expect(s.lines.some(l => l.trim() === '')).toBe(true)
  })
})

describe('sliceAround — the conversion misspells the repeated header', () => {
  // Real finding: inside one 300-line stretch of Table A the converted source
  // carries eleven different spellings of the same header — "Gefahrzettel" appears
  // as "Gefährzettel", "Gefährdungen" and "Gefährlichkeit", "Begrenzte" as
  // "Begrenze" — and the column count varies between 22 and 23. Repeat detection
  // has to tolerate that or it collapses nothing at all.
  const good = '| UN-Nummer | Benennung und Beschreibung | Klasse | Gefahrzettel | Sondervorschriften |'
  const ocr1 = '| UN-Nummer | Benennung und Beschreibung | Klasse | Gefährzettel | Sondervorschriften |'
  const ocr2 = '| UN-Nummer | Benennung und Beschreibung | Klasse | Gefährdungen | Sondervorschriften |'
  const padded = '|  UN-Nummer  |  Benennung und Beschreibung   |  Klasse |  Gefahrzettel  | Sondervorschriften  |'
  const align = '|-----------|--------|--------|--------|--------|'

  const lines = [
    good, align, '| 1202 | DIESELKRAFTSTOFF | 3 | 3 | 363 |',
    '',
    ocr1, align, '| 1203 | BENZIN | 3 | 3 | 243 |',
    '',
    ocr2, align, '| 1263 | FARBE | 3 | 3 | 163 |',
    '',
    padded, align, '| 1268 | ERDÖLDESTILLATE | 3 | 3 | 363 |',
  ]

  it('collapses headers that differ only by OCR noise or padding', () => {
    const s = sliceAround(lines, 3, 40, 40)
    const headerRows = s.lines.filter(l => l.includes('UN-Nummer'))
    expect(headerRows).toHaveLength(1)
  })

  it('keeps all four data rows', () => {
    const s = sliceAround(lines, 3, 40, 40)
    const text = s.lines.join('\n')
    for (const un of [1202, 1203, 1263, 1268]) {
      expect(text, `UN ${un}`).toContain(`| ${un} |`)
    }
  })

  it('still refuses to merge a table with a genuinely different header', () => {
    const other = '| Code | Bedeutung |'
    const two = [good, align, '| 1203 | BENZIN | 3 | 3 | 243 |', '', other, '| --- | --- |', '| SV 243 | Benzin |']
    const s = sliceAround(two, 3, 20, 20)
    expect(s.lines.filter(l => l.includes('Code'))).toHaveLength(1)
    expect(s.lines.some(l => l.trim() === '')).toBe(true)
  })
})
