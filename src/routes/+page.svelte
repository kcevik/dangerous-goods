<script lang="ts">
  import { afterNavigate } from '$app/navigation'
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
  import { ACCOUNT_DELETED_MESSAGE } from '$lib/account/messages'
  import { FAQ_ITEMS } from '$lib/landing/faq'
  import { DATA_SOURCE_LABEL, SITE_FACTS } from '$lib/landing/siteFacts'
  import { signupCtaLabel } from '$lib/prelaunch/copy'
  import {
    buildFaqPageLd,
    buildOrganizationLd,
    buildSoftwareApplicationLd,
    buildWebSiteLd,
    SITE_URL,
  } from '$lib/seo/structuredData'

  // keyword first, under ~60 characters so Google does not cut it off
  const title = 'Software für Gefahrgutbeauftragte | gefahrgut.org'
  let { data } = $props()
  // fail-closed: without layout data the page shows the pre-launch wording
  const registrationOpen = $derived(data?.registrationOpen === true)
  const description = $derived(`Für Gefahrgutbeauftragte: ADR, RID, IMDG und ICAO in einer Plattform: ${SITE_FACTS.unNumbers} UN-Nummern, ${SITE_FACTS.entries} Einträge aus der ${DATA_SOURCE_LABEL}, multimodaler Regelwerksvergleich, Sondervorschriften im Volltext und das ADR als Lesetext. ${signupCtaLabel(registrationOpen)}.`)

  // JSON-LD is injected with {@html}; escaping "<" guarantees content can never close the script tag
  function ldScript(ld: unknown): string {
    const json = JSON.stringify(ld).replace(/</g, '\\u003c')
    return `<script type="application/ld+json">${json}<\/script>`
  }

  let deletedNotice = $state<HTMLDivElement>()

  // The delete form on /konto redirects here with a client-side goto. SvelteKit's scroll reset
  // runs, but `html { scroll-behavior: smooth }` turns it into an animation from the bottom of
  // /konto, so the notice starts out of view. Once the navigation has settled (and on a full page
  // load), jump to the top instantly and give the notice focus so screen readers read it.
  afterNavigate(() => {
    if (!data?.accountDeleted || !deletedNotice) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    deletedNotice.focus({ preventScroll: true })
  })

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

<div class="min-h-screen overflow-x-clip bg-white antialiased">
  {#if data?.accountDeleted}
    <div bind:this={deletedNotice} role="status" tabindex="-1" class="bg-green-50 focus:outline-none border-b border-green-200 text-green-900 text-sm">
      <div class="max-w-5xl mx-auto px-4 py-3">{ACCOUNT_DELETED_MESSAGE}</div>
    </div>
  {/if}
  <Navbar {registrationOpen} />
  <Hero {registrationOpen} />
  <Features />
  <MultimodalDemo />
  <Comparison />
  <SeoContent />
  <DataSource />
  <Faq />
  <Cta {registrationOpen} />
  <Footer {registrationOpen} />
</div>
