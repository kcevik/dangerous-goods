import type { AuthErrorCode } from '$lib/server/authValidation'

/** German user-facing messages for every auth error code */
export const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_email: 'Bitte gib eine gültige E-Mail-Adresse ein.',
  weak_password: 'Das Passwort muss mindestens 10 Zeichen lang sein.',
  password_mismatch: 'Die Passwörter stimmen nicht überein.',
  consent_required: 'Bitte stimme der Datenschutzerklärung zu.',
  invalid_credentials: 'E-Mail-Adresse oder Passwort ist falsch.',
  rateLimited: 'Zu viele Versuche – bitte warte einen Moment und versuche es erneut.',
  error: 'Das hat leider nicht geklappt. Bitte versuche es später noch einmal.',
}
