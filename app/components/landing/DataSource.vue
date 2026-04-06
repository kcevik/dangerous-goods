<template>
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
        <div class="shrink-0 grid grid-cols-2 gap-4 lg:gap-6">
          <div v-for="stat in stats" :key="stat.label" class="text-center p-4 rounded-xl border border-slate-100" style="background: #f8fafc;">
            <div class="text-2xl font-bold mb-1" style="color: #0f2744;">{{ stat.value }}</div>
            <div class="text-xs text-slate-500">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: '~3.374', label: 'ADR-Datensätze' },
  { value: '~3.528', label: 'ICAO-Datensätze' },
  { value: '~3.246', label: 'IMDG-Datensätze' },
  { value: '~3.350', label: 'RID-Datensätze' },
]
</script>
