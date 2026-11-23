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

  // logo + three links + Anmelden + the long CTA need ~770px; at 768px they overflowed
  // (browser check 2026-11-23), so the landing header switches to inline only from lg
  it('uses the burger below lg and the inline nav from lg', () => {
    const { container } = render(Navbar)
    const burger = container.querySelector('button[aria-controls="landing-menu"]')!
    expect(burger.parentElement).toHaveClass('lg:hidden')
    expect(burger.parentElement).not.toHaveClass('md:hidden')
    const inline = container.querySelector('nav[aria-label="Hauptnavigation"]')!
    expect(inline).toHaveClass('hidden', 'lg:flex')
    const login = [...container.querySelectorAll('a[href="/login"]')].find((a) => !a.closest('#landing-menu'))!
    expect(login).toHaveClass('hidden', 'lg:block')
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
