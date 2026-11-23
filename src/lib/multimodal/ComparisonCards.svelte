<script lang="ts">
  import ComparisonCellValue from './ComparisonCellValue.svelte'
  import { cellTone, type ComparisonViewState } from './comparisonView.svelte'

  let { view }: { view: ComparisonViewState } = $props()
</script>

<!--
  Phone/tablet layout (below lg): one card per field, one line per mode. A field is what an
  officer looks up ("Begrenzte Mengen?"), so it reads top to bottom without sideways scrolling.
  Modes where the field does not exist are left out instead of listing "—" rows.
-->
<div data-testid="comparison-cards" class="space-y-3">
  <ul class="grid items-start gap-3 sm:grid-cols-2">
    {#each view.visibleRows as row (row.field)}
      <li data-field={row.field} data-status={row.status} class={['border bg-white', row.status === 'differs' || row.forbidden ? 'border-orange-300' : 'border-[#c8d6e5]']}>
        <div class="flex items-baseline justify-between gap-2 border-b border-[#c8d6e5] bg-[#f4f7fa] px-3 py-2">
          <h2 class="min-w-0 font-mono text-[11px] font-bold uppercase tracking-[0.5px] text-[#2d5070]">
            {view.L(row.labelKey)}{#if row.critical}<span class="ml-1 text-orange-500" aria-hidden="true">*</span><span class="sr-only">({view.L('criticalField')})</span>{/if}
          </h2>
          {#if row.forbidden}
            <span class="shrink-0 bg-orange-500 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[1px] text-black">{view.L('forbiddenBadge')}</span>
          {:else if row.status === 'differs'}
            <span class="shrink-0 bg-orange-500 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[1px] text-black">{view.L(row.critical ? 'legendCritical' : 'legendDiffers')}</span>
          {/if}
        </div>
        <dl class="divide-y divide-[#e3eaf1]">
          {#each view.cardModes(row) as mode (mode)}
            {@const cell = row.cells[mode]}
            <div data-mode={mode} data-deviates={cell.deviates} data-forbidden={cell.forbidden} title={cell.applicable ? undefined : view.cellHint(cell, false, row)} class={['grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-3 py-2 font-mono text-[13px]', cellTone(row, cell)]}>
              <dt class="text-xs font-bold not-italic text-[#0f2744]">{mode}</dt>
              <dd class="wrap-break-word"><ComparisonCellValue {view} {row} {cell} /></dd>
            </div>
          {/each}
          {#if view.hasReference && row.reference}
            <div data-mode="UN" class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-500">
              <dt class="text-xs font-bold text-slate-600"><span aria-hidden="true">UN</span><span class="sr-only">{view.L('unReference')}</span></dt>
              <dd class="wrap-break-word"><ComparisonCellValue {view} {row} cell={row.reference} isReference /></dd>
            </div>
          {/if}
        </dl>
      </li>
    {/each}
  </ul>
</div>
