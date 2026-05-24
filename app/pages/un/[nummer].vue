<template>
  <div class="min-h-screen bg-[#e8eef5] py-8">
    <div class="max-w-5xl mx-auto px-4">
      <NuxtLink to="/" class="inline-block mb-4 text-sm text-[#5a7a99] hover:text-orange-500 font-mono">
        ← zurück
      </NuxtLink>
      <MultimodalTool :un-number="unNumber" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: false })

const route = useRoute()
const unNumber = computed(() => String(route.params.nummer))
</script>
