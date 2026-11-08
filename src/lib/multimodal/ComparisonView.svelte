<script lang="ts">
  import { untrack } from 'svelte'
  import ComparisonLegend from './ComparisonLegend.svelte'
  import ComparisonTable from './ComparisonTable.svelte'
  import { ComparisonViewState } from './comparisonView.svelte'
  import { type Entry, LANGS } from './types'
  import VariantPicker from './VariantPicker.svelte'

  interface Props {
    unNumber: string
    data: Record<string, Entry[]>
    /** UN Model Regulations rows for the grey reference column */
    reference?: Entry[]
    /** locked preview with DEMO_DATA */
    demo?: boolean
  }

  let { unNumber, data, reference = [], demo = false }: Props = $props()

  // the page re-mounts this component per UN number ({#key}), so the data is captured once
  const view = untrack(() => new ComparisonViewState(data, reference))
</script>

<div class="space-y-3">
  <div class="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 bg-[#f4f7fa] border border-[#c8d6e5] border-t-[3px] border-t-orange-500">
    <div class="min-w-0">
      <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99]">
        {view.L('compareTitle')}{#if demo}<span class="ml-2 px-1.5 py-0.5 bg-orange-500 text-black">DEMO</span>{/if}
      </div>
      <h1 class="font-mono text-2xl font-bold text-orange-500 mt-1">UN {unNumber}</h1>
      {#if view.title.primary}
        <p class="text-sm font-semibold text-[#0f2744]">{view.title.primary}</p>
      {/if}
      {#if view.title.others.length > 0}
        <p class="text-xs text-[#5a7a99]">{view.title.others.join(' · ')}</p>
      {/if}
    </div>
    <div class="flex overflow-hidden border-[1.5px] border-[#b0c4d8]">
      {#each LANGS as lang (lang)}
        <button
          type="button"
          aria-pressed={view.currentLang === lang}
          class={['px-3 py-1.5 font-mono text-[11px] font-bold transition-colors', view.currentLang === lang ? 'bg-[#0f2744] text-white' : 'bg-[#dce8f2] text-[#5a7a99] hover:text-[#0f2744]']}
          onclick={() => view.setLang(lang)}
        >{lang.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  {#if !view.anchorMode}
    <p role="status" class="bg-[#f4f7fa] border border-[#b0c4d8] p-6 text-sm text-[#2d5070]">{view.L('noEntries')}</p>
  {:else}
    {@const anchor = view.anchorMode}
    {#if view.anchorVariants.length > 1}
      <div class="px-4 py-3 bg-[#f4f7fa] border border-[#b0c4d8]">
        <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2">{view.L('variant')} · {anchor}</div>
        <VariantPicker
          variants={view.anchorVariants}
          selected={view.selectedVariantIndex}
          label={v => view.labelOf(v, anchor)}
          ariaLabel={view.L('variant')}
          onselect={i => view.selectVariant(i)}
        />
      </div>
    {/if}

    {#each view.pickModes as mode (mode)}
      <div class="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <p class="mb-2">{(view.overrides[mode] != null ? view.L('manualVariant') : view.L('noVariantMatch')).replace('{mode}', mode)}</p>
        <VariantPicker
          tone="amber"
          variants={view.variantsByMode[mode] ?? []}
          selected={view.overrides[mode]}
          label={v => view.labelOf(v, mode)}
          ariaLabel={`${view.L('variant')} (${mode})`}
          onselect={i => view.overrideVariant(mode, i)}
        />
      </div>
    {/each}

    <div
      data-testid="deviation-summary"
      role="status"
      class={['border p-3 text-sm', view.deviations.length > 0 ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-[#c8d6e5] bg-[#f4f7fa] text-[#2d5070]']}
    >
      {#if view.comparedModes.length < 2 && view.unresolvedModes.length === 0}
        {view.L('nothingToCompare')}
      {:else if view.deviations.length === 0}
        {#if view.unresolvedModes.length === 0}
          {view.L('noDeviations')}
        {:else if view.comparedModes.length >= 2}
          {view.L('noDeviationsBetween').replace('{modes}', view.joinModes(view.comparedModes))}
        {/if}
      {:else}
        <p class="font-semibold mb-1">{view.L('deviationsTitle')}</p>
        <ul class="space-y-0.5">
          {#each view.deviations as row (row.field)}
            <li>{view.L(row.labelKey)}: <span class="font-mono">{view.deviationText(row)}</span></li>
          {/each}
        </ul>
      {/if}
      {#if view.unresolvedModes.length > 0}
        <p class="mt-1">{view.L('uncomparedModes').replace('{modes}', view.joinModes(view.unresolvedModes))}</p>
      {/if}
    </div>

    <label class="inline-flex items-center gap-2 text-sm text-[#2d5070]">
      <input type="checkbox" bind:checked={view.onlyDifferences} class="accent-orange-500" />
      {view.L('onlyDifferences')}
    </label>

    <ComparisonTable {view} />
    <ComparisonLegend {view} />
  {/if}
</div>
