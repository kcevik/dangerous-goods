<template>
  <div class="min-h-screen bg-[#e8eef5]">
    <!-- Top bar -->
    <div class="bg-[#0f2744] px-4 py-4">
      <div class="max-w-5xl mx-auto flex items-center gap-4">
        <NuxtLink to="/" class="text-slate-400 hover:text-white transition-colors text-sm font-mono shrink-0">
          ← zurück
        </NuxtLink>
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            placeholder="UN-Nummer oder Stoffname suchen …"
            class="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/15 transition-all [&::-webkit-search-cancel-button]:hidden"
            aria-label="Gefahrgut suchen"
          />
          <div v-if="isLoading" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="max-w-5xl mx-auto px-4 py-8">

      <!-- Empty state -->
      <div v-if="query.trim().length < MIN_QUERY_LENGTH" class="text-center py-16">
        <p class="text-[#5a7a99] text-sm mb-4">Gib eine UN-Nummer oder einen Stoffnamen ein</p>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="example in EXAMPLES"
            :key="example.un"
            class="px-3 py-1.5 rounded-full text-xs font-mono border border-[#c0cfe0] text-[#5a7a99] hover:border-orange-400 hover:text-orange-500 transition-colors"
            @click="query = example.un"
          >
            {{ example.un }} · {{ example.label }}
          </button>
        </div>
      </div>

      <!-- Results list -->
      <div v-else-if="results.length > 0" class="space-y-2">
        <p class="text-xs text-[#5a7a99] mb-3">{{ results.length }} Ergebnisse (ADR)</p>
        <button
          v-for="r in results"
          :key="r.unNumber"
          class="w-full text-left bg-white rounded-xl px-5 py-4 shadow-sm border border-transparent hover:border-orange-300 hover:shadow-md transition-all group"
          @click="select(r.unNumber)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <span class="font-mono font-bold text-[#0f2744] text-sm group-hover:text-orange-600 transition-colors">
                UN {{ r.unNumber }}
              </span>
              <p class="text-sm text-[#0f2744] mt-0.5 truncate">{{ displayName(r) }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span v-if="r.hazardClass" class="px-2 py-0.5 rounded text-xs font-semibold bg-[#e8eef5] text-[#0f2744]">
                Kl. {{ r.hazardClass }}
              </span>
              <span v-if="r.packingGroup" class="px-2 py-0.5 rounded text-xs font-semibold bg-[#e8eef5] text-[#5a7a99]">
                VG {{ r.packingGroup }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <!-- No results -->
      <div
        v-else-if="query.trim().length >= MIN_QUERY_LENGTH && !isLoading && results.length === 0 && !selectedUn"
        class="text-center py-16"
      >
        <p class="text-[#5a7a99] text-sm">Keine Ergebnisse für „{{ query }}"</p>
      </div>

      <!-- Tool -->
      <div v-if="selectedUn" class="mt-6">
        <MultimodalTool :un-number="selectedUn" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { MIN_QUERY_LENGTH, type SearchResult } from '~/composables/useSearch'

definePageMeta({ layout: false })

const { query, results, selectedUn, isLoading, select } = useSearch()

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => inputRef.value?.focus())

const EXAMPLES = [
  { un: '1203', label: 'Benzin' },
  { un: '1090', label: 'Aceton' },
  { un: '2794', label: 'Batterien' },
  { un: '1017', label: 'Chlor' },
]

function displayName(r: SearchResult): string {
  return r.name ?? r.nameEn ?? r.nameFr ?? ''
}
</script>
