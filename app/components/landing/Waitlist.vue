<template>
  <section id="waitlist" class="py-20 lg:py-28" style="background: #0f2744;" aria-labelledby="waitlist-heading">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-orange-500/30 text-orange-400 bg-orange-500/10">
        Warteliste
      </div>
      <h2 id="waitlist-heading" class="text-3xl sm:text-4xl font-bold text-white mb-4">
        Sei beim Start dabei.
      </h2>
      <p class="text-lg text-slate-300 mb-3">
        gefahrgut.org befindet sich im Aufbau. Trag dich ein und erfahre als Erste:r,
        wenn die Plattform live geht.
      </p>
      <p class="text-sm text-slate-400 mb-10">
        Zum Start gibt es einen kostenlosen Zugang mit 5 Suchanfragen pro Monat –
        Preise für den vollen Zugang geben wir zuerst der Warteliste bekannt.
      </p>

      <form v-if="state !== 'success' && state !== 'already'" class="text-left" novalidate @submit.prevent="submit">
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <input
            v-model="name"
            type="text"
            name="name"
            placeholder="Name"
            aria-label="Name"
            autocomplete="name"
            required
            class="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
          <input
            v-model="email"
            type="email"
            name="email"
            placeholder="E-Mail-Adresse"
            aria-label="E-Mail-Adresse"
            autocomplete="email"
            required
            class="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
        </div>

        <!-- honeypot: invisible to humans, tempting for bots -->
        <div class="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
          <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off">
        </div>

        <label class="flex items-start gap-3 mb-6 cursor-pointer">
          <input v-model="consent" type="checkbox" class="mt-1 w-4 h-4 accent-orange-500" required>
          <span class="text-xs text-slate-400 leading-relaxed">
            Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Die Daten
            werden ausschließlich dafür gespeichert und auf Wunsch jederzeit gelöscht.
            Details in der <a href="https://gefahrgut.org/datenschutz" class="underline hover:text-slate-200">Datenschutzerklärung</a>.
          </span>
        </label>

        <button
          type="submit"
          :disabled="!canSubmit"
          class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all duration-150 shadow-lg enabled:hover:shadow-xl enabled:active:scale-95 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style="background: #f97316;"
        >
          {{ state === 'submitting' ? 'Wird eingetragen …' : 'Auf die Warteliste' }}
        </button>

        <p v-if="state === 'rateLimited'" role="status" class="mt-4 text-sm text-orange-300 text-center">
          Zu viele Versuche – bitte probiere es in einer Stunde erneut.
        </p>
        <p v-else-if="state === 'error'" role="status" class="mt-4 text-sm text-orange-300 text-center">
          Das hat leider nicht geklappt. Bitte versuche es später noch einmal.
        </p>
      </form>

      <div v-else ref="panelRef" role="status" tabindex="-1" class="rounded-2xl border border-white/15 bg-white/5 px-8 py-10 focus:outline-none">
        <div class="text-4xl mb-4">✓</div>
        <p v-if="state === 'success'" class="text-lg font-semibold text-white mb-2">Du stehst auf der Liste!</p>
        <p v-else class="text-lg font-semibold text-white mb-2">Diese E-Mail-Adresse ist bereits auf der Warteliste.</p>
        <p class="text-sm text-slate-400">Wir melden uns, sobald gefahrgut.org startet.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { name, email, consent, honeypot, state, canSubmit, submit } = useWaitlist()

const panelRef = ref<HTMLElement | null>(null)

watch(state, async (value) => {
  if (value === 'success' || value === 'already') {
    await nextTick()
    panelRef.value?.focus()
  }
})
</script>
