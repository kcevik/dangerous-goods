import type { Entry } from '$lib/multimodal/types'
import { evaluateLoad, evaluateRow, type LoadResult, type Lookup, type RowResult, suggestUnit, type Unit } from './points'

/** returns the ADR rows of a UN number; throws on failure (never "no data") */
export type EntryFetcher = (unNumber: string) => Promise<Entry[]>

const UN_RE = /^\d{4}$/

/** one line of the load */
export class PointsRowState {
  readonly id: number
  un = $state('')
  quantity = $state('')
  emptyPackaging = $state(false)
  variantKey = $state<string | null>(null)
  lookup = $state<Lookup>({ state: 'idle' })
  #unit = $state<Unit>('kg')
  /** the user picked a unit; suggestions no longer overwrite it */
  unitTouched = false
  /** bumped per lookup so a late answer for an old number is dropped */
  requestId = 0

  readonly result: RowResult = $derived(evaluateRow({
    un: this.un,
    quantity: this.quantity,
    emptyPackaging: this.emptyPackaging,
    lookup: this.lookup,
    variantKey: this.variantKey,
  }))

  constructor(id: number) {
    this.id = id
  }

  get unit(): Unit {
    return this.#unit
  }

  set unit(value: Unit) {
    this.#unit = value
    this.unitTouched = true
  }

  /** a default from the data, unless the user already chose */
  suggestUnit(value: Unit): void {
    if (!this.unitTouched) this.#unit = value
  }
}

/**
 * The 1000-Punkte-Rechner (ADR 1.1.3.6): rows, lookups and the live verdict.
 * Only ever constructed for activated accounts — locked users get no calculator.
 */
export class PointsCalculatorState {
  rows = $state<PointsRowState[]>([])
  readonly summary: LoadResult = $derived(evaluateLoad(this.rows.map(r => r.result)))
  /** rows that carry anything — the print table lists only these */
  readonly filledRows: PointsRowState[] = $derived(this.rows.filter(r => r.result.status !== 'empty'))

  readonly #fetch: EntryFetcher
  /** plain Map on purpose: a lookup cache, nothing renders from it */
  readonly #cache = new Map<string, Entry[]>()
  #nextId = 1

  constructor(fetcher: EntryFetcher) {
    this.#fetch = fetcher
    this.addRow()
  }

  addRow(): PointsRowState {
    const row = new PointsRowState(this.#nextId++)
    // class instances are not proxied: their own $state fields carry the reactivity
    this.rows.push(row)
    return row
  }

  /** the last row is cleared rather than removed, so there is always one to type into */
  removeRow(id: number): void {
    if (this.rows.length <= 1) {
      this.rows = [new PointsRowState(this.#nextId++)]
      return
    }
    this.rows = this.rows.filter(r => r.id !== id)
  }

  setUn(row: PointsRowState, value: string): void {
    row.un = value
    row.variantKey = null
    row.requestId++
    const un = value.trim()
    if (!UN_RE.test(un)) {
      row.lookup = { state: 'idle' }
      return
    }
    const cached = this.#cache.get(un)
    if (cached) {
      this.#apply(row, cached)
      return
    }
    void this.#load(row, un)
  }

  retry(row: PointsRowState): void {
    row.requestId++
    const un = row.un.trim()
    if (UN_RE.test(un)) void this.#load(row, un)
  }

  async #load(row: PointsRowState, un: string): Promise<void> {
    const requestId = row.requestId
    row.lookup = { state: 'loading' }
    try {
      const entries = await this.#fetch(un)
      this.#cache.set(un, entries)
      if (row.requestId === requestId) this.#apply(row, entries)
    }
    catch {
      if (row.requestId === requestId) row.lookup = { state: 'failed' }
    }
  }

  #apply(row: PointsRowState, entries: Entry[]): void {
    row.lookup = { state: 'done', entries }
    if (entries[0]) row.suggestUnit(suggestUnit(entries[0]))
  }
}
