import type { SupabaseClient } from '@supabase/supabase-js'
import { COMPARE_FIELDS, isForbidden } from './compare'
import { type DetailGroup, detailGroups } from './details'
import { type EmsCode, parseEms } from './ems'
import { fetchCompareForUn } from './mappers'
import {
  BK_CLASSES,
  DATA_MODES,
  type Entry,
  type Lang,
  LABELS,
  type Modal,
  MODAL_DESC_I18N,
  MODALS,
} from './types'
import { groupVariants, matchVariant, orderedNames, type Variant, variantLabel, variantLabels, variantSpecs } from './variants'

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
  /** the last load failed — never shown as "no data", which would be a statement about the regulation */
  loadError = $state(false)
  /** index into the anchor mode's variants (the main picker) */
  selectedVariantIndex = $state(0)
  /** manual pick per mode where matching found no unambiguous variant */
  overrides = $state<Partial<Record<Modal, number>>>({})

  /** the tabs and overview tiles: ADN is empty by design (no BAM data) and shown only as a note */
  readonly modes = DATA_MODES
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
  readonly variantsByMode: Partial<Record<Modal, Variant[]>> = $derived.by(() => {
    const out: Partial<Record<Modal, Variant[]>> = {}
    for (const mode of MODALS) out[mode] = groupVariants(this.compareData[mode] ?? [], mode)
    return out
  })

  /** the first mode with rows; its variants feed the picker */
  readonly anchorMode: Modal | null = $derived(MODALS.find(m => (this.compareData[m]?.length ?? 0) > 0) ?? null)

  readonly anchorVariants: Variant[] = $derived(this.anchorMode ? (this.variantsByMode[this.anchorMode] ?? []) : [])

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

  hasRows(mode: Modal): boolean {
    return (this.compareData[mode]?.length ?? 0) > 0
  }

  variantFor(mode: Modal): Variant | null {
    const variants = this.variantsByMode[mode] ?? []
    if (variants.length === 0) return null
    // out of range → nothing, never a silent fallback to the first variant (review fix)
    const chosen = this.anchorVariants[this.selectedVariantIndex] ?? null
    if (mode === this.anchorMode) return chosen
    const override = this.overrides[mode]
    if (override != null) return variants[override] ?? null
    return chosen ? matchVariant(chosen, variants) : null
  }

  /** the mode has rows, but none corresponds unambiguously to the chosen variant */
  isUnmatched(mode: Modal): boolean {
    return this.hasRows(mode) && this.variantFor(mode) === null
  }

  /** the displayed row of `modal`: the representative of its variant (never blindly row 0) */
  getEntry(modal: string): Entry | null {
    return this.variantFor(modal as Modal)?.representative ?? null
  }

  variantNames(mode: Modal): { primary: string, others: string[] } {
    const variant = this.variantFor(mode)
    if (!variant) return { primary: '', others: [] }
    const [primary = '', ...others] = orderedNames(variant.names, this.currentLang)
    return { primary, others }
  }

  /** every specification of the mode's current variant — a merged variant can carry several */
  variantSpecs(mode: Modal): string[] {
    const variant = this.variantFor(mode)
    return variant ? variantSpecs(variant, this.currentLang, mode) : []
  }

  /** distinguishable among the mode's variants (UN 3481 ICAO: same specification, different names) */
  labelOf(variant: Variant, mode: Modal): string {
    const siblings = this.variantsByMode[mode] ?? []
    const index = siblings.indexOf(variant)
    if (index < 0) return variantLabel(variant, this.currentLang, mode, this.L('pgShort'))
    return variantLabels(siblings, this.currentLang, mode, this.L('pgShort'))[index]!
  }

  /** ICAO "FORBIDDEN" in a packing-instruction column */
  isForbidden(value: string | undefined): boolean {
    return isForbidden(value)
  }

  /** an EmS code without BAM's "!" marker, which stands for the IMDG Code's underlining */
  ems(value: string): EmsCode {
    return parseEms(value)
  }

  /** Table A detail sections of the mode's displayed entry (packaging, tank, carriage, 1.10 …) */
  detailGroups(mode: Modal): DetailGroup[] {
    const entry = this.getEntry(mode)
    return entry ? detailGroups(entry, mode, key => this.L(key)) : []
  }

  /** LABELS keys of fields the regulation has but the BAM feed of `mode` carries no column for */
  sourceGaps(mode: Modal): string[] {
    return COMPARE_FIELDS.filter(f => f.gaps[mode] === 'noSource').map(f => f.labelKey)
  }

  /** a list column ("P001, IBC02, R001") as separate codes */
  codes(value: string): string[] {
    return value.split(',').map(code => code.trim()).filter(Boolean)
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
    if (this.hasRows(modal)) this.currentModal = modal
  }

  selectVariant(index: number): void {
    this.selectedVariantIndex = index
    this.overrides = {}
  }

  overrideVariant(mode: Modal, index: number): void {
    this.overrides = { ...this.overrides, [mode]: index }
  }

  #resetSelection(): void {
    this.selectedVariantIndex = 0
    this.overrides = {}
  }

  async loadCompare(unNumber: string): Promise<void> {
    const cleaned = unNumber.trim()
    if (!cleaned) return
    if (!this.#supabase) throw new Error('MultimodalToolState: no supabase client provided')

    this.isLoading = true
    try {
      const data = await fetchCompareForUn(this.#supabase, cleaned)
      // reset together with the data: a click on the old UN during the load must not carry over
      this.#resetSelection()
      this.compareData = data
      this.currentUnNumber = cleaned
      this.currentModal = firstModeWithRows(data)
      this.loadError = false
    }
    catch {
      // drop the previous UN's rows so they are never shown under the new number
      this.#resetSelection()
      this.compareData = {}
      this.currentUnNumber = cleaned
      this.loadError = true
    }
    finally {
      this.isLoading = false
    }
  }
}
