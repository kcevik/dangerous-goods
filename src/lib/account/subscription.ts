/**
 * Subscription placeholder. Stripe plugs in here later: flip CHECKOUT_AVAILABLE, add a
 * `?/subscribe` action on /konto that creates a Checkout session, and a webhook that sets
 * `profiles.activated_at` (the same column the owner sets by hand today).
 */
export const CHECKOUT_AVAILABLE = false

export type SubscriptionStatus
  = { kind: 'active', since: string | null }
    | { kind: 'locked' }
    | { kind: 'unknown' }

const DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
})

export function formatGermanDate(iso: string): string | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : DATE_FORMAT.format(d)
}

/** A failed profile query is "unknown", never "locked" — a failure is not a statement. */
export function subscriptionStatus(opts: { activatedAt: string | null, failed: boolean }): SubscriptionStatus {
  if (opts.failed) return { kind: 'unknown' }
  if (!opts.activatedAt) return { kind: 'locked' }
  return { kind: 'active', since: formatGermanDate(opts.activatedAt) }
}
