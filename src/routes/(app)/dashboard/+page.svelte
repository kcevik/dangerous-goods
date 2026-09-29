<script lang="ts">
  import { resolve } from '$app/paths'
  import LockNotice from '$lib/auth/LockNotice.svelte'

  let { data } = $props()

  // `href: null` = announced but not built yet (Regelwerksvergleich = F-10).
  const tools = [
    { title: 'Stoffsuche', description: 'UN-Nummer oder Stoffname suchen und alle Regelwerke vergleichen.', href: resolve('/(app)/suche') },
    { title: 'Regelwerksvergleich', description: 'ADR, RID, IMDG und ICAO nebeneinander – Abweichungen auf einen Blick.', href: null },
  ]

  const upcoming = ['1000-Punkte-Rechner', 'Dokumentengenerator', 'LQ/EQ-Rechner', 'Transportmodus-Assistent']
</script>

<svelte:head>
  <title>Dashboard – gefahrgut.org</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-10">
  <h1 class="text-2xl font-bold mb-1" style="color: #0f2744;">Willkommen</h1>
  <p class="text-sm text-[#5a7a99] mb-8">
    {data.user?.email} · Status:
    <span class="font-semibold" style="color: #0f2744;">{data.isActive ? 'Freigeschaltet' : 'Noch nicht freigeschaltet'}</span>
  </p>

  {#if !data.isActive}
    <div class="mb-8"><LockNotice /></div>
  {/if}

  <div class="grid sm:grid-cols-2 gap-4 mb-10">
    {#each tools as tool (tool.title)}
      {#if tool.href}
        <a href={tool.href} class="block rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg hover:border-orange-300 transition-all">
          <h2 class="font-semibold text-lg mb-1" style="color: #0f2744;">{tool.title}</h2>
          <p class="text-sm text-slate-500">{tool.description}</p>
        </a>
      {:else}
        <div class="rounded-2xl bg-slate-100 border border-slate-200 p-6 cursor-not-allowed select-none" aria-disabled="true">
          <div class="flex items-center justify-between gap-3 mb-1">
            <h2 class="font-semibold text-lg text-slate-400">{tool.title}</h2>
            <span class="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Demnächst verfügbar</span>
          </div>
          <p class="text-sm text-slate-400">{tool.description}</p>
        </div>
      {/if}
    {/each}
  </div>

  <h2 class="font-mono text-[10px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-3">In Vorbereitung</h2>
  <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each upcoming as name (name)}
      <div class="rounded-2xl bg-white/60 border border-dashed border-slate-300 p-5 text-slate-400">
        <div class="font-semibold text-sm" style="color: #5a7a99;">{name}</div>
        <div class="text-xs mt-1">in Vorbereitung</div>
      </div>
    {/each}
  </div>
</div>
