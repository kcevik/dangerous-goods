import { describe, expect, it } from 'vitest'
import { actions, load } from '../src/routes/auth/confirm/+page.server'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

function confirmEvent(search: string, auth = createAuthMock()) {
  return makeAuthEvent({ path: '/auth/confirm', search, auth }).event
}

// Mail scanners open links with GET; only the button's POST may use up the one-time token.
describe('GET /auth/confirm (page load)', () => {
  it('never touches the token', async () => {
    const auth = createAuthMock()
    await load(confirmEvent('?token_hash=abc&type=recovery&next=/passwort-neu', auth) as never)
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('redirects to the error page when the token or type is missing', async () => {
    await expect(load(confirmEvent('?type=email') as never)).rejects.toMatchObject({ status: 303, location: '/auth/fehler' })
    await expect(load(confirmEvent('?token_hash=abc') as never)).rejects.toMatchObject({ status: 303, location: '/auth/fehler' })
  })
})

describe('POST /auth/confirm (verify)', () => {
  it('verifies the token and redirects to a safe next target', async () => {
    const auth = createAuthMock()
    await expect(actions.default(confirmEvent('?token_hash=abc&type=email&next=/dashboard', auth) as never))
      .rejects.toMatchObject({ status: 303, location: '/dashboard' })
    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'abc' })
  })

  it('supports the recovery flow landing on the new-password page', async () => {
    await expect(actions.default(confirmEvent('?token_hash=abc&type=recovery&next=/passwort-neu') as never))
      .rejects.toMatchObject({ status: 303, location: '/passwort-neu' })
  })

  it('falls back to the dashboard for an unsafe next', async () => {
    await expect(actions.default(confirmEvent('?token_hash=abc&type=email&next=https://evil.com') as never))
      .rejects.toMatchObject({ status: 303, location: '/dashboard' })
  })

  it('redirects to the error page when the token is missing', async () => {
    const auth = createAuthMock()
    await expect(actions.default(confirmEvent('?type=email', auth) as never)).rejects.toMatchObject({ status: 303, location: '/auth/fehler' })
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('redirects to the error page when verification fails', async () => {
    const auth = createAuthMock()
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: 'expired' } })
    await expect(actions.default(confirmEvent('?token_hash=abc&type=email', auth) as never)).rejects.toMatchObject({ status: 303, location: '/auth/fehler' })
  })
})
