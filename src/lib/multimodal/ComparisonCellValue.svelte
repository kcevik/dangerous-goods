<script lang="ts">
  import type { CompareCell, CompareRow } from './compare'
  import type { ComparisonViewState } from './comparisonView.svelte'
  import { parseEms } from './ems'

  interface Props {
    view: ComparisonViewState
    row: CompareRow
    /** null = the field has no UN reference */
    cell: CompareCell | null
    /** the grey UN reference column: never compared, never a deviation */
    isReference?: boolean
  }

  let { view, row, cell, isReference = false }: Props = $props()

  const hint = $derived(cell ? view.cellHint(cell, isReference, row) : view.L('notApplicable'))
  const deviation = $derived(cell && !isReference ? view.deviationLabel(row, cell) : undefined)
  const ems = $derived(cell?.raw && (row.field === 'ems1' || row.field === 'ems2') ? parseEms(cell.raw) : null)
</script>

<!-- symbols are aria-hidden; screen readers get the hint as text, not only via `title` -->
{#if !cell || !cell.applicable}
  {#if cell?.gap === 'noSource'}
    <span class="text-xs italic text-[#5a7a99]" aria-hidden="true">{view.L('noSourceShort')}</span>
  {:else if cell?.gap === 'elsewhere'}
    <span class="text-[#5a7a99]" aria-hidden="true">→</span>
  {:else}
    <span class="text-[#b0c4d8]" aria-hidden="true">—</span>
  {/if}
{:else if cell.unresolved}
  <span class="font-bold text-amber-600" aria-hidden="true">?</span>
{:else if cell.raw}
  {#if deviation && (row.critical || cell.forbidden)}<span class="mr-1" aria-hidden="true">▲</span>{/if}{#if ems}{#if ems.underlined}<u class="underline-offset-2" title={view.L('emsUnderlined')}>{ems.code}</u><span class="sr-only">({view.L('emsUnderlined')})</span>{:else}{ems.code}{/if}{:else}{cell.raw}{/if}
{:else}
  <span class="text-[#b0c4d8]" aria-hidden="true">–</span><span class="sr-only">{view.L('notFound')}</span>
{/if}
{#if hint}<span class="sr-only" data-hint>({hint})</span>{/if}
{#if deviation}<span class="sr-only" data-hint>({deviation})</span>{/if}
