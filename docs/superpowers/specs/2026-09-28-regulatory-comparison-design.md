# Regulatory Comparison View (F-10) — Design

> **Status:** design agreed 2026-09-28. Chosen over the alternative of deleting the
> landing page's comparison claims. The owner picked "build the real thing".

## Goal

Turn the cross-mode comparison from a tabbed one-mode-at-a-time view into a genuine
side-by-side table with automatic difference detection, at `/un/:nummer/vergleich`.

This is F-10 in `CLAUDE.md`, the stated core differentiator, and the landing page has
been selling it since launch of the marketing site. Today the product does not deliver
it. This spec closes that gap.

## Why now

`src/lib/landing/Comparison.svelte` promises four things:

| Claim | Reality today |
|---|---|
| Differences detected automatically | Not built |
| Deviations highlighted in colour | Not built |
| PDF export for audits | Phase 2 (Puppeteer), not built |
| Transport assistant integrated | F-11, Phase 2, not built |

Its table is a hardcoded mockup whose values do not match the database, and it shows a
full inland-waterway (ADN) row for data that BAM does not publish at all. The first two
claims are what this spec delivers. The other two must come out of the copy (§7).

## Decisions (already made)

1. **Route:** `/un/:nummer/vergleich`, already in the `CLAUDE.md` URL structure. A real
   route, not a tab, so it is linkable and printable.
2. **Absence is not a deviation.** This is the central rule. Most `Entry` fields only
   exist for some modes: tunnel code and Kemler number are road-only, EmS and stowage
   are sea-only, passenger and cargo packing instructions are air-only. A naive diff
   would paint every one of those as a deviation and the tool would cry wolf on every
   substance. Each comparable field therefore declares which modes it applies to, and
   only modes that *both define the field* can disagree.
3. **Compare normalised, display raw.** `P001, IBC02` and `IBC02, P001` are the same
   set. Comparison runs on a normalised form; the table shows what the source says.
4. **No advice, only facts.** Where a deviation is flagged, the wording states what
   differs. It never tells the user what to do. This is a reference tool for
   Gefahrgutbeauftragte, who carry the legal responsibility themselves.
5. **ADN is shown as "no data", not as a deviation.** BAM ships no ADN table, so
   `fetchCompareForUn` always returns an empty array for it. The column stays, labelled
   explicitly, so the absence is honest rather than looking like a data gap.
6. **Locked accounts compare demo data only**, exactly like `/un/:nummer` today.
7. **PDF export is out of scope here.** Phase 2, needs Puppeteer.

## 1. Comparable field registry

New pure module `src/lib/multimodal/compare.ts`. No runes, so it is a plain `.ts` and
testable without jsdom.

```ts
export interface CompareField {
  /** key on Entry */
  field: keyof Entry
  /** existing LABELS key, so no new translation work where a label exists */
  labelKey: string
  /** modes whose dataset actually carries this field */
  modes: readonly Modal[]
  /** true when a disagreement is worth flagging prominently (§3) */
  critical?: boolean
  /** comma-separated set rather than a scalar, so order must not matter */
  set?: boolean
}
```

Ordered registry, grouped so the table reads top-down like the regulation itself:

| Group | Fields | Modes |
|---|---|---|
| Classification | `hazardClass`, `classificationCode`, `packingGroup`, `hazardLabels` | class and PG all four; classification code road + rail |
| Quantities | `exceptedQty`, `limitedQty` | excepted all four; limited road, rail, sea |
| Packaging | `packingInstructions` | road, rail, sea |
| Road / rail | `transportCategory`, `multiplier`, `kemlerNumber`, `tunnelCode` | road; transport category road + rail |
| Sea | `ems1`, `ems2`, `stowageCategory`, `stowage`, `segregation`, `marpol` | sea |
| Air | `packingInstrPassenger`, `maxNetPassenger`, `packingInstrCargo`, `maxNetCargo` | air |
| Provisions | `specialProvisions` | all four |

The `modes` column is derived from what the mappers in `mappers.ts` actually populate
per mode, not from the regulation in the abstract. Keep the two in sync: a test asserts
that every field a mapper writes appears in the registry, so a future mapper change
cannot silently drop a field out of the comparison.

## 2. Comparison model

```ts
export type CompareStatus = 'same' | 'differs' | 'onlyOne' | 'missing'

export interface CompareCell {
  raw: string | null       // what to render; null = nothing to show
  normalized: string | null
  applicable: boolean      // does this mode's dataset define the field at all
}

export interface CompareRow {
  field: keyof Entry
  labelKey: string
  critical: boolean
  cells: Record<Modal, CompareCell>
  status: CompareStatus
  /** modes that carry a value, for the deviation sentence */
  present: Modal[]
}

export function buildComparison(
  data: Record<string, Entry[]>,
  selection?: Partial<Record<Modal, number>>,   // sequence index per mode, default 0
): CompareRow[]
```

Status rules, applied per row over the modes where the field is both applicable and
non-empty:

- fewer than one such mode → `missing` (row hidden unless the user asks for all rows)
- exactly one → `onlyOne` (informational, never a deviation)
- two or more, all normalised values equal → `same`
- two or more, values differ → `differs`

A row is never `differs` because a mode lacks the column. That is decision §2.

## 3. Critical fields

Marked `critical: true`: `hazardClass`, `packingGroup`, `classificationCode`,
`hazardLabels`, `limitedQty`, `exceptedQty`.

Rationale: these are the fields where a planner who checked one mode and assumed the
other would be the same can get a genuinely wrong answer. Everything else is either
mode-specific by construction or a detail that does not change the classification.

`summarizeDeviations(rows)` returns the critical rows with `status === 'differs'`. The
page renders one factual sentence per such row, naming the field and the modes that
disagree. No severity scores, no traffic lights beyond same/differs, no recommendations.

## 4. Multiple entries per UN number

A UN number usually has several rows per mode. UN 1203 has three in road, rail and sea
(BENZIN, OTTOKRAFTSTOFF, PETROL as separate sequence numbers). The current tool silently
shows `[0]` and hides the rest, which is already a small correctness problem on
`/un/:nummer`.

For the comparison this cannot be hidden, because comparing road sequence 1 against sea
sequence 3 would be meaningless. Design:

- Default selection is sequence index 0 for every mode.
- When any mode has more than one row, the page shows a per-mode selector above the
  table listing the rows by name and sequence number.
- Changing a selector recomputes the comparison client-side. No refetch, all rows for
  the UN number are already loaded.

**Open question for the owner:** should the app try to align rows across modes by name
(road BENZIN against sea BENZIN) instead of by position? The names do not always match
across modes, so automatic alignment can be wrong. Default-by-position plus a visible
selector is the safe starting point. Confirm before adding cleverness.

## 5. State and UI

`src/lib/multimodal/comparisonView.svelte.ts` — `ComparisonViewState` class, following
the `MultimodalToolState` pattern:

- `currentLang: Lang` — reuses `LABELS`, `getL` and the existing language toggle markup.
- `selection: Partial<Record<Modal, number>>` — per-mode sequence index.
- `onlyDifferences: boolean` — filter toggle, default off.
- `rows = $derived(buildComparison(this.data, this.selection))`
- `visibleRows = $derived(...)` — applies the filter and drops `missing` rows.
- `deviations = $derived(summarizeDeviations(this.rows))`

Components:

- `ComparisonTable.svelte` — the grid. First column is the field label, then one column
  per mode. Sticky header and sticky first column, because the table is wider than a
  phone. The whole table scrolls inside its own `overflow-x-auto` container; the page
  body must never scroll sideways.
- `ComparisonLegend.svelte` — what the colours mean, plus the BAM attribution required
  by dl-de/by-2-0.

Cell rendering:

| Status | Rendering |
|---|---|
| `same` | plain value, muted |
| `differs`, critical | value on the existing orange deviation background, with a marker |
| `differs`, non-critical | value with a lighter emphasis, no alarm colour |
| not applicable | em dash with a `title` explaining the mode has no such field |
| applicable but empty | thin dash |
| ADN, always | one spanning note that BAM publishes no ADN data |

Styling reuses the tokens already in `MultimodalTool.svelte`. Tailwind v4, hand-written,
`@reference "tailwindcss"` at the top of any `<style>` block that uses `@apply`.

## 6. Route and data loading

`src/routes/(app)/un/[nummer]/vergleich/+page.server.ts`, mirroring the sibling
`/un/[nummer]` load exactly:

1. 404 unless the parameter is four digits.
2. Locked account → return `DEMO_DATA` for 1203, otherwise `locked: true` with no data.
3. Active account → `fetchCompareForUn(locals.supabase, nummer)`.

The locked-mode rule from `CLAUDE.md` holds: check `isActive` before touching regulation
data, RLS is the backstop and not the primary gate.

Links in, all via `resolve()` with the group segment:

- `/un/[nummer]` gets a "Alle Modi vergleichen" link.
- The dashboard's comparison card points here instead of at `/un/1203`.

## 7. Landing page correction

Once the view exists, `Comparison.svelte` must stop overselling:

- Drop the PDF export and transport assistant bullets, or move them under a visibly
  labelled "geplant" heading. They are Phase 2.
- Remove the inland-waterway row from the mockup, or label it as having no data.
- Either build the mockup from `DEMO_DATA` so it cannot drift from the product again, or
  keep it static but correct it against the database. Building it from `DEMO_DATA` is
  preferred: the demo constants are now generated from the live tables.
- Point the section's call to action at the real comparison view rather than at `#demo`.

The SEO invariant in `CLAUDE.md` applies: site facts must stay consistent across the meta
description, the FAQ, `SeoContent.svelte` and `static/llms.txt`.

## 8. Testing

- `tests/compare.test.ts` — pure, `// @vitest-environment node`. The status rules, the
  absence-is-not-a-deviation rule, set normalisation, the critical subset, the registry
  against the mappers.
- `tests/comparisonView.svelte.test.ts` — rune file, so the `.svelte.test.ts` suffix.
  Selection changes, the filter, derived deviations.
- `tests/comparison-page.test.ts` — renders the table from fabricated data. Asserts a
  road-only field is not flagged as a deviation, that a real disagreement is, and that
  the ADN column reads as "no data".
- `tests/comparison-page-load.test.ts` — the load function: bad parameter, locked, active.

Every feature ships with tests; the owner requires it.

## Out of scope

- PDF export (Phase 2, Puppeteer).
- Transport assistant F-11.
- Comparing two different UN numbers against each other.
- Aligning rows across modes by name (see §4 open question).
- Deep links into the ADR book from provision codes. That is a separate spec,
  `2026-09-28-adr-book-viewer-design.md`.

## Open questions for the owner

1. Row alignment across modes: position plus selector, or attempt name matching? (§4)
2. Is the critical-field set in §3 the right one for a Gefahrgutbeauftragter, or should
   tunnel code and transport category join it? They are road-only, so they can never
   disagree *across* modes, which is why they are excluded, but confirm that matches
   professional expectation.
3. How should the landing page's Phase 2 claims be handled: delete, or relabel as
   planned? (§7)
