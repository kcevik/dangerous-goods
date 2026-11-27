<script lang="ts">
  import { DATA_SOURCE_LABEL, SITE_STATS } from './siteFacts'

  let { registrationOpen = false }: { registrationOpen?: boolean } = $props()

  const trustSignals = $derived([
    'Demo mit UN 1203 ohne Anmeldung',
    registrationOpen ? 'Registrierung nur mit E-Mail-Adresse' : 'Benachrichtigung zum Start per E-Mail',
    `Datenbasis: ${DATA_SOURCE_LABEL}`,
  ])
</script>

<section class="relative pt-16 overflow-hidden" style="background: #0f2744;">
  <!-- Subtle grid pattern -->
  <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"></div>

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
    <div class="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
      <div class="min-w-0 max-w-3xl">
        <!-- Badge -->
        <div class="inline-flex max-w-full items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style="background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); color: #fdba74;">
          <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-[#f97316] animate-pulse"></span>
          Neu: Regelwerksvergleich ADR · RID · IMDG · ICAO
        </div>
  
        <!-- Headline -->
        <h1 class="text-3xl min-[400px]:text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 break-words">
          Software für Gefahrgut&shy;beauftragte:<br />
          <span style="color: #f97316;">Alle Vorschriften. Ein Werkzeug.</span>
        </h1>
  
        <!-- Subtext -->
        <p class="text-base sm:text-xl text-slate-300 leading-relaxed mb-8 sm:mb-10 max-w-2xl">
          Die Arbeitsplattform für Gefahrgutbeauftragte: ADR, RID, IMDG und ICAO je UN-Nummer nebeneinander, dazu das ADR im Volltext. Weitere Werkzeuge folgen.
        </p>
  
        <!-- CTA -->
        <div class="mb-8 sm:mb-10">
          <a
            href="#demo"
            class="inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
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
        <div id="hero-signals" class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-2 text-sm text-slate-400">
          {#each trustSignals as signal (signal)}
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 shrink-0 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              {signal}
            </div>
          {/each}
        </div>
      </div>
  
      <!-- Right: what is in the database today (the same facts as static/llms.txt) -->
      <div id="hero-facts" class="mt-10 lg:mt-0 min-w-0 rounded-2xl border p-5 sm:p-6" style="background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12);">
        <p class="text-sm font-semibold text-white mb-4">Was heute drin ist</p>
        <dl class="grid grid-cols-2 gap-3 sm:gap-4">
          {#each SITE_STATS as stat (stat.label)}
            <div class="min-w-0 flex flex-col rounded-xl p-3 sm:p-4" style="background: rgba(255,255,255,0.06);">
              <dt class="text-xs text-slate-400 break-words hyphens-auto">{stat.label}</dt>
              <dd class="text-xl sm:text-2xl font-bold text-white whitespace-nowrap order-first">{stat.value}</dd>
            </div>
          {/each}
        </dl>
        <p class="mt-4 text-xs leading-relaxed text-slate-400">
          Dazu die UN-Modellvorschriften als Referenz. ADN-Daten (Binnenschifffahrt) veröffentlicht die BAM nicht; sie fehlen deshalb.
          Quelle: {DATA_SOURCE_LABEL}, Lizenz dl-de/by-2-0.
        </p>
      </div>
    </div>
  </div>

  <!-- Wave divider -->
  <div class="relative h-10 sm:h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" preserveAspectRatio="none" class="absolute bottom-0 w-full h-full" fill="white" aria-hidden="true">
      <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z"/>
    </svg>
  </div>
</section>
