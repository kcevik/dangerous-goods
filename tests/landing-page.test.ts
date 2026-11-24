import { render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import LandingPage from '../src/routes/+page.svelte'
import { FAQ_ITEMS } from '$lib/landing/faq'
import { planPrice } from '$lib/legalPages/facts'

afterEach(() => {
  document.head.innerHTML = ''
})

const PROPS = { data: { registrationOpen: true } as never }

describe('landing page', () => {
  it('renders the main sections in order', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const ids = Array.from(container.querySelectorAll('section[id], header, footer')).map(el => el.id || el.tagName.toLowerCase())
    expect(ids).toEqual(['header', 'features', 'demo', 'comparison', 'datenbasis', 'faq', 'footer'])
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

  it('shows no price (owner rule: no pricing section on the landing page)', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container).not.toHaveTextContent(planPrice()!)
    expect(container).not.toHaveTextContent(/\d\s*€/)
  })

  it('describes the single paid plan in the pricing FAQ', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container).toHaveTextContent('ohne Funktionsstufen')
    expect(container).not.toHaveTextContent('zuerst registrierten Nutzern')
  })

  it('links the in-app legal pages from the footer', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const footer = container.querySelector('footer')!
    for (const href of ['/impressum', '/datenschutz', '/agb', '/widerruf']) {
      expect(footer.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
    expect(footer.querySelector('a[href="#"]')?.textContent).not.toBe('AGB')
  })

  it('presents the regulatory comparison truthfully, from the demo data', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const section = container.querySelector('#comparison')!
    expect(container).toHaveTextContent('Neu: Regelwerksvergleich ADR · RID · IMDG · ICAO')
    expect(section).not.toHaveTextContent('Demnächst verfügbar')
    expect(section).not.toHaveTextContent(/PDF/)
    expect(section).not.toHaveTextContent(/Transportassistent/)
    expect(container).not.toHaveTextContent('ICAO und ADN')
    const modes = [...section.querySelectorAll('tbody tr td:first-child')].map(td => td.textContent?.trim())
    expect(modes).toEqual(['ADR', 'RID', 'IMDG', 'ICAO'])
    expect(section.querySelector('tbody tr td:nth-child(4)')).toHaveTextContent('1 L') // ADR limited quantity from DEMO_DATA
    expect(section).toHaveTextContent('Keine kritischen Abweichungen für UN 1203')
    expect(section.querySelector('a[href="/un/1203/vergleich"]')).toHaveTextContent('Vergleich ansehen')
  })

  it('guards against horizontal scroll and uses one section rhythm on phones', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container.firstElementChild).toHaveClass('overflow-x-clip')
    // the big content sections share one padding scale: 4rem on phones, 5rem from sm, 7rem from lg
    for (const id of ['features', 'demo', 'comparison', 'faq']) {
      expect(container.querySelector(`#${id}`)).toHaveClass('py-16', 'sm:py-20', 'lg:py-28')
    }
    expect(container.querySelector('#cta-heading')!.closest('section')).toHaveClass('py-16', 'sm:py-20', 'lg:py-28')
    // one card column on phones, two from sm, three from lg
    expect(container.querySelector('#features .grid')).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3')
  })

  it('inherits the self-hosted body font instead of resetting to Tailwind\'s default sans stack', () => {
    const { container } = render(LandingPage, { props: PROPS })
    expect(container.querySelector('.font-sans')).toBeNull()
  })

  it('lets every section heading break long German compounds at 320px', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const headings = container.querySelectorAll('h2')
    expect(headings.length).toBeGreaterThanOrEqual(6)
    // one type scale; 24px below 375px so "Gefahrgutbeauftragte" fits a 320px line unbroken
    for (const h of headings) expect(h).toHaveClass('break-words', 'hyphens-auto', 'text-2xl', 'min-[375px]:text-3xl', 'sm:text-4xl')
  })

  it('breaks the hero headline only at its soft hyphen ("Gefahrgut-vorschriften", never "…vorschrif-ten")', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const h1 = container.querySelector('h1')!
    expect(h1.textContent).toContain('Gefahrgut­vorschriften')
    expect(h1).not.toHaveClass('hyphens-auto')
    expect(h1).toHaveClass('break-words')
  })

  it('gives footer links a 44px touch target on phones and tablets', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const links = container.querySelectorAll('footer ul a')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link).toHaveClass('min-h-11', 'min-w-11', 'lg:min-h-0')
  })

  it('keeps the comparison mockup scrollable inside its card instead of widening the page', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const table = container.querySelector('#comparison table')!
    expect(table.parentElement).toHaveClass('overflow-x-auto')
    expect(table.closest('.rounded-2xl')).toHaveClass('min-w-0')
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
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://app.gefahrgut.org/')
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://app.gefahrgut.org/og-image.png')

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

describe('landing page — waitlist mode', () => {
  const WAITLIST = { data: { registrationOpen: false } as never }

  it('labels every sign-up call to action "Zum Launch benachrichtigen" and keeps Anmelden', () => {
    const { container } = render(LandingPage, { props: WAITLIST })
    const signup = Array.from(container.querySelectorAll('a[href="/registrieren"]'))
    expect(signup.length).toBeGreaterThanOrEqual(3)
    for (const link of signup) expect(link).toHaveTextContent('Zum Launch benachrichtigen')
    expect(container).not.toHaveTextContent('Jetzt registrieren')
    expect(container.querySelector('header a[href="/login"]')).toHaveTextContent('Anmelden')
  })

  it('uses the waitlist wording in the meta description', () => {
    render(LandingPage, { props: WAITLIST })
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Zum Launch benachrichtigen')
  })

  it('treats missing layout data as waitlist (fail-closed)', () => {
    const { container } = render(LandingPage, { props: {} as never })
    expect(container).not.toHaveTextContent('Jetzt registrieren')
  })
})
