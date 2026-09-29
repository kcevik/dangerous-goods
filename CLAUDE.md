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
- **Markdown (ADR book viewer):** `marked` 18 + `sanitize-html` 2 — **runtime** dependencies, because the book is rendered per request in the server process
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
- F-13: ADR book viewer — click a provision code or UN number in the comparison tool, open the
  consolidated ADR text at that spot with a find-in-page bar. **The owner calls this the
  second most important feature and a launch blocker.** Code complete 2026-09-29 at
  `/regelwerk/adr`; not deployed (Task 9, owner-gated). See "Where we left off".

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
/regelwerk/:mode          # book viewer; matcher `bookMode` allows only `adr` (RID/IMDG/ICAO books later)
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
pnpm test                # vitest suite (554 tests)
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
      regelwerk/[mode=bookMode]/  # ADR book viewer
        +page.server.ts   # ?sv|un|section|q (+hit, all); locked → { locked: true, mode } without touching the book
        +page.svelte      # LockNotice | {#key data} BookViewer
        window/+server.ts # GET ?line=n[&dir=±1] → RenderedWindow (120/min/IP)
        search/+server.ts # GET ?q= | ?sv= | ?un= [&all=1][&limit=] → { hits, total, capped } (60/min/IP)
  params/bookMode.ts      # route matcher over BOOK_MODES (['adr'])
  lib/
    multimodal/
      types.ts                    # Entry, Modal, Lang, LABELS (i18n), SvText, pickSvText, DEMO_DATA, DEMO_SVS, BK_CLASSES
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
    regulations/                  # ADR book viewer (client-safe half)
      bookTypes.ts                # types, BOOK_MODES, BookPageData, limits, SV/UN regexes, BOOK_LABELS (de/en/fr/tr)
      bookHighlighter.ts          # markMatches(wholeToken)/clearMarks/setActiveMark/sourceLineOf/pickActiveMark
      adrBookViewer.svelte.ts     # AdrBookViewerState: hit navigation, lazy windows, debounced search
      bookFetch.ts                # createBookFetchers(base) → ViewerDeps over the two endpoints
      BookViewer.svelte           # orchestrator: marks, scroll, URL sync (replaceState), shortcuts, read-ahead
      BookFindBar.svelte  BookToc.svelte  BookWindow.svelte ({@html}, server-sanitised)  BookAttribution.svelte
    search/search.svelte.ts       # SearchState: debounce, MIN_QUERY_LENGTH=2, UN shortcut, race guard, { locked }
    seo/structuredData.ts         # SITE_URL + JSON-LD builders
    server/
      adrBook/                    # ADR book viewer (server half) — no DB, no migration
        index.ts                  # getBookIndex() memoised from ADR_BOOK_PATH; loud startup check; MIN_BOOK_BYTES
        indexer.ts                # indexBook(lines) → headings + ranked occurrence hits + svCodes
        slice.ts                  # sliceAround() — line window, boundary snapping, table-header repair
        render.ts                 # renderSlice()/toPlainText() — marked + sanitize-html, book-* classes only; book-ln-<line> tags
        api.ts                    # resolvePrimaryHit/hitsFor/searchText/windowAt/toc + LRU render cache
        access.ts                 # bookAccessDenied(locals) — THE entitlement gate (401/403), positiveInt()
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
| `ADR_BOOK_PATH` | `$env/dynamic/private` | absolute path to the consolidated ADR markdown on the server. **Not in the repo**, deployed by hand; keep it outside the release dir so a redeploy cannot remove it. The viewer refuses to start if unset or if the file is under 1 MB. |

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
- **ADR book tests:** all pure-node (`// @vitest-environment node`) except `bookHighlighter` which needs jsdom. `$env/dynamic/private` is mocked with `vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }))` plus a top-level `await import(...)` so the mock is in place first. Real-file assertions are **not** committed — `csvbase/` is gitignored and absent elsewhere; `tests/fixtures/adr-book-sample.md` (110 lines) reproduces every structural quirk instead.
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

## Where we left off (2026-09-29) — resume here

Nothing is committed; the owner commits everything. **554 tests green, `pnpm check` 0 errors
(5 known `@apply` warnings in `MultimodalTool.svelte`), `pnpm build` succeeds.**

### Done 2026-09-29

1. **Signup works end-to-end** on the built-in sender (register → confirm mail → locked
   dashboard → activation → real data). Email templates live in `supabase/templates/` and link via
   `{{ .RedirectTo }}` (guarded by `tests/email-templates.test.ts`). The app addresses users with
   **"du"** — the templates too.
2. **Landing + dashboard show only the Stoffsuche as live**; every other tool is a grayed
   "Demnächst verfügbar" card (see "Parked" below).
3. **ADR book viewer code-complete** at `/regelwerk/adr` (Tasks 11–16). Not deployed.

### ADR book viewer — state of play

**Design:** `docs/superpowers/specs/2026-09-28-adr-book-viewer-design.md`
**Plan:** `docs/superpowers/plans/2026-09-28-adr-book-viewer.md` (progress at the top; execution
ledger with every ruling in `.superpowers/sdd/2026-09-28-adr-book-viewer/progress.md`, gitignored)

The book is **a file on the server, indexed in memory at boot** — no Postgres table, no
migration, no import step (owner decision; spec §2.2). Owner decisions 2026-09-29: route
**`/regelwerk/[mode]`** (only `adr`), **no keyboard shortcuts** — only Enter in the search field (next hit); Ctrl+F stays the browser's,
source is **the official public text** — exact document still to be named (the «» quotes suggest
the Swiss Fedlex publication, SR 0.741.621).

- **All code tasks done** (1–8, 10–16). Links: SV rows and the `UN …` header in the comparison
  tool (ADR tab, not demo) open the book in a new window; nav link "ADR-Text".
- **Local run:** set `ADR_BOOK_PATH=<repo>/csvbase/ADR2025-konsolidiert.md` (e.g. in `.env`).
- **Task 9 (deploy) is owner-gated** — needs the named source document first.
- **Mark ↔ hit mapping:** the renderer tags every block and table row with `book-ln-<line>`;
  `pickActiveMark` uses that to light the right `<mark>` for "Treffer k von n". Verified on the
  real book: 0 of 3,551 row tags wrong.
- **Measured (real book):** index build 245 ms / +31 MB heap (budget 100 ms / 40 MB — **build time
  over budget**, once per worker); `?sv=274` payload 390 KB raw / 41 KB gzip (**over the 350 KB
  raw budget**, hit list dominates); windows ≤ 102 KB, ≤ 23 ms; `searchText` ≤ 47 ms.
- **"Tunnelcode" finds nothing** — the ADR only says "Tunnelbeschränkungscode". Synonyms are a
  possible follow-up.

**Three findings that changed the design:**

- **The source is OCR-corrupted, not just oddly formatted.** Table A's header appears in
  **eleven different spellings** within one 300-line stretch ("Gefahrzettel" also as
  "Gefährzettel", "Gefährdungen", "Gefährlichkeit"; "Begrenzte" as "Begrenze", "Begrenzung")
  and its column count varies between 22 and 23. `slice.ts` therefore matches repeated headers
  by **cell similarity** (case/diacritic-insensitive, 60% threshold), not by text — without
  that, one window renders as 23 stacked tables. **Implication beyond formatting:** if the
  header is misread eleven ways, the body text is unlikely to be clean either. Spec §3.4.
- **The spec's occurrence counts were inflated** and are corrected: **4,134** provision
  occurrences and **10,828** UN occurrences (not 7,264 / 11,520), **14,962** hits total,
  1,506 headings, **377** provision codes validated against the BAM CSV with zero false
  positives. Chapter 3.3 has **five** definition line shapes, not three.
- **`640A`–`640O` have no definition of their own** (the ADR defines them inside the 640
  paragraph). `resolvePrimaryHit` falls back to the numeric parent and returns the parent's
  `code` so the UI can tell the reader what it opened.

**Blocking, owner only:** the owner says the source is the official public text but has not yet
named the document; the BAM dl-de/by-2-0 licence does **not** cover it. Nothing ships until it is
named — spec §11.1. Still open in §11: text-accuracy ownership (pressing given the OCR finding),
the 57 missing images, the 500-hit cap, editions.

### F-10 regulatory comparison — planned, not started

**Design:** `docs/superpowers/specs/2026-09-28-regulatory-comparison-design.md`
**Plan:** `docs/superpowers/plans/2026-09-28-regulatory-comparison.md` (7 tasks)

The owner chose to build the real side-by-side view rather than delete the landing page's
claims. Central rule: **absence of a column is not a deviation** — tunnel code is road-only,
stowage sea-only, so a naive diff would flag a deviation on nearly every substance. Three
open questions for the owner at the end of the spec; #1 (row alignment across modes) should be
settled before Task 1.

### Launch readiness

**Report:** `docs/go-live-readiness-2026-09-28.md` — answers "what next" and separates a
show-someone bar from a take-money bar. Blockers it found:

1. **Impressum and Datenschutz links are dead** — both linked from the footer and the
   registration consent checkbox, both render the coming-soon splash. Actionable in Germany.
2. ~~Registration has never worked~~ — **works end-to-end since 2026-09-29** (register → confirm
   mail → locked dashboard → activation → real data), still on the built-in sender; real SMTP is open.
3. **Google Fonts is loaded from Google's servers** with no consent (`routes/+layout.svelte`).
   About an hour to self-host, and it removes the cookie-banner question.
4. **No backups** — the Supabase org is on the free plan.
5. **Nothing exists for deployment** — no PM2 config, Caddyfile, systemd unit or deploy script.
   `.env.example` has since been completed (ORIGIN, ADDRESS_HEADER, XFF_DEPTH, PORT, ADR_BOOK_PATH).
6. **The landing comparison mockup's deviation warning is factually false**, and the WordPress
   cutover is **219 URLs**, not 25, including 15 working tool pages. The report recommends
   launching on a subdomain instead of repointing the apex; that looks right.

Also noted there: `un_entries` (3,232 rows) is counted in the advertised 16.730 but never
queried by `fetchCompareForUn`, and `/suche` queries only `adr_entries` and swallows errors,
so a failure renders as "Keine Ergebnisse".

### Still open from 2026-09-04 (owner, Supabase dashboard)

Spec §6 of `docs/superpowers/specs/2026-09-04-auth-and-entitlement-design.md`:

1. Authentication → Providers → Email: enabled, "Confirm email" on, min password length 10.
2. Authentication → URL Configuration: Site URL `https://gefahrgut.org`; redirect URLs `https://gefahrgut.org/**`, `http://localhost:5173/**`, `http://localhost:4173/**`.
3. Authentication → Emails → Templates: paste `supabase/templates/{confirm,recovery,email_change}.html` (subjects in its README). Links extend `{{ .RedirectTo }}` (not `{{ .SiteURL }}`, which still serves WordPress), guarded by `tests/email-templates.test.ts`. **Until this is done, confirmation mails land on `/auth/fehler`.**
4. SMTP: built-in sender for testing (only delivers to Supabase org members, a few mails/hour); a real sender before launch.
5. ~~End-to-end check~~ — passed 2026-09-29. Items 1–3 are done in the dashboard; item 4 (real SMTP) is open.

### Parked by the owner on 2026-09-29 (do not start without being asked)

1. Live test of the password-reset mail flow (signup itself passed end-to-end).
2. Admin notification on new signups (DB webhook → mail) — activation is manual, nobody is told.
3. Self-host Google Fonts (`routes/+layout.svelte`).
4. Impressum/Datenschutz links in the `(app)` and `(auth)` layouts.
5. Impressum + Datenschutzerklärung on WordPress still render the "Under Construction" splash (owner, WordPress side).
6. Real SMTP sender (Brevo or the mail host; SPF/DKIM for gefahrgut.org).

Landing page since 2026-09-29: only the Stoffsuche card is live; the other five feature cards and the
comparison section carry a grayed "Demnächst verfügbar" badge (guarded in `tests/landing-page.test.ts`).
Un-gray a card when its tool ships.

### Other code work still open

- Visual pass on the landing page + auth pages in a browser (never done after the Nuxt→SvelteKit port).
- F-05 dashboard proper (current one is a shell with placeholders). The "Regelwerksvergleich" tile is a disabled "Demnächst verfügbar" card until F-10 ships — re-link it then (and update `tests/dashboard-page.test.ts`).
- F-02 1000-Punkte-Rechner (pure logic in `lib/tools/…`, tests first).
- Stripe later: a webhook sets `profiles.activated_at`; no schema change needed.
- Cleanups: delete `.env.local.bak`; `multimodal-tool.html` at repo root is an old static prototype.

**Process that worked:** brainstorming → spec in `docs/superpowers/specs/` → plan in `docs/superpowers/plans/` → TDD with `pnpm test` per task → Svelte MCP autofixer on every `.svelte`/`.svelte.ts` → `pnpm check` → `pnpm build` + preview smoke test. Independent pure modules parallelise well across subagents; give each a fixed type contract first (`bookTypes.ts` served that role) so their files stay disjoint.

## Key Notes

- **i18n:** UI supports de / en / fr / tr via `LABELS` in `lib/multimodal/types.ts` — no i18n module.
- **Current state (2026-09-29):** SvelteKit rewrite + auth/entitlement (F-04) shipped and signup verified live; ADR book viewer code-complete at `/regelwerk/adr` (not deployed). Public: `/`, `/login`, `/registrieren`, `/passwort-vergessen`, `/passwort-neu`, `/auth/confirm`, `/auth/fehler`. Login required: `/dashboard`, `/suche`, `/un/:nummer`, `/regelwerk/adr` (guard in `hooks.server.ts` → `/login?next=…`). 554 tests green, `pnpm check` 0 errors. Both migrations are applied and verified live (trigger, anon/locked = 0 rows, activated = full data). Still open: Supabase dashboard configuration — see spec §6 and the readiness report.
- **Data flow:** `/un/:nummer` loads on the server via `locals.supabase` and passes `initialData` to `MultimodalTool`; `/suche` queries client-side via `data.supabase`; SV texts load lazily on the client. Landing demo and locked mode use `DEMO_DATA`/`DEMO_SVS` from `types.ts` (no database).
- **Demo constants (2026-09-28):** `DEMO_DATA` and `DEMO_SVS` are **generated from the live BAM tables** for UN 1203 sequence 1 — never hand-edit them. The earlier hand-written values were wrong in nearly every field, including the special provision codes. `DEMO_SVS` is keyed `MODE:code` because the same code carries different official text per mode; SV 664's text is abridged with a `[…]` marker to keep the landing bundle small. `DEMO_DATA.ADN` is empty on purpose, matching what `fetchCompareForUn` returns. `pickSvText()` in `types.ts` is the single home of the language fallback chain (tr reads en first) — reuse it, don't reimplement it.
- **Auth flow:** email confirmation and password recovery go through `/auth/confirm?token_hash=…&type=…&next=…` (server-side `verifyOtp`); the Supabase email templates (`supabase/templates/`) link there by extending `{{ .RedirectTo }}` with `{{ .TokenHash }}` (spec §6). Rate limits: login 10/IP/15 min, register + reset 5/IP/hour. Registration and reset never reveal whether an address exists.
- **SEO invariant:** the visible FAQ and the FAQPage JSON-LD both render from `FAQ_ITEMS` in `lib/landing/faq.ts` — never let them diverge. Site facts (16.730 entries, 1.354 SVs, 5 free searches) must stay consistent across meta description, FAQ, SeoContent, and `static/llms.txt`.
- **ADR book viewer rules:** the book is a **file**, never in Postgres and never in `static/`. It therefore has **no RLS backstop** — the explicit `isActive` check in the page load and both endpoints *is* the gate, so any new reader must repeat it (`api.ts` carries that comment). Generated HTML may only carry `book-*` class names: Tailwind v4 scans `src/**` and cannot see classes produced at runtime, which is the failure `tests/tailwind-classes.test.ts` guards. Each worker holds its own ~25 MB index, so budget per worker or pin the route.
- **The ADR source file is OCR-corrupted** — eleven spellings of Table A's header in one 300-line stretch. Treat its text as untrusted even though we author the file, keep the "kein rechtsverbindlicher Text" disclaimer prominent, and never compare its content against the database to judge the database (the DB comes from the official BAM feed and is authoritative).
- **Known no-op kept for parity:** `Features.svelte` builds `hover:border-[${color}]` at runtime; Tailwind can't see it, so it produces no CSS (same as before the rewrite).
