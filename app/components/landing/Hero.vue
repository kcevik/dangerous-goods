<template>
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

        <!-- Search -->
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
          <div v-for="signal in trustSignals" :key="signal" class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {{ signal }}
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
</template>

<script setup lang="ts">
const trustSignals = ['Kostenlos starten', 'Keine Kreditkarte erforderlich', 'BAM-zertifizierte Datenbasis']
</script>
