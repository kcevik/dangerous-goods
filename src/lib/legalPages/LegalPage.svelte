<script lang="ts">
  import { fillDocument, type LegalDocument } from './document'
  import { type LegalFacts, LEGAL_FACTS, LEGAL_UPDATED } from './facts'

  let { document, facts = LEGAL_FACTS }: { document: LegalDocument, facts?: LegalFacts } = $props()

  const filled = $derived(fillDocument(document, facts))
  const isDraft = $derived(filled.missing.length > 0)
</script>

<svelte:head>
  <title>{filled.title} | gefahrgut.org</title>
  {#if filled.description}
    <meta name="description" content={filled.description} />
  {/if}
  {#if isDraft}
    <!-- an incomplete legal text must not be indexed or mistaken for the valid one -->
    <meta name="robots" content="noindex" />
  {/if}
</svelte:head>

<article class="max-w-3xl mx-auto">
  {#if isDraft}
    <div role="note" class="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p class="font-semibold">Entwurf – noch nicht gültig</p>
      <p class="mt-1">Es fehlen noch: {filled.missing.join(', ')}.</p>
    </div>
  {/if}

  <h1 class="text-3xl font-bold mb-2 text-[#0f2744]">{filled.title}</h1>
  <p class="text-sm text-[#5a7a99] mb-8">Stand: {LEGAL_UPDATED}</p>

  <div class="space-y-4 text-[15px] leading-relaxed text-slate-700">
    {#each filled.blocks as block, i (i)}
      {#if block.kind === 'h2'}
        <h2 class="pt-4 text-xl font-semibold text-[#0f2744]">{block.text}</h2>
      {:else if block.kind === 'h3'}
        <h3 class="pt-2 text-base font-semibold text-[#0f2744]">{block.text}</h3>
      {:else if block.kind === 'p'}
        <p class="whitespace-pre-line">{block.text}</p>
      {:else if block.kind === 'ul'}
        <ul class="list-disc pl-6 space-y-1">
          {#each block.items as item, j (j)}
            <li>{item}</li>
          {/each}
        </ul>
      {/if}
    {/each}
  </div>
</article>
