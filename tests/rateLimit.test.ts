import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRateLimiter } from '$lib/server/rateLimit'

describe('createRateLimiter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('allows up to max hits and blocks the next one', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000 })
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(false)
  })

  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip2')).toBe(true)
    expect(limiter.check('ip1')).toBe(false)
  })

  it('frees the slot after the window expires (sliding window)', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 1000 })
    limiter.check('ip1')
    vi.advanceTimersByTime(600)
    limiter.check('ip1')
    expect(limiter.check('ip1')).toBe(false)
    vi.advanceTimersByTime(500) // first hit now outside window
    expect(limiter.check('ip1')).toBe(true)
  })

  it('allows a full new batch of max hits once every previous hit has expired (no stale state leaks)', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 1000 })
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(false)

    vi.advanceTimersByTime(1001) // all hits now outside window

    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(false)
  })
})
