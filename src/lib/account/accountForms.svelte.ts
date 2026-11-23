import type { AddressValues } from './address'
import { postalCodeHint } from './countries'
import { ACCOUNT_DELETE_CONFIRM_WORD } from './messages'

export type AccountFormStatus = 'idle' | 'submitting'

const MIN_PASSWORD_LENGTH = 10

/** Client-side state of the "Passwort ändern" card; the server re-validates everything. */
export class PasswordChangeState {
  currentPassword = $state('')
  newPassword = $state('')
  newPasswordRepeat = $state('')
  status = $state<AccountFormStatus>('idle')

  readonly canSubmit: boolean = $derived(
    this.status !== 'submitting'
    && this.currentPassword.length > 0
    && this.newPassword.length >= MIN_PASSWORD_LENGTH
    && this.newPassword === this.newPasswordRepeat,
  )

  /** Passwords never stay in the page after a submit, whatever the outcome. */
  reset(): void {
    this.currentPassword = ''
    this.newPassword = ''
    this.newPasswordRepeat = ''
  }
}

/** Client-side state of the "Konto löschen" card. */
export class DeleteAccountState {
  password = $state('')
  confirmation = $state('')
  status = $state<AccountFormStatus>('idle')

  readonly confirmed: boolean = $derived(this.confirmation.trim().toUpperCase() === ACCOUNT_DELETE_CONFIRM_WORD)

  readonly canSubmit: boolean = $derived(
    this.status !== 'submitting' && this.confirmed && this.password.length > 0,
  )

  reset(): void {
    this.password = ''
    this.confirmation = ''
  }
}

/** Client-side state of the "Rechnungsanschrift" card. */
export class AddressFormState {
  values = $state<AddressValues>() as AddressValues
  status = $state<AccountFormStatus>('idle')

  constructor(initial: AddressValues) {
    this.values = { ...initial }
  }

  readonly isBusiness: boolean = $derived(this.values.company.trim() !== '')
  readonly postalCodeHint: string | null = $derived(postalCodeHint(this.values.country))

  readonly canSubmit: boolean = $derived(
    this.status !== 'submitting'
    && (['firstName', 'lastName', 'street', 'postalCode', 'city', 'country'] as const)
      .every(k => this.values[k].trim() !== ''),
  )
}
