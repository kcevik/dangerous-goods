<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { AuthFormState } from '$lib/auth/authForm.svelte'
  import { AUTH_MESSAGES } from '$lib/auth/messages'

  let { form } = $props()

  const formState = new AuthFormState('reset')
  const message = $derived(form?.error ? AUTH_MESSAGES[form.error] : null)
</script>

<svelte:head>
  <title>Passwort vergessen – gefahrgut.org</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">Passwort vergessen</h1>

{#if form?.sent}
  <p role="status" class="text-sm text-slate-600">Falls ein Konto existiert, haben wir eine E-Mail geschickt.</p>
{:else}
  <p class="text-sm text-slate-500 mb-6">Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.</p>

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
      <label for="email" class="block text-xs font-semibold text-slate-600 mb-1">E-Mail-Adresse</label>
      <input
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        required
        bind:value={formState.email}
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
      {formState.status === 'submitting' ? 'Wird gesendet …' : 'Link anfordern'}
    </button>
  </form>
{/if}

<p class="mt-6 text-sm text-slate-500">
  <a href={resolve('/(auth)/login')} class="underline hover:text-[#0f2744]">Zurück zur Anmeldung</a>
</p>
