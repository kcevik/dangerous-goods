<script lang="ts">
  import { resolve } from '$app/paths'
  import { BLOG_URL } from '$lib/legal'
  import { signupCtaLabel } from '$lib/prelaunch/copy'
  import BurgerMenu from '$lib/nav/BurgerMenu.svelte'

  let { registrationOpen = false }: { registrationOpen?: boolean } = $props()

  const NAV_ITEMS = [
    { label: 'Funktionen', href: '#features' },
    { label: 'Regelwerke', href: '#comparison' },
    { label: 'Blog', href: BLOG_URL },
  ]
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between gap-3 h-16">
      <!-- Logo -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: #0f2744;">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="font-bold text-lg" style="color: #0f2744;">gefahrgut<span style="color: #f97316;">.org</span></span>
      </div>

      <!-- Desktop Nav (from lg: logo + links + Anmelden + the long CTA overflow at 768px) -->
      <nav class="hidden lg:flex items-center gap-8" aria-label="Hauptnavigation">
        {#each NAV_ITEMS as item (item.href)}
          <a href={item.href} class="text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">{item.label}</a>
        {/each}
      </nav>

      <!-- CTA -->
      <div class="flex items-center gap-3">
        <a href={resolve('/(auth)/login')} class="hidden lg:block whitespace-nowrap text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Anmelden</a>
        <a
          href={resolve('/(auth)/registrieren')}
          class="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
          style="background: #f97316;"
          onmouseenter={(e) => { e.currentTarget.style.background = '#ea580c' }}
          onmouseleave={(e) => { e.currentTarget.style.background = '#f97316' }}
        >
          {signupCtaLabel(registrationOpen)}
        </a>
        <BurgerMenu id="landing-menu" breakpoint="lg">
          <nav class="px-4 sm:px-6 py-2 flex flex-col" aria-label="Hauptnavigation mobil">
            {#each NAV_ITEMS as item (item.href)}
              <a href={item.href} class="py-3 text-sm font-medium text-slate-700 hover:text-[#0f2744] border-b border-slate-100">{item.label}</a>
            {/each}
            <a href={resolve('/(auth)/login')} class="py-3 text-sm font-medium text-slate-700 hover:text-[#0f2744]">Anmelden</a>
          </nav>
          <div class="px-4 sm:px-6 pb-4 sm:hidden">
            <a
              href={resolve('/(auth)/registrieren')}
              class="flex justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#f97316] hover:bg-[#ea580c]"
            >
              {signupCtaLabel(registrationOpen)}
            </a>
          </div>
        </BurgerMenu>
      </div>
    </div>
  </div>
</header>
