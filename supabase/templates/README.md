# Auth email templates

Versioned copies of the templates configured in the hosted project
(Dashboard → Authentication → Emails → Templates). The dashboard is the live copy;
after changing a file here, paste it there again.

| Dashboard template   | File                | Subject                                        |
|----------------------|---------------------|------------------------------------------------|
| Confirm signup       | `confirm.html`      | Bitte bestätige deine Registrierung            |
| Reset password       | `recovery.html`     | Passwort zurücksetzen – gefahrgut.org          |
| Change email address | `email_change.html` | Neue E-Mail-Adresse bestätigen – gefahrgut.org |

Magic link, Invite user and Reauthentication are unused — leave them as they are.

## Why `{{ .RedirectTo }}` and not `{{ .SiteURL }}`

`{{ .RedirectTo }}` is the `emailRedirectTo` / `redirectTo` the app passed, e.g.
`http://localhost:5173/auth/confirm?next=/dashboard`. The template appends
`&token_hash=…&type=…`, so a signup from localhost links back to localhost and one from
production links to production. The Site URL still points at the WordPress site.

- The redirect must be on the allowlist (Authentication → URL Configuration), otherwise
  Supabase substitutes the bare Site URL and the link breaks.
- The app's redirect already carries a `?` query, which is why the template joins with `&`.
  `tests/email-templates.test.ts` guards both sides.
- The app has no change-email flow, so no `emailRedirectTo` exists for it; that template
  links through `{{ .SiteURL }}` with an explicit path instead.
