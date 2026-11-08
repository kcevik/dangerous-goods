<script lang="ts">
  import type { ComparisonViewState } from './comparisonView.svelte'

  let { view }: { view: ComparisonViewState } = $props()
</script>

<div class="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-[#5a7a99]">
  <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-orange-100 border border-orange-300"></span>{view.L('legendCritical')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-amber-50 border border-amber-300"></span>{view.L('legendDiffers')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="font-bold text-orange-500">*</span>{view.L('criticalField')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="text-[#b0c4d8]">—</span>{view.L('notApplicable')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="italic">abc</span>{view.L('notCompared')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="font-bold text-amber-600">?</span>{view.L('unresolved')}</span>
</div>
<p class="px-1 mt-2 text-[11px] text-[#5a7a99]">
  Quelle: BAM GEFAHRGUT, Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0). Darstellung und Vergleich verändert durch gefahrgut.org; kein rechtsverbindlicher Text.
</p>
