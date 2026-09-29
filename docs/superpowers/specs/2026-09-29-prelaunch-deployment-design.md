# Pre-launch Mode + Test Deployment — Design

**Date:** 2026-09-29
**Status:** approved in conversation (parts 1–3); written spec awaiting owner review.

## Goal

Put a working test version of gefahrgut.org on a Netcup VPS so the owner and hand-made test
users can use the real app, while the public can only leave an email address to be told at
launch. After go-live, registration opens again by changing one environment variable.

## Decisions (owner, 2026-09-29)

| Topic | Decision |
|---|---|
| Registration | **Only "Registrieren" is closed.** It leads to a launch-notification form. "Anmelden" works normally. |
| Test users | Created by hand in the Supabase dashboard ("Auto Confirm User"), then `profiles.activated_at` set. New signups disabled in Supabase. |
| Form fields | **Email only** + required consent checkbox. |
| Double opt-in | **Not now.** Addresses are collected with a recorded consent; SMTP and the DOI confirmation come later. |
| Hosting | New Netcup VPS (not booked yet), Ubuntu 24.04 LTS, ≥ 2 GB RAM, location Germany. |
| App runtime | **Docker** (app container only). |
| Web server | **nginx + certbot on the host** (owner wants to learn the industry standard). Replaces the Caddy plan in `CLAUDE.md`. |
| Domains | Test at `neu.gefahrgut.org`; later the apex points to the VPS; WordPress moves to `blog.gefahrgut.org` (stays at Strato) and is later migrated into the app. |
| ADR book | **Deployed to the test server**, reachable only by activated test users. Listed as a go-live blocker (source + licence). |
| Learning | The owner is new to DNS/TLS/nginx: every server step is documented and explained. |

## Out of scope

SMTP and the DOI confirmation mail; Stripe; migrating the blog into SvelteKit; CI/CD
pipelines; a container registry; monitoring beyond the health check; HSTS preload.

---

## 1. Registration mode

`src/lib/server/registrationMode.ts`:

```ts
export type RegistrationMode = 'waitlist' | 'open'
/** Reads REGISTRATION_MODE at runtime ($env/dynamic/private). Anything but 'open' is 'waitlist'. */
export function registrationMode(): RegistrationMode
```

Fail-closed: an unset, misspelt or empty variable means `waitlist`, so a forgotten variable
can never open registration. The root `+layout.server.ts` adds `registrationOpen: boolean`
to its data, so the landing page and the auth pages can choose their copy.

### 1.1 `/registrieren`

- New `+page.server.ts` `load` returns `{ mode }`.
- The existing default action branches on the mode **on the server**:
  - `open` → today's `signUp` flow, unchanged.
  - `waitlist` → the notification flow (§1.2). A hand-built POST with password fields gets
    the same notification handling or a validation error — it can never create an account.
- The page renders the registration form or the notification form from `data.mode`.

### 1.2 Notification flow

Fields: `email`, `consent` (checkbox, required), `website` (honeypot, visually hidden,
`tabindex="-1"`, `autocomplete="off"`).

1. Rate limit: 5 per IP per hour (own limiter instance, same helper as registration).
2. Honeypot filled → return the success state without writing anything.
3. `validateEmail()` (existing) and consent required → `fail(400, { error })` with the
   existing German messages (`invalid_email`, `consent_required`).
4. `locals.supabase.rpc('join_launch_list', { p_email, p_consent_version: CONSENT_VERSION })`.
5. Success **and** "already on the list" return the identical state: *"Danke! Wir
   benachrichtigen dich, sobald gefahrgut.org startet."* An RPC error → `fail(500)` with the
   generic message.

`CONSENT_VERSION` (e.g. `'2026-09-29'`) and the consent sentence live together in
`src/lib/prelaunch/consent.ts`, so the stored version always names the text that was shown.
Consent text (German, links to the privacy page):
*"Ich möchte per E-Mail informiert werden, wenn gefahrgut.org startet. Meine Adresse wird nur
dafür gespeichert; ich kann jederzeit widersprechen. Details in der
[Datenschutzerklärung]."*

### 1.3 Copy in waitlist mode

| Place | `open` | `waitlist` |
|---|---|---|
| Landing navbar CTA, `Cta` section, footer link, meta description | "Jetzt registrieren" | "Zum Launch benachrichtigen" |
| Login page footer | "Noch kein Konto? Registrieren" | "Noch kein Konto? Zum Launch benachrichtigen" |
| `/registrieren` heading | Registrierung | "Benachrichtigung zum Start" |

"Anmelden" is unchanged everywhere. All links keep pointing at `/registrieren`.
`static/llms.txt` is not changed (it describes the product, and the link stays valid).

## 2. Storage — migration `20260929120000_launch_signups.sql`

```sql
create table public.launch_signups (
  id              bigint generated always as identity primary key,
  email           text not null unique
                  check (email = lower(btrim(email)) and length(email) between 6 and 254),
  consent_version text not null check (length(consent_version) between 1 and 40),
  consented_at    timestamptz not null default now(),
  confirmed_at    timestamptz,          -- set by the later double opt-in
  created_at      timestamptz not null default now()
);
alter table public.launch_signups enable row level security;   -- and NO policies
revoke all on table public.launch_signups from anon, authenticated;

create function public.join_launch_list(p_email text, p_consent_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_email is null or length(p_email) > 254
     or lower(btrim(p_email)) !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  insert into public.launch_signups (email, consent_version)
  values (lower(btrim(p_email)), p_consent_version)
  on conflict (email) do nothing;
end;
$$;
revoke all on function public.join_launch_list(text, text) from public;
grant execute on function public.join_launch_list(text, text) to anon, authenticated;
```

- **Nothing is readable** through the API: no policy, no grant. The owner reads the list in the
  table editor or with SQL.
- **Honest limit:** the function has to be callable with the publishable key, which the app
  also uses, so anyone can call it directly and bypass the app's rate limit. The damage is junk
  rows (unique emails, validated shape, no reads). They are cleanable, and the later DOI mail
  filters them out. Closing this fully would need the service-role key in the app, which was
  removed on purpose in September.
- The app still does **not** use the service-role key.
- Applied to the hosted project with the owner's approval (Supabase MCP `apply_migration`, or
  `execute_sql` plus a `schema_migrations` row as on 2026-09-04).

## 3. Container

- **`Dockerfile`**, two stages on `node:22-bookworm-slim`:
  1. *build*: `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm build` with build
     args `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (they are
     `$env/static/public`, baked into the bundle; both are public values), then
     `pnpm prune --prod`.
  2. *runtime*: copies `build/`, the production `node_modules` and `package.json`; runs as
     the unprivileged `node` user; `EXPOSE 3000`; `CMD ["node", "build"]`; a `HEALTHCHECK`
     that fetches `/healthz` with Node's built-in `fetch`.
- **`.dockerignore`**: `node_modules`, `.svelte-kit`, `build`, `.env*` (except `.env.example`),
  `csvbase`, `tests`, `docs`, `.superpowers`, `.git`. The book and all secrets stay out of every image.
- **`src/routes/healthz/+server.ts`**: `GET` → `200 text/plain "ok"`. Outside the `(app)`
  group, touches neither Supabase nor the book.
- **`deploy/compose.yaml`** (copied to `/opt/gefahrgut/` on the server):
  - `image: gefahrgut-app:${IMAGE_TAG}`, `restart: unless-stopped`
  - `ports: ["127.0.0.1:3000:3000"]` — reachable only by nginx on the same host. Docker
    publishes ports **around** `ufw`, so binding to 127.0.0.1 is what keeps the app private.
  - `env_file: /etc/gefahrgut/app.env` (never in the repo): `ORIGIN`, `ADDRESS_HEADER=X-Forwarded-For`,
    `XFF_DEPTH=1`, `REGISTRATION_MODE=waitlist`, `ADR_BOOK_PATH=/data/adr.md`
  - `volumes: ["/var/lib/gefahrgut/ADR2025-konsolidiert.md:/data/adr.md:ro"]`
  - `mem_limit: 512m`; json-file logging with `max-size: 10m`, `max-file: 3`
- **`deploy/app.env.example`**: the template for `/etc/gefahrgut/app.env`, with comments.

## 4. Server (host)

Documented as a runbook in `docs/deploy/`, not automated (the owner runs it and learns it):

1. User with sudo, SSH key login only (`PasswordAuthentication no`, `PermitRootLogin no`).
2. `ufw`: allow 22, 80, 443; enable.
3. `unattended-upgrades` for security updates.
4. Docker Engine + compose plugin from Docker's apt repository; the deploy user is in the `docker` group.
5. nginx from Ubuntu; site file from `deploy/nginx/gefahrgut.conf`:
   - port 80: serves `/.well-known/acme-challenge/` and redirects everything else to HTTPS
   - port 443: certificate paths from certbot; `proxy_pass http://127.0.0.1:3000`; headers
     `Host`, `X-Forwarded-For $proxy_add_x_forwarded_for`, `X-Forwarded-Proto $scheme`
   - on `neu.gefahrgut.org`: `add_header X-Robots-Tag "noindex, nofollow" always;`
   - every directive commented in German/English plain language for the owner
6. certbot (`certbot --nginx -d neu.gefahrgut.org`), a deploy hook `systemctl reload nginx`, and
   `certbot renew --dry-run` as the acceptance check.
7. `/var/lib/gefahrgut/` holds the ADR file (copied by `scp`, outside every release).

`XFF_DEPTH=1` is correct because nginx appends exactly one hop (the real client) to
`X-Forwarded-For`; `getClientAddress()` then returns that address for the rate limiters.

## 5. Deploying

`scripts/deploy.sh` (run from the owner's machine), exposed as `pnpm deploy:test` and
`pnpm deploy:rollback`. Reads `DEPLOY_HOST` / `DEPLOY_USER` from a gitignored `.deploy.env`.

1. Prints the git hash and `git status --short`, so the owner sees what is being shipped. It
   does not block on uncommitted changes, because the owner commits by hand.
2. `docker build` with the two public build args from `.env`, tag `YYYYMMDD-HHMM-<git short sha>`.
3. `docker save | gzip | ssh … 'gunzip | docker load'` — no registry account.
4. On the server: write `IMAGE_TAG` into `/opt/gefahrgut/.env`, keep the previous tag in
   `/opt/gefahrgut/.previous-tag`, `docker compose up -d`.
5. Poll `http://127.0.0.1:3000/healthz` over SSH for 30 s. Failure → print the container logs
   and switch back to the previous tag automatically.
6. `deploy:rollback` switches to the previous tag and restarts.
7. Images older than the last three are pruned.

## 6. Rollout

**Phase A — test at `neu.gefahrgut.org`** (now)
- Strato DNS: `A` (and `AAAA` if the VPS has IPv6) for `neu` → VPS.
- Server runbook §4, certificate for `neu.gefahrgut.org`, first `pnpm deploy:test`.
- Supabase: add `https://neu.gefahrgut.org/**` to the redirect URLs; disable new signups;
  create test users (Auto Confirm) and set `activated_at`.
- Migration from §2 applied.

**Phase B — blog to `blog.gefahrgut.org`** (owner, WordPress at Strato)
- Create the subdomain on the Strato hosting, change the WordPress site/home URL, run a
  search-and-replace plugin for internal links and media.
- **Impressum and Datenschutzerklärung online**; the privacy page covers the launch list.
- App: legal links switch to `https://blog.gefahrgut.org/impressum/` and
  `/datenschutzerklaerung/` (footer, consent texts), with a test.

**Phase C — apex to the VPS** (only after B)
- **Legacy redirects:** read the WordPress sitemap while it is still reachable, generate
  `src/lib/server/legacyRedirects.ts` (a `Set` of ~219 paths). `hooks.server.ts` answers a
  listed path with `301 https://blog.gefahrgut.org<path><search>` before the auth guard. A
  test asserts no listed path equals an app route.
- The day before: TTL of the apex and `www` records down to 300 s.
- Switch `A`/`AAAA` for `gefahrgut.org` and `www` to the VPS. **MX records untouched.**
- certbot for `gefahrgut.org` + `www.gefahrgut.org`; nginx: `www` → 301 apex,
  `neu` → 301 apex; `noindex` header removed on the apex.
- Supabase Site URL stays `https://gefahrgut.org`.
- HSTS (`max-age` only, no `preload`) after a few stable days.

## 7. Testing

- `registrationMode`: default, `open`, garbage values → `waitlist`.
- `/registrieren` action: waitlist mode never calls `signUp` (even with password fields);
  honeypot → success without RPC; invalid email / missing consent → 400; RPC called with
  normalised email and `CONSENT_VERSION`; RPC error → 500; rate limit → 429; open mode
  unchanged (existing tests keep passing).
- Page/copy: registration page, landing page and login page in both modes.
- Migration static guard (pattern of `tests/migration-harden-grants.test.ts`): RLS enabled,
  no `create policy`, table revoked from anon/authenticated, function `security definer`
  with `search_path = ''`, execute granted to anon, revoked from public, `on conflict do nothing`.
- `/healthz` returns 200 "ok" without touching `locals.supabase`.
- Deploy files static guard: compose binds `127.0.0.1:3000`, mounts the book read-only,
  uses `env_file`; `.dockerignore` excludes `csvbase` and `.env`; Dockerfile runtime stage
  sets `USER node`.
- Phase C: legacy redirect table test (collision + 301 target) when it is built.
- Manual acceptance: `docker build` locally, container starts and answers `/healthz`; on the
  server `curl -I https://neu.gefahrgut.org` shows a valid certificate; `certbot renew --dry-run` passes.

## 8. Go-live blockers (not needed for the test phase)

1. **ADR book:** source document named and licence confirmed — otherwise remove the file
   from the server before launch (spec 2026-09-28 §11.1).
2. **SMTP + double opt-in:** configure a real sender (SPF/DKIM at Strato), send the DOI mail to
   every collected address; only confirmed ones get the launch mail.
3. **`REGISTRATION_MODE=open`** and Supabase signups re-enabled.
4. **Legal:** Impressum and Datenschutzerklärung final; AGB before any payment.
5. Phase C done (apex, redirects, certificates).

## 9. Docs to update when built

`CLAUDE.md`: Tech Stack hosting line (nginx + certbot + Docker instead of PM2 + Caddy),
environment variables (`REGISTRATION_MODE`, `.deploy.env`), commands (`deploy:test`,
`deploy:rollback`), structure (`deploy/`, `docs/deploy/`, `healthz`, `prelaunch/`), Key Notes
(pre-launch mode, launch list, go-live blockers).
