import { render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { afterEach, describe, expect, it } from 'vitest'
import { IMPRESSUM } from '$lib/legalPages/impressum'
import LegalPage from '$lib/legalPages/LegalPage.svelte'
import { type LegalFacts, LEGAL_FACTS } from '$lib/legalPages/facts'
import LegalLayout from '../src/routes/(legal)/+layout.svelte'
import AgbPage from '../src/routes/(legal)/agb/+page.svelte'
import DatenschutzPage from '../src/routes/(legal)/datenschutz/+page.svelte'
import ImpressumPage from '../src/routes/(legal)/impressum/+page.svelte'
import WiderrufPage from '../src/routes/(legal)/widerruf/+page.svelte'

afterEach(() => {
  document.head.innerHTML = ''
})

const COMPLETE = Object.fromEntries(Object.keys(LEGAL_FACTS).map(k => [k, `«${k}»`])) as unknown as LegalFacts

describe('legal pages', () => {
  const pages = [
    ['Impressum', ImpressumPage],
    ['Datenschutzerklärung', DatenschutzPage],
    ['Allgemeine Geschäftsbedingungen', AgbPage],
    ['Widerrufsbelehrung', WiderrufPage],
  ] as const

  for (const [title, Page] of pages) {
    it(`renders "${title}" with its heading and date`, () => {
      const { container } = render(Page)
      expect(container.querySelector('h1')).toHaveTextContent(title)
      expect(container).toHaveTextContent('Stand:')
    })
  }
})

describe('LegalPage draft state', () => {
  it('shows a draft banner listing the missing facts and keeps the page out of search engines', () => {
    const { container } = render(LegalPage, { props: { document: IMPRESSUM, facts: { ...COMPLETE, email: null } } })
    const banner = container.querySelector('[role="note"]')!
    expect(banner).toHaveTextContent('Entwurf – noch nicht gültig')
    expect(banner).toHaveTextContent('E-Mail-Adresse')
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })

  it('has no banner and no noindex once every fact is set', () => {
    const { container } = render(LegalPage, { props: { document: IMPRESSUM, facts: COMPLETE } })
    expect(container.querySelector('[role="note"]')).toBeNull()
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    expect(container).toHaveTextContent('«companyName»')
  })
})

describe('(legal) layout', () => {
  it('links home and to every legal page', () => {
    const children = createRawSnippet(() => ({ render: () => '<p>content</p>' }))
    const { container } = render(LegalLayout, { props: { children } })
    expect(container.querySelector('a[href="/"]')).not.toBeNull()
    for (const href of ['/impressum', '/datenschutz', '/agb', '/widerruf']) {
      expect(container.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
  })
})
