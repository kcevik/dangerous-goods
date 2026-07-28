import { describe, expect, it } from 'vitest'
import { FAQ_ITEMS } from '~/utils/landingFaq'
import {
  buildFaqPageLd,
  buildOrganizationLd,
  buildSoftwareApplicationLd,
  buildWebSiteLd,
  SITE_URL,
} from '~/utils/structuredData'

describe('structured data', () => {
  it('Organization has name, url and logo', () => {
    const ld = buildOrganizationLd()
    expect(ld['@type']).toBe('Organization')
    expect(ld.name).toBe('gefahrgut.org')
    expect(ld.url).toBe(SITE_URL)
    expect(ld.logo).toContain(SITE_URL)
  })

  it('WebSite points at the canonical URL', () => {
    const ld = buildWebSiteLd()
    expect(ld['@type']).toBe('WebSite')
    expect(ld.url).toBe(SITE_URL)
  })

  it('SoftwareApplication carries the free-tier offer', () => {
    const ld = buildSoftwareApplicationLd()
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.offers.price).toBe('0')
    expect(ld.offers.priceCurrency).toBe('EUR')
    expect(ld.offers.description).toContain('5 Suchanfragen')
  })

  it('FAQPage mirrors the visible FAQ items exactly', () => {
    const ld = buildFaqPageLd(FAQ_ITEMS)
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(FAQ_ITEMS.length)
    expect(ld.mainEntity.map(e => e.name)).toEqual(FAQ_ITEMS.map(i => i.question))
    expect(ld.mainEntity[0]!.acceptedAnswer.text).toBe(FAQ_ITEMS[0]!.answer)
  })

  it('every builder produces valid JSON', () => {
    for (const ld of [buildOrganizationLd(), buildWebSiteLd(), buildSoftwareApplicationLd(), buildFaqPageLd(FAQ_ITEMS)]) {
      expect(() => JSON.parse(JSON.stringify(ld))).not.toThrow()
      expect(ld['@context']).toBe('https://schema.org')
    }
  })
})
