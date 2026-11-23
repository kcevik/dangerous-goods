import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('$app/navigation', () => ({ goto: vi.fn() }))
import { DEMO_DATA } from '$lib/multimodal/types'
import ComparisonPage from '../src/routes/(app)/un/[nummer]/vergleich/+page.svelte'

afterEach(() => {
  document.head.innerHTML = ''
})

function renderPage(data: { unNumber: string, locked: boolean, compareData: Record<string, unknown[]> | null, reference: unknown[] | null }) {
  return render(ComparisonPage, { props: { data: { supabase: {}, cookies: [], isActive: !data.locked, ...data } as never } })
}

describe('/un/[nummer]/vergleich page', () => {
  it('renders the comparison with a back link and a canonical URL', () => {
    const { container } = renderPage({ unNumber: '1203', locked: false, compareData: DEMO_DATA, reference: [] })
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('a[href="/un/1203"]')).toHaveTextContent('UN 1203')
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://gefahrgut.org/un/1203/vergleich')
    expect(document.title).toBe('Regelwerksvergleich UN 1203 | gefahrgut.org')
  })

  it('shows the marked demo for a locked account on UN 1203, without a second lock notice', () => {
    const { container } = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA, reference: null })
    // the (app) layout's banner is the one lock notice
    expect(container).not.toHaveTextContent(/nicht freigeschaltet|Freischaltung/)
    expect(container).toHaveTextContent('DEMO')
    expect(container.querySelector('table')).not.toBeNull()
  })

  it('explains the activation and links the demo for a locked account elsewhere', () => {
    const { container } = renderPage({ unNumber: '1090', locked: true, compareData: null, reference: null })
    expect(container).toHaveTextContent('Der Vergleich für UN 1090 ist erst nach der Freischaltung verfügbar.')
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('a[href="/un/1203/vergleich"]')).not.toBeNull()
  })
})

describe('/un/[nummer]/vergleich page — search', () => {
  it('offers a search to switch the UN number for an active account', () => {
    renderPage({ unNumber: '1203', locked: false, compareData: DEMO_DATA, reference: [] })
    expect(document.body.querySelector('input[type="search"]')).toHaveAttribute('aria-label', 'Andere UN-Nummer vergleichen')
  })

  it('has no search for a locked account', () => {
    const { container } = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA, reference: null })
    expect(container.querySelector('input[type="search"]')).toBeNull()
  })
})
