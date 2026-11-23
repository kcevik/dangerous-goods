import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import KontoPage from '../src/routes/(app)/konto/+page.svelte'

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }))

const ADDRESS = { company: 'Muster GmbH', firstName: 'Erika', lastName: 'Mustermann', street: 'Hauptstraße 12a', postalCode: '10115', city: 'Berlin', country: 'DE', vatId: 'DE123456789' }

function renderPage(data: Record<string, unknown> = {}, form: unknown = null) {
  return render(KontoPage, {
    props: {
      data: {
        email: 'k@example.de',
        subscription: { kind: 'locked' },
        checkoutAvailable: false,
        address: null,
        addressFailed: false,
        ...data,
      } as never,
      form: form as never,
    },
  })
}

describe('/konto page', () => {
  it('shows the email read-only and posts to the three named actions', () => {
    const { container, getByTestId } = renderPage()
    expect(getByTestId('account-email')).toHaveTextContent('k@example.de')
    expect(container.querySelector('input[name="email"]')).toBeNull()
    for (const action of ['?/password', '?/address', '?/delete']) {
      expect(container.querySelector(`form[action="${action}"]`), action).toHaveAttribute('method', 'POST')
    }
  })

  it('shows a locked account with a disabled checkout button and no price', () => {
    const { container, getByRole } = renderPage()
    expect(container).toHaveTextContent('gesperrt')
    expect(getByRole('button', { name: 'Abo abschließen — demnächst verfügbar' })).toBeDisabled()
    expect(container.textContent).not.toMatch(/€|EUR/)
  })

  it('shows an active account with its activation date', () => {
    const { container, queryByRole } = renderPage({ subscription: { kind: 'active', since: '01.11.2026' } })
    expect(container).toHaveTextContent('aktiv seit 01.11.2026')
    expect(queryByRole('button', { name: /Abo abschließen/ })).toBeNull()
  })

  it('shows a failed profile load as an error, not as "gesperrt"', () => {
    const { container } = renderPage({ subscription: { kind: 'unknown' } })
    expect(container).toHaveTextContent('konnte nicht geladen werden')
    expect(container).not.toHaveTextContent('gesperrt')
  })

  it('prefills the saved address and shows the VAT ID field for businesses', () => {
    const { container } = renderPage({ address: ADDRESS })
    expect(container.querySelector<HTMLInputElement>('input[name="firstName"]')!.value).toBe('Erika')
    expect(container.querySelector<HTMLSelectElement>('select[name="country"]')!.value).toBe('DE')
    expect(container.querySelector<HTMLInputElement>('input[name="vatId"]')!.value).toBe('DE123456789')
  })

  it('defaults the country to Deutschland and hides the VAT ID until a company is entered', async () => {
    const { container } = renderPage()
    expect(container.querySelector<HTMLSelectElement>('select[name="country"]')!.value).toBe('DE')
    expect(container.querySelector('input[name="vatId"]')).toBeNull()
    await fireEvent.input(container.querySelector('input[name="company"]')!, { target: { value: 'Muster GmbH' } })
    expect(container.querySelector('input[name="vatId"]')).not.toBeNull()
  })

  it('hides the address form when the address could not be loaded', () => {
    const { container } = renderPage({ addressFailed: true })
    expect(container.querySelector('form[action="?/address"]')).toBeNull()
    expect(container).toHaveTextContent('Anschrift konnte nicht geladen werden')
  })

  it('shows field errors and refills the submitted values', () => {
    const form = { action: 'address', fieldErrors: { postalCode: 'invalid_postal_code' }, values: { ...ADDRESS, company: '', vatId: '', postalCode: '123' } }
    const { container } = renderPage({}, form)
    expect(container.querySelector<HTMLInputElement>('input[name="postalCode"]')!.value).toBe('123')
    expect(container.querySelector('input[name="postalCode"]')).toHaveAttribute('aria-invalid', 'true')
    expect(container).toHaveTextContent('Diese Postleitzahl passt nicht zum gewählten Land.')
  })

  it('shows each action result only in its own card', () => {
    const { getAllByRole } = renderPage({}, { action: 'password', error: 'wrong_password' })
    const alerts = getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toHaveTextContent('Das aktuelle Passwort ist falsch.')
    expect(alerts[0].closest('section')).toHaveAttribute('aria-labelledby', 'password-heading')
  })

  it('confirms a saved password and address', () => {
    expect(renderPage({}, { action: 'password', success: true }).container).toHaveTextContent('Dein Passwort wurde geändert.')
  })

  it('shows an RPC failure in the delete card', () => {
    const { getByRole } = renderPage({}, { action: 'delete', error: 'delete_failed' })
    expect(getByRole('alert')).toHaveTextContent('Dein Konto konnte nicht gelöscht werden')
    expect(getByRole('alert').closest('section')).toHaveAttribute('aria-labelledby', 'delete-heading')
  })

  it('enables the delete button only after the password and LÖSCHEN', async () => {
    const { container, getByRole } = renderPage()
    const button = getByRole('button', { name: 'Konto endgültig löschen' })
    expect(button).toBeDisabled()
    await fireEvent.input(container.querySelector('input[name="currentPassword"][id="del-password"]')!, { target: { value: 'secret-pass-1' } })
    expect(button).toBeDisabled()
    await fireEvent.input(container.querySelector('input[name="confirmation"]')!, { target: { value: 'LÖSCHEN' } })
    expect(button).toBeEnabled()
  })
})
