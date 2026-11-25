import { describe, expect, it } from 'vitest'
import { UPSELL_INTERVAL_MS, UpsellThrottle } from '$lib/upsell/upsellThrottle.svelte'

function setup(start = 1_000_000_000_000) {
  let now = start
  const throttle = new UpsellThrottle({ now: () => now })
  return { throttle, advance: (ms: number) => { now += ms } }
}

describe('UpsellThrottle', () => {
  it('opens on the first eligible page view', () => {
    const { throttle } = setup()
    expect(throttle.open).toBe(false)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
  })

  it('never opens for an ineligible page view (active user or /konto)', () => {
    const { throttle } = setup()
    throttle.pageView(false)
    expect(throttle.open).toBe(false)
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
    const { throttle, advance } = setup()
    throttle.pageView(true)
    throttle.close()
    advance(UPSELL_INTERVAL_MS)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
  })

  it('treats a clock that went backwards as never shown', () => {
    const { throttle, advance } = setup()
    throttle.pageView(true)
    throttle.close()
    advance(-60_000)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
  })

  it('closes when the next page view is ineligible (e.g. the link to /konto)', () => {
    const { throttle } = setup()
    throttle.pageView(true)
    throttle.pageView(false)
    expect(throttle.open).toBe(false)
  })

  it('keeps an open modal open on a further page view', () => {
    const { throttle, advance } = setup()
    throttle.pageView(true)
    advance(UPSELL_INTERVAL_MS + 1)
    throttle.pageView(true)
    expect(throttle.open).toBe(true)
  })

  it('stores nothing on the device', () => {
    const { throttle } = setup()
    throttle.pageView(true)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
