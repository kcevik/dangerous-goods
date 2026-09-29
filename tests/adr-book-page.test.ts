import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { tick } from 'svelte'
import type { BookHit, RenderedWindow, TocEntry } from '$lib/regulations/bookTypes'
import BookPage from '../src/routes/(app)/regelwerk/[mode=bookMode]/+page.svelte'

vi.mock('$app/navigation', () => ({ replaceState: vi.fn() }))

afterEach(() => {
  document.head.innerHTML = ''
})

function hit(line: number, heading: TocEntry | null = null): BookHit {
  return {
    kind: 'sv',
    code: '243',
    line,
    rank: 1,
    role: 'definition',
    context: `Kontext ${line}`,
    heading: heading ? { ...heading, path: ['Teil 3'] } : null,
  }
}

const TOC: TocEntry[] = [
  { level: 1, text: 'Teil 3', sectionNo: null, slug: 'h-teil-3', line: 1 },
  { level: 2, text: 'Kapitel 3.3', sectionNo: '3.3', slug: 'h-3-3', line: 2 },
  { level: 3, text: '3.3.1 Sondervorschriften', sectionNo: '3.3.1', slug: 'h-3-3-1', line: 3 },
  { level: 4, text: '3.3.1.1 zu tief', sectionNo: '3.3.1.1', slug: 'h-3-3-1-1', line: 4 },
]

const WINDOW: RenderedWindow = {
  html: [
    '<h3 id="h-3-3-1">3.3.1 Sondervorschriften</h3>',
    ...[10, 11, 12, 13, 14, 15, 16].map(n => `<p class="book-ln-${n}">Absatz ${n} nennt 243 ausdrücklich.</p>`),
    '<div class="book-table-scroll" role="region" tabindex="0" aria-label="Tabelle, horizontal scrollbar">',
    '<table><tbody><tr class="book-ln-20"><td>1203</td><td>243</td></tr></tbody></table></div>',
  ].join(''),
  lineStart: 1,
  lineEnd: 40,
  headings: [TOC[2]!],
}

function activeData(overrides: Record<string, unknown> = {}) {
  return {
    locked: false,
    mode: 'adr',
    target: { kind: 'sv', code: '243' },
    term: '243',
    hits: [10, 11, 12, 13, 14, 15, 16].map(n => hit(n, TOC[1]!)),
    totalHits: 7,
    capped: false,
    currentIndex: 0,
    includeIncidental: false,
    windows: [WINDOW],
    toc: TOC,
    totalLines: 5000,
    focusLine: 10,
    notFound: null,
    fallbackFrom: null,
    isActive: true,
    user: { id: 'u1', email: 'k@example.de' },
    ...overrides,
  }
}

function renderPage(data: Record<string, unknown>) {
  return render(BookPage, { props: { data: data as never } })
}

describe('/regelwerk/adr page — locked', () => {
  it('shows the lock notice and no book text or find bar', () => {
    const { container } = renderPage({ locked: true, mode: 'adr', isActive: false })
    expect(container.querySelector('[role="status"]')).not.toBeNull()
    expect(container).toHaveTextContent('Der ADR-Volltext ist nach der Freischaltung verfügbar.')
    expect(container.querySelector('[role="search"]')).toBeNull()
    expect(container.querySelector('#book-content')).toBeNull()
  })
})

describe('/regelwerk/adr page — active', () => {
  it('renders the find bar with chip, labelled input, buttons and a live counter', () => {
    const { container } = renderPage(activeData())
    expect(container.querySelector('form[role="search"]')).not.toBeNull()
    expect(container).toHaveTextContent('Sondervorschrift 243')
    expect(screen.getByLabelText('Suchbegriff')).toHaveValue('243')
    expect(screen.getByRole('button', { name: 'Vorheriger Treffer' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Nächster Treffer' })).toBeEnabled()
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent('Treffer 1 von 7')
  })

  it('marks the matches and flags the active one', () => {
    const { container } = renderPage(activeData())
    const marks = container.querySelectorAll('#book-content mark.book-hit')
    expect(marks.length).toBe(8)
    const active = container.querySelectorAll('mark[aria-current="location"]')
    expect(active).toHaveLength(1)
    expect(active[0]!.closest('p')).toHaveTextContent('Absatz 10')
  })

  it('moves to the next hit within the loaded window without fetching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { container } = renderPage(activeData())
    await fireEvent.click(screen.getByRole('button', { name: 'Nächster Treffer' }))
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Treffer 2 von 7')
    expect(container.querySelector('mark[aria-current="location"]')!.closest('p')).toHaveTextContent('Absatz 11')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('has no keyboard shortcuts and no shortcut hints (owner: overkill)', async () => {
    const { container } = renderPage(activeData())
    expect(container).not.toHaveTextContent('Tastaturkürzel')
    expect(container).not.toHaveTextContent('Alt+I')
    expect(container).not.toHaveTextContent('Strg+F')

    const input = screen.getByLabelText('Suchbegriff')
    const toc = container.querySelector('aside details') as HTMLDetailsElement
    const tocWasOpen = toc.open
    await fireEvent.keyDown(window, { key: 'F3' })
    await fireEvent.keyDown(window, { key: 'g', ctrlKey: true })
    await fireEvent.keyDown(window, { key: 'i', altKey: true })
    await fireEvent.keyDown(input, { key: 'Escape' })
    await fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    await tick()
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Treffer 1 von 7')
    expect(toc.open).toBe(tocWasOpen)
    expect(input).toHaveValue('243')
  })

  it('shows the capped note when the list was cut', () => {
    const hits = Array.from({ length: 500 }, (_, i) => hit(10 + (i % 7)))
    const { container } = renderPage(activeData({ hits, totalHits: 778, capped: true }))
    expect(container).toHaveTextContent('Treffer 1 von 500+ (778 Treffer)')
    expect(container).toHaveTextContent('Mehr als 500 Treffer')
  })

  it('explains a code that does not occur and disables navigation', () => {
    const { container } = renderPage(activeData({
      target: { kind: 'sv', code: '999' },
      term: '999',
      hits: [],
      totalHits: 0,
      notFound: '999',
    }))
    expect(container).toHaveTextContent('Zu 999 wurde keine Stelle im ADR-Text gefunden.')
    expect(screen.getByRole('button', { name: 'Vorheriger Treffer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nächster Treffer' })).toBeDisabled()
  })

  it('says which paragraph opened for a lettered provision', () => {
    const { container } = renderPage(activeData({ target: { kind: 'sv', code: '640' }, term: '640', fallbackFrom: '640D' }))
    expect(container).toHaveTextContent('640D hat keinen eigenen Absatz – angezeigt wird Sondervorschrift 640.')
    expect(container).toHaveTextContent('Sondervorschrift 640')
  })

  it('renders the table of contents to level 3 only', () => {
    renderPage(activeData())
    const nav = screen.getByRole('navigation', { name: 'Inhaltsverzeichnis' })
    expect(nav).toHaveTextContent('3.3.1 Sondervorschriften')
    expect(nav).not.toHaveTextContent('zu tief')
  })

  it('has a skip link to a focusable main region in German', () => {
    const { container } = renderPage(activeData())
    expect(container.querySelector('a[href="#book-content"]')).toHaveTextContent('Zum Inhalt springen')
    const main = container.querySelector('main#book-content')!
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(main.getAttribute('lang')).toBe('de')
  })

  it('keeps the wide-table scroll region intact', () => {
    const { container } = renderPage(activeData())
    const region = container.querySelector('.book-table-scroll')!
    expect(region.getAttribute('role')).toBe('region')
    expect(region.getAttribute('tabindex')).toBe('0')
  })

  it('shows the attribution and disclaimer', () => {
    const { container } = renderPage(activeData())
    expect(container).toHaveTextContent('Kein rechtsverbindlicher Text. Maßgeblich ist die amtliche Fassung.')
    expect(container).toHaveTextContent('BAM GEFAHRGUT')
  })

  it('sets a title naming ADR 2025', () => {
    renderPage(activeData())
    expect(document.title).toContain('ADR 2025')
  })

  it('has no counter and no chip when opened without a target', () => {
    const { container } = renderPage(activeData({ target: null, term: '', hits: [], totalHits: 0, focusLine: null }))
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('')
    expect(container).not.toHaveTextContent('Sondervorschrift 243')
  })
})

describe('/regelwerk/adr page — focus and scrolling', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps focus in the search field while the reader steps through hits with Enter', async () => {
    renderPage(activeData())
    const input = screen.getByLabelText('Suchbegriff')
    input.focus()
    await fireEvent.keyDown(input, { key: 'Enter' })
    await tick()
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Treffer 2 von 7')
    expect(document.activeElement).toBe(input)
  })

  it('scrolls to the first hit of a search once its window has loaded', async () => {
    vi.useFakeTimers()
    const scrolled: Element[] = []
    Element.prototype.scrollIntoView = function (this: Element) { scrolled.push(this) }
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      const body = url.includes('/search')
        ? { hits: [{ ...hit(3000), kind: 'un', code: 'Tankfahrzeug' }], total: 1, capped: false }
        : { html: '<p class="book-ln-3000">Das Tankfahrzeug hier.</p>', lineStart: 2990, lineEnd: 3010, headings: [] }
      return new Response(JSON.stringify(body), { status: 200 })
    })

    renderPage(activeData({ target: null, term: '', hits: [], totalHits: 0, focusLine: null }))
    await fireEvent.input(screen.getByLabelText('Suchbegriff'), { target: { value: 'Tankfahrzeug' } })
    await vi.advanceTimersByTimeAsync(300)
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(0)
      await tick()
    }

    expect(scrolled.some(el => el.tagName === 'MARK' && el.textContent === 'Tankfahrzeug')).toBe(true)
  })
})
