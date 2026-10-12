# Project status

**Last updated:** 2026-10-12 · **Tests:** 706 green · `pnpm check` 0 errors · `pnpm build` OK · nothing committed (the owner commits)

This is the one place for "where do we stand". Stable rules and conventions live in
`CLAUDE.md`; designs and plans are indexed in `docs/README.md`. Update this file at the end of
every working session.

---

## Features

| ID | Feature | Status | Notes |
|---|---|---|---|
| F-04 | Login, accounts, manual activation | ✅ done | Signup verified end-to-end on 2026-09-29 (built-in mail sender) |
| F-09 | ADR, RID, IMDG, ICAO data | ✅ done | 16,730 BAM entries, 1,354 special provisions; no ADN in the BAM feed |
| F-01 | Stoffsuche (`/suche`, `/un/:nummer`) | 🟡 works, gaps | `/suche` searches `adr_entries` names only and shows errors as "Keine Ergebnisse"; `un_entries` is never queried |
| F-13 | ADR book viewer (`/regelwerk/adr`) | 🟡 code complete | Not public until the source document is named (go-live blocker 1) |
| — | Pre-launch mode + test deployment | 🟡 Tasks 1–8 of 11 | Switched to Caddy + `app.gefahrgut.org` (2026-10-12); runbook `docs/deploy/README.md`; next: owner sets up the Strato VPS |
| F-10 | Regulatory comparison (side by side) | ⚪ planned | Open question #1 (row alignment across modes) must be answered first |
| F-05 | Dashboard | ⚪ shell | One live tile (Stoffsuche); Regelwerksvergleich grayed "Demnächst verfügbar" |
| F-02 | 1000-Punkte-Rechner | ⚪ not started | |
| F-03 | Document generator | ⚪ not started | |
| F-06–08 | Duty checker, SV browser, packaging browser | ⚪ not started | |

Landing page: only the Stoffsuche card is live; the other five feature cards and the comparison
section carry a grayed "Demnächst verfügbar" badge. Un-gray a card when its tool ships.

## Next steps (recommended order)

1. **Test deployment** — owner follows `docs/deploy/README.md` on the Strato VPS (Caddy, basic auth for the whole site). Task 8 is done for Caddy; the plan's nginx text and `concepts.md` page are superseded / not written.
2. **Commit before the first deploy** — the image tag carries the HEAD hash.
3. **Stoffsuche gaps** (F-01): search all modes, surface errors, decide what `un_entries` is for.
4. **F-10 regulatory comparison** once open question #1 is answered.
5. **Yearly import: replace instead of upsert** (code review 2026-09-29) — `scripts/import-regulations.ts` only upserts on `(un_number, sequence_number)`, so entries BAM withdraws stay in the tables and a half-failed run mixes two editions. Import into staging tables and swap, or delete rows missing from the new file in one transaction. Needed before the first yearly update (2027 editions).

## Go-live blockers (not needed for the test phase)

1. **ADR book source** — the owner says it is the official public text but has not named the document (the «» quotes suggest the Swiss Fedlex publication, SR 0.741.621). Otherwise the file comes off the server before launch.
2. **SMTP + double opt-in** — a real sender (SPF/DKIM at Strato); the DOI mail goes to every address in `launch_signups`; only confirmed ones get the launch mail.
3. **Open registration** — `REGISTRATION_MODE=open` and Supabase signups re-enabled.
4. **Legal** — Impressum and Datenschutzerklärung (still the WordPress "Under Construction" splash; the privacy page must cover the launch list); AGB before any payment.
5. **Rollout Phase C** — apex to the VPS, blog redirects, certificates (deployment plan Task 11).
6. **Backups** — the Supabase org is on the free plan (no backups).
7. **Leaked-password protection** — Supabase advisor finding; enable if the plan offers it.
8. **Self-host Google Fonts** — loaded from Google without consent today.

## Owner to-dos

- Name the ADR source document (blocker 1).
- Book the Strato VPS; DNS `app` → VPS (apex only in Phase C; never touch MX).
- WordPress: move the blog to `blog.gefahrgut.org` and put Impressum/Datenschutz online (rollout Phase B).
- Answer F-10 open question #1.

## Parked (do not start without being asked — owner, 2026-09-29)

1. Live test of the password-reset mail flow.
2. Admin notification on new signups (DB webhook → mail); activation is manual and nobody is told.
3. Self-host Google Fonts (also listed as blocker 8).
4. Impressum/Datenschutz links in the `(app)` and `(auth)` layouts.
5. Impressum + Datenschutz on WordPress (owner side).
6. Real SMTP sender (also blocker 2).

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

- `slice.ts` `compactTableRepeats` drops an all-empty row even when it is a table's *header* row (radionuclide tables around line 7184 of the real book), so those tables render as raw `|…|` text. One-line fix, but it changes how existing tables render — needs a look.
- 57 of 9,124 real-book search hits (0.6 %) get no highlight: table cells containing raw block HTML (`<p>`, nested tables) that the browser rearranges. Source quirk.
- `/passwort-neu` accepts any session, not only a recovery session (review minor).
- Book endpoint rate limits are keyed by IP before the access check; colleagues behind one NAT share the budget (review minor).
- Without `ADR_BOOK_PATH` the book links stay visible and the page shows the error page.

- FAQ "Was kostet…" says "zuerst registrierten Nutzern" — reads oddly while registration is closed.
- The landing comparison mockup shows a deviation warning that is factually false (section is grayed "Demnächst verfügbar").
- Book viewer measured over budget: index build 245 ms (budget 100 ms, once per worker) and `?sv=274` page payload 390 KB raw / 41 KB gzip (budget 350 KB raw).
- "Tunnelcode" finds nothing in the book — the ADR says "Tunnelbeschränkungscode"; synonyms would help.
- Book TOC has no marker for the section in view.
- The landing page and auth pages have never had a visual pass in a real browser since the SvelteKit port.
- Stripe later: a webhook sets `profiles.activated_at`; no schema change needed.

## Supabase project state (`nmigeqhrquzmdxjeuite`, eu-central-1)

- Migrations applied through `20260929120000_launch_signups` (all via `execute_sql` + a `schema_migrations` row).
- Auth: email provider on, confirm email on, min password 10; URL config and email templates pasted (from `supabase/templates/`); built-in mail sender only.
- One user (the owner), activated. `launch_signups` held 1 entry on 2026-09-29 (a test submission after the verification rows were deleted).
- For the test deployment still to do: add `https://app.gefahrgut.org/**` to redirect URLs, disable new signups, create test users with "Auto Confirm".
