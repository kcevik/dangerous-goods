<script lang="ts">
  interface Props {
    synonym: { term: string, note?: string }
    /** smaller text for the QuickSearch dropdown */
    compact?: boolean
  }

  let { synonym, compact = false }: Props = $props()
</script>

<p
  data-testid="synonym-notice"
  class={['mt-1.5 rounded-md border border-amber-200 bg-amber-50 text-amber-900 break-words', compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs']}
>
  Über Synonym „{synonym.term}“ gefunden – Einstufung anhand des Sicherheitsdatenblatts (Abschnitt 14) prüfen.
  {#if synonym.note}
    <span class="block mt-0.5 font-semibold">{synonym.note}</span>
  {/if}
</p>
