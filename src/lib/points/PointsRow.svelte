<script lang="ts">
  import { resolve } from '$app/paths'
  import { variantLabel } from '$lib/multimodal/variants'
  import { formatPoints, type Unit, UNIT_LABELS, UNITS, unitHint } from './points'
  import type { PointsCalculatorState, PointsRowState } from './pointsCalculator.svelte'

  interface Props {
    calc: PointsCalculatorState
    row: PointsRowState
    index: number
  }

  let { calc, row, index }: Props = $props()

  const result = $derived(row.result)
  const entry = $derived(result.entry)
  const hint = $derived(entry ? unitHint(entry) : null)
  const name = $derived(entry ? entry.name ?? entry.nameEn ?? '' : '')
  const isProblem = $derived(['lookupFailed', 'forbidden', 'category0'].includes(result.status))
  const isWarning = $derived(['noCategory', 'needsVariant', 'notFound', 'invalidUn', 'invalidQuantity', 'needsQuantity', 'notSubject'].includes(result.status))
  const inputId = $derived(`pos-${row.id}`)

  function onUnitChange(event: Event & { currentTarget: HTMLSelectElement }) {
    row.unit = event.currentTarget.value as Unit
  }

  function onVariantChange(event: Event & { currentTarget: HTMLSelectElement }) {
    row.variantKey = event.currentTarget.value || null
  }
</script>

<li class="rounded-xl border border-[#c8d6e5] bg-white p-3 sm:p-4" data-testid="points-row">
  <div class="flex items-center justify-between gap-2 mb-2">
    <h3 class="text-sm font-semibold text-[#0f2744]">Position {index + 1}</h3>
    <button
      type="button"
      class="inline-flex items-center justify-center min-h-11 min-w-11 -mr-2 rounded-lg text-sm text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
      aria-label="Position {index + 1} entfernen"
      onclick={() => calc.removeRow(row.id)}
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-[7rem_minmax(0,1fr)_11rem] gap-3">
    <div class="min-w-0">
      <label for="{inputId}-un" class="block text-xs font-medium text-[#5a7a99] mb-1">UN-Nummer</label>
      <input
        id="{inputId}-un"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        maxlength="4"
        placeholder="z. B. 1203"
        value={row.un}
        oninput={e => calc.setUn(row, e.currentTarget.value)}
        class="w-full min-h-11 px-3 rounded-lg border border-[#b0c4d8] bg-white text-base font-mono text-[#0f2744] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
    <div class="min-w-0">
      <label for="{inputId}-qty" class="block text-xs font-medium text-[#5a7a99] mb-1">Menge</label>
      <input
        id="{inputId}-qty"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        placeholder="z. B. 250"
        value={row.quantity}
        oninput={e => (row.quantity = e.currentTarget.value)}
        class="w-full min-h-11 px-3 rounded-lg border border-[#b0c4d8] bg-white text-base text-[#0f2744] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
    <div class="col-span-2 sm:col-span-1 min-w-0">
      <label for="{inputId}-unit" class="block text-xs font-medium text-[#5a7a99] mb-1">Einheit</label>
      <select
        id="{inputId}-unit"
        value={row.unit}
        onchange={onUnitChange}
        class="w-full min-h-11 px-3 rounded-lg border border-[#b0c4d8] bg-white text-base text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {#each UNITS as unit (unit)}
          <option value={unit}>{UNIT_LABELS[unit]}</option>
        {/each}
      </select>
    </div>
  </div>

  <label class="mt-2 flex items-center gap-3 min-h-11 text-sm text-[#0f2744] cursor-pointer">
    <input
      type="checkbox"
      checked={row.emptyPackaging}
      onchange={e => (row.emptyPackaging = e.currentTarget.checked)}
      class="w-5 h-5 shrink-0 accent-orange-600"
    />
    Leere ungereinigte Verpackung
  </label>

  {#if result.needsChoice}
    <div class="mt-2">
      <label for="{inputId}-variant" class="block text-xs font-medium text-[#5a7a99] mb-1">Eintragung</label>
      <select
        id="{inputId}-variant"
        value={row.variantKey ?? ''}
        onchange={onVariantChange}
        class="w-full min-h-11 px-3 rounded-lg border border-[#b0c4d8] bg-white text-sm text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">Bitte wählen …</option>
        {#each result.variants as variant (variant.key)}
          <option value={variant.key}>{variantLabel(variant, 'de', 'ADR', 'VG')} – BK {variant.representative.transportCategory ?? '–'}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if entry}
    <p class="mt-2 text-sm text-[#0f2744] wrap-anywhere">
      <a
        href={resolve('/(app)/un/[nummer]', { nummer: entry.unNumber })}
        target="_blank"
        rel="noopener"
        class="font-mono font-bold underline underline-offset-2 hover:text-orange-600"
      >UN {entry.unNumber}</a>
      {name}
      <span class="text-[#5a7a99]">· Kl. {entry.hazardClass ?? '–'}{#if entry.packingGroup} · VG {entry.packingGroup}{/if}</span>
    </p>
  {/if}

  {#if hint}
    <p class="mt-1 text-xs text-[#5a7a99]">Menge: {hint}</p>
  {/if}

  <dl class="mt-3 grid grid-cols-3 gap-2 text-center rounded-lg bg-[#f1f5fa] p-2">
    <div>
      <dt class="text-[10px] uppercase tracking-wide text-[#5a7a99]">BK</dt>
      <dd class="font-mono font-bold text-[#0f2744]" data-testid="row-category">
        {#if result.category !== null}
          {result.category}{#if result.sourceCategory !== result.category}<span class="font-normal text-xs">&nbsp;(statt {result.sourceCategory})</span>{/if}
        {:else}–{/if}
      </dd>
    </div>
    <div>
      <dt class="text-[10px] uppercase tracking-wide text-[#5a7a99]">Faktor</dt>
      <dd class="font-mono font-bold text-[#0f2744]">{result.factor ?? '–'}{#if result.footnoteA}<sup>a)</sup>{/if}</dd>
    </div>
    <div>
      <dt class="text-[10px] uppercase tracking-wide text-[#5a7a99]">Punkte</dt>
      <dd class="font-mono font-bold text-[#0f2744]" data-testid="row-points">{result.points === null ? '–' : formatPoints(result.points)}</dd>
    </div>
  </dl>

  {#if result.footnoteA}
    <p class="mt-1 text-xs text-[#5a7a99]">a) Fußnote zu 1.1.3.6.3: Faktor 20, allein höchstens 50 kg je Beförderungseinheit.</p>
  {/if}

  {#if result.message && result.status !== 'loading'}
    <p
      role={isProblem ? 'alert' : undefined}
      class={[
        'mt-2 rounded-lg px-3 py-2 text-sm',
        isProblem && 'bg-red-50 text-red-800',
        isWarning && 'bg-amber-50 text-amber-900',
      ]}
    >
      {result.message}
      {#if result.status === 'lookupFailed'}
        <button type="button" class="ml-1 min-h-11 underline font-semibold cursor-pointer" onclick={() => calc.retry(row)}>Erneut versuchen</button>
      {/if}
    </p>
  {:else if result.status === 'loading'}
    <p class="mt-2 text-sm text-[#5a7a99]" aria-live="polite">Wird geladen …</p>
  {/if}
</li>
