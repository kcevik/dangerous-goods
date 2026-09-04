# Auth and Entitlement Gate — Design

**Date:** 2026-09-04
**Status:** implemented 2026-09-04 (code + migrations applied live). Open: §6 dashboard configuration by the owner.
**Feature:** F-04 (user management & login) plus the paid-access gate; minimal F-05 dashboard shell

## Goal

Put the product behind a login. Anyone can register with email and password; a registered account starts **locked** and becomes **active** only when the owner activates it manually. Locked users can see the whole product and use it with demo data, but never with real regulation data. The landing page stays public; the waitlist is retired in favour of registration.

## Decisions (already made)

| Question | Decision |
|---|---|
| Sign-in method | Email + password, with password reset. No magic link, no OAuth. |
| Registration | Open self-registration, email confirmation required. |
| Public surface | Only `/` (landing) and the auth pages. Search, UN pages, dashboard, tools: login required. |
| Activation | Manual: owner sets `profiles.activated_at` in the Supabase table editor. No payment provider yet; the model must allow Stripe later without a schema change. |
| Locked mode | Demo data (UN 1203, `DEMO_DATA`/`DEMO_SVS`) fully usable; any real query shows a lock notice. Enforced server-side and by RLS, not only in the UI. |
| Waitlist | Retired: section, action, state class, validation, table. Landing CTAs point to `/registrieren`. |
| Pricing copy | Single paid plan, price announced to registered users first; no free-tier claims; JSON-LD offer removed until a price exists. |
| Enforcement approach | `profiles.activated_at` + RLS (approach 1 of the brainstorm). |
| Language | All auth UI German. |

## 1. Data model and security

One migration `supabase/migrations/<timestamp>_auth_and_entitlement.sql`:

### 1.1 `profiles`

```sql
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  activated_at timestamptz,          -- null = locked preview; set by the owner to activate
  created_at   timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles for select to authenticated using ((select auth.uid()) = id);
-- no insert/update/delete policies: rows are created by the trigger, activated in the dashboard
```

Trigger `handle_new_user()` (security definer, `set search_path = ''`, owned by `postgres`, in `public`) on `auth.users` after insert creates the profile row with `new.id, new.email`. It is the only security-definer function and it takes no user input beyond the row it is triggered for.

### 1.2 Activation helper

```sql
create function is_activated() returns boolean
language sql stable security invoker set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and activated_at is not null) $$;
```

### 1.3 Regulation data policies

For each of `adr_entries`, `rid_entries`, `icao_entries`, `imdg_entries`, `un_entries`, `special_provisions`, `segregation_matrix`, `segregation_codes`:

```sql
drop policy "public read" on <table>;
create policy "activated read" on <table> for select to authenticated using ((select public.is_activated()));
```

Consequences: the `anon` role reads nothing; an authenticated but locked user reads nothing; only activated users read rows. The service role (import script) is unaffected. `profiles` needs an index? No: it is a primary-key lookup.

### 1.4 Cleanup

```sql
drop view if exists un_comparison;
drop table if exists waitlist;
```

The owner exports any existing `waitlist` rows from the dashboard **before** the migration is applied. The migration comment says so.

### 1.5 Advisor check

After applying, run the Supabase advisors (MCP `get_advisors` or `supabase db advisors`) and resolve anything reported.

## 2. Session handling

### 2.1 `hooks.server.ts`

Keeps the per-request `createServerClient`. Adds:

```ts
event.locals.safeGetSession = async () => {
  const { data: { session } } = await event.locals.supabase.auth.getSession()
  if (!session) return { session: null, user: null, isActive: false }
  const { data: { user }, error } = await event.locals.supabase.auth.getUser()   // validates the JWT
  if (error || !user) return { session: null, user: null, isActive: false }
  const { data: profile } = await event.locals.supabase.from('profiles').select('activated_at').eq('id', user.id).maybeSingle()
  return { session, user, isActive: !!profile?.activated_at }
}
```

`App.Locals` gains `safeGetSession`. Two hooks are composed with `sequence`: `supabase` (client + safeGetSession) and `authGuard` (section 4).

### 2.2 Root layout

`+layout.server.ts` returns `{ cookies, session, user: { id, email } | null, isActive }` from `safeGetSession()`. `+layout.ts` keeps creating the client and returns `{ supabase, session, user, isActive }`. `+layout.svelte` subscribes to `supabase.auth.onAuthStateChange` in `onMount` and calls `invalidate('supabase:auth')` when the new session's `expires_at` differs from the loaded one, so client-side navigation after login/logout re-runs loads.

### 2.3 Rate limiting

`createRateLimiter` from `$lib/server/rateLimit` is reused: one limiter for login (10 attempts / IP / 15 min), one for register + password reset (5 / IP / hour). Same `getClientAddress()` semantics as before (`ADDRESS_HEADER`/`XFF_DEPTH`).

## 3. Auth routes (public, German, `noindex`)

All forms are SvelteKit form actions with `use:enhance`; they work without JavaScript. Field state lives in a small `AuthFormState` class (`$lib/auth/authForm.svelte.ts`: `email`, `password`, `passwordRepeat`, `consent`, `status`, `canSubmit` per form kind). Validation is a pure module `$lib/server/authValidation.ts`:

- `validateEmail(v)` → normalized lowercase or error `invalid_email`
- `validatePassword(v)` → ok if ≥ 10 chars, else `weak_password`
- `validateRegistration(body)` → `{ email, password }` or one of `invalid_email | weak_password | password_mismatch | consent_required`

Routes under `src/routes/(auth)/` sharing a centered card layout (`(auth)/+layout.svelte`: navy background, brand, card):

| Route | Action(s) | Behaviour |
|---|---|---|
| `/login` | default | `signInWithPassword`; on success `redirect(303, next ?? '/dashboard')`; on error `fail(400, { message: 'invalid_credentials' })`; 429 → `rateLimited`. `next` comes from `?next=` and passes through `safeNext(value)` (`$lib/auth/safeNext.ts`): returns the value only if it starts with `/` and not `//`, otherwise `/dashboard`. Links: "Registrieren", "Passwort vergessen?". |
| `/registrieren` | default | `validateRegistration`; `signUp({ email, password, options: { emailRedirectTo: `${ORIGIN}/auth/confirm?next=/dashboard` } })`; on success render "Bestätige deine E-Mail-Adresse" state (form replaced). Existing email: Supabase returns success without a new user when confirmations are on; the UI shows the same "check inbox" state, so enumeration is not possible. Consent checkbox links to `/datenschutz` on gefahrgut.org. |
| `/passwort-vergessen` | default | `resetPasswordForEmail(email, { redirectTo: `${ORIGIN}/auth/confirm?next=/passwort-neu` })`; always shows "Falls ein Konto existiert, haben wir eine E-Mail geschickt." |
| `/passwort-neu` | default | requires a session (arrived via recovery link); `updateUser({ password })`; then redirect to `/dashboard`. Without session → redirect to `/login`. |
| `/auth/confirm` | GET `+server.ts` | reads `token_hash`, `type`, `next`; `verifyOtp({ type, token_hash })`; success → `redirect(303, safeNext(next))`; failure → `redirect(303, '/auth/fehler')`. |
| `/auth/fehler` | page | "Der Link ist ungültig oder abgelaufen." with links to login and password reset. |
| `/logout` | POST action only | `signOut()`; `redirect(303, '/')`. GET returns 405. |

Error messages are mapped to German strings in one place (`$lib/auth/messages.ts`).

## 4. Route protection and locked mode

### 4.1 Guard

Product routes live in `src/routes/(app)/`: `dashboard`, `suche`, `un/[nummer]`. The `authGuard` hook checks `event.route.id?.startsWith('/(app)')`; without a session it redirects to `/login?next=<pathname>`. Authenticated users hitting `/login` or `/registrieren` are redirected to `/dashboard`. The old `/search` route is renamed to `/suche` (German, matches the rest); `/search` is not kept.

### 4.2 App shell

`(app)/+layout.svelte`: top bar with brand (links to `/dashboard`), nav links "Dashboard" and "Suche", the user's email, and a "Abmelden" button (a `<form method="POST" action="/logout">`). When `!data.isActive`, an amber banner under the bar:

> Dein Konto ist noch nicht freigeschaltet. Du kannst die Demo mit UN 1203 ausprobieren; echte Regelwerksdaten werden nach der Freischaltung verfügbar.

`LockNotice.svelte` (`$lib/auth/LockNotice.svelte`) renders the same message as an inline card for use inside tools.

### 4.3 Locked behaviour per page

| Page | Active | Locked |
|---|---|---|
| `/dashboard` | welcome, status "Freigeschaltet", cards: Suche, Regelwerksvergleich (→ `/un/1203`), plus "in Vorbereitung" cards for 1000-Punkte-Rechner, Dokumentengenerator | same, status "Noch nicht freigeschaltet" with the lock notice |
| `/suche` | today's live search | search input renders but typing shows `LockNotice` instead of querying (`SearchState` gets a `locked` flag: setting `query` when locked never calls Supabase and sets `results = []`); the demo tool (`<MultimodalTool demo />`) is shown below the notice so there is something to try |
| `/un/[nummer]` | server load fetches real data | server load returns `{ unNumber, locked: true, compareData: nummer === '1203' ? DEMO_DATA : null }`; page renders the tool with `demo` for 1203, `LockNotice` for anything else. No database call is made for locked users. |

RLS is the backstop: even if a locked user reaches a query path, the tables return zero rows. The UI must not rely on that for its messaging, hence the explicit `locked` branches.

### 4.4 `MultimodalTool` and SV texts

No change to the component contract. In locked mode the tool is only ever mounted with `demo`, which reads `DEMO_DATA`/`DEMO_SVS` and never calls Supabase.

## 5. Landing page changes

- Remove: `Waitlist.svelte`, `waitlistForm.svelte.ts`, `waitlistValidation.ts`, `supabaseAdmin.ts` (nothing else uses the service role in the app), the `waitlist` action in `+page.server.ts` (file deleted), their tests, and `waitlist` references in `llms.txt`, `CLAUDE.md`, README.
- Navbar: "Anmelden" → `/login`; orange button "Jetzt registrieren" → `/registrieren`.
- Hero: unchanged copy; CTA stays "Jetzt ausprobieren" → `#demo`.
- Cta section: heading unchanged; text "Die Plattform ist im Aufbau. Registriere dich, sieh dir alles an und erfahre zuerst, wenn es losgeht."; primary button "Jetzt registrieren" → `/registrieren`; secondary "Demo ansehen" → `#demo` unchanged.
- Footer: "Warteliste" link → "Registrieren" → `/registrieren`.
- FAQ "Was kostet gefahrgut.org?" answer: "gefahrgut.org wird als ein Tarif mit vollem Funktionsumfang angeboten – ohne Funktionsstufen. Der Preis steht noch nicht fest und wird zuerst registrierten Nutzern mitgeteilt, zusammen mit einem Startangebot. Weitere Tarife, etwa für Teams, sind später möglich."
- `structuredData.ts`: remove the `offers` block from `buildSoftwareApplicationLd`.
- `llms.txt`: replace the waitlist/free-tier paragraph with: "Ein Tarif mit vollem Funktionsumfang; der Preis wird zuerst registrierten Nutzern bekannt gegeben. Registrierung ist offen; bis zur Freischaltung steht eine Demo mit UN 1203 zur Verfügung. Suche und Regelwerksvergleich erfordern ein freigeschaltetes Konto."
- Meta description on `/`: "… Jetzt auf die Warteliste." → "… Jetzt registrieren."

## 6. Supabase project configuration (owner, dashboard)

1. **Authentication → Providers → Email:** enabled, "Confirm email" on, "Secure email change" on. Minimum password length 10.
2. **Authentication → URL Configuration:** Site URL `https://gefahrgut.org`. Redirect URLs: `https://gefahrgut.org/auth/confirm`, `http://localhost:5173/auth/confirm`, `http://localhost:4173/auth/confirm`.
3. **Authentication → Emails → Templates** (subject lines in German; body link is the important part):
   - Confirm signup: link `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
   - Reset password: link `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/passwort-neu`
   - Change email address: link `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/dashboard`
   - Magic link template: unused (provider off), leave as is.
4. **SMTP:** configure a real sender (Project Settings → Auth → SMTP) before launch. The built-in sender is limited to a few emails per hour and is for development only.
5. **Activation:** Table Editor → `profiles` → set `activated_at` to now for a customer. (Later: Stripe webhook sets the same column.)

The spec lists these because they cannot be automated from the repo; the implementation plan repeats them as a checklist.

## 7. Testing

- **Unit:** `authValidation` (each error path, normalization), `AuthFormState.canSubmit` per form kind, `safeNext()` (the `next` validator), `SearchState` locked flag.
- **Server:** each action with fabricated events and a mocked `locals.supabase` (`auth.signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`, `verifyOtp`, `signOut`): success redirects, error mapping, rate limiting; `/auth/confirm` valid/invalid/missing token; `(app)` guard redirect with `next`; `/un/[nummer]` load: active → real data, locked + 1203 → demo, locked + other → `locked` without querying.
- **Component:** each auth page renders fields, error and success states; app shell banner only when locked; `LockNotice`; `/suche` locked shows notice and demo, active queries; dashboard cards and status.
- **Landing:** updated assertions for CTAs, absence of `#waitlist`, FAQ wording, JSON-LD without `offers`.
- **Database (one-off during implementation, documented in the plan):** with the CLI against the linked project, `select count(*) from adr_entries` as anon → 0; as a fresh authenticated user → 0; after setting `activated_at` → > 0. `get_advisors` clean.

Definition of done: `pnpm test` green; `pnpm check` clean; `pnpm build` + preview: `/` public, `/suche` redirects to `/login?next=/suche`, register → confirm email → dashboard shows locked banner → owner activates → `/un/1090` shows real data.

## Out of scope

Stripe/payments, teams/organizations, OAuth providers, magic link, profile editing page, email change UI (template configured only), full dashboard (F-05), tools, admin UI for activation, remaining `.env.local.bak` cleanup.
