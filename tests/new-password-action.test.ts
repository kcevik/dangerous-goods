import { describe, expect, it } from 'vitest'
import { actions, load } from '../src/routes/(auth)/passwort-neu/+page.server'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

const SESSION = { access_token: 't' }
const FIELDS = { password: 'correct-horse-9', passwordRepeat: 'correct-horse-9' }

describe('new password load', () => {
  it('redirects to login without a session', async () => {
    const { event } = makeAuthEvent({ session: null })
    await expect(load(event as never)).rejects.toMatchObject({ status: 303, location: '/login' })
  })

  it('returns nothing special with a session', async () => {
    const { event } = makeAuthEvent({ session: SESSION })
    expect(await load(event as never)).toEqual({})
  })
})

describe('new password action', () => {
  it('updates the password and redirects to the dashboard', async () => {
    const { event, auth } = makeAuthEvent({ fields: FIELDS, session: SESSION })
    await expect(actions.default(event as never)).rejects.toMatchObject({ status: 303, location: '/dashboard' })
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'correct-horse-9' })
  })

  it('redirects to login without a session', async () => {
    const { event, auth } = makeAuthEvent({ fields: FIELDS, session: null })
    await expect(actions.default(event as never)).rejects.toMatchObject({ status: 303, location: '/login' })
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('rejects weak and mismatched passwords', async () => {
    expect(await actions.default(makeAuthEvent({ fields: { password: 'short', passwordRepeat: 'short' }, session: SESSION }).event as never))
      .toMatchObject({ status: 400, data: { error: 'weak_password' } })
    expect(await actions.default(makeAuthEvent({ fields: { ...FIELDS, passwordRepeat: 'other-password-1' }, session: SESSION }).event as never))
      .toMatchObject({ status: 400, data: { error: 'password_mismatch' } })
  })

  it('returns a generic error when Supabase fails', async () => {
    const auth = createAuthMock()
    auth.updateUser.mockResolvedValue({ data: {}, error: { message: 'nope' } })
    expect(await actions.default(makeAuthEvent({ fields: FIELDS, session: SESSION, auth }).event as never))
      .toMatchObject({ status: 500, data: { error: 'error' } })
  })
})
