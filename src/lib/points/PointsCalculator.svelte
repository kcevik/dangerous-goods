<script lang="ts">
  import { untrack } from 'svelte'
  import { QUANTITY_RULES } from './duties'
  import { fetchPointsEntries } from './fetchEntries'
  import { type EntryFetcher, PointsCalculatorState } from './pointsCalculator.svelte'
  import PointsPrintSheet from './PointsPrintSheet.svelte'
  import PointsResult from './PointsResult.svelte'
  import PointsRow from './PointsRow.svelte'

  interface Props {
    /** sections the ADR book has as headings (from the page load) */
    linkedSections: readonly string[]
    /** injectable for tests; defaults to the `eintrag` endpoint */
    fetcher?: EntryFetcher
  }

  let { linkedSections, fetcher }: Props = $props()

  // only activated accounts get this component — locked users never reach the fetcher
  const calc = untrack(() => new PointsCalculatorState(fetcher ?? (un => fetchPointsEntries(un))))
  const linkable = $derived(new Set(linkedSections))

  const printedAt = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })

  function addRow() {
    const row = calc.addRow()
    // move focus to the new row's UN field, so the next number can be typed at once
    queueMicrotask(() => document.getElementById(`pos-${row.id}-un`)?.focus())
  }
</script>

<PointsPrintSheet rows={calc.filledRows} total={calc.summary.total} {printedAt} />

<div class="print:hidden">
  <details class="mb-4 rounded-xl border border-[#c8d6e5] bg-white/70 px-4 text-sm text-[#0f2744]">
    <summary class="min-h-11 flex items-center cursor-pointer font-semibold">Welche Menge trage ich ein? (1.1.3.6.3)</summary>
    <ul class="pb-3 space-y-1 list-disc pl-5">
      {#each QUANTITY_RULES as rule (rule)}
        <li>{rule}</li>
      {/each}
    </ul>
  </details>

  <ol class="space-y-3" aria-label="Positionen der Beförderungseinheit">
    {#each calc.rows as row, index (row.id)}
      <PointsRow {calc} {row} {index} />
    {/each}
  </ol>

  <div class="mt-3 flex flex-wrap gap-3">
    <button
      type="button"
      onclick={addRow}
      class="inline-flex items-center justify-center min-h-11 px-4 rounded-lg border border-[#0f2744] text-sm font-semibold text-[#0f2744] hover:bg-white cursor-pointer"
    >+ Position hinzufügen</button>
    <button
      type="button"
      onclick={() => window.print()}
      class="inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-[#0f2744] text-sm font-semibold text-white hover:bg-[#1a3a5f] cursor-pointer"
    >Drucken / als PDF speichern</button>
  </div>
</div>

<PointsResult summary={calc.summary} {linkable} />
