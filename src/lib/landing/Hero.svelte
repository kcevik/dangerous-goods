<script lang="ts">
  const trustSignals = ['Demo ohne Anmeldung', 'Keine Kreditkarte erforderlich', 'BAM-zertifizierte Datenbasis']
</script>

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
        Alle Gefahrgut&shy;vorschriften.<br />
        <span style="color: #f97316;">Ein Werkzeug.</span>
      </h1>

      <!-- Subtext -->
      <p class="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
        Die Arbeitsplattform für Gefahrgutbeauftragte – alle Regelwerke, alle Werkzeuge, alle Dokumente. Zentral, schnell und immer aktuell.
      </p>

      <!-- CTA -->
      <div class="mb-10">
        <a
          href="#demo"
          class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
          style="background: #f97316;"
          onmouseenter={(e) => { e.currentTarget.style.background = '#ea580c' }}
          onmouseleave={(e) => { e.currentTarget.style.background = '#f97316' }}
        >
          Jetzt ausprobieren
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </a>
      </div>

      <!-- Trust signals -->
      <div class="flex flex-wrap items-center gap-6 text-sm text-slate-400">
        {#each trustSignals as signal (signal)}
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {signal}
          </div>
        {/each}
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
