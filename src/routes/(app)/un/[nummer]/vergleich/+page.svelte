<script lang="ts">
  import { resolve } from '$app/paths'
  import ComparisonView from '$lib/multimodal/ComparisonView.svelte'
  import QuickSearch from '$lib/search/QuickSearch.svelte'
  import { SITE_URL } from '$lib/seo/structuredData'

  let { data } = $props()
</script>

<svelte:head>
  <title>Regelwerksvergleich UN {data.unNumber} | gefahrgut.org</title>
  <meta name="description" content={`UN ${data.unNumber}: ADR, RID, IMDG und ICAO nebeneinander – Abweichungen zwischen den Regelwerken auf einen Blick.`} />
  <link rel="canonical" href={`${SITE_URL}/un/${data.unNumber}/vergleich`} />
</svelte:head>

<div class="min-h-screen bg-[#e8eef5] py-5 sm:py-8">
  <div class="max-w-6xl mx-auto px-4">
    <a href={resolve('/(app)/un/[nummer]', { nummer: data.unNumber })} class="inline-flex min-h-11 items-center mb-2 text-sm text-[#5a7a99] hover:text-orange-500 font-mono">
      ← UN {data.unNumber}
    </a>
    {#if !data.locked}
      <div class="mb-4 w-full sm:max-w-md">
        <QuickSearch
          supabase={data.supabase}
          label="Andere UN-Nummer vergleichen"
          hrefFor={un => resolve('/(app)/un/[nummer]/vergleich', { nummer: un })}
        />
      </div>
    {/if}
    {#key data.unNumber}
      {#if data.compareData}
        <ComparisonView unNumber={data.unNumber} data={data.compareData} reference={data.reference ?? []} demo={data.locked} />
      {:else}
        <div class="space-y-4">
          <p class="text-sm text-[#5a7a99]">
            Der Vergleich für UN {data.unNumber} ist erst nach der Freischaltung verfügbar. Die Demo findest du unter <a href={resolve('/(app)/un/[nummer]/vergleich', { nummer: '1203' })} class="underline hover:text-orange-500">UN 1203</a>.
          </p>
        </div>
      {/if}
    {/key}
  </div>
</div>
