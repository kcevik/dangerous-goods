import { render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'
import { load } from '../src/routes/(app)/+layout.server'
import AppLayout from '../src/routes/(app)/+layout.svelte'

function renderShell(isActive: boolean) {
  const children = createRawSnippet(() => ({ render: () => '<p>page content</p>' }))
  return render(AppLayout, {
    props: { data: { user: { id: 'u1', email: 'k@example.de' }, isActive } as never, children },
  })
}

describe('(app) layout load', () => {
  it('passes user and isActive through from the root layout', async () => {
    const result = await load({ parent: async () => ({ user: { id: 'u1', email: 'k@example.de' }, isActive: true }) } as never)
    expect(result).toEqual({ user: { id: 'u1', email: 'k@example.de' }, isActive: true })
  })
})

describe('(app) layout shell', () => {
  it('renders navigation, the user email, a POST logout form and the page', () => {
    const { container } = renderShell(true)
    expect(container.querySelector('a[href="/dashboard"]')).not.toBeNull()
    expect(container.querySelector('a[href="/suche"]')).not.toBeNull()
    expect(container).toHaveTextContent('k@example.de')
    const logout = container.querySelector('form[action="/logout"]')!
    expect(logout).toHaveAttribute('method', 'POST')
    expect(logout.querySelector('button')).toHaveTextContent('Abmelden')
    expect(container).toHaveTextContent('page content')
  })

  it('shows the lock banner only for inactive accounts', () => {
    const locked = renderShell(false)
    expect(locked.container).toHaveTextContent(LOCK_MESSAGE)
    locked.unmount()
    const active = renderShell(true)
    expect(active.container).not.toHaveTextContent(LOCK_MESSAGE)
  })
})
