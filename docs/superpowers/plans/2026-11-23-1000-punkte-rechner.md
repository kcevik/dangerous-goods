# 1000-Punkte-Rechner (F-02) Implementation Plan

**Goal:** `/tools/1000-punkte` — ADR 1.1.3.6 points calculation with print view.

**Spec:** `docs/superpowers/specs/2026-11-23-1000-punkte-rechner-design.md`

## Global constraints

- pnpm only; Svelte 5 runes; logic in `.ts`/`.svelte.ts`; German "du" copy; test-first.
- Svelte MCP autofixer on every touched `.svelte` / `.svelte.ts` file.
- Read-only SQL against the live project; no DB writes, no migration.
- Do not touch `docs/STATUS.md` or the landing page.

## Tasks

1. **Pure rules** `src/lib/points/points.ts` + `tests/points.test.ts` — units, quantity parsing,
   factors, row and load evaluation, boundary 1000/1001, BK 2 alone 333, unit defaults/hints.
2. **Duties** `src/lib/points/duties.ts` + tests — lists with references, `REFERENCED_SECTIONS`,
   `adrSectionHref()`.
3. **Data access** `fetchAdrEntries()` in `src/lib/multimodal/mappers.ts` + test.
4. **State** `src/lib/points/pointsCalculator.svelte.ts` + `tests/pointsCalculator.svelte.test.ts`.
5. **Server** `src/routes/(app)/tools/1000-punkte/+page.server.ts`,
   `…/eintrag/+server.ts` + `tests/points-page-load.test.ts`, `tests/points-lookup-endpoint.test.ts`.
6. **UI** `PointsCalculator`, `PointsRow`, `PointsResult`, `PointsPrintSheet` + page;
   `tests/points-page.test.ts`.
7. **Navigation** `APP_NAV_ITEMS` entry, dashboard tile, `print:hidden` in the `(app)` layout;
   update `tests/app-layout.test.ts`, `tests/dashboard-page.test.ts`; Tailwind compile test.
8. **Verify** autofixer, `pnpm check`, `pnpm test`, `pnpm build`, browser run (active + locked,
   320/375/1280, print emulation); CLAUDE.md routes; commit, push, PR.

## Execution notes

- `adr_entries.prohibited` turned out unusable (inverted/meaningless); status comes from `remark`.
- Many paragraph numbers are not headings in the book, so `?section=` links are only rendered
  for sections the book index knows (checked in the page load).
- The rows cache lookups per UN number in a plain `Map` (nothing renders from it; the autofixer's
  SvelteMap suggestion does not apply).
- Browser check 2026-11-23 (dev server :5190, playwright-core, 20/20): mixed load 1203 300 L +
  1993 VG III 400 L + 1830 100 kg + 3480 50 kg = 900/400/300/150 = 1.750 → nicht möglich at
  320/375/1280 (no horizontal scroll, all targets ≥ 44 px); BK 0 (UN 1051) → nicht möglich;
  1203 200 L + 1993 VG III 400 L = exactly 1.000 → möglich with 9 duties, 401 L → 1.001 → nicht
  möglich; print emulation hides header, footer and inputs and shows the sheet; locked account:
  explanation + banner, no lookup request, endpoint 403.
