# Project status

**Last updated:** 2026-11-24 · **Tests:** 1376 green (100 files) · `pnpm check` 0 errors (6 known CSS-linter warnings on `@reference`/`@apply` in `MultimodalTool.svelte`) · `pnpm build` OK

This is the one place for "where do we stand". Stable rules and conventions live in
`CLAUDE.md`; designs and plans are indexed in `docs/README.md`. Update this file at the end of
every working session.

**Merged into `main` (2026-11-23):** #1 nav (burger menu), #2 account page (`/konto`), #3 comparison
(responsive cards), #4 landing/search (responsive), #5 upsell (modal + banner). Migration
`20261123120000_account_page` is applied. Branch `fix/followups`: scroll + focus after account
deletion, 44 px touch targets in the app shell, docs.

**Merged later on 2026-11-23:** #7 1000-Punkte-Rechner (F-02), #8 ADR viewer fixes (counter, TOC labels,
mobile find bar, section jumps, SV landing), #10 landing claims, #11 comparison correctness (source gaps,
ICAO Y-LQ + state variations, FORBIDDEN as critical, "See SP…" not compared, IMDG IBC). Branch
`feat/adr-detail-data` (this session, PR open): Table A detail columns on the UN page, demo-data
generator, ADN hidden, 1000-Punkte card live. **Open:** #9 search synonyms — waits for the owner's
review of the synonym list.

Persona test 2026-11-23 (five simulated officers, desktop + phone): `docs/research/2026-11-23-persona-tests/`.

---

## Features

| ID | Feature | Status | Notes |
|---|---|---|---|
| F-04 | Login, accounts, manual activation | ✅ done | Signup verified end-to-end on 2026-09-29 (built-in mail sender) |
| F-04 | Account page (`/konto`) | ✅ done | Password change (re-auth), billing address, subscription status + disabled checkout placeholder, self-service deletion (spec 2026-11-23). Migration `20261123120000_account_page` applied 2026-11-23. Browser-checked 2026-11-23 at 320–1280 px with the E2E account (address save/reload, validation, wrong password, password change + restore, delete validation); real deletion tested end-to-end 2026-11-23 with the throw-away `E2E_DELETE_EMAIL` account (redirect to `/?konto=geloescht` with the notice, login afterwards fails). Fixed 2026-11-23 (`fix/followups`): `html { scroll-behavior: smooth }` animated SvelteKit's scroll reset from the delete card, so the landing page now jumps to the top instantly in `afterNavigate` and focuses the notice (`role="status"`, `tabindex="-1"`). Verified with tests and a browser run whose delete POST was answered in the browser with a fake redirect (no real deletion; the throw-away account is consumed) |
| — | Sales modal + banner for locked accounts | ✅ done | `lib/upsell/`: `<dialog>` modal on the first `(app)` page view, then at most every 10 min on navigation (`UpsellThrottle`, last-shown time in localStorage); a slim banner (pitch, price, "Jetzt freischalten" → `/konto#abo`) replaces the old lock banner. Never for active accounts, never on `/konto`, never outside `(app)`. Price **125 € pro Monat inkl. MwSt.** set 2026-11-23 in `LEGAL_FACTS` (+ billing period "monatlich im Voraus"), read via `planPrice()` by the modal, banner, `/konto` Abo card and AGB. The page-level `LockNotice` is gone (the banner is the one lock notice; pages keep only page-specific hints). Browser-checked 2026-11-23 at 320/375/768/1280 with the locked account (first view, focus in/trap/return, Escape, "Später", throttle with a faked 11-min-old timestamp, banner under the burger header, no horizontal scroll, CTA → `/konto#abo` in view, demo data) and the activated account (no modal, no banner) |
| F-09 | ADR, RID, IMDG, ICAO data | ✅ done | 16,730 BAM entries, 1,354 special provisions; no ADN in the BAM feed. Since 2026-11-23 the UN page also shows the Table A detail columns in groups (Verpackung, Tank, Beförderung, Stauung und Trennung, Sicherung 1.10, Weitere Angaben): ADR/RID 9a, 9b MP, 10/11 T/TP, 12/13 tank code + TU/TC/TE/TA/TT/TM, ADR 14 vehicle, 16–19 V/W, VC/AP, CV/CW, S, RID CE, 1.10.3 level + thresholds, N mark, compatibility group; IMDG PP/B, T/TP, H, SGG (`lib/multimodal/details.ts`). No texts for these codes in the feed, so ADR rows link to the defining ADR section (`?section=`). ADN tab hidden (one note instead) |
| F-01 | Stoffsuche (`/suche`, `/un/:nummer`) | ✅ done | Searches ADR/RID/IMDG/ICAO, one card per UN number, failed searches show an error; the tool has a variant picker (one choice for all tabs) instead of showing row 0 (spec 2026-11-08). Not yet checked in a real browser |
| F-13 | ADR book viewer (`/regelwerk/adr`) | ✅ code complete | Source named 2026-11-08: BMIMI (Austria), official German-language ADR, edition 2026-01, updated 02.01.2026; shown in the viewer's attribution |
| — | Pre-launch mode + deployment | 🟢 public (2026-11-24) | `app.gefahrgut.org` on the Strato VPS (Ubuntu 26.04, 1.8 GB, no swap). Basic auth removed, `noindex` removed (landing is indexable; `(app)` pages keep their own `noindex`). Waitlist mode (`REGISTRATION_MODE=waitlist`). Caddy metrics on (`localhost:2019/metrics`, counters only, no access log); Netdata v2.13 (static build in `/opt/netdata`, stable channel, listens on 127.0.0.1 only, no Cloud; view via `ssh -L 19999:localhost:19999 deploy@app.gefahrgut.org`; its daily auto-update cron is on). Runbook `docs/deploy/README.md` |
| F-10 | Regulatory comparison (`/un/:nummer/vergleich`) | ✅ done | ADR/RID/IMDG/ICAO side by side + grey UN reference column (ADN column replaced by one note, 2026-11-23); two non-critical rows added 2026-11-23: portable tank instructions (ADR↔RID compared, IMDG shown, UN reference) and tank code (ADR↔RID); one variant choice, manual pick where no unambiguous match; labels, packing instructions and SVs compared ADR↔RID only. Own quick search (`QuickSearch`) to switch the UN number, also on `/un/:nummer`; the comparison tool no longer carries its inert search field (2026-11-08). Below `lg` one card per field (`ComparisonCards`); browser-checked 2026-11-23 at 320–1280 px on UN 1203, 1993, 1950 |
| — | Legal pages (`/impressum`, `/datenschutz`, `/agb`, `/widerruf`) | 🟡 drafts live | Texts in `src/lib/legalPages/`; draft banner + `noindex` until `LEGAL_FACTS` is complete and a lawyer has checked them (go-live blocker 4) |
| F-05 | Dashboard | ⚪ shell | Two live tiles (Stoffsuche, Regelwerksvergleich → UN 1203) |
| F-02 | 1000-Punkte-Rechner (`/tools/1000-punkte`) | ✅ done | Merged 2026-11-23 (PR #7). Open domain questions for an expert: (1) the BK-2-only limit of 333 units vs. a total of 999.9 points; (2) whether the 8.6 tunnel restrictions are lifted for a load under 1.1.3.6; (3) aerosols: mass without packaging — how the calculator should ask for it |
| F-11 | Transport mode assistant | ❌ dropped | Owner decision 2026-11-08; removed from landing page, dashboard and CLAUDE.md |
| F-03 | Document generator | ⚪ not started | |
| F-06–08 | Duty checker, SV browser, packaging browser | ⚪ not started | |

Landing page: the comparison section is live and computed from `DEMO_DATA` (no PDF/assistant claims,
ADN no longer advertised as compared, hero "Neu: Regelwerksvergleich"). Feature cards: Stoffsuche,
Regelwerksvergleich, ADR im Volltext, and 1000-Punkte-Rechner are live (the Konto card was removed 2026-11-24); only LQ/EQ-Rechner and
Dokumentengenerator carry "Demnächst verfügbar". Un-gray a card when its tool ships. `DEMO_DATA` is
generated (`pnpm generate:demo`, run 2026-11-23); the demo tool shows no ADN tab.

## Next steps (recommended order)

1. ~~Finish the test deployment~~ — done (owner, 2026-11-25: test users created, sign-ups disabled in Supabase).
2. **URGENT: sizing/zoom bugs** (owner, 2026-11-25) — several pages have inconsistent sizing/zoom; worst is the ADR book viewer ("PDF viewer"), which shows different zoom levels in places. **Fixed 2026-11-25:** the white strip/zoom in the book viewer (hit navigation) came from a footnote URL in 1.9.5 (~695 px, no break points) that widened the page; `overflow-wrap: anywhere` on `.book-window`, pinned by `tests/book-viewer-wrap.test.ts`, verified at 375 px over 40 hits — not yet deployed. **Also fixed 2026-11-25:** iPhone zoom on focusing the login email field (stayed zoomed after landing on the dashboard) — fields were `text-sm` (14 px), iOS zooms below 16 px; global rule in `app.css` for < 768 px, pinned by `tests/ios-input-zoom.test.ts`; not verified on a real iPhone, not deployed. **Sweep 2026-11-25:** 18 pages at 320/375/768 px (activated account, Chromium) — the only horizontal overflow was the h1 of `/datenschutz` and `/agb` at 320 px, fixed (`LegalPage.svelte`, `tests/legal-title-wrap.test.ts`). Tests 1380 green. WebKit not checked. Remaining: any sizing bugs only visible in Safari. Earlier note: reproduce at 320–1280 px and on iPhone Safari (viewport meta in `src/app.html`, input font-size < 16 px triggers iOS auto-zoom), then fix test-first.
3. **Bug: 1000-Punkte print button does nothing on iPhone Safari** (owner, 2026-11-25) — `PointsCalculator.svelte` calls `window.print()`; owner: tapping gives no reaction at all. 2026-11-25 stop-gap (not a root-cause fix, no iPhone here): on iOS the tap also shows a hint "Teilen → Drucken / Als PDF sichern" (`tests/points-print-hint.test.ts`). Still open: why `print()` is ignored; a real fix may be a separate print page or share sheet.
4. **Yearly import: replace instead of upsert** (code review 2026-09-29; only matters from 2027) — `scripts/import-regulations.ts` only upserts on `(un_number, sequence_number)`, so entries BAM withdraws stay in the tables and a half-failed run mixes two editions. Import into staging tables and swap, or delete rows missing from the new file in one transaction. Needed before the first yearly update (2027 editions).

**Decision 2026-11-24 (owner):** the landing page and the waitlist live at `app.gefahrgut.org`; `gefahrgut.org` only redirects there. `SITE_URL`, canonical URLs and `llms.txt` use `app.`. **Decided 2026-11-24, not yet done on the WordPress side:** leave the apex on Strato's WordPress and redirect only the exact front page `/` (302 first, 301 later; `.htaccess` `RewriteRule ^$ https://app.gefahrgut.org/ [R=302,L]` above the WordPress block, or the Redirection plugin). The 196 blog posts live at root slugs (not under `/blog/`), so nothing moves and no DNS/Caddy apex change is needed; `BLOG_URL` stays. Then: the blog's own Datenschutz/Impressum (our Datenschutz §2 still says `blog.gefahrgut.org`), and what to do with the ~15 old WordPress tool pages (`/un-suche/`, `/bk-rechner/`, `/multimodal/` …) and old legal pages (`/haftungsausschluss/` …).

**Done 2026-11-24 (legal/product, all drafts written by Claude, no lawyer yet):** Impressum + Datenschutz filled (private person, `info@gefahrgut.org`, Strato AG as mail/hosting provider, logs "14 Tagen" → journald `MaxRetentionSec=14day` set by the owner); consent text now says "widerrufen" (`CONSENT_VERSION` 2026-11-24); disclaimer in the `(app)` footer and Impressum "Haftung für Inhalte"; `/auth/confirm` is now a button page (GET never consumes the one-time token; mail scanners had used reset links up); Konto card removed from the landing page; tab icon + logo (`static/icon.png`); "Nur auf Englisch verfügbar" note on special provisions without text in the reader's language (ICAO/UN are English only in the BAM feed). Supabase DPA/TIA saved, Strato AVV saved (owner).

**2026-11-25 SEO audit follow-ups (in the repo, not deployed):** `deploy/Caddyfile` gets `encode zstd gzip` + security headers (HSTS without subdomains/preload, nosniff, X-Frame DENY, Referrer-Policy, Permissions-Policy; no CSP because of SvelteKit's inline bootstrap) — needs copying to `/etc/caddy/Caddyfile` + reload on the server (owner approval); `static/sitemap.xml` (landing page only) + `Sitemap:` in `robots.txt`; `llms.txt` no longer calls the BAM "amtlich".

**Open before/after the public waitlist:** a legal-text service or lawyer for Datenschutz + consent (AGB/Widerruf only before selling); the launch-time double-opt-in mail has no confirm endpoint yet (`confirmed_at` exists, nothing sets it); `gefahrgut.org/blog` privacy policy; the upsell throttle stores `gefahrgut.upsell.lastShown` in localStorage — needs consent under § 25 TDDDG (Datenschutz §6 says only necessary cookies), fix before real users log in; external uptime check on `/healthz` (not set up); app 5xx errors only in `docker compose logs` (check `handleError`); icon file is off-centre and the old `static/favicon.ico` is unused; backups (free plan).

## Tasks from the persona test 2026-11-24

Source: `docs/research/2026-11-24-persona-tests/` (README = summary, `p1`–`p5` = details). Scores averaged 5.4 benefit / 2.4 purchase probability; nobody would pay 125 € incl. VAT per account today.
**Owner decision 2026-11-24: the app never goes live without a working purchase path (Kaufweg).** Tasks are listed in the order to do them; each one follows the normal process (spec → test first → autofixer → `pnpm check` → build + smoke test).

**Go-live blocker (owner decides the model first, then build)**
- [ ] **T1 Kaufweg.** Today: "Jetzt freischalten" → `/konto#abo` → disabled button. Needed: price model (single seat vs. team/firm seats, net price + invoice, yearly option, early-access price — personas expect ~30–50 € net single seat, 90–250 € net firm with tools), Stripe checkout or an interim "Freischaltung anfragen" path, AGB acceptance + withdrawal waiver in checkout, cancellation button (§ 312k BGB), AGB § 7 "one person" and `[[Mindestlaufzeit]]` placeholder resolved, AVV/TOMs/subprocessor list for firm customers, Impressum phone + VAT ID.

**Product bugs (high, found by ≥2 personas or embarrassing)**
- [ ] **T2 Variant pre-selection + labels.** Analysed 2026-11-24, not built. **T2a:** UN 3481 (and likely 3091/3171) has two rows per mode with identical PG and specification, only the name differs ("contained in" / "packed with"), so `matchVariant` (`variants.ts:108`) sees two candidates → "?". Fix: tiebreak by normalised English name, only when exactly one candidate fits. **T2b:** UN 1950 is genuinely ambiguous (ADR/RID 12, ICAO 17 with a different scheme, IMDG 1) → keep "?" but explain it, shorten label starts, wrap on mobile (`VariantPicker.svelte`, `font-mono text-[11px]`), note "source English only" for ICAO. Open owner decision: preselect nothing for 1263 (today `selectedVariantIndex = 0` → PG I). UN 3481/3091/3171/1950/1263: RID/IMDG/ICAO show "? Keine eindeutige Variante", picker is English, no default, labels start with the same long text and are cut off at 375 px; PG I preselected for 1263 (also in the 1000-Punkte dropdown). Files: `lib/multimodal/variants.ts`, `VariantPicker.svelte`.
- [ ] **T3 Search.** "Lack" → black powder (substring in "BLACK POWDER"); "Xylol", "Toluol", "Epoxidharz", "Wasserlack" → no results. Word boundaries; synonyms need the owner's review (`docs/research/synonyms-review.md`). Book full-text search is substring-only ("…beauftragter" 2 hits vs "…beauftragte" 16, quoted phrases and "P 001"/"P001" differ).
- [ ] **T4 1000-Punkte-Rechner units (verify first).** UN 1965: unit "L" selectable although the hint says net mass in kg; 20 L gave 60 points without a warning (`UNITS`, `suggestUnit`, `unitHint` in `lib/points/points.ts`). Block or warn for liquefied gases; explain the variant choice for ambiguous BK (UN 1950, 1789).
- [ ] **T5 ADR viewer.** `?section=5.4.1.1.1` silently jumps to 5.4.1.1.2 and the window starts with raw Markdown (Kemler table); TOC gaps (1.2.1, "Kapitel 1.11" without title, 1.9 without subsections); no cite/permalink/print of a section.

**Medium**
- [ ] **T6 Plain text for codes.** V14, CV9, MP9, PP87, P903/P908, ICAO "See 965" shown as codes only; link to the defining ADR section (`?section=`); "Umweltgefährdend" mostly "Keine Angabe (BAM)" (check the mapper first).
- [ ] **T7 Mobile touch targets** < 44 px: checkboxes, inline links, "Weiterlesen"; verify the 20 px checkbox in the calculator.
- [ ] **T8 Languages.** Language not in the URL, EN/FR/TR half translated, Turkish SV text English (flag it).
- [ ] **T9 Locked accounts** see nothing of the calculator and the ADR viewer: a small preview instead of a wall (owner decision).

**Features the personas asked for (order by mentions)**
- [ ] **T10** Multi-UN co-loading check (7.5.2, MP codes) with a load summary (tunnel code, equipment, transport document) — P2, P5.
- [ ] **T11** Transport document generator (F-03) — P1, P5. **T12** LQ/EQ calculator (F-12) — P1. **T13** Plain-language checklist per UN number for goods receipt — P2. **T14** Lithium assistant (PI 965–970, P903, SV 188/376/377 with texts) — P4. **T15** Team/consultant licence — P1, P3, P4, P5 (part of T1).

**Marketing (after T1–T3)**
- [ ] **T16** Public 1000-Punkte-Rechner (no login, nothing stored) + 301 from the old WordPress `/bk-rechner/`. **T17** Public UN core pages as SEO entry points (details stay behind login). **T18** Blog posts link to the matching UN/rule pages. **T19** Launch-list double-opt-in mail works (confirm endpoint missing). **T20** 5–10 pilot customers (trainers, small hauliers, one lithium maker) against feedback and a quote. See the marketing section of the persona README.

## Go-live blockers (not needed for the test phase)

0. **Kaufweg (T1 above)** — owner rule 2026-11-24: no go-live without it.

1. ~~ADR book source~~ — named 2026-11-08 (BMIMI edition 2026-01, updated 02.01.2026). Official texts are free works under § 7 öUrhG / § 5 UrhG; a lawyer should confirm before launch.
2. **SMTP + double opt-in** — a real sender (SPF/DKIM at Strato); the DOI mail goes to every address in `launch_signups`; only confirmed ones get the launch mail.
3. **Open registration** — `REGISTRATION_MODE=open` and Supabase signups re-enabled.
4. **Legal** — drafts live in the app since 2026-11-08 (`/impressum`, `/datenschutz`, `/agb`, `/widerruf`, linked from every layout). They show "Entwurf – noch nicht gültig" and `noindex` until every fact in `src/lib/legalPages/facts.ts` is set. Open: the company (not founded yet) and its facts; a lawyer's review (including AGB § price clause: the price is shown gross "inkl. MwSt." for everyone, while the clause says business customers pay "zuzüglich der gesetzlichen Umsatzsteuer, soweit nicht anders angegeben" — owner decision 2026-11-23: text stays, the lawyer decides); before payments: AGB acceptance + the request to start during the withdrawal period in the checkout, a cancellation button (§ 312k BGB), and a completed Stripe section; the WordPress blog needs its own privacy policy; Caddy log retention must match the stated period; the launch list must be deleted after the launch mail (as the privacy policy promises).
5. **Rollout Phase C** — apex to the VPS, blog redirects, certificates (deployment plan Task 11).
6. **Backups** — the Supabase org is on the free plan (no backups).
7. **Leaked-password protection** — Supabase advisor finding; enable if the plan offers it.
8. ~~Self-host Google Fonts~~ — done 2026-11-08 (`@fontsource-variable/plus-jakarta-sans`, guarded by `tests/self-hosted-fonts.test.ts`).

## Owner to-dos

- Create a new throw-away `E2E_DELETE_EMAIL` account if the deletion test is to be repeated (the old one was consumed 2026-11-23).

- Book the Strato VPS; DNS `app` → VPS (apex only in Phase C; never touch MX).
- WordPress: add the front-page redirect to `.htaccess` (see Decision 2026-11-24; the blog stays at `gefahrgut.org/blog`, no move); link the app's `/impressum` and give the blog its own privacy policy.
- Legal: found the company, fill in `src/lib/legalPages/facts.ts` (address, contact, register, VAT ID, § 18 MStV person, mail sender, log retention, minimum term; price and billing period set 2026-11-23), then have all four texts checked by a lawyer.
- Pick the analytics tool, if any — it needs a consent banner and a new privacy section before it goes live.

## Parked (do not start without being asked — owner, 2026-09-29)

1. Live test of the password-reset mail flow.
2. Admin notification on new signups (DB webhook → mail); activation is manual and nobody is told.
3. ~~Self-host Google Fonts~~ (done 2026-11-08).
4. ~~Impressum/Datenschutz links in the `(app)` and `(auth)` layouts~~ (done 2026-11-08).
5. Impressum + Datenschutz on WordPress (owner side).
6. Real SMTP sender (also blocker 2).

## Touch targets 2026-11-23 — fixed (`fix/followups`)

Browser audit, all now ≥ 44×44 px at 320/768/1280 (measured with the activated E2E account; header stays 56 px, no horizontal scroll):
burger 40×40 → 44×44; app logo link 24 → 44 px tall; desktop nav links 20 → 44 px tall (Suche/Konto also 42/40 → 44 px wide);
"Abmelden" 20 → 44 px; footer legal links 16 → 44 px tall (Agb 26 → 44 px wide; `LegalLinks` is shared, so the auth and legal
footers get it too; footers' padding reduced). `QuickSearch` on `/un/:nummer` already measured 44 px on main (`min-h-11`, now pinned by a test).

## Code review 2026-09-29 — fixed

Whole-project review (verdict: ready for the test deployment with fixes). Fixed, test-first:
open redirect after login (`safeNext`); deploy rollback when `docker compose up` itself fails
(`scripts/remote-switch.sh`, behaviour-tested); `llms.txt` promised open registration; book viewer
reset every ~hour on token refresh; 538 heading anchors not in the rendered HTML (now 0 of 1,506,
also fixed windows starting inside a code fence); `?section=` not scrolling to level 4–6 headings;
hit counter vs. highlights (now one hit = one highlighted occurrence); failed searches and failed
comparison loads shown as "no results"; German error page; session resolved once per request;
book indexed at startup and checked by `/healthz`.

## Known issues and debt

- **`*_entries.prohibited` is misleading:** it is filled from BAM `N_VERBOT`, where "1" means *permitted*
  ("0" forbidden, "2" not subject to the regulations), and the import maps only "1" to `true`. So
  `true` = permitted, `false` = forbidden *or* not subject. Nothing in the app reads it (ICAO prohibitions
  come from "FORBIDDEN" in the packing-instruction columns). Rename or re-import as an enum before anyone uses it.
- Detail columns not shown yet: ICAO `supplementary_code` (looks like the ERG drill code, e.g. "3L") and
  `attachment` ("+"); meaning not confirmed from the BAM ICAO table description.

- Search: batteries rank behind other hits for "lithium"/"battery" (within a rank tier results are ordered by UN number); they are on the first page or behind "Weitere Treffer laden". Synonyms exist only for the Stoffsuche, not for the ADR text viewer (see "Tunnelcode" below). `/un/9999` (ICAO placeholder) is still directly reachable; only the search excludes it.
- Special-provision texts: a failed fetch renders "Kein Text verfügbar" (`MultimodalSvsAccordion`) — a failure shown as no data (review 2026-11-08, pre-existing).
- Idea: manual ICAO variant pick: list the variants whose division matches the selected ADR classification code first (e.g. ADR 5A → ICAO 2.2).
- Variant matching rule 2 matches the single same-packing-group candidate even when both sides carry explicitly different specifications (needed for UN 1993); a stricter rule would show "keine eindeutige Entsprechung" more often. Owner decision.

- 57 of 9,124 real-book search hits (0.6 %) get no highlight: table cells containing raw block HTML (`<p>`, nested tables) that the browser rearranges. Source quirk.
- `/passwort-neu` accepts any session, not only a recovery session (review minor).
- Book endpoint rate limits are keyed by IP before the access check; colleagues behind one NAT share the budget (review minor).
- Without `ADR_BOOK_PATH` the book links stay visible and the page shows the error page.

- FAQ "Was kostet…" says "zuerst registrierten Nutzern" — reads oddly while registration is closed.
- Book viewer measured over budget: index build 245 ms (budget 100 ms, once per worker) and `?sv=274` page payload 390 KB raw / 41 KB gzip (budget 350 KB raw).
- "Tunnelcode" finds nothing in the book — the ADR says "Tunnelbeschränkungscode"; synonyms would help.
- Book TOC has no marker for the section in view.
- (Owner checked the landing/auth pages in a browser; no longer an open item.)
- Stripe later: a webhook sets `profiles.activated_at`; no schema change needed. Hook points: `CHECKOUT_AVAILABLE` in `src/lib/account/subscription.ts` and a `?/subscribe` action on `/konto`. Account deletion must cancel a Stripe subscription first, and invoices (retention duty) will need a table that does not cascade with the user.

## Supabase project state (`nmigeqhrquzmdxjeuite`, eu-central-1)

- Migrations applied through `20260929120000_launch_signups` (all via `execute_sql` + a `schema_migrations` row). `20261123120000_account_page` applied 2026-11-23 (owner-approved).
- Auth: email provider on, confirm email on, min password 10; URL config and email templates pasted (from `supabase/templates/`); built-in mail sender only.
- One user (the owner), activated. `launch_signups` held 1 entry on 2026-09-29 (a test submission after the verification rows were deleted).
- For the test deployment still to do: add `https://app.gefahrgut.org/**` to redirect URLs, disable new signups, create test users with "Auto Confirm".
