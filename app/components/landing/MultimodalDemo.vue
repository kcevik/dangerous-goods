<template>
  <section id="demo" class="py-20 lg:py-28 bg-[#e8eef5]" aria-labelledby="demo-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Section header -->
      <div class="text-center mb-10">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border"
          style="color: #f97316; background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.2);"
        >
          Interaktive Demo
        </div>
        <h2 id="demo-heading" class="text-3xl sm:text-4xl font-bold mb-4" style="color: #0f2744;">
          Alle Transportmodi auf einen Blick
        </h2>
        <p class="text-lg max-w-2xl mx-auto" style="color: #5a7a99;">
          UN 1203 · Benzin — ADR, RID, IMDG, ICAO und ADN automatisch verglichen.
        </p>
      </div>

      <MultimodalTool demo />

    </div>
  </section>
</template>
