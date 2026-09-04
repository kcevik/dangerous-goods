export type AuthFormKind = 'login' | 'register' | 'reset' | 'newPassword'
export type AuthFormStatus = 'idle' | 'submitting' | 'sent' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_PASSWORD_LENGTH = 10

/** Client-side field state for the auth forms; the server re-validates everything. */
export class AuthFormState {
  email = $state('')
  password = $state('')
  passwordRepeat = $state('')
  consent = $state(false)
  status = $state<AuthFormStatus>('idle')

  readonly kind: AuthFormKind

  constructor(kind: AuthFormKind) {
    this.kind = kind
  }

  readonly emailValid: boolean = $derived(EMAIL_RE.test(this.email.trim().toLowerCase()))
  readonly passwordStrong: boolean = $derived(this.password.length >= MIN_PASSWORD_LENGTH)
  readonly passwordsMatch: boolean = $derived(this.password === this.passwordRepeat)

  readonly canSubmit: boolean = $derived.by(() => {
    if (this.status === 'submitting') return false
    switch (this.kind) {
      case 'login': return this.emailValid && this.password.length > 0
      case 'register': return this.emailValid && this.passwordStrong && this.passwordsMatch && this.consent
      case 'reset': return this.emailValid
      case 'newPassword': return this.passwordStrong && this.passwordsMatch
    }
  })
}
