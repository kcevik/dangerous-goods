# Dangerous Goods Platform – CLAUDE.md

## Project Overview

A specialized web platform for **Gefahrgutbeauftragte** (dangerous goods officers) providing access to regulatory frameworks (ADR, RID, IMDG, ICAO, ADN, UN) as an active working tool — not just a static reference.

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

Freemium → Starter/Pro (individual) → Team/Business (multi-user, multi-tenant, API access)

Premium features: regulatory comparison, PDF generator, change monitor, AI assistant, API access.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm generate   # Static generation
pnpm preview    # Preview production build
```

## Project Structure

```
app/
  app.vue
  pages/
    index.vue               # Landing page
    un/
      [nummer].vue          # UN detail page — wraps MultimodalTool with un-number prop
  components/
    landing/
      Navbar.vue
      Hero.vue
      Stats.vue
      Features.vue
      Comparison.vue
      MultimodalDemo.vue    # Embeds MultimodalTool in demo mode
      DataSource.vue
      Pricing.vue
      Cta.vue
      Footer.vue
    multimodal/
      MultimodalTool.vue    # Full comparison UI (props: demo?, unNumber?)
      MultimodalSvsAccordion.vue  # Collapsible special provisions
  composables/
    useMultimodalTool.ts    # All state + logic for comparison tool; loadCompare() hits Supabase
  utils/
    multimodal.ts           # Entry interface, LABELS i18n, DEMO_DATA, constants
    multimodalMappers.ts    # Per-mode row→Entry mappers + fetchCompareForUn(client, un)
csvbase/
  dgg-daten-adr-un/         # ADR 2025 — 3,374 entries
  dgg-daten-rid-un/         # RID 2025 — 3,350 entries
  dgg-daten-icao-un/        # ICAO 2025 — 3,528 entries
  dgg-daten-imdg-un/        # IMDG Amdt. 42-24 — 3,246 entries
  dgg-daten-un-un/          # UN Recommendations — 3,232 entries
  # No ADN data in BAM dataset
scripts/
  import-regulations.ts     # Reads BAM TSV, upserts into Supabase (see pnpm import:regulations)
supabase/
  config.toml
  migrations/
    20260524183401_initial_schema.sql   # All entry tables + supporting tables + RLS policies
docs/
  database-schema-and-import-plan.md
  schema-diagram.html       # Visual ERD — open in browser
```

## Data / CSV Import

- **Format:** Tab-separated `.txt` files (not comma-separated despite name), ISO-8859-1 encoding, CRLF line endings
- **ADN:** Not available in BAM dataset — no `adn_entries` table in the current migration. ADN tab in the UI always renders empty.
- **Multi-value columns:** Source CSVs use numbered siblings (`S_SV1`…`S_SV11`). These must be collapsed into `TEXT[]` arrays — the Supabase CSV importer cannot do this. The Node.js import script handles this.
- **Special provisions:** ~2,600 individual `.TXT` plain-text files across all modes, loaded into `special_provisions` table
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

Supporting tables: `special_provisions`, `segregation_matrix`, `segregation_codes`

**RLS:** All entry tables have `public read` policies — `anon` can SELECT without auth.

**View `un_comparison`:** UNION ALL of all entry tables, but exposes only a thin slice (`hazard_class`, `packing_group`, `cat`, `kemler`, `ems`, `stowage_category`) — **not enough to populate the full `Entry` interface**. The multimodal tool bypasses the view and fans out parallel queries to the entry tables directly (`fetchCompareForUn`). Supabase flags this view as `SECURITY DEFINER`; either drop it or recreate with `security_invoker = true` before launch.

Full schema in `docs/database-schema-and-import-plan.md`.

## Coding Conventions

- **Variable names:** English only — no German variable/field names in code
- **Entry interface fields:** English camelCase (e.g. `hazardClass`, not `klasse`; `packingGroup`, not `vp_gruppe`)
- **LABELS keys:** English camelCase (e.g. `specialProvisions`, not `svs_title`)
- **Composable pattern:** Logic lives in composables (`useMultimodalTool`), components handle rendering only
- **Tailwind v4 + `@apply`:** Requires `@reference "tailwindcss"` at the top of any `<style scoped>` block that uses `@apply`

## Key Notes

- Nuxt 4 app structure: source files live in `app/` directory
- i18n: UI supports de / en / fr / tr via `LABELS` constant in `utils/multimodal.ts` — no i18n module used for regulation data
- Supabase runtime config keys are set via environment variables (`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`)
- **Current state:** schema migrated + data seeded in hosted Supabase. Landing page lives with a hardcoded UN 1203 demo. `/un/:nummer` is a working public route that queries Supabase live.
- **Data flow:** `MultimodalTool.vue` takes either `demo` (hardcoded) or `unNumber` (calls `loadCompare` → `fetchCompareForUn` → 4 parallel queries against entry tables) — no Nitro API routes; client queries Supabase directly via `@nuxtjs/supabase`.
- **Auth gating:** `@nuxtjs/supabase` redirects to `/login` by default. Public routes are listed in `nuxt.config.ts` → `supabase.redirectOptions.exclude` (currently `/`, `/un/**`). Add new public routes there.
- **SSR caveat:** `/un/:nummer` loads data client-side via `onMounted`. Fine for dev; switch to `useAsyncData` before launch for SEO.
