# Dangerous Goods Platform – CLAUDE.md

Stable facts, rules and conventions. **Current status, next steps, blockers and parked items live
in `docs/STATUS.md`** — read it at the start of a session and update it at the end.
Designs and plans are indexed in `docs/README.md`.

## Project Overview

A web platform for **Gefahrgutbeauftragte** (dangerous goods officers): the regulations (ADR, RID,
IMDG, ICAO, plus the UN model regulations as a reference; ADN has no BAM data) as a working tool, not a static reference.

- **Brand & domain:** **gefahrgut.org** (never "GefahrgutProfi" — old name). The apex still serves
  WordPress (blog, ~219 URLs, legal pages); rollout plan: test at `app.gefahrgut.org` (behind basic auth), blog to
  `blog.gefahrgut.org`, then the apex to the app (spec `2026-09-29-prelaunch-deployment`).
- **Core differentiator:** cross-mode comparison (ADR vs RID vs IMDG vs ICAO; ADN would need another source) — Phase 1.
- **Data source:** BAM GEFAHRGUT database, licence dl-de/by-2-0 (attribution required,
  modifications must be marked). The database is authoritative.
- **Business model:** no free tier; exactly one paid plan: **125 € pro Monat inkl. MwSt.** (owner, 2026-11-23),
  set once in `LEGAL_FACTS.price` and read via `planPrice()`. No price and no pricing section on the
  landing page (a test pins it). Accounts start **locked** (demo data only) until the owner sets
  `profiles.activated_at`; Stripe will later set the same column. **The app never goes live without a working
  purchase path (owner, 2026-11-24)**; the price model (seats, net price, yearly) is still open (STATUS.md, T1).
- **Pre-launch:** `REGISTRATION_MODE` (fail-closed; only `open` opens sign-up). In `waitlist` mode
  `/registrieren` collects launch notifications into `launch_signups`; "Anmelden" always works.

## Features

Phase 1: F-01 UN number search · F-02 1000-point calculator (ADR 1.1.3.6) · F-03 document generator ·
F-04 user management · F-05 dashboard · F-09 RID/IMDG/ICAO data · F-10 cross-mode comparison ·
F-13 ADR book viewer (the owner's second most important feature) · optional F-06 duty checker,
F-07 SV browser, F-08 packaging browser.
Phase 2: F-12 LQ/EQ calculator (F-11 transport mode assistant dropped by the owner, 2026-11-08). Phase 3: AI assistant,
Meilisearch, ERP/TMS API. Status per feature: `docs/STATUS.md`.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes) + TypeScript (rewritten from Nuxt 4 on 2026-09-04)
- **UI:** hand-written Tailwind CSS v4 via `@tailwindcss/vite` — no component library
- **Database / Auth:** Supabase (Postgres, Auth via `@supabase/ssr`)
- **Package manager:** pnpm (never npm/npx)
- **Hosting:** Strato VPS — the app in Docker (compose, bound to `127.0.0.1:3000`) behind Caddy on the host (automatic HTTPS) (`deploy/`, `docs/deploy/`)
- **Testing:** Vitest 5 + jsdom + `@testing-library/svelte`
- **Runtime dependencies for the book viewer:** `marked` + `sanitize-html` (rendered per request)
- **Planned:** Puppeteer (PDF), Meilisearch (Phase 3)

## Routes

Public: `/`, `/impressum`, `/datenschutz`, `/agb`, `/widerruf`, `/login`, `/registrieren`, `/passwort-vergessen`, `/passwort-neu`, `/auth/confirm`,
`/auth/fehler`, `/logout`, `/healthz`. Login required (guard in `hooks.server.ts` →
`/login?next=…`): `/dashboard`, `/suche`, `/un/:nummer`, `/un/:nummer/vergleich`, `/regelwerk/:mode` (only `adr`),
`/konto` (account: password, billing address, subscription status, deletion — usable while locked),
`/tools/1000-punkte` (F-02 calculator; active accounts only, locked ones see the upsell banner and no demo).
Planned (German, like the live ones): more tools under `/tools/…` (LQ/EQ), `/documents`, `/changes`, `/settings`.

## Commands

```bash
pnpm dev                 # Vite dev server (REGISTRATION_MODE unset → waitlist mode)
pnpm build               # production build → build/ (adapter-node)
pnpm preview             # serve the production build
pnpm check               # svelte-kit sync + svelte-check
pnpm test                # vitest suite
pnpm test:watch
pnpm import:regulations  # import BAM CSVs + SV texts into Supabase (needs the service-role key)
pnpm generate:demo       # regenerate DEMO_DATA/DEMO_SVS from the live tables (service-role key, read-only)
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
    +error.svelte         # German error page; 5xx details are never shown
    (legal)/              # impressum, datenschutz, agb, widerruf (public)
    auth/confirm, auth/fehler, logout, healthz (liveness + book readiness)
    (app)/                # login required; app shell (header + burger), upsell banner/modal for locked accounts
      dashboard, suche, un/[nummer] (+ vergleich/), regelwerk/[mode=bookMode] (+ window/ and search/ endpoints),
      tools/1000-punkte (+ eintrag/ endpoint),
      konto (named actions ?/password, ?/address, ?/delete)
  lib/
    multimodal/           # comparison tool: types.ts (LABELS, DEMO_DATA, pickSvText), mappers.ts
                          # (+ fetchUnReference), variants.ts, multimodalTool.svelte.ts,
                          # specialProvisions.svelte.ts, MultimodalTool.svelte, details.ts (Table A detail groups),
                          # demoData.generated.ts (pnpm generate:demo); F-10 side by side:
                          # compare.ts (COMPARE_FIELDS, buildComparison), comparisonView.svelte.ts,
                          # ComparisonView/ComparisonTable/ComparisonCards (below lg)/ComparisonCellValue/
                          # ComparisonLegend/VariantPicker.svelte
    auth/                 # safeNext, messages (German), AuthFormState
    account/              # /konto: address + countries, messages, subscription (Stripe hook), form state, *Card.svelte
    prelaunch/            # consent.ts (CONSENT_VERSION), copy.ts, LaunchNotifyForm.svelte
    upsell/               # sales modal + banner for locked accounts: upsellThrottle.svelte.ts, copy.ts,
                          # UpsellModal.svelte, UpsellBanner.svelte
    nav/                  # BurgerMenu.svelte + menu.svelte.ts (MenuState), appNav.ts (APP_NAV_ITEMS, inline + burger)
    landing/              # landing sections; faq.ts; siteFacts.ts (SITE_FACTS: UN numbers, entries, SVs — the one place for the numbers)
    regulations/          # book viewer, client side: bookTypes (+ BOOK_LABELS), bookHighlighter,
                          # adrBookViewer.svelte.ts, bookFetch, Book*.svelte
    points/               # 1000-Punkte-Rechner (ADR 1.1.3.6): points.ts (rules), duties.ts (1.1.3.6.2 duties + refs),
                          # pointsCalculator.svelte.ts, Points*.svelte (incl. print sheet)
    search/               # SearchState, normalize, results (ranking), synonyms, QuickSearch.svelte (UN jump on /un/:nummer and the comparison)
    seo/                  # SITE_URL + JSON-LD builders
    legal.ts              # IMPRINT/PRIVACY/TERMS/WITHDRAWAL_URL, LEGAL_LINKS, BLOG_URL — the only place for legal links
    legalPages/           # legal texts: facts.ts (LEGAL_FACTS), document.ts (fillDocument), impressum/datenschutz/agb/widerruf.ts,
                          # LegalPage.svelte, LegalLinks.svelte
    server/
      adrBook/            # book viewer, server side: index, indexer, slice, render, api, access, sourceFixes (load-time repairs of the OCR source)
      registrationMode.ts # REGISTRATION_MODE → 'open' | 'waitlist'
      rateLimit.ts, authValidation.ts, accountValidation.ts
tests/                    # vitest (flat); helpers/, fixtures/, stubs/
supabase/migrations/      # schema, SV languages, (retired waitlist), auth_and_entitlement,
                          # harden_grants, launch_signups, account_page
supabase/templates/       # auth email templates (pasted into the dashboard)
deploy/                   # compose.yaml, app.env.example, Caddyfile
scripts/                  # import-regulations.ts, generate-demo-data.ts, deploy.sh, remote-switch.sh (runs on the server)
csvbase/                  # BAM TSV sources + the ADR book markdown — gitignored
docs/                     # STATUS.md, README.md (index), schema doc, specs + plans, research/ (persona tests, synonym review)
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
| `billing_addresses` | one per user (PK `user_id` → auth.users, cascade): company?, names, street, postal_code, city, country (ISO-2), vat_id? | |

- **RLS:** every regulation table has one policy `activated read` (`to authenticated using (is_activated())`).
  Anonymous and locked users read nothing; anon has no table-level SELECT at all. `profiles`: own row only.
- **`launch_signups`:** RLS on, **no policies**, all privileges revoked; written only through
  `join_launch_list(email, consent_version)` (security definer, insert-only, `on conflict do nothing`).
  Callable with the publishable key by design, so direct calls can bypass the app's rate limit (junk rows at worst).
- **`billing_addresses`:** RLS on; own-row policies for select/insert/update only (no delete — it cascades with the account); `anon` has nothing; written by the user's own client on `/konto`.
- Security-definer functions: `handle_new_user()` (creates the profile), `join_launch_list()` and `delete_own_account()` (deletes only `auth.uid()` from `auth.users`, execute for `authenticated` only); all `search_path = ''`.
- **Applying migrations:** run the SQL with the Supabase MCP `execute_sql` in one transaction and insert the
  version row into `supabase_migrations.schema_migrations` yourself (`apply_migration` would mint a different
  version). Always with the owner's approval.
- Full schema: `docs/database-schema-and-import-plan.md`.

## Environment Variables

| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `$env/static/public` | baked in at build (Docker build args) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` only | import script and demo generator — **the app never uses it** |
| `REGISTRATION_MODE` | `$env/dynamic/private` | only exactly `open` opens sign-up; anything else = launch list |
| `ADR_BOOK_PATH` | `$env/dynamic/private` | the ADR markdown on the server; not in the repo. Indexed at server start (`init` in `hooks.server.ts`); unset = the book page answers with the error page (links stay visible); a missing or < 1 MB file is logged at boot and makes `/healthz` answer 503 |
| `ORIGIN` | adapter-node | public URL — required or form actions reject POSTs |
| `ADDRESS_HEADER` / `XFF_DEPTH` | adapter-node | `X-Forwarded-For` / `1` — Caddy sets the real client as the right-most hop (no trusted proxies) |
| `PORT` | adapter-node | 3000 |
| `DEPLOY_HOST`, `DEPLOY_USER` | `.deploy.env` (gitignored) | target of `scripts/deploy.sh` |
| `E2E_EMAIL`/`E2E_PASSWORD`, `E2E_LOCKED_EMAIL`/`E2E_LOCKED_PASSWORD` | `.env` only | test accounts for browser checks: activated (full data) and locked (demo + upsell). Never read by the app. The throw-away delete account was consumed on 2026-11-23 |

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
- `<dialog>`: jsdom has no `showModal()`; `tests/helpers/dialog.ts` stands in. Responsive utilities used in `@apply` or classes are compiled by `tests/responsive-utilities.test.ts` / `tailwind-classes.test.ts`.
- **Browser checks** (jsdom cannot see layout): drive Chromium with `playwright-core` from a script outside the repo (never add Playwright to `package.json`); check 320, 375, 768, 1024, 1280 px for horizontal scroll (`scrollWidth <= innerWidth`) and 44 px targets, and look at the screenshots. Use the `E2E_*` accounts read-only: never log out (it signs out every session of the shared account), never change the password or address except in a test that restores it. Login is limited to 10 per IP per 15 min, so save the storage state. Chromium may lack `libnspr4`/`libnss3`/`libasound2`: unpack the `.deb`s locally and set `LD_LIBRARY_PATH`. The 🌐 emoji renders as a box in headless Chromium (missing font, not an app bug).

## Coding Conventions

- **Svelte 5 runes only:** `$state`/`$derived`/`$props`, `onclick={}`, snippets, `{@attach}` not `use:action`, `class={[...]}` arrays. Run the Svelte MCP autofixer on every `.svelte` / `.svelte.ts` file.
- **Logic lives in `.svelte.ts` classes**; components render. Create once-per-component state from props inside `untrack(() => …)`.
- **Never name a variable `state`** (collides with the `$state` rune).
- **English identifiers**, camelCase fields and label keys. **User-visible copy is German and addresses the user with "du".**
- **Internal links** use `resolve()` with route IDs including groups (`resolve('/(auth)/login')`, `resolve('/(app)/un/[nummer]', { nummer })`). Query strings are appended to the resolved path; the autofixer's "without resolve()" warning on those, and on external URLs from `lib/legal.ts`, is a known false positive.
- **Tailwind v4 + `@apply`** needs `@reference "tailwindcss"` at the top of the `<style>` block.
- **Touch targets:** every link/button/field is at least 44×44 px (`min-h-11`/`min-w-11`, `inline-flex items-center`); keep the visual size with padding or negative margins; the app header stays `h-14` and one row at 768 px. Tests pin the classes.
- **Smooth scrolling:** `html { scroll-behavior: smooth }` (app.css) animates SvelteKit's scroll reset on client navigations; a page whose notice must be in view at once (e.g. `/?konto=geloescht`) scrolls instantly and focuses it in `afterNavigate`.
- **Locked mode:** every code path checks `isActive` before touching regulation data; RLS is the backstop. Locked users only mount `MultimodalTool` with `demo`. `/konto` touches no regulation data and is fully usable while locked. The `(app)` layout's `UpsellBanner` is the one lock notice;
  pages add only page-specific hints (e.g. "UN 1090 ist erst nach der Freischaltung verfügbar"), the demo tools carry their DEMO badge.
- **Sales modal (locked accounts):** only in the `(app)` layout; never for active accounts, never on `/konto`.
  Opens on the first page view, then at most every 10 min on navigation (`UpsellThrottle`, localStorage key
  `gefahrgut.upsell.lastShown`, storage failures just show it again); a banner covers the time in between.
  Its CTA links to `/konto#abo` — the Abo card keeps `id="abo"`; until Stripe exists that card only shows a disabled button, so the sales path is a dead end by design for now. Benefit facts follow the site facts.
- **Account actions:** password change and deletion re-authenticate with the current password (`signInWithPassword` on the session email) first; their rate limits are keyed by user id. Deletion goes through the `delete_own_account()` RPC — the app still never uses the service-role key.

## Key Rules

- **i18n:** de/en/fr/tr via `LABELS` (`lib/multimodal/types.ts`) and `BOOK_LABELS` (`lib/regulations/bookTypes.ts`); no i18n module. `pickSvText()` is the single home of the SV language fallback (tr reads en first).
- **Demo constants:** `DEMO_DATA`/`DEMO_SVS` live in `lib/multimodal/demoData.generated.ts`, written by `scripts/generate-demo-data.ts` (`pnpm generate:demo`) from the live BAM tables for UN 1203 sequence 1 through the app's own mapper (`fetchCompareForUn`); `types.ts` re-exports them. Never hand-edit; rerun after every import or mapper change and commit the output (`tests/demo-data-generated.test.ts` pins its key facts). `DEMO_SVS` is keyed `MODE:code`; `DEMO_DATA.ADN` is empty on purpose.
- **ADN:** BAM ships no ADN data. `Modal` keeps `'ADN'` (data shape `ADN: []`), but tabs, overview tiles and comparison columns iterate `DATA_MODES` and show one `noAdnData` note instead.
- **Table A detail columns** (`lib/multimodal/details.ts`, `DETAIL_FIELDS`): display only, grouped on the UN page. `special_provisions` holds column-6 codes only, so detail codes (MP, TU, V, CV, S …) have no texts; ADR rows link to the defining section (`/regelwerk/adr?section=`, verified against the real book), never RID/IMDG. An empty Table A cell is left out; BAM's explicit "no statement" (`n_mark`, `security_level` null) shows "Keine Angabe in der Quelle (BAM)". `*_entries.prohibited` is BAM `N_VERBOT` (1 = permitted) — never read it as a prohibition.
- **Session per request:** `locals.safeGetSession()` is memoised per request (one `getUser` + one profile query). An action that signs in or out must redirect.
- **Redirect targets:** only through `safeNext()` — it rejects control characters, backslashes and anything the URL parser resolves off-site.
- **Failures are never "no data":** a failed load must show an error state, not an empty result — in this domain "nothing found" is a statement about the regulation.
- **Auth flow:** confirmation and recovery go through `/auth/confirm?token_hash=…&type=…&next=…` (server-side `verifyOtp`); templates in `supabase/templates/` extend `{{ .RedirectTo }}`. Rate limits: login 10/IP/15 min; register, launch list and reset 5/IP/hour. Registration, the launch list and reset never reveal whether an address exists.
- **Launch list:** `CONSENT_VERSION` is stored with every address and must change whenever `LAUNCH_CONSENT_TEXT` changes (a test pins both). The first mail these addresses ever get is the double-opt-in confirmation.
- **SEO invariant:** the visible FAQ and the FAQPage JSON-LD both render from `FAQ_ITEMS` (`lib/landing/faq.ts`). Site facts (2.347 UN numbers, 16.730 entries, 1.354 SVs) live in `lib/landing/siteFacts.ts` and stay consistent across meta description, FAQ, SeoContent, the hero panel and `static/llms.txt` (a test pins them); update them after every yearly import. Never claim more than the data holds: the BAM certifies nothing ("Datenbasis: BAM-Datenbank GEFAHRGUT"), there are 4 regulations plus the UN reference, ADN is not advertised, and no promise of "rechtssicher"/"immer aktuell". The FAQ price answer lives in `PRICE_FAQ_ANSWER` and names no amount.
- **ADR book viewer:** the book is a **file** (`ADR_BOOK_PATH`), never in Postgres, `static/` or an image. No RLS stands behind it — the `isActive` check in the page load and both endpoints (`bookAccessDenied`) **is** the gate; any new reader must repeat it. Generated HTML carries only `book-*` classes (Tailwind cannot see runtime classes). The renderer tags blocks and table rows with `book-ln-<line>` so `pickActiveMark` finds the right `<mark>`. ~25–30 MB index per worker. No keyboard shortcuts except Enter in the search field (owner decision). The source is repaired at load time (`sourceFixes.ts`: orphan `**`, `$…$` maths → sub/sup); the TOC follows the ADR numbering (part → chapter → section by digit count), not the converter's unreliable `#` levels; section lookup tolerates bold and "Kapitel X.Y" headings and normalises input ("8.6.", "Kapitel 8.6"). Anchors, the hit counter (`statusLabel`) and SV/section scroll targets are covered by tests.
- **Regulatory comparison (F-10):** `COMPARE_FIELDS` plus the display-only `DETAIL_FIELDS` must list exactly the fields each mapper writes (a test pins it).
  Only modes in a field's `compareModes` are compared — labels, packing instructions, tank instructions (T, tank code) and SVs ADR↔RID only (other
  notations differ in the BAM feed); ICAO LQ (Y instruction + max net) is shown but never compared; absence is never
  a deviation; "See SP…"/"siehe SV …" in a quantity column is a reference, shown but never compared; an unresolved
  variant shows "?"; the UN column is reference only and never changes a status. An empty mode says *why*
  (`CompareField.gaps`): "In diesem Regelwerk nicht vorgesehen" only where the regulation lacks the field,
  "Keine Angabe in der Quelle (BAM)" where only the feed lacks it (RID Kemler), "→" where another row carries it.
  ICAO "FORBIDDEN" (read from the PI columns — `icao_entries.prohibited` is BAM's N_VERBOT, 1 = permitted) is always
  a critical finding. IMDG/UN IBC instructions (col. 10) join the packing instructions. The landing mockup is computed from `DEMO_DATA`.
- **1000-Punkte-Rechner (F-02, `lib/points/`):** rules per ADR 1.1.3.6 — BK 1 ×50, BK 2 ×3, BK 3 ×1, BK 4 ×0; footnote a) (multiplier 20, e.g. UN 1005) is read from `multiplier`; exempt only if the sum is **not more than** 1000 (1000 itself is exempt); any BK 0 or "BEFÖRDERUNG VERBOTEN" row means not exempt; empty uncleaned packagings count as BK 4 (BK 0 content stays 0); BK "-"/NULL means "bitte prüfen", never 0 points. Quantity units follow 1.1.3.6.3 (aerosols: mass without packaging). It never reads `adr_entries.prohibited`; it uses `transport_category` and `remark`. A failed lookup is an error, never 0 points. The result lists the duties that still apply, with paragraph references; links into the ADR viewer only where the book has that heading. Open expert questions (STATUS.md): the 333 limit for BK 2 alone, 8.6 tunnel rules, aerosol mass. Print view is the browser's print dialog (no Puppeteer, nothing stored).
- **Stoffsuche:** `lib/search/` — `normalize.ts` (case/umlaut/ß/separator folding, `UN3373` → UN number, ILIKE
  patterns), `results.ts` (ranking + cards), `synonyms.ts` (curated trade names; owner-reviewed, every UN number checked
  by SQL, table in `docs/research/synonyms-review.md`). Synonym hits always come after official-name hits and are
  marked; mode badges come from a detail load of all rows (not from the rows whose name matched); the ICAO placeholder
  UN 9999 is excluded; a possibly cut list is flagged (`incomplete`) and never shown as complete. `/suche?q=` prefills
  and stays in sync via `replaceState`.
- **Legal pages:** texts live in `lib/legalPages/*.ts`; operator and plan facts only in `LEGAL_FACTS`
  (`null` = unknown → `[[label]]` + draft banner + `noindex`; `false` = does not apply → block dropped). Bump
  `LEGAL_UPDATED` with every content change. The Datenschutzerklärung must change whenever a new service touches
  personal data (analytics needs a consent banner first). The Widerrufsbelehrung keeps the statutory "Sie" wording.
  All texts are drafts until a lawyer has checked them.
- **The ADR source is OCR-corrupted** (e.g. eleven spellings of Table A's header in 300 lines). Treat its text as untrusted, keep the "kein rechtsverbindlicher Text" disclaimer prominent, and never judge the database against it.
- **Known no-op kept for parity:** `Features.svelte` builds `hover:border-[${color}]` at runtime; Tailwind can't see it.

## Working Agreements

- The owner commits everything — never stage, commit, or inspect git history.
- Process: brainstorming → spec → plan → test-first implementation → autofixer → `pnpm check` → `pnpm build` + smoke test → update `docs/STATUS.md`.
- Anything that touches the live Supabase project or a server needs the owner's explicit approval first.
- **Persona tests** (`docs/research/<date>-persona-tests/`): build, run `node --env-file=.env build` on port 3100 with `ORIGIN=http://localhost:3100`, save storage states once for the active and the locked `E2E_*` account, then hand them to the persona agents (read-only, no logout, no form submits). Reports are simulated hypotheses, not customer data. Tasks from them live in `docs/STATUS.md`.
- Variant matching (`matchVariant`) never guesses: two equally good candidates → "?". UN 3481 shows that identical PG and specification across modes still needs the name as tiebreaker (T2a); UN 1950 is truly ambiguous (ADR/RID 12, ICAO 17, IMDG 1 variants).
