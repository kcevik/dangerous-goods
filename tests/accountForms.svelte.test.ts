import { describe, expect, it } from 'vitest'
import { AddressFormState, DeleteAccountState, PasswordChangeState } from '$lib/account/accountForms.svelte'

describe('PasswordChangeState', () => {
  it('needs the current password, a strong new one and a matching repeat', () => {
    const f = new PasswordChangeState()
    expect(f.canSubmit).toBe(false)
    f.currentPassword = 'old-password-1'
    f.newPassword = 'short'
    f.newPasswordRepeat = 'short'
    expect(f.canSubmit).toBe(false)
    f.newPassword = 'new-password-12'
    expect(f.canSubmit).toBe(false)
    f.newPasswordRepeat = 'new-password-12'
    expect(f.canSubmit).toBe(true)
    f.status = 'submitting'
    expect(f.canSubmit).toBe(false)
  })

  it('reset() clears every password field', () => {
    const f = new PasswordChangeState()
    f.currentPassword = 'a'
    f.newPassword = 'b'
    f.newPasswordRepeat = 'c'
    f.reset()
    expect([f.currentPassword, f.newPassword, f.newPasswordRepeat]).toEqual(['', '', ''])
  })
})

describe('DeleteAccountState', () => {
  it('needs the password and the typed confirmation word (case-insensitive, trimmed)', () => {
    const f = new DeleteAccountState()
    f.password = 'secret-pass-1'
    f.confirmation = 'loeschen'
    expect(f.canSubmit).toBe(false)
    f.confirmation = ' löschen '
    expect(f.confirmed).toBe(true)
    expect(f.canSubmit).toBe(true)
    f.password = ''
    expect(f.canSubmit).toBe(false)
  })
})

describe('AddressFormState', () => {
  it('starts from the given values', () => {
    const f = new AddressFormState({ company: 'Muster GmbH', firstName: 'Erika', lastName: 'M', street: 'S 1', postalCode: '10115', city: 'Berlin', country: 'DE', vatId: 'DE123456789' })
    expect(f.values.company).toBe('Muster GmbH')
    expect(f.isBusiness).toBe(true)
    expect(f.postalCodeHint).toBe('5 Ziffern')
  })

  it('is a private customer without company, and the hint follows the country', () => {
    const f = new AddressFormState({ company: '', firstName: '', lastName: '', street: '', postalCode: '', city: '', country: 'DE', vatId: '' })
    expect(f.isBusiness).toBe(false)
    f.values.company = '  '
    expect(f.isBusiness).toBe(false)
    f.values.country = 'AT'
    expect(f.postalCodeHint).toBe('4 Ziffern')
    f.values.country = 'FR'
    expect(f.postalCodeHint).toBeNull()
  })

  it('can submit only with every required field filled', () => {
    const f = new AddressFormState({ company: '', firstName: 'Erika', lastName: 'Mustermann', street: 'Hauptstraße 1', postalCode: '10115', city: 'Berlin', country: 'DE', vatId: '' })
    expect(f.canSubmit).toBe(true)
    f.values.city = ' '
    expect(f.canSubmit).toBe(false)
  })
})
