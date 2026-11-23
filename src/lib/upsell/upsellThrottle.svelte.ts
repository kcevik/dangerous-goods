/** at most one sales modal per this interval; the banner covers the time in between */
export const UPSELL_INTERVAL_MS = 10 * 60 * 1000
export const UPSELL_STORAGE_KEY = 'gefahrgut.upsell.lastShown'

/** the slice of the Web Storage API the throttle needs */
export interface UpsellStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface UpsellThrottleOptions {
  now?: () => number
  /** a getter, because merely touching `localStorage` can throw (blocked site data) */
  storage?: () => UpsellStorage | undefined
}

function browserStorage(): UpsellStorage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage
}

/**
 * Decides when the sales modal for locked accounts opens: on the first page view, then on
 * navigation at most every `UPSELL_INTERVAL_MS`. The last-shown time lives in localStorage;
 * when storage is unavailable the modal simply shows again (accepted by the owner).
 */
export class UpsellThrottle {
  open = $state(false)

  readonly #now: () => number
  readonly #storage: () => UpsellStorage | undefined

  constructor({ now = Date.now, storage = browserStorage }: UpsellThrottleOptions = {}) {
    this.#now = now
    this.#storage = storage
  }

  /**
   * Call once per page view. `eligible` is false for active accounts and on `/konto`;
   * an ineligible view closes an open modal (e.g. after its link to `/konto`).
   */
  pageView(eligible: boolean): void {
    if (!eligible) {
      this.open = false
      return
    }
    if (this.open || !this.#due()) return
    this.open = true
    this.#stamp()
  }

  close(): void {
    this.open = false
  }

  #due(): boolean {
    const last = Number.parseInt(this.#read() ?? '', 10)
    if (!Number.isFinite(last)) return true
    const elapsed = this.#now() - last
    // a timestamp from the future (clock change) counts as never shown
    return elapsed < 0 || elapsed >= UPSELL_INTERVAL_MS
  }

  #read(): string | null {
    try {
      return this.#storage()?.getItem(UPSELL_STORAGE_KEY) ?? null
    }
    catch {
      return null
    }
  }

  #stamp(): void {
    try {
      this.#storage()?.setItem(UPSELL_STORAGE_KEY, String(this.#now()))
    }
    catch {
      // storage full or blocked: the modal shows again next time, which is acceptable
    }
  }
}
