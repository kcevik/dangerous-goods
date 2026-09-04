<script lang="ts">
  import { resolve } from '$app/paths'

  let { children } = $props()
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center px-4 py-12" style="background: #0f2744;">
  <a href={resolve('/')} class="flex items-center gap-2 mb-8">
    <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <span class="font-bold text-lg text-white">gefahrgut<span style="color: #f97316;">.org</span></span>
  </a>

  <div class="w-full max-w-md rounded-2xl bg-white shadow-xl px-8 py-10">
    {@render children()}
  </div>
</div>
