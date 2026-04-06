<template>
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
            <li v-for="point in highlights" :key="point" class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style="background: rgba(21,119,155,0.1);">
                <svg class="w-3.5 h-3.5" style="color: #15779b;" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="text-slate-600">{{ point }}</span>
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
                <tr v-for="row in tableRows" :key="row.name" class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-semibold" style="color: #0f2744;">{{ row.name }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ row.klasse }}</td>
                  <td class="px-4 py-3">
                    <span v-if="row.vpGrDeviation" class="px-1.5 py-0.5 rounded text-xs font-medium" style="background: rgba(249,115,22,0.12); color: #ea580c;">{{ row.vpGr }}</span>
                    <span v-else class="text-slate-600">{{ row.vpGr }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span v-if="row.lqDeviation" class="px-1.5 py-0.5 rounded text-xs font-medium" style="background: rgba(249,115,22,0.12); color: #ea580c;">{{ row.lq }}</span>
                    <span v-else class="text-slate-600">{{ row.lq }}</span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ row.tunnel }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 border-t text-xs flex items-start gap-2" style="background: rgba(249,115,22,0.05); border-color: rgba(249,115,22,0.2);">
            <svg class="w-4 h-4 shrink-0 mt-0.5" style="color: #f97316;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span style="color: #ea580c;">Achtung: IMDG und ICAO weichen von ADR ab – Verpackungsgruppe und LQ prüfen.</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const highlights = [
  'Unterschiede farblich hervorgehoben',
  'Warnhinweise bei kritischen Abweichungen',
  'Export als PDF für Audits und Dokumentation',
  'Multimodaler Transportassistent integriert',
]

const tableRows = [
  { name: 'ADR',  klasse: '3', vpGr: 'II', vpGrDeviation: false, lq: '5 L', lqDeviation: false, tunnel: 'D/E' },
  { name: 'RID',  klasse: '3', vpGr: 'II', vpGrDeviation: false, lq: '5 L', lqDeviation: false, tunnel: '–' },
  { name: 'IMDG', klasse: '3', vpGr: 'II', vpGrDeviation: false, lq: '1 L', lqDeviation: true,  tunnel: '–' },
  { name: 'ICAO', klasse: '3', vpGr: 'I',  vpGrDeviation: true,  lq: '–',   lqDeviation: false, tunnel: '–' },
  { name: 'ADN',  klasse: '3', vpGr: 'II', vpGrDeviation: false, lq: '5 L', lqDeviation: false, tunnel: '–' },
]
</script>
