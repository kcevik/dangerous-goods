# Landing Waitlist + SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's pricing section with a GDPR-compliant waitlist backed by a rate-limited Nitro API, and add SEO/AI-SEO content (FAQ, JSON-LD, llms.txt, long-form copy) under the gefahrgut.org brand.

**Architecture:** Browser → `useWaitlist` composable → `POST /api/waitlist` (Nitro, first server route) → validation + in-memory per-IP rate limit → Supabase `waitlist` table via service-role key. The table has RLS enabled with **no policies** — only the server can touch it. SEO structured data is built by pure functions in `app/utils/structuredData.ts` so it can be unit-tested; FAQ content lives in `app/utils/landingFaq.ts` shared by the visible FAQ component and the FAQPage JSON-LD.

**Tech Stack:** Nuxt 4 (Nitro server routes), `@supabase/supabase-js` (service role, server-only), Tailwind v4, vitest (+ nuxt environment from `@nuxt/test-utils`).

## Global Constraints

- **NEVER run git commands.** No staging, no commits — the user handles all version control. Where a normal plan would say "commit", simply stop.
- Spec: `docs/superpowers/specs/2026-07-28-landing-waitlist-seo-design.md`
- Brand name everywhere: **gefahrgut.org** (never "GefahrgutProfi"). Canonical URL: `https://gefahrgut.org`
- All UI copy is German. Variable/field names are English (project convention).
- Colors: navy `#0f2744`, orange `#f97316`, light bg `#e8eef5` — match existing sections.
- Test command: `pnpm test` (vitest). Nuxt-environment test files start with `// @vitest-environment nuxt`.
- Supabase project id (for MCP `apply_migration`): `nmigeqhrquzmdxjeuite`
- Rate limit: 5 requests per IP per hour. Free-tier copy: "5 Suchanfragen pro Monat kostenlos".
- Dev server may already be running on `localhost:3000`; do not kill it.

---

### Task 1: `waitlist` table migration

**Files:**
- Create: `supabase/migrations/20260728130000_waitlist.sql`

**Interfaces:**
- Produces: table `waitlist(id, name, email UNIQUE, consented_at, created_at)`; RLS enabled, zero policies (service role only).

- [ ] **Step 1: Write the migration file**

```sql
-- Waitlist for launch notifications. RLS is enabled with deliberately NO
-- policies: anon/authenticated clients can neither read nor write. All access
-- goes through the Nitro server route using the service role key.
CREATE TABLE waitlist (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  consented_at TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply to hosted Supabase**

Use the Supabase MCP tool `apply_migration` with `project_id: nmigeqhrquzmdxjeuite`, `name: waitlist`, and the SQL above. Expected: `{"success":true}`.

- [ ] **Step 3: Verify anon cannot access the table**

```bash
URL=$(grep -o 'NUXT_PUBLIC_SUPABASE_URL=.*' .env | cut -d= -f2 | tr -d '"')
KEY=$(grep -o 'NUXT_PUBLIC_SUPABASE_KEY=.*' .env | cut -d= -f2 | tr -d '"')
curl -s -G "$URL/rest/v1/waitlist" -H "apikey: $KEY"
```

Expected: `[]` (RLS filters everything; no rows visible) — and an insert attempt `curl -s -X POST "$URL/rest/v1/waitlist" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"name":"x","email":"x@x.de","consented_at":"2026-01-01T00:00:00Z"}'` returns a `42501` RLS violation error.

---

### Task 2: Waitlist input validation (pure)

**Files:**
- Create: `server/utils/waitlistValidation.ts`
- Test: `tests/waitlistValidation.test.ts`

**Interfaces:**
- Produces: `validateWaitlistInput(body: unknown): ValidationResult` where
  `type ValidationResult = { ok: true; data: { name: string; email: string; honeypot: boolean } } | { ok: false; error: string }`.
  `email` comes back trimmed + lowercased; `honeypot: true` means the hidden `website` field was filled (caller fakes success).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/waitlistValidation.test.ts
import { describe, expect, it } from 'vitest'
import { validateWaitlistInput } from '../server/utils/waitlistValidation'

const VALID = { name: 'Kerem C.', email: 'Ke.Cevik@Example.DE ', consent: true, website: '' }

describe('validateWaitlistInput', () => {
  it('accepts valid input and normalizes the email', () => {
    const r = validateWaitlistInput(VALID)
    expect(r).toEqual({ ok: true, data: { name: 'Kerem C.', email: 'ke.cevik@example.de', honeypot: false } })
  })

  it('rejects non-object bodies', () => {
    expect(validateWaitlistInput(null).ok).toBe(false)
    expect(validateWaitlistInput('x').ok).toBe(false)
  })

  it('rejects names shorter than 2 or longer than 100 chars', () => {
    expect(validateWaitlistInput({ ...VALID, name: 'K' })).toEqual({ ok: false, error: 'invalid_name' })
    expect(validateWaitlistInput({ ...VALID, name: 'x'.repeat(101) })).toEqual({ ok: false, error: 'invalid_name' })
  })

  it('rejects malformed or overlong emails', () => {
    expect(validateWaitlistInput({ ...VALID, email: 'not-an-email' })).toEqual({ ok: false, error: 'invalid_email' })
    expect(validateWaitlistInput({ ...VALID, email: `${'a'.repeat(250)}@x.de` })).toEqual({ ok: false, error: 'invalid_email' })
  })

  it('requires consent to be exactly true', () => {
    expect(validateWaitlistInput({ ...VALID, consent: false })).toEqual({ ok: false, error: 'consent_required' })
    expect(validateWaitlistInput({ ...VALID, consent: 'yes' })).toEqual({ ok: false, error: 'consent_required' })
  })

  it('flags a filled honeypot without rejecting', () => {
    const r = validateWaitlistInput({ ...VALID, website: 'http://spam.example' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.honeypot).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/waitlistValidation.test.ts`
Expected: FAIL — cannot resolve `../server/utils/waitlistValidation`.

- [ ] **Step 3: Implement**

```ts
// server/utils/waitlistValidation.ts
export type ValidationResult
  = { ok: true, data: { name: string, email: string, honeypot: boolean } }
    | { ok: false, error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateWaitlistInput(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid_body' }
  const b = body as Record<string, unknown>

  const honeypot = typeof b.website === 'string' && b.website.trim() !== ''
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''

  if (name.length < 2 || name.length > 100) return { ok: false, error: 'invalid_name' }
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' }
  if (b.consent !== true) return { ok: false, error: 'consent_required' }

  return { ok: true, data: { name, email, honeypot } }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/waitlistValidation.test.ts` — Expected: all PASS.

---

### Task 3: In-memory rate limiter (pure)

**Files:**
- Create: `server/utils/rateLimit.ts`
- Test: `tests/rateLimit.test.ts`

**Interfaces:**
- Produces: `createRateLimiter(opts: { max: number; windowMs: number }): { check(key: string): boolean }` — `check` records a hit and returns `true` if the key is under the limit inside the sliding window, `false` (without recording) once the limit is reached.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/rateLimit.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRateLimiter } from '../server/utils/rateLimit'

describe('createRateLimiter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('allows up to max hits and blocks the next one', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000 })
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip1')).toBe(false)
  })

  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 })
    expect(limiter.check('ip1')).toBe(true)
    expect(limiter.check('ip2')).toBe(true)
    expect(limiter.check('ip1')).toBe(false)
  })

  it('frees the slot after the window expires (sliding window)', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 1000 })
    limiter.check('ip1')
    vi.advanceTimersByTime(600)
    limiter.check('ip1')
    expect(limiter.check('ip1')).toBe(false)
    vi.advanceTimersByTime(500) // first hit now outside window
    expect(limiter.check('ip1')).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/rateLimit.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
// server/utils/rateLimit.ts
export interface RateLimiter { check: (key: string) => boolean }

export function createRateLimiter(opts: { max: number, windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>()

  return {
    check(key) {
      const now = Date.now()
      const windowStart = now - opts.windowMs
      const recent = (hits.get(key) ?? []).filter(t => t > windowStart)
      if (recent.length >= opts.max) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      hits.set(key, recent)
      return true
    },
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/rateLimit.test.ts` — Expected: all PASS.

---

### Task 4: `POST /api/waitlist` route + runtime config

**Files:**
- Create: `server/api/waitlist.post.ts`
- Modify: `nuxt.config.ts` (add `runtimeConfig`)

**Interfaces:**
- Consumes: `validateWaitlistInput`, `createRateLimiter` (Nitro auto-imports everything in `server/utils/`).
- Produces: `POST /api/waitlist` accepting JSON `{ name, email, consent, website }`.
  Responses: `201 { status: 'ok' }` · `200 { status: 'already_registered' }` · `400` (validation) · `429` (rate limit) · `500` (db error). The composable in Task 5 relies on exactly these.

- [ ] **Step 1: Add runtimeConfig to `nuxt.config.ts`**

Insert after the `css:` line:

```ts
  runtimeConfig: {
    // server-only; same key the import script uses
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
```

- [ ] **Step 2: Implement the route**

```ts
// server/api/waitlist.post.ts
import { createClient } from '@supabase/supabase-js'

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!limiter.check(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const body = await readBody(event).catch(() => null)

  // CAPTCHA: verify Turnstile token here (read token from body, POST to
  // https://challenges.cloudflare.com/turnstile/v0/siteverify with the secret
  // from runtimeConfig) before accepting the submission.

  const result = validateWaitlistInput(body)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.error })
  }

  if (result.data.honeypot) {
    // bot filled the hidden field — pretend success, store nothing
    setResponseStatus(event, 201)
    return { status: 'ok' }
  }

  const config = useRuntimeConfig(event)
  const supabase = createClient(config.public.supabase.url, config.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const { error } = await supabase.from('waitlist').insert({
    name: result.data.name,
    email: result.data.email,
    consented_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '23505') return { status: 'already_registered' }
    throw createError({ statusCode: 500, statusMessage: 'Internal error' })
  }

  setResponseStatus(event, 201)
  return { status: 'ok' }
})
```

- [ ] **Step 3: Manual verify against the dev server**

(Dev server auto-reloads; wait a few seconds after saving.)

```bash
curl -s -X POST localhost:3000/api/waitlist -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"waitlist-test@example.org","consent":true,"website":""}'
```

Expected: `{"status":"ok"}`. Repeat the same command → `{"status":"already_registered"}`.
Missing consent → HTTP 400. Six rapid requests → HTTP 429.
Then delete the test row via Supabase MCP `execute_sql`: `DELETE FROM waitlist WHERE email = 'waitlist-test@example.org';`

- [ ] **Step 4: Run the full suite to confirm nothing broke**

Run: `pnpm test` — Expected: all PASS.

---

### Task 5: `useWaitlist` composable

**Files:**
- Create: `app/composables/useWaitlist.ts`
- Test: `tests/useWaitlist.test.ts`

**Interfaces:**
- Consumes: `POST /api/waitlist` response contract from Task 4.
- Produces: `useWaitlist(): { name: Ref<string>; email: Ref<string>; consent: Ref<boolean>; honeypot: Ref<string>; state: Ref<WaitlistState>; canSubmit: ComputedRef<boolean>; submit(): Promise<void> }` with `type WaitlistState = 'idle' | 'submitting' | 'success' | 'already' | 'rateLimited' | 'error'` (exported).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/useWaitlist.test.ts
// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWaitlist } from '~/composables/useWaitlist'

const fetchMock = vi.fn()

function filled() {
  const w = useWaitlist()
  w.name.value = 'Kerem'
  w.email.value = 'k@example.de'
  w.consent.value = true
  return w
}

describe('useWaitlist', () => {
  beforeEach(() => vi.stubGlobal('$fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('cannot submit without valid name, email and consent', async () => {
    const w = useWaitlist()
    expect(w.canSubmit.value).toBe(false)
    w.name.value = 'Kerem'
    w.email.value = 'not-an-email'
    w.consent.value = true
    expect(w.canSubmit.value).toBe(false)
    await w.submit()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(w.state.value).toBe('idle')
  })

  it('submits and reaches success state', async () => {
    fetchMock.mockResolvedValue({ status: 'ok' })
    const w = filled()
    expect(w.canSubmit.value).toBe(true)
    await w.submit()
    expect(fetchMock).toHaveBeenCalledWith('/api/waitlist', {
      method: 'POST',
      body: { name: 'Kerem', email: 'k@example.de', consent: true, website: '' },
    })
    expect(w.state.value).toBe('success')
  })

  it('maps already_registered', async () => {
    fetchMock.mockResolvedValue({ status: 'already_registered' })
    const w = filled()
    await w.submit()
    expect(w.state.value).toBe('already')
  })

  it('maps 429 to rateLimited', async () => {
    fetchMock.mockRejectedValue({ statusCode: 429 })
    const w = filled()
    await w.submit()
    expect(w.state.value).toBe('rateLimited')
  })

  it('maps other failures to error', async () => {
    fetchMock.mockRejectedValue({ statusCode: 500 })
    const w = filled()
    await w.submit()
    expect(w.state.value).toBe('error')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/useWaitlist.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
// app/composables/useWaitlist.ts
import { computed, ref } from 'vue'

export type WaitlistState = 'idle' | 'submitting' | 'success' | 'already' | 'rateLimited' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function useWaitlist() {
  const name = ref('')
  const email = ref('')
  const consent = ref(false)
  const honeypot = ref('')
  const state = ref<WaitlistState>('idle')

  const canSubmit = computed(() =>
    name.value.trim().length >= 2
    && EMAIL_RE.test(email.value.trim().toLowerCase())
    && consent.value
    && state.value !== 'submitting',
  )

  async function submit(): Promise<void> {
    if (!canSubmit.value) return
    state.value = 'submitting'
    try {
      const res = await $fetch<{ status: string }>('/api/waitlist', {
        method: 'POST',
        body: {
          name: name.value.trim(),
          email: email.value.trim(),
          consent: consent.value,
          website: honeypot.value,
        },
      })
      state.value = res.status === 'already_registered' ? 'already' : 'success'
    }
    catch (err) {
      const status = (err as { statusCode?: number, status?: number })
      state.value = (status.statusCode ?? status.status) === 429 ? 'rateLimited' : 'error'
    }
  }

  return { name, email, consent, honeypot, state, canSubmit, submit }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/useWaitlist.test.ts` — Expected: all PASS.

---

### Task 6: `LandingWaitlist` section component

**Files:**
- Create: `app/components/landing/Waitlist.vue`
- Test: `tests/waitlist-section.test.ts`

**Interfaces:**
- Consumes: `useWaitlist` (auto-imported).
- Produces: `<LandingWaitlist />`, section `id="waitlist"`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/waitlist-section.test.ts
// @vitest-environment nuxt
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Waitlist from '~/components/landing/Waitlist.vue'

const fetchMock = vi.fn()

describe('LandingWaitlist', () => {
  beforeEach(() => vi.stubGlobal('$fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('renders form fields, consent checkbox and the free-tier teaser', () => {
    const wrapper = mount(Waitlist)
    expect(wrapper.find('#waitlist').exists()).toBe(true)
    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
    expect(wrapper.find('input[name="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('5 Suchanfragen pro Monat kostenlos')
  })

  it('keeps the submit button disabled until the form is valid', async () => {
    const wrapper = mount(Waitlist)
    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    await wrapper.find('input[name="name"]').setValue('Kerem')
    await wrapper.find('input[name="email"]').setValue('k@example.de')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('has a visually hidden honeypot field outside the tab order', () => {
    const wrapper = mount(Waitlist)
    const hp = wrapper.find('input[name="website"]')
    expect(hp.exists()).toBe(true)
    expect(hp.attributes('tabindex')).toBe('-1')
    expect(hp.attributes('autocomplete')).toBe('off')
  })

  it('shows the success message instead of the form after submitting', async () => {
    fetchMock.mockResolvedValue({ status: 'ok' })
    const wrapper = mount(Waitlist)
    await wrapper.find('input[name="name"]').setValue('Kerem')
    await wrapper.find('input[name="email"]').setValue('k@example.de')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Du stehst auf der Liste'))
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows the already-registered message', async () => {
    fetchMock.mockResolvedValue({ status: 'already_registered' })
    const wrapper = mount(Waitlist)
    await wrapper.find('input[name="name"]').setValue('Kerem')
    await wrapper.find('input[name="email"]').setValue('k@example.de')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('bereits auf der Warteliste'))
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/waitlist-section.test.ts` — Expected: FAIL (component missing).

- [ ] **Step 3: Implement the component**

```vue
<!-- app/components/landing/Waitlist.vue -->
<template>
  <section id="waitlist" class="py-20 lg:py-28" style="background: #0f2744;" aria-labelledby="waitlist-heading">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-orange-500/30 text-orange-400 bg-orange-500/10">
        Warteliste
      </div>
      <h2 id="waitlist-heading" class="text-3xl sm:text-4xl font-bold text-white mb-4">
        Sei beim Start dabei.
      </h2>
      <p class="text-lg text-slate-300 mb-3">
        gefahrgut.org befindet sich im Aufbau. Trag dich ein und erfahre als Erste:r,
        wenn die Plattform live geht.
      </p>
      <p class="text-sm text-slate-400 mb-10">
        Zum Start gibt es einen kostenlosen Zugang mit 5 Suchanfragen pro Monat kostenlos –
        Preise für den vollen Zugang geben wir zuerst der Warteliste bekannt.
      </p>

      <form v-if="state !== 'success' && state !== 'already'" class="text-left" novalidate @submit.prevent="submit">
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <input
            v-model="name"
            type="text"
            name="name"
            placeholder="Name"
            autocomplete="name"
            required
            class="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
          <input
            v-model="email"
            type="email"
            name="email"
            placeholder="E-Mail-Adresse"
            autocomplete="email"
            required
            class="w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
        </div>

        <!-- honeypot: invisible to humans, tempting for bots -->
        <div class="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
          <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off">
        </div>

        <label class="flex items-start gap-3 mb-6 cursor-pointer">
          <input v-model="consent" type="checkbox" class="mt-1 w-4 h-4 accent-orange-500" required>
          <span class="text-xs text-slate-400 leading-relaxed">
            Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Die Daten
            werden ausschließlich dafür gespeichert und auf Wunsch jederzeit gelöscht.
            Details in der <a href="https://gefahrgut.org/datenschutz" class="underline hover:text-slate-200">Datenschutzerklärung</a>.
          </span>
        </label>

        <button
          type="submit"
          :disabled="!canSubmit"
          class="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white transition-all duration-150 shadow-lg enabled:hover:shadow-xl enabled:active:scale-95 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style="background: #f97316;"
        >
          {{ state === 'submitting' ? 'Wird eingetragen …' : 'Auf die Warteliste' }}
        </button>

        <p v-if="state === 'rateLimited'" class="mt-4 text-sm text-orange-300 text-center">
          Zu viele Versuche – bitte probiere es in einer Stunde erneut.
        </p>
        <p v-else-if="state === 'error'" class="mt-4 text-sm text-orange-300 text-center">
          Das hat leider nicht geklappt. Bitte versuche es später noch einmal.
        </p>
      </form>

      <div v-else class="rounded-2xl border border-white/15 bg-white/5 px-8 py-10">
        <div class="text-4xl mb-4">✓</div>
        <p v-if="state === 'success'" class="text-lg font-semibold text-white mb-2">Du stehst auf der Liste!</p>
        <p v-else class="text-lg font-semibold text-white mb-2">Diese E-Mail-Adresse ist bereits auf der Warteliste.</p>
        <p class="text-sm text-slate-400">Wir melden uns, sobald gefahrgut.org startet.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { name, email, consent, honeypot, state, canSubmit, submit } = useWaitlist()
</script>
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/waitlist-section.test.ts` — Expected: all PASS.

---

### Task 7: Landing restructure — remove Pricing, rewire nav/CTA, rebrand footer

**Files:**
- Delete: `app/components/landing/Pricing.vue`
- Modify: `app/pages/index.vue` (template section order only — head is Task 9)
- Modify: `app/components/landing/Navbar.vue`
- Modify: `app/components/landing/Cta.vue`
- Modify: `app/components/landing/Footer.vue`

**Interfaces:**
- Consumes: `<LandingWaitlist>` (Task 6). `<LandingSeoContent>` and `<LandingFaq>` are added to the template in Task 8 — this task only removes Pricing and inserts Waitlist.

- [ ] **Step 1: Update `index.vue` template**

Replace `<LandingPricing />` so the section block reads:

```html
    <LandingMultimodalDemo />
    <LandingComparison />
    <LandingWaitlist />
    <LandingDataSource />
    <LandingCta />
    <LandingFooter />
```

- [ ] **Step 2: Delete `app/components/landing/Pricing.vue`**

`rm app/components/landing/Pricing.vue`

- [ ] **Step 3: Navbar — rename link, fix dead links, rebrand logo text**

In `app/components/landing/Navbar.vue`:
- Line 21: `href="#pricing"` → `href="#waitlist"`, text `Preise` → `Warteliste`
- Line 22 (Dokumentation, `href="#"`): change to `href="https://gefahrgut.org/blog"` with text `Blog`
- Line 27 (Anmelden): `href="#"` → `href="#waitlist"`
- Line 29 (orange button): `href="#"` → `href="#waitlist"`, button text `Kostenlos starten` → `Warteliste`
- Line 14: replace `<span class="font-bold text-lg" style="color: #0f2744;">Gefahrgut<span style="color: #f97316;">Profi</span></span>` with `<span class="font-bold text-lg" style="color: #0f2744;">gefahrgut<span style="color: #f97316;">.org</span></span>`

- [ ] **Step 4: Cta — point buttons at the waitlist**

In `app/components/landing/Cta.vue`:
- Subline `Kostenlos starten – alle Kernfunktionen...` → `Die Plattform ist im Aufbau. Trag dich in die Warteliste ein und erfahre es zuerst.`
- First button: `href="#"` → `href="#waitlist"`, text `Kostenlos starten` → `Auf die Warteliste`
- Second button: `href="#"` → `href="#demo"`, text stays `Demo ansehen`

- [ ] **Step 5: Footer rebrand**

In `app/components/landing/Footer.vue` line 32: `© 2026 GefahrgutProfi.` → `© 2026 gefahrgut.org.` (BAM attribution sentence stays untouched — license requirement).

- [ ] **Step 6: Verify**

Run: `pnpm test` — Expected: all PASS.
Then `curl -s localhost:3000 | grep -c 'GefahrgutProfi'` — Expected: `0`; and `curl -s localhost:3000 | grep -c 'waitlist'` — Expected: ≥ 3.

---

### Task 8: FAQ data, `LandingFaq`, `LandingSeoContent`

**Files:**
- Create: `app/utils/landingFaq.ts`
- Create: `app/components/landing/Faq.vue`
- Create: `app/components/landing/SeoContent.vue`
- Modify: `app/pages/index.vue` (insert the two sections)

**Interfaces:**
- Produces: `FAQ_ITEMS: { question: string; answer: string }[]` (exported from `app/utils/landingFaq.ts`) — Task 9's FAQPage JSON-LD consumes this same array.

- [ ] **Step 1: Create the FAQ data**

```ts
// app/utils/landingFaq.ts
export interface FaqItem { question: string, answer: string }

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Was ist die 1000-Punkte-Regel im ADR?',
    answer: 'Die 1000-Punkte-Regel (ADR 1.1.3.6) erlaubt Erleichterungen beim Gefahrguttransport auf der Straße: Jeder Beförderungskategorie ist ein Faktor zugeordnet, mit dem die transportierte Menge multipliziert wird. Bleibt die Summe aller Produkte unter 1.000 Punkten, entfallen unter anderem die Pflicht zur orangefarbenen Kennzeichnung, der ADR-Schein des Fahrers und die schriftlichen Weisungen. gefahrgut.org wird einen 1000-Punkte-Rechner enthalten, der die Berechnung automatisch durchführt.',
  },
  {
    question: 'Worin unterscheiden sich ADR, RID, IMDG und ICAO?',
    answer: 'ADR regelt den Gefahrguttransport auf der Straße, RID auf der Schiene, der IMDG-Code auf See und die ICAO Technical Instructions in der Luft. Dieselbe UN-Nummer kann je nach Verkehrsträger unterschiedliche Verpackungsanweisungen, Mengengrenzen und Sondervorschriften haben. gefahrgut.org stellt alle vier Regelwerke nebeneinander dar, sodass Unterschiede auf einen Blick sichtbar werden – als eine der ersten Plattformen überhaupt.',
  },
  {
    question: 'Wann braucht ein Unternehmen einen Gefahrgutbeauftragten?',
    answer: 'Nach der Gefahrgutbeauftragtenverordnung (GbV) muss jedes Unternehmen, das an der Beförderung gefährlicher Güter beteiligt ist – als Absender, Verpacker, Verlader, Befüller oder Beförderer – grundsätzlich einen geschulten Gefahrgutbeauftragten bestellen. Ausnahmen gelten unter anderem für Unternehmen, die ausschließlich Mengen unterhalb der Freistellungsgrenzen (z. B. der 1000-Punkte-Regel) befördern.',
  },
  {
    question: 'Was ist eine UN-Nummer?',
    answer: 'Eine UN-Nummer ist eine vierstellige, von den Vereinten Nationen vergebene Kennnummer für gefährliche Stoffe und Gegenstände, zum Beispiel UN 1203 für Benzin. Sie identifiziert einen Stoff verkehrsträgerübergreifend eindeutig und ist der Schlüssel zu allen Vorschriften: Gefahrklasse, Verpackungsgruppe, Sondervorschriften und Mengengrenzen sind je UN-Nummer in den Regelwerken hinterlegt.',
  },
  {
    question: 'Was sind Sondervorschriften (SV)?',
    answer: 'Sondervorschriften sind nummerierte Zusatzregeln, die einzelnen UN-Nummern zugeordnet sind und die allgemeinen Vorschriften ergänzen oder ersetzen – etwa SV 640 zu Beförderungsbedingungen bestimmter Stoffgruppen. Sie stehen in Kapitel 3.3 der Regelwerke. gefahrgut.org zeigt die vollständigen Texte der Sondervorschriften direkt beim jeweiligen Stoff an, auf Deutsch, Englisch und Französisch, soweit amtlich verfügbar.',
  },
  {
    question: 'Welche Datenbasis nutzt gefahrgut.org?',
    answer: 'gefahrgut.org basiert auf der GEFAHRGUT-Datenbank der Bundesanstalt für Materialforschung und -prüfung (BAM) mit über 21.770 Einträgen zu ADR 2025, RID 2025, IMDG Amdt. 42-24, ICAO 2025 und den UN-Modellvorschriften. Die Daten stehen unter der Datenlizenz Deutschland (dl-de/by-2-0); Änderungen gegenüber der Quelle werden gekennzeichnet.',
  },
  {
    question: 'Was kostet gefahrgut.org?',
    answer: 'Zum Start gibt es einen kostenlosen Zugang mit 5 Suchanfragen pro Monat kostenlos. Für Vielnutzer wird es einen bezahlten Zugang geben; die Preise stehen noch nicht fest und werden zuerst den Mitgliedern der Warteliste mitgeteilt.',
  },
]
```

- [ ] **Step 2: Create `Faq.vue` (native details/summary for semantics)**

```vue
<!-- app/components/landing/Faq.vue -->
<template>
  <section id="faq" class="py-20 lg:py-28 bg-white" aria-labelledby="faq-heading">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #15779b; background: rgba(21,119,155,0.08); border-color: rgba(21,119,155,0.2);">
          FAQ
        </div>
        <h2 id="faq-heading" class="text-3xl sm:text-4xl font-bold" style="color: #0f2744;">
          Häufige Fragen
        </h2>
      </div>

      <div class="flex flex-col gap-3">
        <details
          v-for="item in FAQ_ITEMS"
          :key="item.question"
          class="group rounded-xl border border-slate-200 bg-white open:shadow-md transition-shadow"
        >
          <summary class="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none text-sm font-semibold list-none [&::-webkit-details-marker]:hidden" style="color: #0f2744;">
            {{ item.question }}
            <span class="text-slate-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <p class="px-5 pb-5 text-sm leading-relaxed text-slate-600">{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { FAQ_ITEMS } from '~/utils/landingFaq'
</script>
```

- [ ] **Step 3: Create `SeoContent.vue`**

```vue
<!-- app/components/landing/SeoContent.vue -->
<template>
  <section class="py-20 lg:py-28 bg-[#f6f8fb]" aria-labelledby="about-heading">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 id="about-heading" class="text-3xl sm:text-4xl font-bold mb-10 text-center" style="color: #0f2744;">
        Die Arbeitsplattform für Gefahrgutbeauftragte
      </h2>

      <div class="space-y-8 text-slate-600 text-[15px] leading-relaxed">
        <div>
          <h3 class="font-semibold mb-2" style="color: #0f2744;">Multimodaler Regelwerksvergleich</h3>
          <p>
            gefahrgut.org stellt die Vorschriften aus ADR (Straße), RID (Schiene), IMDG-Code (See)
            und ICAO (Luft) für jede UN-Nummer nebeneinander dar. Gefahrklasse, Verpackungsgruppe,
            begrenzte und freigestellte Mengen, Verpackungsanweisungen und Sondervorschriften lassen
            sich verkehrsträgerübergreifend vergleichen, ohne zwischen vier Regelwerken zu blättern.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-2" style="color: #0f2744;">Amtliche Datenbasis der BAM</h3>
          <p>
            Grundlage ist die GEFAHRGUT-Datenbank der Bundesanstalt für Materialforschung und
            -prüfung (BAM) mit über 21.770 Einträgen – inklusive der vollständigen Texte von rund
            1.350 Sondervorschriften. Jährliche Regelwerksänderungen werden mit der amtlichen Quelle
            aktualisiert.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-2" style="color: #0f2744;">Werkzeuge statt Nachschlagewerk</h3>
          <p>
            Neben der Stoffsuche entstehen praxisnahe Werkzeuge für den Arbeitsalltag: ein
            1000-Punkte-Rechner nach ADR 1.1.3.6, ein Dokumentengenerator für Beförderungspapiere
            und schriftliche Weisungen sowie Prüflisten für Verlader und Absender.
          </p>
        </div>
        <div>
          <h3 class="font-semibold mb-2" style="color: #0f2744;">Vier Sprachen</h3>
          <p>
            Die Oberfläche und die Regelwerksdaten stehen auf Deutsch, Englisch, Französisch und
            Türkisch zur Verfügung – für internationale Teams in Spedition, Industrie und Beratung.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 4: Insert both sections in `index.vue`**

The section block becomes:

```html
    <LandingMultimodalDemo />
    <LandingComparison />
    <LandingSeoContent />
    <LandingWaitlist />
    <LandingDataSource />
    <LandingFaq />
    <LandingCta />
    <LandingFooter />
```

- [ ] **Step 5: Verify**

Run: `pnpm test` — Expected: all PASS.
`curl -s localhost:3000 | grep -c '1000-Punkte-Regel'` — Expected: ≥ 1.

---

### Task 9: Structured data, meta tags, og-image, llms.txt

**Files:**
- Create: `app/utils/structuredData.ts`
- Test: `tests/structuredData.test.ts`
- Modify: `app/pages/index.vue` (head)
- Create: `public/og-image.png` (generated placeholder)
- Create: `public/llms.txt`

**Interfaces:**
- Consumes: `FAQ_ITEMS` from Task 8.
- Produces: `SITE_URL = 'https://gefahrgut.org'`, `buildOrganizationLd()`, `buildWebSiteLd()`, `buildSoftwareApplicationLd()`, `buildFaqPageLd(items: FaqItem[])` — each returns a plain object ready for `JSON.stringify`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/structuredData.test.ts
import { describe, expect, it } from 'vitest'
import { FAQ_ITEMS } from '~/utils/landingFaq'
import {
  buildFaqPageLd,
  buildOrganizationLd,
  buildSoftwareApplicationLd,
  buildWebSiteLd,
  SITE_URL,
} from '~/utils/structuredData'

describe('structured data', () => {
  it('Organization has name, url and logo', () => {
    const ld = buildOrganizationLd()
    expect(ld['@type']).toBe('Organization')
    expect(ld.name).toBe('gefahrgut.org')
    expect(ld.url).toBe(SITE_URL)
    expect(ld.logo).toContain(SITE_URL)
  })

  it('WebSite points at the canonical URL', () => {
    const ld = buildWebSiteLd()
    expect(ld['@type']).toBe('WebSite')
    expect(ld.url).toBe(SITE_URL)
  })

  it('SoftwareApplication carries the free-tier offer', () => {
    const ld = buildSoftwareApplicationLd()
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.offers.price).toBe('0')
    expect(ld.offers.priceCurrency).toBe('EUR')
    expect(ld.offers.description).toContain('5 Suchanfragen')
  })

  it('FAQPage mirrors the visible FAQ items exactly', () => {
    const ld = buildFaqPageLd(FAQ_ITEMS)
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity).toHaveLength(FAQ_ITEMS.length)
    expect(ld.mainEntity.map(e => e.name)).toEqual(FAQ_ITEMS.map(i => i.question))
    expect(ld.mainEntity[0]!.acceptedAnswer.text).toBe(FAQ_ITEMS[0]!.answer)
  })

  it('every builder produces valid JSON', () => {
    for (const ld of [buildOrganizationLd(), buildWebSiteLd(), buildSoftwareApplicationLd(), buildFaqPageLd(FAQ_ITEMS)]) {
      expect(() => JSON.parse(JSON.stringify(ld))).not.toThrow()
      expect(ld['@context']).toBe('https://schema.org')
    }
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run tests/structuredData.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
// app/utils/structuredData.ts
import type { FaqItem } from './landingFaq'

export const SITE_URL = 'https://gefahrgut.org'

export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'Organization' as const,
    'name': 'gefahrgut.org',
    'url': SITE_URL,
    'logo': `${SITE_URL}/og-image.png`,
  }
}

export function buildWebSiteLd() {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'WebSite' as const,
    'name': 'gefahrgut.org',
    'url': SITE_URL,
    'inLanguage': 'de',
  }
}

export function buildSoftwareApplicationLd() {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'SoftwareApplication' as const,
    'name': 'gefahrgut.org',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'description': 'Gefahrgut-Datenbank und Werkzeuge für Gefahrgutbeauftragte: multimodaler Vergleich von ADR, RID, IMDG und ICAO auf Basis der BAM-GEFAHRGUT-Datenbank.',
    'url': SITE_URL,
    'offers': {
      '@type': 'Offer' as const,
      'price': '0',
      'priceCurrency': 'EUR',
      'description': 'Kostenloser Zugang mit 5 Suchanfragen pro Monat; bezahlte Tarife folgen.',
    },
  }
}

export function buildFaqPageLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'FAQPage' as const,
    'mainEntity': items.map(item => ({
      '@type': 'Question' as const,
      'name': item.question,
      'acceptedAnswer': { '@type': 'Answer' as const, 'text': item.answer },
    })),
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm vitest run tests/structuredData.test.ts` — Expected: all PASS.

- [ ] **Step 5: Rewrite the head in `index.vue`**

Replace the whole `<script setup>` block with:

```ts
import { FAQ_ITEMS } from '~/utils/landingFaq'
import {
  buildFaqPageLd,
  buildOrganizationLd,
  buildSoftwareApplicationLd,
  buildWebSiteLd,
  SITE_URL,
} from '~/utils/structuredData'

const title = 'gefahrgut.org – Gefahrgut-Datenbank & Tools für Gefahrgutbeauftragte'
const description = 'ADR, RID, IMDG und ICAO in einer Plattform: 21.770 Einträge der BAM-GEFAHRGUT-Datenbank, multimodaler Regelwerksvergleich, Sondervorschriften im Volltext und Werkzeuge wie der 1000-Punkte-Rechner. Jetzt auf die Warteliste.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: `${SITE_URL}/`,
  ogImage: `${SITE_URL}/og-image.png`,
  ogLocale: 'de_DE',
  ogSiteName: 'gefahrgut.org',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: `${SITE_URL}/og-image.png`,
  robots: 'index, follow',
})

useHead({
  htmlAttrs: { lang: 'de' },
  link: [
    { rel: 'canonical', href: `${SITE_URL}/` },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' },
  ],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildOrganizationLd()) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildWebSiteLd()) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildSoftwareApplicationLd()) },
    { type: 'application/ld+json', innerHTML: JSON.stringify(buildFaqPageLd(FAQ_ITEMS)) },
  ],
})
```

(The `<style>` block at the bottom of `index.vue` stays unchanged.)

- [ ] **Step 6: Generate the og-image placeholder**

```bash
python3 - <<'EOF'
import struct, zlib
w, h = 1200, 630
row = b'\x00' + bytes([15, 39, 68] * w)   # solid navy #0f2744
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c))
png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(row * h))
       + chunk(b'IEND', b''))
open('public/og-image.png', 'wb').write(png)
print('ok')
EOF
```

(Solid-navy 1200×630 placeholder; a designed share image replaces it later.)

- [ ] **Step 7: Create `public/llms.txt`**

```markdown
# gefahrgut.org

> Gefahrgut-Datenbank und Arbeitsplattform für Gefahrgutbeauftragte (dangerous goods
> safety advisers). Multimodaler Vergleich der Regelwerke ADR (Straße), RID (Schiene),
> IMDG-Code (See) und ICAO (Luft) je UN-Nummer. Aktuell im Aufbau — Warteliste ist offen.

## Datenbasis

- Quelle: GEFAHRGUT-Datenbank der Bundesanstalt für Materialforschung und -prüfung (BAM)
- Umfang: 21.770 Einträge — ADR 2025 (3.374), RID 2025 (3.350), IMDG Amdt. 42-24 (3.246),
  ICAO 2025 (3.528), UN-Modellvorschriften (3.232); dazu ca. 1.350 Sondervorschriften im
  Volltext (DE/EN/FR, soweit amtlich verfügbar)
- Lizenz: Datenlizenz Deutschland — Namensnennung — Version 2.0 (dl-de/by-2-0);
  Änderungen gegenüber der Quelle werden gekennzeichnet

## Funktionen (bei Launch)

- UN-Nummern- und Stoffnamen-Suche über alle Verkehrsträger
- Multimodaler Regelwerksvergleich (ADR / RID / IMDG / ICAO nebeneinander)
- Sondervorschriften im Volltext, mehrsprachig (DE/EN/FR/TR-Oberfläche)
- 1000-Punkte-Rechner nach ADR 1.1.3.6, Dokumentengenerator, Prüflisten

## Preise

Kostenloser Zugang mit 5 Suchanfragen pro Monat; bezahlte Tarife folgen (Preise noch
offen, Ankündigung zuerst an die Warteliste).

## Links

- Startseite & Warteliste: https://gefahrgut.org/
- Blog (Fachartikel zu Gefahrstofflagerung, TRGS 510, ADR): https://gefahrgut.org/blog
```

- [ ] **Step 8: Verify**

Run: `pnpm test` — Expected: all PASS.
`curl -s localhost:3000 | grep -o 'application/ld+json' | wc -l` — Expected: `4`.
`curl -s localhost:3000/llms.txt | head -3` — Expected: the llms.txt header.
`curl -s -o /dev/null -w '%{http_code}' localhost:3000/og-image.png` — Expected: `200`.

---

### Task 10: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `pnpm test` — Expected: all files pass, 0 failures.

- [ ] **Step 2: Production build**

Run: `pnpm build` — Expected: builds without errors (first build containing a server route).

- [ ] **Step 3: End-to-end waitlist check on dev server**

```bash
curl -s -X POST localhost:3000/api/waitlist -H 'Content-Type: application/json' \
  -d '{"name":"E2E Test","email":"e2e-final@example.org","consent":true,"website":""}'
```

Expected: `{"status":"ok"}`. Verify the row exists via Supabase MCP `execute_sql`
(`SELECT name, email, consented_at FROM waitlist WHERE email = 'e2e-final@example.org';`),
then delete it (`DELETE FROM waitlist WHERE email = 'e2e-final@example.org';`).

- [ ] **Step 4: Visual sanity list for the user**

Report to the user for manual browser check: navbar shows "Warteliste"/"Blog", pricing
section gone, waitlist form between Comparison-content and DataSource, FAQ accordion
after DataSource, no "GefahrgutProfi" anywhere.
