<script lang="ts">
  import { resolve } from '$app/paths'
  import LockNotice from '$lib/auth/LockNotice.svelte'
  import BookViewer from '$lib/regulations/BookViewer.svelte'
  import { createBookFetchers } from '$lib/regulations/bookFetch'
  import { getBookLabel } from '$lib/regulations/bookTypes'

  let { data } = $props()

  /**
   * What makes this a different book view: only fields this page's own load
   * derives from the URL. Keying on `data` itself remounted the viewer whenever
   * the root layout reran (the Supabase client refreshes its token about once an
   * hour → `invalidate('supabase:auth')` → a new merged `data` object), throwing
   * away loaded windows, search term and position.
   */
  const viewKey = $derived(data.locked
    ? ''
    : JSON.stringify([data.mode, data.target, data.includeIncidental, data.currentIndex, data.focusLine]))
</script>

<svelte:head>
  <title>{getBookLabel('de', 'bookTitle')} – gefahrgut.org</title>
</svelte:head>

{#if data.locked}
  <div class="max-w-3xl mx-auto px-4 py-10 space-y-4">
    <LockNotice />
    <p class="text-sm text-[#5a7a99]">{getBookLabel('de', 'lockedNotice')}</p>
  </div>
{:else}
  <!-- another link into the book starts a fresh viewer; a layout-only rerun does not -->
  {#key viewKey}
    <BookViewer {data} deps={createBookFetchers(resolve('/(app)/regelwerk/[mode=bookMode]', { mode: data.mode }))} />
  {/key}
{/if}
