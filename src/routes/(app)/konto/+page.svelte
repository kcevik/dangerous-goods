<script lang="ts">
  import AddressCard from '$lib/account/AddressCard.svelte'
  import DeleteAccountCard from '$lib/account/DeleteAccountCard.svelte'
  import PasswordCard from '$lib/account/PasswordCard.svelte'
  import SubscriptionCard from '$lib/account/SubscriptionCard.svelte'

  let { data, form } = $props()

  // every action answers with its name, so each card only sees its own result
  const passwordResult = $derived(form?.action === 'password' ? form : null)
  const addressResult = $derived(form?.action === 'address' ? form : null)
  const deleteResult = $derived(form?.action === 'delete' ? form : null)
</script>

<svelte:head>
  <title>Konto – gefahrgut.org</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 sm:py-10">
  <h1 class="text-2xl font-bold mb-6 text-[#0f2744]">Dein Konto</h1>

  <div class="grid gap-4">
    <section aria-labelledby="email-heading" class="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
      <h2 id="email-heading" class="font-semibold text-lg mb-1 text-[#0f2744]">E-Mail-Adresse</h2>
      <p class="text-sm text-[#0f2744] break-all" data-testid="account-email">{data.email}</p>
    </section>

    <SubscriptionCard status={data.subscription} checkoutAvailable={data.checkoutAvailable} />
    <PasswordCard result={passwordResult} />
    <AddressCard address={data.address} failed={data.addressFailed} result={addressResult} />
    <DeleteAccountCard result={deleteResult} />
  </div>
</div>
