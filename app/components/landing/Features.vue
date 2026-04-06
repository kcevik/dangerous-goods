<template>
  <section id="features" class="py-20 lg:py-28 bg-white" aria-labelledby="features-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #f97316; background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.2);">
          Funktionen
        </div>
        <h2 id="features-heading" class="text-3xl sm:text-4xl font-bold mb-4" style="color: #0f2744;">
          Eine Plattform. Alle Werkzeuge.
        </h2>
        <p class="text-lg text-slate-500 max-w-2xl mx-auto">
          Spezialisierte Tools für jeden Aspekt der Gefahrgutarbeit – nahtlos integriert in einer Oberfläche.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
          :class="`hover:border-[${feature.color}]`"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200"
            :style="`background: ${feature.bgColor};`"
            :class="`group-hover:bg-[${feature.color}]`"
          >
            <svg
              class="w-6 h-6 transition-colors duration-200 group-hover:text-white"
              :style="`color: ${feature.color};`"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="feature.icon"/>
            </svg>
          </div>
          <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">{{ feature.title }}</h3>
          <p class="text-slate-500 text-sm leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: 'Stoffsuche',
    description: '2.347+ Stoffe sofort abrufbar – nach UN-Nummer, Name oder Synonym, mit vollständigen Regelwerksdaten.',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    color: '#15779b',
    bgColor: 'rgba(21,119,155,0.1)',
  },
  {
    title: 'Rechenwerkzeuge',
    description: 'Rechenwerkzeuge für Freistellungen, Beförderungskategorien und Mengengrenzen – zuverlässig und normkonform.',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.1)',
  },
  {
    title: 'Dokumentengenerator',
    description: 'Transportdokumente auf Knopfdruck – rechtssicher, vollständig und sofort exportierbar.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#15779b',
    bgColor: 'rgba(21,119,155,0.1)',
  },
  {
    title: 'Freistellungsrechner',
    description: 'LQ, EQ und weitere Freistellungstatbestände direkt prüfen – trägerübergreifend und regelwerkskonform.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.1)',
  },
  {
    title: 'Änderungsmonitor',
    description: 'Regelwerksänderungen im Blick – automatisch, strukturiert und mit direktem Bezug zu betroffenen Stoffen.',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    color: '#15779b',
    bgColor: 'rgba(21,119,155,0.1)',
  },
  {
    title: 'Favoritenliste',
    description: 'Häufig genutzte Stoffe und Dokumente merken – für schnellen Zugriff ohne erneute Suche.',
    icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.1)',
  },
]
</script>
