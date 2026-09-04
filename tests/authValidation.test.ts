import { describe, expect, it } from 'vitest'
import { validateEmail, validatePassword, validateRegistration } from '$lib/server/authValidation'

const VALID = { email: ' Ke.Cevik@Example.DE ', password: 'correct-horse-9', passwordRepeat: 'correct-horse-9', consent: true }

describe('validateEmail', () => {
  it('normalizes to trimmed lowercase', () => {
    expect(validateEmail(' Ke.Cevik@Example.DE ')).toEqual({ ok: true, email: 'ke.cevik@example.de' })
  })

  it('rejects malformed, overlong and non-string values', () => {
    expect(validateEmail('not-an-email')).toEqual({ ok: false, error: 'invalid_email' })
    expect(validateEmail(`${'a'.repeat(250)}@x.de`)).toEqual({ ok: false, error: 'invalid_email' })
    expect(validateEmail(42)).toEqual({ ok: false, error: 'invalid_email' })
    expect(validateEmail(null)).toEqual({ ok: false, error: 'invalid_email' })
  })
})

describe('validatePassword', () => {
  it('accepts 10 or more characters', () => {
    expect(validatePassword('abcdefghij')).toEqual({ ok: true, password: 'abcdefghij' })
  })

  it('rejects shorter passwords and non-strings', () => {
    expect(validatePassword('abcdefghi')).toEqual({ ok: false, error: 'weak_password' })
    expect(validatePassword(undefined)).toEqual({ ok: false, error: 'weak_password' })
  })

  it('does not trim passwords', () => {
    expect(validatePassword(' abcdefghij ')).toEqual({ ok: true, password: ' abcdefghij ' })
  })
})

describe('validateRegistration', () => {
  it('returns normalized email and password for valid input', () => {
    expect(validateRegistration(VALID)).toEqual({ ok: true, data: { email: 'ke.cevik@example.de', password: 'correct-horse-9' } })
  })

  it('rejects non-object bodies', () => {
    expect(validateRegistration(null)).toEqual({ ok: false, error: 'invalid_email' })
  })

  it('reports errors in order: email, password, mismatch, consent', () => {
    expect(validateRegistration({ ...VALID, email: 'x' })).toEqual({ ok: false, error: 'invalid_email' })
    expect(validateRegistration({ ...VALID, password: 'short', passwordRepeat: 'short' })).toEqual({ ok: false, error: 'weak_password' })
    expect(validateRegistration({ ...VALID, passwordRepeat: 'different-one' })).toEqual({ ok: false, error: 'password_mismatch' })
    expect(validateRegistration({ ...VALID, consent: 'yes' })).toEqual({ ok: false, error: 'consent_required' })
  })
})
