import { fireEvent, render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { planPrice } from '$lib/legalPages/facts'
import { UPSELL_STORAGE_KEY } from '$lib/upsell/upsellThrottle.svelte'
import { polyfillDialog } from './helpers/dialog'
import { APP_NAV_ITEMS } from '$lib/nav/appNav'
import { load } from '../src/routes/(app)/+layout.server'
import AppLayout from '../src/routes/(app)/+layout.svelte'

const pageState = vi.hoisted(() => ({ url: new URL('http://localhost/dashboard') }))
vi.mock('$app/state', () => ({ page: pageState }))

beforeAll(polyfillDialog)
beforeEach(() => {
  pageState.url = new URL('http://localhost/dashboard')
  localStorage.clear()
})

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
    expect(container.querySelector('a[href="/regelwerk/adr"]')).toHaveTextContent('ADR-Text')
    expect(container.querySelector('a[href="/konto"]')).toHaveTextContent('Konto')
    expect(container).toHaveTextContent('k@example.de')
    const logout = container.querySelector('form[action="/logout"]')!
    expect(logout).toHaveAttribute('method', 'POST')
    expect(logout.querySelector('button')).toHaveTextContent('Abmelden')
    expect(container).toHaveTextContent('page content')
  })

  it('shows the sales banner instead of the old lock banner, only for inactive accounts', () => {
    const locked = renderShell(false)
    const banner = locked.getByTestId('upsell-banner')
    expect(banner).toHaveTextContent('noch nicht freigeschaltet')
    expect(banner).toHaveTextContent('Demo mit UN 1203')
    expect(banner).toHaveTextContent(planPrice()!)
    expect(banner.querySelector('a[href="/konto#abo"]')).toHaveTextContent('Jetzt freischalten')
    // the banner is the one lock notice; pages no longer carry their own
    expect(locked.container.querySelectorAll('[role="status"]')).toHaveLength(1)
    locked.unmount()
    const active = renderShell(true)
    expect(active.queryByTestId('upsell-banner')).toBeNull()
    expect(active.container.querySelector('dialog')).toBeNull()
  })

  it('opens the sales modal on the first view of a locked user and stamps the time', () => {
    const { container } = renderShell(false)
    expect(container.querySelector('dialog')).toHaveAttribute('open')
    expect(localStorage.getItem(UPSELL_STORAGE_KEY)).not.toBeNull()
  })

  it('does not open the sales modal on /konto, but keeps the banner', () => {
    pageState.url = new URL('http://localhost/konto')
    const { container, getByTestId } = renderShell(false)
    expect(container.querySelector('dialog')).not.toHaveAttribute('open')
    expect(getByTestId('upsell-banner')).toBeInTheDocument()
  })
})

describe('(app) layout navigation', () => {
  it('defines the nav items once, as resolved hrefs', () => {
    expect(APP_NAV_ITEMS).toEqual([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Suche', href: '/suche' },
      { label: 'ADR-Text', href: '/regelwerk/adr' },
      { label: '1000 Punkte', href: '/tools/1000-punkte' },
      { label: 'Konto', href: '/konto' },
    ])
  })

  it('keeps header, upsell banner and footer off the printout', () => {
    const { container, getByTestId } = renderShell(false)
    expect(container.querySelector('header')).toHaveClass('print:hidden')
    expect(container.querySelector('footer')).toHaveClass('print:hidden')
    expect(getByTestId('upsell-banner').closest('.print\\:hidden')).not.toBeNull()
  })

  it('renders every nav item inline and in the burger menu', () => {
    const { container } = renderShell(true)
    const inline = container.querySelector('nav[aria-label="Hauptnavigation"]')!
    const panel = container.querySelector('#app-menu')!
    for (const item of APP_NAV_ITEMS) {
      expect(inline.querySelector(`a[href="${item.href}"]`), item.label).toHaveTextContent(item.label)
      expect(panel.querySelector(`a[href="${item.href}"]`), item.label).toHaveTextContent(item.label)
    }
  })

  it('puts a POST logout form into the burger menu, closed by default', async () => {
    const { container } = renderShell(true)
    const burger = container.querySelector('button[aria-controls="app-menu"]')!
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    const panel = container.querySelector('#app-menu')!
    const logout = panel.querySelector('form[action="/logout"]')!
    expect(logout).toHaveAttribute('method', 'POST')
    expect(logout.querySelector('button[type="submit"]')).toHaveTextContent('Abmelden')
    expect(panel).toHaveTextContent('k@example.de')
    await fireEvent.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toBeVisible()
  })
})

// Touch targets ≥ 44×44 px (browser audit 2026-11-23); the header stays h-14 and does not wrap.
describe('(app) layout touch targets', () => {
  it('makes the logo link 44 px tall', () => {
    const { container } = renderShell(true)
    const logo = container.querySelector('header .h-14 > a[href="/dashboard"]')!
    expect(logo).toHaveClass('inline-flex', 'items-center', 'min-h-11')
  })

  it('makes every desktop nav link and "Abmelden" at least 44×44 px', () => {
    const { container } = renderShell(true)
    const links = container.querySelectorAll('nav[aria-label="Hauptnavigation"] a')
    expect(links).toHaveLength(APP_NAV_ITEMS.length)
    for (const link of links) expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center', 'min-h-11', 'min-w-11', 'whitespace-nowrap')
    const logout = container.querySelector('header .md\\:flex form[action="/logout"] button')!
    expect(logout).toHaveClass('inline-flex', 'items-center', 'min-h-11', 'whitespace-nowrap')
  })

  it('keeps the header one row high', () => {
    const { container } = renderShell(true)
    expect(container.querySelector('header > div')).toHaveClass('h-14', 'items-center')
  })

  it('makes the footer legal links at least 44×44 px without a taller footer', () => {
    const { container } = renderShell(true)
    const footer = container.querySelector('footer')!
    expect(footer).toHaveClass('py-2')
    const links = footer.querySelectorAll('nav[aria-label="Rechtliches"] a')
    expect(links.length).toBe(4)
    for (const link of links) expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center', 'min-h-11', 'min-w-11')
  })
})

describe('(app) layout legal links', () => {
  it('links every legal page in the footer', () => {
    const { container } = renderShell(true)
    const nav = container.querySelector('nav[aria-label="Rechtliches"]')!
    for (const href of ['/impressum', '/datenschutz', '/agb', '/widerruf']) {
      expect(nav.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
  })
})
