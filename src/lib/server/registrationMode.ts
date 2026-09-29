import { env } from '$env/dynamic/private'

export type RegistrationMode = 'waitlist' | 'open'

/**
 * Whether `/registrieren` creates accounts (`open`) or collects launch
 * notifications (`waitlist`). Read at runtime, so go-live is an env change plus a
 * container restart. Fail-closed: only the exact value `open` opens sign-up, so a
 * missing or misspelt variable can never open registration by accident.
 */
export function registrationMode(): RegistrationMode {
  return env.REGISTRATION_MODE?.trim() === 'open' ? 'open' : 'waitlist'
}
