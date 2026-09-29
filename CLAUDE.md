# Dangerous Goods Platform – CLAUDE.md

Stable facts, rules and conventions. **Current status, next steps, blockers and parked items live
in `docs/STATUS.md`** — read it at the start of a session and update it at the end.
Designs and plans are indexed in `docs/README.md`.

## Project Overview

A web platform for **Gefahrgutbeauftragte** (dangerous goods officers): the regulations (ADR, RID,
IMDG, ICAO, ADN, UN) as a working tool, not a static reference.

- **Brand & domain:** **gefahrgut.org** (never "GefahrgutProfi" — old name). The apex still serves
  WordPress (blog, ~219 URLs, legal pages); rollout plan: test at `neu.gefahrgut.org`, blog to
  `blog.gefahrgut.org`, then the apex to the app (spec `2026-09-29-prelaunch-deployment`).
- **Core differentiator:** cross-mode comparison (ADR vs RID vs IMDG vs ICAO vs ADN) — Phase 1.
- **Data source:** BAM GEFAHRGUT database, licence dl-de/by-2-0 (attribution required,
  modifications must be marked). The database is authoritative.
- **Business model:** no free tier; exactly one paid plan (price TBD). No pricing section on the
  landing page. Accounts start **locked** (demo data only) until the owner sets
  `profiles.activated_at`; Stripe will later set the same column.
- **Pre-launch:** `REGISTRATION_MODE` (fail-closed; only `open` opens sign-up). In `waitlist` mode
  `/registrieren` collects launch notifications into `launch_signups`; "Anmelden" always works.

## Features

Phase 1: F-01 UN number search · F-02 1000-point calculator (ADR 1.1.3.6) · F-03 document generator ·
F-04 user management · F-05 dashboard · F-09 RID/IMDG/ICAO data · F-10 cross-mode comparison ·
F-13 ADR book viewer (the owner's second most important feature) · optional F-06 duty checker,
F-07 SV browser, F-08 packaging browser.
Phase 2: F-11 transport mode assistant, F-12 LQ/EQ calculator. Phase 3: AI assistant,
Meilisearch, ERP/TMS API. Status per feature: `docs/STATUS.md`.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes) + TypeScript (rewritten from Nuxt 4 on 2026-09-04)
- **UI:** hand-written Tailwind CSS v4 via `@tailwindcss/vite` — no component library
- **Database / Auth:** Supabase (Postgres, Auth via `@supabase/ssr`)
- **Package manager:** pnpm (never npm/npx)
- **Hosting:** Netcup VPS — the app in Docker (compose, bound to `127.0.0.1:3000`) behind nginx + certbot on the host (`deploy/`, `docs/deploy/`)
- **Testing:** Vitest 5 + jsdom + `@testing-library/svelte`
- **Runtime dependencies for the book viewer:** `marked` + `sanitize-html` (rendered per request)
- **Planned:** Puppeteer (PDF), Meilisearch (Phase 3)

## Routes

Public: `/`, `/login`, `/registrieren`, `/passwort-vergessen`, `/passwort-neu`, `/auth/confirm`,
`/auth/fehler`, `/logout`, `/healthz`. Login required (guard in `hooks.server.ts` →
`/login?next=…`): `/dashboard`, `/suche`, `/un/:nummer`, `/regelwerk/:mode` (only `adr`).
Planned (German, like the live ones): tools under `/tools/…`, `/documents`, `/changes`, `/settings`.

## Commands

```bash
pnpm dev                 # Vite dev server (REGISTRATION_MODE unset → waitlist mode)
pnpm build               # production build → build/ (adapter-node)
pnpm preview             # serve the production build
pnpm check               # svelte-kit sync + svelte-check
pnpm test                # vitest suite
pnpm test:watch
pnpm import:regulations  # import BAM CSVs + SV texts into Supabase (needs the service-role key)
pnpm deploy:test         # build image → ship over SSH → switch → /healthz → auto-rollback
pnpm deploy:rollback     # back to the previous image
```

## Project Structure

```
src/
  hooks.server.ts         # per-request Supabase client, locals.safeGetSession(), (app)/(auth) guard
  params/bookMode.ts      # route matcher over BOOK_MODES (['adr'])
  routes/
    +layout.server.ts     # cookies, session, slim user, isActive, registrationOpen
    +layout.ts            # browser/server Supabase client; passes the server data through
    +page.svelte          # landing: SEO head (meta + 4 JSON-LD graphs) + sections
    (auth)/               # login, registrieren (sign-up | launch list), passwort-vergessen, passwort-neu
    auth/confirm, auth/fehler, logout, healthz
    (app)/                # login required; app shell + lock banner
      dashboard, suche, un/[nummer], regelwerk/[mode=bookMode] (+ window/ and search/ endpoints)
  lib/
    multimodal/           # comparison tool: types.ts (LABELS, DEMO_DATA, pickSvText), mappers.ts,
                          # multimodalTool.svelte.ts, specialProvisions.svelte.ts, MultimodalTool.svelte
    auth/                 # safeNext, messages (German), AuthFormState, LockNotice
    prelaunch/            # consent.ts (CONSENT_VERSION), copy.ts, LaunchNotifyForm.svelte
    landing/              # landing sections; faq.ts
    regulations/          # book viewer, client side: bookTypes (+ BOOK_LABELS), bookHighlighter,
                          # adrBookViewer.svelte.ts, bookFetch, Book*.svelte
    search/               # SearchState
    seo/                  # SITE_URL + JSON-LD builders
    legal.ts              # PRIVACY_URL, IMPRINT_URL, BLOG_URL — the only place for WordPress links
    server/
      adrBook/            # book viewer, server side: index, indexer, slice, render, api, access
      registrationMode.ts # REGISTRATION_MODE → 'open' | 'waitlist'
      rateLimit.ts, authValidation.ts
tests/                    # vitest (flat); helpers/, fixtures/, stubs/
supabase/migrations/      # schema, SV languages, (retired waitlist), auth_and_entitlement,
                          # harden_grants, launch_signups
supabase/templates/       # auth email templates (pasted into the dashboard)
deploy/                   # compose.yaml, app.env.example, nginx/ (Task 8)
scripts/                  # import-regulations.ts, deploy.sh
csvbase/                  # BAM TSV sources + the ADR book markdown — gitignored
docs/                     # STATUS.md, README.md (index), schema doc, specs + plans
```

## Data / CSV Import

- Tab-separated `.txt` files, ISO-8859-1, CRLF. No ADN in the BAM feed (the ADN tab is always empty).
- Multi-value columns (`S_SV1`…`S_SV11`) are collapsed into `TEXT[]`.
- Special provisions: `<LANG>_<MODE>_<code>.TXT` (D/E/F). ADR de+en+fr, RID/IMDG de+en, ICAO/UN en
  only; no Turkish (tr falls back to en). 1,354 provisions.
- Yearly update: new BAM CSVs → `pnpm import:regulations` (`UNIQUE (un_number, sequence_number)` makes re-runs safe).

## Database

| Table | Content | Rows |
|---|---|---|
| `adr_entries` / `rid_entries` / `imdg_entries` / `icao_entries` / `un_entries` | ADR 2025, RID 2025, IMDG Amdt. 42-24, ICAO 2025, UN | ~3,374 / 3,350 / 3,246 / 3,528 / 3,232 |
| `special_provisions` | mode, code, text_de/en/fr | 1,354 |
| `segregation_matrix`, `segregation_codes` | segregation data | |
| `profiles` | id → auth.users, email, `activated_at` (NULL = locked) | |
| `launch_signups` | pre-launch list: email, consent_version, consented_at, confirmed_at | |

- **RLS:** every regulation table has one policy `activated read` (`to authenticated using (is_activated())`).
  Anonymous and locked users read nothing; anon has no table-level SELECT at all. `profiles`: own row only.
- **`launch_signups`:** RLS on, **no policies**, all privileges revoked; written only through
  `join_launch_list(email, consent_version)` (security definer, insert-only, `on conflict do nothing`).
  Callable with the publishable key by design, so direct calls can bypass the app's rate limit (junk rows at worst).
- Security-definer functions: `handle_new_user()` (creates the profile) and `join_launch_list()`; both `search_path = ''`.
- **Applying migrations:** run the SQL with the Supabase MCP `execute_sql` in one transaction and insert the
  version row into `supabase_migrations.schema_migrations` yourself (`apply_migration` would mint a different
  version). Always with the owner's approval.
- Full schema: `docs/database-schema-and-import-plan.md`.

## Environment Variables

| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `$env/static/public` | baked in at build (Docker build args) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` only | import script — **the app never uses it** |
| `REGISTRATION_MODE` | `$env/dynamic/private` | only exactly `open` opens sign-up; anything else = launch list |
| `ADR_BOOK_PATH` | `$env/dynamic/private` | the ADR markdown on the server; not in the repo; the viewer refuses to start if unset or < 1 MB |
| `ORIGIN` | adapter-node | public URL — required or form actions reject POSTs |
| `ADDRESS_HEADER` / `XFF_DEPTH` | adapter-node | `X-Forwarded-For` / `1` — nginx appends the real client as the right-most hop |
| `PORT` | adapter-node | 3000 |
| `DEPLOY_HOST`, `DEPLOY_USER` | `.deploy.env` (gitignored) | target of `scripts/deploy.sh` |

Templates: `.env.example`, `deploy/app.env.example`, `.deploy.env.example`.
**Vite gotcha:** `.env.local` overrides `.env` — never keep a placeholder template under that name.

## Testing

- Vitest 5, jsdom, `tests/**/*.test.ts`, setup `tests/setup.ts`. **Every feature ships with tests** (owner rule).
- Rune test files (using `$state` in the test itself) are named `*.svelte.test.ts`. Pure-Node tests start with `// @vitest-environment node`.
- Supabase mocking: hand-built chainable objects passed in; no global mocking.
- State classes (`MultimodalToolState`, `SearchState`, `AuthFormState`, `AdrBookViewerState`) are tested without mounting.
- Pages: `render()` with `data`/`form` props; heavy children stubbed (`tests/stubs/ToolStub.svelte`); `$app/forms` / `$app/navigation` mocked where used.
- Server code (actions, loads, endpoints, hooks) is called directly with fabricated events: `tests/helpers/authEvent.ts` (auth + `rpc` mocks), `tests/helpers/bookEvent.ts`. Rate limiters are module-level → distinct IPs per case.
- `$env/dynamic/private`: `vi.hoisted` object + `vi.mock('$env/dynamic/private', () => ({ env }))` + top-level `await import(...)`.
- Static guards: migrations (`migration-*.test.ts`), email templates, deploy files (Dockerfile, compose, `.dockerignore`, deploy script), `tailwind-classes.test.ts` (utilities that compile to nothing).
- Book tests use `tests/fixtures/adr-book-sample.md`; the real file (`csvbase/`) is gitignored, so real-file checks are never committed.

## Coding Conventions

- **Svelte 5 runes only:** `$state`/`$derived`/`$props`, `onclick={}`, snippets, `{@attach}` not `use:action`, `class={[...]}` arrays. Run the Svelte MCP autofixer on every `.svelte` / `.svelte.ts` file.
- **Logic lives in `.svelte.ts` classes**; components render. Create once-per-component state from props inside `untrack(() => …)`.
- **Never name a variable `state`** (collides with the `$state` rune).
- **English identifiers**, camelCase fields and label keys. **User-visible copy is German and addresses the user with "du".**
- **Internal links** use `resolve()` with route IDs including groups (`resolve('/(auth)/login')`, `resolve('/(app)/un/[nummer]', { nummer })`). Query strings are appended to the resolved path; the autofixer's "without resolve()" warning on those, and on external URLs from `lib/legal.ts`, is a known false positive.
- **Tailwind v4 + `@apply`** needs `@reference "tailwindcss"` at the top of the `<style>` block.
- **Locked mode:** every code path checks `isActive` before touching regulation data; RLS is the backstop. Locked users only mount `MultimodalTool` with `demo`.

## Key Rules

- **i18n:** de/en/fr/tr via `LABELS` (`lib/multimodal/types.ts`) and `BOOK_LABELS` (`lib/regulations/bookTypes.ts`); no i18n module. `pickSvText()` is the single home of the SV language fallback (tr reads en first).
- **Demo constants:** `DEMO_DATA`/`DEMO_SVS` are generated from the live BAM tables for UN 1203 sequence 1 — never hand-edit. `DEMO_SVS` is keyed `MODE:code`; `DEMO_DATA.ADN` is empty on purpose.
- **Auth flow:** confirmation and recovery go through `/auth/confirm?token_hash=…&type=…&next=…` (server-side `verifyOtp`); templates in `supabase/templates/` extend `{{ .RedirectTo }}`. Rate limits: login 10/IP/15 min; register, launch list and reset 5/IP/hour. Registration, the launch list and reset never reveal whether an address exists.
- **Launch list:** `CONSENT_VERSION` is stored with every address and must change whenever `LAUNCH_CONSENT_TEXT` changes (a test pins both). The first mail these addresses ever get is the double-opt-in confirmation.
- **SEO invariant:** the visible FAQ and the FAQPage JSON-LD both render from `FAQ_ITEMS` (`lib/landing/faq.ts`). Site facts (16.730 entries, 1.354 SVs) stay consistent across meta description, FAQ, SeoContent and `static/llms.txt`.
- **ADR book viewer:** the book is a **file** (`ADR_BOOK_PATH`), never in Postgres, `static/` or an image. No RLS stands behind it — the `isActive` check in the page load and both endpoints (`bookAccessDenied`) **is** the gate; any new reader must repeat it. Generated HTML carries only `book-*` classes (Tailwind cannot see runtime classes). The renderer tags blocks and table rows with `book-ln-<line>` so `pickActiveMark` finds the right `<mark>`. ~25–30 MB index per worker. No keyboard shortcuts except Enter in the search field (owner decision).
- **The ADR source is OCR-corrupted** (e.g. eleven spellings of Table A's header in 300 lines). Treat its text as untrusted, keep the "kein rechtsverbindlicher Text" disclaimer prominent, and never judge the database against it.
- **Known no-op kept for parity:** `Features.svelte` builds `hover:border-[${color}]` at runtime; Tailwind can't see it.

## Working Agreements

- The owner commits everything — never stage, commit, or inspect git history.
- Process: brainstorming → spec → plan → test-first implementation → autofixer → `pnpm check` → `pnpm build` + smoke test → update `docs/STATUS.md`.
- Anything that touches the live Supabase project or a server needs the owner's explicit approval first.
