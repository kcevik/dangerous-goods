<script lang="ts">
  import { resolve } from '$app/paths'
  import LockNotice from '$lib/auth/LockNotice.svelte'
  import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
  import { MODALS } from '$lib/multimodal/types'
  import { SITE_URL } from '$lib/seo/structuredData'

  let { data } = $props()

  const firstEntry = $derived(data.compareData ? MODALS.map(m => data.compareData?.[m]?.[0]).find(Boolean) : undefined)
  const name = $derived(firstEntry?.name ?? firstEntry?.nameEn ?? '')
  const title = $derived(name
    ? `UN ${data.unNumber} – ${name} | gefahrgut.org`
    : `UN ${data.unNumber} | gefahrgut.org`)
  const description = $derived(firstEntry
    ? `UN ${data.unNumber} ${name}: Klasse ${firstEntry.hazardClass ?? '–'}${firstEntry.packingGroup ? `, Verpackungsgruppe ${firstEntry.packingGroup}` : ''} – Vergleich von ADR, RID, IMDG und ICAO auf gefahrgut.org.`
    : `UN ${data.unNumber} – Vergleich von ADR, RID, IMDG und ICAO auf gefahrgut.org.`)
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={`${SITE_URL}/un/${data.unNumber}`} />
</svelte:head>

<div class="min-h-screen bg-[#e8eef5] py-8">
  <div class="max-w-5xl mx-auto px-4">
    <a href={resolve('/(app)/dashboard')} class="inline-block mb-4 text-sm text-[#5a7a99] hover:text-orange-500 font-mono">
      ← zurück
    </a>
    {#key data.unNumber}
      {#if data.locked && data.compareData}
        <MultimodalTool demo />
      {:else if data.locked}
        <div class="space-y-4">
          <LockNotice />
          <p class="text-sm text-[#5a7a99]">
            Die Demo findest du unter <a href={resolve('/(app)/un/[nummer]', { nummer: '1203' })} class="underline hover:text-orange-500">UN 1203</a>.
          </p>
        </div>
      {:else}
        <MultimodalTool unNumber={data.unNumber} initialData={data.compareData ?? undefined} supabase={data.supabase} />
      {/if}
    {/key}
  </div>
</div>
