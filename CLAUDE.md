# Dangerous Goods Platform – CLAUDE.md

## Project Overview

A specialized web platform for **Gefahrgutbeauftragte** (dangerous goods officers) providing access to regulatory frameworks (ADR, RID, IMDG, ICAO, ADN, UN) as an active working tool — not just a static reference.

**Core differentiator:** Cross-transport-mode regulatory comparison (ADR vs. RID vs. IMDG vs. ICAO vs. ADN) — unique in the market.

**Data source:** BAM (Bundesanstalt für Materialforschung und -prüfung) – GEFAHRGUT database, License: dl-de/by-2-0 (attribution required, modifications must be marked).

## Tech Stack

- **Framework:** Nuxt 4 + TypeScript
- **UI:** Nuxt UI v4 + Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Package Manager:** pnpm
- **Hosting:** Netcup (Node.js / Docker + PM2)
- **SSL:** Let's Encrypt via Caddy
- **PDF generation:** Puppeteer
- **Search (Phase 2):** Meilisearch

## Development Phases

### Phase 1 – MVP (ADR only)
- F-01: UN number search (ADR)
- F-02: 1000-point calculator (ADR 1.1.3.6)
- F-03: Document generator (Beförderungspapier, Schriftliche Weisungen, Checklists)
- F-04: User management & login (Supabase Auth)
- F-05: Dashboard
- F-06: ADR duty checker (Sollte)
- F-07: Special provisions browser ADR 3.3 (Sollte)
- F-08: Packaging instructions browser ADR 4.1.4 (Sollte)

### Phase 2 – Multi-regulation
- F-09: RID, IMDG, ICAO, ADN data
- F-10: Regulatory comparison (key differentiator)
- F-11: Transport mode assistant
- F-12: LQ/EQ calculator

### Phase 3 (future)
- AI assistant
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

## Key Notes

- Currently at scaffold stage — `app/app.vue` shows Nuxt welcome page, no pages yet
- Nuxt 4 app structure: source files live in `app/` directory
- i18n module is installed — UI language approach TBD
- Supabase runtime config keys are set via environment variables
