import { describe, expect, it } from 'vitest'
import { UPSELL_INTERVAL_MS, UPSELL_STORAGE_KEY, UpsellThrottle, type UpsellStorage } from '$lib/upsell/upsellThrottle.svelte'

function memoryStorage(initial: Record<string, string> = {}): UpsellStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value },
  }
}

function setup(start = 1_000_000_000_000, initial: Record<string, string> = {}) {
  let now = start
  const storage = memoryStorage(initial)
  const throttle = new UpsellThrottle({ now: () => now, storage: () => storage })
  return {
    throttle,
    storage,
    advance: (ms: number) => { now += ms },
    now: () => now,
  }
}

describe('UpsellThrottle', () => {
  it('opens on the first eligible page view and stores the time', () => {
    const { throttle, storage, now } = setup()
    expect(throttle.open).toBe(false)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
    expect(storage.data[UPSELL_STORAGE_KEY]).toBe(String(now()))
  })

  it('never opens for an ineligible page view (active user or /konto)', () => {
    const { throttle, storage } = setup()
    throttle.pageView(false)
    expect(throttle.open).toBe(false)
    expect(storage.data).toEqual({})
  })

  it('stays closed on navigation before 10 minutes have passed', () => {
    const { throttle, advance } = setup()
    throttle.pageView(true)
    throttle.close()
    advance(UPSELL_INTERVAL_MS - 1)
    throttle.pageView(true)
    expect(throttle.open).toBe(false)
  })

  it('opens again on navigation once 10 minutes have passed', () => {
    const { throttle, storage, advance, now } = setup()
    throttle.pageView(true)
    throttle.close()
    advance(UPSELL_INTERVAL_MS)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
    expect(storage.data[UPSELL_STORAGE_KEY]).toBe(String(now()))
  })

  it('respects a timestamp stored by an earlier visit', () => {
    const start = 1_000_000_000_000
    const recent = setup(start, { [UPSELL_STORAGE_KEY]: String(start - 60_000) })
    recent.throttle.pageView(true)
    expect(recent.throttle.open).toBe(false)

    const old = setup(start, { [UPSELL_STORAGE_KEY]: String(start - UPSELL_INTERVAL_MS - 1) })
    old.throttle.pageView(true)
    expect(old.throttle.open).toBe(true)
  })

  it('treats a garbled or future timestamp as never shown', () => {
    const start = 1_000_000_000_000
    const garbled = setup(start, { [UPSELL_STORAGE_KEY]: 'nonsense' })
    garbled.throttle.pageView(true)
    expect(garbled.throttle.open).toBe(true)

    const future = setup(start, { [UPSELL_STORAGE_KEY]: String(start + 60_000) })
    future.throttle.pageView(true)
    expect(future.throttle.open).toBe(true)
  })

  it('closes when the next page view is ineligible (e.g. the link to /konto)', () => {
    const { throttle } = setup()
    throttle.pageView(true)
    throttle.pageView(false)
    expect(throttle.open).toBe(false)
  })

  it('keeps an open modal open on a further page view without re-stamping', () => {
    const { throttle, storage, advance } = setup()
    throttle.pageView(true)
    const stamped = storage.data[UPSELL_STORAGE_KEY]
    advance(UPSELL_INTERVAL_MS + 1)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
    expect(storage.data[UPSELL_STORAGE_KEY]).toBe(stamped)
  })

  it('shows the modal on every view when storage throws', () => {
    const throwing: UpsellStorage = {
      getItem: () => { throw new Error('SecurityError') },
      setItem: () => { throw new Error('QuotaExceededError') },
    }
    const throttle = new UpsellThrottle({ now: () => 0, storage: () => throwing })
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
    throttle.close()
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
  })

  it('shows the modal when even reaching storage throws or it is missing', () => {
    const blocked = new UpsellThrottle({ now: () => 0, storage: () => { throw new Error('denied') } })
    blocked.pageView(true)
    expect(blocked.open).toBe(true)

    const missing = new UpsellThrottle({ now: () => 0, storage: () => undefined })
    missing.pageView(true)
    expect(missing.open).toBe(true)
  })
})
