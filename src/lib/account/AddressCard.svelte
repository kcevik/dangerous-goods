<script lang="ts">
  import { enhance } from '$app/forms'
  import { untrack } from 'svelte'
  import type { AddressErrorCode } from '$lib/server/accountValidation'
  import { AddressFormState } from './accountForms.svelte'
  import { type AddressField, type AddressValues, type BillingAddress, toValues } from './address'
  import { COUNTRIES } from './countries'
  import { ACCOUNT_MESSAGES, ACCOUNT_SUCCESS, ADDRESS_ERROR_MESSAGES, type AccountErrorCode } from './messages'

  interface AddressResult {
    error?: AccountErrorCode
    success?: boolean
    fieldErrors?: Partial<Record<AddressField, AddressErrorCode>>
    values?: AddressValues
  }

  let { address, failed, result }: { address: BillingAddress | null, failed: boolean, result: AddressResult | null } = $props()

  // created once; a failed no-JS round trip brings the typed values back in `result`
  const formState = untrack(() => new AddressFormState(result?.values ?? toValues(address)))
  const message = $derived(result?.error ? ACCOUNT_MESSAGES[result.error] : null)
  const fieldError = (field: AddressField): string | null => {
    const code = result?.fieldErrors?.[field]
    return code ? ADDRESS_ERROR_MESSAGES[code] : null
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] bg-white focus:outline-none focus:ring-2 focus:ring-orange-500'
</script>

{#snippet field(name: AddressField, label: string, autocomplete: AutoFill, required: boolean, hint: string | null = null)}
  {@const error = fieldError(name)}
  <div>
    <label for={`addr-${name}`} class="block text-xs font-semibold text-slate-600 mb-1">{required ? label : `${label} `}{#if !required}<span class="font-normal text-slate-400">(optional)</span>{/if}</label>
    <input
      id={`addr-${name}`}
      {name}
      type="text"
      {autocomplete}
      {required}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `addr-${name}-error` : hint ? `addr-${name}-hint` : undefined}
      bind:value={formState.values[name]}
      class={[inputClass, error && 'border-red-400']}
    />
    {#if error}
      <p id={`addr-${name}-error`} class="mt-1 text-xs text-red-600">{error}</p>
    {:else if hint}
      <p id={`addr-${name}-hint`} class="mt-1 text-xs text-slate-400">{hint}</p>
    {/if}
  </div>
{/snippet}

<section aria-labelledby="address-heading" class="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
  <h2 id="address-heading" class="font-semibold text-lg mb-1 text-[#0f2744]">Rechnungsanschrift</h2>
  <p class="text-sm text-slate-500 mb-4">Für Privat- und Geschäftskunden. Wir brauchen sie später für deine Rechnungen.</p>

  {#if failed}
    <p role="alert" class="text-sm text-red-600">Deine gespeicherte Anschrift konnte nicht geladen werden. Bitte lade die Seite neu.</p>
  {:else}
    <form
      method="POST"
      action="?/address"
      novalidate
      class="space-y-4"
      use:enhance={() => {
        formState.status = 'submitting'
        return async ({ update }) => {
          await update({ reset: false })
          formState.status = 'idle'
        }
      }}
    >
      {@render field('company', 'Firma', 'organization', false)}
      <div class="grid gap-4 sm:grid-cols-2">
        {@render field('firstName', 'Vorname', 'given-name', true)}
        {@render field('lastName', 'Nachname', 'family-name', true)}
      </div>
      {@render field('street', 'Straße und Hausnummer', 'street-address', true)}
      <div class="grid gap-4 sm:grid-cols-[10rem_1fr]">
        {@render field('postalCode', 'PLZ', 'postal-code', true, formState.postalCodeHint)}
        {@render field('city', 'Ort', 'address-level2', true)}
      </div>
      <div>
        <label for="addr-country" class="block text-xs font-semibold text-slate-600 mb-1">Land</label>
        <select id="addr-country" name="country" autocomplete="country" bind:value={formState.values.country} class={inputClass}>
          {#each COUNTRIES as country (country.code)}
            <option value={country.code}>{country.name}</option>
          {/each}
        </select>
        {#if fieldError('country')}
          <p class="mt-1 text-xs text-red-600">{fieldError('country')}</p>
        {/if}
      </div>
      {#if formState.isBusiness || formState.values.vatId}
        {@render field('vatId', 'USt-IdNr.', 'off', false, 'Nur für Unternehmen, z. B. DE123456789')}
      {/if}

      {#if message}
        <p role="alert" class="text-sm text-red-600">{message}</p>
      {:else if result?.fieldErrors}
        <p role="alert" class="text-sm text-red-600">Bitte prüfe die markierten Felder.</p>
      {:else if result?.success}
        <p role="status" class="text-sm text-green-700">{ACCOUNT_SUCCESS.address}</p>
      {/if}

      <button
        type="submit"
        disabled={!formState.canSubmit}
        class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#f97316] transition-all duration-150 enabled:hover:shadow-lg enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {formState.status === 'submitting' ? 'Wird gespeichert …' : 'Anschrift speichern'}
      </button>
    </form>
  {/if}
</section>
