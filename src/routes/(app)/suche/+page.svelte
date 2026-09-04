<script lang="ts">
  import { resolve } from '$app/paths'
  import { untrack } from 'svelte'
  import LockNotice from '$lib/auth/LockNotice.svelte'
  import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
  import { MIN_QUERY_LENGTH, type SearchResult, SearchState } from '$lib/search/search.svelte'

  let { data } = $props()

  // the layout's Supabase client and activation state are stable for the page's lifetime
  const search = untrack(() => new SearchState(data.supabase, { locked: !data.isActive }))

  const EXAMPLES = [
    { un: '1203', label: 'Benzin' },
    { un: '1090', label: 'Aceton' },
    { un: '2794', label: 'Batterien' },
    { un: '1017', label: 'Chlor' },
  ]

  function displayName(r: SearchResult): string {
    return r.name ?? r.nameEn ?? r.nameFr ?? ''
  }

  const belowMinimum = $derived(search.query.trim().length < MIN_QUERY_LENGTH)
</script>

<svelte:head>
  <title>Suche – gefahrgut.org</title>
</svelte:head>

<div class="min-h-screen bg-[#e8eef5]">
  <!-- Top bar -->
  <div class="bg-[#0f2744] px-4 py-4">
    <div class="max-w-5xl mx-auto flex items-center gap-4">
      <a href={resolve('/(app)/dashboard')} class="text-slate-400 hover:text-white transition-colors text-sm font-mono shrink-0">
        ← zurück
      </a>
      <div class="flex-1 relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <input
          bind:value={search.query}
          {@attach (node) => { node.focus() }}
          type="search"
          placeholder="UN-Nummer oder Stoffname suchen …"
          class="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all [&::-webkit-search-cancel-button]:hidden"
          aria-label="Gefahrgut suchen"
        />
        {#if search.isLoading}
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Content area -->
  <div class="max-w-5xl mx-auto px-4 py-8">

    {#if search.locked}
      <!-- Locked preview: no live queries, only the hardcoded demo -->
      <div class="mb-6"><LockNotice /></div>
      <MultimodalTool demo />
    {:else if belowMinimum}
      <!-- Empty state -->
      <div class="text-center py-16">
        <p class="text-[#5a7a99] text-sm mb-4">Gib eine UN-Nummer oder einen Stoffnamen ein</p>
        <div class="flex flex-wrap justify-center gap-2">
          {#each EXAMPLES as example (example.un)}
            <button
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-mono border border-[#c0cfe0] text-[#5a7a99] hover:border-orange-400 hover:text-orange-500 transition-colors"
              onclick={() => { search.query = example.un }}
            >
              {example.un} · {example.label}
            </button>
          {/each}
        </div>
      </div>
    {:else if search.results.length > 0}
      <!-- Results list -->
      <div class="space-y-2">
        <p class="text-xs text-[#5a7a99] mb-3">{search.results.length} Ergebnisse (ADR)</p>
        {#each search.results as r (r.unNumber)}
          <button
            type="button"
            class="w-full text-left bg-white rounded-xl px-5 py-4 shadow-sm border border-transparent hover:border-orange-300 hover:shadow-md transition-all group"
            onclick={() => search.select(r.unNumber)}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <span class="font-mono font-bold text-[#0f2744] text-sm group-hover:text-orange-600 transition-colors">
                  UN {r.unNumber}
                </span>
                <p class="text-sm text-[#0f2744] mt-0.5 truncate">{displayName(r)}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                {#if r.hazardClass}
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#e8eef5] text-[#0f2744]">
                    Kl. {r.hazardClass}
                  </span>
                {/if}
                {#if r.packingGroup}
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#e8eef5] text-[#5a7a99]">
                    VG {r.packingGroup}
                  </span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {:else if !search.isLoading && !search.selectedUn}
      <!-- No results -->
      <div class="text-center py-16">
        <p class="text-[#5a7a99] text-sm">Keine Ergebnisse für „{search.query}"</p>
      </div>
    {/if}

    <!-- Tool -->
    {#if !search.locked && search.selectedUn}
      <div class="mt-6">
        <MultimodalTool unNumber={search.selectedUn} supabase={data.supabase} />
      </div>
    {/if}

  </div>
</div>
