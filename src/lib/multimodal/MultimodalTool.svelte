<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { untrack } from 'svelte'
  import MultimodalSvsAccordion from './MultimodalSvsAccordion.svelte'
  import { MultimodalToolState } from './multimodalTool.svelte'
  import { DEMO_DATA, type Entry, LANGS } from './types'

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

  let showDemoNotice = $state(false)

  // client-side load when the prop changes and nothing was preloaded for it
  $effect(() => {
    if (demo || !unNumber) return
    if (unNumber !== tool.currentUnNumber) tool.loadCompare(unNumber)
  })
</script>

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

    <!-- Search bar -->
    <div class="flex flex-wrap items-center gap-2.5 px-4 py-3.5 mb-4 bg-[#f4f7fa] border border-[#c8d6e5] border-t-[3px] border-t-orange-500">
      <div class="relative flex-1 min-w-[200px]">
        <input
          value={tool.searchDisplay}
          placeholder={tool.L('searchPlaceholder')}
          readonly={demo}
          class={['w-full px-3.5 py-2.5 font-mono text-sm border-[1.5px] border-[#b0c4d8] bg-[#dce8f2] text-[#0f2744] outline-none focus:border-orange-500 transition-colors', demo ? 'cursor-default' : 'cursor-text']}
          autocomplete="off"
          onfocus={() => { if (demo) showDemoNotice = true }}
          onblur={() => { showDemoNotice = false }}
        />
        {#if showDemoNotice}
          <div class="absolute top-full left-0 right-0 mt-1 px-3 py-2 text-xs bg-[#f4f7fa] border-[1.5px] border-orange-500 text-[#2d5070] z-10 shadow-md">
            🔍 {tool.L('demoNotice')}
          </div>
        {/if}
      </div>

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
    {#if tool.hasData}

      <!-- Compare overview -->
      <div class="px-4 py-3.5 mb-0.5 bg-[#f4f7fa] border border-[#b0c4d8] border-t-[3px] border-t-orange-500">
        <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2.5">
          UN {tool.currentUnNumber} · {tool.L('availability')}
        </div>
        <div class="grid grid-cols-5 gap-2 max-sm:grid-cols-3">
          {#each tool.MODALS as modal (modal)}
            {@const entry = tool.getEntry(modal)}
            <div
              class={['p-2.5 border bg-[#f4f7fa] transition-all', entry
                ? ['cursor-pointer', 'hover:border-orange-400',
                   modal === tool.currentModal
                     ? 'border-orange-500 border-t-[3px]'
                     : 'border-[#c8d6e5]']
                : ['border-[#c8d6e5]', 'opacity-40']]}
              role="button"
              tabindex={entry ? 0 : -1}
              onclick={() => { if (entry) tool.switchModal(modal) }}
              onkeydown={(e) => { if (entry && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tool.switchModal(modal) } }}
            >
              <div class="font-mono text-[10px] font-bold tracking-[1px] uppercase text-[#5a7a99] mb-1">{modal}</div>
              {#if entry}
                <div class="font-mono text-base font-bold text-[#0f2744]">{entry.hazardClass}</div>
                {#if entry.packingGroup}
                  <div class="font-mono text-[11px] text-[#5a7a99] mt-0.5">
                    VP-Gr. {entry.packingGroup}
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
          <button
            type="button"
            class={['flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.5px] whitespace-nowrap mr-0.5 relative top-px border border-b-0 transition-all', modal === tool.currentModal
              ? 'bg-[#f4f7fa] text-[#0f2744] border-[#b0c4d8] border-b-2 border-b-[#f4f7fa]'
              : entry
                ? 'bg-[#dce8f2] text-[#0f2744] border-[#b0c4d8] hover:bg-[#d4e2ef] cursor-pointer'
                : 'bg-[#dce8f2] text-[#5a7a99] border-[#b0c4d8] opacity-40 cursor-default']}
            role="tab"
            aria-selected={modal === tool.currentModal}
            disabled={!entry}
            onclick={() => { if (entry) tool.switchModal(modal) }}
          >
            <span class={['w-1.5 h-1.5 rounded-full', entry ? 'bg-orange-500' : 'bg-[#b0c4d8]']}></span>
            {modal}
          </button>
        {/each}
      </div>

      <!-- Detail panel -->
      <div class="bg-[#f4f7fa] border border-[#b0c4d8] border-t-0 p-5" role="tabpanel">
        {#if tool.currentEntry}
          {@const currentEntry = tool.currentEntry}

          <!-- UN header -->
          <div class="flex flex-wrap items-start gap-3.5 pb-4 mb-4 border-b border-[#c8d6e5]">
            <div class="font-mono text-3xl font-bold text-orange-500 leading-none flex-shrink-0">
              UN {currentEntry.unNumber}
            </div>
            <div>
              <div class="text-base font-semibold text-[#0f2744]">{tool.getName(currentEntry)}</div>
              {#if tool.getNameSub(currentEntry)}
                <div class="text-sm text-[#5a7a99] mt-0.5">
                  {tool.getNameSub(currentEntry)}
                </div>
              {/if}
              {#if tool.getSpez(currentEntry)}
                <div class="text-sm italic text-[#2d5070] mt-0.5">
                  {tool.getSpez(currentEntry)}
                </div>
              {/if}
            </div>
          </div>

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
                    <span class="badge bg-[#1e3a5f] text-blue-200">VP-Gr. {currentEntry.packingGroup}</span>
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
                    <span class={['badge', tool.bkClass(currentEntry.transportCategory)]}>BK {currentEntry.transportCategory}</span>
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
