<script lang="ts">
  import { untrack } from 'svelte'
  import type { Attachment } from 'svelte/attachments'
  import { replaceState } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { AdrBookViewerState, type ViewerDeps } from './adrBookViewer.svelte'
  import BookAttribution from './BookAttribution.svelte'
  import BookFindBar from './BookFindBar.svelte'
  import { clearMarks, keepListedMarks, markMatches, setActiveMark } from './bookHighlighter'
  import BookToc from './BookToc.svelte'
  import { type BookPageData, getBookLabel, MIN_BOOK_QUERY_LENGTH, type TocEntry } from './bookTypes'
  import BookWindow from './BookWindow.svelte'

  let { data, deps }: { data: Extract<BookPageData, { locked: false }>, deps: ViewerDeps } = $props()

  const viewer = untrack(() => new AdrBookViewerState({
    target: data.target,
    term: data.term,
    hits: data.hits,
    totalHits: data.totalHits,
    capped: data.capped,
    windows: data.windows,
    currentIndex: data.currentIndex,
    includeIncidental: data.includeIncidental,
    totalLines: data.totalLines,
  }, deps))

  const t = (key: string) => getBookLabel(viewer.lang, key)

  let content: HTMLElement | undefined = $state()
  /** phones only: the TOC starts closed so the text is on the first screen; md+ always shows it */
  let tocOpen = $state(false)
  /** the sticky find bar's height; anchors scroll to just below it */
  let barHeight = $state(0)

  // ── highlighting and scrolling ─────────────────────────────

  function prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * `start` puts the target right under the find bar (its `scroll-margin-top`
   * follows the bar's measured height): a provision, a UN row or a section opens
   * at the top of the view. Free-text hits are centred, with context above.
   */
  function scrollToElement(el: Element | null, focus = false, block: ScrollLogicalPosition = 'start') {
    if (!el) return
    // The bar's height right now, not a CSS variable that may not have caught up
    // yet: on first load the scroll starts before the bar's height is known, and
    // a phone's bar (chip, navigation, checkbox, hit list) is over 200px tall.
    const bar = document.querySelector<HTMLElement>('[data-book-bar]')?.offsetHeight ?? 0
    if (el instanceof HTMLElement && bar > 0) el.style.scrollMarginTop = `${bar + 12}px`
    el.scrollIntoView?.({ block, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    // move focus to the hit (spec §10) — but never out of a field the reader is
    // typing in or pressing Enter in, or their next keystrokes would be lost
    const typing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement
    if (focus && !typing && el instanceof HTMLElement) el.focus({ preventScroll: true })
  }

  /**
   * The element for a `?section=` line. Looked up in the loaded windows' own
   * headings, not in `data.toc`: the TOC stops at level 3 while most sections
   * (`1.1.3.6.3` …) are deeper. A block tagged with the line is the fallback.
   */
  function focusTarget(root: HTMLElement, line: number): Element | null {
    const heading = viewer.windows.flatMap(w => w.headings).find(entry => entry.line === line)
    const byId = heading ? document.getElementById(heading.slug) : null
    return byId ?? root.querySelector(`.book-ln-${line}`)
  }

  // not reactive: remembers what was last scrolled to, so re-marking after a
  // window loads while reading does not yank the page back to the hit
  let scrolledFor = ''

  $effect(() => {
    const root = content
    const term = viewer.term.trim()
    const target = viewer.target
    const hits = viewer.hits
    const index = viewer.currentIndex
    void viewer.windows.length
    if (!root) return

    clearMarks(root)
    const wholeToken = target?.kind === 'sv' || target?.kind === 'un'
    const found = term.length >= MIN_BOOK_QUERY_LENGTH ? markMatches(root, term, { wholeToken }) : []
    // only the matches the hit list names stay highlighted, so the counter and
    // the marks can never disagree (see keepListedMarks)
    const { marks, markOfHit } = keepListedMarks(found, hits)
    const active = markOfHit[index] ?? -1
    setActiveMark(marks, active)

    const key = `${term}|${hits.length}|${index}|${hits[0]?.line ?? ''}`
    if (key === scrolledFor) return
    if (active >= 0) {
      // only now is the position settled; a hit whose window is still loading
      // must be scrolled to when it arrives, so the key is not consumed earlier
      scrolledFor = key
      const mark = marks[active]!
      mark.tabIndex = -1
      const fromCode = target?.kind === 'sv' || target?.kind === 'un'
      // a code target lands with its paragraph at the top: the mark's block, not the mark
      const anchor = fromCode ? (mark.closest('li, p, tr, h1, h2, h3, h4, h5, h6') ?? mark) : mark
      scrollToElement(anchor, false, fromCode ? 'start' : 'center')
      if (mark instanceof HTMLElement && !(document.activeElement instanceof HTMLInputElement)) mark.focus({ preventScroll: true })
    }
    else if (target?.kind === 'section' && data.focusLine !== null) {
      scrolledFor = key
      scrollToElement(focusTarget(root, data.focusLine))
    }
  })

  // ── shareable URL ──────────────────────────────────────────

  let lastUrl: string | null = null

  $effect(() => {
    const params = new URLSearchParams()
    const target = viewer.target
    if (target?.kind === 'sv' || target?.kind === 'un') params.set(target.kind, target.code)
    else if (target?.kind === 'section') params.set('section', target.sectionNo)
    else if (viewer.term.trim().length >= MIN_BOOK_QUERY_LENGTH) params.set('q', viewer.term.trim())
    if (viewer.currentIndex > 0) params.set('hit', String(viewer.currentIndex + 1))
    if (viewer.includeIncidental) params.set('all', '1')
    const query = params.toString()

    if (lastUrl === null) {
      lastUrl = query
      return
    }
    if (query === lastUrl) return
    lastUrl = query
    try {
      replaceState(`${resolve('/(app)/regelwerk/[mode=bookMode]', { mode: data.mode })}${query ? `?${query}` : ''}`, {})
    }
    catch {
      // the router is not ready yet (first render); the next change syncs it
    }
  })

  // ── navigation helpers ─────────────────────────────────────

  async function openTocEntry(entry: TocEntry) {
    // on a phone the open TOC would cover the text the reader just asked for
    tocOpen = false
    if (!(await viewer.ensureLineLoaded(entry.line))) return
    // the window renders on the next frame
    requestAnimationFrame(() => scrollToElement(document.getElementById(entry.slug)))
  }

  /** Loads the next window when the end of the loaded text comes near. */
  const readAhead: Attachment = (el) => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) void viewer.loadAdjacent(1)
    }, { rootMargin: '600px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }

  const atStart = $derived((viewer.windows[0]?.lineStart ?? 1) <= 1)
  const atEnd = $derived((viewer.windows.at(-1)?.lineEnd ?? 0) >= viewer.totalLines)
</script>

<div style:--book-bar="{barHeight}px">
  <a href="#book-content" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:rounded focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm">
    {t('skipToContent')}
  </a>

  <BookFindBar {viewer} notFound={data.notFound} fallbackFrom={data.fallbackFrom} bind:barHeight />

  <div class="max-w-7xl mx-auto px-4 py-4 md:py-6 md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:gap-8">
    <aside class="mb-4 md:mb-0">
      <div class="book-toc-panel md:sticky md:overflow-y-auto">
        <button
          type="button"
          class="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-[#c8d6e5] bg-white px-3 text-sm font-semibold text-[#0f2744] md:hidden"
          aria-expanded={tocOpen}
          aria-controls="book-toc"
          onclick={() => (tocOpen = !tocOpen)}
        >
          {t('toc')}
          <span aria-hidden="true" class={['inline-block transition-transform', tocOpen && 'rotate-180']}>▾</span>
        </button>
        <p class="mb-2 hidden text-xs font-mono font-bold uppercase tracking-wider text-[#5a7a99] md:block">{t('toc')}</p>
        <div
          id="book-toc"
          class={[
            'mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-[#c8d6e5] bg-white p-2',
            'md:mt-0 md:block md:max-h-none md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0',
            !tocOpen && 'hidden',
          ]}
        >
          <BookToc toc={data.toc} lang={viewer.lang} onnavigate={openTocEntry} />
        </div>
      </div>
    </aside>

    <main id="book-content" tabindex="-1" lang="de" class="book-content min-w-0 focus:outline-none" bind:this={content}>
      <p class="mb-4 text-xs text-[#5a7a99]">{t('germanOnly')}</p>

      {#if viewer.isOverloaded}
        <div class="mb-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <span>{t('tooManySections')}</span>
          <button type="button" class="underline" onclick={() => viewer.reset()}>{t('resetView')}</button>
        </div>
      {/if}

      {#if !atStart}
        <button type="button" class="mb-4 text-sm text-[#3d5a78] underline hover:text-orange-600" disabled={viewer.isLoading} onclick={() => viewer.loadAdjacent(-1)}>
          {t('loadPrevious')}
        </button>
      {/if}

      {#each viewer.windows as bookWindow, i (bookWindow.lineStart)}
        <BookWindow window={bookWindow} />
        {#if viewer.windows[i + 1] && viewer.windows[i + 1]!.lineStart > bookWindow.lineEnd + 1}
          <div class="my-6 flex items-center gap-3 text-xs text-[#5a7a99]">
            <span class="h-px flex-1 bg-[#c8d6e5]"></span>
            <button type="button" class="underline hover:text-orange-600" disabled={viewer.isLoading} onclick={() => viewer.loadGapAfter(i)}>{t('loadGap')}</button>
            <span class="h-px flex-1 bg-[#c8d6e5]"></span>
          </div>
        {/if}
      {/each}

      {#if !atEnd}
        <div {@attach readAhead}>
          <button type="button" class="mt-4 text-sm text-[#3d5a78] underline hover:text-orange-600" disabled={viewer.isLoading} onclick={() => viewer.loadAdjacent(1)}>
            {t('loadNext')}
          </button>
        </div>
      {/if}

      <BookAttribution lang={viewer.lang} />
    </main>
  </div>
</div>

<style>
  /* The book HTML is rendered at runtime, so it is styled here with :global and
     book-* / element selectors — never with Tailwind utilities (spec §2.4). */
  .book-content :global(.book-window) {
    max-width: 78ch;
    overflow-wrap: anywhere; /* long URLs (footnote 1.9.5) must not widen the page */
    color: #0f2744;
    font-size: 15px;
    line-height: 1.65;
  }
  .book-content :global(.book-window p) { margin: 0 0 0.75em; }
  .book-content :global(.book-window h1),
  .book-content :global(.book-window h2),
  .book-content :global(.book-window h3),
  .book-content :global(.book-window h4),
  .book-content :global(.book-window h5),
  .book-content :global(.book-window h6) {
    font-weight: 700;
    margin: 1.4em 0 0.5em;
    scroll-margin-top: calc(var(--book-bar, 7rem) + 0.75rem);
  }
  .book-content :global(.book-window h1) { font-size: 1.6em; }
  .book-content :global(.book-window h2) { font-size: 1.35em; }
  .book-content :global(.book-window h3) { font-size: 1.15em; }
  .book-content :global(.book-window h4),
  .book-content :global(.book-window h5),
  .book-content :global(.book-window h6) { font-size: 1em; }
  .book-content :global(.book-window ul) { list-style: disc; padding-left: 1.5em; margin: 0 0 0.75em; }
  .book-content :global(.book-window ol) { list-style: decimal; padding-left: 1.5em; margin: 0 0 0.75em; }

  /* wide tables scroll inside their own container, never the page */
  .book-content :global(.book-table-scroll) {
    max-width: none;
    width: 100%;
    overflow-x: auto;
    margin: 0 0 1em;
    border: 1px solid #c8d6e5;
    border-radius: 0.5rem;
  }
  .book-content :global(.book-table-scroll:focus-visible) { outline: 2px solid #f97316; outline-offset: 2px; }
  .book-content :global(.book-window table) { border-collapse: collapse; font-size: 12.5px; line-height: 1.4; }
  .book-content :global(.book-window th),
  .book-content :global(.book-window td) {
    border: 1px solid #c8d6e5;
    padding: 0.3em 0.5em;
    vertical-align: top;
    text-align: left;
  }
  .book-content :global(.book-window th) { background: #f4f7fa; font-weight: 600; }
  .book-content :global(.book-window:has(.book-table-scroll)) { max-width: none; }

  .book-content :global(.book-figure-missing) {
    display: inline-block;
    font-size: 0.85em;
    color: #5a7a99;
    border: 1px dashed #b0c4d8;
    border-radius: 0.25rem;
    padding: 0.1em 0.4em;
  }

  /* find-in-page marks: both states ≥ 4.5:1, active also outlined (spec §5.3) */
  .book-content :global(mark.book-hit) {
    background: #fde68a;
    color: #0f2744;
    border-radius: 2px;
    scroll-margin-top: calc(var(--book-bar, 7rem) + 0.75rem);
  }
  /* the block a provision or UN row is scrolled to, and any tagged block */
  .book-content :global(li),
  .book-content :global(p),
  .book-content :global(tr) {
    scroll-margin-top: calc(var(--book-bar, 7rem) + 0.75rem);
  }

  /* the desktop TOC sticks just below the find bar */
  @media (min-width: 48rem) {
    .book-toc-panel {
      top: calc(var(--book-bar, 7rem) + 1rem);
      max-height: calc(100vh - var(--book-bar, 7rem) - 2rem);
    }
  }
  .book-content :global(mark.book-hit-active) {
    background: #f97316;
    color: #0b1b2e;
    outline: 2px solid #0f2744;
  }

  @media (prefers-reduced-motion: reduce) {
    .book-content :global(*) { scroll-behavior: auto; transition: none; }
  }
</style>
