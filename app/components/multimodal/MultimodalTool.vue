<template>
  <div class="bg-[#e8eef5] font-sans">
    <div class="max-w-5xl mx-auto">

      <!-- Info banner -->
      <div class="flex items-start gap-3 px-4 py-3 mb-4 text-sm border border-l-4 bg-[#f4f7fa] border-[#c8d6e5] border-l-orange-500">
        <span class="text-xl flex-shrink-0 mt-0.5">🌐</span>
        <span class="text-[#2d5070] leading-relaxed">
          <strong>{{ L('bannerTitle') }}</strong>{{ L('bannerSub') }}
        </span>
        <span v-if="demo" class="ml-auto flex-shrink-0 font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 bg-orange-500 text-black self-center">
          DEMO
        </span>
      </div>

      <!-- Search bar -->
      <div class="flex flex-wrap items-center gap-2.5 px-4 py-3.5 mb-4 bg-[#f4f7fa] border border-[#c8d6e5] border-t-[3px] border-t-orange-500">
        <div class="relative flex-1 min-w-[200px]">
          <input
            :value="searchDisplay"
            :placeholder="L('searchPlaceholder')"
            :readonly="demo"
            :class="demo ? 'cursor-default' : 'cursor-text'"
            class="w-full px-3.5 py-2.5 font-mono text-sm border-[1.5px] border-[#b0c4d8] bg-[#dce8f2] text-[#0f2744] outline-none focus:border-orange-500 transition-colors"
            autocomplete="off"
            @focus="demo && (showDemoNotice = true)"
            @blur="showDemoNotice = false"
          >
          <div
            v-if="showDemoNotice"
            class="absolute top-full left-0 right-0 mt-1 px-3 py-2 text-xs bg-[#f4f7fa] border-[1.5px] border-orange-500 text-[#2d5070] z-10 shadow-md"
          >
            🔍 {{ L('demoNotice') }}
          </div>
        </div>

        <!-- Language toggle -->
        <div class="flex overflow-hidden border-[1.5px] border-[#b0c4d8]">
          <button
            v-for="lang in LANGS"
            :key="lang"
            class="px-3.5 py-2 font-mono text-[11px] font-bold tracking-[0.5px] transition-colors"
            :class="currentLang === lang
              ? 'bg-orange-500 text-black'
              : 'bg-[#dce8f2] text-[#5a7a99] hover:bg-[#d4e2ef]'"
            @click="setLang(lang)"
          >{{ lang.toUpperCase() }}</button>
        </div>
      </div>

      <!-- Results -->
      <div v-if="hasData">

        <!-- Compare overview -->
        <div class="px-4 py-3.5 mb-0.5 bg-[#f4f7fa] border border-[#b0c4d8] border-t-[3px] border-t-orange-500">
          <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2.5">
            UN {{ currentUnNumber }} · {{ L('availability') }}
          </div>
          <div class="grid grid-cols-5 gap-2 max-sm:grid-cols-3">
            <div
              v-for="modal in MODALS"
              :key="modal"
              class="p-2.5 border bg-[#f4f7fa] transition-all"
              :class="getEntry(modal)
                ? ['cursor-pointer', 'hover:border-orange-400',
                   modal === currentModal
                     ? 'border-orange-500 border-t-[3px]'
                     : 'border-[#c8d6e5]']
                : ['border-[#c8d6e5]', 'opacity-40']"
              @click="getEntry(modal) && switchModal(modal)"
            >
              <div class="font-mono text-[10px] font-bold tracking-[1px] uppercase text-[#5a7a99] mb-1">{{ modal }}</div>
              <template v-if="getEntry(modal)">
                <div class="font-mono text-base font-bold text-[#0f2744]">{{ getEntry(modal)!.hazardClass }}</div>
                <div v-if="getEntry(modal)!.packingGroup" class="font-mono text-[11px] text-[#5a7a99] mt-0.5">
                  VP-Gr. {{ getEntry(modal)!.packingGroup }}
                </div>
                <div v-if="getEntry(modal)!.kemlerNumber" class="font-mono text-[11px] text-orange-500 mt-0.5">
                  Kemler: {{ getEntry(modal)!.kemlerNumber }}
                </div>
                <div v-else-if="getEntry(modal)!.ems1" class="font-mono text-[11px] text-orange-500 mt-0.5">
                  EmS: {{ getEntry(modal)!.ems1 }}
                </div>
                <div v-else-if="getEntry(modal)!.packingInstrCargo" class="font-mono text-[11px] text-orange-500 mt-0.5">
                  PI: {{ getEntry(modal)!.packingInstrCargo }}
                </div>
                <div v-else-if="getEntry(modal)!.cones != null" class="font-mono text-[11px] text-orange-500 mt-0.5">
                  {{ L('cones') }}: {{ getEntry(modal)!.cones }}
                </div>
              </template>
              <template v-else>
                <div class="text-xs italic text-[#b0c4d8]">–</div>
              </template>
              <div class="text-[10px] text-[#5a7a99] mt-1 leading-tight">{{ modalDesc(modal) }}</div>
            </div>
          </div>
        </div>

        <!-- Modal tabs -->
        <div class="flex overflow-x-auto border-b-2 border-[#b0c4d8]" role="tablist">
          <button
            v-for="modal in MODALS"
            :key="modal"
            class="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.5px] whitespace-nowrap mr-0.5 relative top-px border border-b-0 transition-all"
            :class="modal === currentModal
              ? 'bg-[#f4f7fa] text-[#0f2744] border-[#b0c4d8] border-b-2 border-b-[#f4f7fa]'
              : getEntry(modal)
                ? 'bg-[#dce8f2] text-[#0f2744] border-[#b0c4d8] hover:bg-[#d4e2ef] cursor-pointer'
                : 'bg-[#dce8f2] text-[#5a7a99] border-[#b0c4d8] opacity-40 cursor-default'"
            role="tab"
            :aria-selected="modal === currentModal"
            :disabled="!getEntry(modal)"
            @click="getEntry(modal) && switchModal(modal)"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="getEntry(modal) ? 'bg-orange-500' : 'bg-[#b0c4d8]'"
            />
            {{ modal }}
          </button>
        </div>

        <!-- Detail panel -->
        <div class="bg-[#f4f7fa] border border-[#b0c4d8] border-t-0 p-5" role="tabpanel">
          <template v-if="currentEntry">

            <!-- UN header -->
            <div class="flex flex-wrap items-start gap-3.5 pb-4 mb-4 border-b border-[#c8d6e5]">
              <div class="font-mono text-3xl font-bold text-orange-500 leading-none flex-shrink-0">
                UN {{ currentEntry.unNumber }}
              </div>
              <div>
                <div class="text-base font-semibold text-[#0f2744]">{{ getName(currentEntry) }}</div>
                <div v-if="getNameSub(currentEntry)" class="text-sm text-[#5a7a99] mt-0.5">
                  {{ getNameSub(currentEntry) }}
                </div>
                <div v-if="getSpez(currentEntry)" class="text-sm italic text-[#2d5070] mt-0.5">
                  {{ getSpez(currentEntry) }}
                </div>
              </div>
            </div>

            <!-- Fields table -->
            <table class="w-full text-sm border-collapse">
              <tbody>
                <tr v-if="currentEntry.hazardClass" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('class') }}</td>
                  <td class="field-value">
                    <span class="badge bg-[#0f2744] text-white">{{ currentEntry.hazardClass }}</span>
                  </td>
                </tr>
                <tr v-if="currentEntry.classificationCode" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('classCode') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.classificationCode }}</span></td>
                </tr>
                <tr v-if="currentEntry.packingGroup" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('packingGroup') }}</td>
                  <td class="field-value">
                    <span class="badge bg-[#1e3a5f] text-blue-200">VP-Gr. {{ currentEntry.packingGroup }}</span>
                  </td>
                </tr>
                <tr v-if="currentEntry.hazardLabels" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('labels') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.hazardLabels }}</span></td>
                </tr>
                <tr v-if="currentEntry.exceptedQty" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('exceptedQty') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.exceptedQty }}</span></td>
                </tr>
                <tr v-if="currentEntry.limitedQty" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('limitedQty') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.limitedQty }}</span></td>
                </tr>
                <tr v-if="currentEntry.packingInstructions" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('packingInstr') }}</td>
                  <td class="field-value">
                    <span
                      v-for="p in currentEntry.packingInstructions.split(',')"
                      :key="p"
                      class="badge bg-[#1e3a5f] text-blue-200 mr-0.5"
                    >{{ p.trim() }}</span>
                  </td>
                </tr>
                <tr v-if="currentEntry.transportCategory != null && currentEntry.transportCategory !== ''" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('transportCat') }}</td>
                  <td class="field-value">
                    <span class="badge" :class="bkClass(currentEntry.transportCategory!)">BK {{ currentEntry.transportCategory }}</span>
                    <span v-if="currentEntry.multiplier" class="font-mono text-xs text-[#5a7a99] ml-1.5">
                      × {{ currentEntry.multiplier }}
                    </span>
                  </td>
                </tr>
                <tr v-if="currentEntry.kemlerNumber" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('kemler') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.kemlerNumber }}</span></td>
                </tr>
                <tr v-if="currentEntry.tunnelCode" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('tunnelCode') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.tunnelCode }}</span></td>
                </tr>
                <tr v-if="currentEntry.ems1" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('ems') }}</td>
                  <td class="field-value">
                    <span class="mono-val">{{ currentEntry.ems1 }}{{ currentEntry.ems2 ? ' / ' + currentEntry.ems2 : '' }}</span>
                  </td>
                </tr>
                <tr v-if="currentEntry.stowageCategory" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('stowageCat') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.stowageCategory }}</span></td>
                </tr>
                <tr v-if="currentEntry.stowage" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('stowage') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.stowage }}</span></td>
                </tr>
                <tr v-if="currentEntry.segregation" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('segregation') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.segregation }}</span></td>
                </tr>
                <tr v-if="currentEntry.marpol" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('marpol') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.marpol }}</span></td>
                </tr>
                <tr v-if="currentEntry.packingInstrPassenger" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('piPassenger') }}</td>
                  <td class="field-value">
                    <span class="mono-val">{{ currentEntry.packingInstrPassenger }}</span>
                    <span v-if="currentEntry.maxNetPassenger" class="text-xs text-[#5a7a99] ml-1.5">· max {{ currentEntry.maxNetPassenger }}</span>
                  </td>
                </tr>
                <tr v-if="currentEntry.packingInstrCargo" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('piCargo') }}</td>
                  <td class="field-value">
                    <span class="mono-val">{{ currentEntry.packingInstrCargo }}</span>
                    <span v-if="currentEntry.maxNetCargo" class="text-xs text-[#5a7a99] ml-1.5">· max {{ currentEntry.maxNetCargo }}</span>
                  </td>
                </tr>
                <tr v-if="currentEntry.cones != null && currentEntry.cones !== ''" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('cones') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.cones }}</span></td>
                </tr>
                <tr v-if="currentEntry.equipment" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('equipment') }}</td>
                  <td class="field-value"><span class="mono-val">{{ currentEntry.equipment }}</span></td>
                </tr>
                <tr v-if="currentEntry.remark" class="even:bg-[#dce8f2]">
                  <td class="field-label">{{ L('remark') }}</td>
                  <td class="field-value text-sm leading-relaxed text-[#2d5070]">{{ currentEntry.remark }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Special provisions -->
            <MultimodalSvsAccordion
              v-if="currentEntry.specialProvisions"
              :svs="currentEntry.specialProvisions"
              :label="L('specialProvisions')"
              :no-text="L('noText')"
              :click-load="L('clickLoad')"
              :demo="demo"
            />
          </template>

          <!-- Empty state (no data for current modal) -->
          <div v-else class="text-center py-12 text-[#5a7a99]">
            <div class="text-4xl mb-3 opacity-30">📭</div>
            <p class="text-sm">UN {{ currentUnNumber }} – {{ currentModal }} {{ L('notFound') }}.</p>
          </div>
        </div>
      </div>

      <!-- Initial empty state (no search yet) -->
      <div v-else class="bg-[#f4f7fa] border border-[#b0c4d8] p-14 text-center text-[#5a7a99]">
        <div class="text-5xl mb-3 opacity-30">🌍</div>
        <p class="text-sm leading-relaxed">
          <strong class="text-[#0f2744]">{{ L('searchPlaceholder') }}</strong><br>
          {{ L('bannerSub') }}
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LANGS } from '~/utils/multimodal'
import { useMultimodalTool } from '~/composables/useMultimodalTool'

const props = defineProps<{
  /** Use hardcoded UN 1203 demo data (no API needed) */
  demo?: boolean
}>()

const {
  currentLang, currentModal, currentUnNumber, compareData,
  currentEntry, searchDisplay,
  L, modalDesc, getEntry, getName, getNameSub, getSpez, bkClass,
  setLang, switchModal,
  MODALS,
} = useMultimodalTool({ demo: props.demo })

const showDemoNotice = ref(false)
const hasData = computed(() => Object.keys(compareData.value).length > 0)
</script>

<style scoped>
@reference "tailwindcss";

.field-label {
  @apply font-mono text-[10px] font-bold tracking-[0.5px] uppercase text-[#5a7a99] py-2 px-2.5 border-b border-[#c8d6e5] align-top whitespace-nowrap w-[150px];
}
.field-value {
  @apply py-2 px-2.5 border-b border-[#c8d6e5] align-top text-[#2d5070];
}
.badge {
  @apply inline-block font-mono text-[10px] font-bold px-2 py-0.5 tracking-[0.3px];
}
.mono-val {
  @apply font-mono text-[13px] font-semibold text-[#0f2744];
}
</style>
