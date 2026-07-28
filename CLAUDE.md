# Dangerous Goods Platform – CLAUDE.md

## Project Overview

A specialized web platform for **Gefahrgutbeauftragte** (dangerous goods officers) providing access to regulatory frameworks (ADR, RID, IMDG, ICAO, ADN, UN) as an active working tool — not just a static reference.

**Brand & domain:** **gefahrgut.org** (never "GefahrgutProfi" — old name, fully removed). The live domain currently hosts a WordPress coming-soon page plus a German blog (25+ pages, `gefahrgut.org/<slug>/`) that will be migrated into this app later. Legal pages (`/impressum`, `/datenschutz`) live on the WordPress site and are linked absolutely.

**Core differentiator:** Cross-transport-mode regulatory comparison (ADR vs. RID vs. IMDG vs. ICAO vs. ADN) — unique in the market. This is a **Phase 1 MVP feature**, not a later addition.

**Data source:** BAM (Bundesanstalt für Materialforschung und -prüfung) – GEFAHRGUT database, License: dl-de/by-2-0 (attribution required, modifications must be marked).

## Tech Stack

- **Framework:** Nuxt 4 + TypeScript
- **UI:** Nuxt UI v4 + Tailwind CSS v4
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Package Manager:** pnpm
- **Hosting:** Netcup (Node.js / Docker + PM2)
- **SSL:** Let's Encrypt via Caddy
- **PDF generation:** Puppeteer
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

**Pricing is undecided.** Known: a free tier with 5 search requests per month, plus one paid tier (price TBD — announced to the waitlist first). The landing page has **no pricing section** — it collects waitlist signups instead. Long-term direction: Freemium → individual → Team/Business (multi-user, API access).

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run vitest suite (102 tests)
pnpm test:watch   # Vitest watch mode
pnpm generate     # Static generation
pnpm preview      # Preview production build
```

## Project Structure

```
app/
  app.vue
  pages/
    index.vue               # Landing page: SEO head (useSeoMeta + 4 JSON-LD graphs) + section list
    search.vue              # Live search page (public) — useSearch + MultimodalTool
    un/
      [nummer].vue          # UN detail page — wraps MultimodalTool with un-number prop
  components/
    landing/
      Navbar.vue            # Links: Funktionen/Regelwerke/Warteliste/Blog; brand gefahrgut.org
      Hero.vue
      Stats.vue
      Features.vue
      Comparison.vue
      MultimodalDemo.vue    # Embeds MultimodalTool in demo mode (id="demo")
      SeoContent.vue        # Long-form SEO copy section
      Waitlist.vue          # Waitlist form (id="waitlist") — name/email/consent/honeypot
      DataSource.vue
      Faq.vue               # details/summary accordion over FAQ_ITEMS
      Cta.vue
      Footer.vue
    multimodal/
      MultimodalTool.vue    # Full comparison UI (props: demo?, unNumber?)
      MultimodalSvsAccordion.vue  # SV accordion — lazy-loads texts (props: mode, lang)
  composables/
    useMultimodalTool.ts    # All state + logic for comparison tool; loadCompare() hits Supabase
    useSearch.ts            # /search state: debounce, MIN_QUERY_LENGTH=2, UN-prefix match, race guard
    useSpecialProvisions.ts # Cached lazy loader for SV texts (module-level cache, de/en/fr)
    useWaitlist.ts          # Waitlist form state; POSTs to /api/waitlist
  utils/
    multimodal.ts           # Entry interface, LABELS i18n, DEMO_DATA, constants
    multimodalMappers.ts    # Per-mode row→Entry mappers + fetchCompareForUn(client, un)
    landingFaq.ts           # FAQ_ITEMS (7 German Q&As) — shared by Faq.vue AND FAQPage JSON-LD
    structuredData.ts       # SITE_URL + JSON-LD builders (Organization/WebSite/SoftwareApplication/FAQPage)
server/
  api/
    waitlist.post.ts        # Only Nitro route: validate → rate-limit → service-role insert
  utils/
    waitlistValidation.ts   # Pure validateWaitlistInput()
    rateLimit.ts            # Pure createRateLimiter() — in-memory sliding window
tests/                      # vitest — see Testing section
public/
  llms.txt                  # AI-crawler summary of the site
  og-image.png              # 1200×630 placeholder (solid navy) — replace with designed image
csvbase/
  dgg-daten-adr-un/         # ADR 2025 — 3,374 entries
  dgg-daten-rid-un/         # RID 2025 — 3,350 entries
  dgg-daten-icao-un/        # ICAO 2025 — 3,528 entries
  dgg-daten-imdg-un/        # IMDG Amdt. 42-24 — 3,246 entries
  dgg-daten-un-un/          # UN Recommendations — 3,232 entries
  # No ADN data in BAM dataset. Total: 16,730 entries (the marketing claim "21.770" was wrong)
scripts/
  import-regulations.ts     # Reads BAM TSV + SV text files, upserts into Supabase
supabase/
  config.toml
  migrations/
    20260524183401_initial_schema.sql   # All entry tables + supporting tables + RLS policies
    20260728120000_sv_text_languages.sql # special_provisions: + text_en, text_fr
    20260728130000_waitlist.sql          # waitlist table — RLS on, ZERO policies (server-only)
docs/
  database-schema-and-import-plan.md
  schema-diagram.html       # Visual ERD — open in browser
  superpowers/              # specs + plans from feature work
```

## Data / CSV Import

- **Format:** Tab-separated `.txt` files (not comma-separated despite name), ISO-8859-1 encoding, CRLF line endings
- **ADN:** Not available in BAM dataset — no `adn_entries` table in the current migration. ADN tab in the UI always renders empty.
- **Multi-value columns:** Source CSVs use numbered siblings (`S_SV1`…`S_SV11`). These must be collapsed into `TEXT[]` arrays — the Supabase CSV importer cannot do this. The Node.js import script handles this.
- **Special provisions:** individual `.TXT` plain-text files, named `<LANG>_<MODE>_<code>.TXT` where LANG is `D` (German), `E` (English), `F` (French). The importer merges languages into one row per mode+code (`text_de`/`text_en`/`text_fr`). Language availability: ADR de+en+fr, RID/IMDG de+en, ICAO/UN en only. **No Turkish SV texts exist** — the UI falls back (tr prefers en). 1,354 provisions total. IMDG's SV dir sits one level deeper (`Amdt. 42-24/Sondervorschriften`).
- **Yearly update:** Download new CSVs from BAM, run `pnpm import:regulations` — `UNIQUE (un_number, sequence_number)` ensures safe re-runs
- **Script:** `scripts/import-regulations.ts` — requires `NUXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`

## Database Schema (Supabase / PostgreSQL)

Five entry tables, one per transport mode. All created in Phase 1:

| Table | Mode | Source file | Rows |
|-------|------|-------------|------|
| `adr_entries` | Road (ADR 2025) | ADR25_csv.txt | ~3,374 |
| `rid_entries` | Rail (RID 2025) | RID25_csv.txt | ~3,350 |
| `imdg_entries` | Sea (IMDG Amdt. 42-24) | IMDG25_csv.txt | ~3,246 |
| `icao_entries` | Air (ICAO 2025) | ICAO25_csv.txt | ~3,528 |
| `un_entries` | UN Recommendations | UN23_csv.txt | ~3,232 |

Supporting tables: `special_provisions` (mode, code, text_de/text_en/text_fr), `segregation_matrix`, `segregation_codes`, `waitlist`

**RLS:** All entry tables have `public read` policies — `anon` can SELECT without auth. **Exception: `waitlist`** has RLS enabled with deliberately ZERO policies — only the server (service role via `/api/waitlist`) can read/write it.

**View `un_comparison`:** UNION ALL of all entry tables, but exposes only a thin slice (`hazard_class`, `packing_group`, `cat`, `kemler`, `ems`, `stowage_category`) — **not enough to populate the full `Entry` interface**. The multimodal tool bypasses the view and fans out parallel queries to the entry tables directly (`fetchCompareForUn`). Supabase flags this view as `SECURITY DEFINER`; either drop it or recreate with `security_invoker = true` before launch.

Full schema in `docs/database-schema-and-import-plan.md`.

## Testing

- **Runner:** vitest via `defineVitestConfig` from `@nuxt/test-utils/config` (`vitest.config.ts`); tests live in `tests/`, run with `pnpm test`
- **Nuxt environment:** test files that touch auto-imports, composables, or components MUST start with `// @vitest-environment nuxt`. Pure-function tests (utils, server/utils) run in plain node — no comment needed.
- **Mocking Supabase:** use `mockNuxtImport('useSupabaseClient', () => mockFn)` from `@nuxt/test-utils/runtime` with a `vi.hoisted` mock fn. `vi.stubGlobal` does NOT work for auto-imports (the transform resolves them via `#imports`). `$fetch` IS a real global — `vi.stubGlobal('$fetch', ...)` works for it.
- **Pages:** mount with `mountSuspended` (supports `route:` option); stub heavy children via `global.stubs` (e.g. `MultimodalTool`)
- **Every new feature ships with tests** — the user explicitly requires this
- `tests/tailwind-classes.test.ts` scans templates for Tailwind utilities that silently compile to nothing (e.g. v2-era `placeholder-{color}`)

## Coding Conventions

- **Variable names:** English only — no German variable/field names in code
- **Entry interface fields:** English camelCase (e.g. `hazardClass`, not `klasse`; `packingGroup`, not `vp_gruppe`)
- **LABELS keys:** English camelCase (e.g. `specialProvisions`, not `svs_title`)
- **Composable pattern:** Logic lives in composables (`useMultimodalTool`), components handle rendering only
- **Tailwind v4 + `@apply`:** Requires `@reference "tailwindcss"` at the top of any `<style scoped>` block that uses `@apply`

## Key Notes

- Nuxt 4 app structure: source files live in `app/` directory
- i18n: UI supports de / en / fr / tr via `LABELS` constant in `utils/multimodal.ts` — no i18n module used for regulation data
- Supabase runtime config keys are set via environment variables (`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`); the server-only service key uses `runtimeConfig.supabaseServiceRoleKey` with an empty default — **production must set `NUXT_SUPABASE_SERVICE_ROLE_KEY`** (runtime env; never baked into the build)
- **Current state (July 2026):** schema migrated + all data seeded (16,730 entries, 1,354 SVs incl. en/fr). Working public routes: `/` (landing with waitlist, FAQ, JSON-LD SEO), `/search` (live search), `/un/:nummer`. Waitlist API live. 102 tests green. Auth/dashboard/tools not started.
- **Data flow:** `MultimodalTool.vue` takes either `demo` (hardcoded) or `unNumber` (calls `loadCompare` → `fetchCompareForUn` → 4 parallel queries against entry tables). Client queries Supabase directly via `@nuxtjs/supabase`; the ONLY Nitro route is `POST /api/waitlist` (rate-limited 5/IP/h, honeypot, service-role insert — captcha slot marked for later).
- **Rate-limit IP:** the route keys on the LAST `x-forwarded-for` hop — the reverse proxy (Caddy) must append the real client IP (its default). Trusting the first hop is a bypass.
- **Auth gating:** `@nuxtjs/supabase` redirects to `/login` by default. Public routes are listed in `nuxt.config.ts` → `supabase.redirectOptions.exclude` (currently `/`, `/un/**`, `/search`). Add new public routes there.
- **SSR caveat:** `/un/:nummer` loads data client-side via `onMounted`. Fine for dev; switch to `useAsyncData` before launch for SEO.
- **Tailwind v4 dev gotcha:** files created AFTER the dev server started are sometimes never scanned — their utility classes silently produce no CSS (page looks half-unstyled). Fix: `touch app/assets/css/main.css` or restart `pnpm dev`.
- **SEO invariant:** the visible FAQ (`Faq.vue`) and the FAQPage JSON-LD both render from `FAQ_ITEMS` in `utils/landingFaq.ts` — never let them diverge (Google requirement). Site facts (entry counts etc.) must stay consistent across meta description, FAQ, SeoContent, and `public/llms.txt`.
