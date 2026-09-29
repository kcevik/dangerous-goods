<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { untrack } from 'svelte'
  import { AuthFormState } from '$lib/auth/authForm.svelte'
  import { AUTH_MESSAGES } from '$lib/auth/messages'
  import { PRIVACY_URL } from '$lib/legal'
  import type { AuthErrorCode } from '$lib/server/authValidation'
  import { LAUNCH_CONSENT_TEXT } from './consent'
  import { LAUNCH_HEADING, LAUNCH_INTRO, LAUNCH_THANKS } from './copy'

  let { form }: { form: { notified?: boolean, error?: AuthErrorCode, email?: string } | null } = $props()

  // created once; a no-JS round trip returns the typed email in `form`
  const formState = untrack(() => {
    const f = new AuthFormState('notify')
    f.email = form?.email ?? ''
    return f
  })
  const message = $derived(form?.error ? AUTH_MESSAGES[form.error] : null)
</script>

{#if form?.notified}
  <div role="status">
    <div class="text-4xl mb-4">🔔</div>
    <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">{LAUNCH_HEADING}</h1>
    <p class="text-sm text-slate-500">{LAUNCH_THANKS}</p>
  </div>
{:else}
  <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">{LAUNCH_HEADING}</h1>
  <p class="text-sm text-slate-500 mb-6">{LAUNCH_INTRO}</p>

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

    <!-- honeypot: invisible to people and screen readers, filled by bots -->
    <div aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label for="website">Bitte leer lassen</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <label class="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" name="consent" bind:checked={formState.consent} required class="mt-1 w-4 h-4 accent-orange-500" />
      <span class="text-xs text-slate-500 leading-relaxed">
        {LAUNCH_CONSENT_TEXT} Details in der <a href={PRIVACY_URL} class="underline hover:text-[#0f2744]">Datenschutzerklärung</a>.
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
      {formState.status === 'submitting' ? 'Wird eingetragen …' : 'Benachrichtigen'}
    </button>
  </form>

  <p class="mt-6 text-sm text-slate-500">
    Schon ein Konto? <a href={resolve('/(auth)/login')} class="font-semibold underline" style="color: #0f2744;">Anmelden</a>
  </p>
{/if}
