import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import DashboardPage from '../src/routes/(app)/dashboard/+page.svelte'

function renderDashboard(isActive: boolean) {
  return render(DashboardPage, { props: { data: { user: { id: 'u1', email: 'k@example.de' }, isActive } as never } })
}

describe('dashboard page', () => {
  it('links to search and the comparison demo and lists upcoming tools', () => {
    const { container } = renderDashboard(true)
    expect(container.querySelector('a[href="/suche"]')).not.toBeNull()
    expect(container.querySelector('a[href="/un/1203"]')).not.toBeNull()
    expect(container).toHaveTextContent('1000-Punkte-Rechner')
    expect(container).toHaveTextContent('Dokumentengenerator')
    expect(container).toHaveTextContent('in Vorbereitung')
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
