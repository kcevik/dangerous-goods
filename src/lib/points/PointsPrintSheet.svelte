<script lang="ts">
  import { formatPoints, UNIT_LABELS } from './points'
  import type { PointsRowState } from './pointsCalculator.svelte'

  interface Props {
    rows: readonly PointsRowState[]
    total: number
    /** e.g. "23.11.2026, 14:05" */
    printedAt: string
  }

  let { rows, total, printedAt }: Props = $props()
</script>

<!-- Only on paper: the screen shows the editable cards instead. -->
<div class="hidden print:block" data-testid="points-print-sheet">
  <h1 class="text-xl font-bold text-black">1000-Punkte-Berechnung nach ADR 1.1.3.6</h1>
  <p class="text-sm text-black mt-1">Erstellt am {printedAt} mit gefahrgut.org</p>

  <table class="mt-4 w-full border-collapse text-sm text-black">
    <thead>
      <tr class="border-b-2 border-black text-left">
        <th class="py-1 pr-2">Pos.</th>
        <th class="py-1 pr-2">UN</th>
        <th class="py-1 pr-2">Benennung</th>
        <th class="py-1 pr-2">BK</th>
        <th class="py-1 pr-2 text-right">Menge</th>
        <th class="py-1 pr-2 text-right">Faktor</th>
        <th class="py-1 text-right">Punkte</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row, i (row.id)}
        {@const r = row.result}
        <tr class="border-b border-gray-400 align-top">
          <td class="py-1 pr-2">{i + 1}</td>
          <td class="py-1 pr-2 font-mono">{r.un}</td>
          <td class="py-1 pr-2">
            {r.entry?.name ?? r.entry?.nameEn ?? ''}{#if r.entry?.packingGroup}, VG {r.entry.packingGroup}{/if}
            {#if row.emptyPackaging}<br /><span class="text-xs">leere ungereinigte Verpackung</span>{/if}
            {#if r.status !== 'counted' && r.message}<br /><span class="text-xs">{r.message}</span>{/if}
          </td>
          <td class="py-1 pr-2">{r.category ?? '–'}</td>
          <td class="py-1 pr-2 text-right whitespace-nowrap">{r.quantity === null ? '–' : `${formatPoints(r.quantity)} ${UNIT_LABELS[row.unit]}`}</td>
          <td class="py-1 pr-2 text-right">{r.factor ?? '–'}</td>
          <td class="py-1 text-right font-mono">{r.points === null ? '–' : formatPoints(r.points)}</td>
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr class="border-t-2 border-black font-bold">
        <td class="py-1" colspan="6">Summe (1.1.3.6.4)</td>
        <td class="py-1 text-right font-mono" data-testid="print-total">{formatPoints(total)}</td>
      </tr>
    </tfoot>
  </table>
</div>
