<script lang="ts">
  import { planPrice } from '$lib/legalPages/facts'
  import { UPSELL_BANNER_PITCH, UPSELL_BANNER_PITCH_SHORT, UPSELL_CTA, upsellHref } from './copy'

  const price = planPrice()
</script>

<!--
  Replaces the old lock banner of the (app) layout: same place, same essential message.
  Phones get the short pitch next to the button, so the strip stays one row high.
-->
<div role="status" data-testid="upsell-banner" class="bg-amber-100 border-b border-amber-300 text-amber-900">
  <div class="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3 sm:gap-4">
    <svg class="hidden sm:block w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
    <p class="min-w-0 flex-1 text-xs sm:text-sm leading-snug break-words">
      <span class="sm:hidden">{UPSELL_BANNER_PITCH_SHORT}</span>
      <span class="hidden sm:inline">{UPSELL_BANNER_PITCH}</span>
      {#if price}
        <span class="font-semibold">Alle Daten für {price}</span>
      {/if}
    </p>
    <a
      href={upsellHref()}
      class="shrink-0 inline-flex items-center justify-center min-h-11 sm:min-h-9 px-3 sm:px-4 rounded-lg text-sm font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f2744]"
    >{UPSELL_CTA}</a>
  </div>
</div>
