import { describe, expect, it } from 'vitest'
import { AUTH_MESSAGES } from '$lib/auth/messages'
import type { AuthErrorCode } from '$lib/server/authValidation'

const CODES: AuthErrorCode[] = [
  'invalid_email', 'weak_password', 'password_mismatch', 'consent_required',
  'invalid_credentials', 'rateLimited', 'error',
]

describe('AUTH_MESSAGES', () => {
  for (const code of CODES) {
    it(`has a German message for "${code}"`, () => {
      expect(AUTH_MESSAGES[code]?.trim()).toBeTruthy()
    })
  }

  it('has no messages for unknown codes', () => {
    expect(Object.keys(AUTH_MESSAGES).sort()).toEqual([...CODES].sort())
  })
})
