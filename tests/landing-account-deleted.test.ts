import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACCOUNT_DELETED_MESSAGE } from '$lib/account/messages'

const { afterNavigateCallbacks } = vi.hoisted(() => ({ afterNavigateCallbacks: [] as (() => void)[] }))
vi.mock('$app/navigation', () => ({
  afterNavigate: (cb: () => void) => afterNavigateCallbacks.push(cb),
}))

const { load } = await import('../src/routes/+page.server')
const { default: LandingPage } = await import('../src/routes/+page.svelte')

let scrollTo: ReturnType<typeof vi.fn>

beforeEach(() => {
  afterNavigateCallbacks.length = 0
  scrollTo = vi.fn()
  window.scrollTo = scrollTo as never
})

afterEach(() => {
  document.head.innerHTML = ''
})

function navigated() {
  afterNavigateCallbacks.forEach(cb => cb())
}

describe('landing page after account deletion', () => {
  it('load flags ?konto=geloescht only', async () => {
    expect(await load({ url: new URL('http://localhost/?konto=geloescht') } as never)).toEqual({ accountDeleted: true })
    expect(await load({ url: new URL('http://localhost/?konto=x') } as never)).toEqual({ accountDeleted: false })
    expect(await load({ url: new URL('http://localhost/') } as never)).toEqual({ accountDeleted: false })
  })

  it('shows the German confirmation only when flagged', () => {
    const shown = render(LandingPage, { props: { data: { registrationOpen: false, accountDeleted: true } as never } })
    expect(shown.getByRole('status')).toHaveTextContent(ACCOUNT_DELETED_MESSAGE)
    shown.unmount()
    const plain = render(LandingPage, { props: { data: { registrationOpen: false } as never } })
    expect(plain.container).not.toHaveTextContent(ACCOUNT_DELETED_MESSAGE)
  })

  // The delete form's redirect is a client-side goto from the bottom of /konto. SvelteKit's
  // scroll reset is animated by `html { scroll-behavior: smooth }`, so the page jumps to the
  // top itself, instantly, once the navigation has settled, and hands focus to the notice.
  it('jumps to the top and focuses the notice after the navigation', () => {
    const { getByRole } = render(LandingPage, { props: { data: { registrationOpen: false, accountDeleted: true } as never } })
    const notice = getByRole('status')
    expect(afterNavigateCallbacks.length).toBeGreaterThan(0)
    navigated()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
    expect(notice).toHaveAttribute('tabindex', '-1')
    expect(document.activeElement).toBe(notice)
  })

  it('leaves scroll and focus alone without the flag', () => {
    render(LandingPage, { props: { data: { registrationOpen: false } as never } })
    const before = document.activeElement
    navigated()
    expect(scrollTo).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(before)
  })
})
