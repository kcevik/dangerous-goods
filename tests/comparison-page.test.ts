import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'
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

  it('shows the demo with the lock notice for a locked account on UN 1203', () => {
    const { container } = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA, reference: null })
    expect(container).toHaveTextContent(LOCK_MESSAGE)
    expect(container).toHaveTextContent('DEMO')
    expect(container.querySelector('table')).not.toBeNull()
  })

  it('shows only the lock notice and a demo link for a locked account elsewhere', () => {
    const { container } = renderPage({ unNumber: '1090', locked: true, compareData: null, reference: null })
    expect(container).toHaveTextContent(LOCK_MESSAGE)
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('a[href="/un/1203/vergleich"]')).not.toBeNull()
  })
})
