import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_VERSION } from '$lib/prelaunch/consent'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string | undefined> }))
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))

const { actions, load } = await import('../src/routes/(auth)/registrieren/+page.server')

const VALID = { email: 'K@Example.de', password: 'correct-horse-9', passwordRepeat: 'correct-horse-9', consent: 'on' }

beforeEach(() => {
  delete dynamicEnv.REGISTRATION_MODE
})

describe('registrieren load', () => {
  it('reports the mode', async () => {
    expect(await load({} as never)).toEqual({ mode: 'waitlist' })
    dynamicEnv.REGISTRATION_MODE = 'open'
    expect(await load({} as never)).toEqual({ mode: 'open' })
  })
})

describe('register action — open mode', () => {
  beforeEach(() => {
    dynamicEnv.REGISTRATION_MODE = 'open'
  })

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

describe('register action — waitlist mode (default)', () => {
  it('never creates an account, even when password fields are posted', async () => {
    const { event, auth, rpc } = makeAuthEvent({ fields: VALID })
    expect(await actions.default(event as never)).toEqual({ notified: true })
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('join_launch_list', { p_email: 'k@example.de', p_consent_version: CONSENT_VERSION })
  })

  it('normalises the address before storing it', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: '  K@Example.DE ', consent: 'on' } })
    await actions.default(event as never)
    expect(rpc).toHaveBeenCalledWith('join_launch_list', expect.objectContaining({ p_email: 'k@example.de' }))
  })

  it('answers an already listed address exactly like a new one', async () => {
    const first = makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' } })
    const second = makeAuthEvent({ fields: { email: 'K@example.de', consent: 'on' } })
    expect(await actions.default(first.event as never)).toEqual({ notified: true })
    expect(await actions.default(second.event as never)).toEqual({ notified: true })
  })

  it('treats a filled honeypot as success without writing', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: 'bot@example.de', consent: 'on', website: 'http://spam' } })
    expect(await actions.default(event as never)).toEqual({ notified: true })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects an invalid address and keeps what was typed', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: 'nope', consent: 'on' } })
    expect(await actions.default(event as never)).toMatchObject({ status: 400, data: { error: 'invalid_email', email: 'nope' } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('requires consent', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: 'k@example.de' } })
    expect(await actions.default(event as never)).toMatchObject({ status: 400, data: { error: 'consent_required' } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('returns the generic error when the database refuses', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }))
    const { event } = makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' }, rpc })
    expect(await actions.default(event as never)).toMatchObject({ status: 500, data: { error: 'error' } })
  })

  it('rate-limits to 5 per address per hour', async () => {
    for (let i = 0; i < 5; i++) {
      expect(await actions.default(makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' }, ip: '10.9.9.9' }).event as never)).toEqual({ notified: true })
    }
    expect(await actions.default(makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' }, ip: '10.9.9.9' }).event as never))
      .toMatchObject({ status: 429, data: { error: 'rateLimited' } })
  })
})
