<script lang="ts">
  import { LEGAL_LINKS } from '$lib/legal'

  let { tone = 'light' }: { tone?: 'light' | 'dark' } = $props()
</script>

<nav aria-label="Rechtliches" class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
  {#each LEGAL_LINKS as link (link.href)}
    <a href={link.href} class={tone === 'dark' ? 'text-slate-400 hover:text-white' : 'text-[#5a7a99] hover:text-[#0f2744]'}>{link.label}</a>
  {/each}
</nav>
