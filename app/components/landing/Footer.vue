<template>
  <footer class="bg-white border-t border-slate-200" role="contentinfo">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
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
            <span class="font-bold text-base" style="color: #0f2744;">Gefahrgut<span style="color: #f97316;">Profi</span></span>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">Die Plattform für Gefahrgutbeauftragte in Deutschland und Europa.</p>
        </div>

        <!-- Link columns -->
        <div v-for="col in linkColumns" :key="col.heading">
          <h4 class="text-sm font-semibold mb-4" style="color: #0f2744;">{{ col.heading }}</h4>
          <ul class="space-y-2.5">
            <li v-for="link in col.links" :key="link.label">
              <a :href="link.href" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">{{ link.label }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-slate-400">© 2026 GefahrgutProfi. Datenbasis: BAM GEFAHRGUT, Lizenz dl-de/by-2-0.</p>
        <p class="text-xs text-slate-400">Kein Ersatz für rechtliche Beratung. Alle Angaben ohne Gewähr.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const linkColumns = [
  {
    heading: 'Produkt',
    links: [
      { label: 'Funktionen', href: '#features' },
      { label: 'Preise', href: '#pricing' },
      { label: 'Regelwerksvergleich', href: '#comparison' },
      { label: 'Änderungsmonitor', href: '#' },
    ],
  },
  {
    heading: 'Ressourcen',
    links: [
      { label: 'Dokumentation', href: '#' },
      { label: 'ADR-Leitfaden', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'BAM-Datenbasis', href: '#' },
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { label: 'Impressum', href: '#' },
      { label: 'Datenschutz', href: '#' },
      { label: 'AGB', href: '#' },
    ],
  },
]
</script>
