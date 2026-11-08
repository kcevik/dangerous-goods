<script lang="ts">
  import type { CompareCell, CompareRow } from './compare'
  import type { ComparisonViewState } from './comparisonView.svelte'
  import { MODALS } from './types'

  let { view }: { view: ComparisonViewState } = $props()

  function tone(row: CompareRow, cell: CompareCell): string {
    if (cell.deviates) return row.critical ? 'bg-orange-100 text-orange-900 font-bold' : 'bg-amber-50 text-[#0f2744] font-semibold'
    if (cell.raw && !cell.compared) return 'text-[#5a7a99] italic'
    return row.status === 'same' ? 'text-[#5a7a99]' : 'text-[#0f2744]'
  }

  function hint(cell: CompareCell): string | undefined {
    if (!cell.applicable) return view.L('notApplicable')
    if (cell.unresolved) return view.L('unresolved')
    if (cell.raw && !cell.compared) return view.L('notCompared')
    return undefined
  }
</script>

<!-- the table scrolls inside this box; the page body never scrolls sideways -->
<div class="overflow-x-auto border border-[#b0c4d8] bg-[#f4f7fa]">
  <table class="w-full min-w-[760px] text-sm border-collapse">
    <thead>
      <tr>
        <th scope="col" class="sticky left-0 z-20 bg-[#0f2744] px-3 py-2.5 text-left align-bottom font-mono text-[10px] font-bold uppercase tracking-[1px] text-slate-300">{view.L('field')}</th>
        {#each MODALS as mode (mode)}
          <th scope="col" class="bg-[#0f2744] px-3 py-2.5 text-left align-bottom">
            <span class="block font-mono text-xs font-bold text-white">{mode}</span>
            <span class="block text-[10px] font-normal text-slate-400">{view.modalDesc(mode)}</span>
          </th>
        {/each}
        {#if view.hasReference}
          <th scope="col" class="bg-slate-600 px-3 py-2.5 text-left align-bottom">
            <span class="block font-mono text-xs font-bold text-white">UN</span>
            <span class="block text-[10px] font-normal text-slate-300">{view.L('unReference')}</span>
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each view.visibleRows as row, i (row.field)}
        <tr data-field={row.field} data-status={row.status} class="border-t border-[#c8d6e5]">
          <th scope="row" class="sticky left-0 z-10 bg-[#f4f7fa] px-3 py-2 text-left align-top font-mono text-[10px] font-bold uppercase tracking-[0.5px] text-[#5a7a99] whitespace-nowrap">
            {view.L(row.labelKey)}{#if row.critical}<span class="ml-1 text-orange-500" title={view.L('criticalField')}>*</span>{/if}
          </th>
          {#each MODALS as mode (mode)}
            {@const cell = row.cells[mode]}
            {#if mode === 'ADN'}
              {#if i === 0}
                <td data-mode="ADN" rowspan={view.visibleRows.length} class="px-3 py-2 align-top text-xs italic text-[#5a7a99] bg-[#eef2f6]">{view.L('noAdnData')}</td>
              {/if}
            {:else}
              <td data-mode={mode} data-deviates={cell.deviates} title={hint(cell)} class={['px-3 py-2 align-top font-mono text-[13px]', tone(row, cell)]}>
                {#if !cell.applicable}
                  <span class="text-[#b0c4d8]">—</span>
                {:else if cell.unresolved}
                  <span class="font-bold text-amber-600">?</span>
                {:else if cell.raw}
                  {#if cell.deviates && row.critical}<span class="mr-1" aria-hidden="true">▲</span>{/if}{cell.raw}
                {:else}
                  <span class="text-[#b0c4d8]">–</span>
                {/if}
              </td>
            {/if}
          {/each}
          {#if view.hasReference}
            <td data-mode="UN" title={row.reference?.unresolved ? view.L('unresolved') : undefined} class="px-3 py-2 align-top font-mono text-[13px] text-slate-500 bg-slate-50">
              {#if !row.reference}
                <span class="text-[#b0c4d8]">—</span>
              {:else if row.reference.unresolved}
                <span class="font-bold text-amber-600">?</span>
              {:else if row.reference.raw}
                {row.reference.raw}
              {:else}
                <span class="text-[#b0c4d8]">–</span>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
