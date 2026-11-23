<script lang="ts">
  import { untrack } from 'svelte'
  import { planPrice } from '$lib/legalPages/facts'
  import {
    UPSELL_BENEFITS,
    UPSELL_CTA,
    UPSELL_INTRO,
    UPSELL_LATER,
    UPSELL_TITLE,
    upsellEligible,
    upsellHref,
  } from './copy'
  import { UpsellThrottle, type UpsellThrottleOptions } from './upsellThrottle.svelte'

  let {
    isActive,
    pathname,
    throttleOptions,
  }: {
    isActive: boolean
    /** the current path; every change counts as a page view */
    pathname: string
    /** clock and storage for tests; the browser defaults otherwise */
    throttleOptions?: UpsellThrottleOptions
  } = $props()

  const throttle = untrack(() => new UpsellThrottle(throttleOptions))
  const price = planPrice()
  let dialog = $state<HTMLDialogElement>()

  // one page view per path (first view included)
  $effect(() => {
    const eligible = upsellEligible(isActive, pathname)
    untrack(() => throttle.pageView(eligible))
  })

  // showModal() moves focus in, makes the page inert (focus trap) and closes on Escape;
  // close() hands focus back to whatever had it before
  $effect(() => {
    if (!dialog) return
    if (throttle.open && !dialog.open) dialog.showModal()
    else if (!throttle.open && dialog.open) dialog.close()
  })
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="upsell-title"
  aria-describedby="upsell-intro"
  data-testid="upsell-modal"
  class="upsell m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white p-0 text-[#0f2744] shadow-2xl backdrop:bg-[#0f2744]/60"
  onclose={() => throttle.close()}
>
  <div class="p-5 sm:p-7">
    <h2 id="upsell-title" class="text-xl sm:text-2xl font-bold mb-2">{UPSELL_TITLE}</h2>
    <p id="upsell-intro" class="text-sm text-slate-600 mb-4">{UPSELL_INTRO}</p>

    <ul class="grid gap-2 text-sm mb-5">
      {#each UPSELL_BENEFITS as benefit (benefit)}
        <li class="flex items-start gap-2">
          <svg class="w-5 h-5 shrink-0 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L20 7" />
          </svg>
          <span class="min-w-0 break-words">{benefit}</span>
        </li>
      {/each}
    </ul>

    {#if price}
      <p class="text-lg font-bold mb-5" data-testid="upsell-price">{price}</p>
    {/if}

    <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
      <button
        type="button"
        class="min-h-11 px-5 rounded-xl text-sm font-semibold text-[#0f2744] border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f2744]"
        onclick={() => throttle.close()}
      >{UPSELL_LATER}</button>
      <a
        href={upsellHref()}
        class="inline-flex items-center justify-center min-h-11 px-6 rounded-xl text-sm font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f2744]"
        onclick={() => throttle.close()}
      >{UPSELL_CTA}</a>
    </div>
  </div>
</dialog>

<style>
  @media (prefers-reduced-motion: no-preference) {
    .upsell[open] {
      animation: upsell-in 180ms ease-out;
    }
  }

  @keyframes upsell-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
</style>
