<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { untrack } from 'svelte'
  import { AuthFormState } from '$lib/auth/authForm.svelte'
  import { AUTH_MESSAGES } from '$lib/auth/messages'

  let { form } = $props()

  // created once; a no-JS round trip returns the typed email in `form`
  const formState = untrack(() => {
    const f = new AuthFormState('register')
    f.email = form?.email ?? ''
    return f
  })
  const message = $derived(form?.error ? AUTH_MESSAGES[form.error] : null)
</script>

<svelte:head>
  <title>Registrieren – gefahrgut.org</title>
</svelte:head>

{#if form?.sent}
  <div role="status">
    <div class="text-4xl mb-4">✉️</div>
    <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">Bestätige deine E-Mail-Adresse</h1>
    <p class="text-sm text-slate-500">
      Wir haben dir einen Bestätigungslink geschickt. Öffne die E-Mail und klicke auf den Link, um dein Konto zu aktivieren.
    </p>
  </div>
{:else}
  <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">Konto erstellen</h1>
  <p class="text-sm text-slate-500 mb-6">Sieh dir die Plattform an – die Demo ist sofort verfügbar.</p>

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

    <div>
      <label for="password" class="block text-xs font-semibold text-slate-600 mb-1">Passwort (mindestens 10 Zeichen)</label>
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

    <label class="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" name="consent" bind:checked={formState.consent} required class="mt-1 w-4 h-4 accent-orange-500" />
      <span class="text-xs text-slate-500 leading-relaxed">
        Ich habe die <a href="https://gefahrgut.org/datenschutz" class="underline hover:text-[#0f2744]">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zu.
      </span>
    </label>

    {#if message}
      <p role="alert" class="text-sm text-red-600">{message}</p>
    {/if}

    <button
      type="submit"
      disabled={formState.status === 'submitting'}
      class="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-150 enabled:hover:shadow-xl enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style="background: #f97316;"
    >
      {formState.status === 'submitting' ? 'Wird erstellt …' : 'Konto erstellen'}
    </button>
  </form>

  <p class="mt-6 text-sm text-slate-500">
    Schon registriert? <a href={resolve('/(auth)/login')} class="font-semibold underline" style="color: #0f2744;">Anmelden</a>
  </p>
{/if}
