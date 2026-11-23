import { buildComparison, type CompareCell, type CompareRow, summarizeDeviations } from './compare'
import { type Entry, type Lang, LABELS, type Modal, MODAL_DESC_I18N, MODALS } from './types'
import { groupVariants, matchVariant, orderedNames, type Source, type Variant, variantLabel } from './variants'

/**
 * View state of /un/:nummer/vergleich. The data is fixed per instance (the page re-mounts per
 * UN number); the user's choices — language, variant, manual picks, filter — are state.
 */
export class ComparisonViewState {
  currentLang = $state<Lang>('de')
  selectedVariantIndex = $state(0)
  overrides = $state<Partial<Record<Modal, number>>>({})
  onlyDifferences = $state(false)

  readonly variantsByMode: Partial<Record<Modal, Variant[]>>
  /** modes whose chosen variant takes part in the comparison */
  readonly comparedModes: Modal[] = $derived(MODALS.filter(m => this.variantFor(m) !== null))

  /** modes with rows that could not be compared (no unambiguous variant, no manual pick) */
  readonly unresolvedModes: Modal[] = $derived(MODALS.filter(m => this.hasRows(m) && this.variantFor(m) === null))

  readonly referenceVariants: Variant[]
  readonly anchorMode: Modal | null
  readonly anchorVariants: Variant[]
  readonly hasReference: boolean

  constructor(data: Record<string, Entry[]>, reference: readonly Entry[] = []) {
    const byMode: Partial<Record<Modal, Variant[]>> = {}
    for (const mode of MODALS) byMode[mode] = groupVariants(data[mode] ?? [], mode)
    this.variantsByMode = byMode
    this.referenceVariants = groupVariants(reference, 'UN')
    this.anchorMode = MODALS.find(m => (byMode[m]?.length ?? 0) > 0) ?? null
    this.anchorVariants = this.anchorMode ? (byMode[this.anchorMode] ?? []) : []
    this.hasReference = this.referenceVariants.length > 0
  }

  /** the anchor variant; null only for an out-of-range index (never a silent fallback) */
  readonly chosen: Variant | null = $derived.by(() => this.anchorVariants[this.selectedVariantIndex] ?? null)

  hasRows(mode: Modal): boolean {
    return (this.variantsByMode[mode]?.length ?? 0) > 0
  }

  /** automatic match, ignoring manual picks */
  #matched(mode: Modal): Variant | null {
    const variants = this.variantsByMode[mode] ?? []
    if (variants.length === 0 || !this.chosen) return null
    if (mode === this.anchorMode) return this.chosen
    return matchVariant(this.chosen, variants)
  }

  variantFor(mode: Modal): Variant | null {
    const override = mode === this.anchorMode ? undefined : this.overrides[mode]
    if (override != null) return this.variantsByMode[mode]?.[override] ?? null
    return this.#matched(mode)
  }

  /** modes with rows but no automatic match; they keep their picker after a manual pick */
  readonly pickModes: Modal[] = $derived(MODALS.filter(m => this.chosen !== null && this.hasRows(m) && this.#matched(m) === null))

  readonly referenceVariant: Variant | null = $derived.by(() => (this.chosen ? matchVariant(this.chosen, this.referenceVariants) : null))

  readonly rows: CompareRow[] = $derived.by(() => {
    const selection: Partial<Record<Modal, Entry | null>> = {}
    const unresolved: Modal[] = []
    for (const mode of MODALS) {
      const variant = this.variantFor(mode)
      selection[mode] = variant?.representative ?? null
      if (!variant && this.hasRows(mode)) unresolved.push(mode)
    }
    return buildComparison(selection, {
      reference: this.referenceVariant?.representative ?? null,
      referenceUnresolved: this.hasReference && this.referenceVariant === null,
      unresolved,
    })
  })

  readonly visibleRows: CompareRow[] = $derived(
    this.rows.filter(r => r.status !== 'missing' && (!this.onlyDifferences || r.status === 'differs')),
  )

  readonly deviations: CompareRow[] = $derived(summarizeDeviations(this.rows))

  readonly title: { primary: string, others: string[] } = $derived.by(() => {
    const [primary = '', ...others] = this.chosen ? orderedNames(this.chosen.names, this.currentLang) : []
    return { primary, others }
  })

  L(key: string): string {
    return LABELS[this.currentLang]?.[key] ?? LABELS.de[key] ?? key
  }

  modalDesc(mode: Modal): string {
    return MODAL_DESC_I18N[this.currentLang]?.[mode] ?? mode
  }

  labelOf(variant: Variant, mode: Source): string {
    return variantLabel(variant, this.currentLang, mode, this.L('pgShort'))
  }

  /**
   * What a cell means beyond its visible value (shown as `title` and read out as sr-only text);
   * undefined = the value speaks for itself. The UN reference column is never compared, so it
   * never says "not compared".
   */
  cellHint(cell: CompareCell, isReference = false): string | undefined {
    if (!cell.applicable) return this.L('notApplicable')
    if (cell.unresolved) return this.L('unresolved')
    if (!isReference && cell.raw && !cell.compared) return this.L('notCompared')
    return undefined
  }

  /** screen-reader name of a deviation (colour and ▲ alone are not enough) */
  deviationLabel(row: CompareRow, cell: CompareCell): string | undefined {
    if (!cell.deviates) return undefined
    return this.L(row.critical ? 'legendCritical' : 'legendDiffers')
  }

  /** the modes a mobile card lists for a row: every mode with data for the field (ADN has none) */
  cardModes(row: CompareRow): Modal[] {
    return MODALS.filter(m => m !== 'ADN' && row.cells[m].applicable)
  }

  /** "ADR 5 L · RID 5 L · IMDG 1 L" — what each compared mode says, no advice */
  deviationText(row: CompareRow): string {
    return MODALS
      .filter(m => row.cells[m].compared && row.cells[m].raw)
      .map(m => `${m} ${row.cells[m].raw}`)
      .join(' · ')
  }

  /** "ADR, RID und IMDG" in the current language */
  joinModes(modes: readonly Modal[]): string {
    if (modes.length <= 1) return modes.join('')
    return `${modes.slice(0, -1).join(', ')} ${this.L('and')} ${modes.at(-1)}`
  }

  setLang(lang: Lang): void {
    this.currentLang = lang
  }

  selectVariant(index: number): void {
    this.selectedVariantIndex = index
    this.overrides = {}
  }

  overrideVariant(mode: Modal, index: number): void {
    this.overrides = { ...this.overrides, [mode]: index }
  }
}

/** text/background classes of a mode's cell — shared by the table and the mobile cards */
export function cellTone(row: CompareRow, cell: CompareCell): string {
  if (cell.deviates) return row.critical ? 'bg-orange-100 text-orange-900 font-bold' : 'bg-amber-50 text-[#0f2744] font-semibold'
  if (cell.raw && !cell.compared) return 'text-[#5a7a99] italic'
  return row.status === 'same' ? 'text-[#5a7a99]' : 'text-[#0f2744]'
}
