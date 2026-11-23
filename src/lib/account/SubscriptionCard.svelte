<script lang="ts">
  import { planPrice } from '$lib/legalPages/facts'
  import type { SubscriptionStatus } from './subscription'

  // Stripe later: when checkoutAvailable is true this becomes a form posting to ?/subscribe.
  let { status, checkoutAvailable }: { status: SubscriptionStatus, checkoutAvailable: boolean } = $props()

  const price = planPrice()
</script>

<!-- id="abo": the sales modal and banner for locked accounts link to /konto#abo -->
<section id="abo" aria-labelledby="subscription-heading" class="scroll-mt-4 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
  <h2 id="subscription-heading" class="font-semibold text-lg mb-3 text-[#0f2744]">Abo</h2>

  {#if price}
    <p class="text-sm text-slate-600 mb-2">
      Preis: <span class="font-semibold text-[#0f2744]" data-testid="plan-price">{price}</span>
    </p>
  {/if}

  <p class="text-sm text-slate-600 mb-4">
    Status:
    {#if status.kind === 'active'}
      <span class="font-semibold text-green-700">{status.since ? `aktiv seit ${status.since}` : 'aktiv'}</span>
    {:else if status.kind === 'locked'}
      <span class="font-semibold text-amber-700">gesperrt</span>
      <span class="block mt-1 text-slate-500">Dein Konto ist noch nicht freigeschaltet. Bis dahin siehst du nur die Demo-Daten.</span>
    {:else}
      <span role="alert" class="font-semibold text-red-600">konnte nicht geladen werden</span>
    {/if}
  </p>

  <!-- shown for active accounts too: today "aktiv" means activated by hand, not subscribed -->
  <button
    type="button"
    disabled={!checkoutAvailable}
    class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#f97316] disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {checkoutAvailable ? 'Abo abschließen' : 'Abo abschließen — demnächst verfügbar'}
  </button>
</section>
