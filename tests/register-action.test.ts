import { describe, expect, it } from 'vitest'
import { actions } from '../src/routes/(auth)/registrieren/+page.server'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

const VALID = { email: 'K@Example.de', password: 'correct-horse-9', passwordRepeat: 'correct-horse-9', consent: 'on' }

describe('register action', () => {
  it('signs up with a confirm redirect and reports sent', async () => {
    const { event, auth } = makeAuthEvent({ fields: VALID, path: '/registrieren' })
    const result = await actions.default(event as never)
    expect(result).toEqual({ sent: true })
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'k@example.de',
      password: 'correct-horse-9',
      options: { emailRedirectTo: 'http://localhost/auth/confirm?next=/dashboard' },
    })
  })

  it('returns the validation error code and keeps the email', async () => {
    const { event, auth } = makeAuthEvent({ fields: { ...VALID, passwordRepeat: 'different-one' } })
    const result = await actions.default(event as never)
    expect(result).toMatchObject({ status: 400, data: { error: 'password_mismatch', email: 'k@example.de' } })
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('requires the consent checkbox', async () => {
    const { event } = makeAuthEvent({ fields: { ...VALID, consent: '' } })
    expect(await actions.default(event as never)).toMatchObject({ status: 400, data: { error: 'consent_required' } })
  })

  it('reports sent even when Supabase says the user exists (no enumeration)', async () => {
    const auth = createAuthMock()
    auth.signUp.mockResolvedValue({ data: { user: null }, error: null })
    expect(await actions.default(makeAuthEvent({ fields: VALID, auth }).event as never)).toEqual({ sent: true })
  })

  it('returns a generic error when Supabase fails', async () => {
    const auth = createAuthMock()
    auth.signUp.mockResolvedValue({ data: {}, error: { message: 'smtp down' } })
    expect(await actions.default(makeAuthEvent({ fields: VALID, auth }).event as never))
      .toMatchObject({ status: 500, data: { error: 'error' } })
  })

  it('rate-limits the 6th registration from one IP per hour', async () => {
    const ip = '198.51.100.10'
    for (let i = 0; i < 5; i++) await actions.default(makeAuthEvent({ fields: VALID, ip }).event as never)
    expect(await actions.default(makeAuthEvent({ fields: VALID, ip }).event as never))
      .toMatchObject({ status: 429, data: { error: 'rateLimited' } })
  })
})
