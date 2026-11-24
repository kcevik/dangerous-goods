// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DATA_SOURCE_LABEL, SITE_FACTS } from '$lib/landing/siteFacts'

const llms = readFileSync('static/llms.txt', 'utf8')

describe('static/llms.txt', () => {
  it('does not promise open registration while the site is pre-launch', () => {
    expect(llms).not.toMatch(/Registrierung ist offen/)
    expect(llms).toMatch(/Benachrichtigung zum Start/)
  })

  it('keeps the site facts shared with the landing page (SEO invariant)', () => {
    expect(llms).toContain(`${SITE_FACTS.entries} Einträge`)
    expect(llms).toContain(`${SITE_FACTS.unNumbers} UN-Nummern`)
    expect(llms).toContain(`${SITE_FACTS.specialProvisions} Sondervorschriften`)
    expect(llms).toContain(DATA_SOURCE_LABEL)
    expect(llms).toContain('dl-de/by-2-0')
  })

  it('makes none of the claims the persona tests flagged', () => {
    expect(llms).not.toMatch(/zertifiz|rechtssicher|noch nicht fest|unter 1\.000/i)
    expect(llms).toMatch(/ADN[^.]*nicht/)
  })

  it('separates what is available from what is planned', () => {
    expect(llms).toMatch(/## Funktionen \(verfügbar\)/)
    expect(llms).toMatch(/## Geplant/)
  })

  it('lists the shipped 1000-Punkte-Rechner as available, not as planned', () => {
    const [available, planned] = llms.split('## Geplant')
    expect(available).toContain('1000-Punkte-Rechner')
    expect(planned).not.toContain('1000-Punkte')
    expect(planned).toContain('LQ/EQ')
  })

  it('links the site on the canonical host (the landing page lives at app.), only the blog stays on the apex', () => {
    const urls = llms.match(/https:\/\/[a-z.]*gefahrgut\.org[^\s)]*/g) ?? []
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls.filter(u => !u.includes('/blog'))) expect(url).toMatch(/^https:\/\/app\.gefahrgut\.org/)
  })
})
