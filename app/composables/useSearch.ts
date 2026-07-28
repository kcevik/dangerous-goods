import { ref, watch } from 'vue'

export interface SearchResult {
  unNumber: string
  name: string | null
  nameEn: string | null
  nameFr: string | null
  hazardClass: string | null
  packingGroup: string | null
}

const UN_NUMBER_RE = /^\d{4}$/
export const MIN_QUERY_LENGTH = 2

export function useSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const selectedUn = ref<string | null>(null)
  const isLoading = ref(false)

  const supabase = useSupabaseClient()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestId = 0

  async function search(q: string): Promise<void> {
    // strip PostgREST filter delimiters so user input can't break the .or() string
    const trimmed = q.trim().replace(/[,()]/g, '')
    if (trimmed.length < MIN_QUERY_LENGTH) {
      results.value = []
      return
    }

    const currentRequest = ++requestId
    isLoading.value = true
    try {
      const filters = [
        `name.ilike.%${trimmed}%`,
        `name_en.ilike.%${trimmed}%`,
        `name_fr.ilike.%${trimmed}%`,
      ]
      if (/^\d+$/.test(trimmed)) filters.push(`un_number.ilike.${trimmed}%`)

      const { data, error } = await supabase
        .from('adr_entries')
        .select('un_number, name, name_en, name_fr, hazard_class, packing_group')
        .or(filters.join(','))
        .order('un_number')
        .limit(20)

      if (currentRequest !== requestId) return
      if (error) throw error
      results.value = (data ?? []).map(r => ({
        unNumber: String(r.un_number),
        name: r.name as string | null,
        nameEn: r.name_en as string | null,
        nameFr: r.name_fr as string | null,
        hazardClass: r.hazard_class as string | null,
        packingGroup: r.packing_group as string | null,
      }))
    }
    catch {
      if (currentRequest === requestId) results.value = []
    }
    finally {
      if (currentRequest === requestId) isLoading.value = false
    }
  }

  watch(query, (val) => {
    const trimmed = val.trim()
    if (debounceTimer) clearTimeout(debounceTimer)

    // 4-digit UN number: load tool immediately, skip debounce
    if (UN_NUMBER_RE.test(trimmed)) {
      results.value = []
      selectedUn.value = trimmed
      return
    }

    selectedUn.value = null
    if (trimmed.length < MIN_QUERY_LENGTH) {
      results.value = []
      return
    }
    debounceTimer = setTimeout(() => search(val), 300)
  })

  function select(unNumber: string) {
    selectedUn.value = unNumber
    results.value = []
  }

  return {
    query,
    results,
    selectedUn,
    isLoading,
    select,
  }
}
