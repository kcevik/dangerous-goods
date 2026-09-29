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
  })

  // F-10 is not built: the tile must not link to the plain search view it used to duplicate.
  it('shows the regulatory comparison as a disabled coming-soon tile', () => {
    const { container } = renderDashboard(true)
    const tile = container.querySelector('[aria-disabled="true"]')
    expect(tile).toHaveTextContent('Regelwerksvergleich')
    expect(tile).toHaveTextContent('Demnächst verfügbar')
    expect(tile?.closest('a')).toBeNull()
    expect(container.querySelector('a[href^="/un/"]')).toBeNull()
  })

  it('shows the activation status', () => {
    const active = renderDashboard(true)
    expect(active.container).toHaveTextContent('Freigeschaltet')
    expect(active.container.querySelector('[role="status"]')).toBeNull()
    active.unmount()
    const locked = renderDashboard(false)
    expect(locked.container).toHaveTextContent('Noch nicht freigeschaltet')
    expect(locked.container.querySelector('[role="status"]')).not.toBeNull()
  })
})
