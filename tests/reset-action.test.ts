import { describe, expect, it } from 'vitest'
import { actions } from '../src/routes/(auth)/passwort-vergessen/+page.server'
import { makeAuthEvent } from './helpers/authEvent'

describe('password reset request action', () => {
  it('sends the reset mail with a confirm redirect to the new-password page', async () => {
    const { event, auth } = makeAuthEvent({ fields: { email: 'K@Example.de' }, path: '/passwort-vergessen' })
    expect(await actions.default(event as never)).toEqual({ sent: true })
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('k@example.de', {
      redirectTo: 'http://localhost/auth/confirm?next=/passwort-neu',
    })
  })

  it('reports sent for a malformed email without calling Supabase (no enumeration)', async () => {
    const { event, auth } = makeAuthEvent({ fields: { email: 'nope' } })
    expect(await actions.default(event as never)).toEqual({ sent: true })
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('rate-limits the 6th request from one IP per hour', async () => {
    const ip = '198.51.100.11'
    for (let i = 0; i < 5; i++) await actions.default(makeAuthEvent({ fields: { email: 'k@example.de' }, ip }).event as never)
    expect(await actions.default(makeAuthEvent({ fields: { email: 'k@example.de' }, ip }).event as never))
      .toMatchObject({ status: 429, data: { error: 'rateLimited' } })
  })
})
