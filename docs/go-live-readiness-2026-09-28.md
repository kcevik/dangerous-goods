# gefahrgut.org — Readiness Report

**Date:** 2026-09-28
**Scope:** read-only audit of `/home/dilli/projects/dangerous-goods` (SvelteKit app), the live `gefahrgut.org` WordPress site, and the hosted Supabase project `nmigeqhrquzmdxjeuite`.
**Nothing in the repo was changed.** No git commands that write were run.

---

## 0. Highest-priority blockers

| # | Blocker | Bar | Evidence | Size |
|---|---|---|---|---|
| 1 | **The working tree does not compile.** `pnpm check` → 5 errors, `pnpm test` → 28 failures in 4 files. The in-flight special-provision fix removed `SvText` / `pickSvText` from `types.ts` but four other files still import them. No build, no deploy, no demo. | B1 | `src/lib/multimodal/types.ts` (mtime 17:45 today), `specialProvisions.svelte.ts:2`, `MultimodalSvsAccordion.svelte:4`, `tests/multimodal-i18n.test.ts:11` | hours |
| 2 | **The legal pages the app links to are unreachable.** `https://gefahrgut.org/impressum/` and `/datenschutzerklaerung/` both return HTTP 200 but render **only** the "Under Construction" splash — no Anbieterkennzeichnung, no privacy policy, for any user agent. The Footer and the registration consent checkbox link there. | B1 + B2 | `src/lib/landing/Footer.svelte:24-25`, `src/routes/(auth)/registrieren/+page.svelte:89`; verified by fetching both URLs | hours (WordPress side) |
| 3 | **Registration has never worked end to end and cannot today.** `auth.users` = 0 and `profiles` = 0 in production: not one account has ever been created. The three Supabase email templates still lack `{{ .TokenHash }}`, so every confirmation mail lands on `/auth/fehler`. No real SMTP. | B1 + B2 | Supabase `select count(*) from auth.users` → 0; spec §6 of `docs/superpowers/specs/2026-09-04-auth-and-entitlement-design.md` | hours |
| 4 | **The landing page sells four features that do not exist, and shows invented regulatory values as warnings.** For UN 1203 the real data is LQ `1 L` for ADR **and** RID **and** IMDG, and packing group `II` in all four modes. The mockup claims `5 L` / `5 L` / `1 L` and ICAO `I`, and flags two "Abweichungen" that do not exist. | B1 | `src/lib/landing/Comparison.svelte:9-15,109` vs. live query on `adr/rid/imdg/icao_entries where un_number='1203'` | hours |
| 5 | **Google Fonts is loaded from Google's servers**, unconditionally, with no consent layer. This is the textbook German GDPR exposure (LG München I, 3 O 17493/20). The WordPress site already blocks it behind a consent API; the SvelteKit app is a regression. | B2 (arguably B1) | `src/routes/+layout.svelte:19-21` — `fonts.googleapis.com`, `fonts.gstatic.com` | 1 h |
| 6 | **Supabase organisation is on the `free` plan.** No automated backups / PITR, free-tier auth email caps, and free projects are paused on inactivity. Not a platform you can charge German businesses on. | B2 | `get_organization` → `{"plan":"free","tier":"tier_free"}` | hours + recurring cost |
| 7 | **No way to take money and no contract.** No payment provider, no price, no AGB (footer AGB link is `href="#"`), no Widerrufsbelehrung, activation is the owner editing `profiles.activated_at` by hand. | B2 | `src/lib/landing/Footer.svelte:26`; spec §1 | days |
| 8 | **Zero deployment assets in the repo.** No PM2 `ecosystem.config`, no Caddyfile, no systemd unit, no deploy script, no CI, no Dockerfile. The entire deployment story is a 6-line shell snippet in `README.md`. `.env.example` omits four of the six required variables. | B2 | repo-wide search; `.env.example` (4 lines) vs. `CLAUDE.md` env table | ~1 day |
| 9 | **Domain cutover is far bigger than assumed.** The live site is not "25+ pages": `post-sitemap.xml` lists **196 URLs** and `page-sitemap.xml` lists **23 pages**, including a parallel toolset already at `/un-suche/`, `/multimodal/`, `/bk-rechner/`, `/freigrenzen/`, `/sv-browser/`, `/zusammenladung/`, `/tunnel/`, `/kemler/`, `/checkliste/`, `/befoerderungsdokument/`, `/pflichten/`, `/verpackung/`, `/quiz/`, `/recherche-cockpit/`, `/meine-tools/`, plus `/nutzungsbedingungen/`, `/haftungsausschluss/`, `/cookie-richtlinie/`, `/kontakt/`. Pointing the domain at the app 404s all of them. | B2 | `https://gefahrgut.org/sitemap_index.xml` and children | days |
| 10 | **The live coming-soon page contradicts the product and the business model.** It advertises "21,770 entries across 5 transport modes" (real: 16,730 across 4 usable modes) and "12 professional tools – **free of charge**" while the plan is one paid tier with no free tier. It is also in English. | B1 + B2 | `https://gefahrgut.org/` splash text | 1 h |

---

## A. "What steps are needed next?" — the development backlog, in order

Sizes are rough and assume the owner working alone.

### A0 — Unblock the tree (do this first, today)

1. **Finish the in-flight special-provision fix.** `hours.` `types.ts` no longer exports `SvText` or `pickSvText`, but `specialProvisions.svelte.ts`, `MultimodalSvsAccordion.svelte` and `tests/multimodal-i18n.test.ts` still import them. Land the refactor, then update the three now-wrong test expectations: `multimodal-i18n.test.ts` still asserts *"provides German, English and French text for every demo provision"* and *"the three languages differ from each other"*, which can no longer hold — the new `DEMO_SVS` correctly carries `textFr: null` for RID/IMDG and `textDe: null` for ICAO, because BAM only ships French for ADR. The assertion, not the data, is what is wrong.
   Good news: the same change already set `DEMO_DATA.ADN = []` with the comment *"BAM ships no ADN data, so the real app always renders this tab empty — the demo must match"* (`types.ts:175`). That closes the fabricated-ADN-demo problem and the fabricated-SV-text problem in one go.
2. **Get back to green:** `pnpm test` (233 tests, currently 28 red) and `pnpm check` (currently 5 errors). `CLAUDE.md` claims "226 tests green, check clean" — that is now stale and should be corrected once the tree is fixed. `hours.`

### A1 — Truthfulness pass on the landing page (before anyone sees a link)

3. **Comparison section.** `hours.` Either build the promised behaviour or stop promising it. The four bullets in `Comparison.svelte:3-8` — automatic difference detection, colour highlighting, PDF export for audits, integrated transport assistant — are all unbuilt. The right-hand table is a hardcoded array whose "deviations" are factually wrong (see blocker 4). Cheapest honest fix: replace the mockup with the real `MultimodalTool demo` output (it is already embedded 40 lines above in `MultimodalDemo.svelte`), and cut the bullets down to what ships.
4. **Remove or qualify ADN everywhere in the copy.** `hours.` The data will never exist from BAM. Currently promised in: `Hero.svelte:16` badge, `Comparison.svelte` heading paragraph and table row, `MultimodalDemo.svelte:20` subheading ("…ICAO und ADN automatisch verglichen"), `Stats.svelte` ("5 Regelwerke"), and `types.ts:39` `MODALS`. The tool itself handles it correctly — the ADN tab renders greyed with `disabled` and a `–` (`MultimodalTool.svelte:133,158`) — so only the marketing lies.
5. **Fix the numbers.** `1 h.` `Stats.svelte` says "2.347+ UN-Nummern" and `Features.svelte` says "2.347+ Stoffe"; the real figure is ~3,374 ADR entries / ~3,232 UN numbers, and every other surface says 16.730. "< 300ms Antwortzeit" is an unmeasured SLA claim. "100% BAM-Datenbasis" is fine; **"BAM-zertifizierte Datenbasis"** (`Hero.svelte:2`) is not — BAM publishes the data, it certifies nothing, and to a Gefahrgutbeauftragte that phrasing reads as a false accreditation claim (UWG §5 risk).
6. **`un_entries` is invisible.** `hours.` 3,232 rows are imported and counted in the advertised "16.730 Einträge", but `fetchCompareForUn` never queries them (`mappers.ts:118-136`) and `MODALS` has no UN tab. Either surface the UN Model Regulations column or stop counting it in the headline number. Note the source file is `UN23_csv.txt` — Rev. 23, not 2025, while everything else is 2025.
7. **Dead footer links.** `1 h.` `Footer.svelte`: "Änderungsmonitor", "Dokumentation", "ADR-Leitfaden", "BAM-Datenbasis" and "AGB" all point at `href="#"`. "Änderungsmonitor" is also one of the six feature cards in `Features.svelte`, and "Favoritenliste" is a seventh feature that has no code at all.

### A2 — Make the account lifecycle actually work

8. **Supabase dashboard configuration** (owner only, cannot be automated from the repo) — spec §6. `1-2 h.` Email provider + confirm-email + min length 10; Site URL and the three redirect URLs; the three email templates rewritten to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…&next=…`; real SMTP. Then run the §6 step-5 end-to-end test. Until this is done there is no product to show, because no one can get in.
9. **Legal + consent links inside the product.** `hours.` Neither `(app)/+layout.svelte` nor `(auth)/+layout.svelte` nor `/auth/fehler` contains a single Impressum or Datenschutz link. German Anbieterkennzeichnung has to be reachable from every page with two clicks; right now it is reachable only from the public landing footer. Add a small legal footer to both layouts.
10. **Self-host the font.** `1 h.` Drop `Plus Jakarta Sans` woff2 files into `static/`, add an `@font-face` block to `app.css`, delete the three `<link>` tags in `src/routes/+layout.svelte`. This removes the only third-party request the app makes and thereby removes the need for a cookie/consent banner entirely (the Supabase auth cookies are technisch notwendig under §25 Abs. 2 TDDDG and need no consent). Do this before B1, not after — it is an hour and it eliminates a whole compliance workstream.

### A3 — Make the product worth logging into

11. **Visual pass on landing + auth pages in a real browser.** `1 day.` Never done since the Nuxt→SvelteKit port. Note `Features.svelte:78,82` builds `hover:border-[${feature.color}]` and `group-hover:bg-[${feature.color}]` at runtime — Tailwind cannot see these, so they compile to nothing and the hover states silently do not exist. `CLAUDE.md` knowingly keeps this "for parity"; that parity is with a bug.
12. **F-05: a real dashboard.** `2-3 days.` Today it is two cards plus four dashed "in Vorbereitung" placeholders (`(app)/dashboard/+page.svelte`). For a first customer it should show recent/starred UN numbers and at least one working tool.
13. **F-02: 1000-Punkte-Rechner.** `2-3 days.` Pure logic in `lib/tools/`, tests first. This is the single highest-value tool for the target user, it needs no new data, and it is the cheapest way to stop looking like a database viewer.
14. **Search is ADR-only and fails silently.** `1 day.` `SearchState.#search` queries only `adr_entries` (`search.svelte.ts:88`), so anything that exists in IMDG/ICAO but not ADR is unfindable — and the results header literally says "Ergebnisse (ADR)". Worse, the `catch` block sets `results = []` (line 105), so a database or RLS error renders as **"Keine Ergebnisse für „…"**. A customer whose account was just deactivated would be told the substance does not exist. Surface an error state.
15. **F-03 document generator / F-07 SV browser / F-06 duty checker.** `weeks.` Phase-1 scope on paper, not started. These are what justifies a subscription over a free PDF of the ADR.

### A4 — Operational foundation (details in §D below)

16. Supabase paid plan + backups. `hours.`
17. Deployment assets: PM2 config, Caddyfile, systemd unit, deploy script, complete `.env.example`. `1 day.`
18. Error monitoring + uptime check. `hours.`
19. Domain cutover plan with redirects for 219 existing URLs. `2-3 days.`
20. Payment: Stripe Checkout + webhook onto `profiles.activated_at`, AGB, Widerruf, invoices. `1-2 weeks including the legal text.`

---

## B1. The SHOW-TO-SOMEONE bar

Goal: hand a colleague or a prospect a link and have them come away impressed. They will not sign a contract, so the commercial and most of the legal machinery can wait — but anything visibly false or broken cannot.

**Hard requirements (nothing below is optional):**

| # | What | Why it is on this list | Size |
|---|---|---|---|
| B1.1 | Land the in-flight SV fix; `pnpm test` and `pnpm check` green; `pnpm build` + preview smoke test | The app does not currently type-check. Backlog A0. | hours |
| B1.2 | Configure the Supabase email templates + SMTP and complete one real registration yourself | `auth.users` = 0. If your prospect registers today, the confirmation mail sends them to `/auth/fehler` and the demo is over. Backlog A2.8. | 1-2 h |
| B1.3 | Fix or remove the Comparison mockup and the four unbuilt promises; remove ADN from the copy; fix "2.347+", "< 300ms", "BAM-zertifiziert" | Your audience is Gefahrgutbeauftragte. They will read UN 1203 LQ "5 L" flagged as a deviation, know it is wrong, and stop trusting the data. This is the item that would actually cost you the customer. Backlog A1.3-A1.5. | hours |
| B1.4 | Put the real Impressum and Datenschutz content back online (disable the under-construction plugin for at least those two pages) and add legal links to the `(app)` and `(auth)` layouts | A German visitor clicking "Impressum" and getting an English "Under Construction" splash is both an embarrassment and abmahnfähig the moment the link is public. Backlog A2.9. | hours |
| B1.5 | Self-host the font | 1 hour, removes the consent question entirely. Backlog A2.10. | 1 h |
| B1.6 | Decide what the locked state says, and pre-activate the person you are showing it to | Today a prospect who registers sees an amber "noch nicht freigeschaltet" banner, a dashboard of dashed placeholders, and a demo limited to UN 1203. That is the confusing outcome you want to avoid. Set their `activated_at` **before** you send the link. | minutes |
| B1.7 | One browser pass over landing + auth + dashboard at 1280px and on a phone | Never done since the port. Backlog A3.11. | hours |
| B1.8 | Fix the dead footer links (`href="#"` × 5) or remove those rows | Five dead links on the only public page reads as abandoned. | 1 h |

**Explicitly NOT needed for B1:** payment, price, AGB, Widerrufsbelehrung, Supabase paid plan, PM2/Caddy/systemd files (you can show it from `pnpm preview` over a temporary host, or deploy by hand once), backups, monitoring, the domain cutover, the 1000-Punkte-Rechner, F-03.

**Realistic B1 estimate: 3-5 focused days**, of which the fix list above is ~2 days and the browser/visual pass is the rest.

**One strong recommendation:** do B1 on a subdomain — `app.gefahrgut.org` or `beta.gefahrgut.org` — and leave the WordPress site on the apex. That decouples B1 entirely from blocker 9 (219 URLs), lets you keep the blog's SEO, and means the real Impressum only has to be un-hidden on WordPress rather than rebuilt in the app. You also get the domain cutover as a later, separate, reversible decision instead of a launch-day cliff.

---

## B2. The GO-LIVE bar (taking money from German business customers)

Everything in B1, plus:

### B2.1 Contract and commercial layer — **not started, and the largest single gap**

- **There is no way to pay.** No Stripe, no price, and activation is the owner typing a timestamp into the Supabase table editor. That is workable for the first five customers if you are honest that it is manual (invoice by email, activate by hand) — but it means: no self-service signup, no automated dunning, no cancellation flow, and every activation and deactivation is a manual step you must remember. It does **not** block go-live legally; it blocks go-live *at any volume*. Budget 1-2 weeks for Stripe Checkout + a webhook onto `profiles.activated_at` (no schema change needed, as the spec correctly notes).
- **No AGB.** The footer's AGB link is `href="#"`. You cannot form a paid contract without terms. WordPress already has `/nutzungsbedingungen/` and `/haftungsausschluss/` — start from those, but they were written for a free tool and will not cover a subscription.
- **No Vertragsschluss flow.** Registration collects only a Datenschutz consent (`registrieren/+page.svelte:89`). A paid signup needs AGB acceptance, the price shown before the button, and — if you sell to *any* natural person (a freelance Gefahrgutbeauftragter is often a Verbraucher) — a §312j BGB compliant button ("Zahlungspflichtig bestellen") and a Widerrufsbelehrung with the digital-content waiver. If you decide to sell strictly B2B, say so explicitly in the AGB and gate registration on a business declaration; otherwise assume consumer law applies.
- **No invoicing.** German customers will expect a §14 UStG invoice. Stripe Tax/Invoicing handles this; nothing in the repo does.
- **A disclaimer that means something.** The footer's "Kein Ersatz für rechtliche Beratung. Alle Angaben ohne Gewähr." is the right instinct but is not a limitation of liability in a paid contract, and "ohne Gewähr" is largely unenforceable against a paying customer under §§307 ff. BGB. A product that tells a Gefahrgutbeauftragte the wrong tunnel code has real downstream liability. Get the AGB drafted by a lawyer, and mark BAM-derived modifications as the dl-de/by-2-0 licence requires (the licence says modifications must be marked; I found the attribution in the footer and `llms.txt`, but **no modification marking anywhere** — and the import script does normalise the source data).

### B2.2 Data protection — concrete items

- **Impressum (§5 DDG):** must name the Anbieter, legal form, address, email, and a Verantwortlicher nach §18 MStV for the blog content. Currently unreachable (blocker 2). Because the app will run on its own origin, decide whether the Impressum lives in the app or stays on WordPress; if it stays on WordPress, the absolute links in `Footer.svelte` are fine but `https://gefahrgut.org/datenschutz` 301-redirects to `/datenschutzerklaerung/` — link the canonical URL directly.
- **Datenschutzerklärung:** must be rewritten for the app, not reused from the WordPress site. It has to name: Supabase as Auftragsverarbeiter (auth, database, storage), Netcup as hosting Auftragsverarbeiter, the auth cookies and their purpose, the legal basis for processing (Art. 6(1)(b) for the account, (f) for rate-limiting IPs), retention, and the data subject rights.
- **AV-Vertrag with Supabase (Art. 28 GDPR):** **not evidenced anywhere in this repo.** Supabase offers a DPA; the owner must accept/sign it in the dashboard (Organization → Legal Documents) and keep the copy. Same for Netcup — netcup provides an AV-Vertrag through the customer control panel.
- **Region: good news.** The Supabase project is in `eu-central-1` (Frankfurt), Postgres 17.6. That removes the third-country transfer problem for the database itself. It does *not* remove it for Supabase Inc. as a US-parent processor — the DPA plus their SCCs are what covers that, which is exactly why B2.1's AV-Vertrag item matters. Also worth documenting: the auth emails are sent by whichever SMTP provider you choose, so pick an EU one (or add it to the AV register).
- **Cookie/consent:** after self-hosting the font (A2.10), the app sets only Supabase auth cookies. Those are strictly necessary — **no consent banner is required**. This is a real advantage over the WordPress site and you should keep it that way: do not add Google Analytics. If you want analytics, use a cookieless EU-hosted option.
- **Verzeichnis von Verarbeitungstätigkeiten (Art. 30)** and a decision on whether you need a DSB (unlikely as a one-person operation, but document the reasoning).

### B2.3 Supabase advisors — what I actually ran

`get_advisors(security)` on `nmigeqhrquzmdxjeuite` returns exactly one lint, `pg_graphql_authenticated_table_exposed` (WARN), for 9 objects: the 5 regulation tables, `special_provisions`, `segregation_matrix`, `segregation_codes`, `profiles`. **This is a false positive for this design and needs no action.** It fires because the `authenticated` role holds table-level `SELECT`, which is exactly what the `activated read` policy requires; RLS still returns zero rows to a locked user, and `profiles` is restricted to `auth.uid() = id`. The one thing worth doing is a sentence in the deployment notes saying so, so a future advisor run does not trigger a panic refactor. If you want it to go quiet, disable the GraphQL endpoint (`pg_graphql`) — the app uses PostgREST only, so nothing breaks.

`get_advisors(performance)` returns one INFO lint, `unused_index`, for 8 indexes: `idx_rid_un_number`, `idx_un_un_number`, `idx_adr_sv_codes`, and the five `*_name_fts` GIN indexes. **Also not actionable.** These are unused because the app has effectively had no traffic (0 registered users), not because they are wrong. Note though that the five FTS indexes will *stay* unused: `SearchState.#search` uses `ilike '%…%'`, which cannot use a `to_tsvector` GIN index. If search ever gets slow, the fix is `pg_trgm` + a GIN trgm index (or the Meilisearch plan), not the indexes that exist. Do not drop them yet; revisit after real traffic.

**No advisor found a real problem.** The RLS work from 2026-09-04 holds up: I confirmed row counts are reachable only through an activated profile, and `is_activated()` is the only gate.

### B2.4 Deployment — what the repo provides: essentially nothing

Searched the whole repo. There is **no** `ecosystem.config.js`/`.cjs`, **no** `Caddyfile`, **no** `.service` unit, **no** deploy script, **no** `.github/workflows`, **no** Dockerfile. The only deployment documentation is the `## Production` block in `README.md` (a `pnpm build` and a `node build` invocation with inline env vars). For a Netcup + PM2 + Caddy target you are missing:

- `ecosystem.config.cjs` with `script: 'build/index.js'`, `env` (ORIGIN, PORT, ADDRESS_HEADER, XFF_DEPTH, both PUBLIC_* vars), `instances: 1`. **Keep `instances: 1`**: `createRateLimiter` (`src/lib/server/rateLimit.ts`) is an in-process `Map`, so PM2 cluster mode would give each worker its own login rate limit — a 10/15min limit silently becomes 10×N. Also note the limits reset on every deploy.
- `pm2 save` + `pm2 startup` so the app survives a reboot (or a systemd unit instead of PM2 — pick one and write it down).
- A Caddyfile with the reverse proxy, `X-Forwarded-For` handling that matches `XFF_DEPTH=1`, HSTS, and a `handle` block for the static assets.
- A deploy script or at minimum a documented sequence (`git pull; pnpm install --frozen-lockfile; pnpm build; pm2 reload`). Remember `PUBLIC_*` vars are **baked at build time** by `$env/static/public` — building on the wrong machine or without `.env` produces a silently broken bundle.
- **`.env.example` is incomplete.** It has 3 of the 7 variables: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Missing: `ORIGIN` (without it form actions reject every POST — i.e. nobody can log in), `ADDRESS_HEADER`, `XFF_DEPTH`, `PORT`. `CLAUDE.md` documents all seven; the template does not. This is the most likely cause of a broken first deploy.
- **Minor but real:** `supabase/config.toml` declares `major_version = 15` while the hosted database is Postgres **17**. `supabase db diff`/`db push` uses that for the shadow database, so migration tooling may misbehave. Also `.nuxtrc` (dead), `multimodal-tool.html` (old static prototype, 36 KB at the repo root) and `.env.local.bak` are leftovers that will confuse anyone who opens the repo.

### B2.5 Operational basics

- **Backups: none.** The org is on the `free` plan, which has no automated backups and no PITR. For a database that is the whole product this is the item I would fix first in B2 — upgrade to Pro (daily backups + 7-day PITR) *before* the first paying customer. Note the regulation data is re-creatable from `csvbase`, but `profiles` and `auth.users` are not.
- **`csvbase/` is gitignored** (`.gitignore:25`). The BAM source files exist only on the owner's machine. If that disk dies, the yearly update path and any re-import dies with it. Put them in object storage or a private repo.
- **Error monitoring: none.** No Sentry, no logging beyond PM2's stdout. A server-side `load` that throws currently produces a SvelteKit 500 page and nothing else. At minimum add `handleError` in `hooks.server.ts` writing to a file, ideally Sentry (EU region).
- **Uptime: none.** A free external check (UptimeRobot/Better Stack) on `/` and on `/login` is 10 minutes of work. Also relevant because of the free-plan pausing behaviour.
- **Yearly BAM update — the plan is thinner than `CLAUDE.md` suggests.** `pnpm import:regulations` is idempotent thanks to `UNIQUE (un_number, sequence_number)`, but: (a) the hardcoded paths in `scripts/import-regulations.ts:35-48` embed both the year and the IMDG amendment (`ADR25_csv.txt`, `Amdt. 42-24`, `UN23_csv.txt`) — a 2027 dataset means editing the script; (b) upsert **never deletes**, so a UN number withdrawn from the new edition stays in the database forever, silently served as current law; (c) there is no version/edition column, so you cannot tell a customer which edition a row came from, and you cannot support "what changed" — which is exactly what the advertised "Änderungsmonitor" feature would need. Adding an `edition` column before the first paid customer is much cheaper than retrofitting it after.
- **Dead tables.** `segregation_matrix` and `segregation_codes` exist, are RLS-protected, and contain **0 rows**; the import script never populates them (it only fills the `segregation_codes` TEXT[] column on IMDG entries). Either fill them or drop them — a reviewer will read them as unfinished work.

### B2.6 SEO, content, and the domain cutover

- **`static/robots.txt`** is `User-Agent: *` / `Disallow:` — allows everything, no `Sitemap:` line. The live WordPress robots.txt *does* point at `sitemap_index.xml`. Deploying the app to the apex replaces the good robots.txt with the worse one and removes the sitemap reference.
- **No sitemap route.** There is no `src/routes/sitemap.xml` and no `+page.server.ts` generating one. The app has exactly one indexable URL (`/`); everything else is `noindex` — `(app)/+layout.svelte:10`, `(auth)/+layout.svelte:8`. So **the app has no SEO surface at all**, while the WordPress blog has 196 indexed posts. The `/un/[nummer]` pages carry canonical tags and per-substance meta descriptions (`un/[nummer]/+page.svelte`) but sit behind the login and behind `noindex` — that meta work is currently dead code. Decide deliberately: either UN pages are public and indexable (huge long-tail SEO, undermines the paywall) or they are not (then delete the canonical/meta code, or at least stop pretending).
- **`static/og-image.png`:** 1200×630, correct dimensions, but only 3.6 KB for a full-bleed 8-bit RGB PNG — that compresses to 3.6 KB only if it is near-flat colour. `CLAUDE.md` calls it a placeholder and the file size corroborates that. It is referenced as both the OG image and the `Organization` logo in JSON-LD (`structuredData.ts:11`). Replace it. `1 h.`
- **`static/llms.txt`** is accurate and well-written, and notably contradicts `CLAUDE.md`'s own "SEO invariant" note, which still mentions "5 free searches" — a fact that exists nowhere in the code any more. Fix the note, not the file.
- **Cutover risk (blocker 9).** 196 blog posts + 23 pages = 219 live URLs, at least 15 of which are *tool* pages that a returning visitor will expect to still work. A hard switch to the SvelteKit app 404s all of them and destroys the blog's rankings. Options, best first: **(1) subdomain** — app on `app.gefahrgut.org`, WordPress stays on the apex; zero cutover risk, and you can migrate the blog later at leisure. **(2) Caddy path split** — apex to WordPress for the blog/legal paths, to the app for `/`, `/login`, `/un/*`, …; workable but the root path collision needs a decision and the config is fiddly. **(3) Full migration** — move all 196 posts into the app and write 219 301-redirects; days of work, and the blog is not what earns revenue. I think the owner's current plan (point the domain at the app, migrate the blog "later") is the wrong one, for exactly this reason: it front-loads the highest-risk, lowest-value part of the launch.

### B2.7 Things that would embarrass the owner or create exposure if a customer saw them today

Ranked by how bad:

1. **Invented regulatory data presented as a warning.** `Comparison.svelte` tells a compliance professional that UN 1203 has LQ 5 L under ADR and packing group I under ICAO, and flags "Achtung: IMDG und ICAO weichen von ADR ab". The real data in the owner's own database says LQ 1 L across ADR/RID/IMDG and PG II in all four modes. A Gefahrgutbeauftragte will spot this in seconds, and it discredits the entire dataset.
2. **"Impressum" leading to an English "Under Construction" splash.** Abmahnfähig the moment the link is public, and it is already public.
3. **The live splash promising "12 professional tools – free of charge"** while the plan is a single paid tier. That is a public promise you will have to visibly break, and it will be screenshotted.
4. **"21,770 entries"** on the live page vs. 16,730 real. The discrepancy is large enough to look like deliberate inflation.
5. **"BAM-zertifizierte Datenbasis."** BAM does not certify this product. In the German market this reads as claiming an official accreditation you do not have.
6. **Four features advertised as existing that are not built** (difference detection, colour highlighting, PDF export "für Audits", transport assistant), plus two feature cards with no code (Änderungsmonitor, Favoritenliste).
7. **Silent search failure.** A logged-in customer whose account is not activated, or whose session broke, is told "Keine Ergebnisse für „Benzin"" rather than what actually happened (`search.svelte.ts:105`).
8. **Five `href="#"` links in the public footer**, one of which is AGB.
9. **`multimodal-tool.html`** — a 36 KB static prototype sitting at the repo root. Harmless to customers, bad for anyone you hire or partner with.

---

## C. Where I am uncertain

- **Whether the WordPress Impressum/Datenschutz content actually exists behind the splash.** Both URLs have distinct page titles and distinct response bodies, so real pages exist; I could not see their content because the under-construction plugin intercepts every request. It may be a matter of adding two path exclusions rather than writing them from scratch.
- **Exact Supabase free-tier backup semantics.** I read the plan as `free` from `get_organization`; I did not read the dashboard's backup page. Verify in Project Settings → Database → Backups before assuming anything is recoverable.
- **Whether an AV-Vertrag with Supabase and Netcup already exists.** Nothing in the repo evidences one either way; this can only be checked in the two provider dashboards.
- **Whether the intended customer is strictly B2B.** This determines whether §312j BGB and the Widerrufsrecht apply. I assumed they might, because freelance Gefahrgutbeauftragte are common.
- **The OG image.** I inferred "placeholder" from 3.6 KB at 1200×630 plus `CLAUDE.md`'s own note; I did not view it.
- **The exact scope of the in-flight SV-text fix.** I read the working tree mid-edit (`types.ts` modified minutes before this audit). The failing tests and type errors are that edit in progress, not pre-existing rot — but the 28 failures should be re-read once it lands, because `landing-page.test.ts` failing all 7 of its cases (including the FAQPage/SEO invariant) is a broader blast radius than a data-only change should produce, and may indicate a second problem hiding behind the import errors.

---

## D. Recommended order of work, condensed

1. **Today:** finish the SV fix; `pnpm test` + `pnpm check` green. (hours)
2. **This week:** Supabase email templates + SMTP; register an account yourself end to end; self-host the font; un-hide Impressum + Datenschutzerklärung on WordPress; add legal links to the app layouts. (2 days)
3. **Then:** the truthfulness pass — Comparison mockup, ADN copy, numbers, "BAM-zertifiziert", dead footer links; rewrite the live splash. (2 days)
4. **Then:** browser/visual pass. → **B1 reached.** Show it from `app.gefahrgut.org`, with your viewer's account pre-activated. (1-2 days)
5. **Then, in parallel:** 1000-Punkte-Rechner (the thing that makes it a tool, not a viewer) and a real dashboard. (1 week)
6. **Before the first invoice:** Supabase Pro + backups; deployment assets + complete `.env.example`; error monitoring + uptime; AV-Verträge; app-specific Datenschutzerklärung; AGB from a lawyer; edition column on the regulation tables. (1-2 weeks, mostly waiting on the lawyer)
7. **Then:** Stripe Checkout + webhook → `profiles.activated_at`, invoicing, and only then consider the domain cutover with its 219 redirects. (2-3 weeks)
