# Dangerous Goods Platform – CLAUDE.md

## Project Overview

A specialized web platform for **Gefahrgutbeauftragte** (dangerous goods officers) providing access to regulatory frameworks (ADR, RID, IMDG, ICAO, ADN, UN) as an active working tool — not just a static reference.

**Brand & domain:** **gefahrgut.org** (never "GefahrgutProfi" — old name, fully removed). The live domain currently hosts a WordPress coming-soon page plus a German blog (25+ pages, `gefahrgut.org/<slug>/`) that will be migrated into this app later. Legal pages (`/impressum`, `/datenschutz`) live on the WordPress site and are linked absolutely.

**Core differentiator:** Cross-transport-mode regulatory comparison (ADR vs. RID vs. IMDG vs. ICAO vs. ADN) — unique in the market. This is a **Phase 1 MVP feature**, not a later addition.

**Data source:** BAM (Bundesanstalt für Materialforschung und -prüfung) – GEFAHRGUT database, License: dl-de/by-2-0 (attribution required, modifications must be marked).

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes) + TypeScript — rewritten from Nuxt 4 on 2026-09-04 (spec: `docs/superpowers/specs/2026-09-04-sveltekit-rewrite-design.md`)
- **UI:** hand-written Tailwind CSS v4 via `@tailwindcss/vite` — no component library
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth, email + password via `@supabase/ssr` (hooks + layout clients); manual entitlement gate (`profiles.activated_at`)
- **Storage:** Supabase Storage
- **Package Manager:** pnpm (never npm/npx)
- **Hosting:** Netcup (Node.js via `@sveltejs/adapter-node` + PM2) behind Caddy (Let's Encrypt)
- **Testing:** Vitest 5 + jsdom + `@testing-library/svelte`
- **PDF generation (planned):** Puppeteer
- **Search (Phase 3):** Meilisearch

## Development Phases

### Phase 1 – MVP (all transport modes from day 1)

- F-01: UN number search (all modes: ADR, RID, IMDG, ICAO, ADN)
- F-02: 1000-point calculator (ADR 1.1.3.6)
- F-03: Document generator (Beförderungspapier, Schriftliche Weisungen, Checklists)
- F-04: User management & login (Supabase Auth)
- F-05: Dashboard
- F-09: RID, IMDG, ICAO data — imported from day 1, same time as ADR
- F-10: Regulatory comparison — cross-mode (key differentiator, ships in Phase 1)
- F-06: ADR duty checker (Sollte)
- F-07: Special provisions browser (Sollte)
- F-08: Packaging instructions browser (Sollte)

### Phase 2 – Tools & Documents

- F-11: Transport mode assistant
- F-12: LQ/EQ calculator

### Phase 3 (future)

- AI assistant
- Meilisearch full-text search (synced from Supabase)
- API for ERP/TMS systems

## URL Structure

```
/dashboard
/search?q=...
/un/:nummer
/un/:nummer/vergleich
/tools/1000-punkte
/tools/lq-eq
/tools/dokumentengenerator
/tools/transport-assistent
/tools/verpackung
/documents
/changes
/regulations/adr
/settings
```

## Business Model

**No free tier.** Exactly one paid plan with full functionality (price TBD, announced to registered users first); more plans (teams) may come later. The landing page has **no pricing section**; its CTAs lead to `/registrieren`. Registration is open; an account starts **locked** (demo data only) until the owner activates it manually (`profiles.activated_at`). No payment provider yet — Stripe later sets the same column. The former waitlist is retired.

## Commands

```bash
pnpm dev                 # Vite dev server
pnpm build               # Production build → build/ (adapter-node)
pnpm preview             # Serve the production build
pnpm check               # svelte-kit sync + svelte-check
pnpm test                # vitest suite (215 tests)
pnpm test:watch          # vitest watch mode
pnpm import:regulations  # Import BAM CSVs + SV texts into Supabase
```

## Project Structure

```
src/
  app.html                # <html lang="de">, favicon, %sveltekit.head/body%
  app.css                 # @import "tailwindcss" + global font/scroll rules
  app.d.ts                # App.Locals { supabase }
  hooks.server.ts         # per-request Supabase client, locals.safeGetSession(), (app)/(auth) route guard
  routes/
    +layout.server.ts     # cookies + session + slim user + isActive (from safeGetSession)
    +layout.ts            # browser/server Supabase client → data.supabase (+ session/user/isActive)
    +layout.svelte        # app.css, font <link>s, onAuthStateChange → invalidate('supabase:auth')
    +page.svelte          # public landing: SEO head (meta + 4 JSON-LD graphs) + sections
    (auth)/               # public, noindex, centered card layout
      login/  registrieren/  passwort-vergessen/  passwort-neu/   # form actions + pages
    auth/confirm/+server.ts   # token_hash exchange (verifyOtp) → safeNext(next) | /auth/fehler
    auth/fehler/+page.svelte
    logout/+page.server.ts    # POST signs out → /; GET redirects → /
    (app)/                # login required (guard in hooks); layout = app shell + lock banner
      +layout.server.ts   # { user, isActive } from parent
      dashboard/+page.svelte
      suche/+page.svelte  # live search; locked → LockNotice + demo tool, never queries
      un/[nummer]/
        +page.server.ts   # 404 unless 4 digits; locked → demo for 1203 / null; active → fetchCompareForUn
        +page.svelte
  lib/
    multimodal/
      types.ts                    # Entry, Modal, Lang, LABELS (i18n), DEMO_DATA, BK_CLASSES
      mappers.ts                  # row → Entry per mode; fetchCompareForUn(client, un)
      multimodalTool.svelte.ts    # MultimodalToolState class ($state/$derived)
      specialProvisions.svelte.ts # module-level SV text cache + loader (de/en/fr)
      MultimodalTool.svelte       # comparison UI (props: demo | unNumber+initialData, supabase)
      MultimodalSvsAccordion.svelte
    auth/
      safeNext.ts                 # same-origin redirect target validator
      messages.ts                 # AUTH_MESSAGES (German) per AuthErrorCode
      authForm.svelte.ts          # AuthFormState (login|register|reset|newPassword)
      LockNotice.svelte           # LOCK_MESSAGE + inline lock card
    landing/                      # Navbar, Hero, Stats, Features, MultimodalDemo (#demo),
                                  # Comparison, SeoContent, DataSource, Faq, Cta, Footer; faq.ts
    search/search.svelte.ts       # SearchState: debounce, MIN_QUERY_LENGTH=2, UN shortcut, race guard, { locked }
    seo/structuredData.ts         # SITE_URL + JSON-LD builders
    server/
      rateLimit.ts                # createRateLimiter() — in-memory sliding window (auth actions)
      authValidation.ts           # validateEmail/validatePassword/validateRegistration, AuthErrorCode
tests/                    # vitest — see Testing
static/                   # favicon.ico, llms.txt, og-image.png (placeholder), robots.txt
csvbase/                  # BAM TSV sources (ADR/RID/ICAO/IMDG/UN — no ADN); 16,730 entries
scripts/import-regulations.ts
supabase/migrations/      # schema, SV languages, waitlist (dropped again), auth_and_entitlement, harden_grants
docs/                     # schema doc, ERD, superpowers specs + plans
```

## Data / CSV Import

- **Format:** Tab-separated `.txt` files (not comma-separated despite name), ISO-8859-1 encoding, CRLF line endings
- **ADN:** Not available in BAM dataset — no `adn_entries` table. ADN tab in the UI always renders empty.
- **Multi-value columns:** Source CSVs use numbered siblings (`S_SV1`…`S_SV11`) collapsed into `TEXT[]` arrays by the import script.
- **Special provisions:** individual `.TXT` files named `<LANG>_<MODE>_<code>.TXT` (D/E/F). Language availability: ADR de+en+fr, RID/IMDG de+en, ICAO/UN en only. **No Turkish SV texts** — UI falls back (tr prefers en). 1,354 provisions total.
- **Yearly update:** Download new CSVs from BAM, run `pnpm import:regulations` — `UNIQUE (un_number, sequence_number)` ensures safe re-runs
- **Script env:** requires `PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`

## Database Schema (Supabase / PostgreSQL)

| Table | Mode | Rows |
|-------|------|------|
| `adr_entries` | Road (ADR 2025) | ~3,374 |
| `rid_entries` | Rail (RID 2025) | ~3,350 |
| `imdg_entries` | Sea (IMDG Amdt. 42-24) | ~3,246 |
| `icao_entries` | Air (ICAO 2025) | ~3,528 |
| `un_entries` | UN Recommendations | ~3,232 |

Supporting tables: `special_provisions` (mode, code, text_de/text_en/text_fr), `segregation_matrix`, `segregation_codes`, `profiles` (id → auth.users, email, `activated_at` NULL = locked).

**RLS (since migrations `20260904120000_auth_and_entitlement` + `20260904123000_harden_grants`, both applied to the hosted project on 2026-09-04):** every regulation table has a single policy `activated read` — `to authenticated using (is_activated())`. **Anonymous and locked users read nothing** (anon additionally has no table-level SELECT grant at all). `is_activated()` is a security-invoker helper over `profiles`; `handle_new_user()` (the only security-definer function, `search_path = ''`) creates the profile on signup. `profiles`: users can select their own row only; activation = owner sets `activated_at` in the table editor. The `un_comparison` view and the `waitlist` table are gone.

Full schema in `docs/database-schema-and-import-plan.md`.

## Environment Variables

| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `$env/static/public` | project URL (baked at build) |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `$env/static/public` | publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` only | import script; the app itself no longer uses the service role |
| `ORIGIN` | adapter-node | `https://gefahrgut.org` — required or form actions reject POSTs |
| `ADDRESS_HEADER` / `XFF_DEPTH` | adapter-node | `X-Forwarded-For` / `1` — `getClientAddress()` = right-most hop appended by Caddy |
| `PORT` | adapter-node | default 3000 |

Template: `.env.example`. **Vite gotcha:** `.env.local` overrides `.env` — never keep a placeholder template under that name (the old one is parked as `.env.local.bak`).

## Testing

- **Runner:** Vitest 5, `environment: 'jsdom'`, `tests/**/*.test.ts`, setup in `tests/setup.ts` (jest-dom matchers + testing-library auto-cleanup). `vite.config.ts` sets `resolve.conditions: ['browser', …]` under Vitest so Svelte's client runtime is used.
- **Rune test files** (using `$state` etc. in the test itself) must be named `*.svelte.test.ts`. Tests that only *consume* rune classes don't need it.
- **Pure-Node tests** (file scans etc.) add `// @vitest-environment node` at the top.
- **Supabase mocking:** hand-built chainable objects (`from → select → eq/or → order → limit/maybeSingle`) passed through constructors or the `data` prop. No global mocking.
- **State classes** (`MultimodalToolState`, `SearchState`, `WaitlistFormState`) are tested without mounting anything.
- **Components/pages:** `render()` from `@testing-library/svelte`; pages take `data`/`form` as props. Heavy children are stubbed with `vi.mock('$lib/…/MultimodalTool.svelte', …)` → `tests/stubs/ToolStub.svelte`. `$app/forms` is mocked in the waitlist test.
- **Server code:** form actions, `load`s, the confirm endpoint and `hooks.server.ts` are called directly with fabricated events (`tests/helpers/authEvent.ts` builds them with a mocked `locals.supabase.auth`). Rate limiters are module-level, so tests use distinct IPs per case.
- `tests/migration-auth.test.ts` and `tests/migration-harden-grants.test.ts` are static guards over the two migration files (policy swap per table, security-definer trigger, dropped view/table, anon grant revokes).
- **Applying migrations:** `supabase db push` needs the DB password interactively. Alternative used on 2026-09-04: run the SQL via the Supabase MCP `execute_sql` and insert the version row into `supabase_migrations.schema_migrations` yourself so the CLI history stays in sync.
- `tests/tailwind-classes.test.ts` scans `src/**/*.svelte` for Tailwind utilities that silently compile to nothing.
- **Every new feature ships with tests** — the user explicitly requires this.

## Coding Conventions

- **Svelte 5 runes only:** `$state`/`$derived`/`$props`, `onclick={}` not `on:click`, snippets not slots, `{@attach}` not `use:action`, clsx-style `class={[...]}` arrays. Run the Svelte MCP autofixer on every `.svelte` / `.svelte.ts` file before finishing.
- **Logic lives in `.svelte.ts` classes**, components render. Capture constructor props with `untrack()` when the state object is created once per component.
- **Never name a variable `state`** — it collides with the `$state` rune (Svelte treats `$state` as store access).
- **Variable names:** English only — no German identifiers. Entry fields camelCase (`hazardClass`, `packingGroup`). LABELS keys camelCase.
- **Tailwind v4 + `@apply`:** needs `@reference "tailwindcss"` at the top of the `<style>` block.
- **Internal links** use `resolve()` from `$app/paths` **with route IDs including group segments**, e.g. `resolve('/(app)/dashboard')`, `resolve('/(auth)/login')`, `resolve('/(app)/un/[nummer]', { nummer })` — the generated types reject bare pathnames for grouped routes.
- **Locked mode rule:** every code path checks `isActive` before touching regulation data; RLS is the backstop, not the primary check. Locked users only ever mount `MultimodalTool` with `demo`.
- **`state_referenced_locally`:** wrap once-per-component object creation from props in `untrack(() => …)`.

## Where we left off (2026-09-04) — resume here

Everything below is code-complete, tested (226 tests), type-checked, and the two DB migrations are applied live. Nothing was committed yet — the owner commits.

**Open, owner only (Supabase dashboard, spec §6 of `docs/superpowers/specs/2026-09-04-auth-and-entitlement-design.md`):**
1. Authentication → Providers → Email: enabled, "Confirm email" on, min password length 10.
2. Authentication → URL Configuration: Site URL `https://gefahrgut.org`; redirect URLs `https://gefahrgut.org/auth/confirm`, `http://localhost:5173/auth/confirm`, `http://localhost:4173/auth/confirm`.
3. Authentication → Emails → Templates: Confirm signup link → `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`; Reset password → `…&type=recovery&next=/passwort-neu`; Change email → `…&type=email_change&next=/dashboard`. **Until this is done, confirmation mails land on `/auth/fehler`.**
4. SMTP: configure a real sender before launch (built-in sender is dev-only, few mails/hour).
5. End-to-end check with `pnpm dev`: register → confirm → locked dashboard → set `profiles.activated_at` in the table editor → `/un/1090` shows real data.

**Open, code (next features, in suggested order):**
- Visual pass on the landing page + auth pages in a browser (never done after the Nuxt→SvelteKit port).
- F-05 dashboard proper (current one is a shell with two cards + "in Vorbereitung" placeholders).
- F-02 1000-Punkte-Rechner (pure logic, `lib/tools/…`, tests first).
- Stripe later: a webhook sets `profiles.activated_at`; no schema change needed.
- Optional cleanups: delete `.env.local.bak`; `multimodal-tool.html` at repo root is an old static prototype.

**Process that worked:** brainstorming → spec in `docs/superpowers/specs/` → plan in `docs/superpowers/plans/` → TDD with `pnpm test` per task → Svelte MCP autofixer on every `.svelte`/`.svelte.ts` → `pnpm check` → `pnpm build` + preview smoke test.

## Key Notes

- **i18n:** UI supports de / en / fr / tr via `LABELS` in `lib/multimodal/types.ts` — no i18n module.
- **Current state (2026-09-04):** SvelteKit rewrite + auth/entitlement (F-04). Public: `/`, `/login`, `/registrieren`, `/passwort-vergessen`, `/passwort-neu`, `/auth/confirm`, `/auth/fehler`. Login required: `/dashboard`, `/suche`, `/un/:nummer` (guard in `hooks.server.ts` → `/login?next=…`). 215 tests green, `pnpm check` clean. Both migrations are applied and verified live (trigger, anon/locked = 0 rows, activated = full data). Still open: Supabase dashboard configuration (email provider, redirect URLs, token-hash email templates, SMTP) — see spec §6.
- **Data flow:** `/un/:nummer` loads on the server via `locals.supabase` and passes `initialData` to `MultimodalTool`; `/suche` queries client-side via `data.supabase`; SV texts load lazily on the client. Landing demo and locked mode use hardcoded `DEMO_DATA`/`DEMO_SVS` (no database).
- **Auth flow:** email confirmation and password recovery go through `/auth/confirm?token_hash=…&type=…&next=…` (server-side `verifyOtp`); the Supabase email templates must link there with `{{ .TokenHash }}` (spec §6). Rate limits: login 10/IP/15 min, register + reset 5/IP/hour. Registration and reset never reveal whether an address exists.
- **SEO invariant:** the visible FAQ and the FAQPage JSON-LD both render from `FAQ_ITEMS` in `lib/landing/faq.ts` — never let them diverge. Site facts (16.730 entries, 1.354 SVs, 5 free searches) must stay consistent across meta description, FAQ, SeoContent, and `static/llms.txt`.
- **Known no-op kept for parity:** `Features.svelte` builds `hover:border-[${color}]` at runtime; Tailwind can't see it, so it produces no CSS (same as before the rewrite).
