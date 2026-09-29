# gefahrgut.org

Web platform for Gefahrgutbeauftragte (dangerous goods officers): UN number search and cross-mode comparison of ADR, RID, IMDG and ICAO, based on the BAM GEFAHRGUT database (license dl-de/by-2-0). Public landing page; the product is behind an email/password login and stays in a demo-only locked mode until an account is activated manually (`profiles.activated_at`).

Stack: SvelteKit 2 · Svelte 5 · Tailwind CSS 4 · Supabase · pnpm.

## Setup

```bash
pnpm install
cp .env.example .env   # Supabase URL + publishable key; service-role key only for the import script
pnpm dev
```

Note: Vite loads `.env.local` with priority over `.env`. Do not keep a placeholder template under that name.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | dev server |
| `pnpm build` | production build (adapter-node → `build/`) |
| `pnpm preview` | serve the production build locally |
| `pnpm check` | svelte-check type check |
| `pnpm test` | vitest suite |
| `pnpm import:regulations` | import BAM CSVs + special provisions into Supabase |
| `pnpm deploy:test` / `pnpm deploy:rollback` | deploy to / roll back the VPS |

## Deployment

The app runs as a Docker container behind nginx + certbot on a Netcup VPS:

```bash
cp .deploy.env.example .deploy.env   # DEPLOY_HOST, DEPLOY_USER
pnpm deploy:test                     # build image → ship over SSH → switch → /healthz → auto-rollback
pnpm deploy:rollback                 # back to the previous image
```

Server setup, nginx and certificates: `docs/deploy/` (runbook) and `deploy/` (compose file,
env template, nginx configs). Runtime settings live in `/etc/gefahrgut/app.env` on the server —
see `deploy/app.env.example`. `REGISTRATION_MODE` decides whether `/registrieren` creates
accounts (`open`) or collects launch notifications (anything else).

## Docs

- `docs/STATUS.md` — where the project stands, next steps, go-live blockers
- `docs/README.md` — index of designs and plans
- `CLAUDE.md` — architecture, conventions and rules
