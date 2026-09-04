<script lang="ts">
  import { enhance } from '$app/forms'
  import { AuthFormState } from '$lib/auth/authForm.svelte'
  import { AUTH_MESSAGES } from '$lib/auth/messages'

  let { form } = $props()

  const formState = new AuthFormState('newPassword')
  const message = $derived(form?.error ? AUTH_MESSAGES[form.error] : null)
</script>

<svelte:head>
  <title>Neues Passwort – gefahrgut.org</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">Neues Passwort festlegen</h1>
<p class="text-sm text-slate-500 mb-6">Mindestens 10 Zeichen.</p>

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
  <div>
    <label for="password" class="block text-xs font-semibold text-slate-600 mb-1">Neues Passwort</label>
    <input
      id="password"
      name="password"
      type="password"
      autocomplete="new-password"
      required
      bind:value={formState.password}
      class="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>

  <div>
    <label for="passwordRepeat" class="block text-xs font-semibold text-slate-600 mb-1">Passwort wiederholen</label>
    <input
      id="passwordRepeat"
      name="passwordRepeat"
      type="password"
      autocomplete="new-password"
      required
      bind:value={formState.passwordRepeat}
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
    {formState.status === 'submitting' ? 'Wird gespeichert …' : 'Passwort speichern'}
  </button>
</form>
