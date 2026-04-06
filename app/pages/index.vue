<template>
  <div class="min-h-screen bg-white font-sans antialiased">
    <LandingNavbar />
    <LandingHero />
    <LandingStats />
    <LandingFeatures />
    <LandingComparison />
    <LandingPricing />
    <LandingDataSource />
    <LandingCta />
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'GefahrgutProfi – Die Arbeitsplattform für Gefahrgutbeauftragte',
  meta: [
    {
      name: 'description',
      content: 'Alle Gefahrgutregelwerke, alle Werkzeuge, alle Dokumente – zentral auf einer Plattform für Gefahrgutbeauftragte.',
    },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' },
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
