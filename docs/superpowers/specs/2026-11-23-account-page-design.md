# Account page `/konto` (F-04 user management) — Design

> **Status:** decisions taken by the owner on 2026-11-23 (task brief). Migration applied 2026-11-23.

## Goal

One page where a logged-in user (locked or active) manages their account:

1. **E-Mail-Adresse** — shown read-only.
2. **Passwort ändern** — current password + new password (min. 10) + repeat.
3. **Rechnungsanschrift** — create/change one postal address, for private and business customers.
4. **Abo** — account status (gesperrt / aktiv seit `activated_at`) and a disabled
   "Abo abschließen — demnächst verfügbar" button. No Stripe code, no price.
5. **Konto löschen** — current password + typed "LÖSCHEN", then gone, signed out, back on `/`.

`/konto` touches no regulation data, so locked users use it fully.

## Decisions

1. **Re-authentication.** Password change and deletion first call
   `signInWithPassword({ email: <session email>, password: <current> })`. A failure is
   `wrong_password`; nothing else happens. This stops a hijacked session (open laptop) from
   locking the owner out or deleting the account.
2. **Deletion without the service-role key.** A new security-definer RPC
   `public.delete_own_account()` (`search_path = ''`) deletes exactly `auth.uid()`'s row from
   `auth.users`; `profiles` and `billing_addresses` cascade. Execute revoked from `public`/`anon`,
   granted to `authenticated`. After the RPC the action signs out (errors ignored — the user no
   longer exists) and redirects to `/?konto=geloescht`; the landing page shows a German
   confirmation. An RPC failure is shown as an error in the delete card; the account stays.
3. **Address table** `public.billing_addresses`: one row per user, PK `user_id` → `auth.users`
   on delete cascade. Columns: `company` (opt.), `first_name`, `last_name`, `street` (incl.
   house number), `postal_code`, `city`, `country` (ISO 3166-1 alpha-2, default `DE`), `vat_id`
   (opt., only with `company` — a check constraint enforces it), `created_at`, `updated_at`
   (trigger). RLS on; policies select/insert/update own row only; no delete policy (deletion
   happens with the account); all privileges revoked from `anon`; `authenticated` gets
   select/insert/update only. Check constraints mirror the app's limits as a backstop.
4. **Validation (server, `src/lib/server/accountValidation.ts`).** All fields trimmed, inner
   whitespace collapsed, control characters rejected. Lengths: company ≤ 200, names 1–100,
   street 1–200, city 1–100. Country from a fixed list (`src/lib/account/countries.ts`, DACH +
   EU + LI/NO/GB). Postal code: DE 5 digits, AT/CH/LI 4 digits, otherwise 2–10 of
   `[A-Z0-9 -]`. VAT ID: spaces/dots/dashes removed, upper-cased, `^[A-Z]{2}[A-Z0-9]{2,13}$`,
   `DE` → 9 digits, `AT` → `U` + 8 digits; a VAT ID without company is an error. Errors are per
   field.
5. **Rate limits** (module-level, keyed by **user id** — a hijacked session is one user,
   whatever the IP): password 5 / 15 min, delete 5 / 15 min, address 20 / hour.
6. **Named form actions** `?/password`, `?/address`, `?/delete`, each returning
   `{ action, … }` so the page shows the message in the right card. `use:enhance` like the
   `(auth)` forms; password fields are cleared after every submit.
7. **Load** reads `profiles.activated_at` and the user's address. A failed query is an error
   state in the card ("konnte nicht geladen werden"), never an empty form or "gesperrt".
8. **Stripe later.** `SubscriptionCard` takes `checkoutAvailable` (constant `false` in
   `src/lib/account/subscription.ts`). Stripe will add a `?/subscribe` action that creates a
   Checkout session, and a webhook that sets `profiles.activated_at`.
9. **Datenschutzerklärung** §5 gains the billing address (purpose, legal basis, storage) and the
   self-service deletion; `LEGAL_UPDATED` bumped.
10. **Navigation.** One "Konto" link in the app header (another branch rebuilds the header —
    expected trivial merge conflict) and a "Konto" tile on the dashboard.

## Out of scope

E-mail change, data export, invoices, Stripe, admin notification on deletion.

## Risks / open points

- Deleting an account with a future paid subscription must cancel it at Stripe first.
- Once invoices exist, retention duties (§ 147 AO, § 257 HGB) may require keeping invoice data
  after deletion — invoices would then need their own table without the cascade.
- `signInWithPassword` re-auth counts against Supabase's own auth rate limits.
