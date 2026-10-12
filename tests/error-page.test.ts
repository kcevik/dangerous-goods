import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { pageState } = vi.hoisted(() => ({ pageState: { status: 500, error: { message: 'Internal Error' } as { message: string } | null } }))
vi.mock('$app/state', () => ({ page: pageState }))

const { default: ErrorPage } = await import('../src/routes/+error.svelte')

afterEach(() => {
  document.head.innerHTML = ''
})

describe('root error page', () => {
  it('explains a 404 in German and links home', () => {
    pageState.status = 404
    pageState.error = { message: 'Not Found' }
    const { container } = render(ErrorPage)
    expect(container).toHaveTextContent('404')
    expect(container).toHaveTextContent('Diese Seite gibt es nicht.')
    expect(container.querySelector('a[href="/"]')).not.toBeNull()
    expect(document.title).toContain('Seite nicht gefunden')
  })

  it('shows the German message of a 4xx raised by our own code', () => {
    pageState.status = 400
    pageState.error = { message: 'Ungültige Sondervorschrift' }
    const { container } = render(ErrorPage)
    expect(container).toHaveTextContent('Ungültige Sondervorschrift')
  })

  it('never shows internal details of a 5xx, only a German apology', () => {
    pageState.status = 500
    pageState.error = { message: 'connect ECONNREFUSED 10.0.0.5:5432' }
    const { container } = render(ErrorPage)
    expect(container).toHaveTextContent('Da ist etwas schiefgelaufen.')
    expect(container).not.toHaveTextContent('ECONNREFUSED')
  })

  it('keeps error pages out of search engines', () => {
    pageState.status = 404
    render(ErrorPage)
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
  })
})
