import { describe, expect, it } from 'vitest'
import { validateWaitlistInput } from '../server/utils/waitlistValidation'

const VALID = { name: 'Kerem C.', email: 'Ke.Cevik@Example.DE ', consent: true, website: '' }

describe('validateWaitlistInput', () => {
  it('accepts valid input and normalizes the email', () => {
    const r = validateWaitlistInput(VALID)
    expect(r).toEqual({ ok: true, data: { name: 'Kerem C.', email: 'ke.cevik@example.de', honeypot: false } })
  })

  it('rejects non-object bodies', () => {
    expect(validateWaitlistInput(null).ok).toBe(false)
    expect(validateWaitlistInput('x').ok).toBe(false)
  })

  it('rejects names shorter than 2 or longer than 100 chars', () => {
    expect(validateWaitlistInput({ ...VALID, name: 'K' })).toEqual({ ok: false, error: 'invalid_name' })
    expect(validateWaitlistInput({ ...VALID, name: 'x'.repeat(101) })).toEqual({ ok: false, error: 'invalid_name' })
  })

  it('rejects malformed or overlong emails', () => {
    expect(validateWaitlistInput({ ...VALID, email: 'not-an-email' })).toEqual({ ok: false, error: 'invalid_email' })
    expect(validateWaitlistInput({ ...VALID, email: `${'a'.repeat(250)}@x.de` })).toEqual({ ok: false, error: 'invalid_email' })
  })

  it('requires consent to be exactly true', () => {
    expect(validateWaitlistInput({ ...VALID, consent: false })).toEqual({ ok: false, error: 'consent_required' })
    expect(validateWaitlistInput({ ...VALID, consent: 'yes' })).toEqual({ ok: false, error: 'consent_required' })
  })

  it('flags a filled honeypot without rejecting', () => {
    const r = validateWaitlistInput({ ...VALID, website: 'http://spam.example' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.honeypot).toBe(true)
  })
})
