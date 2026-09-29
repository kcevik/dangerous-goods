> **Progress 2026-09-29:** Tasks 1–7 **done** (inline; decisions in "Execution notes" at the end). 610 tests green, `pnpm check`
> 0 errors, `pnpm build` OK. Migration applied and verified live 2026-09-29. Local Docker image verified.
> Tasks 8–11 not started.

# Pre-launch Mode + Test Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a test version of gefahrgut.org to a Netcup VPS (Docker app behind nginx + certbot) where "Registrieren" collects launch-notification emails instead of creating accounts, reversible by one environment variable.

**Architecture:** A fail-closed `REGISTRATION_MODE` switch (runtime env) decides whether `/registrieren` runs the existing sign-up or an email-only notification flow that writes through an insert-only Postgres function. The app ships as a two-stage Docker image, bound to `127.0.0.1:3000`, behind nginx on the host with Let's Encrypt certificates from certbot. A local deploy script builds, ships over SSH, health-checks and rolls back.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, Supabase (Postgres RPC), Vitest 5, Docker + compose, nginx, certbot, bash.

**Spec:** `docs/superpowers/specs/2026-09-29-prelaunch-deployment-design.md`

## Global Constraints

- **pnpm only**, never npm/npx. **No git commits** — the owner commits; do not inspect commit history. Every "commit" step in this plan is replaced by: *leave the change uncommitted and note it in the ledger*.
- Every feature ships with tests; TDD (test first, watch it fail). `pnpm test` green before each task closes.
- Svelte MCP autofixer on every `.svelte` / `.svelte.ts` file touched.
- Svelte 5 runes only; English identifiers; **all user-visible copy German, addressing the user with "du"**.
- Internal links via `resolve()` with group segments (`resolve('/(auth)/registrieren')`).
- `REGISTRATION_MODE`: **only the exact value `open` (after trim) opens registration**; anything else, including unset, empty, `OPEN`, means `waitlist`.
- The app never uses `SUPABASE_SERVICE_ROLE_KEY`.
- Consent version string: `'2026-09-29'`. Consent sentence (verbatim): `Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Meine Adresse wird nur dafür gespeichert; ich kann jederzeit widersprechen.`
- Waitlist success copy (verbatim): `Danke! Wir benachrichtigen dich, sobald gefahrgut.org startet.`
- CTA copy: open → `Jetzt registrieren`; waitlist → `Zum Launch benachrichtigen`.
- Rate limit for `/registrieren` (both modes): 5 per IP per hour.
- Container: `node:22-bookworm-slim`; port binding `127.0.0.1:3000:3000`; runtime user `node`; `mem_limit: 512m`; logs `max-size: 10m`, `max-file: 3`.
- Server paths: app dir `/opt/gefahrgut`, secrets `/etc/gefahrgut/app.env`, book `/var/lib/gefahrgut/ADR2025-konsolidiert.md` mounted read-only at `/data/adr.md`.
- `XFF_DEPTH=1`, `ADDRESS_HEADER=X-Forwarded-For` (nginx appends exactly one hop).
- Tasks 10 and 11 are **gated on the owner** (Phase B / Phase C) and must not run before the owner says so.

## Review Focus

1. `REGISTRATION_MODE=OPEN` / ` open ` / `yes` — a reasonable operator expects only a deliberate `open` to open sign-up; covered in Task 1.
2. An address submitted as `  K@Example.DE ` and later as `k@example.de` — expected: one row, same success message both times; covered in Tasks 2 and 3.
3. A hand-built POST with password fields while in waitlist mode — expected: no account is ever created; covered in Task 3.
4. A browser without JavaScript submitting the notification form — expected: the server round trip shows the success or error state; covered in Task 4.
5. First deploy before the book file was copied — expected: compose refuses to start instead of Docker silently creating an empty directory; covered in Task 6 (`create_host_path: false`) and the runbook.

---

## File map

| Path | Responsibility |
|---|---|
| `src/lib/server/registrationMode.ts` | `registrationMode()` — fail-closed read of `REGISTRATION_MODE` |
| `src/lib/prelaunch/consent.ts` | `CONSENT_VERSION`, `LAUNCH_CONSENT_TEXT` |
| `src/lib/prelaunch/copy.ts` | `signupCtaLabel(open)` and the waitlist copy strings |
| `src/lib/legal.ts` | `PRIVACY_URL`, `IMPRINT_URL`, `BLOG_URL` — single home of the WordPress links |
| `src/lib/prelaunch/LaunchNotifyForm.svelte` | the email-only notification form + success state |
| `src/routes/(auth)/registrieren/+page.server.ts` | `load` → `{ mode }`; default action branches on the mode |
| `src/routes/healthz/+server.ts` | `GET` → `200 ok` |
| `supabase/migrations/20260929120000_launch_signups.sql` | table + insert-only function |
| `Dockerfile`, `.dockerignore` | image build |
| `deploy/compose.yaml`, `deploy/app.env.example` | server runtime definition |
| `deploy/nginx/bootstrap-http.conf`, `deploy/nginx/gefahrgut.conf` | nginx sites (Phase A) |
| `scripts/deploy.sh`, `.deploy.env.example` | build → ship → switch → verify → rollback |
| `docs/deploy/README.md`, `docs/deploy/concepts.md` | runbook + learning notes |

---

### Task 1: Registration mode switch

**Files:**
- Create: `src/lib/server/registrationMode.ts`
- Modify: `src/routes/+layout.server.ts`
- Modify: `.env.example`
- Test: `tests/registrationMode.test.ts`, `tests/root-layout.test.ts`

**Interfaces:**
- Produces: `export type RegistrationMode = 'waitlist' | 'open'`; `export function registrationMode(): RegistrationMode`; root layout data gains `registrationOpen: boolean`.

- [ ] **Step 1: Write the failing test** — `tests/registrationMode.test.ts`

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string | undefined> }))
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))

const { registrationMode } = await import('$lib/server/registrationMode')

beforeEach(() => {
  for (const key of Object.keys(dynamicEnv)) delete dynamicEnv[key]
})

describe('registrationMode', () => {
  it('is waitlist when the variable is unset (fail-closed)', () => {
    expect(registrationMode()).toBe('waitlist')
  })

  it('is open only for the exact value open, ignoring surrounding spaces', () => {
    dynamicEnv.REGISTRATION_MODE = 'open'
    expect(registrationMode()).toBe('open')
    dynamicEnv.REGISTRATION_MODE = '  open \n'
    expect(registrationMode()).toBe('open')
  })

  it.each(['', 'OPEN', 'Open', 'yes', 'true', 'waitlist', 'opened'])('treats %j as waitlist', (value) => {
    dynamicEnv.REGISTRATION_MODE = value
    expect(registrationMode()).toBe('waitlist')
  })
})
```

- [ ] **Step 2: Run it — expect FAIL** (`Failed to resolve import "$lib/server/registrationMode"`)

Run: `pnpm test tests/registrationMode.test.ts`

- [ ] **Step 3: Implement** — `src/lib/server/registrationMode.ts`

```ts
import { env } from '$env/dynamic/private'

export type RegistrationMode = 'waitlist' | 'open'

/**
 * Whether `/registrieren` creates accounts (`open`) or collects launch
 * notifications (`waitlist`). Read at runtime, so go-live is an env change plus a
 * container restart. Fail-closed: only the exact value `open` opens sign-up, so a
 * missing or misspelt variable can never open registration by accident.
 */
export function registrationMode(): RegistrationMode {
  return env.REGISTRATION_MODE?.trim() === 'open' ? 'open' : 'waitlist'
}
```

- [ ] **Step 4: Run it — expect PASS** (10 tests)

- [ ] **Step 5: Extend the root layout test** — in `tests/root-layout.test.ts` add, after the existing imports:

```ts
const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string | undefined> }))
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))
```

change the first test's expectation to include `registrationOpen: false`, and add:

```ts
  it('reports registrationOpen from REGISTRATION_MODE', async () => {
    dynamicEnv.REGISTRATION_MODE = 'open'
    const result = await load({
      cookies: { getAll: () => [] },
      locals: { safeGetSession: async () => ({ session: null, user: null, isActive: false }) },
    } as never)
    expect(result).toMatchObject({ registrationOpen: true })
    delete dynamicEnv.REGISTRATION_MODE
  })
```

- [ ] **Step 6: Run — expect FAIL** (`registrationOpen` missing). Run: `pnpm test tests/root-layout.test.ts`

- [ ] **Step 7: Implement** — `src/routes/+layout.server.ts`:

```ts
import { registrationMode } from '$lib/server/registrationMode'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  const { session, user, isActive } = await locals.safeGetSession()
  return {
    cookies: cookies.getAll(),
    session,
    // only what the UI needs — never ship the full auth user object to the client
    user: user ? { id: user.id, email: user.email ?? '' } : null,
    isActive,
    // pre-launch: "Registrieren" collects launch notifications unless this is true
    registrationOpen: registrationMode() === 'open',
  }
}
```

- [ ] **Step 8: `.env.example`** — append:

```
# 'open' = normal sign-up; anything else (or unset) = launch-notification list (fail-closed)
REGISTRATION_MODE=waitlist
```

- [ ] **Step 9: Run** `pnpm test` — expect all green. Leave uncommitted.

---

### Task 2: `launch_signups` table and insert-only function

**Files:**
- Create: `supabase/migrations/20260929120000_launch_signups.sql`
- Test: `tests/migration-launch-signups.test.ts`

**Interfaces:**
- Produces: Postgres function `public.join_launch_list(p_email text, p_consent_version text) returns void`, callable by `anon` and `authenticated`.

- [ ] **Step 1: Write the failing static guard** — `tests/migration-launch-signups.test.ts`

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Static guard for the launch list: nothing may be readable through the API, and
 * the only way in is the insert-only security-definer function.
 */
const SQL = readFileSync(
  fileURLToPath(new URL('../supabase/migrations/20260929120000_launch_signups.sql', import.meta.url)),
  'utf-8',
).toLowerCase()

describe('launch_signups migration', () => {
  it('creates the table with a normalised, unique email', () => {
    expect(SQL).toMatch(/create table public\.launch_signups/)
    expect(SQL).toMatch(/email\s+text not null unique/)
    expect(SQL).toMatch(/check \(email = lower\(btrim\(email\)\)/)
    expect(SQL).toMatch(/consent_version\s+text not null/)
    expect(SQL).toMatch(/confirmed_at\s+timestamptz/)
  })

  it('enables RLS and defines no policy at all', () => {
    expect(SQL).toMatch(/alter table public\.launch_signups enable row level security/)
    expect(SQL).not.toMatch(/create policy/)
  })

  it('revokes every table privilege from the API roles', () => {
    expect(SQL).toMatch(/revoke all on table public\.launch_signups from anon, authenticated/)
    expect(SQL).not.toMatch(/grant [^;]* on table public\.launch_signups/)
  })

  it('writes only through a security-definer function with an empty search_path', () => {
    expect(SQL).toMatch(/create function public\.join_launch_list\(p_email text, p_consent_version text\)/)
    expect(SQL).toMatch(/security definer/)
    expect(SQL).toMatch(/set search_path = ''/)
    expect(SQL).toMatch(/on conflict \(email\) do nothing/)
  })

  it('lets the API roles execute the function and nobody else by default', () => {
    expect(SQL).toMatch(/revoke all on function public\.join_launch_list\(text, text\) from public/)
    expect(SQL).toMatch(/grant execute on function public\.join_launch_list\(text, text\) to anon, authenticated/)
  })

  it('never returns data from the function', () => {
    expect(SQL).toMatch(/returns void/)
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (file not found). Run: `pnpm test tests/migration-launch-signups.test.ts`

- [ ] **Step 3: Write the migration** — `supabase/migrations/20260929120000_launch_signups.sql`

```sql
-- Launch-notification list (pre-launch mode, spec 2026-09-29 §2).
--
-- Nothing here is readable through the API: RLS is on with NO policies and every
-- table privilege is revoked. The only way in is join_launch_list(), a
-- security-definer function that can insert but never read, so a caller cannot
-- even learn whether an address is already listed.
--
-- Honest limit: the function must be callable with the publishable key (the app
-- uses that key too), so it can be called directly, past the app's rate limit.
-- Worst case is junk rows; the later double opt-in filters them out.

create table public.launch_signups (
  id              bigint generated always as identity primary key,
  email           text not null unique
                  check (email = lower(btrim(email)) and length(email) between 6 and 254),
  consent_version text not null check (length(consent_version) between 1 and 40),
  consented_at    timestamptz not null default now(),
  confirmed_at    timestamptz,          -- set by the later double opt-in
  created_at      timestamptz not null default now()
);

alter table public.launch_signups enable row level security;
revoke all on table public.launch_signups from anon, authenticated;

create function public.join_launch_list(p_email text, p_consent_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_email is null or length(p_email) > 254
     or lower(btrim(p_email)) !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if p_consent_version is null or length(p_consent_version) not between 1 and 40 then
    raise exception 'invalid consent version' using errcode = '22023';
  end if;

  insert into public.launch_signups (email, consent_version)
  values (lower(btrim(p_email)), p_consent_version)
  on conflict (email) do nothing;
end;
$$;

revoke all on function public.join_launch_list(text, text) from public;
grant execute on function public.join_launch_list(text, text) to anon, authenticated;
```

- [ ] **Step 4: Run — expect PASS** (6 tests)

- [ ] **Step 5: Apply to the hosted project — ASK THE OWNER FIRST.** With approval, apply via the Supabase MCP `apply_migration` (project `nmigeqhrquzmdxjeuite`, name `launch_signups`, the SQL above).

- [ ] **Step 6: Verify live with `execute_sql`:**

```sql
select
  has_table_privilege('anon', 'public.launch_signups', 'select')           as anon_select,   -- expect false
  has_table_privilege('anon', 'public.launch_signups', 'insert')           as anon_insert,   -- expect false
  has_function_privilege('anon', 'public.join_launch_list(text,text)', 'execute') as anon_exec; -- expect true
select public.join_launch_list('  Probe@Example.DE ', '2026-09-29');
select public.join_launch_list('probe@example.de', '2026-09-29');
select email, consent_version from public.launch_signups where email = 'probe@example.de'; -- expect exactly 1 row
delete from public.launch_signups where email = 'probe@example.de';
```

Then run `get_advisors` (security) and record any new finding. Leave the migration file uncommitted.

---

### Task 3: Notification action on `/registrieren`

**Files:**
- Create: `src/lib/prelaunch/consent.ts`
- Modify: `src/routes/(auth)/registrieren/+page.server.ts`
- Modify: `tests/helpers/authEvent.ts` (add an `rpc` mock)
- Test: `tests/register-action.test.ts`, `tests/prelaunch-consent.test.ts`

**Interfaces:**
- Consumes: `registrationMode()` (Task 1); RPC `join_launch_list` (Task 2); `validateEmail`, `validateRegistration` (existing); `createRateLimiter` (existing).
- Produces: `load` → `{ mode: RegistrationMode }`; action results `{ sent: true }` (open), `{ notified: true }` (waitlist), or `fail(status, { error: AuthErrorCode, email?: string })`; `CONSENT_VERSION`, `LAUNCH_CONSENT_TEXT`.

- [ ] **Step 1: Consent test** — `tests/prelaunch-consent.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { CONSENT_VERSION, LAUNCH_CONSENT_TEXT } from '$lib/prelaunch/consent'

// The stored consent_version must always name the text that was shown. If this
// test fails because the text changed, bump CONSENT_VERSION in the same change.
describe('launch consent', () => {
  it('pairs the version with the exact sentence shown to the reader', () => {
    expect(CONSENT_VERSION).toBe('2026-09-29')
    expect(LAUNCH_CONSENT_TEXT).toBe('Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Meine Adresse wird nur dafür gespeichert; ich kann jederzeit widersprechen.')
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (module missing).

- [ ] **Step 3: Implement** — `src/lib/prelaunch/consent.ts`

```ts
/**
 * Consent for the launch-notification list. The version is stored with every
 * address, so it must change whenever the sentence changes (a test pins both).
 */
export const CONSENT_VERSION = '2026-09-29'

export const LAUNCH_CONSENT_TEXT
  = 'Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Meine Adresse wird nur dafür gespeichert; ich kann jederzeit widersprechen.'
```

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Extend the event helper** — `tests/helpers/authEvent.ts`: add `rpc?: ReturnType<typeof vi.fn>` to the options, create a default and expose it:

```ts
  const rpc = opts.rpc ?? vi.fn(async () => ({ data: null, error: null }))
  // ...
    locals: {
      supabase: { auth, rpc },
  // ...
  return { event, auth, rpc }
```

- [ ] **Step 6: Rewrite the action tests** — `tests/register-action.test.ts` becomes:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_VERSION } from '$lib/prelaunch/consent'
import { createAuthMock, makeAuthEvent } from './helpers/authEvent'

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string | undefined> }))
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))

const { actions, load } = await import('../src/routes/(auth)/registrieren/+page.server')

const VALID = { email: 'K@Example.de', password: 'correct-horse-9', passwordRepeat: 'correct-horse-9', consent: 'on' }

beforeEach(() => {
  delete dynamicEnv.REGISTRATION_MODE
})

describe('registrieren load', () => {
  it('reports the mode', async () => {
    expect(await load({} as never)).toEqual({ mode: 'waitlist' })
    dynamicEnv.REGISTRATION_MODE = 'open'
    expect(await load({} as never)).toEqual({ mode: 'open' })
  })
})

describe('register action — open mode', () => {
  beforeEach(() => {
    dynamicEnv.REGISTRATION_MODE = 'open'
  })

  it('signs up with a confirm redirect and reports sent', async () => {
    const { event, auth } = makeAuthEvent({ fields: VALID, path: '/registrieren' })
    const result = await actions.default(event as never)
    expect(result).toEqual({ sent: true })
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'k@example.de',
      password: 'correct-horse-9',
      options: { emailRedirectTo: 'http://localhost/auth/confirm?next=/dashboard' },
    })
  })

  // keep the remaining existing open-mode tests here unchanged:
  // password_mismatch, consent_required, "user exists → sent", Supabase failure → 500, rate limit
})

describe('register action — waitlist mode (default)', () => {
  it('never creates an account, even when password fields are posted', async () => {
    const { event, auth, rpc } = makeAuthEvent({ fields: VALID })
    expect(await actions.default(event as never)).toEqual({ notified: true })
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledWith('join_launch_list', { p_email: 'k@example.de', p_consent_version: CONSENT_VERSION })
  })

  it('normalises the address before storing it', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: '  K@Example.DE ', consent: 'on' } })
    await actions.default(event as never)
    expect(rpc).toHaveBeenCalledWith('join_launch_list', expect.objectContaining({ p_email: 'k@example.de' }))
  })

  it('answers an already listed address exactly like a new one', async () => {
    const first = makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' } })
    const second = makeAuthEvent({ fields: { email: 'K@example.de', consent: 'on' } })
    expect(await actions.default(first.event as never)).toEqual({ notified: true })
    expect(await actions.default(second.event as never)).toEqual({ notified: true })
  })

  it('treats a filled honeypot as success without writing', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: 'bot@example.de', consent: 'on', website: 'http://spam' } })
    expect(await actions.default(event as never)).toEqual({ notified: true })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rejects an invalid address and keeps what was typed', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: 'nope', consent: 'on' } })
    expect(await actions.default(event as never)).toMatchObject({ status: 400, data: { error: 'invalid_email', email: 'nope' } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('requires consent', async () => {
    const { event, rpc } = makeAuthEvent({ fields: { email: 'k@example.de' } })
    expect(await actions.default(event as never)).toMatchObject({ status: 400, data: { error: 'consent_required' } })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('returns the generic error when the database refuses', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }))
    const { event } = makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' }, rpc })
    expect(await actions.default(event as never)).toMatchObject({ status: 500, data: { error: 'error' } })
  })

  it('rate-limits to 5 per address per hour', async () => {
    for (let i = 0; i < 5; i++) {
      expect(await actions.default(makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' }, ip: '10.9.9.9' }).event as never)).toEqual({ notified: true })
    }
    expect(await actions.default(makeAuthEvent({ fields: { email: 'k@example.de', consent: 'on' }, ip: '10.9.9.9' }).event as never))
      .toMatchObject({ status: 429, data: { error: 'rateLimited' } })
  })
})
```

When moving the existing open-mode tests into the `open mode` block, copy them verbatim from the current file (they are listed in the comment above). The existing rate-limit test uses IP `10.x`; keep its own IP distinct from `10.9.9.9`.

- [ ] **Step 7: Run — expect FAIL** (`load` not exported; waitlist tests fail). Run: `pnpm test tests/register-action.test.ts`

- [ ] **Step 8: Implement** — `src/routes/(auth)/registrieren/+page.server.ts`

```ts
import { fail } from '@sveltejs/kit'
import { CONSENT_VERSION } from '$lib/prelaunch/consent'
import { validateEmail, validateRegistration } from '$lib/server/authValidation'
import { createRateLimiter } from '$lib/server/rateLimit'
import { registrationMode } from '$lib/server/registrationMode'
import type { Actions, PageServerLoad, RequestEvent } from './$types'

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

export const load: PageServerLoad = () => ({ mode: registrationMode() })

export const actions: Actions = {
  default: async (event) => {
    if (!limiter.check(event.getClientAddress())) {
      return fail(429, { error: 'rateLimited' as const })
    }
    const form = await event.request.formData()
    // decided on the server, so a hand-built POST cannot create an account in waitlist mode
    return registrationMode() === 'open' ? register(event, form) : notify(event, form)
  },
}

async function register({ locals, url }: RequestEvent, form: FormData) {
  const submittedEmail = String(form.get('email') ?? '').trim().toLowerCase()
  const result = validateRegistration({
    email: form.get('email'),
    password: form.get('password'),
    passwordRepeat: form.get('passwordRepeat'),
    consent: form.get('consent') === 'on',
  })
  if (!result.ok) {
    return fail(400, { error: result.error, email: submittedEmail })
  }

  const { error } = await locals.supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: { emailRedirectTo: `${url.origin}/auth/confirm?next=/dashboard` },
  })
  if (error) {
    return fail(500, { error: 'error' as const, email: result.data.email })
  }

  // Existing address: Supabase answers without a new user but without an error,
  // so this state is identical and reveals nothing.
  return { sent: true as const }
}

async function notify({ locals }: RequestEvent, form: FormData) {
  // bots fill every field; people never see this one
  if (String(form.get('website') ?? '') !== '') return { notified: true as const }

  const submittedEmail = String(form.get('email') ?? '').trim().toLowerCase()
  const email = validateEmail(form.get('email'))
  if (!email.ok) return fail(400, { error: email.error, email: submittedEmail })
  if (form.get('consent') !== 'on') return fail(400, { error: 'consent_required' as const, email: email.email })

  const { error } = await locals.supabase.rpc('join_launch_list', {
    p_email: email.email,
    p_consent_version: CONSENT_VERSION,
  })
  if (error) return fail(500, { error: 'error' as const, email: email.email })

  // new or already listed: the same answer, so the list cannot be probed
  return { notified: true as const }
}
```

- [ ] **Step 9: Run — expect PASS**; then `pnpm test` and `pnpm check` (0 errors). Leave uncommitted.

---

### Task 4: `/registrieren` page and login copy in both modes

**Files:**
- Create: `src/lib/legal.ts`, `src/lib/prelaunch/copy.ts`, `src/lib/prelaunch/LaunchNotifyForm.svelte`
- Modify: `src/routes/(auth)/registrieren/+page.svelte`, `src/routes/(auth)/login/+page.svelte`, `src/lib/auth/authForm.svelte.ts`
- Test: `tests/auth-pages.test.ts`, `tests/authForm.svelte.test.ts`

**Interfaces:**
- Consumes: `data.mode` (Task 3 load), `form.notified` / `form.error` / `form.email` (Task 3 action), `data.registrationOpen` (Task 1), `LAUNCH_CONSENT_TEXT` (Task 3).
- Produces: `PRIVACY_URL`, `IMPRINT_URL`, `BLOG_URL` (`src/lib/legal.ts`); `signupCtaLabel(open: boolean): string`, `LAUNCH_THANKS`, `LAUNCH_HEADING` (`src/lib/prelaunch/copy.ts`); `AuthFormKind` gains `'notify'`.

- [ ] **Step 1: Failing tests** — in `tests/auth-pages.test.ts` change the existing `register page` renders to pass `data: { mode: 'open' }`, and add:

```ts
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
```

In `tests/authForm.svelte.test.ts` add:

```ts
  it('notify: needs a valid email and consent', () => {
    const f = new AuthFormState('notify')
    f.email = 'k@example.de'
    expect(f.canSubmit).toBe(false)
    f.consent = true
    expect(f.canSubmit).toBe(true)
  })
```

- [ ] **Step 2: Run — expect FAIL.** Run: `pnpm test tests/auth-pages.test.ts tests/authForm.svelte.test.ts`

- [ ] **Step 3: Implement the shared modules**

`src/lib/legal.ts`:

```ts
/**
 * Legal pages and the blog live on WordPress until the blog moves into the app.
 * Phase B of the rollout (spec 2026-09-29 §6) changes these to blog.gefahrgut.org —
 * this file is the only place to edit.
 */
export const PRIVACY_URL = 'https://gefahrgut.org/datenschutzerklaerung/'
export const IMPRINT_URL = 'https://gefahrgut.org/impressum/'
export const BLOG_URL = 'https://gefahrgut.org/blog/'
```

`src/lib/prelaunch/copy.ts`:

```ts
/** Label of every sign-up call to action, by registration mode. */
export function signupCtaLabel(open: boolean): string {
  return open ? 'Jetzt registrieren' : 'Zum Launch benachrichtigen'
}

export const LAUNCH_HEADING = 'Benachrichtigung zum Start'
export const LAUNCH_INTRO = 'gefahrgut.org ist noch im Aufbau. Trag deine E-Mail-Adresse ein – wir sagen dir Bescheid, sobald es losgeht.'
export const LAUNCH_THANKS = 'Danke! Wir benachrichtigen dich, sobald gefahrgut.org startet.'
```

`src/lib/auth/authForm.svelte.ts`: extend `AuthFormKind` with `'notify'` and add `case 'notify': return this.emailValid && this.consent` to `canSubmit`.

- [ ] **Step 4: Implement the form** — `src/lib/prelaunch/LaunchNotifyForm.svelte`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import { resolve } from '$app/paths'
  import { untrack } from 'svelte'
  import { AuthFormState } from '$lib/auth/authForm.svelte'
  import { AUTH_MESSAGES } from '$lib/auth/messages'
  import type { AuthErrorCode } from '$lib/server/authValidation'
  import { PRIVACY_URL } from '$lib/legal'
  import { LAUNCH_CONSENT_TEXT } from './consent'
  import { LAUNCH_HEADING, LAUNCH_INTRO, LAUNCH_THANKS } from './copy'

  let { form }: { form: { notified?: boolean, error?: AuthErrorCode, email?: string } | null } = $props()

  // created once; a no-JS round trip returns the typed email in `form`
  const formState = untrack(() => {
    const f = new AuthFormState('notify')
    f.email = form?.email ?? ''
    return f
  })
  const message = $derived(form?.error ? AUTH_MESSAGES[form.error] : null)
</script>

{#if form?.notified}
  <div role="status">
    <div class="text-4xl mb-4">🔔</div>
    <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">{LAUNCH_HEADING}</h1>
    <p class="text-sm text-slate-500">{LAUNCH_THANKS}</p>
  </div>
{:else}
  <h1 class="text-2xl font-bold mb-2" style="color: #0f2744;">{LAUNCH_HEADING}</h1>
  <p class="text-sm text-slate-500 mb-6">{LAUNCH_INTRO}</p>

  <form
    method="POST"
    novalidate
    class="space-y-4"
    use:enhance={() => {
      formState.status = 'submitting'
      return async ({ update }) => {
        await update()
        formState.status = 'idle'
      }
    }}
  >
    <div>
      <label for="email" class="block text-xs font-semibold text-slate-600 mb-1">E-Mail-Adresse</label>
      <input
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        required
        bind:value={formState.email}
        class="w-full px-4 py-3 rounded-xl text-sm border border-slate-300 text-[#0f2744] focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    <!-- honeypot: invisible to people and screen readers, filled by bots -->
    <div aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label for="website">Bitte leer lassen</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <label class="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" name="consent" bind:checked={formState.consent} required class="mt-1 w-4 h-4 accent-orange-500" />
      <span class="text-xs text-slate-500 leading-relaxed">
        {LAUNCH_CONSENT_TEXT} Details in der <a href={PRIVACY_URL} class="underline hover:text-[#0f2744]">Datenschutzerklärung</a>.
      </span>
    </label>

    {#if message}
      <p role="alert" class="text-sm text-red-600">{message}</p>
    {/if}

    <button
      type="submit"
      disabled={formState.status === 'submitting'}
      class="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-150 enabled:hover:shadow-xl enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style="background: #f97316;"
    >
      {formState.status === 'submitting' ? 'Wird eingetragen …' : 'Benachrichtigen'}
    </button>
  </form>

  <p class="mt-6 text-sm text-slate-500">
    Schon ein Konto? <a href={resolve('/(auth)/login')} class="font-semibold underline" style="color: #0f2744;">Anmelden</a>
  </p>
{/if}
```

- [ ] **Step 5: Wire the page** — `src/routes/(auth)/registrieren/+page.svelte`:
  - `let { data, form } = $props()`
  - `<svelte:head><title>{data.mode === 'open' ? 'Registrieren' : LAUNCH_HEADING} – gefahrgut.org</title></svelte:head>`
  - wrap the existing markup: `{#if data.mode === 'open'} …existing sent/register markup… {:else} <LaunchNotifyForm {form} /> {/if}`
  - in the existing consent checkbox replace the hard-coded privacy URL with `{PRIVACY_URL}` from `$lib/legal`.

- [ ] **Step 6: Login copy** — `src/routes/(auth)/login/+page.svelte` line with "Noch kein Konto?": the link text becomes `{data.registrationOpen ? 'Registrieren' : 'Zum Launch benachrichtigen'}` (`data.registrationOpen` comes from the root layout).

- [ ] **Step 7: Run — expect PASS**; Svelte MCP autofixer on `LaunchNotifyForm.svelte`, `registrieren/+page.svelte`, `login/+page.svelte`, `authForm.svelte.ts`; then `pnpm test`, `pnpm check`. Leave uncommitted.

---

### Task 5: Landing page copy follows the mode

**Files:**
- Modify: `src/routes/+page.svelte`, `src/lib/landing/Navbar.svelte`, `src/lib/landing/Cta.svelte`, `src/lib/landing/Footer.svelte`
- Test: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: `data.registrationOpen` (Task 1), `signupCtaLabel()` (Task 4), `PRIVACY_URL`, `IMPRINT_URL`, `BLOG_URL` (Task 4).
- Produces: `Navbar`, `Cta`, `Footer` take a `registrationOpen: boolean` prop.

- [ ] **Step 1: Failing tests** — in `tests/landing-page.test.ts` change `const PROPS = {}` to `const PROPS = { data: { registrationOpen: true } as never }` (existing tests become the open-mode tests), change the meta assertion to `toContain('Jetzt registrieren')` under that PROPS, and add:

```ts
describe('landing page — waitlist mode', () => {
  const WAITLIST = { data: { registrationOpen: false } as never }

  it('labels every sign-up call to action "Zum Launch benachrichtigen" and keeps Anmelden', () => {
    const { container } = render(LandingPage, { props: WAITLIST })
    const signup = Array.from(container.querySelectorAll('a[href="/registrieren"]'))
    expect(signup.length).toBeGreaterThanOrEqual(3)
    for (const link of signup) expect(link).toHaveTextContent('Zum Launch benachrichtigen')
    expect(container).not.toHaveTextContent('Jetzt registrieren')
    expect(container.querySelector('header a[href="/login"]')).toHaveTextContent('Anmelden')
  })

  it('uses the waitlist wording in the meta description', () => {
    render(LandingPage, { props: WAITLIST })
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Zum Launch benachrichtigen')
  })

  it('treats missing layout data as waitlist (fail-closed)', () => {
    const { container } = render(LandingPage, { props: {} })
    expect(container).not.toHaveTextContent('Jetzt registrieren')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** Run: `pnpm test tests/landing-page.test.ts`

- [ ] **Step 3: Implement**
  - `src/routes/+page.svelte`: `let { data } = $props()`; `const registrationOpen = $derived(data?.registrationOpen === true)`; `const description = $derived(`ADR, RID, IMDG und ICAO in einer Plattform: 16.730 Einträge der BAM-GEFAHRGUT-Datenbank, multimodaler Regelwerksvergleich, Sondervorschriften im Volltext und Werkzeuge wie der 1000-Punkte-Rechner. ${signupCtaLabel(registrationOpen)}.`)`; pass `{registrationOpen}` to `<Navbar>`, `<Cta>`, `<Footer>`.
  - `Navbar.svelte`: `let { registrationOpen = false }: { registrationOpen?: boolean } = $props()`; CTA text `{signupCtaLabel(registrationOpen)}`; blog link `href={BLOG_URL}`.
  - `Cta.svelte`: same prop; button text `{signupCtaLabel(registrationOpen)}`; paragraph: open → the existing sentence, waitlist → `Die Plattform ist im Aufbau. Trag dich ein und erfahre zuerst, wenn es losgeht.`
  - `Footer.svelte`: same prop; build `linkColumns` with `$derived` so the "Registrieren" label is `registrationOpen ? 'Registrieren' : 'Zum Launch benachrichtigen'`; Impressum/Datenschutz/Blog hrefs from `$lib/legal`.

- [ ] **Step 4: Run — expect PASS**; autofixer on the four `.svelte` files; `pnpm test`; `pnpm check`. Leave uncommitted.

---

### Task 6: Health check and container

**Files:**
- Create: `src/routes/healthz/+server.ts`, `Dockerfile`, `.dockerignore`, `deploy/compose.yaml`, `deploy/app.env.example`
- Test: `tests/healthz.test.ts`, `tests/deploy-files.test.ts`

**Interfaces:**
- Produces: `GET /healthz` → `200`, `text/plain`, body `ok`. Image `gefahrgut-app:<tag>` listening on 3000. Compose reads `IMAGE_TAG` from `/opt/gefahrgut/.env`.

- [ ] **Step 1: Failing tests**

`tests/healthz.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { GET } from '../src/routes/healthz/+server'

describe('GET /healthz', () => {
  it('answers ok without touching Supabase or the book', async () => {
    const locals = new Proxy({}, { get: () => { throw new Error('locals must not be used') } })
    const res = await GET({ locals } as never)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toBe('ok')
  })
})
```

`tests/deploy-files.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('Dockerfile', () => {
  const file = read('Dockerfile')
  const runtime = file.slice(file.lastIndexOf('FROM '))

  it('runs the app as the unprivileged node user', () => {
    expect(runtime).toMatch(/^USER node$/m)
    expect(runtime).toContain('CMD ["node", "build"]')
  })

  it('never copies the book or env files into an image', () => {
    expect(file).not.toMatch(/csvbase/)
    expect(file).not.toMatch(/COPY[^\n]*\.env/)
  })

  it('takes the public Supabase values as build args only', () => {
    expect(file).toContain('ARG PUBLIC_SUPABASE_URL')
    expect(file).toContain('ARG PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    expect(file).not.toMatch(/SERVICE_ROLE/)
  })
})

describe('.dockerignore', () => {
  const lines = read('.dockerignore').split('\n').map(l => l.trim())
  it.each(['csvbase', '.env', '.env.*', 'node_modules', '.git', '.superpowers'])('excludes %s', (entry) => {
    expect(lines).toContain(entry)
  })
})

describe('deploy/compose.yaml', () => {
  const compose = read('deploy/compose.yaml')

  it('publishes the app on the loopback interface only', () => {
    expect(compose).toContain('"127.0.0.1:3000:3000"')
    expect(compose).not.toMatch(/-\s*"?3000:3000/)
  })

  it('mounts the book read-only and refuses to invent a missing file', () => {
    expect(compose).toContain('source: /var/lib/gefahrgut/ADR2025-konsolidiert.md')
    expect(compose).toContain('target: /data/adr.md')
    expect(compose).toContain('read_only: true')
    expect(compose).toContain('create_host_path: false')
  })

  it('keeps secrets in the server env file', () => {
    expect(compose).toContain('/etc/gefahrgut/app.env')
    expect(compose).not.toMatch(/SUPABASE|KEY=/)
  })

  it('limits memory and log growth and restarts on failure', () => {
    expect(compose).toContain('mem_limit: 512m')
    expect(compose).toContain('max-size: "10m"')
    expect(compose).toContain('restart: unless-stopped')
  })
})

describe('deploy/app.env.example', () => {
  const env = read('deploy/app.env.example')
  it('defaults to the waitlist and trusts exactly one proxy hop', () => {
    expect(env).toMatch(/^REGISTRATION_MODE=waitlist$/m)
    expect(env).toMatch(/^ADDRESS_HEADER=X-Forwarded-For$/m)
    expect(env).toMatch(/^XFF_DEPTH=1$/m)
    expect(env).toMatch(/^ORIGIN=https:\/\/neu\.gefahrgut\.org$/m)
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** Run: `pnpm test tests/healthz.test.ts tests/deploy-files.test.ts`

- [ ] **Step 3: Implement the route** — `src/routes/healthz/+server.ts`

```ts
import type { RequestHandler } from './$types'

/** Liveness probe for Docker and the deploy script. Touches neither Supabase nor the book. */
export const GET: RequestHandler = () =>
  new Response('ok', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
```

- [ ] **Step 4: `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1

# ── 1. build: install everything, build the app ─────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# $env/static/public values are baked into the bundle at build time.
# Both are public by design (the browser receives them anyway).
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL \
    PUBLIC_SUPABASE_PUBLISHABLE_KEY=$PUBLIC_SUPABASE_PUBLISHABLE_KEY
RUN pnpm build

# ── 2. deps: production dependencies only ───────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# ── 3. runtime: just the built app ──────────────────────────────────
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "build"]
```

- [ ] **Step 5: `.dockerignore`**

```
node_modules
.svelte-kit
build
.env
.env.*
!.env.example
.deploy.env
csvbase
tests
docs
.superpowers
.git
```

- [ ] **Step 6: `deploy/compose.yaml`**

```yaml
# Copied to /opt/gefahrgut/compose.yaml on the server.
# IMAGE_TAG comes from /opt/gefahrgut/.env, written by scripts/deploy.sh.
services:
  app:
    image: gefahrgut-app:${IMAGE_TAG:?IMAGE_TAG is set by scripts/deploy.sh}
    restart: unless-stopped
    # Loopback only: nginx on the same host is the one way in. Docker publishes
    # ports around the ufw firewall, so "3000:3000" would expose the app to the internet.
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - /etc/gefahrgut/app.env
    environment:
      ADR_BOOK_PATH: /data/adr.md
    volumes:
      - type: bind
        source: /var/lib/gefahrgut/ADR2025-konsolidiert.md
        target: /data/adr.md
        read_only: true
        bind:
          # fail loudly if the book was not copied yet, instead of creating an empty directory
          create_host_path: false
    mem_limit: 512m
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

- [ ] **Step 7: `deploy/app.env.example`**

```
# Template for /etc/gefahrgut/app.env on the server (chmod 600, owned by root).
# Never commit the real file.

# Public URL of this deployment. SvelteKit rejects form POSTs from any other origin.
ORIGIN=https://neu.gefahrgut.org
PORT=3000

# nginx appends the real client address as the right-most X-Forwarded-For hop.
ADDRESS_HEADER=X-Forwarded-For
XFF_DEPTH=1

# 'open' = normal sign-up. Anything else = launch-notification list.
REGISTRATION_MODE=waitlist
```

- [ ] **Step 8: Run — expect PASS**; `pnpm test`.

- [ ] **Step 9: Local image check** (Docker Desktop is available in this WSL):

```bash
docker build \
  --build-arg PUBLIC_SUPABASE_URL="$(grep -E '^PUBLIC_SUPABASE_URL=' .env | cut -d= -f2-)" \
  --build-arg PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(grep -E '^PUBLIC_SUPABASE_PUBLISHABLE_KEY=' .env | cut -d= -f2-)" \
  -t gefahrgut-app:local .
docker run -d --rm --name gg-local -p 127.0.0.1:3300:3000 \
  -e ORIGIN=http://localhost:3300 -e REGISTRATION_MODE=waitlist \
  -e ADR_BOOK_PATH=/data/adr.md -v "$PWD/csvbase/ADR2025-konsolidiert.md:/data/adr.md:ro" \
  gefahrgut-app:local
sleep 3; curl -s localhost:3300/healthz; echo; curl -s -o /dev/null -w '%{http_code}\n' localhost:3300/
docker exec gg-local id -un   # expect: node
docker stop gg-local
```

Expected: `ok`, `200`, `node`. Record the image size (`docker image ls gefahrgut-app:local`). Leave uncommitted.

---

### Task 7: Deploy script

**Files:**
- Create: `scripts/deploy.sh` (executable), `.deploy.env.example`
- Modify: `package.json` (scripts), `.gitignore` (`.deploy.env`)
- Test: `tests/deploy-script.test.ts`

**Interfaces:**
- Consumes: image from Task 6; `/opt/gefahrgut/compose.yaml` on the server.
- Produces: `pnpm deploy:test`, `pnpm deploy:rollback`; server files `/opt/gefahrgut/.env` (`IMAGE_TAG=…`) and `/opt/gefahrgut/.previous-tag`.

- [ ] **Step 1: Failing test** — `tests/deploy-script.test.ts`

```ts
// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const script = readFileSync('scripts/deploy.sh', 'utf8')

describe('scripts/deploy.sh', () => {
  it('is valid bash and executable', () => {
    execFileSync('bash', ['-n', 'scripts/deploy.sh'])
    expect(statSync('scripts/deploy.sh').mode & 0o111).not.toBe(0)
  })

  it('stops on the first error', () => {
    expect(script).toMatch(/^set -euo pipefail$/m)
  })

  it('health-checks and rolls back automatically', () => {
    expect(script).toContain('http://127.0.0.1:3000/healthz')
    expect(script).toContain('.previous-tag')
    expect(script).toMatch(/rolled back/)
  })

  it('never ships secrets: only the two public values become build args', () => {
    const buildArgs = script.match(/--build-arg [A-Z_]+/g) ?? []
    expect(buildArgs.map(a => a.replace('--build-arg ', '')).sort()).toEqual(['PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'PUBLIC_SUPABASE_URL'])
    expect(script).not.toMatch(/SERVICE_ROLE/)
  })

  it('is wired into package.json and .deploy.env is gitignored', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.scripts['deploy:test']).toBe('bash scripts/deploy.sh deploy')
    expect(pkg.scripts['deploy:rollback']).toBe('bash scripts/deploy.sh rollback')
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\.deploy\.env$/m)
  })
})
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: `scripts/deploy.sh`** (then `chmod +x scripts/deploy.sh`)

```bash
#!/usr/bin/env bash
# Build the app image here, ship it to the VPS over SSH, switch the container,
# verify /healthz, and roll back automatically if the new version is unhealthy.
#
#   pnpm deploy:test       build + ship + switch
#   pnpm deploy:rollback   switch back to the previous image
#
# Needs .deploy.env (see .deploy.env.example) and the public Supabase values in .env.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .deploy.env ] || { echo "Missing .deploy.env — copy .deploy.env.example and fill it in." >&2; exit 1; }
# shellcheck disable=SC1091
source .deploy.env
: "${DEPLOY_HOST:?set DEPLOY_HOST in .deploy.env}"
: "${DEPLOY_USER:?set DEPLOY_USER in .deploy.env}"
REMOTE="$DEPLOY_USER@$DEPLOY_HOST"
APP_DIR=/opt/gefahrgut

env_value() { grep -E "^$1=" .env | tail -n 1 | cut -d= -f2-; }

# Runs on the server: point compose at $1, wait for /healthz, fall back to $2 on failure.
REMOTE_SWITCH='
set -euo pipefail
cd '"$APP_DIR"'
NEW="$1"; FALLBACK="${2:-}"
echo "IMAGE_TAG=$NEW" > .env
docker compose up -d
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/healthz >/dev/null 2>&1; then
    echo "healthy: $NEW"
    exit 0
  fi
  sleep 1
done
echo "UNHEALTHY: $NEW — last log lines:" >&2
docker compose logs --tail 60 app >&2 || true
if [ -n "$FALLBACK" ]; then
  echo "IMAGE_TAG=$FALLBACK" > .env
  docker compose up -d
  echo "rolled back to $FALLBACK" >&2
fi
exit 1
'

deploy() {
  local sha tag current
  sha="$(git rev-parse --short HEAD)"
  tag="$(date +%Y%m%d-%H%M)-$sha"
  echo "Shipping commit $sha as gefahrgut-app:$tag"
  echo "Uncommitted changes that ship too:"; git status --short || true

  docker build \
    --build-arg PUBLIC_SUPABASE_URL="$(env_value PUBLIC_SUPABASE_URL)" \
    --build-arg PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(env_value PUBLIC_SUPABASE_PUBLISHABLE_KEY)" \
    -t "gefahrgut-app:$tag" .

  echo "Uploading image (this takes a moment)…"
  docker save "gefahrgut-app:$tag" | gzip | ssh "$REMOTE" 'gunzip | docker load'

  current="$(ssh "$REMOTE" "grep -s '^IMAGE_TAG=' $APP_DIR/.env | cut -d= -f2" || true)"
  [ -n "$current" ] && ssh "$REMOTE" "echo '$current' > $APP_DIR/.previous-tag"

  ssh "$REMOTE" "bash -s -- '$tag' '$current'" <<<"$REMOTE_SWITCH"

  # keep the newest three images (tags start with a timestamp, so they sort by age)
  ssh "$REMOTE" "docker image ls gefahrgut-app --format '{{.Tag}}' | sort -r | tail -n +4 | xargs -r -I{} docker image rm gefahrgut-app:{}" || true
}

rollback() {
  local previous current
  previous="$(ssh "$REMOTE" "cat $APP_DIR/.previous-tag 2>/dev/null" || true)"
  [ -n "$previous" ] || { echo "No previous image recorded — nothing to roll back to." >&2; exit 1; }
  current="$(ssh "$REMOTE" "grep -s '^IMAGE_TAG=' $APP_DIR/.env | cut -d= -f2" || true)"
  echo "Rolling back from $current to $previous"
  ssh "$REMOTE" "bash -s -- '$previous' ''" <<<"$REMOTE_SWITCH"
  ssh "$REMOTE" "echo '$current' > $APP_DIR/.previous-tag"
}

case "${1:-}" in
  deploy) deploy ;;
  rollback) rollback ;;
  *) echo "usage: $0 deploy|rollback" >&2; exit 2 ;;
esac
```

- [ ] **Step 4: `.deploy.env.example`**

```
# Copy to .deploy.env (gitignored). Used by scripts/deploy.sh.
DEPLOY_HOST=neu.gefahrgut.org
DEPLOY_USER=deploy
```

- [ ] **Step 5: `package.json`** — add to `scripts`:
`"deploy:test": "bash scripts/deploy.sh deploy"`, `"deploy:rollback": "bash scripts/deploy.sh rollback"`.
**`.gitignore`** — add a line `.deploy.env`.

- [ ] **Step 6: Run — expect PASS**; `pnpm test`. Leave uncommitted.

---

### Task 8: nginx configs and the server runbook

**Files:**
- Create: `deploy/nginx/bootstrap-http.conf`, `deploy/nginx/gefahrgut.conf`, `docs/deploy/README.md`, `docs/deploy/concepts.md`
- Test: `tests/deploy-files.test.ts` (extend)

**Interfaces:**
- Consumes: app on `127.0.0.1:3000` (Task 6), deploy script (Task 7).

- [ ] **Step 1: Failing tests** — append to `tests/deploy-files.test.ts`:

```ts
describe('nginx', () => {
  const bootstrap = read('deploy/nginx/bootstrap-http.conf')
  const site = read('deploy/nginx/gefahrgut.conf')

  it('bootstrap serves only the ACME challenge on port 80', () => {
    expect(bootstrap).toMatch(/listen 80;/)
    expect(bootstrap).toContain('location /.well-known/acme-challenge/')
    expect(bootstrap).toContain('root /var/www/certbot;')
    expect(bootstrap).not.toMatch(/listen 443/)
  })

  it('redirects plain HTTP to HTTPS but keeps the ACME path reachable for renewals', () => {
    expect(site).toContain('location /.well-known/acme-challenge/')
    expect(site).toMatch(/return 301 https:\/\/\$host\$request_uri;/)
  })

  it('terminates TLS with the certbot certificate', () => {
    expect(site).toMatch(/listen 443 ssl;/)
    expect(site).toContain('/etc/letsencrypt/live/neu.gefahrgut.org/fullchain.pem')
    expect(site).toContain('/etc/letsencrypt/live/neu.gefahrgut.org/privkey.pem')
    expect(site).toMatch(/ssl_protocols TLSv1\.2 TLSv1\.3;/)
  })

  it('proxies to the loopback app with the headers adapter-node relies on', () => {
    expect(site).toContain('proxy_pass http://127.0.0.1:3000;')
    expect(site).toContain('proxy_set_header Host $host;')
    expect(site).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;')
    expect(site).toContain('proxy_set_header X-Forwarded-Proto $scheme;')
  })

  it('keeps the test site out of search engines', () => {
    expect(site).toContain('add_header X-Robots-Tag "noindex, nofollow" always;')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: `deploy/nginx/bootstrap-http.conf`** — the site used **once**, before a certificate exists (the full config references certificate files that do not exist yet, so `nginx -t` would fail):

```nginx
# Phase A bootstrap: only port 80, only so certbot can prove we own the name.
# Replace with gefahrgut.conf once the certificate exists (docs/deploy/README.md step 7).
server {
    listen 80;                      # plain HTTP, IPv4
    listen [::]:80;                 # plain HTTP, IPv6
    server_name neu.gefahrgut.org;  # answer only for this name

    # Let's Encrypt fetches http://neu.gefahrgut.org/.well-known/acme-challenge/<token>;
    # certbot writes that token file into this directory.
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 404;                 # nothing else yet
    }
}
```

- [ ] **Step 4: `deploy/nginx/gefahrgut.conf`**

```nginx
# Phase A: test site neu.gefahrgut.org → app container on 127.0.0.1:3000.
# Every directive is explained in docs/deploy/concepts.md.

# ── Port 80: plain HTTP ──────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name neu.gefahrgut.org;

    # certificate renewals (every ~60 days) come in over plain HTTP too
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # everything else: "use HTTPS instead", permanently
    location / {
        return 301 https://$host$request_uri;
    }
}

# ── Port 443: HTTPS ──────────────────────────────────────────────────
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name neu.gefahrgut.org;

    # issued by certbot; renewed automatically
    ssl_certificate     /etc/letsencrypt/live/neu.gefahrgut.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neu.gefahrgut.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;          # no outdated protocol versions
    ssl_session_cache shared:SSL:10m;       # faster repeat connections
    ssl_session_timeout 1d;

    # test site: keep it out of search engines (removed on the apex in Phase C)
    add_header X-Robots-Tag "noindex, nofollow" always;

    client_max_body_size 1m;                # forms only, no uploads

    location / {
        proxy_pass http://127.0.0.1:3000;   # the app container, loopback only
        proxy_http_version 1.1;
        proxy_set_header Host $host;                                   # the name the browser asked for
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # real client IP (rate limits)
        proxy_set_header X-Forwarded-Proto $scheme;                    # "https"
        proxy_read_timeout 30s;
    }
}
```

- [ ] **Step 5: Run — expect PASS.**

- [ ] **Step 6: `docs/deploy/README.md`** — the Phase A runbook. Write it with exactly these numbered sections and commands (prose in plain German-friendly English, each step says *what it does* and *how to check it worked*):

  1. **Book the VPS** — Ubuntu 24.04, ≥ 2 GB RAM, Germany; note IPv4/IPv6.
  2. **DNS at Strato** — `A neu → <IPv4>`, `AAAA neu → <IPv6>`; check: `dig +short neu.gefahrgut.org` shows the IP. Warn: do **not** touch MX or the apex yet.
  3. **First login + user** — `ssh root@<ip>`; `adduser deploy`; `usermod -aG sudo deploy`; copy your key (`ssh-copy-id deploy@<ip>` from your machine); check `ssh deploy@<ip>` works **before** the next step.
  4. **Lock SSH** — in `/etc/ssh/sshd_config.d/10-hardening.conf`: `PasswordAuthentication no`, `PermitRootLogin no`; `sudo systemctl reload ssh`; check from a **second** terminal that login still works.
  5. **Firewall + updates** — `sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable`; `sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades`.
  6. **Docker** — Docker's apt repository for Ubuntu (commands from docs.docker.com "Install Docker Engine on Ubuntu"), `sudo usermod -aG docker deploy`, re-login; check `docker run --rm hello-world`.
  7. **nginx + certificate** — `sudo apt install nginx certbot`; `sudo mkdir -p /var/www/certbot`; copy `deploy/nginx/bootstrap-http.conf` to `/etc/nginx/sites-available/gefahrgut`, `sudo ln -s /etc/nginx/sites-available/gefahrgut /etc/nginx/sites-enabled/`, `sudo rm /etc/nginx/sites-enabled/default`, `sudo nginx -t && sudo systemctl reload nginx`; then
     `sudo certbot certonly --webroot -w /var/www/certbot -d neu.gefahrgut.org --deploy-hook "systemctl reload nginx"`;
     then replace the site file with `deploy/nginx/gefahrgut.conf`, `sudo nginx -t && sudo systemctl reload nginx`;
     check: `sudo certbot renew --dry-run` succeeds and `curl -I https://neu.gefahrgut.org` shows a valid certificate (a 502 is expected until step 9).
  8. **App files** — `sudo mkdir -p /opt/gefahrgut /etc/gefahrgut /var/lib/gefahrgut && sudo chown deploy /opt/gefahrgut`; `scp deploy/compose.yaml deploy@<host>:/opt/gefahrgut/compose.yaml`; `scp csvbase/ADR2025-konsolidiert.md deploy@<host>:/tmp/` then `sudo mv /tmp/ADR2025-konsolidiert.md /var/lib/gefahrgut/`; create `/etc/gefahrgut/app.env` from `deploy/app.env.example` (`sudo chmod 600`, owner root).
  9. **First deploy** — on your machine: `cp .deploy.env.example .deploy.env`, set `DEPLOY_HOST`/`DEPLOY_USER`; `pnpm deploy:test`; check `https://neu.gefahrgut.org/healthz` shows `ok`.
  10. **Supabase** — Authentication → URL Configuration: add `https://neu.gefahrgut.org/**`; Authentication → Sign In / Providers: disable "Allow new users to sign up"; create test users (Authentication → Users → Add user, tick "Auto Confirm User"), then set `activated_at` in `profiles`.
  11. **Acceptance** — log in as a test user; `/un/1090` shows data; `/regelwerk/adr?sv=243` opens; `/registrieren` shows the notification form and an entry appears in `launch_signups`.
  12. **Everyday** — deploy: `pnpm deploy:test`; roll back: `pnpm deploy:rollback`; logs: `ssh deploy@<host> 'cd /opt/gefahrgut && docker compose logs -f --tail 100'`; switch registration on at go-live: edit `/etc/gefahrgut/app.env` → `REGISTRATION_MODE=open`, then `docker compose up -d` in `/opt/gefahrgut`.

- [ ] **Step 7: `docs/deploy/concepts.md`** — the learning page, sections: *DNS (A/AAAA/MX, TTL)*, *What a certificate proves and how Let's Encrypt checks it (HTTP-01)*, *Why certificates expire and how renewal runs (certbot timer + deploy hook)*, *Reverse proxy: what nginx does for us*, *Walkthrough of `gefahrgut.conf` line by line*, *Docker port binding vs ufw (why 127.0.0.1)*, *Where secrets live and why*, *How a deploy and a rollback work*. Plain language; every term defined the first time it appears.

- [ ] **Step 8: Run** `pnpm test`. Leave uncommitted.

---

### Task 9: Project docs and full verification

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-09-29-prelaunch-deployment-design.md` (Status line)

- [ ] **Step 1: `CLAUDE.md`** —
  - Tech Stack **Hosting** line: `Netcup VPS: app in Docker (compose, 127.0.0.1:3000) behind nginx + certbot on the host — see docs/deploy/`.
  - Commands: `pnpm deploy:test`, `pnpm deploy:rollback`.
  - Environment variables table: `REGISTRATION_MODE` (`$env/dynamic/private`, fail-closed, only `open` opens sign-up); `.deploy.env` (`DEPLOY_HOST`, `DEPLOY_USER`, gitignored).
  - Project Structure: `src/lib/prelaunch/`, `src/lib/legal.ts`, `src/lib/server/registrationMode.ts`, `src/routes/healthz/`, `deploy/`, `docs/deploy/`, `scripts/deploy.sh`, migration `20260929120000_launch_signups`.
  - Key Notes: pre-launch mode (what changes, how to switch), the launch list (insert-only function, no reads, direct-call limit, DOI still owed), legal URLs only in `src/lib/legal.ts`.
  - "Where we left off": Phase A status and the go-live blockers from spec §8.
- [ ] **Step 2: Spec Status** → `implemented (Phase A code); Phase B/C gated on the owner`.
- [ ] **Step 3: Full gate** — `pnpm test` (record the total), `pnpm check` (0 errors), `pnpm build`, and repeat Task 6 Step 9 (local container). All must pass; record numbers. Leave uncommitted.

---

### Task 10: Legal links to `blog.gefahrgut.org` — **GATED: Phase B, only after the owner confirms the blog runs there with Impressum and Datenschutz online**

**Files:**
- Modify: `src/lib/legal.ts`
- Test: `tests/legal-links.test.ts`, adjust URL expectations in `tests/auth-pages.test.ts`, `tests/landing-page.test.ts`

- [ ] **Step 1: Failing test** — `tests/legal-links.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { BLOG_URL, IMPRINT_URL, PRIVACY_URL } from '$lib/legal'

describe('legal links (Phase B)', () => {
  it('point at the blog subdomain', () => {
    expect(PRIVACY_URL).toBe('https://blog.gefahrgut.org/datenschutzerklaerung/')
    expect(IMPRINT_URL).toBe('https://blog.gefahrgut.org/impressum/')
    expect(BLOG_URL).toBe('https://blog.gefahrgut.org/')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** — change the three constants in `src/lib/legal.ts`; update the two page tests' expected hrefs to the new URLs.
- [ ] **Step 4: Verify the pages exist:** `curl -sL https://blog.gefahrgut.org/impressum/ | grep -ci "under construction"` → `0`; same for `/datenschutzerklaerung/`.
- [ ] **Step 5: Run** `pnpm test`; deploy with `pnpm deploy:test`. Leave uncommitted.

---

### Task 11: Apex switch — legacy redirects + nginx — **GATED: Phase C, only after Task 10 and the owner's go**

**Files:**
- Create: `scripts/fetch-legacy-paths.ts`, `src/lib/server/legacyRedirects.ts` (generated), `deploy/nginx/gefahrgut-apex.conf`
- Modify: `src/hooks.server.ts`, `deploy/app.env.example` (`ORIGIN=https://gefahrgut.org`)
- Test: `tests/legacy-redirects.test.ts`, `tests/deploy-files.test.ts`

**Interfaces:**
- Produces: `export const LEGACY_PATHS: ReadonlySet<string>`; `export function legacyRedirectTarget(pathname: string, search: string): string | null`.

- [ ] **Step 1: Generator** — `scripts/fetch-legacy-paths.ts` (run with `pnpm exec tsx scripts/fetch-legacy-paths.ts`, **while WordPress still answers on the apex or already on blog.**):

```ts
// Reads the WordPress sitemap and writes src/lib/server/legacyRedirects.ts.
import { writeFileSync } from 'node:fs'

const ORIGIN = process.argv[2] ?? 'https://blog.gefahrgut.org'
const INDEX = `${ORIGIN}/wp-sitemap.xml`

async function locs(url: string): Promise<string[]> {
  const xml = await (await fetch(url)).text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!.trim())
}

const sitemaps = await locs(INDEX)
const pages = (await Promise.all(sitemaps.map(locs))).flat()
const paths = [...new Set(pages.map(u => new URL(u).pathname))]
  .filter(p => p !== '/')
  .sort()

writeFileSync('src/lib/server/legacyRedirects.ts', `// GENERATED by scripts/fetch-legacy-paths.ts from ${INDEX} — do not edit by hand.
// WordPress URLs that moved to blog.gefahrgut.org (spec 2026-09-29 §6, Phase C).
export const LEGACY_PATHS: ReadonlySet<string> = new Set(${JSON.stringify(paths, null, 2)})

export const BLOG_ORIGIN = 'https://blog.gefahrgut.org'

/** Where a request for an old WordPress path should go, or null if it is not one. */
export function legacyRedirectTarget(pathname: string, search: string): string | null {
  const withSlash = pathname.endsWith('/') ? pathname : \`\${pathname}/\`
  return LEGACY_PATHS.has(withSlash) ? \`\${BLOG_ORIGIN}\${withSlash}\${search}\` : null
}
`)
console.log(`${paths.length} legacy paths written`)
```

Expected output: roughly 219 paths. If WordPress uses a different sitemap (Yoast: `/sitemap_index.xml`), pass that index instead and note it in the ledger.

- [ ] **Step 2: Failing tests** — `tests/legacy-redirects.test.ts`

```ts
// @vitest-environment node
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEGACY_PATHS, legacyRedirectTarget } from '$lib/server/legacyRedirects'

/** First path segment of every route directory, ignoring (groups). */
function appRootSegments(): Set<string> {
  const segments = new Set<string>()
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (!statSync(full).isDirectory()) continue
      if (name.startsWith('(')) walk(full)
      else segments.add(name.replace(/\[.*\]/, '*'))
    }
  }
  walk('src/routes')
  return segments
}

describe('legacy WordPress redirects', () => {
  it('has the blog paths', () => {
    expect(LEGACY_PATHS.size).toBeGreaterThan(100)
    expect(LEGACY_PATHS.has('/')).toBe(false)
  })

  it('never shadows an app route', () => {
    const app = appRootSegments()
    for (const path of LEGACY_PATHS) {
      const first = path.split('/')[1]!
      expect(app.has(first), `${path} collides with an app route`).toBe(false)
    }
  })

  it('sends a listed path (with or without trailing slash) to the blog, keeping the query', () => {
    const [path] = [...LEGACY_PATHS]
    expect(legacyRedirectTarget(path!, '?a=1')).toBe(`https://blog.gefahrgut.org${path}?a=1`)
    expect(legacyRedirectTarget(path!.replace(/\/$/, ''), '')).toBe(`https://blog.gefahrgut.org${path}`)
  })

  it('leaves app paths alone', () => {
    for (const p of ['/', '/login', '/suche', '/un/1203', '/regelwerk/adr', '/healthz']) {
      expect(legacyRedirectTarget(p, '')).toBeNull()
    }
  })
})
```

and in `tests/hooks.test.ts` add a case: a request for a listed path → `handle` throws a `redirect` with status 301 and the blog location, before `safeGetSession` is called.

- [ ] **Step 3: Run — expect FAIL**, then run the generator (Step 1), rerun — only the hooks case should still fail.
- [ ] **Step 4: Hook** — at the top of `handle` in `src/hooks.server.ts`, before creating the Supabase client:

```ts
  const legacy = legacyRedirectTarget(event.url.pathname, event.url.search)
  if (legacy) redirect(301, legacy)
```

- [ ] **Step 5: `deploy/nginx/gefahrgut-apex.conf`** — same structure as `gefahrgut.conf` with: port-80 block for `gefahrgut.org www.gefahrgut.org neu.gefahrgut.org` (ACME + redirect to `https://gefahrgut.org$request_uri`); a 443 block for `www.gefahrgut.org` and `neu.gefahrgut.org` that only `return 301 https://gefahrgut.org$request_uri;`; the main 443 block for `gefahrgut.org` with the certificate `/etc/letsencrypt/live/gefahrgut.org/` and **no** `X-Robots-Tag`. Extend `tests/deploy-files.test.ts`: apex config has no `X-Robots-Tag`, redirects `www` and `neu` with 301, proxies to `127.0.0.1:3000`.
- [ ] **Step 6: Runbook section "Phase C"** in `docs/deploy/README.md`: TTL to 300 s a day before; A/AAAA for `@` and `www` → VPS (**MX untouched**); `sudo certbot certonly --webroot -w /var/www/certbot -d gefahrgut.org -d www.gefahrgut.org -d neu.gefahrgut.org --deploy-hook "systemctl reload nginx"`; swap in `gefahrgut-apex.conf`; `ORIGIN=https://gefahrgut.org` in `/etc/gefahrgut/app.env`; `pnpm deploy:test`; checks with `curl -I` for apex, www, neu and three legacy URLs.
- [ ] **Step 7: Run** `pnpm test`, `pnpm check`. Leave uncommitted.

---

## Self-review notes

- Spec §1 → Tasks 1, 3, 4, 5; §2 → Task 2; §3 → Task 6; §4 → Task 8; §5 → Task 7; §6 Phase A → Task 8 runbook, Phase B → Task 10, Phase C → Task 11; §7 → tests in every task; §8 → Task 9 docs; §9 → Task 9.
- Names used across tasks: `registrationMode()`, `registrationOpen`, `CONSENT_VERSION`, `LAUNCH_CONSENT_TEXT`, `signupCtaLabel()`, `LAUNCH_HEADING`, `LAUNCH_INTRO`, `LAUNCH_THANKS`, `PRIVACY_URL`, `IMPRINT_URL`, `BLOG_URL`, `join_launch_list`, `legacyRedirectTarget()`, `LEGACY_PATHS` — each defined in exactly one task.

## Execution notes

Decisions and findings recorded while this plan was executed (copied from the execution
ledger, which is not in git). `Ruling:` = a decision taken on the owner's behalf, with its cost if wrong.

- Setup: Ruling: no worktree, no commits (owner rule) — cost if wrong: none
- Task 2: Ruling: Steps 5–6 (apply to hosted project + live verification) DEFERRED — needs explicit owner approval (plan + global rule); code/test done — cost if wrong: waitlist RPC fails live until applied
- Task 4: Ruling: added registrationOpen pass-through in src/routes/+layout.ts (universal load rebuilds data; the plan missed it — svelte-check caught it) + new tests/root-layout-universal.test.ts RED→GREEN — cost if wrong: none
- Task 4: Ruling: autofixer "href without resolve()" on {PRIVACY_URL} is a false positive (external absolute URL from src/lib/legal.ts)
- Task 5: Ruling: Navbar/Cta internal links (/login, /registrieren) switched to resolve() — project convention, surfaced by the autofixer once the files got a script block — cost if wrong: none (same hrefs, tests unchanged)
- Task 5: Ruling: remaining autofixer findings kept: BLOG_URL/PRIVACY_URL/IMPRINT_URL are external; Footer's mixed link list and the landing JSON-LD {@html} are pre-existing
- Task 6: Ruling: Step 9 (local docker build + run + healthz) NOT RUN — Docker Desktop WSL integration is off for this distro ('docker' not found); owner must enable it (Settings → Resources → WSL Integration); Dockerfile verified only by static tests — cost if wrong: first real build may fail and need a fix
- Task 7: Ruling: '[ -n "$current" ] && ssh …' written as an if-block — under set -e a false test as a function's last statement leaks a non-zero status — cost if wrong: none
- Final review: self-review (no subagent without owner OK) over Tasks 1–7 — no Critical/Important findings
- Final: minor (deferred): FAQ "Was kostet…" still says "zuerst registrierten Nutzern" — reads oddly in waitlist mode
- Final: minor (deferred): until the migration is applied, submitting the notification form answers with the generic error (RPC missing)
- Task 2: Steps 5–6 done with owner approval (2026-09-29): applied via execute_sql in one transaction + schema_migrations row 20260929120000 'launch_signups' (same method as 2026-09-04; apply_migration would have minted a different version). Live: anon/auth select+insert false, anon exec true, RLS on, 0 policies; '  Probe@Example.DE ' + 'probe@example.de' → 1 row; POST via dev server (anon key) → {notified} twice, 1 row; REST read with publishable key → 401 permission denied. Test rows deleted (0 remaining). Advisors: rls_enabled_no_policy + security_definer_executable (anon/auth) on join_launch_list = intended by design; new unrelated: auth_leaked_password_protection disabled
- Task 6: Step 9 done 2026-09-29 after owner enabled WSL integration: image builds (240 MB), container runs as node, /healthz ok, Docker health 'healthy', book mounted read-only and readable (8,534,589 bytes), no book text inside the image, landing shows 6× waitlist CTA, /regelwerk/adr → 303 login, POST /registrieren validates (400 invalid_email)
