<script lang="ts">
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import LegalLinks from '$lib/legalPages/LegalLinks.svelte'
  import BurgerMenu from '$lib/nav/BurgerMenu.svelte'
  import { APP_NAV_ITEMS } from '$lib/nav/appNav'
  import UpsellBanner from '$lib/upsell/UpsellBanner.svelte'
  import UpsellModal from '$lib/upsell/UpsellModal.svelte'

  let { data, children } = $props()
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-[#e8eef5]">
  <header class="relative bg-[#0f2744] text-white">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
      <a href={resolve('/(app)/dashboard')} class="inline-flex items-center min-h-11 font-bold text-base shrink-0">gefahrgut<span style="color: #f97316;">.org</span></a>
      <nav class="hidden md:flex items-center gap-4 text-sm" aria-label="Hauptnavigation">
        {#each APP_NAV_ITEMS as item (item.href)}
          <a href={item.href} class="inline-flex items-center justify-center min-h-11 min-w-11 text-slate-300 hover:text-white transition-colors whitespace-nowrap">{item.label}</a>
        {/each}
      </nav>
      <div class="ml-auto hidden md:flex items-center gap-4 text-sm min-w-0">
        <span class="text-slate-400 hidden lg:inline truncate max-w-[220px]">{data.user?.email}</span>
        <form method="POST" action={resolve('/logout')} class="shrink-0">
          <button type="submit" class="inline-flex items-center min-h-11 text-slate-300 hover:text-white transition-colors underline-offset-2 hover:underline whitespace-nowrap cursor-pointer">Abmelden</button>
        </form>
      </div>
      <div class="ml-auto md:hidden">
        <BurgerMenu id="app-menu" tone="dark">
          <nav class="px-4 py-2 flex flex-col text-sm" aria-label="Hauptnavigation mobil">
            {#each APP_NAV_ITEMS as item (item.href)}
              <a href={item.href} class="py-3 text-slate-200 hover:text-white border-b border-white/10">{item.label}</a>
            {/each}
          </nav>
          <div class="px-4 pt-2 pb-4 flex flex-col gap-2 text-sm">
            {#if data.user?.email}
              <span class="text-slate-400 truncate">Angemeldet als {data.user.email}</span>
            {/if}
            <form method="POST" action={resolve('/logout')}>
              <button type="submit" class="w-full text-left py-2 text-slate-200 hover:text-white cursor-pointer">Abmelden</button>
            </form>
          </div>
        </BurgerMenu>
      </div>
    </div>
  </header>

  {#if !data.isActive}
    <UpsellBanner />
    <UpsellModal isActive={data.isActive} pathname={page.url.pathname} />
  {/if}

  <div class="flex-1">
    {@render children()}
  </div>

  <footer class="border-t border-[#c8d6e5] py-2 px-4">
    <LegalLinks />
  </footer>
</div>
