<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { untrack } from 'svelte'
  import { resolve } from '$app/paths'
  import { formatBookLabel } from '$lib/regulations/bookTypes'
  import MultimodalSvsAccordion from './MultimodalSvsAccordion.svelte'
  import { MultimodalToolState } from './multimodalTool.svelte'
  import { DEMO_DATA, type Entry, LANGS, type Modal } from './types'

  interface Props {
    /** Use hardcoded UN 1203 demo data (no API needed) */
    demo?: boolean
    /** UN number to show; loaded client-side if `initialData` is absent */
    unNumber?: string
    /** Server-loaded comparison data for `unNumber` */
    initialData?: Record<string, Entry[]>
    supabase?: SupabaseClient
  }

  let { demo = false, unNumber, initialData, supabase }: Props = $props()

  // initial props are captured on purpose: the state object lives for the
  // component's lifetime; later prop changes are handled by the $effect below
  const tool = untrack(() => new MultimodalToolState({
    initialData: demo ? DEMO_DATA : initialData,
    initialUnNumber: demo ? '1203' : (initialData ? unNumber : undefined),
    supabase,
  }))


  // client-side load when the prop changes and nothing was preloaded for it
  $effect(() => {
    if (demo || !unNumber) return
    if (unNumber !== tool.currentUnNumber) tool.loadCompare(unNumber)
  })
</script>

<!-- a mode's own variant buttons: where matching found nothing, and to revise a manual pick -->
{#snippet modePicker(mode: Modal)}
  <div role="group" aria-label={`${tool.L('variant')} (${mode})`} class="flex flex-wrap gap-2">
    {#each tool.variantsByMode[mode] ?? [] as variant, i (variant.key)}
      {@const label = tool.labelOf(variant, mode)}
      <button
        type="button"
        aria-pressed={tool.overrides[mode] === i}
        title={label}
        class={['max-w-full sm:max-w-xs truncate px-2.5 py-1 font-mono text-[11px] font-bold border transition-colors', tool.overrides[mode] === i
          ? 'bg-amber-400 border-amber-500 text-black'
          : 'bg-white border-amber-400 text-[#0f2744] hover:border-orange-500']}
        onclick={() => tool.overrideVariant(mode, i)}
      >{label}</button>
    {/each}
  </div>
{/snippet}

<div class="bg-[#e8eef5] font-sans">
  <div class="max-w-5xl mx-auto">

    <!-- Info banner -->
    <div class="flex items-start gap-3 px-4 py-3 mb-4 text-sm border border-l-4 bg-[#f4f7fa] border-[#c8d6e5] border-l-orange-500">
      <span class="text-xl flex-shrink-0 mt-0.5">🌐</span>
      <span class="text-[#2d5070] leading-relaxed">
        <strong>{tool.L('bannerTitle')}</strong>{tool.L('bannerSub')}
      </span>
      {#if demo}
        <span class="ml-auto flex-shrink-0 font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 bg-orange-500 text-black self-center">
          DEMO
        </span>
      {/if}
    </div>

    <!-- Toolbar: subject + language -->
    <div class="flex flex-wrap items-center gap-2.5 px-4 py-3.5 mb-4 bg-[#f4f7fa] border border-[#c8d6e5] border-t-[3px] border-t-orange-500">
      <!-- the page owns the search; this only names what is shown (owner, 2026-11-08) -->
      <p data-testid="tool-subject" class="flex-1 min-w-[200px] font-mono text-sm font-semibold text-[#0f2744] truncate">{tool.searchDisplay}</p>

      <!-- Language toggle -->
      <div class="flex overflow-hidden border-[1.5px] border-[#b0c4d8]">
        {#each LANGS as lang (lang)}
          <button
            type="button"
            class={['px-3.5 py-2 font-mono text-[11px] font-bold tracking-[0.5px] transition-colors', tool.currentLang === lang
              ? 'bg-orange-500 text-black'
              : 'bg-[#dce8f2] text-[#5a7a99] hover:bg-[#d4e2ef]']}
            onclick={() => tool.setLang(lang)}
          >{lang.toUpperCase()}</button>
        {/each}
      </div>
    </div>

    <!-- Results -->
    {#if tool.loadError}
      <!-- a failed load must never look like "no data for this UN number" -->
      <div role="alert" class="bg-red-50 border border-red-200 p-8 text-center text-red-800">
        <p class="text-sm mb-4">UN {tool.currentUnNumber}: {tool.L('loadError')}</p>
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold border border-red-300 bg-white hover:bg-red-100 transition-colors"
          disabled={tool.isLoading}
          onclick={() => tool.loadCompare(tool.currentUnNumber)}
        >{tool.L('retry')}</button>
      </div>
    {:else if tool.hasData}

      <!-- Variant picker: one choice for all tabs (spec 2026-11-08) -->
      {#if tool.anchorMode && tool.anchorVariants.length > 1}
        {@const anchor = tool.anchorMode}
        <div
          role="group"
          aria-label={tool.L('variant')}
          class="flex flex-wrap items-center gap-2 px-4 py-3 mb-0.5 bg-[#f4f7fa] border border-[#b0c4d8]"
        >
          <span class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mr-1">
            {tool.L('variant')} · {anchor}
          </span>
          {#each tool.anchorVariants as variant, i (variant.key)}
            {@const label = tool.labelOf(variant, anchor)}
            <button
              type="button"
              aria-pressed={tool.selectedVariantIndex === i}
              title={label}
              class={['max-w-full sm:max-w-xs truncate px-2.5 py-1 font-mono text-[11px] font-bold border transition-colors', tool.selectedVariantIndex === i
                ? 'bg-orange-500 border-orange-500 text-black'
                : 'bg-[#dce8f2] border-[#b0c4d8] text-[#0f2744] hover:border-orange-400']}
              onclick={() => tool.selectVariant(i)}
            >{label}</button>
          {/each}
        </div>
      {/if}

      <!-- Compare overview -->
      <div class="px-4 py-3.5 mb-0.5 bg-[#f4f7fa] border border-[#b0c4d8] border-t-[3px] border-t-orange-500">
        <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2.5">
          UN {tool.currentUnNumber} · {tool.L('availability')}
        </div>
        <div class="grid grid-cols-5 gap-2 max-sm:grid-cols-3">
          {#each tool.MODALS as modal (modal)}
            {@const entry = tool.getEntry(modal)}
            {@const rows = tool.hasRows(modal)}
            <div
              data-testid={`overview-${modal}`}
              class={['p-2.5 border bg-[#f4f7fa] transition-all', rows
                ? ['cursor-pointer', 'hover:border-orange-400',
                   modal === tool.currentModal
                     ? 'border-orange-500 border-t-[3px]'
                     : 'border-[#c8d6e5]']
                : ['border-[#c8d6e5]', 'opacity-40']]}
              role="button"
              tabindex={rows ? 0 : -1}
              onclick={() => { if (rows) tool.switchModal(modal) }}
              onkeydown={(e) => { if (rows && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tool.switchModal(modal) } }}
            >
              <div class="font-mono text-[10px] font-bold tracking-[1px] uppercase text-[#5a7a99] mb-1">{modal}</div>
              {#if entry}
                <div class="font-mono text-base font-bold text-[#0f2744]">{entry.hazardClass}</div>
                {#if entry.packingGroup}
                  <div class="font-mono text-[11px] text-[#5a7a99] mt-0.5">
                    {tool.L('pgShort')} {entry.packingGroup}
                  </div>
                {/if}
                {#if entry.kemlerNumber}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    Kemler: {entry.kemlerNumber}
                  </div>
                {:else if entry.ems1}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    EmS: {entry.ems1}
                  </div>
                {:else if entry.packingInstrCargo}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    PI: {entry.packingInstrCargo}
                  </div>
                {:else if entry.cones != null}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    {tool.L('cones')}: {entry.cones}
                  </div>
                {/if}
              {:else if tool.isUnmatched(modal)}
                <div class="font-mono text-base font-bold text-amber-600" title={tool.L('noVariantMatch').replace('{mode}', modal)}>?</div>
              {:else}
                <div class="text-xs italic text-[#b0c4d8]">–</div>
              {/if}
              <div class="text-[10px] text-[#5a7a99] mt-1 leading-tight">{tool.modalDesc(modal)}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Modal tabs -->
      <div class="flex overflow-x-auto border-b-2 border-[#b0c4d8]" role="tablist">
        {#each tool.MODALS as modal (modal)}
          {@const entry = tool.getEntry(modal)}
          {@const rows = tool.hasRows(modal)}
          <button
            type="button"
            class={['flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.5px] whitespace-nowrap mr-0.5 relative top-px border border-b-0 transition-all', modal === tool.currentModal
              ? 'bg-[#f4f7fa] text-[#0f2744] border-[#b0c4d8] border-b-2 border-b-[#f4f7fa]'
              : rows
                ? 'bg-[#dce8f2] text-[#0f2744] border-[#b0c4d8] hover:bg-[#d4e2ef] cursor-pointer'
                : 'bg-[#dce8f2] text-[#5a7a99] border-[#b0c4d8] opacity-40 cursor-default']}
            role="tab"
            aria-selected={modal === tool.currentModal}
            disabled={!rows}
            onclick={() => { if (rows) tool.switchModal(modal) }}
          >
            <span class={['w-1.5 h-1.5 rounded-full', entry ? 'bg-orange-500' : rows ? 'bg-amber-500' : 'bg-[#b0c4d8]']}></span>
            {modal}
          </button>
        {/each}
      </div>

      <!-- Detail panel -->
      <div class="bg-[#f4f7fa] border border-[#b0c4d8] border-t-0 p-5" role="tabpanel">
        {#if tool.currentEntry}
          {@const currentEntry = tool.currentEntry}
          {@const names = tool.variantNames(tool.currentModal)}
          {@const specs = tool.variantSpecs(tool.currentModal)}

          <!-- UN header -->
          <div class="flex flex-wrap items-start gap-3.5 pb-4 mb-4 border-b border-[#c8d6e5]">
            {#if tool.currentModal === 'ADR' && !demo}
              <a
                href={`${resolve('/(app)/regelwerk/[mode=bookMode]', { mode: 'adr' })}?un=${currentEntry.unNumber}`}
                target="_blank"
                rel="noopener"
                title={formatBookLabel(tool.currentLang, 'openUnInBook', { code: currentEntry.unNumber })}
                class="font-mono text-3xl font-bold text-orange-500 leading-none flex-shrink-0 underline decoration-orange-300 decoration-2 underline-offset-4 hover:decoration-orange-500"
              >UN {currentEntry.unNumber}</a>
            {:else}
              <div class="font-mono text-3xl font-bold text-orange-500 leading-none flex-shrink-0">
                UN {currentEntry.unNumber}
              </div>
            {/if}
            <div>
              <div class="text-base font-semibold text-[#0f2744]">{names.primary}</div>
              {#if names.others.length > 0}
                <div class="text-sm text-[#5a7a99] mt-0.5">
                  {names.others.join(' · ')}
                </div>
              {/if}
              {#if specs.length > 0}
                <div class="text-sm italic text-[#2d5070] mt-0.5">
                  {specs.join(' / ')}
                </div>
              {/if}
            </div>
          </div>

          {#if tool.overrides[tool.currentModal] != null}
            <!-- a manual pick stays visible and revisable (review fix) -->
            <div class="border border-amber-300 bg-amber-50 p-3 mb-4 text-sm text-amber-900">
              <p class="mb-2">{tool.L('manualVariant').replace('{mode}', tool.currentModal)}</p>
              {@render modePicker(tool.currentModal)}
            </div>
          {/if}

          <!-- Fields table -->
          <table class="w-full text-sm border-collapse">
            <tbody>
              {#if currentEntry.hazardClass}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('class')}</td>
                  <td class="field-value">
                    <span class="badge bg-[#0f2744] text-white">{currentEntry.hazardClass}</span>
                  </td>
                </tr>
              {/if}
              {#if currentEntry.classificationCode}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('classCode')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.classificationCode}</span></td>
                </tr>
              {/if}
              {#if currentEntry.packingGroup}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('packingGroup')}</td>
                  <td class="field-value">
                    <span class="badge bg-[#1e3a5f] text-blue-200">{tool.L('pgShort')} {currentEntry.packingGroup}</span>
                  </td>
                </tr>
              {/if}
              {#if currentEntry.hazardLabels}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('labels')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.hazardLabels}</span></td>
                </tr>
              {/if}
              {#if currentEntry.exceptedQty}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('exceptedQty')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.exceptedQty}</span></td>
                </tr>
              {/if}
              {#if currentEntry.limitedQty}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('limitedQty')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.limitedQty}</span></td>
                </tr>
              {/if}
              {#if currentEntry.packingInstructions}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('packingInstr')}</td>
                  <td class="field-value">
                    {#each currentEntry.packingInstructions.split(',') as p (p)}
                      <span class="badge bg-[#1e3a5f] text-blue-200 mr-0.5">{p.trim()}</span>
                    {/each}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.transportCategory != null && currentEntry.transportCategory !== ''}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('transportCat')}</td>
                  <td class="field-value">
                    <span class={['badge', tool.bkClass(currentEntry.transportCategory)]}>{tool.L('transportCatShort')} {currentEntry.transportCategory}</span>
                    {#if currentEntry.multiplier}
                      <span class="font-mono text-xs text-[#5a7a99] ml-1.5">
                        × {currentEntry.multiplier}
                      </span>
                    {/if}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.kemlerNumber}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('kemler')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.kemlerNumber}</span></td>
                </tr>
              {/if}
              {#if currentEntry.tunnelCode}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('tunnelCode')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.tunnelCode}</span></td>
                </tr>
              {/if}
              {#if currentEntry.ems1}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('ems')}</td>
                  <td class="field-value">
                    <span class="mono-val">{currentEntry.ems1}{currentEntry.ems2 ? ' / ' + currentEntry.ems2 : ''}</span>
                  </td>
                </tr>
              {/if}
              {#if currentEntry.stowageCategory}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('stowageCat')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.stowageCategory}</span></td>
                </tr>
              {/if}
              {#if currentEntry.stowage}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('stowage')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.stowage}</span></td>
                </tr>
              {/if}
              {#if currentEntry.segregation}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('segregation')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.segregation}</span></td>
                </tr>
              {/if}
              {#if currentEntry.marpol}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('marpol')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.marpol}</span></td>
                </tr>
              {/if}
              {#if currentEntry.packingInstrPassenger}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('piPassenger')}</td>
                  <td class="field-value">
                    <span class="mono-val">{currentEntry.packingInstrPassenger}</span>
                    {#if currentEntry.maxNetPassenger}<span class="text-xs text-[#5a7a99] ml-1.5">· max {currentEntry.maxNetPassenger}</span>{/if}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.packingInstrCargo}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('piCargo')}</td>
                  <td class="field-value">
                    <span class="mono-val">{currentEntry.packingInstrCargo}</span>
                    {#if currentEntry.maxNetCargo}<span class="text-xs text-[#5a7a99] ml-1.5">· max {currentEntry.maxNetCargo}</span>{/if}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.cones != null && currentEntry.cones !== ''}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('cones')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.cones}</span></td>
                </tr>
              {/if}
              {#if currentEntry.equipment}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('equipment')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.equipment}</span></td>
                </tr>
              {/if}
              {#if currentEntry.remark}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('remark')}</td>
                  <td class="field-value text-sm leading-relaxed text-[#2d5070]">{currentEntry.remark}</td>
                </tr>
              {/if}
            </tbody>
          </table>

          <!-- Special provisions -->
          {#if currentEntry.specialProvisions}
            <MultimodalSvsAccordion
              svs={currentEntry.specialProvisions}
              label={tool.L('specialProvisions')}
              noText={tool.L('noText')}
              clickLoad={tool.L('clickLoad')}
              {demo}
              mode={tool.currentModal}
              lang={tool.currentLang}
              {supabase}
            />
          {/if}
        {:else if tool.isUnmatched(tool.currentModal)}
          {@const mode = tool.currentModal}
          <!-- rows exist, but none corresponds unambiguously: ask, never guess -->
          <div class="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p class="mb-3">{tool.L('noVariantMatch').replace('{mode}', mode)}</p>
            {@render modePicker(mode)}
          </div>
        {:else}
          <!-- Empty state (no data for current modal) -->
          <div class="text-center py-12 text-[#5a7a99]">
            <div class="text-4xl mb-3 opacity-30">📭</div>
            <p class="text-sm">UN {tool.currentUnNumber} – {tool.currentModal} {tool.L('notFound')}.</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Initial empty state (no search yet) -->
      <div class="bg-[#f4f7fa] border border-[#b0c4d8] p-14 text-center text-[#5a7a99]">
        <div class="text-5xl mb-3 opacity-30">🌍</div>
        <p class="text-sm leading-relaxed">
          <strong class="text-[#0f2744]">{tool.L('searchPlaceholder')}</strong><br />
          {tool.L('bannerSub')}
        </p>
      </div>
    {/if}

  </div>
</div>

<style>
  @reference "tailwindcss";

  .field-label {
    @apply font-mono text-[10px] font-bold tracking-[0.5px] uppercase text-[#5a7a99] py-2 px-2.5 border-b border-[#c8d6e5] align-top whitespace-nowrap w-[150px];
  }
  .field-value {
    @apply py-2 px-2.5 border-b border-[#c8d6e5] align-top text-[#2d5070];
  }
  .badge {
    @apply inline-block font-mono text-[10px] font-bold px-2 py-0.5 tracking-[0.3px];
  }
  .mono-val {
    @apply font-mono text-[13px] font-semibold text-[#0f2744];
  }
</style>
