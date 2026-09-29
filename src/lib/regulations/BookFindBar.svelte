<script lang="ts">
  import type { AdrBookViewerState } from './adrBookViewer.svelte'
  import { formatBookLabel, getBookLabel, HIT_LIMIT } from './bookTypes'

  let { viewer, notFound, fallbackFrom }: {
    viewer: AdrBookViewerState
    notFound: string | null
    fallbackFrom: string | null
  } = $props()

  const t = (key: string) => getBookLabel(viewer.lang, key)

  const chip = $derived.by(() => {
    const target = viewer.target
    if (target?.kind === 'sv') return formatBookLabel(viewer.lang, 'chipSv', { code: target.code })
    if (target?.kind === 'un') return formatBookLabel(viewer.lang, 'chipUn', { code: target.code })
    if (target?.kind === 'section') return formatBookLabel(viewer.lang, 'chipSection', { code: target.sectionNo })
    return null
  })

  const isCodeTarget = $derived(viewer.target?.kind === 'sv' || viewer.target?.kind === 'un')

  // Enter in the field goes to the next hit, like any find field; no other keys are bound (owner, 2026-09-29)
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void viewer.next()
    }
  }
</script>

<div class="sticky top-0 z-20 border-b border-[#c8d6e5] bg-[#f4f7fa]/95 backdrop-blur">
  <div class="max-w-7xl mx-auto px-4 py-2.5 space-y-1.5">
    <form role="search" class="flex flex-wrap items-center gap-2" onsubmit={event => event.preventDefault()}>
      <span class="font-mono text-xs font-bold text-[#0f2744] bg-white border border-[#c8d6e5] rounded px-2 py-1">ADR 2025</span>
      {#if chip}
        <span class="font-mono text-xs rounded-full bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1">{chip}</span>
      {/if}
      <label for="book-find" class="sr-only">{t('findLabel')}</label>
      <input
        id="book-find"
        type="search"
        autocomplete="off"
        value={viewer.term}
        placeholder={t('findPlaceholder')}
        oninput={event => viewer.setTerm(event.currentTarget.value)}
        {onkeydown}
        class="min-w-0 flex-1 sm:flex-none sm:w-64 rounded-lg border border-[#b0c4d8] bg-white px-3 py-1.5 text-sm text-[#0f2744] focus:outline-2 focus:outline-orange-500"
      />
      <button
        type="button"
        aria-label={t('prevHit')}
        disabled={!viewer.canNavigate}
        onclick={() => viewer.previous()}
        class="h-8 w-8 rounded-lg border border-[#b0c4d8] bg-white text-lg leading-none text-[#0f2744] hover:bg-[#e8eef5] disabled:opacity-40"
      >‹</button>
      <p aria-live="polite" aria-atomic="true" class="min-w-[7rem] text-center font-mono text-xs text-[#3d5a78]">
        {#if viewer.isLoading}{t('loading')}{:else}{viewer.counterLabel}{#if viewer.wrapped && viewer.counterLabel} · {t('wrapped')}{/if}{/if}
      </p>
      <button
        type="button"
        aria-label={t('nextHit')}
        disabled={!viewer.canNavigate}
        onclick={() => viewer.next()}
        class="h-8 w-8 rounded-lg border border-[#b0c4d8] bg-white text-lg leading-none text-[#0f2744] hover:bg-[#e8eef5] disabled:opacity-40"
      >›</button>
      {#if isCodeTarget}
        <label class="flex items-center gap-1.5 text-xs text-[#3d5a78]">
          <input
            type="checkbox"
            checked={viewer.includeIncidental}
            onchange={event => viewer.setIncludeIncidental(event.currentTarget.checked)}
          />
          {t('includeIncidental')}
        </label>
      {/if}
    </form>

    {#if notFound}
      <p class="text-sm text-amber-800">{formatBookLabel(viewer.lang, 'sectionNotFound', { code: notFound })}</p>
    {/if}
    {#if fallbackFrom && viewer.target?.kind === 'sv'}
      <p class="text-sm text-[#3d5a78]">{formatBookLabel(viewer.lang, 'parentFallback', { code: fallbackFrom, parent: viewer.target.code })}</p>
    {/if}
    {#if viewer.isCapped}
      <p class="text-sm text-amber-800">{formatBookLabel(viewer.lang, 'cappedNote', { limit: HIT_LIMIT })}</p>
    {/if}
    {#if viewer.loadFailed}
      <p class="text-sm text-red-700" role="alert">{t('loadFailed')}</p>
    {/if}

    <div class="flex flex-wrap items-start gap-x-4 gap-y-1 text-xs text-[#5a7a99]">
      {#if viewer.hits.length > 0}
        <details class="max-w-full">
          <summary class="cursor-pointer select-none text-[#0f2744]">{t('hitList')} ({viewer.hits.length})</summary>
          <div class="mt-1 max-h-80 overflow-y-auto rounded-lg border border-[#c8d6e5] bg-white p-2 w-[min(40rem,90vw)]">
            {#each viewer.hitsByChapter as group (group.label)}
              <details>
                <summary class="cursor-pointer py-0.5 font-semibold text-[#0f2744]">{group.label} ({group.count})</summary>
                <ul class="ml-3">
                  {#each group.entries as entry (entry.index)}
                    <li>
                      <button
                        type="button"
                        onclick={() => viewer.goTo(entry.index)}
                        aria-current={entry.index === viewer.currentIndex ? 'true' : undefined}
                        class={['w-full text-left rounded px-1.5 py-0.5 hover:bg-[#e8eef5]', entry.index === viewer.currentIndex && 'bg-orange-50']}
                      >{entry.hit.context}</button>
                    </li>
                  {/each}
                </ul>
              </details>
            {/each}
          </div>
        </details>
      {/if}
    </div>
  </div>
</div>
