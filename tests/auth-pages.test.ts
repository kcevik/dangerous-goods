import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTH_MESSAGES } from '$lib/auth/messages'
import LoginPage from '../src/routes/(auth)/login/+page.svelte'
import RegisterPage from '../src/routes/(auth)/registrieren/+page.svelte'
import ResetPage from '../src/routes/(auth)/passwort-vergessen/+page.svelte'
import NewPasswordPage from '../src/routes/(auth)/passwort-neu/+page.svelte'
import ErrorPage from '../src/routes/auth/fehler/+page.svelte'
import AuthLayout from '../src/routes/(auth)/+layout.svelte'
import { createRawSnippet } from 'svelte'

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }))

afterEach(() => {
  document.head.innerHTML = ''
})

describe('login page', () => {
  it('renders email and password fields, a hidden next, and the helper links', () => {
    const { container } = render(LoginPage, { props: { data: { next: '/suche' } as never, form: null } })
    expect(container.querySelector('input[name="email"][type="email"]')).not.toBeNull()
    expect(container.querySelector('input[name="password"][type="password"]')).not.toBeNull()
    expect(container.querySelector('input[name="next"]')).toHaveValue('/suche')
    expect(container.querySelector('a[href="/registrieren"]')).not.toBeNull()
    expect(container.querySelector('a[href="/passwort-vergessen"]')).not.toBeNull()
    expect(container.querySelector('form')).toHaveAttribute('method', 'POST')
  })

  it('shows the mapped error message and keeps the email', () => {
    const { container } = render(LoginPage, { props: { data: { next: '/dashboard' } as never, form: { error: 'invalid_credentials', email: 'k@example.de' } } })
    expect(container).toHaveTextContent(AUTH_MESSAGES.invalid_credentials)
    expect(container.querySelector('input[name="email"]')).toHaveValue('k@example.de')
  })
})

describe('register page', () => {
  it('renders all fields including the consent checkbox with the privacy link', () => {
    const { container } = render(RegisterPage, { props: { data: { mode: 'open' } as never, form: null } })
    expect(container.querySelector('input[name="email"]')).not.toBeNull()
    expect(container.querySelector('input[name="password"]')).not.toBeNull()
    expect(container.querySelector('input[name="passwordRepeat"]')).not.toBeNull()
    expect(container.querySelector('input[name="consent"][type="checkbox"]')).not.toBeNull()
    expect(container.querySelector('a[href="https://gefahrgut.org/datenschutzerklaerung/"]')).not.toBeNull()
    expect(container.querySelector('a[href="/login"]')).not.toBeNull()
  })

  it('replaces the form with the check-your-inbox state after sending', () => {
    const { container } = render(RegisterPage, { props: { data: { mode: 'open' } as never, form: { sent: true } as never } })
    expect(container.querySelector('form')).toBeNull()
    expect(container).toHaveTextContent('Bestätige deine E-Mail-Adresse')
  })

  it('shows validation errors', () => {
    const { container } = render(RegisterPage, { props: { data: { mode: 'open' } as never, form: { error: 'weak_password', email: 'k@example.de' } as never } })
    expect(container).toHaveTextContent(AUTH_MESSAGES.weak_password)
  })
})

describe('register page — waitlist mode', () => {
  const data = { mode: 'waitlist' } as never

  it('shows the notification form: email, consent with privacy link, hidden honeypot, no password', () => {
    const { container } = render(RegisterPage, { props: { data, form: null } })
    expect(container).toHaveTextContent('Benachrichtigung zum Start')
    expect(container.querySelector('input[name="email"][type="email"]')).not.toBeNull()
    expect(container.querySelector('input[name="password"]')).toBeNull()
    expect(container.querySelector('input[name="consent"][type="checkbox"]')).not.toBeNull()
    expect(container).toHaveTextContent('Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet.')
    expect(container.querySelector('a[href="https://gefahrgut.org/datenschutzerklaerung/"]')).not.toBeNull()
    const honeypot = container.querySelector('input[name="website"]')!
    expect(honeypot.getAttribute('tabindex')).toBe('-1')
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('shows the thank-you state after a (no-JS) round trip', () => {
    const { container } = render(RegisterPage, { props: { data, form: { notified: true } as never } })
    expect(container.querySelector('[role="status"]')).toHaveTextContent('Danke! Wir benachrichtigen dich, sobald gefahrgut.org startet.')
    expect(container.querySelector('form')).toBeNull()
  })

  it('shows the error and keeps the typed address', () => {
    const { container } = render(RegisterPage, { props: { data, form: { error: 'invalid_email', email: 'nope' } as never } })
    expect(container.querySelector('[role="alert"]')).toHaveTextContent(AUTH_MESSAGES.invalid_email)
    expect(container.querySelector('input[name="email"]')).toHaveValue('nope')
  })
})

describe('login page — sign-up hint follows the mode', () => {
  it('says "Zum Launch benachrichtigen" in waitlist mode and still offers the login form', () => {
    const { container } = render(LoginPage, { props: { data: { next: '/dashboard', registrationOpen: false } as never, form: null } })
    expect(container.querySelector('a[href="/registrieren"]')).toHaveTextContent('Zum Launch benachrichtigen')
    expect(container.querySelector('input[name="password"]')).not.toBeNull()
  })

  it('says "Registrieren" when registration is open', () => {
    const { container } = render(LoginPage, { props: { data: { next: '/dashboard', registrationOpen: true } as never, form: null } })
    expect(container.querySelector('a[href="/registrieren"]')).toHaveTextContent('Registrieren')
  })
})

describe('password reset pages', () => {
  it('reset request renders an email field and the neutral sent message', () => {
    const first = render(ResetPage, { props: { form: null } })
    expect(first.container.querySelector('input[name="email"]')).not.toBeNull()
    first.unmount()
    const { container } = render(ResetPage, { props: { form: { sent: true } } })
    expect(container).toHaveTextContent('Falls ein Konto existiert, haben wir eine E-Mail geschickt.')
  })

  it('new password renders two password fields and errors', () => {
    const { container } = render(NewPasswordPage, { props: { form: { error: 'password_mismatch' } } })
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2)
    expect(container).toHaveTextContent(AUTH_MESSAGES.password_mismatch)
  })
})

describe('auth error page and layout', () => {
  it('error page links to login and password reset', () => {
    const { container } = render(ErrorPage)
    expect(container).toHaveTextContent('Der Link ist ungültig oder abgelaufen.')
    expect(container.querySelector('a[href="/login"]')).not.toBeNull()
    expect(container.querySelector('a[href="/passwort-vergessen"]')).not.toBeNull()
  })

  it('layout marks auth pages noindex and links the brand to the landing page', () => {
    const children = createRawSnippet(() => ({ render: () => '<p>card</p>' }))
    const { container } = render(AuthLayout, { props: { children } })
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
    expect(container.querySelector('a[href="/"]')).not.toBeNull()
    expect(container).toHaveTextContent('card')
  })
})
