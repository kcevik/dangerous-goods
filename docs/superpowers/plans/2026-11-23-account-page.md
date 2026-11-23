# Account page `/konto` Implementation Plan

**Goal:** `/konto` with password change, billing address, subscription placeholder and account deletion.

**Spec:** `docs/superpowers/specs/2026-11-23-account-page-design.md`

## Global constraints

- pnpm only; Svelte 5 runes; logic in `.svelte.ts` classes; German "du" copy; test-first.
- Svelte MCP autofixer on every touched `.svelte` / `.svelte.ts` file.
- Never touch the live Supabase project — migration file only; the owner applies it.

## Tasks

1. **Migration** `supabase/migrations/20261123120000_account_page.sql` (`billing_addresses` +
   `delete_own_account()`), static guard `tests/migration-account-page.test.ts`.
2. **Validation** `src/lib/account/countries.ts`, `src/lib/server/accountValidation.ts`
   (`validateAddress`) + `tests/accountValidation.test.ts`.
3. **Messages + subscription helpers** `src/lib/account/messages.ts`,
   `src/lib/account/subscription.ts` + `tests/accountMessages.test.ts`.
4. **Form state** `src/lib/account/accountForms.svelte.ts` (`PasswordChangeState`,
   `AddressFormState`, `DeleteAccountState`) + `tests/accountForms.svelte.test.ts`.
5. **Server** `src/routes/(app)/konto/+page.server.ts` (load + `password`/`address`/`delete`
   actions); extend `tests/helpers/authEvent.ts` (`user`, `from`); `tests/account-actions.test.ts`
   (success, validation, wrong current password, rate limit, unauthenticated, RPC/DB failure).
6. **UI** `src/routes/(app)/konto/+page.svelte` + cards in `src/lib/account/`
   (`PasswordCard`, `AddressCard`, `SubscriptionCard`, `DeleteAccountCard`);
   `tests/account-page.test.ts`.
7. **Deleted confirmation** `src/routes/+page.server.ts` (`accountDeleted` from `?konto=geloescht`)
   + banner on the landing page; tests.
8. **Navigation** "Konto" link in `(app)/+layout.svelte`, dashboard tile; tests.
9. **Datenschutz** §5 update, `LEGAL_UPDATED` bump, test needles.
10. **Docs** CLAUDE.md (routes, database table, structure), schema doc, STATUS.md, docs/README.md.
11. Autofixer, `pnpm check`, `pnpm test`, `pnpm build`, commit, push, PR.
