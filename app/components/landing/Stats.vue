<template>
  <section class="bg-white border-b border-slate-100" aria-label="Kennzahlen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <div class="text-3xl font-bold mb-1" style="color: #0f2744;">{{ stat.value }}</div>
          <div class="text-sm text-slate-500">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: '2.347+', label: 'UN-Nummern' },
  { value: '5', label: 'Regelwerke' },
  { value: '< 300ms', label: 'Antwortzeit' },
  { value: '100%', label: 'BAM-Datenbasis' },
]
</script>
