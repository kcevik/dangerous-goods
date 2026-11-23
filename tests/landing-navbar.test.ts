import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Navbar from '$lib/landing/Navbar.svelte'

describe('landing Navbar burger menu', () => {
  it('holds every nav link, Anmelden and the sign-up CTA', () => {
    const { container } = render(Navbar, { props: { registrationOpen: false } })
    const panel = container.querySelector('#landing-menu')!
    for (const href of ['#features', '#comparison', '/login', '/registrieren']) {
      expect(panel.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
    expect(panel).toHaveTextContent('Zum Launch benachrichtigen')
  })

  it('opens from the burger and closes when an in-page anchor is clicked', async () => {
    const { container } = render(Navbar)
    const burger = container.querySelector('button[aria-controls="landing-menu"]')!
    expect(burger).toHaveAttribute('aria-label', 'Menü öffnen')
    await fireEvent.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'true')
    await fireEvent.click(container.querySelector('#landing-menu a[href="#features"]')!)
    expect(burger).toHaveAttribute('aria-expanded', 'false')
  })
})
