<script lang="ts">
  import type { CompareCell, CompareRow } from './compare'
  import type { ComparisonViewState } from './comparisonView.svelte'

  interface Props {
    view: ComparisonViewState
    row: CompareRow
    /** null = the field has no UN reference */
    cell: CompareCell | null
    /** the grey UN reference column: never compared, never a deviation */
    isReference?: boolean
  }

  let { view, row, cell, isReference = false }: Props = $props()

  const hint = $derived(cell ? view.cellHint(cell, isReference) : view.L('notApplicable'))
  const deviation = $derived(cell && !isReference ? view.deviationLabel(row, cell) : undefined)
</script>

<!-- symbols are aria-hidden; screen readers get the hint as text, not only via `title` -->
{#if !cell || !cell.applicable}
  <span class="text-[#b0c4d8]" aria-hidden="true">—</span>
{:else if cell.unresolved}
  <span class="font-bold text-amber-600" aria-hidden="true">?</span>
{:else if cell.raw}
  {#if deviation && row.critical}<span class="mr-1" aria-hidden="true">▲</span>{/if}{cell.raw}
{:else}
  <span class="text-[#b0c4d8]" aria-hidden="true">–</span><span class="sr-only">{view.L('notFound')}</span>
{/if}
{#if hint}<span class="sr-only" data-hint>({hint})</span>{/if}
{#if deviation}<span class="sr-only" data-hint>({deviation})</span>{/if}
