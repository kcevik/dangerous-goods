import type { AddressErrorCode } from '$lib/server/accountValidation'

export type AccountErrorCode
  = 'current_password_required'
    | 'wrong_password'
    | 'weak_password'
    | 'password_mismatch'
    | 'password_unchanged'
    | 'confirm_required'
    | 'rateLimited'
    | 'error'
    | 'delete_failed'

/** The word the user types to confirm the deletion. */
export const ACCOUNT_DELETE_CONFIRM_WORD = 'LÖSCHEN'

/** German user-facing messages for the account page actions */
export const ACCOUNT_MESSAGES: Record<AccountErrorCode, string> = {
  current_password_required: 'Bitte gib dein aktuelles Passwort ein.',
  wrong_password: 'Das aktuelle Passwort ist falsch.',
  weak_password: 'Das neue Passwort muss mindestens 10 Zeichen lang sein.',
  password_mismatch: 'Die neuen Passwörter stimmen nicht überein.',
  password_unchanged: 'Das neue Passwort muss sich vom aktuellen unterscheiden.',
  confirm_required: `Bitte tippe zur Bestätigung ${ACCOUNT_DELETE_CONFIRM_WORD} ein.`,
  rateLimited: 'Zu viele Versuche – bitte warte einen Moment und versuche es erneut.',
  error: 'Das hat leider nicht geklappt. Bitte versuche es später noch einmal.',
  delete_failed: 'Dein Konto konnte nicht gelöscht werden. Es besteht weiter – bitte versuche es später noch einmal.',
}

export const ACCOUNT_SUCCESS = {
  password: 'Dein Passwort wurde geändert.',
  address: 'Deine Anschrift wurde gespeichert.',
} as const

export const ADDRESS_ERROR_MESSAGES: Record<AddressErrorCode, string> = {
  required: 'Bitte fülle dieses Feld aus.',
  too_long: 'Diese Angabe ist zu lang.',
  invalid_chars: 'Diese Angabe enthält unzulässige Zeichen.',
  invalid_country: 'Bitte wähle ein Land aus der Liste.',
  invalid_postal_code: 'Diese Postleitzahl passt nicht zum gewählten Land.',
  invalid_vat_id: 'Diese USt-IdNr. hat kein gültiges Format (z. B. DE123456789).',
  vat_id_needs_company: 'Eine USt-IdNr. gibt es nur zusammen mit einer Firma.',
}

/** Shown on the landing page after `?konto=geloescht`. */
export const ACCOUNT_DELETED_MESSAGE = 'Dein Konto und alle zugehörigen Daten wurden gelöscht.'
