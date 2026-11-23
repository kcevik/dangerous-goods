<script lang="ts">
  import type { Attachment } from 'svelte/attachments'
  import type { AdrBookViewerState } from './adrBookViewer.svelte'
  import { formatBookLabel, getBookLabel, HIT_LIMIT } from './bookTypes'

  let { viewer, notFound, fallbackFrom, barHeight = $bindable(0) }: {
    viewer: AdrBookViewerState
    notFound: string | null
    fallbackFrom: string | null
    /** the bar's rendered height, so anchors can scroll to just below it */
    barHeight?: number
  } = $props()

  const t = (key: string) => getBookLabel(viewer.lang, key)

  /** Reports the bar's height (it wraps on phones); without ResizeObserver the CSS fallback applies. */
  const measure: Attachment<HTMLElement> = (el) => {
    barHeight = el.offsetHeight
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => (barHeight = el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }

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

<div class="sticky top-0 z-20 border-b border-[#c8d6e5] bg-[#f4f7fa]/95 backdrop-blur" data-book-bar {@attach measure}>
  <div class="max-w-7xl mx-auto px-4 py-2 space-y-1.5">
    <!-- Phones: the field gets its own full-width row, navigation the next one.
         From sm up both wrappers dissolve (sm:contents) into one row. -->
    <form role="search" class="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2" onsubmit={event => event.preventDefault()}>
      <div class="flex min-w-0 items-center gap-2 sm:contents">
        {#if chip}
          <span class="shrink-0 font-mono text-xs rounded-full bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1">{chip}</span>
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
          class="h-11 min-w-0 flex-1 sm:w-64 sm:flex-none rounded-lg border border-[#b0c4d8] bg-white px-3 text-base sm:text-sm text-[#0f2744] focus:outline-2 focus:outline-orange-500"
        />
      </div>
      <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:contents">
        <span class="shrink-0 sm:order-first font-mono text-xs font-bold text-[#0f2744] bg-white border border-[#c8d6e5] rounded px-2 py-1">ADR 2025</span>
        <div class="ml-auto flex min-w-0 flex-1 items-center gap-1 sm:ml-0 sm:flex-none">
          <button
            type="button"
            aria-label={t('prevHit')}
            disabled={!viewer.canNavigate}
            onclick={() => viewer.previous()}
            class="h-11 w-11 shrink-0 rounded-lg border border-[#b0c4d8] bg-white text-xl leading-none text-[#0f2744] hover:bg-[#e8eef5] disabled:opacity-40"
          >‹</button>
          <p aria-live="polite" aria-atomic="true" class="min-w-0 flex-1 sm:flex-none sm:min-w-[8rem] text-center text-xs leading-tight text-[#3d5a78] sm:font-mono">{viewer.statusLabel}</p>
          <button
            type="button"
            aria-label={t('nextHit')}
            disabled={!viewer.canNavigate}
            onclick={() => viewer.next()}
            class="h-11 w-11 shrink-0 rounded-lg border border-[#b0c4d8] bg-white text-xl leading-none text-[#0f2744] hover:bg-[#e8eef5] disabled:opacity-40"
          >›</button>
        </div>
        {#if isCodeTarget}
          <label class="flex min-h-11 w-full sm:w-auto cursor-pointer items-center gap-2 text-xs text-[#3d5a78]">
            <input
              type="checkbox"
              class="h-4 w-4"
              checked={viewer.includeIncidental}
              onchange={event => viewer.setIncludeIncidental(event.currentTarget.checked)}
            />
            {t('includeIncidental')}
          </label>
        {/if}
      </div>
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
    {#if viewer.searchFailed}
      <p class="text-sm text-red-700" role="alert">{t('searchFailed')}</p>
    {/if}

    {#if viewer.hits.length > 0}
      <details class="group max-w-full text-xs text-[#5a7a99]">
        <summary class="flex min-h-11 sm:min-h-8 cursor-pointer select-none list-none items-center gap-1.5 text-[#0f2744] [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" class="inline-block transition-transform group-open:rotate-90">▸</span>
          {t('hitList')} ({viewer.hits.length})
        </summary>
        <div class="mt-1 max-h-[50vh] sm:max-h-80 overflow-y-auto rounded-lg border border-[#c8d6e5] bg-white p-2 w-full sm:w-[min(40rem,90vw)]">
          {#each viewer.hitsByChapter as group (group.label)}
            <details>
              <summary class="cursor-pointer py-2 sm:py-0.5 font-semibold text-[#0f2744]">{group.label} ({group.count})</summary>
              <ul class="ml-3">
                {#each group.entries as entry (entry.index)}
                  <li>
                    <button
                      type="button"
                      onclick={() => viewer.goTo(entry.index)}
                      aria-current={entry.index === viewer.currentIndex ? 'true' : undefined}
                      class={['w-full min-h-11 sm:min-h-0 text-left rounded px-1.5 py-1 sm:py-0.5 hover:bg-[#e8eef5]', entry.index === viewer.currentIndex && 'bg-orange-50']}
                    >{#if entry.section}<span class="font-mono font-semibold text-[#0f2744]">{entry.section}</span> · {/if}{entry.hit.context}</button>
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
