<template>
  <div class="min-h-screen bg-white font-sans antialiased">

    <!-- ═══════════════════════════════════════════════════
         NAVBAR
    ═══════════════════════════════════════════════════ -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: #0f2744;">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span class="font-bold text-lg" style="color: #0f2744;">Gefahrgut<span style="color: #f97316;">Profi</span></span>
          </div>

          <!-- Desktop Nav -->
          <nav class="hidden md:flex items-center gap-8" role="navigation" aria-label="Hauptnavigation">
            <a href="#features" class="text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Funktionen</a>
            <a href="#comparison" class="text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Regelwerke</a>
            <a href="#pricing" class="text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Preise</a>
            <a href="#" class="text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Dokumentation</a>
          </nav>

          <!-- CTA -->
          <div class="flex items-center gap-3">
            <a href="#" class="hidden sm:block text-sm font-medium text-slate-600 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Anmelden</a>
            <a
              href="#"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              style="background: #f97316;"
              onmouseenter="this.style.background='#ea580c'"
              onmouseleave="this.style.background='#f97316'"
            >
              Kostenlos starten
            </a>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════
         HERO
    ═══════════════════════════════════════════════════ -->
    <section class="relative pt-16 overflow-hidden" style="background: #0f2744;">
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div class="max-w-3xl">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style="background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); color: #fdba74;">
            <span class="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse"></span>
            Neu: Regelwerksvergleich ADR · RID · IMDG · ICAO · ADN
          </div>

          <!-- Headline -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Alle Gefahrgut&shy;vorschriften.<br>
            <span style="color: #f97316;">Ein Werkzeug.</span>
          </h1>

          <!-- Subtext -->
          <p class="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
            Die Arbeitsplattform für Gefahrgutbeauftragte – alle Regelwerke, alle Werkzeuge, alle Dokumente. Zentral, schnell und immer aktuell.
          </p>

          <!-- Search Demo -->
          <div class="flex flex-col sm:flex-row gap-3 mb-10">
            <div class="flex-1 relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                type="search"
                placeholder="UN-Nummer oder Stoffname suchen …"
                class="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white/15 transition-all duration-150"
aria-label="Gefahrgut suchen"
              />
            </div>
            <a
              href="#"
              class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 cursor-pointer whitespace-nowrap shadow-lg hover:shadow-xl active:scale-95"
              style="background: #f97316;"
              onmouseenter="this.style.background='#ea580c'"
              onmouseleave="this.style.background='#f97316'"
            >
              Suchen
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <!-- Trust signals -->
          <div class="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Kostenlos starten
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Keine Kreditkarte erforderlich
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              BAM-zertifizierte Datenbasis
            </div>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="relative h-16 overflow-hidden">
        <svg viewBox="0 0 1440 64" preserveAspectRatio="none" class="absolute bottom-0 w-full h-full" fill="white" aria-hidden="true">
          <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z"/>
        </svg>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         STATS BAR
    ═══════════════════════════════════════════════════ -->
    <section class="bg-white border-b border-slate-100" aria-label="Kennzahlen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-3xl font-bold mb-1" style="color: #0f2744;">2.347+</div>
            <div class="text-sm text-slate-500">UN-Nummern</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold mb-1" style="color: #0f2744;">5</div>
            <div class="text-sm text-slate-500">Regelwerke</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold mb-1" style="color: #0f2744;">&lt; 300ms</div>
            <div class="text-sm text-slate-500">Antwortzeit</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold mb-1" style="color: #0f2744;">100%</div>
            <div class="text-sm text-slate-500">BAM-Datenbasis</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         FEATURES
    ═══════════════════════════════════════════════════ -->
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
          <!-- Feature 1 -->
          <div class="group rounded-2xl p-8 border border-slate-200 hover:border-[#15779b] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#15779b]" style="background: rgba(21,119,155,0.1);">
              <svg class="w-6 h-6 transition-colors duration-200 group-hover:text-white" style="color: #15779b;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">Stoffsuche</h3>
            <p class="text-slate-500 text-sm leading-relaxed">2.347+ Stoffe sofort abrufbar – nach UN-Nummer, Name oder Synonym, mit vollständigen Regelwerksdaten.</p>
          </div>

          <!-- Feature 2 -->
          <div class="group rounded-2xl p-8 border border-slate-200 hover:border-[#f97316] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#f97316]" style="background: rgba(249,115,22,0.1);">
              <svg class="w-6 h-6 transition-colors duration-200 group-hover:text-white" style="color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">1000-Punkte-Rechner</h3>
            <p class="text-slate-500 text-sm leading-relaxed">Rechenwerkzeuge für Freistellungen, Beförderungskategorien und Mengengrenzen – zuverlässig und normkonform.</p>
          </div>

          <!-- Feature 3 -->
          <div class="group rounded-2xl p-8 border border-slate-200 hover:border-[#15779b] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#15779b]" style="background: rgba(21,119,155,0.1);">
              <svg class="w-6 h-6 transition-colors duration-200 group-hover:text-white" style="color: #15779b;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">Dokumentengenerator</h3>
            <p class="text-slate-500 text-sm leading-relaxed">Transportdokumente auf Knopfdruck – rechtssicher, vollständig und sofort exportierbar.</p>
          </div>

          <!-- Feature 4 -->
          <div class="group rounded-2xl p-8 border border-slate-200 hover:border-[#f97316] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#f97316]" style="background: rgba(249,115,22,0.1);">
              <svg class="w-6 h-6 transition-colors duration-200 group-hover:text-white" style="color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">Freistellungsrechner</h3>
            <p class="text-slate-500 text-sm leading-relaxed">LQ, EQ und weitere Freistellungstatbestände direkt prüfen – trägerübergreifend und regelwerkskonform.</p>
          </div>

          <!-- Feature 5 -->
          <div class="group rounded-2xl p-8 border border-slate-200 hover:border-[#15779b] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#15779b]" style="background: rgba(21,119,155,0.1);">
              <svg class="w-6 h-6 transition-colors duration-200 group-hover:text-white" style="color: #15779b;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">Änderungsmonitor</h3>
            <p class="text-slate-500 text-sm leading-relaxed">Regelwerksänderungen im Blick – automatisch, strukturiert und mit direktem Bezug zu betroffenen Stoffen.</p>
          </div>

          <!-- Feature 6 -->
          <div class="group rounded-2xl p-8 border border-slate-200 hover:border-[#f97316] hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#f97316]" style="background: rgba(249,115,22,0.1);">
              <svg class="w-6 h-6 transition-colors duration-200 group-hover:text-white" style="color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">Team-Verwaltung</h3>
            <p class="text-slate-500 text-sm leading-relaxed">Nutzerverwaltung, Rollen und gemeinsames Archiv für Unternehmen, Speditionen und Beratungsbüros.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         COMPARISON HIGHLIGHT  (key differentiator)
    ═══════════════════════════════════════════════════ -->
    <section id="comparison" class="py-20 lg:py-28" style="background: #f8fafc;" aria-labelledby="comparison-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <!-- Left: copy -->
          <div class="mb-12 lg:mb-0">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #f97316; background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.2);">
              Einzigartiges Feature
            </div>
            <h2 id="comparison-heading" class="text-3xl sm:text-4xl font-bold mb-6" style="color: #0f2744;">
              Alle Regelwerke auf einen Blick – automatisch verglichen
            </h2>
            <p class="text-lg text-slate-500 mb-8 leading-relaxed">
              ADR, RID, IMDG, ICAO und ADN nebeneinander – Abweichungen zwischen den Regelwerken werden automatisch erkannt und farblich hervorgehoben.
            </p>
            <ul class="space-y-4 mb-8">
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style="background: rgba(21,119,155,0.1);">
                  <svg class="w-3.5 h-3.5" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-slate-600">Unterschiede farblich hervorgehoben</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style="background: rgba(21,119,155,0.1);">
                  <svg class="w-3.5 h-3.5" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-slate-600">Warnhinweise bei kritischen Abweichungen</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style="background: rgba(21,119,155,0.1);">
                  <svg class="w-3.5 h-3.5" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-slate-600">Export als PDF für Audits und Dokumentation</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style="background: rgba(21,119,155,0.1);">
                  <svg class="w-3.5 h-3.5" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-slate-600">Multimodaler Transportassistent integriert</span>
              </li>
            </ul>
            <a
              href="#"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              style="background: #0f2744;"
              onmouseenter="this.style.background='#1e3a5f'"
              onmouseleave="this.style.background='#0f2744'"
            >
              Regelwerksvergleich ausprobieren
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <!-- Right: comparison table mockup -->
          <div class="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
            <!-- Table header -->
            <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between" style="background: #0f2744;">
              <div class="flex items-center gap-2">
                <span class="text-white font-semibold text-sm">UN 1203</span>
                <span class="text-slate-400 text-xs">Benzin (Petrol)</span>
              </div>
              <span class="text-xs text-slate-400">Regelwerksvergleich</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs" role="table" aria-label="Regelwerksvergleich Beispiel UN 1203">
                <thead>
                  <tr class="border-b border-slate-100" style="background: #f8fafc;">
                    <th class="text-left px-4 py-3 text-slate-500 font-medium" scope="col">Regelwerk</th>
                    <th class="text-left px-4 py-3 text-slate-500 font-medium" scope="col">Klasse</th>
                    <th class="text-left px-4 py-3 text-slate-500 font-medium" scope="col">Vp.-Gr.</th>
                    <th class="text-left px-4 py-3 text-slate-500 font-medium" scope="col">LQ</th>
                    <th class="text-left px-4 py-3 text-slate-500 font-medium" scope="col">Tunnel</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-semibold" style="color: #0f2744;">ADR</td>
                    <td class="px-4 py-3 text-slate-600">3</td>
                    <td class="px-4 py-3 text-slate-600">II</td>
                    <td class="px-4 py-3 text-slate-600">5 L</td>
                    <td class="px-4 py-3 text-slate-600">D/E</td>
                  </tr>
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-semibold" style="color: #0f2744;">RID</td>
                    <td class="px-4 py-3 text-slate-600">3</td>
                    <td class="px-4 py-3 text-slate-600">II</td>
                    <td class="px-4 py-3 text-slate-600">5 L</td>
                    <td class="px-4 py-3 text-slate-600">–</td>
                  </tr>
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-semibold" style="color: #0f2744;">IMDG</td>
                    <td class="px-4 py-3 text-slate-600">3</td>
                    <td class="px-4 py-3 text-slate-600">II</td>
                    <td class="px-4 py-3">
                      <span class="px-1.5 py-0.5 rounded text-xs font-medium" style="background: rgba(249,115,22,0.12); color: #ea580c;">1 L</span>
                    </td>
                    <td class="px-4 py-3 text-slate-600">–</td>
                  </tr>
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-semibold" style="color: #0f2744;">ICAO</td>
                    <td class="px-4 py-3 text-slate-600">3</td>
                    <td class="px-4 py-3">
                      <span class="px-1.5 py-0.5 rounded text-xs font-medium" style="background: rgba(249,115,22,0.12); color: #ea580c;">I</span>
                    </td>
                    <td class="px-4 py-3 text-slate-600">–</td>
                    <td class="px-4 py-3 text-slate-600">–</td>
                  </tr>
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-semibold" style="color: #0f2744;">ADN</td>
                    <td class="px-4 py-3 text-slate-600">3</td>
                    <td class="px-4 py-3 text-slate-600">II</td>
                    <td class="px-4 py-3 text-slate-600">5 L</td>
                    <td class="px-4 py-3 text-slate-600">–</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Warning bar -->
            <div class="px-4 py-3 border-t text-xs flex items-start gap-2" style="background: rgba(249,115,22,0.05); border-color: rgba(249,115,22,0.2);">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" style="color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Hinweis">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span style="color: #ea580c;">Achtung: IMDG und ICAO weichen von ADR ab – Verpackungsgruppe und LQ prüfen.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         PRICING
    ═══════════════════════════════════════════════════ -->
    <section id="pricing" class="py-20 lg:py-28 bg-white" aria-labelledby="pricing-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #15779b; background: rgba(21,119,155,0.08); border-color: rgba(21,119,155,0.2);">
            Preise
          </div>
          <h2 id="pricing-heading" class="text-3xl sm:text-4xl font-bold mb-4" style="color: #0f2744;">
            Einfache, transparente Preise
          </h2>
          <p class="text-lg text-slate-500 max-w-xl mx-auto">
            Kostenlos starten, bei Bedarf upgraden. Keine versteckten Kosten.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <!-- Free -->
          <div class="rounded-2xl p-8 border border-slate-200 bg-white flex flex-col">
            <div class="mb-6">
              <h3 class="font-bold text-lg mb-1" style="color: #0f2744;">Freemium</h3>
              <p class="text-sm text-slate-500 mb-4">Für den Einstieg</p>
              <div class="flex items-end gap-1">
                <span class="text-4xl font-bold" style="color: #0f2744;">0 €</span>
                <span class="text-slate-400 text-sm mb-1">/ Monat</span>
              </div>
            </div>
            <ul class="space-y-3 mb-8 flex-1">
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                UN-Nummern-Suche (ADR)
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                1000-Punkte-Rechner
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-4 h-4 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                Dokumentengenerator
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-4 h-4 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                Regelwerksvergleich
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-4 h-4 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                Änderungsmonitor
              </li>
            </ul>
            <a
              href="#"
              class="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center border-2 transition-all duration-150 cursor-pointer hover:shadow-sm active:scale-95"
              style="border-color: #0f2744; color: #0f2744;"
              onmouseenter="this.style.background='#0f2744'; this.style.color='white'"
              onmouseleave="this.style.background=''; this.style.color='#0f2744'"
            >
              Kostenlos starten
            </a>
          </div>

          <!-- Pro (highlighted) -->
          <div class="rounded-2xl p-8 flex flex-col relative shadow-xl border-2" style="background: #0f2744; border-color: #f97316;">
            <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span class="px-3 py-1 rounded-full text-xs font-bold text-white" style="background: #f97316;">Empfohlen</span>
            </div>
            <div class="mb-6">
              <h3 class="font-bold text-lg mb-1 text-white">Pro</h3>
              <p class="text-sm text-slate-400 mb-4">Für Einzelbeauftragte</p>
              <div class="flex items-end gap-1">
                <span class="text-4xl font-bold text-white">29 €</span>
                <span class="text-slate-400 text-sm mb-1">/ Monat</span>
              </div>
            </div>
            <ul class="space-y-3 mb-8 flex-1">
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #f97316;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Alles aus Freemium
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #f97316;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Dokumentengenerator (PDF + Word)
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #f97316;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Regelwerksvergleich (ADR–ADN)
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-300">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #f97316;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Änderungsmonitor
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-400">
                <svg class="w-4 h-4 flex-shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                Mehrere Nutzer
              </li>
            </ul>
            <a
              href="#"
              class="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-150 cursor-pointer active:scale-95"
              style="background: #f97316; color: white;"
              onmouseenter="this.style.background='#ea580c'"
              onmouseleave="this.style.background='#f97316'"
            >
              Jetzt Pro starten
            </a>
          </div>

          <!-- Business -->
          <div class="rounded-2xl p-8 border border-slate-200 bg-white flex flex-col">
            <div class="mb-6">
              <h3 class="font-bold text-lg mb-1" style="color: #0f2744;">Business</h3>
              <p class="text-sm text-slate-500 mb-4">Für Unternehmen & Teams</p>
              <div class="flex items-end gap-1">
                <span class="text-4xl font-bold" style="color: #0f2744;">99 €</span>
                <span class="text-slate-400 text-sm mb-1">/ Monat</span>
              </div>
            </div>
            <ul class="space-y-3 mb-8 flex-1">
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Alles aus Pro
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Mehrere Nutzer & Rollen
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Mandantenfähigkeit
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                API-Zugang (ERP / TMS)
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-4 h-4 flex-shrink-0" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Prioritäts-Support
              </li>
            </ul>
            <a
              href="#"
              class="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center border-2 transition-all duration-150 cursor-pointer hover:shadow-sm active:scale-95"
              style="border-color: #0f2744; color: #0f2744;"
              onmouseenter="this.style.background='#0f2744'; this.style.color='white'"
              onmouseleave="this.style.background=''; this.style.color='#0f2744'"
            >
              Kontakt aufnehmen
            </a>
          </div>
        </div>

        <p class="text-center text-sm text-slate-400 mt-8">
          Alle Preise zzgl. MwSt. · Jährliche Zahlung spart 20 %.
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         DATA SOURCE / TRUST
    ═══════════════════════════════════════════════════ -->
    <section class="py-14" style="background: #f8fafc;" aria-label="Datenbasis">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-2xl border border-slate-200 bg-white p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8">
          <div class="flex-1">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #15779b; background: rgba(21,119,155,0.08); border-color: rgba(21,119,155,0.2);">
              Vertrauenswürdige Datenbasis
            </div>
            <h3 class="text-2xl font-bold mb-3" style="color: #0f2744;">Powered by BAM GEFAHRGUT</h3>
            <p class="text-slate-500 leading-relaxed">
              Unsere Daten stammen direkt aus der offiziellen Datenbank der Bundesanstalt für Materialforschung und -prüfung (BAM) – der maßgeblichen Quelle für Gefahrgutdaten in Deutschland und Europa. Lizenz: dl-de/by-2-0.
            </p>
          </div>
          <div class="flex-shrink-0 grid grid-cols-2 gap-4 lg:gap-6">
            <div class="text-center p-4 rounded-xl border border-slate-100" style="background: #f8fafc;">
              <div class="text-2xl font-bold mb-1" style="color: #0f2744;">~3.374</div>
              <div class="text-xs text-slate-500">ADR-Datensätze</div>
            </div>
            <div class="text-center p-4 rounded-xl border border-slate-100" style="background: #f8fafc;">
              <div class="text-2xl font-bold mb-1" style="color: #0f2744;">~3.528</div>
              <div class="text-xs text-slate-500">ICAO-Datensätze</div>
            </div>
            <div class="text-center p-4 rounded-xl border border-slate-100" style="background: #f8fafc;">
              <div class="text-2xl font-bold mb-1" style="color: #0f2744;">~3.246</div>
              <div class="text-xs text-slate-500">IMDG-Datensätze</div>
            </div>
            <div class="text-center p-4 rounded-xl border border-slate-100" style="background: #f8fafc;">
              <div class="text-2xl font-bold mb-1" style="color: #0f2744;">~3.350</div>
              <div class="text-xs text-slate-500">RID-Datensätze</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         FINAL CTA
    ═══════════════════════════════════════════════════ -->
    <section class="py-20 lg:py-28" style="background: #0f2744;" aria-labelledby="cta-heading">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="cta-heading" class="text-3xl sm:text-4xl font-bold text-white mb-6">
          Gefahrgutarbeit. Professionell.
        </h2>
        <p class="text-lg text-slate-300 mb-10">
          Kostenlos starten – alle Kernfunktionen sofort verfügbar, keine Kreditkarte erforderlich.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
            style="background: #f97316;"
            onmouseenter="this.style.background='#ea580c'"
            onmouseleave="this.style.background='#f97316'"
          >
            Kostenlos starten
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
          <a
            href="#"
            class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-150 cursor-pointer border active:scale-95"
            style="border-color: rgba(255,255,255,0.3); color: white;"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'"
            onmouseleave="this.style.background=''"
          >
            Demo ansehen
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         FOOTER
    ═══════════════════════════════════════════════════ -->
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

          <!-- Product -->
          <div>
            <h4 class="text-sm font-semibold mb-4" style="color: #0f2744;">Produkt</h4>
            <ul class="space-y-2.5">
              <li><a href="#features" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Funktionen</a></li>
              <li><a href="#pricing" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Preise</a></li>
              <li><a href="#comparison" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Regelwerksvergleich</a></li>
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Änderungsmonitor</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="text-sm font-semibold mb-4" style="color: #0f2744;">Ressourcen</h4>
            <ul class="space-y-2.5">
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Dokumentation</a></li>
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">ADR-Leitfaden</a></li>
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Blog</a></li>
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">BAM-Datenbasis</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="text-sm font-semibold mb-4" style="color: #0f2744;">Rechtliches</h4>
            <ul class="space-y-2.5">
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Impressum</a></li>
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">Datenschutz</a></li>
              <li><a href="#" class="text-sm text-slate-500 hover:text-[#0f2744] transition-colors duration-150 cursor-pointer">AGB</a></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-xs text-slate-400">
            © 2026 GefahrgutProfi. Datenbasis: BAM GEFAHRGUT, Lizenz dl-de/by-2-0.
          </p>
          <p class="text-xs text-slate-400">
            Kein Ersatz für rechtliche Beratung. Alle Angaben ohne Gewähr.
          </p>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'GefahrgutProfi – Alle Gefahrgutvorschriften. Ein Werkzeug.',
  meta: [
    {
      name: 'description',
      content: 'Die zentrale Plattform für Gefahrgutbeauftragte: UN-Nummern suchen, ADR mit IMDG und ICAO vergleichen, 1000-Punkte berechnen und Beförderungspapiere erstellen.',
    },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: '',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    },
  ],
})
</script>

<style>
html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
