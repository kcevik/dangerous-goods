import { beforeEach, describe, expect, it } from 'vitest'
import { clearMarks, keepListedMarks, markMatches, setActiveMark, sourceLineOf } from '$lib/regulations/bookHighlighter'

let root: HTMLElement

function mount(html: string): HTMLElement {
  root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

function textNodeCount(el: Element): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let n = 0
  while (walker.nextNode()) n++
  return n
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('markMatches — basics', () => {
  it('wraps a single match and returns it', () => {
    const el = mount('<p>Benzin ist entzündbar.</p>')
    const marks = markMatches(el, 'Benzin')
    expect(marks).toHaveLength(1)
    expect(marks[0]!.tagName).toBe('MARK')
    expect(marks[0]!.className).toBe('book-hit')
    expect(marks[0]!.dataset.nth).toBe('0')
    expect(marks[0]!.textContent).toBe('Benzin')
  })

  it('numbers matches in document order across siblings and nesting', () => {
    const el = mount('<p>Benzin eins</p><div><span>Benzin zwei</span><em>Benzin drei</em></div>')
    const marks = markMatches(el, 'Benzin')
    expect(marks).toHaveLength(3)
    expect(marks.map(m => m.dataset.nth)).toEqual(['0', '1', '2'])
    expect(marks.map(m => m.parentElement?.tagName)).toEqual(['P', 'SPAN', 'EM'])
  })

  it('finds several matches inside one text node', () => {
    const el = mount('<p>Benzin, dann Benzin, dann Benzin.</p>')
    expect(markMatches(el, 'Benzin')).toHaveLength(3)
    expect(el.textContent).toBe('Benzin, dann Benzin, dann Benzin.')
  })

  it('preserves the surrounding text exactly', () => {
    const el = mount('<p>Vor Benzin nach</p>')
    markMatches(el, 'Benzin')
    expect(el.textContent).toBe('Vor Benzin nach')
  })
})

describe('markMatches — insensitivity', () => {
  it('ignores case', () => {
    const el = mount('<p>BENZIN und benzin und Benzin</p>')
    const marks = markMatches(el, 'benzin')
    expect(marks).toHaveLength(3)
    expect(marks.map(m => m.textContent)).toEqual(['BENZIN', 'benzin', 'Benzin'])
  })

  it('ignores diacritics', () => {
    const el = mount('<p>Ätzend und ätzende Stoffe</p>')
    expect(markMatches(el, 'atzend')).toHaveLength(2)
  })

  it('treats ß and ss as the same, despite the length change', () => {
    const el = mount('<p>Straße und Strasse</p>')
    const marks = markMatches(el, 'strasse')
    expect(marks).toHaveLength(2)
    // the sharp-s spelling must still be wrapped byte-exactly
    expect(marks[0]!.textContent).toBe('Straße')
    expect(marks[1]!.textContent).toBe('Strasse')
    expect(el.textContent).toBe('Straße und Strasse')
  })

  it('finds a sharp-s term in an ss spelling too', () => {
    const el = mount('<p>Gefahrgutstrasse</p>')
    const marks = markMatches(el, 'straße')
    expect(marks).toHaveLength(1)
    expect(marks[0]!.textContent).toBe('strasse')
  })

  it('handles the capital sharp s', () => {
    const el = mount('<p>STRAẞE</p>')
    expect(markMatches(el, 'strasse')).toHaveLength(1)
  })
})

describe('markMatches — what must be skipped', () => {
  it('never marks inside an existing mark', () => {
    const el = mount('<p><mark class="book-hit">Benzin</mark> und Benzin</p>')
    const marks = markMatches(el, 'Benzin')
    expect(marks).toHaveLength(1)
    expect(el.querySelectorAll('mark mark')).toHaveLength(0)
  })

  it('skips script and style content', () => {
    const el = mount('<p>Benzin</p><script>var Benzin = 1</script><style>.Benzin{}</style>')
    expect(markMatches(el, 'Benzin')).toHaveLength(1)
  })

  it('skips the missing-figure placeholder', () => {
    const el = mount('<p>Benzin</p><span class="book-figure-missing">[Abbildung: Benzin]</span>')
    expect(markMatches(el, 'Benzin')).toHaveLength(1)
  })

  it('does not match text that only appears in an attribute', () => {
    const el = mount('<span role="img" aria-label="Gefahrzettel">Flamme</span>')
    expect(markMatches(el, 'Gefahrzettel')).toHaveLength(0)
    expect(el.innerHTML).toContain('aria-label="Gefahrzettel"')
  })
})

describe('markMatches — DOM integrity', () => {
  it('does not match across an inline tag boundary, and leaves the tag intact', () => {
    const el = mount('<p>Sonder<b>vorschrift</b> 243</p>')
    expect(markMatches(el, 'Sondervorschrift')).toHaveLength(0)
    expect(el.innerHTML).toBe('<p>Sonder<b>vorschrift</b> 243</p>')
  })

  it('leaves table markup untouched', () => {
    const el = mount('<table><thead><tr><th>UN</th></tr></thead><tbody><tr><td>1203 BENZIN</td></tr></tbody></table>')
    markMatches(el, 'benzin')
    expect(el.querySelectorAll('table thead th')).toHaveLength(1)
    expect(el.querySelector('td mark')).not.toBeNull()
  })

  it('matches regex metacharacters literally', () => {
    const el = mount('<p>Kapitel 3.2 und 3x2 und a+b und 50 % Masse</p>')
    expect(markMatches(el, '3.2')).toHaveLength(1)
    clearMarks(el)
    expect(markMatches(el, 'a+b')).toHaveLength(1)
    clearMarks(el)
    expect(markMatches(el, '50 %')).toHaveLength(1)
  })

  it('accepts a two-character term', () => {
    const el = mount('<p>BK 2 und BK 3</p>')
    expect(markMatches(el, 'BK')).toHaveLength(2)
  })

  it('marks nothing and throws nothing for an empty or blank term', () => {
    const el = mount('<p>Benzin</p>')
    expect(markMatches(el, '')).toHaveLength(0)
    expect(markMatches(el, '   ')).toHaveLength(0)
    expect(el.innerHTML).toBe('<p>Benzin</p>')
  })
})

describe('clearMarks', () => {
  it('restores the original HTML byte for byte', () => {
    const html = '<p>Benzin und <b>Benzin</b> und Ottokraftstoff</p>'
    const el = mount(html)
    markMatches(el, 'Benzin')
    expect(el.innerHTML).not.toBe(html)
    clearMarks(el)
    expect(el.innerHTML).toBe(html)
  })

  it('leaves marks that it did not create alone', () => {
    const html = '<p><mark class="editor-note">Hinweis</mark> Benzin</p>'
    const el = mount(html)
    markMatches(el, 'Benzin')
    clearMarks(el)
    expect(el.innerHTML).toBe(html)
  })

  it('does not fragment text nodes over repeated cycles', () => {
    const el = mount('<p>Benzin und Benzin und Benzin</p>')
    const before = textNodeCount(el)
    for (let i = 0; i < 20; i++) {
      markMatches(el, 'Benzin')
      clearMarks(el)
    }
    expect(textNodeCount(el)).toBe(before)
    expect(el.innerHTML).toBe('<p>Benzin und Benzin und Benzin</p>')
  })

  it('is safe on a root with no marks', () => {
    const el = mount('<p>Benzin</p>')
    expect(() => clearMarks(el)).not.toThrow()
    expect(el.innerHTML).toBe('<p>Benzin</p>')
  })
})

describe('setActiveMark', () => {
  it('marks exactly one hit active and clears the others', () => {
    const el = mount('<p>Benzin Benzin Benzin</p>')
    const marks = markMatches(el, 'Benzin')

    setActiveMark(marks, 1)
    expect(marks[1]!.classList.contains('book-hit-active')).toBe(true)
    expect(marks[1]!.getAttribute('aria-current')).toBe('location')
    expect(marks[0]!.classList.contains('book-hit-active')).toBe(false)
    expect(marks[0]!.hasAttribute('aria-current')).toBe(false)

    setActiveMark(marks, 2)
    expect(marks[1]!.classList.contains('book-hit-active')).toBe(false)
    expect(marks[2]!.classList.contains('book-hit-active')).toBe(true)
  })

  it('ignores an out-of-range index without throwing', () => {
    const el = mount('<p>Benzin</p>')
    const marks = markMatches(el, 'Benzin')
    expect(() => setActiveMark(marks, 99)).not.toThrow()
    expect(marks[0]!.classList.contains('book-hit-active')).toBe(false)
  })
})

describe('markMatches — line attribution', () => {
  it('copies the source line from the enclosing window wrapper when present', () => {
    const el = mount('<div data-line-start="10015"><p>BENZIN oder OTTOKRAFTSTOFF</p></div>')
    const marks = markMatches(el, 'benzin')
    expect(marks[0]!.dataset.line).toBe('10015')
  })

  it('omits the line attribute when there is no wrapper', () => {
    const el = mount('<p>Benzin</p>')
    const marks = markMatches(el, 'Benzin')
    expect(marks[0]!.dataset.line).toBeUndefined()
  })
})

describe('markMatches — whole tokens', () => {
  it('skips matches inside a longer number or word when asked', () => {
    mount('<p>SV 163 und UN 1163, auch 163a und (163).</p>')
    const marks = markMatches(root, '163', { wholeToken: true })
    expect(marks).toHaveLength(2)
    expect(root.textContent).toBe('SV 163 und UN 1163, auch 163a und (163).')
  })

  it('still matches inside words by default', () => {
    mount('<p>UN 1163</p>')
    expect(markMatches(root, '163')).toHaveLength(1)
  })
})

describe('sourceLineOf / keepListedMarks', () => {
  // a list block starting at line 10 whose second line (11) carries a line marker,
  // two table rows, and a heading (no line)
  const html = `
    <ul class="book-ln-10"><li>SV 163 steht hier. Und nochmal 163.</li><li><span class="book-ln-11"></span>Zeile 11 mit 163.</li></ul>
    <table><tbody>
      <tr class="book-ln-20"><td>1203</td><td>163</td></tr>
      <tr class="book-ln-21"><td>Absatz 1.1.3 nennt 163 nebenbei</td><td>163</td></tr>
    </tbody></table>
    <h4 id="h-x">Kopf 163</h4>`

  const hit = (line: number, ordinal?: number) => ({ line, ...(ordinal === undefined ? {} : { ordinal }) })

  it('reads the exact book line: the block tag, refined by the last line marker before the match', () => {
    mount(html)
    const marks = markMatches(root, '163', { wholeToken: true })
    expect(marks.map(sourceLineOf)).toEqual([10, 10, 11, 20, 21, 21, null])
  })

  it('reads marker lines inside a block that starts on a line the book does not have', () => {
    // a paragraph opened by a re-emitted table header carries `book-blk`, not a line
    mount('<p class="book-blk">|---|---|\n<span class="book-ln-7262"></span>| Am-243 | Np-239 |</p>')
    const marks = markMatches(root, '243', { wholeToken: true })
    expect(marks.map(sourceLineOf)).toEqual([7262])
  })

  it('maps each hit to the n-th match on its line, in list order', () => {
    mount(html)
    const marks = markMatches(root, '163', { wholeToken: true })
    const { marks: kept, markOfHit } = keepListedMarks(marks, [hit(21, 1), hit(10, 0), hit(10, 1), hit(11), hit(20)])
    expect(kept).toHaveLength(5)
    expect(markOfHit.map(i => sourceLineOf(kept[i]!))).toEqual([21, 10, 10, 11, 20])
    expect(new Set(markOfHit).size).toBe(5)
  })

  it('an incidental match earlier in the same row does not shift the listed one', () => {
    mount(html)
    const marks = markMatches(root, '163', { wholeToken: true })
    // line 21 lists only the column-6 code, the second match on that row
    const { marks: kept, markOfHit } = keepListedMarks(marks, [hit(21, 1)])
    expect(kept).toHaveLength(1)
    expect(kept[markOfHit[0]!]!.closest('td')!.textContent).toBe('163')
  })

  it('removes every match no hit names — headings and unlisted rows are not highlighted', () => {
    mount(html)
    const marks = markMatches(root, '163', { wholeToken: true })
    const { marks: kept } = keepListedMarks(marks, [hit(20)])
    expect(root.querySelectorAll('mark.book-hit')).toHaveLength(1)
    expect(kept).toHaveLength(1)
    expect(root.querySelector('h4')!.innerHTML).toBe('Kopf 163')
    expect(root.querySelector('mark')!.closest('tr')!.className).toBe('book-ln-20')
  })

  it('gives -1 for a hit whose match is not loaded', () => {
    mount(html)
    const marks = markMatches(root, '163', { wholeToken: true })
    expect(keepListedMarks(marks, [hit(5), hit(10, 7)]).markOfHit).toEqual([-1, -1])
    expect(keepListedMarks([], [hit(10)]).markOfHit).toEqual([-1])
  })
})
