import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'
import { DEMO_DATA } from '$lib/multimodal/types'
import UnPage from '../src/routes/(app)/un/[nummer]/+page.svelte'

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
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://gefahrgut.org/un/1203')
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
    expect(container).not.toHaveTextContent(LOCK_MESSAGE)
  })

  it('renders the lock notice instead of the tool for other numbers', () => {
    const { container } = renderPage({ unNumber: '1090', locked: true, compareData: null })
    expect(container.querySelector('[data-testid="tool-stub"]')).toBeNull()
    expect(container).toHaveTextContent(LOCK_MESSAGE)
    expect(container.querySelector('a[href="/un/1203"]')).not.toBeNull()
  })
})
