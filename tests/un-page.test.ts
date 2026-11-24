import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEMO_DATA } from '$lib/multimodal/types'
import UnPage from '../src/routes/(app)/un/[nummer]/+page.svelte'

vi.mock('$app/navigation', () => ({ goto: vi.fn() }))

vi.mock('$lib/multimodal/MultimodalTool.svelte', async () => ({
  default: (await import('./stubs/ToolStub.svelte')).default,
}))

afterEach(() => {
  document.head.innerHTML = ''
})

const EMPTY = { ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] }

function renderPage(data: { unNumber: string, locked: boolean, compareData: Record<string, unknown[]> | null }) {
  return render(UnPage, { props: { data: { supabase: {}, cookies: [], isActive: !data.locked, ...data } as never } })
}

describe('/un/[nummer] page (active)', () => {
  it('passes the route param and data to MultimodalTool', () => {
    const { container } = renderPage({ unNumber: '1090', locked: false, compareData: EMPTY })
    const stub = container.querySelector('[data-testid="tool-stub"]')!
    expect(stub).toHaveTextContent('TOOL:1090')
    expect(stub).toHaveAttribute('data-demo', 'false')
    expect(stub).toHaveAttribute('data-has-initial', 'true')
  })

  it('renders a back link to the dashboard', () => {
    const { container } = renderPage({ unNumber: '1090', locked: false, compareData: EMPTY })
    const link = container.querySelector('a')!
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveTextContent('zurück')
  })

  it('sets title, description and canonical from the loaded entry', () => {
    renderPage({ unNumber: '1203', locked: false, compareData: DEMO_DATA })
    expect(document.title).toBe('UN 1203 – BENZIN | gefahrgut.org')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Klasse 3, Verpackungsgruppe II')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://app.gefahrgut.org/un/1203')
  })

  it('falls back to a plain title when no mode has data', () => {
    renderPage({ unNumber: '9999', locked: false, compareData: EMPTY })
    expect(document.title).toBe('UN 9999 | gefahrgut.org')
  })
})

describe('/un/[nummer] page (locked)', () => {
  it('renders the demo tool for UN 1203', () => {
    const { container } = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA })
    const stub = container.querySelector('[data-testid="tool-stub"]')!
    expect(stub).toHaveAttribute('data-demo', 'true')
    // the (app) layout's banner is the only lock notice
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('explains that other numbers need activation and links the demo instead of the tool', () => {
    const { container } = renderPage({ unNumber: '1090', locked: true, compareData: null })
    expect(container.querySelector('[data-testid="tool-stub"]')).toBeNull()
    expect(container).toHaveTextContent('UN 1090 ist erst nach der Freischaltung verfügbar.')
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.querySelector('a[href="/un/1203"]')).not.toBeNull()
  })
})

describe('/un/[nummer] page — comparison link', () => {
  it('links an active account to the comparison of this UN number', () => {
    const { container } = renderPage({ unNumber: '1090', locked: false, compareData: EMPTY })
    expect(container.querySelector('a[href="/un/1090/vergleich"]')).toHaveTextContent('Alle Modi vergleichen')
  })

  it('puts the back and comparison links in one wrapping row with 44px targets', () => {
    const { container } = renderPage({ unNumber: '1090', locked: false, compareData: EMPTY })
    const row = container.querySelector('[data-testid="un-page-links"]')!
    expect(row).toHaveClass('flex', 'flex-wrap')
    const links = row.querySelectorAll('a')
    expect(links).toHaveLength(2)
    for (const link of links) expect(link).toHaveClass('min-h-11')
  })

  it('links the locked demo, but nothing for other locked UN numbers', () => {
    const demo = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA })
    expect(demo.container.querySelector('a[href="/un/1203/vergleich"]')).not.toBeNull()
    demo.unmount()
    const other = renderPage({ unNumber: '1090', locked: true, compareData: null })
    expect(other.container.querySelector('a[href$="/vergleich"]')).toBeNull()
  })
})

describe('/un/[nummer] page — search', () => {
  it('offers a search to open another UN number for an active account', () => {
    const { container } = renderPage({ unNumber: '1090', locked: false, compareData: EMPTY })
    expect(container.querySelector('input[type="search"]')).toHaveAttribute('aria-label', 'Andere UN-Nummer öffnen')
  })

  it('has no search for a locked account', () => {
    const { container } = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA })
    expect(container.querySelector('input[type="search"]')).toBeNull()
  })
})
