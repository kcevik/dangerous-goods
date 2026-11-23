<script lang="ts">
  import type { Snippet } from 'svelte'
  import { afterNavigate } from '$app/navigation'
  import { MenuState } from './menu.svelte'

  let {
    id,
    tone = 'light',
    breakpoint = 'md',
    children,
  }: {
    /** id of the panel, referenced by the button's aria-controls */
    id: string
    /** 'dark' for the navy app header, 'light' for the white landing header */
    tone?: 'light' | 'dark'
    /** from this breakpoint up the burger is hidden and the header shows its inline nav */
    breakpoint?: 'md' | 'lg'
    /** panel content: links and, in the app, the logout form */
    children: Snippet
  } = $props()

  const menu = new MenuState()
  let root = $state<HTMLDivElement>()
  let button = $state<HTMLButtonElement>()

  afterNavigate(() => menu.close())

  function onKeydown(event: KeyboardEvent) {
    if (menu.handleKeydown(event)) button?.focus()
  }
</script>

<svelte:window onkeydown={onKeydown} />
<svelte:document onpointerdown={(event) => menu.handleOutsidePress(event.target, root)} />

<!--
  Only the burger is shown below the breakpoint; the panel is positioned against
  the nearest positioned ancestor (the header), so the header must be `relative`
  or `fixed`. Both class names are written out in full so Tailwind sees them.
-->
<div bind:this={root} class={breakpoint === 'lg' ? 'lg:hidden' : 'md:hidden'}>
  <button
    bind:this={button}
    type="button"
    class={[
      'inline-flex items-center justify-center w-11 h-11 -mr-2.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2',
      tone === 'dark'
        ? 'text-slate-200 hover:bg-white/10 hover:text-white focus-visible:outline-white'
        : 'text-[#0f2744] hover:bg-slate-100 focus-visible:outline-[#0f2744]',
    ]}
    aria-expanded={menu.open}
    aria-controls={id}
    aria-label={menu.buttonLabel}
    onclick={() => menu.toggle()}
  >
    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      {#if menu.open}
        <path d="M6 6l12 12M18 6L6 18" />
      {:else}
        <path d="M4 7h16M4 12h16M4 17h16" />
      {/if}
    </svg>
  </button>

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (delegated: closes after a link inside was activated) -->
  <div
    {id}
    hidden={!menu.open}
    class={[
      'absolute left-0 right-0 top-full z-50 border-b shadow-lg',
      tone === 'dark' ? 'bg-[#0f2744] border-white/10' : 'bg-white border-slate-200',
    ]}
    onclick={(event) => menu.handlePanelClick(event.target)}
  >
    {@render children()}
  </div>
</div>
