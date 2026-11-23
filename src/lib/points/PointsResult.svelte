<script lang="ts">
  import AdrRefs from './AdrRefs.svelte'
  import { CALCULATION_NOTES, DATA_SOURCE, DISCLAIMER, LIFTED_RULES, REMAINING_DUTIES, RULE_REF } from './duties'
  import { formatPoints, type LoadResult, POINTS_LIMIT } from './points'

  interface Props {
    summary: LoadResult
    linkable: ReadonlySet<string>
  }

  let { summary, linkable }: Props = $props()

  const score = $derived(`${formatPoints(summary.total)} von ${formatPoints(POINTS_LIMIT)} Punkten`)
</script>

<section aria-labelledby="points-result-title" class="mt-6">
  <h2 id="points-result-title" class="sr-only">Ergebnis</h2>

  <div aria-live="polite" data-testid="points-verdict" data-verdict={summary.verdict}>
    {#if summary.verdict === 'empty'}
      <div class="rounded-xl border border-dashed border-[#b0c4d8] bg-white/60 p-4 text-sm text-[#5a7a99]">
        Trage mindestens eine Position ein – Punkte und Ergebnis erscheinen sofort.
      </div>
    {:else if summary.verdict === 'lookupFailed'}
      <div role="alert" class="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
        <p class="font-bold">Kein Ergebnis: Die Abfrage ist fehlgeschlagen.</p>
        <p class="text-sm mt-1">Ohne die Daten aller Positionen lässt sich nichts berechnen. Versuche es bei der Position erneut.</p>
      </div>
    {:else if summary.verdict === 'incomplete'}
      <div class="rounded-xl border border-[#b0c4d8] bg-white p-4 text-[#0f2744]">
        <p class="font-bold">Noch kein Ergebnis – Angaben unvollständig.</p>
      </div>
    {:else if summary.verdict === 'notExempt'}
      <div class="rounded-xl border-2 border-red-400 bg-red-50 p-4 text-red-900">
        <p class="text-lg font-bold">Freistellung nach 1.1.3.6 nicht möglich</p>
        <p class="font-mono text-sm mt-1">({score})</p>
      </div>
    {:else if summary.verdict === 'check'}
      <div class="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-900">
        <p class="text-lg font-bold">Freistellung nicht feststellbar – bitte prüfen</p>
        <p class="font-mono text-sm mt-1">(bisher {score})</p>
      </div>
    {:else if summary.verdict === 'noAdrGoods'}
      <div class="rounded-xl border border-[#b0c4d8] bg-white p-4 text-[#0f2744]">
        <p class="font-bold">Keine der Positionen unterliegt dem ADR.</p>
      </div>
    {:else}
      <div class="rounded-xl border-2 border-green-500 bg-green-50 p-4 text-green-900">
        <p class="text-lg font-bold">Freistellung nach 1.1.3.6 möglich</p>
        <p class="font-mono text-sm mt-1">({score})</p>
      </div>
    {/if}

    {#if summary.reasons.length > 0}
      <ul class="mt-3 space-y-1 text-sm text-[#0f2744] list-disc pl-5">
        {#each summary.reasons as reason (reason)}
          <li>{reason}</li>
        {/each}
      </ul>
    {/if}
    {#if summary.notes.length > 0}
      <ul class="mt-2 space-y-1 text-sm text-[#5a7a99] list-disc pl-5">
        {#each summary.notes as note (note)}
          <li>{note}</li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if summary.verdict === 'exempt'}
    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div>
        <h3 class="font-semibold text-[#0f2744] mb-2">Was trotzdem gilt</h3>
        <ul class="space-y-2 text-sm text-[#0f2744] list-disc pl-5" data-testid="remaining-duties">
          {#each REMAINING_DUTIES as duty (duty.text)}
            <li>{duty.text} <AdrRefs refs={duty.refs} {linkable} /></li>
          {/each}
        </ul>
      </div>
      <div>
        <h3 class="font-semibold text-[#0f2744] mb-2">Was entfällt</h3>
        <ul class="space-y-2 text-sm text-[#0f2744] list-disc pl-5" data-testid="lifted-rules">
          {#each LIFTED_RULES as rule (rule.text)}
            <li>{rule.text} <AdrRefs refs={rule.refs} {linkable} /></li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}

  <div class="mt-6 rounded-xl bg-white/70 border border-[#c8d6e5] p-4">
    <h3 class="font-semibold text-sm text-[#0f2744] mb-2">Hinweise <AdrRefs refs={[RULE_REF]} {linkable} /></h3>
    <ul class="space-y-1.5 text-sm text-[#0f2744] list-disc pl-5">
      {#each CALCULATION_NOTES as note (note.text)}
        <li>{note.text} <AdrRefs refs={note.refs} {linkable} /></li>
      {/each}
    </ul>
  </div>

  <p class="mt-4 text-sm font-semibold text-[#0f2744]" data-testid="points-disclaimer">{DISCLAIMER}</p>
  <p class="mt-1 text-xs text-[#5a7a99]">{DATA_SOURCE}</p>
</section>
