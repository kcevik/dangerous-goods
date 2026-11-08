<script lang="ts">
  import { resolve } from '$app/paths'
  import LegalLinks from '$lib/legalPages/LegalLinks.svelte'

  let { children } = $props()
</script>

<div class="min-h-screen flex flex-col bg-white">
  <header class="border-b border-slate-200">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center">
      <a href={resolve('/')} class="font-bold text-base text-[#0f2744]">gefahrgut<span class="text-orange-500">.org</span></a>
    </div>
  </header>

  <main class="flex-1 px-4 py-10">
    {@render children()}
  </main>

  <footer class="border-t border-slate-200 py-6 px-4">
    <LegalLinks />
  </footer>
</div>
