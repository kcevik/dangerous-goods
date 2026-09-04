<script lang="ts">
  import Comparison from '$lib/landing/Comparison.svelte'
  import Cta from '$lib/landing/Cta.svelte'
  import DataSource from '$lib/landing/DataSource.svelte'
  import Faq from '$lib/landing/Faq.svelte'
  import Features from '$lib/landing/Features.svelte'
  import Footer from '$lib/landing/Footer.svelte'
  import Hero from '$lib/landing/Hero.svelte'
  import MultimodalDemo from '$lib/landing/MultimodalDemo.svelte'
  import Navbar from '$lib/landing/Navbar.svelte'
  import SeoContent from '$lib/landing/SeoContent.svelte'
  import Stats from '$lib/landing/Stats.svelte'
  import { FAQ_ITEMS } from '$lib/landing/faq'
  import {
    buildFaqPageLd,
    buildOrganizationLd,
    buildSoftwareApplicationLd,
    buildWebSiteLd,
    SITE_URL,
  } from '$lib/seo/structuredData'

  const title = 'gefahrgut.org – Gefahrgut-Datenbank & Tools für Gefahrgutbeauftragte'
  const description = 'ADR, RID, IMDG und ICAO in einer Plattform: 16.730 Einträge der BAM-GEFAHRGUT-Datenbank, multimodaler Regelwerksvergleich, Sondervorschriften im Volltext und Werkzeuge wie der 1000-Punkte-Rechner. Jetzt registrieren.'

  // JSON-LD is injected with {@html}; escaping "<" guarantees content can never close the script tag
  function ldScript(ld: unknown): string {
    const json = JSON.stringify(ld).replace(/</g, '\\u003c')
    return `<script type="application/ld+json">${json}<\/script>`
  }

  const jsonLd = [
    buildOrganizationLd(),
    buildWebSiteLd(),
    buildSoftwareApplicationLd(),
    buildFaqPageLd(FAQ_ITEMS),
  ].map(ldScript).join('')
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={`${SITE_URL}/`} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={`${SITE_URL}/`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta property="og:locale" content="de_DE" />
  <meta property="og:site_name" content="gefahrgut.org" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
  {@html jsonLd}
</svelte:head>

<div class="min-h-screen bg-white font-sans antialiased">
  <Navbar />
  <Hero />
  <Stats />
  <Features />
  <MultimodalDemo />
  <Comparison />
  <SeoContent />
  <DataSource />
  <Faq />
  <Cta />
  <Footer />
</div>
