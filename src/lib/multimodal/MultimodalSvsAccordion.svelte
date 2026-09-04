<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { getSpecialProvision, loadSpecialProvision } from './specialProvisions.svelte'
  import { DEMO_SVS, type Lang, type Modal } from './types'

  interface Props {
    svs: string
    label: string
    noText: string
    clickLoad: string
    /** When true, uses hardcoded DEMO_SVS instead of Supabase */
    demo?: boolean
    /** Transport mode the SV codes belong to — required for live lookup */
    mode?: Modal
    lang?: Lang
    supabase?: SupabaseClient
  }

  let { svs, label, noText, clickLoad, demo = false, mode = 'ADR', lang = 'de', supabase }: Props = $props()

  let open = $state<Record<string, boolean>>({})

  const nrs = $derived(svs.split(',').map(s => s.trim()).filter(Boolean))

  function text(nr: string): string {
    if (demo) return DEMO_SVS[nr] ?? noText
    const sv = getSpecialProvision(mode, nr)
    if (sv === undefined) return '…'
    if (sv === null) return noText
    // language preference mirrors getName(): tr users read English before German
    if (lang === 'en' || lang === 'tr') return sv.textEn ?? sv.textDe ?? sv.textFr ?? noText
    if (lang === 'fr') return sv.textFr ?? sv.textEn ?? sv.textDe ?? noText
    return sv.textDe ?? sv.textEn ?? sv.textFr ?? noText
  }

  function preview(nr: string): string {
    if (open[nr]) return ''
    const t = text(nr)
    if (!t || t === noText || t === '…') return clickLoad
    return t.length > 80 ? t.substring(0, 80) + '…' : t
  }

  function toggle(nr: string) {
    open[nr] = !open[nr]
    if (open[nr] && !demo && supabase) loadSpecialProvision(supabase, mode, nr)
  }

  // rows stay open across mode/UN switches — fetch their texts for the new context,
  // otherwise they would be stuck on the "…" loading placeholder
  $effect(() => {
    if (demo || !supabase) return
    for (const nr of nrs) {
      if (open[nr]) loadSpecialProvision(supabase, mode, nr)
    }
  })
</script>

{#if nrs.length}
  <div class="mt-5">
    <div class="font-mono text-[10px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2 pb-1.5 border-b border-[#c8d6e5]">
      {label} ({svs})
    </div>
    <div class="flex flex-col gap-1.5">
      {#each nrs as nr (nr)}
        <div class="border border-[#c8d6e5] bg-[#f4f7fa]">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#dce8f2] transition-colors cursor-pointer select-none"
            onclick={() => toggle(nr)}
          >
            <span class="font-mono text-xs font-bold text-orange-500 min-w-[44px]">SV {nr}</span>
            <span class="flex-1 text-[11px] text-[#5a7a99] truncate">{preview(nr)}</span>
            <span
              class={['font-mono text-[11px] text-[#5a7a99] flex-shrink-0 transition-transform duration-200', { 'rotate-180': open[nr] }]}
            >▼</span>
          </button>
          {#if open[nr]}
            <div class="px-3.5 py-3 border-t border-[#c8d6e5] text-[13px] leading-relaxed text-[#2d5070] whitespace-pre-wrap">{text(nr)}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
