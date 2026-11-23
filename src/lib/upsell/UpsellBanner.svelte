<script lang="ts">
  import { planPrice } from '$lib/legalPages/facts'
  import { UPSELL_BANNER_PITCH, UPSELL_CTA, upsellHref } from './copy'

  const price = planPrice()
</script>

<!-- replaces the old lock banner of the (app) layout: same place, same essential message -->
<div role="status" data-testid="upsell-banner" class="bg-amber-100 border-b border-amber-300 text-amber-900 text-sm">
  <div class="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
    <p class="flex items-start gap-2 min-w-0 flex-1 basis-64">
      <span aria-hidden="true">🔒</span>
      <span class="min-w-0 break-words">
        {UPSELL_BANNER_PITCH}
        {#if price}
          <span class="font-semibold whitespace-nowrap">Alle Daten für {price}</span>
        {/if}
      </span>
    </p>
    <a
      href={upsellHref()}
      class="inline-flex items-center justify-center min-h-11 sm:min-h-9 px-4 rounded-lg font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f2744]"
    >{UPSELL_CTA}</a>
  </div>
</div>
