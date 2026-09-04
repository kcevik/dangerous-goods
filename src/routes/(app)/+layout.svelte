<script lang="ts">
  import { resolve } from '$app/paths'
  import { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'

  let { data, children } = $props()
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-[#e8eef5]">
  <header class="bg-[#0f2744] text-white">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
      <a href={resolve('/(app)/dashboard')} class="font-bold text-base shrink-0">gefahrgut<span style="color: #f97316;">.org</span></a>
      <nav class="flex items-center gap-4 text-sm" aria-label="Hauptnavigation">
        <a href={resolve('/(app)/dashboard')} class="text-slate-300 hover:text-white transition-colors">Dashboard</a>
        <a href={resolve('/(app)/suche')} class="text-slate-300 hover:text-white transition-colors">Suche</a>
      </nav>
      <div class="ml-auto flex items-center gap-4 text-sm">
        <span class="text-slate-400 hidden sm:inline truncate max-w-[220px]">{data.user?.email}</span>
        <form method="POST" action={resolve('/logout')}>
          <button type="submit" class="text-slate-300 hover:text-white transition-colors underline-offset-2 hover:underline">Abmelden</button>
        </form>
      </div>
    </div>
  </header>

  {#if !data.isActive}
    <div class="bg-amber-100 border-b border-amber-300 text-amber-900 text-sm">
      <div class="max-w-5xl mx-auto px-4 py-2.5 flex items-start gap-2">
        <span aria-hidden="true">🔒</span>
        <span>{LOCK_MESSAGE}</span>
      </div>
    </div>
  {/if}

  {@render children()}
</div>
