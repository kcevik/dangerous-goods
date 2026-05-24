import { ref, computed } from 'vue'
import {
  type Entry,
  type Modal,
  type Lang,
  MODALS,
  MODAL_DESC_I18N,
  LABELS,
  DEMO_DATA,
  BK_CLASSES,
} from '~/utils/multimodal'
import { fetchCompareForUn } from '~/utils/multimodalMappers'

interface UseMultimodalToolOptions {
  /** Pre-load UN 1203 demo data instead of calling the API */
  demo?: boolean
}

export function useMultimodalTool(options: UseMultimodalToolOptions = {}) {
  // ── State ──────────────────────────────────────────────────
  const currentLang = ref<Lang>('de')
  const currentModal = ref<Modal>('ADR')
  const currentUnNumber = ref(options.demo ? '1203' : '')
  const compareData = ref<Record<string, Entry[]>>(options.demo ? DEMO_DATA : {})
  const isLoading = ref(false)

  // ── Computed ───────────────────────────────────────────────
  const currentEntry = computed<Entry | null>(() => getEntry(currentModal.value))

  const searchDisplay = computed(() => {
    if (!currentUnNumber.value) return ''
    const entry = getEntry('ADR') ?? getEntry('RID') ?? getEntry('IMDG') ?? getEntry('ICAO') ?? getEntry('ADN')
    if (!entry) return `UN ${currentUnNumber.value}`
    return `UN ${currentUnNumber.value} – ${getName(entry)}`
  })

  // ── Helpers ────────────────────────────────────────────────
  function L(key: string): string {
    return LABELS[currentLang.value]?.[key] ?? LABELS.de[key] ?? key
  }

  function modalDesc(modal: Modal): string {
    return MODAL_DESC_I18N[currentLang.value]?.[modal] ?? modal
  }

  function getEntry(modal: string): Entry | null {
    return compareData.value[modal]?.[0] ?? null
  }

  function getName(entry: Entry): string {
    if (currentModal.value === 'ICAO') return entry.name ?? ''
    if (currentLang.value === 'en') return entry.nameEn ?? entry.name ?? ''
    if (currentLang.value === 'fr') return entry.nameFr ?? entry.nameEn ?? entry.name ?? ''
    if (currentLang.value === 'tr') return entry.nameEn ?? entry.name ?? ''
    return entry.name ?? entry.nameEn ?? ''
  }

  function getNameSub(entry: Entry): string {
    if (currentModal.value === 'ICAO') return ''
    const all: Record<string, string | undefined> = { de: entry.name, en: entry.nameEn, fr: entry.nameFr }
    return Object.entries(all)
      .filter(([l, v]) => l !== currentLang.value && v)
      .map(([, v]) => v)
      .join(' · ')
  }

  function getSpez(entry: Entry): string {
    if (currentLang.value === 'en') return entry.specificationEn ?? entry.specification ?? ''
    if (currentLang.value === 'fr') return entry.specificationFr ?? entry.specificationEn ?? entry.specification ?? ''
    if (currentLang.value === 'tr') return entry.specificationEn ?? entry.specification ?? ''
    return entry.specification ?? ''
  }

  function bkClass(bk: string | number): string {
    return BK_CLASSES[String(bk)] ?? 'bg-gray-200 text-gray-600'
  }

  // ── Actions ────────────────────────────────────────────────
  function setLang(lang: Lang) {
    currentLang.value = lang
  }

  function switchModal(modal: Modal) {
    if (compareData.value[modal]) currentModal.value = modal
  }

  async function loadCompare(unNumber: string): Promise<void> {
    const cleaned = unNumber.trim()
    if (!cleaned) return

    isLoading.value = true
    try {
      const supabase = useSupabaseClient()
      const data = await fetchCompareForUn(supabase, cleaned)
      compareData.value = data
      currentUnNumber.value = cleaned
      const firstAvailable = MODALS.find(m => data[m]?.length)
      if (firstAvailable) currentModal.value = firstAvailable
    } finally {
      isLoading.value = false
    }
  }

  return {
    // state
    currentLang,
    currentModal,
    currentUnNumber,
    compareData,
    isLoading,
    // computed
    currentEntry,
    searchDisplay,
    // helpers
    L,
    modalDesc,
    getEntry,
    getName,
    getNameSub,
    getSpez,
    bkClass,
    // actions
    setLang,
    switchModal,
    loadCompare,
    // re-export constants for templates
    MODALS,
  }
}
