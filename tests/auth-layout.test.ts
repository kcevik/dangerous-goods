import { render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import AuthLayout from '../src/routes/(auth)/+layout.svelte'

describe('(auth) layout', () => {
  it('links every legal page below the form', () => {
    const children = createRawSnippet(() => ({ render: () => '<p>form</p>' }))
    const { container } = render(AuthLayout, { props: { children } })
    const nav = container.querySelector('nav[aria-label="Rechtliches"]')!
    for (const href of ['/impressum', '/datenschutz', '/agb', '/widerruf']) {
      expect(nav.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
  })
})
