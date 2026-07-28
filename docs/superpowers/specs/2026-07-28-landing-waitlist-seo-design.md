# Landing Page: Waitlist, Pricing Removal, SEO/AI-SEO — Design

**Date:** 2026-07-28
**Status:** Approved by user (conversation), pending spec review

## Goal

Convert the landing page from "sign up now" to "join the waitlist": collect names and
emails of potential customers for outreach when the tool launches, remove the pricing
section (pricing undecided; only known: free tier with 5 search requests, paid tier TBD),
and add SEO plus AI-SEO (answer-engine) content.

**Branding:** The product is called **gefahrgut.org** (matches the live domain and its
existing blog). All "GefahrgutProfi" references are replaced.

**Canonical domain:** `https://gefahrgut.org`

## Out of Scope

- Blog migration from the current WordPress site (separate project, later)
- Sitemap generation (belongs with blog migration)
- Actual pricing/checkout
- Captcha implementation (the endpoint is structured so Turnstile drops in later)
- Double-opt-in emails (no mail infrastructure yet; consent checkbox covers lawful storage)

## Architecture

First server route in the project. The browser never talks to Supabase for the waitlist.

```
LandingWaitlist.vue ──▶ useWaitlist ──▶ $fetch POST /api/waitlist
                                              │  validate (name, email, consent, honeypot)
                                              │  rate limit per IP (in-memory)
                                              │  [future: verify Turnstile token]
                                              ▼
                                    Supabase service-role client
                                              ▼
                                       waitlist table (no anon RLS policies)
```

Rationale: a future captcha secret can only be verified server-side, and per-IP rate
limiting keeps bot traffic off Supabase (cost control). The service role key is already
in server `.env` (used by the import script).

## Components

### 1. Database: `waitlist` table (new migration)

```sql
CREATE TABLE waitlist (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  consented_at TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
-- deliberately NO policies: anon/authenticated can neither read nor write;
-- only the service role (server) has access
```

Email is stored lowercased/trimmed. `consented_at` records when the GDPR checkbox was
ticked (consent is required to submit, so the column is NOT NULL).

### 2. Server: `server/api/waitlist.post.ts` + `server/utils/`

- `server/utils/waitlistValidation.ts` — pure function `validateWaitlistInput(body)`:
  - `name`: trimmed, 2–100 chars
  - `email`: trimmed, lowercased, sane email regex, ≤ 254 chars
  - `consent`: must be `true`
  - `website` (honeypot): must be empty/absent — if filled, respond `201` success
    without inserting (don't tip off bots)
  - returns `{ ok: true, data }` or `{ ok: false, error }`
- `server/utils/rateLimit.ts` — pure in-memory sliding-window limiter,
  `createRateLimiter({ max: 5, windowMs: 3_600_000 })` returning `check(key): boolean`.
  Keyed by client IP. Module-level instance in the route. (In-memory is acceptable:
  single Node process on Netcup; restarting resets counters, which is fine.)
- `server/api/waitlist.post.ts`:
  - 429 when rate-limited
  - 400 on validation failure (generic message)
  - insert via service-role client (`@supabase/supabase-js` `createClient` with
    `SUPABASE_SERVICE_ROLE_KEY` from runtime config — new private runtimeConfig keys)
  - unique violation (Postgres `23505`) → `200 { status: 'already_registered' }`
  - success → `201 { status: 'ok' }`
  - `// CAPTCHA: verify turnstile token here` marker comment for the future slot
- New `nuxt.config.ts` runtimeConfig: `supabaseServiceRoleKey` (private) reading
  `SUPABASE_SERVICE_ROLE_KEY`; public Supabase URL already exists.

### 3. Frontend: `useWaitlist` composable + `LandingWaitlist.vue`

- `app/composables/useWaitlist.ts`: refs `name`, `email`, `consent`, `honeypot`,
  `state` (`idle | submitting | success | already | error | rateLimited`),
  client-side pre-validation mirror, `submit()` calling `$fetch('/api/waitlist')`
  and mapping responses/errors to `state`.
- `app/components/landing/Waitlist.vue` (used as `<LandingWaitlist>`; section `id="waitlist"`, replaces
  Pricing's slot in `index.vue`):
  - Headline + subline: join the waitlist, be first to know at launch
  - Teaser line: at launch there is a free tier with 5 search requests per month;
    paid plans will be announced — waitlist members hear first
  - Form: name, email, consent checkbox with short GDPR note (data stored only for
    launch notification, deletable anytime, link to `/datenschutz` on the live domain),
    honeypot input (visually hidden, `autocomplete="off"`, `tabindex="-1"`)
  - States rendered from `useWaitlist.state`
  - Visual style follows existing sections (dark navy `#0f2744` / orange `#f97316`)

### 4. Landing page restructure (`app/pages/index.vue`)

Section order becomes:

```
Navbar / Hero / Stats / Features / MultimodalDemo / Comparison /
SeoContent (new) / Waitlist (new, Pricing's old slot) / DataSource / Faq (new) / Cta / Footer
```

- `Pricing.vue` deleted
- `Navbar.vue`: "Preise" → "Warteliste" (`#waitlist`); dead "Anmelden"/register links
  point to `#waitlist` until auth launches
- `Cta.vue`: both buttons → `#waitlist`; copy changed from "Kostenlos starten" to
  waitlist wording
- `Hero.vue`: unchanged (scroll-to-demo button stays)

### 5. SEO (`index.vue` head)

- `useSeoMeta`: title "gefahrgut.org – Gefahrgut-Datenbank & Tools für
  Gefahrgutbeauftragte", description mentioning ADR/RID/IMDG/ICAO, 21.770 Einträge,
  multimodaler Vergleich; OG type website, og:url canonical, og:image
  `/og-image.png` (placeholder file), Twitter summary_large_image
- Canonical link `https://gefahrgut.org/`
- JSON-LD (one `<script type="application/ld+json">` per graph, via useHead):
  - `Organization` (name gefahrgut.org, url, logo)
  - `WebSite` (with future SearchAction omitted — no public search URL yet → YAGNI)
  - `SoftwareApplication` (applicationCategory BusinessApplication, offers: free tier
    `price: 0` with description of the 5-search limit, `priceCurrency: EUR`)
  - `FAQPage` mirroring the visible FAQ items 1:1 (Google requirement)
- Footer: "© 2026 gefahrgut.org. Datenbasis: BAM GEFAHRGUT…" (BAM attribution stays —
  license requirement)

### 6. AI SEO

- `app/components/landing/Faq.vue` (used as `<LandingFaq>`): ~7 visible questions with substantive answers
  (accordion, native `<details>/<summary>` for semantics), German. Topics: Was ist die
  1000-Punkte-Regel; Unterschiede ADR/RID/IMDG/ICAO; wann braucht ein Betrieb einen
  Gefahrgutbeauftragten; was ist eine UN-Nummer; was sind Sondervorschriften; welche
  Daten nutzt gefahrgut.org (BAM, Lizenz); was kostet gefahrgut.org (frei mit 5 Suchen,
  Warteliste). Answers written as self-contained paragraphs an LLM can cite.
- `app/components/landing/SeoContent.vue` (used as `<LandingSeoContent>`): long-form semantic block
  ("Die Arbeitsplattform für Gefahrgutbeauftragte") — 3–4 short `<h3>` subsections of
  honest descriptive text (multimodaler Vergleich, Datenbasis BAM, Werkzeuge,
  Sprachen DE/EN/FR/TR). No keyword stuffing; written for humans, structured for
  machines.
- `public/llms.txt`: markdown summary of the site for LLM crawlers — what gefahrgut.org
  is, database scope (21.770 entries, ADR/RID/IMDG/ICAO/UN), tools, languages, blog URL,
  license/attribution, waitlist status.

## Error Handling

- Route always returns JSON with `status`; composable maps network failure and 5xx to
  `error` state with a friendly retry message
- Rate-limited (429) shows its own message ("Zu viele Versuche…")
- Honeypot hits look like success to the caller
- Supabase outage → 500 → `error` state; no data loss concern (user can retry)

## Testing

- `tests/waitlistValidation.test.ts` — pure validation: happy path, bad email, short
  name, missing consent, honeypot filled
- `tests/rateLimit.test.ts` — pure limiter: allows N, blocks N+1, window expiry (fake
  timers)
- `tests/useWaitlist.test.ts` — mocked `$fetch`: success, already_registered, 429, 500,
  client-side validation prevents submit
- `tests/waitlist-section.test.ts` — mounts `landing/Waitlist.vue` (nuxt env): form
  renders, consent required, success state swaps form for confirmation
- JSON-LD sanity check inside a landing-page test: head contains parseable JSON-LD of
  types FAQPage/Organization/SoftwareApplication, and visible FAQ questions equal the
  FAQPage questions
- Existing suite must stay green (navbar/CTA rewiring may touch snapshots — none exist,
  fine)

## Open Items Deliberately Deferred

- Turnstile captcha (slot marked in route)
- Waitlist admin view / CSV export (query Supabase dashboard directly for now)
- English/French/Turkish landing content (page is German; regulation UI stays multilingual)
