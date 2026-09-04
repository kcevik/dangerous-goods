# gefahrgut.org

Web platform for Gefahrgutbeauftragte (dangerous goods officers): UN number search and cross-mode comparison of ADR, RID, IMDG and ICAO, based on the BAM GEFAHRGUT database (license dl-de/by-2-0). Public landing page; the product is behind an email/password login and stays in a demo-only locked mode until an account is activated manually (`profiles.activated_at`).

Stack: SvelteKit 2 · Svelte 5 · Tailwind CSS 4 · Supabase · pnpm.

## Setup

```bash
pnpm install
cp .env.example .env   # fill in Supabase URL, publishable key, service-role key
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

## Production

```bash
pnpm build
ORIGIN=https://gefahrgut.org \
ADDRESS_HEADER=X-Forwarded-For XFF_DEPTH=1 \
PORT=3000 \
PUBLIC_SUPABASE_URL=… PUBLIC_SUPABASE_PUBLISHABLE_KEY=… \
node build
```

`ORIGIN` is required for form actions and for the confirmation-mail redirect URLs. `ADDRESS_HEADER`/`XFF_DEPTH` make `getClientAddress()` return the right-most `X-Forwarded-For` hop that Caddy appends, which the auth rate limiters key on. Apply migrations with `supabase db push`; Supabase dashboard setup (email provider, redirect URLs, token-hash email templates, SMTP) is listed in `docs/superpowers/specs/2026-09-04-auth-and-entitlement-design.md` §6. See `CLAUDE.md` for architecture and conventions.
