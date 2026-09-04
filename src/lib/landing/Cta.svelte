<section class="py-20 lg:py-28" style="background: #0f2744;" aria-labelledby="cta-heading">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 id="cta-heading" class="text-3xl sm:text-4xl font-bold text-white mb-6">
      Gefahrgutarbeit. Professionell.
    </h2>
    <p class="text-lg text-slate-300 mb-10">
      Die Plattform ist im Aufbau. Registriere dich, sieh dir alles an und erfahre zuerst, wenn es losgeht.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a
        href="/registrieren"
        class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
        style="background: #f97316;"
        onmouseenter={(e) => { e.currentTarget.style.background = '#ea580c' }}
        onmouseleave={(e) => { e.currentTarget.style.background = '#f97316' }}
      >
        Jetzt registrieren
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </a>
      <a
        href="#demo"
        class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-150 cursor-pointer border active:scale-95"
        style="border-color: rgba(255,255,255,0.3); color: white;"
        onmouseenter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onmouseleave={(e) => { e.currentTarget.style.background = '' }}
      >
        Demo ansehen
      </a>
    </div>
  </div>
</section>
