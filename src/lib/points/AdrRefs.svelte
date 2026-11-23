<script lang="ts">
  import { type AdrRef, adrSectionHref } from './duties'

  interface Props {
    refs: readonly AdrRef[]
    /** sections the ADR book has as headings */
    linkable: ReadonlySet<string>
  }

  let { refs, linkable }: Props = $props()
</script>

<!-- links open in a new tab: leaving the page would lose the rows entered so far -->
<span class="text-[#5a7a99]">({#each refs as ref, i (ref.section + (ref.label ?? ''))}{@const href = adrSectionHref(ref.section, linkable)}{#if i > 0},&nbsp;{/if}{#if href}<a
      {href}
      target="_blank"
      rel="noopener"
      class="underline underline-offset-2 hover:text-orange-600 print:no-underline"
    >{ref.label ?? ref.section}</a>{:else}{ref.label ?? ref.section}{/if}{/each})</span>
