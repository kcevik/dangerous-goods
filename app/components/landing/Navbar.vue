<template>
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
</template>
