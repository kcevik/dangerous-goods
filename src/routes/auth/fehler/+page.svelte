<script lang="ts">
  import { resolve } from '$app/paths'
</script>

<svelte:head>
  <title>Link ungültig – gefahrgut.org</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4" style="background: #0f2744;">
  <div class="w-full max-w-md rounded-2xl bg-white shadow-xl px-8 py-10 text-center">
    <div class="text-4xl mb-4">⚠️</div>
    <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">Der Link ist ungültig oder abgelaufen.</h1>
    <p class="text-sm text-slate-500 mb-6">Fordere einen neuen Link an oder melde dich an.</p>
    <div class="flex flex-col gap-3">
      <a href={resolve('/(auth)/passwort-vergessen')} class="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white" style="background: #f97316;">Neuen Link anfordern</a>
      <a href={resolve('/(auth)/login')} class="text-sm underline text-slate-500 hover:text-[#0f2744]">Zur Anmeldung</a>
    </div>
  </div>
</div>
