import { describe, expect, it } from 'vitest'
import { MenuState } from '$lib/nav/menu.svelte'

describe('MenuState', () => {
  it('starts closed with the "open" label', () => {
    const menu = new MenuState()
    expect(menu.open).toBe(false)
    expect(menu.buttonLabel).toBe('Menü öffnen')
  })

  it('toggles and switches the label', () => {
    const menu = new MenuState()
    menu.toggle()
    expect(menu.open).toBe(true)
    expect(menu.buttonLabel).toBe('Menü schließen')
    menu.toggle()
    expect(menu.open).toBe(false)
  })

  it('closes on Escape and reports it; other keys and a closed menu are ignored', () => {
    const menu = new MenuState()
    expect(menu.handleKeydown({ key: 'Escape' })).toBe(false)
    menu.toggle()
    expect(menu.handleKeydown({ key: 'Enter' })).toBe(false)
    expect(menu.open).toBe(true)
    expect(menu.handleKeydown({ key: 'Escape' })).toBe(true)
    expect(menu.open).toBe(false)
  })

  it('closes on a press outside the root but not inside it', () => {
    const root = document.createElement('div')
    const inside = document.createElement('span')
    root.append(inside)
    const outside = document.createElement('p')
    const menu = new MenuState()
    menu.toggle()
    menu.handleOutsidePress(inside, root)
    expect(menu.open).toBe(true)
    menu.handleOutsidePress(outside, root)
    expect(menu.open).toBe(false)
  })

  it('ignores outside presses without a root', () => {
    const menu = new MenuState()
    menu.toggle()
    menu.handleOutsidePress(document.body, undefined)
    expect(menu.open).toBe(true)
  })

  it('closes on a click on a link (or inside one) in the panel, not on other elements', () => {
    const link = document.createElement('a')
    const icon = document.createElement('span')
    link.append(icon)
    const text = document.createElement('p')
    const menu = new MenuState()
    menu.toggle()
    menu.handlePanelClick(text)
    expect(menu.open).toBe(true)
    menu.handlePanelClick(icon)
    expect(menu.open).toBe(false)
  })
})
