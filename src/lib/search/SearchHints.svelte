<script lang="ts">
  import type { Synonym } from './synonyms'

  interface Props {
    /** synonyms without UN numbers ("in der Regel kein Gefahrgut") */
    hints: Synonym[]
  }

  let { hints }: Props = $props()
</script>

{#if hints.length > 0}
  <ul data-testid="search-hints" class="mb-3 space-y-1">
    {#each hints as hint (hint.term)}
      <li class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 break-words">
        <span class="font-semibold">„{hint.term}“:</span> {hint.note}
      </li>
    {/each}
  </ul>
{/if}
