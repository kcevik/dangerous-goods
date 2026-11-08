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
  selection: Partial<Record<Modal, Variant | null>>,   // chosen variant per mode (§4, revised)
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

> **Revised 2026-11-08** — open question #1 answered. Built on the variant model of
> `2026-11-08-stoffsuche-variants-design.md`.

A UN number often has several rows per mode, but most are **name variants** with identical
regulatory data (UN 1203: BENZIN / OTTOKRAFTSTOFF / PETROL). 82 % of UN numbers have exactly one
regulatory variant in every mode. Row position is unreliable across modes for the rest.

The comparison therefore compares **variants, not rows**, using `groupVariants` and
`matchVariant` from `src/lib/multimodal/variants.ts`:

- The anchor mode's variants feed one variant picker (shown only when there is more than one).
- Every other mode shows `matchVariant(chosen, …)`: same packing group + same normalised English
  specification, else the single candidate with the same packing group, else **no match**.
- A mode without a match shows its cells as "keine eindeutige Entsprechung" with its own small
  picker; it never contributes a `differs` status until the user picks.
- `buildComparison` takes the chosen `Variant` per mode instead of a sequence index.

## 4a. UN Model Regulations reference column

> **Added 2026-11-08** (owner decision).

`un_entries` (UN Model Regulations, 23rd rev. ed.) is shown as a grey reference column after the
four modes, labelled "UN-Modellvorschriften". It covers the shared fields only (class, packing
group, special provisions, limited and excepted quantities, packing instructions). It is
**never** part of the status computation: it cannot make a row `differs`, `same` or `onlyOne`.
The load fetches it alongside the four modes; its variant is matched like any other mode.

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
- Deep links into the ADR book from provision codes. That is a separate spec,
  `2026-09-28-adr-book-viewer-design.md`.

## Open questions for the owner

1. ~~Row alignment across modes~~ — answered 2026-11-08: variants matched by packing group +
   specification (§4).
2. ~~Critical-field set~~ — answered 2026-11-08: as in §3.
3. ~~Landing Phase 2 claims~~ — answered 2026-11-08: **remove** the PDF export and transport
   assistant bullets; they will not be built (owner).

## Revision 2026-11-08 — comparability, measured on the BAM source

> Applies on top of §1–§3 and §5–§7. Measured over all 2,347 UN numbers in `csvbase/`
> (first row per mode). The owner's decisions on open questions 2 and 3 are recorded above.

A naive field-by-field comparison flags format, not content:

| Field | UN numbers "differing" naively | Cause | After the rules below |
|---|---|---|---|
| `hazardClass` | 614 | ADR/RID write `1` / `2`, IMDG/ICAO `1.1D` / `2.3` | 0 |
| `hazardLabels` | 2,227 of 2,326 | ICAO uses words ("Toxic"), RID adds `(13)`, IMDG lists only subsidiary risks | ADR↔RID only |
| `packingInstructions` | 1,189 (ADR↔IMDG) | IMDG keeps IBC codes in another column; `R001` is ADR/RID only; `P112(b)` vs `P112b` | ADR↔RID only (0 differ) |
| `specialProvisions` | 343 (ADR↔IMDG) | ADR/RID-specific 6xx provisions; ICAO uses A-numbers | ADR↔RID only (19 real) |
| `limitedQty` / `exceptedQty` | 12 / 5 | mostly real; `See SP251` vs `siehe SV 251` is language only | 11 / 5, all real (e.g. UN 1286 ADR 5 L vs IMDG 1 L) |
| `packingGroup`, `classificationCode`, `transportCategory` | 0 | — | 0 |

**Rules (replace the `modes`-only model of §1):**

1. Every registry field gets `compareModes` ⊆ `modes`: the modes whose values share one notation.
   Values in other modes are **shown but not compared** (cell marked "nicht verglichen:
   abweichende Systematik"). `hazardLabels`, `packingInstructions` and `specialProvisions`
   compare ADR↔RID only. The critical set of §3 is unchanged; `hazardLabels` stays critical
   within ADR↔RID.
2. Normalisation per kind: *text* (trim, collapse spaces, upper case); *quantity* (`siehe SV n`
   ≡ `See SP n`, spaces removed, upper case); *set* (comma list, parentheses and spaces removed,
   upper case, sorted); *labels* (parenthesised markers such as `(13)` removed, then *set*);
   *class* (a value without a division — `1`, `2` — is compatible with exactly one division of
   the same class shown by another mode).
3. A value that normalises to empty counts as absent (decision 2 of this spec).
4. In a `differs` row the cells that disagree with the majority value are marked; on a tie all
   compared cells are marked.
5. `buildComparison` takes the displayed row per mode (the chosen variant's representative,
   §4) and the UN reference row; a mode whose variant is unresolved is passed as `unresolved`
   and its cells read "?" instead of a dash.
6. The landing mockup (§7) is built from `DEMO_DATA` with the same functions; the ADN row
   disappears because `DEMO_DATA.ADN` is empty, and the false "IMDG und ICAO weichen ab"
   warning is replaced by the computed summary.
