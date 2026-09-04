import { render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import LandingPage from '../src/routes/+page.svelte'
import { FAQ_ITEMS } from '$lib/landing/faq'

afterEach(() => {
  document.head.innerHTML = ''
})

const PROPS = {}

describe('landing page', () => {
  it('renders the main sections in order', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const ids = Array.from(container.querySelectorAll('section[id], header, footer')).map(el => el.id || el.tagName.toLowerCase())
    expect(ids).toEqual(['header', 'features', 'demo', 'comparison', 'faq', 'footer'])
  })

  it('has no waitlist and points every call to action at registration', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container.querySelector('#waitlist')).toBeNull()
    expect(container.querySelector('a[href="#waitlist"]')).toBeNull()
    expect(container.querySelector('header a[href="/login"]')).toHaveTextContent('Anmelden')
    expect(container.querySelector('header a[href="/registrieren"]')).toHaveTextContent('Jetzt registrieren')
    expect(container.querySelectorAll('a[href="/registrieren"]').length).toBeGreaterThanOrEqual(3)
    expect(container).not.toHaveTextContent('Warteliste')
    expect(container).not.toHaveTextContent(/kostenlos/i)
  })

  it('describes the single paid plan in the pricing FAQ', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container).toHaveTextContent('ohne Funktionsstufen')
    expect(container).toHaveTextContent('zuerst registrierten Nutzern')
  })

  it('renders the embedded demo tool with UN 1203', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container.querySelector('#demo')).toHaveTextContent('UN 1203 · Verfügbarkeit in allen Modi')
  })

  it('renders every FAQ item as a details element', () => {
    render(LandingPage, { props: PROPS })
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
    expect(document.querySelectorAll('#faq details')).toHaveLength(FAQ_ITEMS.length)
  })

  it('emits title, description, canonical and four JSON-LD graphs into <head>', () => {
    render(LandingPage, { props: PROPS })
    expect(document.title).toBe('gefahrgut.org – Gefahrgut-Datenbank & Tools für Gefahrgutbeauftragte')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('16.730 Einträge')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Jetzt registrieren')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://gefahrgut.org/')
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://gefahrgut.org/og-image.png')

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    expect(scripts).toHaveLength(4)
    const types = scripts.map(s => JSON.parse(s.textContent ?? '{}')['@type']).sort()
    expect(types).toEqual(['FAQPage', 'Organization', 'SoftwareApplication', 'WebSite'])
  })

  it('FAQPage JSON-LD mirrors the visible FAQ exactly (SEO invariant)', () => {
    render(LandingPage, { props: PROPS })
    const faqLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => JSON.parse(s.textContent ?? '{}'))
      .find(ld => ld['@type'] === 'FAQPage')
    expect(faqLd.mainEntity.map((e: { name: string }) => e.name)).toEqual(FAQ_ITEMS.map(i => i.question))
  })
})
