// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ACCOUNT_DELETE_CONFIRM_WORD, ACCOUNT_MESSAGES, ADDRESS_ERROR_MESSAGES } from '$lib/account/messages'
import { CHECKOUT_AVAILABLE, formatGermanDate, subscriptionStatus } from '$lib/account/subscription'

describe('account messages', () => {
  it('has a non-empty German message for every code', () => {
    for (const [code, text] of Object.entries({ ...ACCOUNT_MESSAGES, ...ADDRESS_ERROR_MESSAGES })) {
      expect(text.length, code).toBeGreaterThan(10)
    }
  })

  it('addresses the user with "du", never "Sie"', () => {
    const all = Object.values({ ...ACCOUNT_MESSAGES, ...ADDRESS_ERROR_MESSAGES }).join(' ')
    expect(all).not.toMatch(/\b(Sie|Ihr|Ihre)\b/)
  })

  it('names the confirmation word in the confirm message', () => {
    expect(ACCOUNT_MESSAGES.confirm_required).toContain(ACCOUNT_DELETE_CONFIRM_WORD)
    expect(ACCOUNT_DELETE_CONFIRM_WORD).toBe('LÖSCHEN')
  })
})

describe('subscriptionStatus', () => {
  it('is active with the activation date', () => {
    expect(subscriptionStatus({ activatedAt: '2026-11-01T09:30:00Z', failed: false })).toEqual({ kind: 'active', since: '01.11.2026' })
  })

  it('is locked without an activation date', () => {
    expect(subscriptionStatus({ activatedAt: null, failed: false })).toEqual({ kind: 'locked' })
  })

  it('is unknown when the profile could not be loaded — never "locked"', () => {
    expect(subscriptionStatus({ activatedAt: null, failed: true })).toEqual({ kind: 'unknown' })
  })
})

describe('formatGermanDate', () => {
  it('formats in Berlin time', () => {
    expect(formatGermanDate('2026-12-31T23:30:00Z')).toBe('01.01.2027')
  })
})

describe('checkout', () => {
  it('is not available yet (no Stripe)', () => {
    expect(CHECKOUT_AVAILABLE).toBe(false)
  })
})
