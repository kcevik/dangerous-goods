# Project status

**Last updated:** 2026-09-29 · **Tests:** 610 green · `pnpm check` 0 errors · `pnpm build` OK · nothing committed (the owner commits)

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
| — | Pre-launch mode + test deployment | 🟡 Tasks 1–7 of 11 | Migration live; local Docker image verified; next: Task 8 (nginx + runbook) |
| F-10 | Regulatory comparison (side by side) | ⚪ planned | Open question #1 (row alignment across modes) must be answered first |
| F-05 | Dashboard | ⚪ shell | One live tile (Stoffsuche); Regelwerksvergleich grayed "Demnächst verfügbar" |
| F-02 | 1000-Punkte-Rechner | ⚪ not started | |
| F-03 | Document generator | ⚪ not started | |
| F-06–08 | Duty checker, SV browser, packaging browser | ⚪ not started | |

Landing page: only the Stoffsuche card is live; the other five feature cards and the comparison
section carry a grayed "Demnächst verfügbar" badge. Un-gray a card when its tool ships.

## Next steps (recommended order)

1. **Deployment Task 8** — nginx configs + server runbook (`docs/superpowers/plans/2026-09-29-prelaunch-deployment.md`), then Task 9 (docs + full gate).
2. **Owner, in parallel:** book the Netcup VPS (Ubuntu 24.04, ≥ 2 GB RAM, Germany).
3. **Stoffsuche gaps** (F-01): search all modes, surface errors, decide what `un_entries` is for.
4. **F-10 regulatory comparison** once open question #1 is answered.

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
- Book the VPS; later DNS at Strato (`neu` first, apex only in Phase C; never touch MX).
- WordPress: move the blog to `blog.gefahrgut.org` and put Impressum/Datenschutz online (rollout Phase B).
- Answer F-10 open question #1.

## Parked (do not start without being asked — owner, 2026-09-29)

1. Live test of the password-reset mail flow.
2. Admin notification on new signups (DB webhook → mail); activation is manual and nobody is told.
3. Self-host Google Fonts (also listed as blocker 8).
4. Impressum/Datenschutz links in the `(app)` and `(auth)` layouts.
5. Impressum + Datenschutz on WordPress (owner side).
6. Real SMTP sender (also blocker 2).

## Known issues and debt

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
- For the test deployment still to do: add `https://neu.gefahrgut.org/**` to redirect URLs, disable new signups, create test users with "Auto Confirm".
