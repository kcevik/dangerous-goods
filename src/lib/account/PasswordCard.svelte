<script lang="ts">
  import { enhance } from '$app/forms'
  import { PasswordChangeState } from './accountForms.svelte'
  import { ACCOUNT_MESSAGES, ACCOUNT_SUCCESS, type AccountErrorCode } from './messages'

  let { result }: { result: { error?: AccountErrorCode, success?: boolean } | null } = $props()

  const formState = new PasswordChangeState()
  const message = $derived(result?.error ? ACCOUNT_MESSAGES[result.error] : null)
  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-orange-500'
</script>

<section aria-labelledby="password-heading" class="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
  <h2 id="password-heading" class="font-semibold text-lg mb-1 text-[#0f2744]">Passwort ändern</h2>
  <p class="text-sm text-slate-500 mb-4">Zur Sicherheit brauchen wir dein aktuelles Passwort. Das neue muss mindestens 10 Zeichen lang sein.</p>

  <form
    method="POST"
    action="?/password"
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
      <label for="pw-current" class="block text-xs font-semibold text-slate-600 mb-1">Aktuelles Passwort</label>
      <input id="pw-current" name="currentPassword" type="password" autocomplete="current-password" required bind:value={formState.currentPassword} class={inputClass} />
    </div>
    <div>
      <label for="pw-new" class="block text-xs font-semibold text-slate-600 mb-1">Neues Passwort</label>
      <input id="pw-new" name="newPassword" type="password" autocomplete="new-password" minlength="10" required bind:value={formState.newPassword} class={inputClass} />
    </div>
    <div>
      <label for="pw-repeat" class="block text-xs font-semibold text-slate-600 mb-1">Neues Passwort wiederholen</label>
      <input id="pw-repeat" name="newPasswordRepeat" type="password" autocomplete="new-password" required bind:value={formState.newPasswordRepeat} class={inputClass} />
    </div>

    {#if message}
      <p role="alert" class="text-sm text-red-600">{message}</p>
    {:else if result?.success}
      <p role="status" class="text-sm text-green-700">{ACCOUNT_SUCCESS.password}</p>
    {/if}

    <button
      type="submit"
      disabled={!formState.canSubmit}
      class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#f97316] transition-all duration-150 enabled:hover:shadow-lg enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {formState.status === 'submitting' ? 'Wird gespeichert …' : 'Passwort ändern'}
    </button>
  </form>
</section>
