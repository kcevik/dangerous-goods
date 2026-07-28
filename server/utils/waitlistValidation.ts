export type ValidationResult
  = { ok: true, data: { name: string, email: string, honeypot: boolean } }
    | { ok: false, error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateWaitlistInput(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid_body' }
  const b = body as Record<string, unknown>

  const honeypot = typeof b.website === 'string' && b.website.trim() !== ''
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''

  if (name.length < 2 || name.length > 100) return { ok: false, error: 'invalid_name' }
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' }
  if (b.consent !== true) return { ok: false, error: 'consent_required' }

  return { ok: true, data: { name, email, honeypot } }
}
