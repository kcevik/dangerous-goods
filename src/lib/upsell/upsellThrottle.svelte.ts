/** at most one sales modal per this interval; the banner covers the time in between */
export const UPSELL_INTERVAL_MS = 10 * 60 * 1000

export interface UpsellThrottleOptions {
  now?: () => number
}

/**
 * Decides when the sales modal for locked accounts opens: on the first page view, then on
 * navigation at most every `UPSELL_INTERVAL_MS`. The last-shown time lives only in memory
 * (nothing is stored on the device, so no consent under § 25 TDDDG is needed): a reload or a
 * new tab shows the modal again.
 */
export class UpsellThrottle {
  open = $state(false)

  readonly #now: () => number
  #lastShown: number | undefined

  constructor({ now = Date.now }: UpsellThrottleOptions = {}) {
    this.#now = now
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
    this.#lastShown = this.#now()
  }

  close(): void {
    this.open = false
  }

  #due(): boolean {
    if (this.#lastShown === undefined) return true
    const elapsed = this.#now() - this.#lastShown
    // a clock that went backwards counts as never shown
    return elapsed < 0 || elapsed >= UPSELL_INTERVAL_MS
  }
}
