<script lang="ts">
  import type { Variant } from './variants'

  interface Props {
    variants: Variant[]
    /** index of the pressed button; null/undefined = none */
    selected: number | null | undefined
    label: (variant: Variant) => string
    ariaLabel: string
    onselect: (index: number) => void
    tone?: 'orange' | 'amber'
  }

  let { variants, selected, label, ariaLabel, onselect, tone = 'orange' }: Props = $props()
</script>

<div role="group" aria-label={ariaLabel} class="flex flex-wrap items-center gap-2">
  {#each variants as variant, i (variant.key)}
    {@const text = label(variant)}
    <button
      type="button"
      aria-pressed={selected === i}
      title={text}
      class={['max-w-full sm:max-w-xs truncate px-2.5 py-1 font-mono text-[11px] font-bold border transition-colors', selected === i
        ? (tone === 'orange' ? 'bg-orange-500 border-orange-500 text-black' : 'bg-amber-400 border-amber-500 text-black')
        : (tone === 'orange' ? 'bg-[#dce8f2] border-[#b0c4d8] text-[#0f2744] hover:border-orange-400' : 'bg-white border-amber-400 text-[#0f2744] hover:border-orange-500')]}
      onclick={() => onselect(i)}
    >{text}</button>
  {/each}
</div>
