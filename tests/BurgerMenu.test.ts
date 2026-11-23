import { fireEvent, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

const { afterNavigateCallbacks } = vi.hoisted(() => ({ afterNavigateCallbacks: [] as (() => void)[] }))
vi.mock('$app/navigation', () => ({
  afterNavigate: (cb: () => void) => afterNavigateCallbacks.push(cb),
}))

const BurgerMenu = (await import('$lib/nav/BurgerMenu.svelte')).default

function renderMenu() {
  const children = createRawSnippet(() => ({
    render: () => '<div><a href="#suche">Suche</a><span>Text</span></div>',
  }))
  const result = render(BurgerMenu, { props: { id: 'test-menu', children } })
  const button = screen.getByRole('button')
  const panel = result.container.querySelector('#test-menu') as HTMLElement
  return { ...result, button, panel }
}

describe('BurgerMenu', () => {
  it('starts closed, wired to its panel', () => {
    const { button, panel } = renderMenu()
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'test-menu')
    expect(button).toHaveAttribute('aria-label', 'Menü öffnen')
    expect(panel).not.toBeVisible()
  })

  it('is a 44×44 px touch target that keeps the icon flush with the header edge', () => {
    const { button } = renderMenu()
    expect(button).toHaveClass('w-11', 'h-11', '-mr-2.5')
  })

  it('hides itself from md by default, from lg when asked', () => {
    const { button } = renderMenu()
    expect(button.parentElement).toHaveClass('md:hidden')
    const children = createRawSnippet(() => ({ render: () => '<a href="#x">x</a>' }))
    const lg = render(BurgerMenu, { props: { id: 'lg-menu', breakpoint: 'lg', children } })
    const lgButton = lg.container.querySelector('button[aria-controls="lg-menu"]')!
    expect(lgButton.parentElement).toHaveClass('lg:hidden')
    expect(lgButton.parentElement).not.toHaveClass('md:hidden')
  })

  it('toggles open and closed', async () => {
    const { button, panel } = renderMenu()
    await fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-label', 'Menü schließen')
    expect(panel).toBeVisible()
    await fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on a link click inside the panel, not on other content', async () => {
    const { button } = renderMenu()
    await fireEvent.click(button)
    await fireEvent.click(screen.getByText('Text'))
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await fireEvent.click(screen.getByRole('link', { name: 'Suche', hidden: true }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and returns focus to the button', async () => {
    const { button } = renderMenu()
    await fireEvent.click(button)
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveFocus()
  })

  it('closes on a press outside, not on one inside', async () => {
    const { button } = renderMenu()
    await fireEvent.click(button)
    await fireEvent.pointerDown(screen.getByText('Text'))
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await fireEvent.pointerDown(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes after a navigation', async () => {
    afterNavigateCallbacks.length = 0
    const { button } = renderMenu()
    await fireEvent.click(button)
    afterNavigateCallbacks.forEach((cb) => cb())
    await Promise.resolve()
    await new Promise((r) => setTimeout(r))
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
