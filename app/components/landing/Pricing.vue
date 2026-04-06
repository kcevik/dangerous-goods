<template>
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

      <div class="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="rounded-2xl p-8 flex flex-col relative"
          :class="plan.highlighted
            ? 'shadow-xl border-2'
            : 'border border-slate-200 bg-white'"
          :style="plan.highlighted ? 'background: #0f2744; border-color: #f97316;' : ''"
        >
          <!-- Recommended badge -->
          <div v-if="plan.highlighted" class="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span class="px-3 py-1 rounded-full text-xs font-bold text-white" style="background: #f97316;">Empfohlen</span>
          </div>

          <!-- Header -->
          <div class="mb-6">
            <h3 class="font-bold text-lg mb-1" :class="plan.highlighted ? 'text-white' : ''" :style="plan.highlighted ? '' : 'color: #0f2744;'">{{ plan.name }}</h3>
            <p class="text-sm mb-4" :class="plan.highlighted ? 'text-slate-400' : 'text-slate-500'">{{ plan.tagline }}</p>
            <div class="flex items-end gap-1">
              <span class="text-4xl font-bold" :class="plan.highlighted ? 'text-white' : ''" :style="plan.highlighted ? '' : 'color: #0f2744;'">{{ plan.price }}</span>
              <span class="text-slate-400 text-sm mb-1">/ Monat</span>
            </div>
          </div>

          <!-- Features -->
          <ul class="space-y-3 mb-8 flex-1">
            <li v-for="item in plan.features" :key="item.label" class="flex items-center gap-2 text-sm" :class="item.included ? (plan.highlighted ? 'text-slate-300' : 'text-slate-600') : (plan.highlighted ? 'text-slate-500' : 'text-slate-400')">
              <svg v-if="item.included" class="w-4 h-4 shrink-0" :style="`color: ${plan.highlighted ? '#f97316' : '#15779b'};`" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-4 h-4 shrink-0" :class="plan.highlighted ? 'text-slate-600' : 'text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              {{ item.label }}
            </li>
          </ul>

          <!-- CTA -->
          <a
            href="#"
            class="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-center transition-all duration-150 cursor-pointer active:scale-95"
            :class="plan.highlighted ? 'hover:shadow-md' : 'border-2 hover:shadow-sm'"
            :style="plan.highlighted
              ? 'background: #f97316; color: white;'
              : 'border-color: #0f2744; color: #0f2744;'"
            :onmouseenter="plan.highlighted
              ? `this.style.background='#ea580c'`
              : `this.style.background='#0f2744'; this.style.color='white'`"
            :onmouseleave="plan.highlighted
              ? `this.style.background='#f97316'`
              : `this.style.background=''; this.style.color='#0f2744'`"
          >
            {{ plan.cta }}
          </a>
        </div>
      </div>

      <p class="text-center text-sm text-slate-400 mt-8">
        Alle Preise zzgl. MwSt. · Jährliche Zahlung spart 20 %. · Mehrere Lizenzen? <a href="#" class="underline hover:text-slate-600 transition-colors">Kontakt aufnehmen.</a>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const plans = [
  {
    name: 'Freemium',
    tagline: 'Kostenlos loslegen',
    price: '0 €',
    highlighted: false,
    cta: 'Kostenlos starten',
    features: [
      { label: 'Stoffsuche (ADR)', included: true },
      { label: 'Rechenwerkzeuge', included: true },
      { label: 'Dokumentengenerator', included: false },
      { label: 'Regelwerksvergleich', included: false },
      { label: 'Änderungsmonitor', included: false },
    ],
  },
  {
    name: 'Pro',
    tagline: 'Alle Funktionen, ein Preis',
    price: '29 €',
    highlighted: true,
    cta: 'Jetzt Pro starten',
    features: [
      { label: 'Alles aus Freemium', included: true },
      { label: 'Dokumentengenerator (PDF + Word)', included: true },
      { label: 'Regelwerksvergleich (ADR–ADN)', included: true },
      { label: 'Änderungsmonitor', included: true },
      { label: 'Alle zukünftigen Werkzeuge', included: true },
    ],
  },
]
</script>
