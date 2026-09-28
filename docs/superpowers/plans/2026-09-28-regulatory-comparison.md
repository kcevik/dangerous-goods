# Regulatory Comparison View (F-10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development`
> or `superpowers:executing-plans` to work this plan task by task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** A real side-by-side comparison of ADR, RID, IMDG, ICAO and ADN for one UN number
at `/un/:nummer/vergleich`, with automatic difference detection that does not cry wolf,
and the landing page brought back in line with what ships.

**Architecture:** All comparison logic is a pure module (`compare.ts`) over the existing
`Entry` objects, so the hard part is unit-testable with no DOM and no database. A rune
state class holds only view state (language, per-mode row selection, filter). The route
mirrors the sibling `/un/[nummer]` load, including the locked-account branch.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, Tailwind v4 hand-written, Vitest + jsdom +
testing-library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-28-regulatory-comparison-design.md`. Field
registry, status rules, critical-field set, cell rendering and copy live there; this plan
references spec sections rather than repeating them.

## Global Constraints

- pnpm only. No git commits by the executor; the owner handles all git.
- Svelte MCP autofixer on every `.svelte` and `.svelte.ts` file before finishing a task.
- TDD: each task writes its failing test first, then the implementation.
- German UI copy, English identifiers. Never name a variable `state`.
- Internal links use `resolve()` from `$app/paths` with route IDs including the group
  segment, e.g. `resolve('/(app)/un/[nummer]/vergleich', { nummer })`.
- Locked users must never trigger a regulation query. Check `isActive` first; RLS is the
  backstop, not the primary gate. Locked users see `DEMO_DATA` only.
- Rune-using test files need the `*.svelte.test.ts` suffix. Pure-node tests get
  `// @vitest-environment node` at the top.
- `pnpm test` and `pnpm check` must be green at the end of every task.

## Pre-flight

- [ ] Read the spec end to end.
- [ ] Answer spec open question 1 (row alignment) and 2 (critical-field set) with the
      owner before starting Task 1. Both change `compare.ts` and are cheap to settle now
      and expensive to retrofit.
- [ ] Confirm with the owner how the landing page's Phase 2 claims should be handled
      (spec open question 3). Task 6 needs the answer, not the earlier tasks, so this one
      can be settled later.

---

## File map

| Path | Responsibility |
|---|---|
| `src/lib/multimodal/compare.ts` | field registry, `buildComparison`, `summarizeDeviations` (spec §1–3) |
| `src/lib/multimodal/comparisonView.svelte.ts` | `ComparisonViewState` view state (spec §5) |
| `src/lib/multimodal/ComparisonTable.svelte` | the grid (spec §5) |
| `src/lib/multimodal/ComparisonLegend.svelte` | colour legend + BAM attribution |
| `src/routes/(app)/un/[nummer]/vergleich/+page.server.ts` | load, 404, locked branch (spec §6) |
| `src/routes/(app)/un/[nummer]/vergleich/+page.svelte` | page shell, SEO head |
| `src/routes/(app)/un/[nummer]/+page.svelte` | add the link to the comparison |
| `src/routes/(app)/dashboard/+page.svelte` | repoint the comparison card |
| `src/lib/landing/Comparison.svelte` | truthfulness pass (spec §7) |
| `src/lib/multimodal/types.ts` | any new `LABELS` keys the table needs |

---

### Task 1: Field registry and comparison logic (spec §1–3)

The whole value of the feature is here, and it is pure functions, so it gets the most
test attention.

- [ ] Write `tests/compare.test.ts` with `// @vitest-environment node`. Cover:
  - a field two modes both define with equal values → `same`
  - the same field with differing values → `differs`
  - a road-only field such as `tunnelCode` with a road value and nothing elsewhere →
    `onlyOne`, **never** `differs`. This is the rule that keeps the tool credible; assert
    it explicitly for at least `tunnelCode`, `kemlerNumber`, `ems1` and
    `packingInstrCargo`.
  - a field no mode defines → `missing`
  - set normalisation: `'P001, IBC02'` vs `'IBC02, P001'` → `same`, and the raw strings
    are preserved for display
  - whitespace and case normalisation
  - `summarizeDeviations` returns only critical `differs` rows
  - the registry covers every field the mappers populate: import the mappers, feed each a
    row with every column set, and assert no populated `Entry` key is missing from the
    registry (ignoring `unNumber`, `sequenceNumber`, the name and specification fields)
  - `selection` picks the requested sequence index per mode, defaulting to 0
- [ ] Implement `src/lib/multimodal/compare.ts` per spec §1–3.
- [ ] `pnpm test` green.

**Verify:** the registry test fails if you delete one entry from the registry. Check that
by hand once, then restore it.

### Task 2: View state (spec §5)

- [ ] Write `tests/comparisonView.svelte.test.ts`. Cover: default selection is 0 for
      every mode; changing one mode's selection recomputes rows without touching the
      others; `onlyDifferences` hides `same` and `onlyOne` rows; `missing` rows are always
      hidden; `deviations` tracks the critical subset; the language setter drives `L()`.
- [ ] Implement `ComparisonViewState` in `src/lib/multimodal/comparisonView.svelte.ts`.
      Capture constructor props with `untrack()` where the object is created once per
      component.
- [ ] Run the autofixer on the new `.svelte.ts`.
- [ ] `pnpm test` green.

### Task 3: Route and load (spec §6)

- [ ] Write `tests/comparison-page-load.test.ts`, following the shape of the existing
      `tests/un-page-load.test.ts`. Cover: non-four-digit parameter → 404; locked account
      asking for 1203 → demo data, no Supabase call; locked account asking for anything
      else → `locked: true`, no data, no Supabase call; active account → data from
      `fetchCompareForUn`.
- [ ] Implement `+page.server.ts`.
- [ ] Implement a minimal `+page.svelte` that renders the UN number, so the load test has
      something to mount against. SEO head with title, description and canonical, matching
      the sibling page's pattern.
- [ ] `pnpm test` and `pnpm check` green.

### Task 4: The table (spec §5)

- [ ] Write `tests/comparison-page.test.ts`. Cover: one column per mode in `MODALS` order;
      the field label column uses the current language; a `differs` critical cell carries
      the deviation styling while a `same` cell does not; a road-only field renders the
      not-applicable dash in the other columns and is not styled as a deviation; the ADN
      column renders the "no BAM data" note; the deviation summary lists the critical
      disagreements; the only-differences toggle filters rows; the language toggle
      switches labels.
- [ ] Implement `ComparisonTable.svelte` and `ComparisonLegend.svelte`, and wire them into
      `+page.svelte`. Add any missing `LABELS` keys to all four languages in `types.ts`
      (the existing key-parity test in `tests/multimodal-i18n.test.ts` enforces this).
- [ ] Sticky header and sticky first column. The table scrolls inside its own
      `overflow-x-auto`; the page body must not scroll sideways. Check at 375px wide.
- [ ] Include the dl-de/by-2-0 BAM attribution in the legend.
- [ ] Run the autofixer on both new components.
- [ ] `pnpm test` and `pnpm check` green.

### Task 5: Entry points

- [ ] Write the test first in each case: `tests/un-page.test.ts` gains an assertion for
      the comparison link; `tests/dashboard-page.test.ts` gains one for the repointed card.
- [ ] Add "Alle Modi vergleichen" to `/un/[nummer]`, using `resolve()` with the route ID.
- [ ] Repoint the dashboard's comparison card at the new route.
- [ ] `pnpm test` green.

### Task 6: Landing page truthfulness pass (spec §7)

Do not start before the owner has answered spec open question 3.

- [ ] Update `tests/landing-page.test.ts` first: assert the Phase 2 claims are gone or
      explicitly labelled as planned, and that the mockup's values match `DEMO_DATA`.
- [ ] Rebuild the `Comparison.svelte` table from `DEMO_DATA` rather than the hardcoded
      rows, so it can never drift from the product again. `DEMO_DATA` is now generated from
      the live BAM tables, so this makes the marketing table correct by construction.
- [ ] Remove or relabel the PDF export and transport assistant bullets.
- [ ] Handle the inland-waterway row honestly: `DEMO_DATA.ADN` is empty, so driving the
      table from it resolves this automatically.
- [ ] Point the section's call to action at the comparison view.
- [ ] Check the `CLAUDE.md` SEO invariant: meta description, FAQ, `SeoContent.svelte` and
      `static/llms.txt` must stay mutually consistent.
- [ ] `pnpm test` green.

### Task 7: Documentation

- [ ] Update `CLAUDE.md`: F-10 moves from planned to shipped, the project structure gains
      the new files, the URL structure notes that `/un/:nummer/vergleich` now exists, and
      the "Where we left off" section is refreshed.
- [ ] Add the status line at the top of this plan recording what was done and any
      deviations, following the convention in the auth plan.

---

## Final verification

- [ ] `pnpm test` — all green, and the new tests actually fail when the logic is broken.
- [ ] `pnpm check` — 0 errors. The five `@apply` warnings in `MultimodalTool.svelte` are
      known and expected.
- [ ] `pnpm build` then `pnpm preview`, and walk the real pages in a browser: an activated
      account on a substance with genuine cross-mode differences, a locked account, and a
      UN number that exists in only some modes.
- [ ] Pick a substance where the modes genuinely disagree and check the flagged deviations
      against the source data by hand. UN 1203 is a poor test case here: packing group and
      hazard class agree across all four modes, so it produces almost no deviations. Use it
      to confirm the tool stays quiet, then find a substance where it should speak up.

## Notes carried in from the 2026-09-28 session

- `DEMO_DATA` and `DEMO_SVS` in `types.ts` are now generated from the live BAM tables for
  UN 1203 sequence 1. Do not hand-edit them. The previous hand-written values were wrong
  in almost every field, including the special provision codes.
- `DEMO_SVS` is keyed `MODE:code`, because the same provision code carries different
  official text per mode.
- `DEMO_DATA.ADN` is deliberately empty, matching what `fetchCompareForUn` returns.
- `pickSvText` in `types.ts` is the single place where the language fallback chain lives.
  Reuse it rather than reimplementing the chain.
- `un_entries` (3,232 rows, the UN Recommendations) is counted in the advertised entry
  total but never queried by `fetchCompareForUn`. Out of scope for this plan, but worth a
  decision: either surface it as a sixth column or stop counting it.
