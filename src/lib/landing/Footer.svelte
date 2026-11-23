<script lang="ts">
  import { resolve } from '$app/paths'
  import { BLOG_URL, LEGAL_LINKS } from '$lib/legal'
  import { signupCtaLabel } from '$lib/prelaunch/copy'
  import { DATA_SOURCE_LABEL } from './siteFacts'

  let { registrationOpen = false }: { registrationOpen?: boolean } = $props()

  // every link has a real target: an in-page section, an app route, the blog or a legal page
  const linkColumns = $derived([
    {
      heading: 'Produkt',
      links: [
        { label: 'Funktionen', href: '#features' },
        { label: signupCtaLabel(registrationOpen), href: resolve('/(auth)/registrieren') },
        { label: 'Regelwerksvergleich', href: '#comparison' },
        { label: 'Demo', href: '#demo' },
      ],
    },
    {
      heading: 'Ressourcen',
      links: [
        { label: 'Häufige Fragen', href: '#faq' },
        { label: 'Datenbasis', href: '#datenbasis' },
        { label: 'Blog', href: BLOG_URL },
      ],
    },
    {
      heading: 'Rechtliches',
      links: [...LEGAL_LINKS],
    },
  ])
</script>

<footer class="bg-white border-t border-slate-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 sm:gap-8 mb-10">
      <!-- Brand -->
      <div class="col-span-2 md:col-span-1">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: #0f2744;">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="font-bold text-base" style="color: #0f2744;">gefahrgut<span style="color: #f97316;">.org</span></span>
        </div>
        <p class="text-sm text-slate-400 leading-relaxed">Die Plattform für Gefahrgutbeauftragte in Deutschland und Europa.</p>
      </div>

      <!-- Link columns -->
      {#each linkColumns as col (col.heading)}
        <div class="min-w-0">
          <h4 class="text-sm font-semibold mb-4" style="color: #0f2744;">{col.heading}</h4>
          <ul class="lg:space-y-2.5">
            {#each col.links as link (link.label)}
              <li>
                <a href={link.href} class="inline-flex min-h-11 min-w-11 lg:min-h-0 items-center lg:py-0.5 text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer break-words">{link.label}</a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>

    <div class="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <p class="text-xs text-slate-400">© 2026 gefahrgut.org. Datenbasis: {DATA_SOURCE_LABEL}, Lizenz dl-de/by-2-0.</p>
      <p class="text-xs text-slate-400">Kein Ersatz für rechtliche Beratung. Alle Angaben ohne Gewähr.</p>
    </div>
  </div>
</footer>
