import { describe, expect, it } from 'vitest'
import { GET } from '../src/routes/auth/confirm/+server'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

function confirmEvent(search: string, auth = createAuthMock()) {
  return makeAuthEvent({ path: '/auth/confirm', search, auth }).event
}

describe('GET /auth/confirm', () => {
  it('verifies the token and redirects to a safe next target', async () => {
    const auth = createAuthMock()
    await expect(GET(confirmEvent('?token_hash=abc&type=email&next=/dashboard', auth) as never))
      .rejects.toMatchObject({ status: 303, location: '/dashboard' })
    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'abc' })
  })

  it('supports the recovery flow landing on the new-password page', async () => {
    await expect(GET(confirmEvent('?token_hash=abc&type=recovery&next=/passwort-neu') as never))
      .rejects.toMatchObject({ status: 303, location: '/passwort-neu' })
  })

  it('falls back to the dashboard for an unsafe next', async () => {
    await expect(GET(confirmEvent('?token_hash=abc&type=email&next=https://evil.com') as never))
      .rejects.toMatchObject({ status: 303, location: '/dashboard' })
  })

  it('redirects to the error page when the token is missing', async () => {
    const auth = createAuthMock()
    await expect(GET(confirmEvent('?type=email', auth) as never)).rejects.toMatchObject({ status: 303, location: '/auth/fehler' })
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('redirects to the error page when verification fails', async () => {
    const auth = createAuthMock()
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: 'expired' } })
    await expect(GET(confirmEvent('?token_hash=abc&type=email', auth) as never)).rejects.toMatchObject({ status: 303, location: '/auth/fehler' })
  })
})
