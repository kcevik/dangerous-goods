import { describe, expect, it } from 'vitest'
import { AuthFormState } from '$lib/auth/authForm.svelte'

describe('AuthFormState.canSubmit', () => {
  it('login needs email and any password', () => {
    const f = new AuthFormState('login')
    expect(f.canSubmit).toBe(false)
    f.email = 'k@example.de'
    expect(f.canSubmit).toBe(false)
    f.password = 'x'
    expect(f.canSubmit).toBe(true)
  })

  it('register needs email, a 10+ char password, a matching repeat and consent', () => {
    const f = new AuthFormState('register')
    f.email = 'k@example.de'
    f.password = 'correct-horse-9'
    f.passwordRepeat = 'correct-horse-9'
    expect(f.canSubmit).toBe(false)
    f.consent = true
    expect(f.canSubmit).toBe(true)
    f.passwordRepeat = 'other'
    expect(f.canSubmit).toBe(false)
    f.passwordRepeat = 'short'
    f.password = 'short'
    expect(f.canSubmit).toBe(false)
  })

  it('reset needs only an email', () => {
    const f = new AuthFormState('reset')
    expect(f.canSubmit).toBe(false)
    f.email = 'k@example.de'
    expect(f.canSubmit).toBe(true)
  })

  it('newPassword needs a 10+ char password and a matching repeat', () => {
    const f = new AuthFormState('newPassword')
    f.password = 'correct-horse-9'
    expect(f.canSubmit).toBe(false)
    f.passwordRepeat = 'correct-horse-9'
    expect(f.canSubmit).toBe(true)
  })

  it('never submits while submitting', () => {
    const f = new AuthFormState('reset')
    f.email = 'k@example.de'
    f.status = 'submitting'
    expect(f.canSubmit).toBe(false)
  })

  it('rejects malformed emails everywhere', () => {
    const f = new AuthFormState('reset')
    f.email = 'nope'
    expect(f.canSubmit).toBe(false)
  })
})
