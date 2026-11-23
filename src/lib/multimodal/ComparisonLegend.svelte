<script lang="ts">
  import type { ComparisonViewState } from './comparisonView.svelte'

  let { view }: { view: ComparisonViewState } = $props()
</script>

<div class="grid grid-cols-2 gap-x-4 gap-y-2 px-1 text-xs text-[#5a7a99] sm:flex sm:flex-wrap sm:gap-x-5">
  <span class="inline-flex items-start gap-1.5"><span class="mt-px inline-block size-3 shrink-0 bg-orange-100 border border-orange-300"></span>{view.L('legendCritical')}</span>
  <span class="inline-flex items-start gap-1.5"><span class="mt-px inline-block size-3 shrink-0 bg-amber-50 border border-amber-300"></span>{view.L('legendDiffers')}</span>
  <span class="inline-flex items-start gap-1.5"><span class="w-3 shrink-0 text-center font-bold text-orange-500" aria-hidden="true">*</span>{view.L('criticalField')}</span>
  <span class="inline-flex items-start gap-1.5"><span class="w-3 shrink-0 text-center text-[#b0c4d8]" aria-hidden="true">—</span>{view.L('notApplicable')}</span>
  <span class="inline-flex items-start gap-1.5"><span class="shrink-0 italic" aria-hidden="true">abc</span>{view.L('notCompared')}</span>
  <span class="inline-flex items-start gap-1.5"><span class="w-3 shrink-0 text-center font-bold text-amber-600" aria-hidden="true">?</span>{view.L('unresolved')}</span>
</div>
<p class="px-1 mt-3 text-[11px] leading-relaxed text-[#5a7a99]">
  Quelle: BAM GEFAHRGUT, Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0). Darstellung und Vergleich verändert durch gefahrgut.org; kein rechtsverbindlicher Text.
</p>
