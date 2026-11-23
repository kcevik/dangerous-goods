import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import DashboardPage from '../src/routes/(app)/dashboard/+page.svelte'

function renderDashboard(isActive: boolean) {
  return render(DashboardPage, { props: { data: { user: { id: 'u1', email: 'k@example.de' }, isActive } as never } })
}

describe('dashboard page', () => {
  it('links to search and lists upcoming tools', () => {
    const { container } = renderDashboard(true)
    expect(container.querySelector('a[href="/suche"]')).not.toBeNull()
    expect(container).toHaveTextContent('1000-Punkte-Rechner')
    expect(container).toHaveTextContent('Dokumentengenerator')
    expect(container).toHaveTextContent('in Vorbereitung')
    expect(container).not.toHaveTextContent('Transportmodus-Assistent') // dropped by the owner 2026-11-08
  })

  // F-10 is not built: the tile must not link to the plain search view it used to duplicate.
  it('links the regulatory comparison tile to the UN 1203 comparison', () => {
    const { container } = renderDashboard(true)
    const tile = container.querySelector('a[href="/un/1203/vergleich"]')
    expect(tile).toHaveTextContent('Regelwerksvergleich')
    expect(container.querySelector('[aria-disabled="true"]')).toBeNull()
    expect(container).not.toHaveTextContent('Demnächst verfügbar')
  })

  it('links to the 1000-Punkte-Rechner and no longer lists it as upcoming', () => {
    const { container } = renderDashboard(true)
    expect(container.querySelector('a[href="/tools/1000-punkte"]')).toHaveTextContent('1000-Punkte-Rechner')
    const upcoming = [...container.querySelectorAll('.border-dashed')].map(e => e.textContent ?? '')
    expect(upcoming.length).toBeGreaterThan(0)
    expect(upcoming.some(t => t.includes('1000'))).toBe(false)
  })

  it('links to the account page', () => {
    const { container } = renderDashboard(false)
    expect(container.querySelector('a[href="/konto"]')).toHaveTextContent('Konto')
  })

  it('shows the activation status', () => {
    const active = renderDashboard(true)
    expect(active.container).toHaveTextContent('Freigeschaltet')
    expect(active.container.querySelector('[role="status"]')).toBeNull()
    active.unmount()
    const locked = renderDashboard(false)
    expect(locked.container).toHaveTextContent('Noch nicht freigeschaltet')
    // the (app) layout's banner is the one lock notice
    expect(locked.container.querySelector('[role="status"]')).toBeNull()
  })

  it('lets a long e-mail address wrap on phones', () => {
    const { container } = renderDashboard(true)
    expect(container.querySelector('h1 + p')).toHaveClass('wrap-anywhere')
  })
})
