import { describe, expect, it, vi } from 'vitest'
import { actions, load } from '../src/routes/(app)/konto/+page.server'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

const SESSION = { access_token: 't' }
const LOGIN = { status: 303, location: '/login?next=%2Fkonto' }

let userCounter = 0
/** Rate limiters are module-level and keyed by user id → a fresh user per case. */
function freshUser() {
  return { id: `user-${++userCounter}`, email: `k${userCounter}@example.de` }
}

interface Result { data: unknown, error: unknown }

/** Chainable `supabase.from()` mock: select().eq().maybeSingle() and upsert(). */
function tables(opts: { profiles?: Result, billing_addresses?: Result, upsert?: Result } = {}) {
  const upsert = vi.fn(async () => opts.upsert ?? { data: null, error: null })
  const eqs: Record<string, ReturnType<typeof vi.fn>> = {}
  const from = vi.fn((table: string) => {
    const result = (table === 'profiles' ? opts.profiles : opts.billing_addresses) ?? { data: null, error: null }
    const eq = vi.fn(() => ({ maybeSingle: async () => result }))
    eqs[table] = eq
    return { select: vi.fn(() => ({ eq })), upsert }
  })
  return { from, upsert, eqs }
}

const ROW = { company: 'Muster GmbH', first_name: 'Erika', last_name: 'Mustermann', street: 'Hauptstraße 12a', postal_code: '10115', city: 'Berlin', country: 'DE', vat_id: 'DE123456789' }

describe('/konto load', () => {
  it('redirects to login without a session', async () => {
    const { event } = makeAuthEvent({ session: null })
    await expect(load(event as never)).rejects.toMatchObject(LOGIN)
  })

  it('returns email, active status with date and the saved address', async () => {
    const user = freshUser()
    const t = tables({ profiles: { data: { activated_at: '2026-11-01T09:00:00Z' }, error: null }, billing_addresses: { data: ROW, error: null } })
    const { event } = makeAuthEvent({ session: SESSION, user, from: t.from })
    const data = await load(event as never)
    expect(data).toEqual({
      email: user.email,
      subscription: { kind: 'active', since: '01.11.2026' },
      checkoutAvailable: false,
      address: { company: 'Muster GmbH', firstName: 'Erika', lastName: 'Mustermann', street: 'Hauptstraße 12a', postalCode: '10115', city: 'Berlin', country: 'DE', vatId: 'DE123456789' },
      addressFailed: false,
    })
    expect(t.eqs.profiles).toHaveBeenCalledWith('id', user.id)
    expect(t.eqs.billing_addresses).toHaveBeenCalledWith('user_id', user.id)
  })

  it('reports a locked account and no address yet', async () => {
    const t = tables({ profiles: { data: { activated_at: null }, error: null } })
    const { event } = makeAuthEvent({ session: SESSION, user: freshUser(), from: t.from })
    expect(await load(event as never)).toMatchObject({ subscription: { kind: 'locked' }, address: null, addressFailed: false })
  })

  it('shows failures as failures, never as "locked" or "no address"', async () => {
    const t = tables({ profiles: { data: null, error: { message: 'down' } }, billing_addresses: { data: null, error: { message: 'down' } } })
    const { event } = makeAuthEvent({ session: SESSION, user: freshUser(), from: t.from })
    expect(await load(event as never)).toMatchObject({ subscription: { kind: 'unknown' }, address: null, addressFailed: true })
  })
})

describe('/konto ?/password', () => {
  const FIELDS = { currentPassword: 'old-password-1', newPassword: 'new-password-12', newPasswordRepeat: 'new-password-12' }

  it('re-authenticates with the session email, then updates the password', async () => {
    const user = freshUser()
    const { event, auth } = makeAuthEvent({ fields: FIELDS, session: SESSION, user })
    expect(await actions.password(event as never)).toEqual({ action: 'password', success: true })
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: user.email, password: 'old-password-1' })
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-12' })
  })

  it('redirects to login without a session', async () => {
    const { event, auth } = makeAuthEvent({ fields: FIELDS, session: null })
    await expect(actions.password(event as never)).rejects.toMatchObject(LOGIN)
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('rejects a missing current password, a weak, mismatched or unchanged new password', async () => {
    const cases: [Record<string, string>, string][] = [
      [{ ...FIELDS, currentPassword: '' }, 'current_password_required'],
      [{ ...FIELDS, newPassword: 'short', newPasswordRepeat: 'short' }, 'weak_password'],
      [{ ...FIELDS, newPasswordRepeat: 'other-password-1' }, 'password_mismatch'],
      [{ currentPassword: 'same-password-1', newPassword: 'same-password-1', newPasswordRepeat: 'same-password-1' }, 'password_unchanged'],
    ]
    for (const [fields, error] of cases) {
      const { event, auth } = makeAuthEvent({ fields, session: SESSION, user: freshUser() })
      expect(await actions.password(event as never), error).toMatchObject({ status: 400, data: { action: 'password', error } })
      expect(auth.signInWithPassword).not.toHaveBeenCalled()
      expect(auth.updateUser).not.toHaveBeenCalled()
    }
  })

  it('rejects a wrong current password without touching the password', async () => {
    const auth = createAuthMock()
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const { event } = makeAuthEvent({ fields: FIELDS, session: SESSION, user: freshUser(), auth })
    expect(await actions.password(event as never)).toMatchObject({ status: 400, data: { action: 'password', error: 'wrong_password' } })
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('returns a generic error when the update fails', async () => {
    const auth = createAuthMock()
    auth.updateUser.mockResolvedValue({ data: {}, error: { message: 'nope' } })
    const { event } = makeAuthEvent({ fields: FIELDS, session: SESSION, user: freshUser(), auth })
    expect(await actions.password(event as never)).toMatchObject({ status: 500, data: { action: 'password', error: 'error' } })
  })

  it('rate-limits per user after 5 attempts in 15 minutes', async () => {
    const user = freshUser()
    for (let i = 0; i < 5; i++) {
      await actions.password(makeAuthEvent({ fields: FIELDS, session: SESSION, user }).event as never)
    }
    const { event, auth } = makeAuthEvent({ fields: FIELDS, session: SESSION, user })
    expect(await actions.password(event as never)).toMatchObject({ status: 429, data: { action: 'password', error: 'rateLimited' } })
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })
})

describe('/konto ?/address', () => {
  const FIELDS = { company: '', firstName: 'Erika', lastName: 'Mustermann', street: 'Hauptstraße 12a', postalCode: '10115', city: 'Berlin', country: 'DE', vatId: '' }

  it('upserts the own row through the user client', async () => {
    const user = freshUser()
    const t = tables()
    const { event } = makeAuthEvent({ fields: { ...FIELDS, firstName: ' Erika ' }, session: SESSION, user, from: t.from })
    expect(await actions.address(event as never)).toEqual({ action: 'address', success: true })
    expect(t.from).toHaveBeenCalledWith('billing_addresses')
    expect(t.upsert).toHaveBeenCalledWith(
      { user_id: user.id, company: null, first_name: 'Erika', last_name: 'Mustermann', street: 'Hauptstraße 12a', postal_code: '10115', city: 'Berlin', country: 'DE', vat_id: null },
      { onConflict: 'user_id' },
    )
  })

  it('redirects to login without a session', async () => {
    const t = tables()
    const { event } = makeAuthEvent({ fields: FIELDS, session: null, from: t.from })
    await expect(actions.address(event as never)).rejects.toMatchObject(LOGIN)
    expect(t.upsert).not.toHaveBeenCalled()
  })

  it('returns field errors and the cleaned values without saving', async () => {
    const t = tables()
    const { event } = makeAuthEvent({ fields: { ...FIELDS, postalCode: '123', vatId: 'DE123456789' }, session: SESSION, user: freshUser(), from: t.from })
    expect(await actions.address(event as never)).toMatchObject({
      status: 400,
      data: { action: 'address', fieldErrors: { postalCode: 'invalid_postal_code', vatId: 'vat_id_needs_company' }, values: { postalCode: '123' } },
    })
    expect(t.upsert).not.toHaveBeenCalled()
  })

  it('shows a database failure as an error and keeps the values', async () => {
    const t = tables({ upsert: { data: null, error: { message: 'rls' } } })
    const { event } = makeAuthEvent({ fields: FIELDS, session: SESSION, user: freshUser(), from: t.from })
    expect(await actions.address(event as never)).toMatchObject({ status: 500, data: { action: 'address', error: 'error', values: { firstName: 'Erika' } } })
  })

  it('rate-limits per user after 20 saves in an hour', async () => {
    const user = freshUser()
    for (let i = 0; i < 20; i++) {
      await actions.address(makeAuthEvent({ fields: FIELDS, session: SESSION, user, from: tables().from }).event as never)
    }
    const t = tables()
    const { event } = makeAuthEvent({ fields: FIELDS, session: SESSION, user, from: t.from })
    expect(await actions.address(event as never)).toMatchObject({ status: 429, data: { action: 'address', error: 'rateLimited' } })
    expect(t.upsert).not.toHaveBeenCalled()
  })
})

describe('/konto ?/delete', () => {
  const FIELDS = { currentPassword: 'old-password-1', confirmation: 'LÖSCHEN' }

  it('re-authenticates, calls the RPC, signs out and redirects home with a notice', async () => {
    const user = freshUser()
    const { event, auth, rpc } = makeAuthEvent({ fields: FIELDS, session: SESSION, user })
    await expect(actions.delete(event as never)).rejects.toMatchObject({ status: 303, location: '/?konto=geloescht' })
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: user.email, password: 'old-password-1' })
    expect(rpc).toHaveBeenCalledWith('delete_own_account')
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(auth.signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0])
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(auth.signOut.mock.invocationCallOrder[0])
  })

  it('accepts the confirmation word in lower case with spaces', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { ...FIELDS, confirmation: ' löschen ' }, session: SESSION, user: freshUser() })
    await expect(actions.delete(event as never)).rejects.toMatchObject({ status: 303 })
    expect(rpc).toHaveBeenCalled()
  })

  it('still redirects when signing out the deleted user fails', async () => {
    const auth = createAuthMock()
    auth.signOut.mockResolvedValue({ error: { message: 'user not found' } })
    const { event } = makeAuthEvent({ fields: FIELDS, session: SESSION, user: freshUser(), auth })
    await expect(actions.delete(event as never)).rejects.toMatchObject({ status: 303, location: '/?konto=geloescht' })
  })

  it('redirects to login without a session', async () => {
    const { event, rpc } = makeAuthEvent({ fields: FIELDS, session: null })
    await expect(actions.delete(event as never)).rejects.toMatchObject(LOGIN)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('requires the confirmation word and the current password', async () => {
    for (const [fields, error] of [
      [{ ...FIELDS, confirmation: 'ja' }, 'confirm_required'],
      [{ ...FIELDS, currentPassword: '' }, 'current_password_required'],
    ] as const) {
      const { event, rpc, auth } = makeAuthEvent({ fields, session: SESSION, user: freshUser() })
      expect(await actions.delete(event as never), error).toMatchObject({ status: 400, data: { action: 'delete', error } })
      expect(auth.signInWithPassword).not.toHaveBeenCalled()
      expect(rpc).not.toHaveBeenCalled()
    }
  })

  it('rejects a wrong current password without deleting', async () => {
    const auth = createAuthMock()
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const { event, rpc } = makeAuthEvent({ fields: FIELDS, session: SESSION, user: freshUser(), auth })
    expect(await actions.delete(event as never)).toMatchObject({ status: 400, data: { action: 'delete', error: 'wrong_password' } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('shows an RPC failure as an error and does not sign out', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'permission denied' } }))
    const { event, auth } = makeAuthEvent({ fields: FIELDS, session: SESSION, user: freshUser(), rpc })
    expect(await actions.delete(event as never)).toMatchObject({ status: 500, data: { action: 'delete', error: 'delete_failed' } })
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('rate-limits per user after 5 attempts in 15 minutes', async () => {
    const user = freshUser()
    const auth = createAuthMock()
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    for (let i = 0; i < 5; i++) {
      await actions.delete(makeAuthEvent({ fields: FIELDS, session: SESSION, user, auth }).event as never)
    }
    const { event, rpc } = makeAuthEvent({ fields: FIELDS, session: SESSION, user })
    expect(await actions.delete(event as never)).toMatchObject({ status: 429, data: { action: 'delete', error: 'rateLimited' } })
    expect(rpc).not.toHaveBeenCalled()
  })
})
