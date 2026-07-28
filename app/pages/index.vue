<template>
  <div class="min-h-screen bg-white font-sans antialiased">
    <LandingNavbar />
    <LandingHero />
    <LandingStats />
    <LandingFeatures />
    <LandingMultimodalDemo />
    <LandingComparison />
    <LandingSeoContent />
    <LandingWaitlist />
    <LandingDataSource />
    <LandingFaq />
    <LandingCta />
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { FAQ_ITEMS } from '~/utils/landingFaq'
import {
  buildFaqPageLd,
  buildOrganizationLd,
  buildSoftwareApplicationLd,
  buildWebSiteLd,
  SITE_URL,
} from '~/utils/structuredData'

const title = 'gefahrgut.org – Gefahrgut-Datenbank & Tools für Gefahrgutbeauftragte'
const description = 'ADR, RID, IMDG und ICAO in einer Plattform: 16.730 Einträge der BAM-GEFAHRGUT-Datenbank, multimodaler Regelwerksvergleich, Sondervorschriften im Volltext und Werkzeuge wie der 1000-Punkte-Rechner. Jetzt auf die Warteliste.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: `${SITE_URL}/`,
  ogImage: `${SITE_URL}/og-image.png`,
  ogLocale: 'de_DE',
  ogSiteName: 'gefahrgut.org',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: `${SITE_URL}/og-image.png`,
  robots: 'index, follow',
})

useHead({
  htmlAttrs: { lang: 'de' },
  link: [
    { rel: 'canonical', href: `${SITE_URL}/` },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' },
  ],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildOrganizationLd()) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildWebSiteLd()) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildSoftwareApplicationLd()) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildFaqPageLd(FAQ_ITEMS)) },
  ],
})
</script>

<style>
html { scroll-behavior: smooth; }
body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
</style>
