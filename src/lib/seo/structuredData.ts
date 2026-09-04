import type { FaqItem } from '$lib/landing/faq'

export const SITE_URL = 'https://gefahrgut.org'

export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'Organization' as const,
    'name': 'gefahrgut.org',
    'url': SITE_URL,
    'logo': `${SITE_URL}/og-image.png`,
  }
}

export function buildWebSiteLd() {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'WebSite' as const,
    'name': 'gefahrgut.org',
    'url': SITE_URL,
    'inLanguage': 'de',
  }
}

export function buildSoftwareApplicationLd() {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'SoftwareApplication' as const,
    'name': 'gefahrgut.org',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'description': 'Gefahrgut-Datenbank und Werkzeuge für Gefahrgutbeauftragte: multimodaler Vergleich von ADR, RID, IMDG und ICAO auf Basis der BAM-GEFAHRGUT-Datenbank.',
    'url': SITE_URL,
    // no `offers` until the price is public — a placeholder price of 0 would read as "free"
  }
}

export function buildFaqPageLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'FAQPage' as const,
    'mainEntity': items.map(item => ({
      '@type': 'Question' as const,
      'name': item.question,
      'acceptedAnswer': { '@type': 'Answer' as const, 'text': item.answer },
    })),
  }
}
