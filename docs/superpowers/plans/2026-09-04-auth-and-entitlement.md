# Auth and Entitlement Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email/password auth with open registration, a manual `profiles.activated_at` entitlement enforced by RLS and server loads, a locked preview mode that works on demo data, and the waitlist retired.

**Architecture:** One migration adds `profiles` + trigger + `is_activated()` and swaps the regulation tables' policies to activated-only. `hooks.server.ts` exposes `safeGetSession()` and a route guard for the `(app)` group. Auth pages are form actions under `(auth)`; product pages move to `(app)` and receive `isActive`. Locked users only ever mount `MultimodalTool` in `demo` mode.

**Tech Stack:** SvelteKit 2, Svelte 5, `@supabase/ssr`, Supabase Auth (email provider), Vitest + jsdom + testing-library, Supabase CLI for the migration.

**Spec:** `docs/superpowers/specs/2026-09-04-auth-and-entitlement-design.md` — all copy, SQL, route tables and config values live there; this plan references spec sections rather than repeating them.

## Global Constraints

- pnpm only; no git commits by the executor (owner handles git); Svelte autofixer on every `.svelte`/`.svelte.ts`; every task ships tests first (TDD); German UI copy exactly as in the spec; identifiers English; never name a variable `state`.
- Existing test conventions from `CLAUDE.md` (jsdom, testing-library, hand-built Supabase mocks, `vi.mock('$app/…')`, `*.svelte.test.ts` for rune-using tests).
- Locked users must never trigger a regulation-data query: every code path checks `isActive` before calling Supabase, and RLS is the backstop, not the primary check.
- Do not apply the migration to the hosted project until Task 1's SQL is reviewed by the owner (it drops `waitlist`).

---

## File map

| Path | Responsibility |
|---|---|
| `supabase/migrations/20260904120000_auth_and_entitlement.sql` | spec §1 |
| `src/app.d.ts` | `Locals.safeGetSession`, `PageData` shape |
| `src/hooks.server.ts` | supabase hook + `authGuard`, composed with `sequence` |
| `src/lib/auth/safeNext.ts` | `safeNext(value: string \| null \| undefined): string` |
| `src/lib/auth/messages.ts` | `AUTH_MESSAGES: Record<AuthErrorCode, string>` (German) |
| `src/lib/server/authValidation.ts` | `validateEmail`, `validatePassword`, `validateRegistration` |
| `src/lib/auth/authForm.svelte.ts` | `AuthFormState` (`kind: 'login' \| 'register' \| 'reset' \| 'newPassword'`) |
| `src/lib/auth/LockNotice.svelte` | inline lock card |
| `src/routes/+layout.server.ts`, `+layout.ts`, `+layout.svelte` | session/isActive in data; `onAuthStateChange` → invalidate |
| `src/routes/(auth)/+layout.svelte` | centered card layout |
| `src/routes/(auth)/login/+page.server.ts`, `+page.svelte` | login |
| `src/routes/(auth)/registrieren/…` | register |
| `src/routes/(auth)/passwort-vergessen/…` | reset request |
| `src/routes/(auth)/passwort-neu/…` | set new password (needs session) |
| `src/routes/auth/confirm/+server.ts` | token exchange |
| `src/routes/auth/fehler/+page.svelte` | error page |
| `src/routes/logout/+page.server.ts` | POST-only sign-out |
| `src/routes/(app)/+layout.server.ts`, `+layout.svelte` | app shell + banner |
| `src/routes/(app)/dashboard/+page.svelte` | dashboard shell |
| `src/routes/(app)/suche/+page.svelte` | moved from `search/`, locked branch |
| `src/routes/(app)/un/[nummer]/+page.server.ts`, `+page.svelte` | moved, locked branch |
| `src/lib/search/search.svelte.ts` | `locked` flag |
| Landing files per spec §5 | copy + link changes; waitlist removed |
| `static/llms.txt`, `CLAUDE.md`, `README.md` | docs |

Deleted: `src/lib/landing/Waitlist.svelte`, `waitlistForm.svelte.ts`, `src/lib/server/waitlistValidation.ts`, `src/lib/server/supabaseAdmin.ts`, `src/routes/+page.server.ts`, `src/routes/search/`, `src/routes/un/`, tests `waitlist-*.test.ts`, `waitlistForm.svelte.test.ts`, `waitlistValidation.test.ts`, `supabaseAdmin.test.ts`.

---

### Task 1: Migration (spec §1)

- [ ] Write `supabase/migrations/20260904120000_auth_and_entitlement.sql` exactly per spec §1.1–1.4, with a header comment "Export waitlist rows before applying — this drops the table."
- [ ] Write `tests/migration-auth.test.ts` (node env): reads the SQL file and asserts it contains `create table profiles`, `activated_at timestamptz`, `security invoker`, one `drop policy "public read"` and one `create policy "activated read"` per each of the 8 tables, `drop view if exists un_comparison`, `drop table if exists waitlist`, and that `handle_new_user` sets `search_path = ''`. (Static guard so a later edit cannot silently drop a table's policy swap.)
- [ ] Run test → pass.
- [ ] **STOP and ask the owner** to (a) export `waitlist` rows if any, (b) approve applying. Apply with `supabase db push` (linked project). Then run `get_advisors` (security) and fix findings.
- [ ] Verify with SQL via MCP `execute_sql`: `set role anon; select count(*) from adr_entries;` → 0; `set role authenticated; select set_config('request.jwt.claims', '{"sub":"<uuid-of-test-user>","role":"authenticated"}', true); select count(*) from adr_entries;` → 0 before and > 0 after `update profiles set activated_at = now() where id = '<uuid>'` (run as postgres). Record results in the checkpoint report.

### Task 2: Pure helpers — `safeNext`, `authValidation`, `messages`

- [ ] Tests first: `tests/safeNext.test.ts` (`'/suche'` → `'/suche'`; `'//evil.com'`, `'https://x'`, `''`, `null`, `undefined`, `'suche'` → `'/dashboard'`; `'/suche?q=1'` kept). `tests/authValidation.test.ts` (email normalization + `invalid_email`; password < 10 → `weak_password`; registration: mismatch → `password_mismatch`; consent !== true → `consent_required`; success returns `{ email, password }`). `tests/authMessages.test.ts` (every `AuthErrorCode` has a non-empty German string).
- [ ] Implement:

```ts
// $lib/auth/safeNext.ts
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string
// $lib/server/authValidation.ts
export type AuthErrorCode = 'invalid_email' | 'weak_password' | 'password_mismatch' | 'consent_required' | 'invalid_credentials' | 'rateLimited' | 'error'
export function validateEmail(v: unknown): { ok: true, email: string } | { ok: false, error: 'invalid_email' }
export function validatePassword(v: unknown): { ok: true, password: string } | { ok: false, error: 'weak_password' }
export function validateRegistration(body: unknown): { ok: true, data: { email: string, password: string } } | { ok: false, error: AuthErrorCode }
// $lib/auth/messages.ts
export const AUTH_MESSAGES: Record<AuthErrorCode, string>
```

- [ ] Tests pass. Checkpoint.

### Task 3: Session plumbing — hooks, root layout, `app.d.ts`

- [ ] Tests first: `tests/hooks.test.ts` — import `{ handle }`; fabricate an event with `cookies`, `route.id`, `url`, `locals`; mock `@supabase/ssr` `createServerClient` to return an object whose `auth.getSession/getUser` and `from('profiles')…maybeSingle` are controllable. Cases: (1) no session → `safeGetSession()` returns `{ session: null, user: null, isActive: false }`; (2) session + user + `activated_at` null → `isActive false`; (3) `activated_at` set → `isActive true`; (4) `getUser` error → treated as no session; (5) route `/(app)/dashboard` without session → 303 to `/login?next=%2Fdashboard`; (6) `/(auth)/login` with session → 303 to `/dashboard`; (7) `/` never redirects.
- [ ] Implement `hooks.server.ts` per spec §2.1 and §4.1 (`sequence(supabase, authGuard)`); `app.d.ts` Locals `{ supabase, safeGetSession }`.
- [ ] Root `+layout.server.ts` returns `{ cookies, session, user: user ? { id, email } : null, isActive }`; `+layout.ts` passes `session/user/isActive` through; `+layout.svelte` adds `onMount` → `onAuthStateChange` → `invalidate('supabase:auth')` on `expires_at` change.
- [ ] Update existing page tests that pass `data` (`landing-page`, `search-page`, `un-page`) to include `session: null, user: null, isActive: false` where needed. Tests pass. Checkpoint.

### Task 4: `AuthFormState` + `LockNotice` + `(auth)` layout

- [ ] Tests first: `tests/authForm.svelte.test.ts` — `canSubmit` per kind: login needs email+password; register needs email, password ≥ 10, repeat equal, consent; reset needs email; newPassword needs password + repeat; `submitting` blocks. `tests/LockNotice.test.ts` renders the spec §4.2 message.
- [ ] Implement `authForm.svelte.ts`, `LockNotice.svelte`, `(auth)/+layout.svelte` (navy bg, brand linking to `/`, white card, `{@render children()}`).
- [ ] Autofixer. Tests pass. Checkpoint.

### Task 5: Login + logout

- [ ] Tests first: `tests/login-action.test.ts` — mock `locals.supabase.auth.signInWithPassword`: success → throws redirect 303 to `/dashboard` (or `next`); auth error → `fail(400, { error: 'invalid_credentials' })`; 11th attempt from one IP within 15 min → `fail(429, { error: 'rateLimited' })`. `tests/logout-action.test.ts` — POST → `signOut` called and redirect 303 `/`. `tests/login-page.test.ts` — renders email+password fields, links to `/registrieren` and `/passwort-vergessen`, shows `AUTH_MESSAGES.invalid_credentials` when `form.error` is set, `noindex` meta.
- [ ] Implement `(auth)/login/+page.server.ts` (+`load` returning `next` from `url`), `+page.svelte` (form with `use:enhance`, `AuthFormState('login')`), `logout/+page.server.ts` (actions.default; no `load`; GET → 405 via `+server.ts`? No: a `+page.server.ts` with only actions returns 405 on GET automatically when no page exists — verify with a test request in preview).
- [ ] Autofixer. Tests pass. Checkpoint.

### Task 6: Register, password reset, new password, confirm, error page

- [ ] Tests first: `tests/register-action.test.ts` (validation errors → 400 with code; success → `signUp` called with `emailRedirectTo` ending in `/auth/confirm?next=/dashboard` and returns `{ sent: true }`; rate limit 6th/hour → 429). `tests/reset-action.test.ts` (always `{ sent: true }`, `resetPasswordForEmail` called with `redirectTo …/auth/confirm?next=/passwort-neu`; invalid email still `{ sent: true }` without calling). `tests/new-password-action.test.ts` (no session → redirect `/login`; weak → 400; mismatch → 400; success → `updateUser` + redirect `/dashboard`). `tests/auth-confirm.test.ts` (`GET` with valid `token_hash`+`type` → `verifyOtp` called, 303 to `safeNext(next)`; missing/invalid → 303 `/auth/fehler`). Page tests for each form's fields and success states; error page links.
- [ ] Implement per spec §3. `ORIGIN` for redirect URLs comes from `event.url.origin` (adapter-node sets it from `ORIGIN`).
- [ ] Autofixer. Tests pass. Checkpoint.

### Task 7: `(app)` group — shell, guard data, dashboard

- [ ] Tests first: `tests/app-layout.test.ts` — renders nav, email, logout form posting to `/logout`; banner present only when `isActive` false. `tests/dashboard-page.test.ts` — cards link to `/suche` and `/un/1203`; status text per `isActive`; lock notice only when locked.
- [ ] Implement `(app)/+layout.server.ts` (returns `{ isActive, user }` from parent — no second `safeGetSession` call), `(app)/+layout.svelte`, `(app)/dashboard/+page.svelte`.
- [ ] Autofixer. Tests pass. Checkpoint.

### Task 8: Move search and UN page into `(app)`, locked branches

- [ ] Tests first: extend `tests/search.svelte.test.ts` — `new SearchState(client, { locked: true })`: setting `query = 'Benzin'` never calls `from`, results stay `[]`, `selectedUn` stays null even for `'1203'`. Rewrite `tests/search-page.test.ts` for the new path with `isActive` in data: active → existing behaviour; locked → typing shows `LockNotice`, demo tool stub rendered, no query. Rewrite `tests/un-page-load.test.ts`: active → fetch; locked + `1203` → `{ locked: true, compareData: DEMO_DATA }` without querying; locked + other → `{ locked: true, compareData: null }`. Rewrite `tests/un-page.test.ts`: locked other → `LockNotice`; locked 1203 → tool stub with `demo`; active → tool stub with `initialData`.
- [ ] `git`-free move: `mv src/routes/search src/routes/(app)/suche`, `mv src/routes/un src/routes/(app)/un`; update imports/tests; implement locked branches per spec §4.3; `SearchState` gets `options?: { locked?: boolean }`.
- [ ] Autofixer. Tests pass. Checkpoint.

### Task 9: Retire the waitlist, landing copy, docs

- [ ] Tests first: update `tests/landing-page.test.ts` — no `#waitlist`; navbar link `/login`; buttons to `/registrieren`; FAQ answer contains "ohne Funktionsstufen"; no `offers` in SoftwareApplication JSON-LD; section order `['header','features','demo','comparison','faq','footer']`. Update `tests/structuredData.test.ts` (offer removed). Delete the waitlist tests listed in the file map.
- [ ] Implement spec §5; delete files listed in the file map; update `static/llms.txt`, meta description, `CLAUDE.md`, `README.md`.
- [ ] `pnpm test`, `pnpm check`, `pnpm build`; preview smoke: `/` 200 public; `/suche` → 303 `/login?next=%2Fsuche`; `/login` 200; `/dashboard` → 303. Checkpoint with the owner's dashboard checklist (spec §6) repeated verbatim.
