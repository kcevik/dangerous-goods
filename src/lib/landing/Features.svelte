<script lang="ts">
  import { SITE_FACTS } from './siteFacts'

  // Shipped tools render as live cards; tools still being built keep the grayed-out
  // "Demnächst verfügbar" card. Descriptions say only what the tool does today.
  const features = [
    {
      title: 'Stoffsuche',
      available: true,
      description: `Alle ${SITE_FACTS.unNumbers} UN-Nummern nach Nummer oder Stoffbezeichnung durchsuchen – mit den Angaben aus ADR, RID, IMDG und ICAO.`,
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      color: '#15779b',
      bgColor: 'rgba(21,119,155,0.1)',
    },
    {
      title: 'Regelwerksvergleich',
      available: true,
      description: 'Eine UN-Nummer, vier Regelwerke nebeneinander – Abweichungen bei Klasse, Verpackungsgruppe, Mengengrenzen und mehr werden markiert.',
      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.1)',
    },
    {
      title: 'ADR im Volltext',
      available: true,
      description: 'Das ADR als durchsuchbarer Lesetext, mit Sprung zu Sondervorschriften. Hilfsmittel, kein rechtsverbindlicher Text – maßgeblich ist die amtliche Fassung.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      color: '#15779b',
      bgColor: 'rgba(21,119,155,0.1)',
    },
    {
      title: '1000-Punkte-Rechner',
      available: true,
      description: 'Punkte einer gemischten Ladung nach ADR 1.1.3.6 berechnen – Beförderungskategorie und Faktor aus den BAM-Daten, Ergebnis je Beförderungseinheit und ein Ausdruck für die Akte.',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.1)',
    },
    {
      title: 'LQ/EQ-Rechner',
      available: false,
      description: 'Prüfung begrenzter und freigestellter Mengen (LQ/EQ) je Verpackung und Versandstück.',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.1)',
    },
    {
      title: 'Dokumentengenerator',
      available: false,
      description: 'Beförderungspapiere aus den Stoffdaten vorbereiten – als Entwurf, den du vor dem Versand prüfst.',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: '#15779b',
      bgColor: 'rgba(21,119,155,0.1)',
    },
  ]
</script>

<section id="features" class="py-16 sm:py-20 lg:py-28 bg-white" aria-labelledby="features-heading">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-10 sm:mb-12 lg:mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #f97316; background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.2);">
        Funktionen
      </div>
      <h2 id="features-heading" class="text-2xl min-[375px]:text-3xl sm:text-4xl font-bold mb-4 break-words hyphens-auto" style="color: #0f2744;">
        Eine Plattform für deine Gefahrgutarbeit
      </h2>
      <p class="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
        Was heute schon geht – und was als Nächstes kommt.
      </p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {#each features as feature (feature.title)}
        {#if feature.available}
          <div
            class={['group rounded-2xl p-6 sm:p-8 border border-slate-200 hover:shadow-lg transition-all duration-200', `hover:border-[${feature.color}]`]}
          >
            <div
              class={['w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200', `group-hover:bg-[${feature.color}]`]}
              style={`background: ${feature.bgColor};`}
            >
              <svg
                class="w-6 h-6 transition-colors duration-200 group-hover:text-white"
                style={`color: ${feature.color};`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon}/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">{feature.title}</h3>
            <p class="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
          </div>
        {:else}
          <div class="rounded-2xl p-6 sm:p-8 border border-slate-200 bg-slate-50 select-none" aria-disabled="true">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-200">
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon}/>
                </svg>
              </div>
              <span class="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Demnächst verfügbar</span>
            </div>
            <h3 class="font-semibold text-lg mb-2 text-slate-400">{feature.title}</h3>
            <p class="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>
