import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchCompareForUn } from './mappers'
import {
  BK_CLASSES,
  type Entry,
  type Lang,
  LABELS,
  type Modal,
  MODAL_DESC_I18N,
  MODALS,
} from './types'

export interface MultimodalToolOptions {
  /** Pre-loaded comparison data (demo data, or server-loaded data on the UN page) */
  initialData?: Record<string, Entry[]>
  /** UN number the initial data belongs to */
  initialUnNumber?: string
  /** Needed only if `loadCompare` will be called client-side */
  supabase?: SupabaseClient
}

function firstModeWithRows(data: Record<string, Entry[]>): Modal {
  return MODALS.find(m => data[m]?.length) ?? 'ADR'
}

export class MultimodalToolState {
  // ── State ──────────────────────────────────────────────────
  currentLang = $state<Lang>('de')
  currentModal = $state<Modal>('ADR')
  currentUnNumber = $state('')
  compareData = $state<Record<string, Entry[]>>({})
  isLoading = $state(false)

  readonly MODALS = MODALS
  readonly #supabase: SupabaseClient | undefined

  constructor(options: MultimodalToolOptions = {}) {
    this.#supabase = options.supabase
    if (options.initialData) {
      this.compareData = options.initialData
      this.currentModal = firstModeWithRows(options.initialData)
    }
    if (options.initialUnNumber) this.currentUnNumber = options.initialUnNumber
  }

  // ── Derived ────────────────────────────────────────────────
  readonly currentEntry: Entry | null = $derived.by(() => this.getEntry(this.currentModal))

  readonly hasData: boolean = $derived(
    Object.values(this.compareData).some(arr => arr && arr.length > 0),
  )

  readonly searchDisplay: string = $derived.by(() => {
    if (!this.currentUnNumber) return ''
    const entry = this.getEntry('ADR') ?? this.getEntry('RID') ?? this.getEntry('IMDG') ?? this.getEntry('ICAO') ?? this.getEntry('ADN')
    if (!entry) return `UN ${this.currentUnNumber}`
    return `UN ${this.currentUnNumber} – ${this.getName(entry)}`
  })

  // ── Helpers ────────────────────────────────────────────────
  L(key: string): string {
    return LABELS[this.currentLang]?.[key] ?? LABELS.de[key] ?? key
  }

  modalDesc(modal: Modal): string {
    return MODAL_DESC_I18N[this.currentLang]?.[modal] ?? modal
  }

  getEntry(modal: string): Entry | null {
    return this.compareData[modal]?.[0] ?? null
  }

  getName(entry: Entry): string {
    if (this.currentModal === 'ICAO') return entry.name ?? ''
    if (this.currentLang === 'en') return entry.nameEn ?? entry.name ?? ''
    if (this.currentLang === 'fr') return entry.nameFr ?? entry.nameEn ?? entry.name ?? ''
    if (this.currentLang === 'tr') return entry.nameEn ?? entry.name ?? ''
    return entry.name ?? entry.nameEn ?? ''
  }

  getNameSub(entry: Entry): string {
    if (this.currentModal === 'ICAO') return ''
    const all: Record<string, string | undefined> = { de: entry.name, en: entry.nameEn, fr: entry.nameFr }
    return Object.entries(all)
      .filter(([l, v]) => l !== this.currentLang && v)
      .map(([, v]) => v)
      .join(' · ')
  }

  getSpez(entry: Entry): string {
    if (this.currentLang === 'en') return entry.specificationEn ?? entry.specification ?? ''
    if (this.currentLang === 'fr') return entry.specificationFr ?? entry.specificationEn ?? entry.specification ?? ''
    if (this.currentLang === 'tr') return entry.specificationEn ?? entry.specification ?? ''
    return entry.specification ?? ''
  }

  bkClass(bk: string | number): string {
    return BK_CLASSES[String(bk)] ?? 'bg-gray-200 text-gray-600'
  }

  // ── Actions ────────────────────────────────────────────────
  setLang(lang: Lang): void {
    this.currentLang = lang
  }

  switchModal(modal: Modal): void {
    if (this.compareData[modal]) this.currentModal = modal
  }

  async loadCompare(unNumber: string): Promise<void> {
    const cleaned = unNumber.trim()
    if (!cleaned) return
    if (!this.#supabase) throw new Error('MultimodalToolState: no supabase client provided')

    this.isLoading = true
    try {
      const data = await fetchCompareForUn(this.#supabase, cleaned)
      this.compareData = data
      this.currentUnNumber = cleaned
      this.currentModal = firstModeWithRows(data)
    }
    finally {
      this.isLoading = false
    }
  }
}
