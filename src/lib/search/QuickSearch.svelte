<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { goto } from '$app/navigation'
  import { untrack } from 'svelte'
  import { SearchState } from './search.svelte'

  interface Props {
    supabase: SupabaseClient
    /** where a UN number leads, e.g. its comparison page */
    hrefFor: (unNumber: string) => string
    /** accessible name of the field */
    label?: string
  }

  let { supabase, hrefFor, label = 'UN-Nummer oder Stoffname suchen' }: Props = $props()

  // only active accounts get this component, so the search is never locked here
  const search = untrack(() => new SearchState(supabase))

  /** the UN number Enter jumps to: a typed 4-digit number, or the only hit */
  const target = $derived(search.selectedUn ?? (search.results.length === 1 ? search.results[0]!.unNumber : null))

  /** a jump to the same route keeps this component mounted, so it must close itself */
  function close() {
    search.query = ''
  }

  function onsubmit(event: SubmitEvent) {
    event.preventDefault()
    if (!target) return
    const href = hrefFor(target)
    close()
    void goto(href)
  }
</script>

<form role="search" class="relative" {onsubmit}>
  <input
    bind:value={search.query}
    type="search"
    placeholder="UN-Nummer oder Stoffname …"
    aria-label={label}
    autocomplete="off"
    class="w-full px-3.5 py-2.5 rounded-lg text-sm border border-[#b0c4d8] bg-white text-[#0f2744] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 [&::-webkit-search-cancel-button]:hidden"
  />

  {#if search.selectedUn}
    <div class="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-[#c8d6e5] bg-white shadow-lg">
      <a href={hrefFor(search.selectedUn)} onclick={close} class="block px-4 py-3 text-sm font-mono font-bold text-[#0f2744] hover:bg-orange-50 hover:text-orange-600">
        UN {search.selectedUn} →
      </a>
    </div>
  {:else if !search.belowMinimum && (search.results.length > 0 || search.searchError || search.answered)}
    <div class="absolute left-0 right-0 top-full mt-1 z-30 max-h-80 overflow-y-auto rounded-lg border border-[#c8d6e5] bg-white shadow-lg">
      {#if search.searchError}
        <div role="alert" class="px-4 py-3 text-sm text-red-800 bg-red-50">
          Die Suche ist fehlgeschlagen.
          <button type="button" class="ml-2 underline" onclick={() => search.retry()}>Erneut versuchen</button>
        </div>
      {:else if search.results.length > 0}
        <ul>
          {#each search.results as r (r.unNumber)}
            <li>
              <a href={hrefFor(r.unNumber)} onclick={close} class="block px-4 py-2.5 hover:bg-orange-50 border-t border-slate-100 first:border-t-0">
                <span class="font-mono text-sm font-bold text-[#0f2744]">UN {r.unNumber}</span>
                <span class="ml-2 text-sm text-[#2d5070]">{r.primaryName}</span>
                {#if r.hazardClass}
                  <span class="ml-2 text-xs text-[#5a7a99]">Kl. {r.hazardClass}</span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="px-4 py-3 text-sm text-[#5a7a99]">Keine Ergebnisse für „{search.query}“</p>
      {/if}
    </div>
  {/if}
</form>
