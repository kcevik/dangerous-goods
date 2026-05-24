<template>
  <div v-if="nrs.length" class="mt-5">
    <div class="font-mono text-[10px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2 pb-1.5 border-b border-[#c8d6e5]">
      {{ label }} ({{ svs }})
    </div>
    <div class="flex flex-col gap-1.5">
      <div
        v-for="nr in nrs"
        :key="nr"
        class="border border-[#c8d6e5] bg-[#f4f7fa]"
      >
        <button
          class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#dce8f2] transition-colors cursor-pointer select-none"
          @click="toggle(nr)"
        >
          <span class="font-mono text-xs font-bold text-orange-500 min-w-[44px]">SV {{ nr }}</span>
          <span class="flex-1 text-[11px] text-[#5a7a99] truncate">{{ preview(nr) }}</span>
          <span
            class="font-mono text-[11px] text-[#5a7a99] flex-shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': open[nr] }"
          >▼</span>
        </button>
        <div
          v-if="open[nr]"
          class="px-3.5 py-3 border-t border-[#c8d6e5] text-[13px] leading-relaxed text-[#2d5070] whitespace-pre-wrap"
        >{{ text(nr) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { DEMO_SVS } from '~/utils/multimodal'

const props = defineProps<{
  svs: string
  label: string
  noText: string
  clickLoad: string
  /** When true, uses hardcoded DEMO_SVS instead of API */
  demo?: boolean
}>()

const open = reactive<Record<string, boolean>>({})

const nrs = computed(() =>
  props.svs.split(',').map((s) => s.trim()).filter(Boolean),
)

function text(nr: string): string {
  if (props.demo) return DEMO_SVS[nr] ?? props.noText
  // TODO: return fetched SVS text from API
  return props.noText
}

function preview(nr: string): string {
  if (open[nr]) return ''
  const t = text(nr)
  if (!t || t === props.noText) return props.clickLoad
  return t.length > 80 ? t.substring(0, 80) + '…' : t
}

function toggle(nr: string) {
  open[nr] = !open[nr]
}
</script>
