// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Static guard for the auth email templates pasted into the Supabase dashboard.
 * Links must go through /auth/confirm with a token hash (server-side verifyOtp);
 * the default {{ .ConfirmationURL }} would bypass it.
 */
const read = (path: string) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf-8')

const TEMPLATES = {
  'confirm.html': '{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email"',
  'recovery.html': '{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery"',
  'email_change.html': '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/dashboard"',
}

describe('auth email templates', () => {
  for (const [file, link] of Object.entries(TEMPLATES)) {
    const html = read(`supabase/templates/${file}`)

    it(`${file} links through /auth/confirm with a token hash`, () => {
      expect(html).toContain(`href="${link}`)
    })

    it(`${file} does not use the implicit-flow ConfirmationURL`, () => {
      expect(html).not.toContain('ConfirmationURL')
    })

    it(`${file} addresses the reader with "du" like the app`, () => {
      expect(html).not.toMatch(/\b(Sie|Ihr|Ihre|Ihnen)\b/)
    })
  }

  // The templates append "&token_hash=…" to {{ .RedirectTo }}, so the redirect the
  // app passes must already point at /auth/confirm and carry a query string.
  it('signup passes an emailRedirectTo the confirm template can extend', () => {
    expect(read('src/routes/(auth)/registrieren/+page.server.ts'))
      .toContain('emailRedirectTo: `${url.origin}/auth/confirm?next=/dashboard`')
  })

  it('password reset passes a redirectTo the recovery template can extend', () => {
    expect(read('src/routes/(auth)/passwort-vergessen/+page.server.ts'))
      .toContain('redirectTo: `${url.origin}/auth/confirm?next=/passwort-neu`')
  })
})
