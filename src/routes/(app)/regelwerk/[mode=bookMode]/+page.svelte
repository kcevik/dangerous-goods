<script lang="ts">
  import { resolve } from '$app/paths'
  import LockNotice from '$lib/auth/LockNotice.svelte'
  import BookViewer from '$lib/regulations/BookViewer.svelte'
  import { createBookFetchers } from '$lib/regulations/bookFetch'
  import { getBookLabel } from '$lib/regulations/bookTypes'

  let { data } = $props()
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
  <!-- a new load (another link into the book) starts a fresh viewer -->
  {#key data}
    <BookViewer {data} deps={createBookFetchers(resolve('/(app)/regelwerk/[mode=bookMode]', { mode: data.mode }))} />
  {/key}
{/if}
