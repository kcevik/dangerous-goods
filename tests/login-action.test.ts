import { describe, expect, it } from 'vitest'
import { actions, load } from '../src/routes/(auth)/login/+page.server'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

const CREDS = { email: ' K@Example.DE ', password: 'correct-horse-9' }

describe('login load', () => {
  it('passes a safe next target to the page', async () => {
    expect(await load({ url: new URL('http://localhost/login?next=%2Fsuche') } as never)).toEqual({ next: '/suche' })
    expect(await load({ url: new URL('http://localhost/login?next=//evil') } as never)).toEqual({ next: '/dashboard' })
  })
})

describe('login action', () => {
  it('signs in with the normalized email and redirects to the dashboard', async () => {
    const { event, auth } = makeAuthEvent({ fields: CREDS })
    await expect(actions.default(event as never)).rejects.toMatchObject({ status: 303, location: '/dashboard' })
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'k@example.de', password: 'correct-horse-9' })
  })

  it('honours a safe next field and ignores an unsafe one', async () => {
    await expect(actions.default(makeAuthEvent({ fields: { ...CREDS, next: '/un/1203' } }).event as never))
      .rejects.toMatchObject({ status: 303, location: '/un/1203' })
    await expect(actions.default(makeAuthEvent({ fields: { ...CREDS, next: 'https://evil.com' } }).event as never))
      .rejects.toMatchObject({ status: 303, location: '/dashboard' })
  })

  it('returns invalid_credentials on an auth error without leaking details', async () => {
    const auth = createAuthMock()
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const result = await actions.default(makeAuthEvent({ fields: CREDS, auth }).event as never)
    expect(result).toMatchObject({ status: 400, data: { error: 'invalid_credentials', email: 'k@example.de' } })
  })

  it('rejects a malformed email before calling Supabase', async () => {
    const { event, auth } = makeAuthEvent({ fields: { email: 'nope', password: 'x' } })
    const result = await actions.default(event as never)
    expect(result).toMatchObject({ status: 400, data: { error: 'invalid_credentials' } })
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('rate-limits the 11th attempt from one IP', async () => {
    const auth = createAuthMock()
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'bad' } })
    const ip = '198.51.100.9'
    for (let i = 0; i < 10; i++) {
      await actions.default(makeAuthEvent({ fields: CREDS, auth, ip }).event as never)
    }
    const result = await actions.default(makeAuthEvent({ fields: CREDS, auth, ip }).event as never)
    expect(result).toMatchObject({ status: 429, data: { error: 'rateLimited' } })
    expect(auth.signInWithPassword).toHaveBeenCalledTimes(10)
  })
})
