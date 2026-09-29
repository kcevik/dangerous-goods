<script lang="ts">
  import { getBookLabel, type Lang, type TocEntry } from './bookTypes'

  let { toc, lang = 'de', onnavigate }: {
    toc: TocEntry[]
    lang?: Lang
    onnavigate: (entry: TocEntry) => void
  } = $props()

  interface TocNode { entry: TocEntry, children: TocNode[] }

  /** Levels 1–3 as a real nested list; deeper headings stay out of the TOC. */
  const tree = $derived.by(() => {
    const roots: TocNode[] = []
    const stack: TocNode[] = []
    for (const entry of toc) {
      if (entry.level > 3) continue
      const node: TocNode = { entry, children: [] }
      while (stack.length > 0 && stack.at(-1)!.entry.level >= entry.level) stack.pop()
      if (stack.length === 0) roots.push(node)
      else stack.at(-1)!.children.push(node)
      stack.push(node)
    }
    return roots
  })

  function onclick(event: MouseEvent, entry: TocEntry) {
    event.preventDefault()
    onnavigate(entry)
  }
</script>

{#snippet branch(nodes: TocNode[], depth: number)}
  <ul class={[depth > 0 && 'ml-3 border-l border-[#c8d6e5] pl-2']}>
    {#each nodes as node (node.entry.slug)}
      <li>
        <a
          href={`#${node.entry.slug}`}
          onclick={event => onclick(event, node.entry)}
          class={[
            'block rounded px-1.5 py-0.5 hover:bg-[#e8eef5] hover:text-[#0f2744]',
            depth === 0 ? 'font-semibold text-[#0f2744]' : 'text-[#3d5a78]',
          ]}
        >{node.entry.text}</a>
        {#if node.children.length > 0}
          {@render branch(node.children, depth + 1)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<nav aria-label={getBookLabel(lang, 'toc')} class="text-[13px] leading-snug">
  {@render branch(tree, 0)}
</nav>
