<script lang="ts">
  import { resolve } from '$app/paths'
  import LegalLinks from '$lib/legalPages/LegalLinks.svelte'

  let { children } = $props()
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center px-4 py-12" style="background: #0f2744;">
  <a href={resolve('/')} class="flex items-center gap-2 mb-8">
    <img src="/icon.png" alt="" width="32" height="32" class="w-8 h-8 rounded-lg bg-white p-0.5" />
    <span class="font-bold text-lg text-white">gefahrgut<span style="color: #f97316;">.org</span></span>
  </a>

  <div class="w-full max-w-md rounded-2xl bg-white shadow-xl px-5 py-8 sm:px-8 sm:py-10">
    {@render children()}
  </div>

  <div class="mt-6">
    <LegalLinks tone="dark" />
  </div>
</div>
