<script lang="ts">
  import { enhance } from '$app/forms'
  import { DeleteAccountState } from './accountForms.svelte'
  import { ACCOUNT_DELETE_CONFIRM_WORD, ACCOUNT_MESSAGES, type AccountErrorCode } from './messages'

  let { result }: { result: { error?: AccountErrorCode } | null } = $props()

  const formState = new DeleteAccountState()
  const message = $derived(result?.error ? ACCOUNT_MESSAGES[result.error] : null)
  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-red-500'
</script>

<section aria-labelledby="delete-heading" class="rounded-2xl bg-white border border-red-200 p-5 sm:p-6">
  <h2 id="delete-heading" class="font-semibold text-lg mb-1 text-red-700">Konto löschen</h2>
  <p class="text-sm text-slate-600 mb-4">
    Dein Konto, deine Anmeldedaten und deine Rechnungsanschrift werden sofort und endgültig gelöscht.
    Das lässt sich nicht rückgängig machen.
  </p>

  <form
    method="POST"
    action="?/delete"
    novalidate
    class="space-y-4"
    use:enhance={() => {
      formState.status = 'submitting'
      return async ({ update }) => {
        await update()
        formState.reset()
        formState.status = 'idle'
      }
    }}
  >
    <div>
      <label for="del-password" class="block text-xs font-semibold text-slate-600 mb-1">Aktuelles Passwort</label>
      <input id="del-password" name="currentPassword" type="password" autocomplete="current-password" required bind:value={formState.password} class={inputClass} />
    </div>
    <div>
      <label for="del-confirm" class="block text-xs font-semibold text-slate-600 mb-1">Tippe zur Bestätigung <span class="font-mono">{ACCOUNT_DELETE_CONFIRM_WORD}</span> ein</label>
      <input id="del-confirm" name="confirmation" type="text" autocomplete="off" required bind:value={formState.confirmation} class={inputClass} />
    </div>

    {#if message}
      <p role="alert" class="text-sm text-red-600">{message}</p>
    {/if}

    <button
      type="submit"
      disabled={!formState.canSubmit}
      class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 transition-all duration-150 enabled:hover:bg-red-700 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {formState.status === 'submitting' ? 'Wird gelöscht …' : 'Konto endgültig löschen'}
    </button>
  </form>
</section>
