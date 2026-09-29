// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderSlice, toPlainText } from '$lib/server/adrBook/render'

/**
 * The source document is a machine conversion from an unverified PDF pipeline,
 * so its inline HTML is untrusted even though the file lives in our own repo.
 * These tests pin the allowlist and the post-processing of spec §2.4.
 */

const FIXTURE_PATH = fileURLToPath(new URL('./fixtures/adr-book-sample.md', import.meta.url))
const FIXTURE = readFileSync(FIXTURE_PATH, 'utf-8')

/** The Kapitel 9.9 block: one wide table and nothing else. */
function chapter99(): string {
  const start = FIXTURE.indexOf('## Kapitel 9.9')
  const end = FIXTURE.indexOf('## Kapitel 9.10')
  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)
  return FIXTURE.slice(start, end)
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('renderSlice', () => {
  const html = renderSlice(FIXTURE)

  it('returns a string synchronously, never a promise', () => {
    expect(typeof html).toBe('string')
    expect(html).not.toBeInstanceOf(Promise)
    expect(html.length).toBeGreaterThan(0)
  })

  describe('GFM tables', () => {
    it('renders pipe tables as real tables', () => {
      expect(html).toContain('<table>')
      expect(html).toContain('<thead>')
      expect(html).toContain('<td>1203</td>')
    })

    it('wraps every table in a keyboard-scrollable region', () => {
      const tables = countOccurrences(html, '<table>')
      expect(tables).toBe(3) // Tabelle A, Tabelle B, Kapitel 9.9
      expect(countOccurrences(html, 'class="book-table-scroll"')).toBe(tables)
      expect(countOccurrences(html, '</table></div>')).toBe(tables)
    })

    it('gives the wrapper role, tabindex and an aria-label', () => {
      const wrapper = html.match(/<div class="book-table-scroll"[^>]*>/)
      expect(wrapper).not.toBeNull()
      const openTag = wrapper![0]
      expect(openTag).toContain('role="region"')
      expect(openTag).toContain('tabindex="0"')
      expect(openTag).toMatch(/aria-label="[^"]+"/)
      // the wrapper sits immediately around the table, not somewhere near it
      expect(html).toContain(`${openTag}<table>`)
    })

    it('produces exactly one scroll container for the Kapitel 9.9 table', () => {
      const slice = renderSlice(chapter99())
      expect(countOccurrences(slice, '<table>')).toBe(1)
      expect(countOccurrences(slice, 'class="book-table-scroll"')).toBe(1)
      expect(countOccurrences(slice, '</table></div>')).toBe(1)
    })

    it('leaves the German table text unmangled', () => {
      const slice = renderSlice(chapter99())
      expect(slice).toContain('Bezeichnung des Bauteils und seiner Verwendung im Fahrzeug')
      expect(slice).toContain('Mindestwanddicke in Millimetern')
      expect(slice).toContain('rostfreier austenitischer Stahl')
      expect(slice).toContain('Aluminiumlegierungen')
      expect(slice).toContain('Aluminium, 99,80 % rein')
      expect(slice).toContain('wiederkehrende Prüfung alle sechs Jahre nach Abschnitt 6.8.2.4')
      expect(slice).toContain('<td>2,5</td>')
    })
  })

  describe('inline HTML the conversion relies on', () => {
    it('keeps br, sup, sub and b from the source', () => {
      // sanitize-html normalises void elements, so the source's `<br>` comes
      // back as `<br />` — equivalent in HTML5, and worth pinning so a later
      // change of library cannot quietly drop line breaks instead.
      expect(html).toMatch(/<br\s*\/?>/)
      expect(html).toContain('<sup>1)</sup>')
      expect(html).toContain('<b>BB 2</b>')
      expect(html).toContain('H<sub>2</sub>O<sub>2</sub>')
    })

    it('keeps i and u', () => {
      const out = renderSlice('Ein <i>kursiver</i> und ein <u>unterstrichener</u> Hinweis.')
      expect(out).toContain('<i>kursiver</i>')
      expect(out).toContain('<u>unterstrichener</u>')
    })

    it('keeps div and a title on a safe link', () => {
      expect(html).toContain('Zusätzliche Hinweise zur Kennzeichnung')
      expect(html).toContain('href="https://www.unece.org/trans/danger"')
      expect(html).toContain('title="UNECE"')
    })
  })

  describe('sanitisation', () => {
    it('removes script tags including their text content', () => {
      expect(html).not.toContain('<script')
      expect(html).not.toContain('</script')
      expect(html).not.toContain('alert(1)')
      expect(html).not.toContain('alert')
    })

    it('removes style elements including their content', () => {
      const out = renderSlice('<style>body{display:none}</style>\n\nText.')
      expect(out).not.toContain('<style')
      expect(out).not.toContain('display:none')
      expect(out).toContain('Text.')
    })

    it('removes every on* event attribute', () => {
      expect(html).not.toMatch(/\son[a-z]+\s*=/i)
      const out = renderSlice(
        '<div onmouseover="x()" onfocus="y()"><b onclick="z()">Text</b></div>',
      )
      expect(out).not.toMatch(/\son[a-z]+\s*=/i)
      expect(out).toContain('Text')
    })

    it('removes javascript: hrefs but keeps http(s) and mailto', () => {
      expect(html).not.toContain('javascript:')
      const out = renderSlice(
        '[a](javascript:alert(1)) [b](https://gefahrgut.org) [c](mailto:info@gefahrgut.org) [d](data:text/html;base64,x)',
      )
      expect(out).not.toContain('javascript:')
      expect(out).not.toContain('data:text/html')
      expect(out).toContain('href="https://gefahrgut.org"')
      expect(out).toContain('href="mailto:info@gefahrgut.org"')
    })

    it('removes data-* and style attributes', () => {
      expect(html).not.toContain('data-bbox')
      expect(html).not.toMatch(/\sdata-[a-z-]+=/i)
      expect(html).not.toMatch(/\sstyle=/i)
    })

    it('drops tags that are not on the allowlist', () => {
      const out = renderSlice(
        '<iframe src="https://evil.example"></iframe><form action="/x"><input name="q"><button>go</button></form><object data="x"></object>\n\nText.',
      )
      expect(out).not.toContain('<iframe')
      expect(out).not.toContain('<form')
      expect(out).not.toContain('<input')
      expect(out).not.toContain('<button')
      expect(out).not.toContain('<object')
      expect(out).toContain('Text.')
    })

    it('leaves no img element in the output', () => {
      expect(html).not.toContain('<img')
    })
  })

  describe('missing figures', () => {
    it('replaces img with a labelled placeholder carrying the alt text', () => {
      expect(html).toContain(
        '<span class="book-figure-missing" role="img" aria-label="Gefahrzettel 3: Flamme.">'
        + '[Abbildung: Gefahrzettel 3: Flamme.]</span>',
      )
      expect(html).not.toContain('abc_img.jpg')
    })

    it('escapes a hostile alt text instead of re-emitting markup', () => {
      const out = renderSlice('<img alt="&quot;x&quot; <b>bold</b>" src="a.jpg">')
      expect(out).toContain('class="book-figure-missing"')
      expect(out).not.toContain('<b>bold</b>')
      expect(out).toContain('&lt;b&gt;')
    })

    it('falls back to a generic label when the alt text is missing', () => {
      const out = renderSlice('<img src="a.jpg">')
      expect(out).toContain(
        '<span class="book-figure-missing" role="img" aria-label="Abbildung">[Abbildung]</span>',
      )
    })
  })

  describe('heading anchors', () => {
    it('derives the id from a leading ADR number', () => {
      expect(html).toContain('<h4 id="h-1-1-1">1.1.1 Aufbau</h4>')
      expect(html).toContain('id="h-1-1-2-1"')
      expect(html).toContain('id="h-1-1-2-1-1"')
      expect(html).toContain('id="h-1-1-3-3"')
    })

    it('derives the id from the text when there is no number', () => {
      expect(html).toContain('<h1 id="h-adr">ADR</h1>')
      expect(html).toContain('id="h-kapitel-3-3"')
      expect(html).toContain('id="h-tabelle-b-alphabetisches-verzeichnis"')
    })

    it('suffixes a duplicate slug rather than repeating an id', () => {
      expect(html).toContain('id="h-verwendung-von-verpackungen"')
      expect(html).toContain('id="h-verwendung-von-verpackungen-2"')
      expect(countOccurrences(html, 'id="h-verwendung-von-verpackungen"')).toBe(1)
    })

    it('emits every id exactly once within one slice', () => {
      const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1])
      expect(ids.length).toBeGreaterThan(5)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('keeps ids unique across slices when a shared registry is passed', () => {
      const registry = new Set<string>()
      const first = renderSlice('### Verwendung von Verpackungen', { slugRegistry: registry })
      const second = renderSlice('### Verwendung von Verpackungen', { slugRegistry: registry })
      const third = renderSlice('### Verwendung von Verpackungen', { slugRegistry: registry })
      expect(first).toContain('id="h-verwendung-von-verpackungen"')
      expect(second).toContain('id="h-verwendung-von-verpackungen-2"')
      expect(third).toContain('id="h-verwendung-von-verpackungen-3"')
    })

    it('restarts numbering when no registry is shared', () => {
      const a = renderSlice('### Verwendung von Verpackungen')
      const b = renderSlice('### Verwendung von Verpackungen')
      expect(a).toBe(b)
    })

    it('transliterates German characters in a text slug', () => {
      const out = renderSlice('## Größe der Gefäße für Öl')
      expect(out).toContain('id="h-groesse-der-gefaesse-fuer-oel"')
    })

    it('ignores an id supplied by the source document', () => {
      const out = renderSlice('<h2 id="evil">1.2 Begriffsbestimmungen</h2>')
      expect(out).not.toContain('id="evil"')
      expect(out).toContain('id="h-1-2"')
    })
  })

  describe('class guard', () => {
    // Tailwind v4 only scans src/**, so a utility class produced at runtime
    // compiles to nothing. Same property tests/tailwind-classes.test.ts guards
    // for components, here for HTML built per request.
    it('emits only book-prefixed class names', () => {
      const attributes = [...html.matchAll(/class="([^"]*)"/g)].map(m => m[1])
      expect(attributes.length).toBeGreaterThan(0)
      const offenders = attributes
        .flatMap(value => value.split(/\s+/))
        .filter(token => token.length > 0 && !token.startsWith('book-'))
      expect(offenders).toEqual([])
    })

    it('strips class names the source document brings along', () => {
      const out = renderSlice(
        '<p class="text-red-500 book-note">Hinweis</p><div class="grid grid-cols-2">x</div>',
      )
      expect(out).not.toContain('text-red-500')
      expect(out).not.toContain('grid-cols-2')
      expect(out).toContain('class="book-note"')
      const offenders = [...out.matchAll(/class="([^"]*)"/g)]
        .flatMap(m => m[1].split(/\s+/))
        .filter(token => token.length > 0 && !token.startsWith('book-'))
      expect(offenders).toEqual([])
    })

    it('never emits an empty or single-quoted class attribute', () => {
      const out = renderSlice('<p class="text-red-500">Hinweis</p>')
      expect(out).not.toContain('class=""')
      expect(out).not.toContain("class='")
      expect(html).not.toContain('class=""')
      expect(html).not.toContain("class='")
    })
  })
})

describe('toPlainText', () => {
  it('strips all markup', () => {
    const plain = toPlainText('<p>Ein <b>fetter</b> <sup>1)</sup> Hinweis.</p>')
    expect(plain).toBe('Ein fetter 1) Hinweis.')
    expect(plain).not.toContain('<')
  })

  it('turns br into a single space', () => {
    expect(toPlainText('243<br>534<br />664')).toBe('243 534 664')
    expect(toPlainText('a <br> b')).toBe('a b')
  })

  it('collapses whitespace and trims', () => {
    expect(toPlainText('  <p>eins\n\n  zwei\t\tdrei</p>\n ')).toBe('eins zwei drei')
  })

  it('keeps table cells apart instead of gluing the words together', () => {
    expect(toPlainText('<tr><td>1203</td><td>BENZIN</td></tr>')).toBe('1203 BENZIN')
  })

  it('preserves German characters', () => {
    const plain = toPlainText('<p>Größe der Gefäße: Äpfel, Öl, Übergang – ÄÖÜ äöü ß</p>')
    expect(plain).toBe('Größe der Gefäße: Äpfel, Öl, Übergang – ÄÖÜ äöü ß')
  })

  it('decodes the entities sanitisation introduced', () => {
    expect(toPlainText('<p>Gefahr &amp; Last &lt;3&gt; &quot;x&quot; &#39;y&#39;&nbsp;z</p>'))
      .toBe('Gefahr & Last <3> "x" \'y\' z')
  })

  it('drops script and style content rather than reading it as text', () => {
    expect(toPlainText('<style>body{color:red}</style><script>alert(1)</script><p>Text</p>'))
      .toBe('Text')
  })

  it('returns an empty string for empty input', () => {
    expect(toPlainText('')).toBe('')
    expect(toPlainText('   \n  ')).toBe('')
  })

  it('renders the fixture to readable German prose', () => {
    const plain = toPlainText(renderSlice(FIXTURE))
    expect(plain).toContain('Die Anlagen A und B des ADR sind in neun Teile gegliedert.')
    expect(plain).toContain('[Abbildung: Gefahrzettel 3: Flamme.]')
    expect(plain).not.toContain('alert')
    expect(plain).not.toMatch(/<[a-z]/i)
  })
})

describe('renderSlice source-line tags', () => {
  const md = [
    'Erster Absatz',
    'geht weiter.',
    '',
    '#### 1.1.1 Aufbau',
    '',
    '| A | B |',
    '| --- | --- |',
    '| a1 | b1 |',
    '| a2 | b2 |',
    '',
    '- Punkt',
  ].join('\n')
  const sourceLines = md.split('\n').map((_, i) => 100 + i)

  it('tags paragraphs, lists and every table row with the source line they start on', () => {
    const html = renderSlice(md, { sourceLines })
    expect(html).toMatch(/<p class="book-ln-100">Erster Absatz/)
    expect(html).toMatch(/<tr class="book-ln-105">\s*<th>A<\/th>/)
    expect(html).toMatch(/<tr class="book-ln-107">\s*<td>a1<\/td>/)
    expect(html).toMatch(/<tr class="book-ln-108">\s*<td>a2<\/td>/)
    expect(html).toMatch(/<ul class="book-ln-110">/)
  })

  it('leaves headings to their own anchors', () => {
    const html = renderSlice(md, { sourceLines })
    expect(html).toMatch(/<h4 id="h-1-1-1">/)
  })

  it('skips lines without a source line (a re-emitted table header)', () => {
    const lines: (number | null)[] = [...sourceLines]
    lines[5] = null
    lines[6] = null
    const html = renderSlice(md, { sourceLines: lines })
    expect(html).toMatch(/<tr>\s*<th>A<\/th>/)
    expect(html).toMatch(/<tr class="book-ln-107">/)
  })

  it('adds no tags when no source lines are given', () => {
    expect(renderSlice(md)).not.toContain('book-ln-')
  })
})
