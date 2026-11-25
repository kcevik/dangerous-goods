import { fireEvent, render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { beforeAll, describe, expect, it } from 'vitest'
import { planPrice } from '$lib/legalPages/facts'
import { UPSELL_BANNER_PITCH, UPSELL_BANNER_PITCH_SHORT, UPSELL_BENEFITS, UPSELL_TITLE, upsellEligible, upsellHref } from '$lib/upsell/copy'
import UpsellBanner from '$lib/upsell/UpsellBanner.svelte'
import UpsellModal from '$lib/upsell/UpsellModal.svelte'
import { polyfillDialog } from './helpers/dialog'
import { UPSELL_INTERVAL_MS } from '$lib/upsell/upsellThrottle.svelte'

beforeAll(polyfillDialog)

function renderModal(props: { isActive?: boolean, pathname?: string, now?: () => number } = {}) {
  return render(UpsellModal, {
    props: {
      isActive: props.isActive ?? false,
      pathname: props.pathname ?? '/dashboard',
      throttleOptions: { now: props.now ?? (() => 1_000_000) },
    },
  })
}

const dialogOf = (container: HTMLElement) => container.querySelector('dialog') as HTMLDialogElement

describe('upsellEligible', () => {
  it('is false for active accounts and on /konto, true for locked accounts elsewhere', () => {
    expect(upsellEligible(true, '/dashboard')).toBe(false)
    expect(upsellEligible(false, '/konto')).toBe(false)
    expect(upsellEligible(false, '/konto/irgendwas')).toBe(false)
    expect(upsellEligible(false, '/dashboard')).toBe(true)
    expect(upsellEligible(false, '/kontoauszug')).toBe(true)
  })
})

describe('UpsellModal', () => {
  it('opens as a labelled modal dialog on the first view of a locked user', () => {
    const { container } = renderModal()
    const dialog = dialogOf(container)
    expect(dialog.open).toBe(true)
    const title = container.querySelector(`#${dialog.getAttribute('aria-labelledby')}`)
    expect(title).toHaveTextContent(UPSELL_TITLE)
    for (const benefit of UPSELL_BENEFITS) expect(dialog).toHaveTextContent(benefit)
  })

  it('never opens for active users', () => {
    const { container } = renderModal({ isActive: true })
    expect(dialogOf(container).open).toBe(false)
  })

  it('never opens on /konto', () => {
    const { container } = renderModal({ pathname: '/konto' })
    expect(dialogOf(container).open).toBe(false)
  })

  it('shows the price from LEGAL_FACTS', () => {
    const { getByTestId } = renderModal()
    expect(planPrice()).toBe('59 € pro Monat inkl. MwSt.')
    expect(getByTestId('upsell-price')).toHaveTextContent(planPrice()!)
  })

  it('links "Jetzt freischalten" to the Abo card on /konto', () => {
    const { getByRole } = renderModal()
    const link = getByRole('link', { name: 'Jetzt freischalten' })
    expect(link).toHaveAttribute('href', '/konto#abo')
    expect(upsellHref()).toBe('/konto#abo')
  })

  it('closes on "Später"', async () => {
    const { container, getByRole } = renderModal()
    await fireEvent.click(getByRole('button', { name: 'Später' }))
    await tick()
    expect(dialogOf(container).open).toBe(false)
  })

  it('syncs a native close (Escape) back into its state, so it can reopen later', async () => {
    let now = 1_000_000
    const { container, rerender } = renderModal({ now: () => now })
    const dialog = dialogOf(container)
    dialog.close() // what Escape ends in: the browser closes the dialog and fires `close`
    await tick()
    now += UPSELL_INTERVAL_MS
    await rerender({ pathname: '/suche' })
    expect(dialog.open).toBe(true)
  })

  it('stays closed when navigating within 10 minutes, then reopens', async () => {
    let now = 1_000_000
    const { container, rerender } = renderModal({ now: () => now })
    expect(dialogOf(container).open).toBe(true)
    dialogOf(container).close()
    await tick()
    now += 60_000
    await rerender({ pathname: '/suche' })
    expect(dialogOf(container).open).toBe(false)
    now += UPSELL_INTERVAL_MS
    await rerender({ pathname: '/regelwerk/adr' })
    expect(dialogOf(container).open).toBe(true)
  })

  it('closes when the user navigates to /konto', async () => {
    const { container, rerender } = renderModal()
    expect(dialogOf(container).open).toBe(true)
    await rerender({ pathname: '/konto' })
    expect(dialogOf(container).open).toBe(false)
  })
})

describe('UpsellBanner', () => {
  it('shows the pitch, the price from LEGAL_FACTS and the link to the Abo card', () => {
    const { getByTestId, getByRole } = render(UpsellBanner)
    const banner = getByTestId('upsell-banner')
    expect(banner).toHaveTextContent('noch nicht freigeschaltet')
    expect(banner).toHaveTextContent('UN 1203')
    // phones get a short pitch, wider screens the full one
    expect(banner).toHaveTextContent(UPSELL_BANNER_PITCH_SHORT)
    expect(banner).toHaveTextContent(UPSELL_BANNER_PITCH)
    expect(banner).toHaveTextContent(planPrice()!)
    expect(getByRole('link', { name: 'Jetzt freischalten' })).toHaveAttribute('href', '/konto#abo')
  })
})
