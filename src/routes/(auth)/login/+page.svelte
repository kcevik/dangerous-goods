<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { untrack } from 'svelte'
  import { AuthFormState } from '$lib/auth/authForm.svelte'
  import { AUTH_MESSAGES } from '$lib/auth/messages'

  let { data, form } = $props()

  // created once; a no-JS round trip returns the typed email in `form`
  const formState = untrack(() => {
    const f = new AuthFormState('login')
    f.email = form?.email ?? ''
    return f
  })
  const message = $derived(form?.error ? AUTH_MESSAGES[form.error] : null)
</script>

<svelte:head>
  <title>Anmelden – gefahrgut.org</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">Anmelden</h1>
<p class="text-sm text-slate-500 mb-6">Willkommen zurück.</p>

<form
  method="POST"
  novalidate
  class="space-y-4"
  use:enhance={() => {
    formState.status = 'submitting'
    return async ({ update }) => {
      await update()
      formState.status = 'idle'
    }
  }}
>
  <input type="hidden" name="next" value={data.next} />

  <div>
    <label for="email" class="block text-xs font-semibold text-slate-600 mb-1">E-Mail-Adresse</label>
    <input
      id="email"
      name="email"
      type="email"
      autocomplete="email"
      required
      bind:value={formState.email}
      class="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>

  <div>
    <label for="password" class="block text-xs font-semibold text-slate-600 mb-1">Passwort</label>
    <input
      id="password"
      name="password"
      type="password"
      autocomplete="current-password"
      required
      bind:value={formState.password}
      class="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>

  {#if message}
    <p role="alert" class="text-sm text-red-600">{message}</p>
  {/if}

  <button
    type="submit"
    disabled={formState.status === 'submitting'}
    class="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-150 enabled:hover:shadow-xl enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
    style="background: #f97316;"
  >
    {formState.status === 'submitting' ? 'Wird angemeldet …' : 'Anmelden'}
  </button>
</form>

<div class="mt-6 flex flex-col gap-2 text-sm text-slate-500">
  <a href={resolve('/(auth)/passwort-vergessen')} class="hover:text-[#0f2744] underline">Passwort vergessen?</a>
  <span>Noch kein Konto? <a href={resolve('/(auth)/registrieren')} class="font-semibold underline" style="color: #0f2744;">Registrieren</a></span>
</div>
