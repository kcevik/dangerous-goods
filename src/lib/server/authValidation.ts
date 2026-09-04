export type AuthErrorCode
  = 'invalid_email'
    | 'weak_password'
    | 'password_mismatch'
    | 'consent_required'
    | 'invalid_credentials'
    | 'rateLimited'
    | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const MIN_PASSWORD_LENGTH = 10

export function validateEmail(v: unknown): { ok: true, email: string } | { ok: false, error: 'invalid_email' } {
  if (typeof v !== 'string') return { ok: false, error: 'invalid_email' }
  const email = v.trim().toLowerCase()
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' }
  return { ok: true, email }
}

export function validatePassword(v: unknown): { ok: true, password: string } | { ok: false, error: 'weak_password' } {
  if (typeof v !== 'string' || v.length < MIN_PASSWORD_LENGTH) return { ok: false, error: 'weak_password' }
  return { ok: true, password: v }
}

export function validateRegistration(body: unknown):
  { ok: true, data: { email: string, password: string } } | { ok: false, error: AuthErrorCode } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid_email' }
  const b = body as Record<string, unknown>

  const email = validateEmail(b.email)
  if (!email.ok) return email
  const password = validatePassword(b.password)
  if (!password.ok) return password
  if (b.passwordRepeat !== password.password) return { ok: false, error: 'password_mismatch' }
  if (b.consent !== true) return { ok: false, error: 'consent_required' }

  return { ok: true, data: { email: email.email, password: password.password } }
}
