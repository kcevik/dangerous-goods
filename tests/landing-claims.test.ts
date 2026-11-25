import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import LandingPage from '../src/routes/+page.svelte'
import { FAQ_ITEMS, PRICE_FAQ_ANSWER } from '$lib/landing/faq'
import { planPrice } from '$lib/legalPages/facts'
import { DATA_SOURCE_LABEL, SITE_FACTS, SITE_STATS } from '$lib/landing/siteFacts'

// Persona tests 2026-11-23 §2: claims on the landing page that undermined trust.
afterEach(() => {
  document.head.innerHTML = ''
})

const OPEN = { data: { registrationOpen: true } as never }
const WAITLIST = { data: { registrationOpen: false } as never }

function everything(container: HTMLElement): string {
  return `${container.textContent} ${document.head.innerHTML}`
}

describe('landing page claims', () => {
  it('pins the site facts measured on the live BAM tables (2026-11-23)', () => {
    // count(distinct un_number) over ADR/RID/IMDG/UN = 2,347; ICAO adds only the IDs 8000 and 9999
    expect(SITE_FACTS).toEqual({ unNumbers: '2.347', entries: '16.730', specialProvisions: '1.354' })
    expect(SITE_STATS.map(s => s.value)).toEqual(['2.347', '16.730', '4', '1.354'])
    expect(DATA_SOURCE_LABEL).toBe('BAM-Datenbank GEFAHRGUT')
  })

  it('never calls the data "certified" and names the source and licence instead', () => {
    for (const props of [OPEN, WAITLIST]) {
      const { container, unmount } = render(LandingPage, { props })
      expect(everything(container)).not.toMatch(/zertifiz/i)
      expect(everything(container)).not.toMatch(/100\s*%/)
      expect(container).toHaveTextContent(`Datenbasis: ${DATA_SOURCE_LABEL}`)
      expect(container).toHaveTextContent('dl-de/by-2-0')
      unmount()
      document.head.innerHTML = ''
    }
  })

  it('labels UN numbers and entries separately, without a "+" and with the real counts', () => {
    const { container } = render(LandingPage, { props: OPEN })
    expect(container).not.toHaveTextContent('2.347+')
    expect(container).not.toHaveTextContent(/über 16\.730/)
    expect(container).toHaveTextContent('2.347 UN-Nummern')
    expect(container).toHaveTextContent('16.730 Einträge')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('2.347 UN-Nummern')
  })

  it('advertises four regulations plus the UN reference and states that ADN is not in the feed', () => {
    const { container } = render(LandingPage, { props: OPEN })
    expect(container).not.toHaveTextContent(/5\s*Regelwerke/)
    expect(container).toHaveTextContent('Regelwerke: ADR, RID, IMDG, ICAO')
    expect(container).toHaveTextContent('UN-Modellvorschriften')
    // In the landing copy ADN only ever appears as "not included". The embedded demo tool (#demo)
    // is shared app code with its own ADN tab and "no data" state, so it is left out here.
    const copy = container.cloneNode(true) as HTMLElement
    copy.querySelector('#demo')?.remove()
    const adnSentences = (copy.textContent ?? '').split(/(?<=[.!?])\s/).filter(s => /ADN/.test(s))
    expect(adnSentences.length).toBeGreaterThan(0)
    for (const s of adnSentences) expect(s).toMatch(/nicht/)
  })

  it('makes no legal-certainty promises', () => {
    const { container } = render(LandingPage, { props: OPEN })
    expect(everything(container)).not.toMatch(/rechtssicher|normkonform|regelwerkskonform|immer aktuell|als eine der ersten/i)
  })

  it('states the 1000-point threshold as "nicht mehr als 1.000 Punkte" (ADR 1.1.3.6)', () => {
    const { container } = render(LandingPage, { props: OPEN })
    expect(everything(container)).not.toMatch(/unter(halb)? (der )?1\.000|unter 1000/)
    expect(FAQ_ITEMS[0]!.answer).toContain('nicht mehr als 1.000 Punkte')
  })

  it('keeps the price FAQ free of "noch nicht fest" and "zuerst registrierten Nutzern"', () => {
    const price = FAQ_ITEMS.find(i => i.question === 'Was kostet gefahrgut.org?')!
    expect(price.answer).toBe(PRICE_FAQ_ANSWER)
    expect(PRICE_FAQ_ANSWER).not.toMatch(/noch nicht fest|zuerst registrierten|Startangebot/)
    expect(PRICE_FAQ_ANSWER).toContain('ohne Funktionsstufen')
    expect(PRICE_FAQ_ANSWER).toContain(planPrice()!)
    expect(PRICE_FAQ_ANSWER).toContain('14 Tage gratis')
  })

  it('does not call the BAM an official source and does not announce the live calculator as in progress', () => {
    const all = FAQ_ITEMS.map(i => i.answer).join(' ')
    expect(all).not.toMatch(/amtliche Quelle|in Arbeit/)
  })

  it('answers the waste question without inventing a waste tool', () => {
    const waste = FAQ_ITEMS.find(i => /Abfall/.test(i.question))!
    expect(waste.answer).toContain('2.1.3.5')
    expect(waste.answer).toContain('ABFALL')
    expect(waste.answer).toMatch(/kein eigenes Abfall-Werkzeug/)
  })
})

describe('landing page calls to action by registration mode', () => {
  it('drops "Keine Kreditkarte" and promises the demo only as what it is', () => {
    for (const props of [OPEN, WAITLIST]) {
      const { container, unmount } = render(LandingPage, { props })
      expect(container).not.toHaveTextContent(/Kreditkarte/)
      expect(container).not.toHaveTextContent('sieh dir alles an')
      expect(container.querySelector('#hero-signals')).toHaveTextContent('Demo mit UN 1203 ohne Anmeldung')
      unmount()
    }
  })

  it('talks about the launch notification in waitlist mode and about locked accounts when open', () => {
    const waitlist = render(LandingPage, { props: WAITLIST })
    expect(waitlist.container.querySelector('#hero-signals')).toHaveTextContent('Benachrichtigung zum Start per E-Mail')
    waitlist.unmount()
    const open = render(LandingPage, { props: OPEN })
    expect(open.container.querySelector('#hero-signals')).toHaveTextContent('Registrierung nur mit E-Mail-Adresse')
    expect(open.container.querySelector('#cta-heading')!.closest('section')).toHaveTextContent('Demodaten')
  })

  it('fills the right half of the hero with the site facts from lg', () => {
    const { container } = render(LandingPage, { props: OPEN })
    const grid = container.querySelector('h1')!.closest('.lg\\:grid')!
    expect(grid).toHaveClass('lg:grid-cols-2')
    const facts = container.querySelector('#hero-facts')!
    for (const stat of SITE_STATS) expect(facts).toHaveTextContent(stat.value)
  })
})

describe('landing page features and footer', () => {
  it('shows the shipped tools as available and only the unbuilt ones as "Demnächst"', () => {
    const { container } = render(LandingPage, { props: OPEN })
    const cards = Array.from(container.querySelectorAll('#features .grid > div'))
    const title = (c: Element) => c.querySelector('h3')!.textContent!.trim()
    const live = cards.filter(c => !c.hasAttribute('aria-disabled'))
    const soon = cards.filter(c => c.getAttribute('aria-disabled') === 'true')
    expect(live.map(title)).toEqual(['Stoffsuche', 'Regelwerksvergleich', 'ADR im Volltext', '1000-Punkte-Rechner'])
    for (const card of live) expect(card).not.toHaveTextContent('Demnächst')
    // F-02 shipped 2026-11-23; only LQ/EQ and the document generator are still to come
    expect(soon.map(title)).toEqual(['LQ/EQ-Rechner', 'Dokumentengenerator'])
    expect(live[3]).toHaveTextContent('ADR 1.1.3.6')
    for (const card of soon) expect(card).toHaveTextContent('Demnächst verfügbar')
    expect(live[2]).toHaveTextContent('kein rechtsverbindlicher Text')
  })

  it('has no footer link that points nowhere, and every anchor has a target', () => {
    const { container } = render(LandingPage, { props: OPEN })
    const footer = container.querySelector('footer')!
    expect(footer.querySelector('a[href="#"]')).toBeNull()
    for (const a of footer.querySelectorAll('a[href^="#"]')) {
      expect(container.querySelector(a.getAttribute('href')!), a.getAttribute('href')!).not.toBeNull()
    }
    expect(footer.querySelector('a[href="#datenbasis"]')).toHaveTextContent('Datenbasis')
    expect(footer.querySelector('a[href="https://gefahrgut.org/blog/"]')).toHaveTextContent('Blog')
  })
})
