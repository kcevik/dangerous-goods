# Stoffsuche Gaps + Regulatory Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/suche` searches all four modes and lists each UN number once with a real error state, and the multimodal tool shows the regulatory variant the user picks in every mode instead of silently showing row 0.

**Architecture:** A pure module `src/lib/multimodal/variants.ts` collapses rows with identical regulatory data into variants and matches a chosen variant into other modes (packing group + English specification). `MultimodalToolState` derives variants per mode from the rows it already loads; `MultimodalTool.svelte` renders one picker for all tabs. `SearchState` runs four parallel table queries and merges them in a pure, exported `mergeSearchRows()`.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind v4 (hand-written), Supabase JS, Vitest 5 + jsdom + @testing-library/svelte, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-08-stoffsuche-variants-design.md`

## Global Constraints

- pnpm only, never npm/npx. Run tests with `pnpm test -- <file>`.
- Svelte 5 runes only (`$state`/`$derived`/`$props`, `onclick={}`, `class={[...]}`); logic in `.svelte.ts` classes, components render.
- Run the Svelte MCP autofixer (`svelte-autofixer`) on every touched `.svelte` / `.svelte.ts` file until it reports no issues (the "without resolve()" warning on query-string links is a known false positive).
- Never name a variable `state`.
- English identifiers; user-visible copy German with "du". Tool labels live in `LABELS` (de/en/fr/tr, identical key sets — `tests/multimodal-i18n.test.ts` enforces it).
- Failures are never "no data": a failed query must show an error state, never "Keine Ergebnisse" / "nicht vorhanden".
- Locked accounts never query (existing `locked` paths stay untouched).
- No database or migration changes. Nothing touches the live Supabase project.
- **The owner commits.** Never `git add` / `git commit` / inspect history. Each task ends with "leave changes uncommitted".
- Every task is test-first: write the failing test, watch it fail, implement, watch it pass.

## Review Focus

1. **Wildcards in the search box** (`50%`, `a*b`, `a_b`): characters `%`, `*`, `_`, `\` are stripped like `,()` so they cannot act as `ilike` wildcards or break the filter — test in Task 2.
2. **A table answering `data: null` without an error** counts as an empty table, not a failure — test in Task 2.
3. **A mode with zero rows** (e.g. ADN, or ICAO missing a UN number) is "not available", never "no unambiguous match" — `isUnmatched()` false, test in Task 4.
4. **Loading a new UN number after picking variant 4** must not index past the new UN's variant list — selection and overrides reset on load, test in Task 4.
5. **Retry after a failed search while the user keeps typing**: the request counter still discards stale responses, and changing the query clears `searchError` — test in Task 2.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/multimodal/variants.ts` (new) | `Variant` type, `groupVariants`, `matchVariant`, `normalizeSpec`, `orderedNames`, `variantLabel` — pure, no runes |
| `tests/fixtures/variant-rows.ts` (new) | Real BAM rows (mapped `Entry` shape) for UN 1203, 1993, 0209 |
| `tests/variants.test.ts` (new) | Node tests for the module |
| `src/lib/search/search.svelte.ts` | Four-table search, `mergeSearchRows`, `searchError`, `retry()` |
| `tests/search.svelte.test.ts` | Rewritten mock (one builder per table) + new cases |
| `src/routes/(app)/suche/+page.svelte` | Result card, count line, error box |
| `tests/search-page.test.ts` | Updated texts + new cases |
| `src/lib/multimodal/types.ts` | Two new `LABELS` keys per language |
| `src/lib/multimodal/multimodalTool.svelte.ts` | Variant state, `variantFor`, `getEntry` via variants |
| `tests/multimodalTool.svelte.test.ts` | New `variants` describe block |
| `src/lib/multimodal/MultimodalTool.svelte` | Picker, header names, unmatched note, overview "?" |
| `tests/MultimodalTool.test.ts` | New picker / unmatched cases |
| `docs/STATUS.md`, `docs/README.md` | Status after the build |

---

### Task 1: Variant model

**Files:**
- Create: `tests/fixtures/variant-rows.ts`
- Create: `src/lib/multimodal/variants.ts`
- Test: `tests/variants.test.ts`

**Interfaces:**
- Consumes: `Entry`, `Lang`, `Modal` from `src/lib/multimodal/types.ts`.
- Produces:
  - `interface VariantNames { de: string[], en: string[], fr: string[] }`
  - `interface Variant { key: string, entries: Entry[], representative: Entry, packingGroup: string | null, names: VariantNames, matchSpecs: string[] }`
  - `normalizeSpec(s: string | null | undefined): string`
  - `groupVariants(entries: readonly Entry[], mode: Modal): Variant[]`
  - `matchVariant(chosen: Variant, candidates: readonly Variant[]): Variant | null`
  - `orderedNames(names: VariantNames, lang: Lang): string[]`
  - `variantLabel(variant: Variant, lang: Lang, mode: Modal, pgShort: string): string`
  - fixtures `UN_1203`, `UN_1993`, `UN_0209: Partial<Record<Modal, Entry[]>>`

- [ ] **Step 1: Create the fixture**

Create `tests/fixtures/variant-rows.ts` with exactly this content (generated from `csvbase/` on 2026-11-08):

```ts
// Generated 2026-11-08 from the BAM source (csvbase/, ADR/RID 2025, IMDG Amdt. 42-24, ICAO 2025).
// Mapped Entry shape, subset of fields. Do not hand-edit values.
import type { Entry, Modal } from '$lib/multimodal/types'

type Rows = Partial<Record<Modal, Entry[]>>

export const UN_1203: Rows = {
  ADR: [
    {"unNumber": "1203", "sequenceNumber": 1, "name": "BENZIN", "nameEn": "MOTOR SPIRIT", "nameFr": "ESSENCE", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "tunnelCode": "D/E", "specialProvisions": "243, 534, 664"},
    {"unNumber": "1203", "sequenceNumber": 2, "name": "OTTOKRAFTSTOFF", "nameEn": "GASOLINE", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "tunnelCode": "D/E", "specialProvisions": "243, 534, 664"},
    {"unNumber": "1203", "sequenceNumber": 3, "nameEn": "PETROL", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "tunnelCode": "D/E", "specialProvisions": "243, 534, 664"},
  ],
  RID: [
    {"unNumber": "1203", "sequenceNumber": 1, "name": "BENZIN", "nameEn": "MOTOR SPIRIT", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "specialProvisions": "243, 534"},
    {"unNumber": "1203", "sequenceNumber": 2, "name": "OTTOKRAFTSTOFF", "nameEn": "GASOLINE", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "specialProvisions": "243, 534"},
    {"unNumber": "1203", "sequenceNumber": 3, "nameEn": "PETROL", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "specialProvisions": "243, 534"},
  ],
  IMDG: [
    {"unNumber": "1203", "sequenceNumber": 1, "name": "OTTOKRAFTSTOFF", "nameEn": "MOTOR SPIRIT", "hazardClass": "3", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "ems1": "F-E", "ems2": "S-E", "specialProvisions": "243"},
    {"unNumber": "1203", "sequenceNumber": 2, "nameEn": "GASOLINE", "hazardClass": "3", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "ems1": "F-E", "ems2": "S-E", "specialProvisions": "243"},
    {"unNumber": "1203", "sequenceNumber": 3, "nameEn": "PETROL", "hazardClass": "3", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "ems1": "F-E", "ems2": "S-E", "specialProvisions": "243"},
  ],
  ICAO: [
    {"unNumber": "1203", "sequenceNumber": 1, "name": "Gasoline", "hazardClass": "3", "packingGroup": "II", "exceptedQty": "E2", "packingInstrPassenger": "353", "packingInstrCargo": "364", "specialProvisions": "A100"},
    {"unNumber": "1203", "sequenceNumber": 2, "name": "Motor spirit", "hazardClass": "3", "packingGroup": "II", "exceptedQty": "E2", "packingInstrPassenger": "353", "packingInstrCargo": "364", "specialProvisions": "A100"},
    {"unNumber": "1203", "sequenceNumber": 3, "name": "Petrol", "hazardClass": "3", "packingGroup": "II", "exceptedQty": "E2", "packingInstrPassenger": "353", "packingInstrCargo": "364", "specialProvisions": "A100"},
  ],
}

export const UN_1993: Rows = {
  ADR: [
    {"unNumber": "1993", "sequenceNumber": 1, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "nameFr": "LIQUIDE INFLAMMABLE, N.S.A.", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "I", "limitedQty": "0", "exceptedQty": "E3", "transportCategory": "1", "tunnelCode": "D/E", "specialProvisions": "274"},
    {"unNumber": "1993", "sequenceNumber": 2, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "nameFr": "LIQUIDE INFLAMMABLE, N.S.A.", "specification": "(Dampfdruck bei 50 °C größer als 110 kPa)", "specificationEn": "(vapour pressure at 50 °C more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "tunnelCode": "D/E", "specialProvisions": "274, 601, 640C"},
    {"unNumber": "1993", "sequenceNumber": 3, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "nameFr": "LIQUIDE INFLAMMABLE, N.S.A.", "specification": "(Dampfdruck bei 50 °C höchstens 110 kPa)", "specificationEn": "(vapour pressure at 50 °C not more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "tunnelCode": "D/E", "specialProvisions": "274, 601, 640D"},
    {"unNumber": "1993", "sequenceNumber": 4, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "nameFr": "LIQUIDE INFLAMMABLE, N.S.A.", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "transportCategory": "3", "tunnelCode": "D/E", "specialProvisions": "274, 601"},
    {"unNumber": "1993", "sequenceNumber": 5, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "nameFr": "LIQUIDE INFLAMMABLE, N.S.A.", "specification": "(mit einem Flammpunkt unter 23 °C und viskos gemäß 2.2.3.1.4) (Dampfdruck bei 50 °C größer als 110 kPa)", "specificationEn": "(having a flash-point below 23 °C and viscous according to 2.2.3.1.4) (vapour pressure at 50 °C more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "transportCategory": "3", "tunnelCode": "E", "specialProvisions": "274, 601"},
    {"unNumber": "1993", "sequenceNumber": 6, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "nameFr": "LIQUIDE INFLAMMABLE, N.S.A.", "specification": "(mit einem Flammpunkt unter 23 °C und viskos gemäß 2.2.3.1.4) (Dampfdruck bei 50 °C höchstens 110 kPa)", "specificationEn": "(having a flash-point below 23 °C and viscous according to 2.2.3.1.4) (vapour pressure at 50 °C not more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "transportCategory": "3", "tunnelCode": "E", "specialProvisions": "274, 601"},
  ],
  RID: [
    {"unNumber": "1993", "sequenceNumber": 1, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "I", "limitedQty": "0", "exceptedQty": "E3", "transportCategory": "1", "specialProvisions": "274"},
    {"unNumber": "1993", "sequenceNumber": 2, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "specification": "(Dampfdruck bei 50 °C größer als 110 kPa)", "specificationEn": "(vapour pressure at 50 °C more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "specialProvisions": "274, 601, 640C"},
    {"unNumber": "1993", "sequenceNumber": 3, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "specification": "(Dampfdruck bei 50 °C höchstens 110 kPa)", "specificationEn": "(vapour pressure at 50 °C not more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "transportCategory": "2", "specialProvisions": "274, 601, 640D"},
    {"unNumber": "1993", "sequenceNumber": 4, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "transportCategory": "3", "specialProvisions": "274, 601"},
    {"unNumber": "1993", "sequenceNumber": 5, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "specification": "(mit einem Flammpunkt unter 23 °C und viskos gemäß 2.2.3.1.4) (Dampfdruck bei 50 °C größer als 110 kPa)", "specificationEn": "(having a flash-point below 23 °C and viscous according to 2.2.3.1.4) (vapour pressure at 50 °C more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "transportCategory": "3", "specialProvisions": "274, 601"},
    {"unNumber": "1993", "sequenceNumber": 6, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "specification": "(mit einem Flammpunkt unter 23 °C und viskos gemäß 2.2.3.1.4) (Dampfdruck bei 50 °C höchstens 110 kPa)", "specificationEn": "(having a flash-point below 23 °C and viscous according to 2.2.3.1.4) (vapour pressure at 50 °C not more than 110 kPa)", "hazardClass": "3", "classificationCode": "F1", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "transportCategory": "3", "specialProvisions": "274, 601"},
  ],
  IMDG: [
    {"unNumber": "1993", "sequenceNumber": 1, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "hazardClass": "3", "packingGroup": "I", "limitedQty": "0", "exceptedQty": "E3", "ems1": "F-E", "ems2": "S-E!", "specialProvisions": "274"},
    {"unNumber": "1993", "sequenceNumber": 2, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "hazardClass": "3", "packingGroup": "II", "limitedQty": "1 L", "exceptedQty": "E2", "ems1": "F-E", "ems2": "S-E!", "specialProvisions": "274"},
    {"unNumber": "1993", "sequenceNumber": 3, "name": "ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.", "nameEn": "FLAMMABLE LIQUID, N.O.S.", "hazardClass": "3", "packingGroup": "III", "limitedQty": "5 L", "exceptedQty": "E1", "ems1": "F-E", "ems2": "S-E!", "specialProvisions": "223, 274, 955"},
  ],
  ICAO: [
    {"unNumber": "1993", "sequenceNumber": 1, "name": "Flammable liquid, n.o.s.", "hazardClass": "3", "packingGroup": "I", "exceptedQty": "E3", "packingInstrPassenger": "351", "packingInstrCargo": "361", "specialProvisions": "A3"},
    {"unNumber": "1993", "sequenceNumber": 2, "name": "Flammable liquid, n.o.s.", "hazardClass": "3", "packingGroup": "II", "exceptedQty": "E2", "packingInstrPassenger": "353", "packingInstrCargo": "364", "specialProvisions": "A3"},
    {"unNumber": "1993", "sequenceNumber": 3, "name": "Flammable liquid, n.o.s.", "hazardClass": "3", "packingGroup": "III", "exceptedQty": "E1", "packingInstrPassenger": "355", "packingInstrCargo": "366", "specialProvisions": "A3"},
  ],
}

export const UN_0209: Rows = {
  ADR: [
    {"unNumber": "0209", "sequenceNumber": 1, "name": "TRINITROTOLUEN", "nameEn": "TRINITROTOLUENE", "nameFr": "TRINITROTOLUÈNE", "specification": "trocken", "specificationEn": "dry", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1", "tunnelCode": "B1000C"},
    {"unNumber": "0209", "sequenceNumber": 2, "name": "TNT", "nameEn": "TNT", "nameFr": "TNT", "specification": "trocken", "specificationEn": "dry", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1", "tunnelCode": "B1000C"},
    {"unNumber": "0209", "sequenceNumber": 3, "name": "TRINITROTOLUEN", "nameEn": "TRINITROTOLUENE", "nameFr": "TRINITROTOLUÈNE", "specification": "angefeuchtet mit weniger als 30 Masse-% Wasser", "specificationEn": "wetted with less than 30 % water, by mass", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1", "tunnelCode": "B1000C"},
    {"unNumber": "0209", "sequenceNumber": 4, "name": "TNT", "nameEn": "TNT", "nameFr": "TNT", "specification": "angefeuchtet mit weniger als 30 Masse-% Wasser", "specificationEn": "wetted with less than 30 % water, by mass", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1", "tunnelCode": "B1000C"},
    {"unNumber": "0209", "sequenceNumber": 5, "nameFr": "TOLITE", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1", "tunnelCode": "B1000C"},
    {"unNumber": "0209", "sequenceNumber": 6, "nameFr": "TOLITE", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1", "tunnelCode": "B1000C"},
  ],
  RID: [
    {"unNumber": "0209", "sequenceNumber": 1, "name": "TRINITROTOLUEN", "nameEn": "TRINITROTOLUENE", "specification": "trocken", "specificationEn": "dry", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1"},
    {"unNumber": "0209", "sequenceNumber": 2, "name": "TNT", "nameEn": "TNT", "specification": "trocken", "specificationEn": "dry", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1"},
    {"unNumber": "0209", "sequenceNumber": 3, "name": "TRINITROTOLUEN", "nameEn": "TRINITROTOLUENE", "specification": "angefeuchtet mit weniger als 30 Masse-% Wasser", "specificationEn": "wetted with less than 30% water, by mass", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1"},
    {"unNumber": "0209", "sequenceNumber": 4, "name": "TNT", "nameEn": "TNT", "specification": "angefeuchtet mit weniger als 30 Masse-% Wasser", "specificationEn": "wetted with less than 30% water, by mass", "hazardClass": "1", "classificationCode": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "transportCategory": "1"},
  ],
  IMDG: [
    {"unNumber": "0209", "sequenceNumber": 1, "name": "TRINITROTOLUEN", "nameEn": "TRINITROTOLUENE", "specification": "trocken", "specificationEn": "dry", "hazardClass": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "ems1": "F-B", "ems2": "S-Y"},
    {"unNumber": "0209", "sequenceNumber": 2, "name": "TRINITROTOLUEN", "nameEn": "TRINITROTOLUENE", "specification": "angefeuchtet mit weniger als 30 Masse-% Wasser", "specificationEn": "wetted with less than 30% water, by mass", "hazardClass": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "ems1": "F-B", "ems2": "S-Y"},
    {"unNumber": "0209", "sequenceNumber": 3, "name": "TNT", "nameEn": "TNT", "specification": "trocken", "specificationEn": "dry", "hazardClass": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "ems1": "F-B", "ems2": "S-Y"},
    {"unNumber": "0209", "sequenceNumber": 4, "name": "TNT", "nameEn": "TNT", "specification": "angefeuchtet mit weniger als 30 Masse-% Wasser", "specificationEn": "wetted with less than 30% water, by mass", "hazardClass": "1.1D", "limitedQty": "0", "exceptedQty": "E0", "ems1": "F-B", "ems2": "S-Y"},
  ],
  ICAO: [
    {"unNumber": "0209", "sequenceNumber": 1, "name": "Trinitrotoluene", "specification": "dry", "hazardClass": "1.1D", "packingInstrPassenger": "FORBIDDEN", "packingInstrCargo": "FORBIDDEN"},
    {"unNumber": "0209", "sequenceNumber": 2, "name": "TNT", "specification": "dry", "hazardClass": "1.1D", "packingInstrPassenger": "FORBIDDEN", "packingInstrCargo": "FORBIDDEN"},
    {"unNumber": "0209", "sequenceNumber": 3, "name": "Trinitrotoluene", "specification": "wetted with less than 30% water, by mass", "hazardClass": "1.1D", "packingInstrPassenger": "FORBIDDEN", "packingInstrCargo": "FORBIDDEN"},
    {"unNumber": "0209", "sequenceNumber": 4, "name": "TNT", "specification": "wetted with less than 30% water, by mass", "hazardClass": "1.1D", "packingInstrPassenger": "FORBIDDEN", "packingInstrCargo": "FORBIDDEN"},
  ],
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/variants.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Entry } from '$lib/multimodal/types'
import {
  groupVariants,
  matchVariant,
  normalizeSpec,
  orderedNames,
  variantLabel,
} from '$lib/multimodal/variants'
import { UN_0209, UN_1203, UN_1993 } from './fixtures/variant-rows'

function e(partial: Partial<Entry>): Entry {
  return { unNumber: '9999', sequenceNumber: 1, ...partial }
}

describe('normalizeSpec', () => {
  it('ignores case, spacing and punctuation', () => {
    expect(normalizeSpec('with not less than 25 % water,')).toBe(normalizeSpec('With not less than 25% water'))
  })

  it('maps missing values to the empty string', () => {
    expect(normalizeSpec(undefined)).toBe('')
    expect(normalizeSpec(null)).toBe('')
    expect(normalizeSpec('  ')).toBe('')
  })
})

describe('groupVariants', () => {
  it('collapses the three UN 1203 ADR name rows into one variant with every name', () => {
    const variants = groupVariants(UN_1203.ADR!, 'ADR')
    expect(variants).toHaveLength(1)
    const [v] = variants
    expect(v!.entries.map(x => x.sequenceNumber)).toEqual([1, 2, 3])
    expect(v!.representative.sequenceNumber).toBe(1)
    expect(v!.names.de).toEqual(['BENZIN', 'OTTOKRAFTSTOFF'])
    expect(v!.names.en).toEqual(['MOTOR SPIRIT', 'GASOLINE', 'PETROL'])
    expect(v!.names.fr).toEqual(['ESSENCE'])
    expect(v!.packingGroup).toBe('II')
  })

  it('splits UN 1993 ADR into five variants and merges rows 5 and 6', () => {
    const variants = groupVariants(UN_1993.ADR!, 'ADR')
    expect(variants.map(v => v.entries.map(x => x.sequenceNumber))).toEqual([[1], [2], [3], [4], [5, 6]])
    expect(variants.map(v => v.packingGroup)).toEqual(['I', 'II', 'II', 'III', 'III'])
    expect(variants[4]!.matchSpecs).toHaveLength(2)
  })

  it('collapses TNT dry and wetted rows whose mapped values are identical', () => {
    expect(groupVariants(UN_0209.ADR!, 'ADR')).toHaveLength(1)
    expect(groupVariants(UN_0209.IMDG!, 'IMDG')).toHaveLength(1)
  })

  it('treats ICAO names and specifications as English', () => {
    const [v] = groupVariants(UN_1203.ICAO!, 'ICAO')
    expect(v!.names.de).toEqual([])
    expect(v!.names.en).toEqual(['Gasoline', 'Motor spirit', 'Petrol'])
  })

  it('returns no variants for no rows', () => {
    expect(groupVariants([], 'ADN')).toEqual([])
  })

  it('ignores remarks when grouping', () => {
    const variants = groupVariants([
      e({ sequenceNumber: 1, packingGroup: 'II', remark: 'a' }),
      e({ sequenceNumber: 2, packingGroup: 'II', remark: 'b' }),
    ], 'ADR')
    expect(variants).toHaveLength(1)
  })
})

describe('matchVariant', () => {
  const adr = groupVariants(UN_1993.ADR!, 'ADR')
  const imdg = groupVariants(UN_1993.IMDG!, 'IMDG')

  it('matches by packing group and shared specification', () => {
    // ADR row 4 (VG III, no specification) ↔ IMDG VG III (no specification)
    expect(matchVariant(adr[3]!, imdg)?.packingGroup).toBe('III')
  })

  it('falls back to the single candidate with the same packing group', () => {
    // ADR VG II "(vapour pressure … more than 110 kPa)" ↔ IMDG's only VG II row
    expect(matchVariant(adr[1]!, imdg)?.representative.limitedQty).toBe('1 L')
    // ADR viscous VG III ↔ IMDG VG III
    expect(matchVariant(adr[4]!, imdg)?.packingGroup).toBe('III')
  })

  it('matches variants without a packing group to each other', () => {
    const [chosen] = groupVariants(UN_0209.ADR!, 'ADR')
    expect(matchVariant(chosen!, groupVariants(UN_0209.ICAO!, 'ICAO'))).not.toBeNull()
  })

  it('returns null when several candidates share the packing group and none shares the specification', () => {
    const [chosen] = groupVariants([e({ packingGroup: 'II' })], 'ADR')
    const candidates = groupVariants([
      e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', limitedQty: '1 L' }),
      e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' }),
    ], 'IMDG')
    expect(candidates).toHaveLength(2)
    expect(matchVariant(chosen!, candidates)).toBeNull()
  })

  it('returns null for a single candidate with another packing group', () => {
    const [chosen] = groupVariants([e({ packingGroup: 'II' })], 'ADR')
    const candidates = groupVariants([e({ packingGroup: 'III' })], 'IMDG')
    expect(matchVariant(chosen!, candidates)).toBeNull()
  })

  it('returns null for no candidates', () => {
    expect(matchVariant(adr[0]!, [])).toBeNull()
  })
})

describe('orderedNames', () => {
  const [v] = groupVariants(UN_1203.ADR!, 'ADR')

  it('puts the current language first and de-duplicates case-insensitively', () => {
    expect(orderedNames(v!.names, 'de')).toEqual(['BENZIN', 'OTTOKRAFTSTOFF', 'MOTOR SPIRIT', 'GASOLINE', 'PETROL', 'ESSENCE'])
    expect(orderedNames(v!.names, 'en')[0]).toBe('MOTOR SPIRIT')
    expect(orderedNames(v!.names, 'fr')[0]).toBe('ESSENCE')
    expect(orderedNames(v!.names, 'tr')[0]).toBe('MOTOR SPIRIT')
    expect(orderedNames({ de: ['A'], en: ['a'], fr: [] }, 'de')).toEqual(['A'])
  })
})

describe('variantLabel', () => {
  const adr = groupVariants(UN_1993.ADR!, 'ADR')

  it('shows the packing group alone when there is no specification', () => {
    expect(variantLabel(adr[0]!, 'de', 'ADR', 'VP-Gr.')).toBe('VP-Gr. I')
  })

  it('adds the specification in the current language', () => {
    expect(variantLabel(adr[1]!, 'de', 'ADR', 'VP-Gr.')).toBe('VP-Gr. II · (Dampfdruck bei 50 °C größer als 110 kPa)')
    expect(variantLabel(adr[1]!, 'en', 'ADR', 'PG')).toBe('PG II · (vapour pressure at 50 °C more than 110 kPa)')
  })

  it('joins several specifications of a merged variant', () => {
    expect(variantLabel(adr[4]!, 'en', 'ADR', 'PG')).toContain(' / ')
  })

  it('uses the specification alone without a packing group, else the first name', () => {
    const [tnt] = groupVariants(UN_0209.RID!, 'RID')
    expect(variantLabel(tnt!, 'en', 'RID', 'PG')).toMatch(/^dry \/ wetted/)
    const [bare] = groupVariants([e({ name: 'STOFF' })], 'ADR')
    expect(variantLabel(bare!, 'de', 'ADR', 'VP-Gr.')).toBe('STOFF')
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test -- tests/variants.test.ts`
Expected: FAIL — cannot resolve `$lib/multimodal/variants`.

- [ ] **Step 4: Implement the module**

Create `src/lib/multimodal/variants.ts`:

```ts
import type { Entry, Lang, Modal } from './types'

/**
 * Regulatory variants of one UN number within one mode.
 *
 * BAM adds a row whenever a name exists in one language without a counterpart in another, so
 * most extra rows per UN number repeat the same regulatory data under another name. A variant is
 * the set of rows whose regulatory fields are identical; it carries every name of those rows.
 * See docs/superpowers/specs/2026-11-08-stoffsuche-variants-design.md.
 */

export interface VariantNames {
  de: string[]
  en: string[]
  fr: string[]
}

export interface Variant {
  /** serialised regulatory fields; equal keys = same variant */
  key: string
  /** rows of this mode sharing the regulatory data, in source order */
  entries: Entry[]
  /** entries[0]; the row whose values are displayed */
  representative: Entry
  packingGroup: string | null
  /** distinct names across all rows, per language, in source order */
  names: VariantNames
  /** distinct normalised English specifications of its rows ('' = row without one) */
  matchSpecs: string[]
}

/** fields that describe a row rather than regulate it */
const NON_REGULATORY: ReadonlySet<string> = new Set([
  'unNumber',
  'sequenceNumber',
  'name',
  'nameEn',
  'nameFr',
  'specification',
  'specificationEn',
  'specificationFr',
  'remark',
])

function regulatoryKey(entry: Entry): string {
  const pairs = Object.entries(entry)
    .filter(([field, value]) => !NON_REGULATORY.has(field) && value != null && value !== '')
    .map(([field, value]) => [field, String(value)])
    .sort(([a], [b]) => (a! < b! ? -1 : a! > b! ? 1 : 0))
  return JSON.stringify(pairs)
}

export function normalizeSpec(s: string | null | undefined): string {
  return (s ?? '').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '')
}

/** ICAO publishes English only: its `specification` column is the English one */
function englishSpec(entry: Entry, mode: Modal): string | undefined {
  return mode === 'ICAO' ? entry.specification : entry.specificationEn
}

function pushUnique(list: string[], value: string | undefined): void {
  if (value && !list.includes(value)) list.push(value)
}

export function groupVariants(entries: readonly Entry[], mode: Modal): Variant[] {
  const byKey = new Map<string, Variant>()
  for (const entry of entries) {
    const key = regulatoryKey(entry)
    let variant = byKey.get(key)
    if (!variant) {
      variant = {
        key,
        entries: [],
        representative: entry,
        packingGroup: entry.packingGroup ?? null,
        names: { de: [], en: [], fr: [] },
        matchSpecs: [],
      }
      byKey.set(key, variant)
    }
    variant.entries.push(entry)
    if (mode === 'ICAO') {
      pushUnique(variant.names.en, entry.name)
    }
    else {
      pushUnique(variant.names.de, entry.name)
      pushUnique(variant.names.en, entry.nameEn)
      pushUnique(variant.names.fr, entry.nameFr)
    }
    const spec = normalizeSpec(englishSpec(entry, mode))
    if (!variant.matchSpecs.includes(spec)) variant.matchSpecs.push(spec)
  }
  return [...byKey.values()]
}

/**
 * The variant of another mode that corresponds to `chosen`, or null when there is no
 * unambiguous one. Never guesses: two equally good candidates → null.
 */
export function matchVariant(chosen: Variant, candidates: readonly Variant[]): Variant | null {
  const samePg = candidates.filter(c => c.packingGroup === chosen.packingGroup)
  const sameSpec = samePg.filter(c => c.matchSpecs.some(s => chosen.matchSpecs.includes(s)))
  if (sameSpec.length === 1) return sameSpec[0]!
  if (samePg.length === 1) return samePg[0]!
  return null
}

const NAME_ORDER: Record<Lang, (keyof VariantNames)[]> = {
  de: ['de', 'en', 'fr'],
  en: ['en', 'de', 'fr'],
  fr: ['fr', 'en', 'de'],
  tr: ['en', 'de', 'fr'],
}

/** every name, current language first, case-insensitively de-duplicated */
export function orderedNames(names: VariantNames, lang: Lang): string[] {
  const out: string[] = []
  for (const l of NAME_ORDER[lang]) {
    for (const name of names[l]) {
      if (!out.some(o => o.toUpperCase() === name.toUpperCase())) out.push(name)
    }
  }
  return out
}

/** same fallback chain as MultimodalToolState.getSpez */
function localSpec(entry: Entry, lang: Lang, mode: Modal): string | undefined {
  if (mode === 'ICAO') return entry.specification
  if (lang === 'en' || lang === 'tr') return entry.specificationEn ?? entry.specification
  if (lang === 'fr') return entry.specificationFr ?? entry.specificationEn ?? entry.specification
  return entry.specification ?? entry.specificationEn
}

export function variantLabel(variant: Variant, lang: Lang, mode: Modal, pgShort: string): string {
  const specs: string[] = []
  for (const entry of variant.entries) pushUnique(specs, localSpec(entry, lang, mode)?.trim())
  const spec = specs.join(' / ')
  if (variant.packingGroup) {
    const pg = `${pgShort} ${variant.packingGroup}`
    return spec ? `${pg} · ${spec}` : pg
  }
  return spec || orderedNames(variant.names, lang)[0] || `#${variant.representative.sequenceNumber}`
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test -- tests/variants.test.ts`
Expected: PASS (all cases). If the `dry / wetted` expectation fails, print `variantLabel(tnt, 'en', 'RID', 'PG')` and check the fixture: RID rows 1–4 must merge into one variant; fix code, never the fixture.

- [ ] **Step 6: Leave changes uncommitted** (the owner commits).

---

### Task 2: Four-table search state

**Files:**
- Modify: `src/lib/search/search.svelte.ts` (whole file)
- Test: `tests/search.svelte.test.ts` (rewrite)

**Interfaces:**
- Consumes: `MODALS`, `Modal` from `src/lib/multimodal/types.ts`.
- Produces (used by Task 3):
  - `interface SearchResult { unNumber: string, primaryName: string, otherNames: string[], hazardClass: string | null, packingGroups: string[], modes: Modal[] }`
  - `SEARCH_TABLES: readonly { mode: Modal, table: string, nameColumns: readonly string[] }[]`
  - `mergeSearchRows(q: string, rowsByMode: Partial<Record<Modal, Record<string, unknown>[]>>): SearchResult[]`
  - `MIN_QUERY_LENGTH` (unchanged, 2), `MAX_RESULTS = 20`
  - `SearchState`: `query` (get/set), `results`, `selectedUn`, `isLoading`, `searchError: boolean`, `locked`, `select(un)`, `retry()`

- [ ] **Step 1: Rewrite the test file**

Replace `tests/search.svelte.test.ts` with:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_RESULTS, mergeSearchRows, MIN_QUERY_LENGTH, SearchState } from '$lib/search/search.svelte'

type Row = Record<string, unknown>
interface Res { data: Row[] | null, error: unknown }
interface Call {
  table: string
  columns: string
  orFilter: string
  resolve: (value: Res) => void
  reject: (reason: unknown) => void
}

const TABLES = ['adr_entries', 'rid_entries', 'imdg_entries', 'icao_entries']

/**
 * One chainable builder per from() call: from(table).select(cols).or(filter).order().limit()
 * → deferred promise. `calls` records them in order, four per search.
 */
function createSupabaseMock() {
  const calls: Call[] = []
  const from = vi.fn((table: string) => {
    const call = { table, columns: '', orFilter: '' } as Call
    const builder = {
      select: (columns: string) => { call.columns = columns; return builder },
      or: (filter: string) => { call.orFilter = filter; return builder },
      order: () => builder,
      limit: () => new Promise<Res>((resolve, reject) => {
        call.resolve = resolve
        call.reject = reject
        calls.push(call)
      }),
    }
    return builder
  })
  return { client: { from } as unknown as SupabaseClient, from, calls }
}

function batch(calls: Call[], n: number): Call[] {
  return calls.slice(n * 4, n * 4 + 4)
}

function resolveBatch(calls: Call[], n: number, rows: Partial<Record<string, Row[]>>, errors: Partial<Record<string, unknown>> = {}) {
  for (const c of batch(calls, n)) {
    c.resolve(errors[c.table] ? { data: null, error: errors[c.table] } : { data: rows[c.table] ?? [], error: null })
  }
}

const ADR_1203 = { un_number: '1203', name: 'BENZIN', name_en: 'MOTOR SPIRIT', name_fr: 'ESSENCE', hazard_class: '3', packing_group: 'II' }
const ADR_1203_B = { un_number: '1203', name: 'OTTOKRAFTSTOFF', name_en: 'GASOLINE', name_fr: null, hazard_class: '3', packing_group: 'II' }
const ADR_1203_C = { un_number: '1203', name: null, name_en: 'PETROL', name_fr: null, hazard_class: '3', packing_group: 'II' }
const ICAO_1203 = { un_number: '1203', name: 'Petrol', hazard_class: '3', packing_group: 'II' }

async function runSearchTimer() {
  await vi.advanceTimersByTimeAsync(300)
}

async function settle() {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

describe('mergeSearchRows', () => {
  it('lists each UN number once with all names, packing groups and modes', () => {
    const results = mergeSearchRows('benz', {
      ADR: [ADR_1203, ADR_1203_B, ADR_1203_C],
      ICAO: [ICAO_1203],
    })
    expect(results).toEqual([{
      unNumber: '1203',
      primaryName: 'BENZIN',
      otherNames: ['MOTOR SPIRIT', 'ESSENCE', 'OTTOKRAFTSTOFF', 'GASOLINE', 'PETROL'],
      hazardClass: '3',
      packingGroups: ['II'],
      modes: ['ADR', 'ICAO'],
    }])
  })

  it('uses the name that matched as the primary name', () => {
    const [r] = mergeSearchRows('petrol', { ADR: [ADR_1203, ADR_1203_C], ICAO: [ICAO_1203] })
    expect(r!.primaryName).toBe('PETROL')
    expect(r!.otherNames).not.toContain('Petrol')
  })

  it('sorts packing groups I < II < III', () => {
    const rows = ['III', 'I', 'II', 'III'].map(pg => ({ un_number: '1993', name: 'ENTZÜNDBARER FLÜSSIGER STOFF', packing_group: pg }))
    expect(mergeSearchRows('entz', { ADR: rows })[0]!.packingGroups).toEqual(['I', 'II', 'III'])
  })

  it('ranks UN prefix, then names starting with the query, then names containing it', () => {
    const results = mergeSearchRows('12', {
      ADR: [
        { un_number: '3000', name: 'X 12 CONTAINS' },
        { un_number: '2000', name: '12 STARTS' },
        { un_number: '1203', name: 'BENZIN' },
      ],
    })
    expect(results.map(r => r.unNumber)).toEqual(['1203', '2000', '3000'])
  })

  it('breaks ties by UN number and caps the list', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ un_number: String(3000 - i), name: 'ACID' }))
    const results = mergeSearchRows('acid', { ADR: rows })
    expect(results).toHaveLength(MAX_RESULTS)
    expect(results[0]!.unNumber).toBe('2971')
  })

  it('takes the class from the first mode that has one', () => {
    const [r] = mergeSearchRows('x', { RID: [{ un_number: '1', name: 'X', hazard_class: '8' }], IMDG: [{ un_number: '1', name: 'X', hazard_class: '9' }] })
    expect(r!.hazardClass).toBe('8')
  })
})

describe('SearchState', () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mock = createSupabaseMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not query below the minimum query length', async () => {
    const s = new SearchState(mock.client)
    s.query = 'B'
    await runSearchTimer()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.results).toEqual([])
  })

  it(`queries all four mode tables at ${MIN_QUERY_LENGTH} characters`, async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()

    expect(mock.calls.map(c => c.table)).toEqual(TABLES)
    const adr = mock.calls[0]!
    expect(adr.orFilter).toBe('name.ilike.%Be%,name_en.ilike.%Be%,name_fr.ilike.%Be%')
    expect(adr.columns).toBe('un_number, hazard_class, packing_group, name, name_en, name_fr')
    expect(mock.calls[2]!.orFilter).toBe('name.ilike.%Be%,name_en.ilike.%Be%')
    expect(mock.calls[3]!.orFilter).toBe('name.ilike.%Be%')
    expect(s.isLoading).toBe(true)

    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203], icao_entries: [ICAO_1203] })
    await settle()

    expect(s.isLoading).toBe(false)
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
    expect(s.results[0]!.modes).toEqual(['ADR', 'ICAO'])
  })

  it('adds a un_number prefix filter to every table for numeric queries', async () => {
    const s = new SearchState(mock.client)
    s.query = '12'
    await runSearchTimer()
    for (const c of mock.calls) expect(c.orFilter).toContain('un_number.ilike.12%')
  })

  it('does not add a un_number filter for text queries', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    for (const c of mock.calls) expect(c.orFilter).not.toContain('un_number')
  })

  it('strips PostgREST delimiters and LIKE wildcards from user input', async () => {
    const s = new SearchState(mock.client)
    s.query = 'a,b(c)d%e*f_g\\h'
    await runSearchTimer()
    expect(mock.calls[0]!.orFilter).toContain('name.ilike.%abcdefgh%')
  })

  it('loads the tool immediately for a 4-digit UN number without querying', async () => {
    const s = new SearchState(mock.client)
    s.query = '1203'
    await runSearchTimer()
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('reports an error and no results when one table fails', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] }, { imdg_entries: { message: 'down' } })
    await settle()
    expect(s.searchError).toBe(true)
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('reports an error when a query rejects', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    const [first, ...rest] = batch(mock.calls, 0)
    first!.reject(new Error('network'))
    for (const c of rest) c.resolve({ data: [], error: null })
    await settle()
    expect(s.searchError).toBe(true)
  })

  it('treats data: null without an error as an empty table', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    for (const c of batch(mock.calls, 0)) c.resolve({ data: c.table === 'adr_entries' ? [ADR_1203] : null, error: null })
    await settle()
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
  })

  it('retry() runs the current query again and clears the error on success', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'down' } })
    await settle()
    expect(s.searchError).toBe(true)

    s.retry()
    await settle()
    expect(batch(mock.calls, 1)).toHaveLength(4)
    resolveBatch(mock.calls, 1, { adr_entries: [ADR_1203] })
    await settle()
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
  })

  it('clears the error as soon as the query changes', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'down' } })
    await settle()
    s.query = 'Benzi'
    expect(s.searchError).toBe(false)
  })

  it('ignores a stale failure arriving after a newer success', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benz'
    await runSearchTimer()
    s.query = 'Benzi'
    await runSearchTimer()

    resolveBatch(mock.calls, 1, { adr_entries: [ADR_1203] })
    await settle()
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'late' } })
    await settle()

    expect(s.searchError).toBe(false)
    expect(s.results[0]!.unNumber).toBe('1203')
  })

  it('ignores a slow stale response arriving after a newer one', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benz'
    await runSearchTimer()
    s.query = 'Benzi'
    await runSearchTimer()

    resolveBatch(mock.calls, 1, { adr_entries: [ADR_1203] })
    await settle()
    resolveBatch(mock.calls, 0, { adr_entries: [{ ...ADR_1203, un_number: '9999' }] })
    await settle()
    expect(s.results).toHaveLength(1)
    expect(s.results[0]!.unNumber).toBe('1203')
  })

  it('clears results when the query drops below the minimum length', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] })
    await settle()
    expect(s.results).toHaveLength(1)

    s.query = 'B'
    await runSearchTimer()
    expect(s.results).toEqual([])
  })

  it('select() opens a UN and clears the result list', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] })
    await settle()
    s.select('1203')
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
  })
})

describe('SearchState when locked', () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mock = createSupabaseMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('never queries for a text search, nor on retry()', async () => {
    const s = new SearchState(mock.client, { locked: true })
    s.query = 'Benzin'
    await runSearchTimer()
    s.retry()
    await settle()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('does not select a UN number for a 4-digit query', async () => {
    const s = new SearchState(mock.client, { locked: true })
    s.query = '1203'
    await runSearchTimer()
    expect(s.selectedUn).toBeNull()
  })

  it('exposes the locked flag', () => {
    expect(new SearchState(mock.client, { locked: true }).locked).toBe(true)
    expect(new SearchState(mock.client).locked).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- tests/search.svelte.test.ts`
Expected: FAIL — `mergeSearchRows` / `MAX_RESULTS` not exported; the table assertions fail.

- [ ] **Step 3: Rewrite the search state**

Replace `src/lib/search/search.svelte.ts` with:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { type Modal, MODALS } from '$lib/multimodal/types'

export interface SearchResult {
  unNumber: string
  /** the name that matched the query best; the first name when only the UN number matched */
  primaryName: string
  /** every other name of the UN number, case-insensitively de-duplicated */
  otherNames: string[]
  hazardClass: string | null
  /** distinct, I < II < III */
  packingGroups: string[]
  /** modes with at least one matching row, in MODALS order */
  modes: Modal[]
}

interface SearchTable {
  mode: Modal
  table: string
  nameColumns: readonly string[]
}

/** ADN has no BAM table; un_entries is deliberately not searched (spec decision 4) */
export const SEARCH_TABLES: readonly SearchTable[] = [
  { mode: 'ADR', table: 'adr_entries', nameColumns: ['name', 'name_en', 'name_fr'] },
  { mode: 'RID', table: 'rid_entries', nameColumns: ['name', 'name_en', 'name_fr'] },
  { mode: 'IMDG', table: 'imdg_entries', nameColumns: ['name', 'name_en'] },
  { mode: 'ICAO', table: 'icao_entries', nameColumns: ['name'] },
]

const UN_NUMBER_RE = /^\d{4}$/
export const MIN_QUERY_LENGTH = 2
export const MAX_RESULTS = 20
const PER_TABLE_LIMIT = 50
const DEBOUNCE_MS = 300
const PG_ORDER = ['I', 'II', 'III']

type Row = Record<string, unknown>

/** PostgREST filter delimiters and LIKE wildcards would change what the filter means */
function sanitize(q: string): string {
  return q.trim().replace(/[,()%*_\\]/g, '')
}

const NO_MATCH = 3

function nameRank(name: string, needle: string): number {
  const lower = name.toLowerCase()
  if (lower.startsWith(needle)) return 1
  if (lower.includes(needle)) return 2
  return NO_MATCH
}

/**
 * Merges the rows of all mode tables into one result per UN number.
 * Rank: 0 UN-number prefix, 1 a name starts with the query, 2 a name contains it; ties by UN number.
 */
export function mergeSearchRows(q: string, rowsByMode: Partial<Record<Modal, Row[]>>): SearchResult[] {
  const needle = q.toLowerCase()
  const numeric = /^\d+$/.test(q)

  interface Acc {
    unNumber: string
    unMatch: boolean
    bestNameRank: number
    primaryName: string | null
    names: string[]
    hazardClass: string | null
    packingGroups: Set<string>
    modes: Set<Modal>
  }
  const byUn = new Map<string, Acc>()

  for (const { mode, nameColumns } of SEARCH_TABLES) {
    for (const row of rowsByMode[mode] ?? []) {
      const unNumber = String(row.un_number)
      let acc = byUn.get(unNumber)
      if (!acc) {
        acc = {
          unNumber,
          unMatch: numeric && unNumber.startsWith(q),
          bestNameRank: NO_MATCH,
          primaryName: null,
          names: [],
          hazardClass: null,
          packingGroups: new Set(),
          modes: new Set(),
        }
        byUn.set(unNumber, acc)
      }
      acc.modes.add(mode)
      if (acc.hazardClass == null && row.hazard_class) acc.hazardClass = String(row.hazard_class)
      if (row.packing_group) acc.packingGroups.add(String(row.packing_group))

      for (const column of nameColumns) {
        const name = row[column]
        if (typeof name !== 'string' || !name) continue
        if (!acc.names.some(n => n.toLowerCase() === name.toLowerCase())) acc.names.push(name)
        const rank = nameRank(name, needle)
        if (rank < acc.bestNameRank) {
          acc.bestNameRank = rank
          acc.primaryName = name
        }
      }
    }
  }

  const pgIndex = (pg: string) => {
    const i = PG_ORDER.indexOf(pg)
    return i === -1 ? PG_ORDER.length : i
  }

  return [...byUn.values()]
    .map((acc) => {
      const primaryName = acc.primaryName ?? acc.names[0] ?? ''
      return {
        rank: acc.unMatch ? 0 : acc.bestNameRank,
        result: {
          unNumber: acc.unNumber,
          primaryName,
          otherNames: acc.names.filter(n => n.toLowerCase() !== primaryName.toLowerCase()),
          hazardClass: acc.hazardClass,
          packingGroups: [...acc.packingGroups].sort((a, b) => pgIndex(a) - pgIndex(b)),
          modes: MODALS.filter(m => acc.modes.has(m)),
        } satisfies SearchResult,
      }
    })
    .sort((a, b) => a.rank - b.rank || a.result.unNumber.localeCompare(b.result.unNumber))
    .slice(0, MAX_RESULTS)
    .map(x => x.result)
}

/**
 * Live search state for /suche. Setting `query` debounces a name search across the ADR, RID,
 * IMDG and ICAO tables; a 4-digit UN number selects immediately without querying.
 * A failed table fails the whole search (`searchError`) — never shown as "no results".
 */
export class SearchState {
  #query = $state('')
  results = $state<SearchResult[]>([])
  selectedUn = $state<string | null>(null)
  isLoading = $state(false)
  searchError = $state(false)

  /** Locked accounts (not yet activated) never query; the page shows a lock notice instead. */
  readonly locked: boolean

  readonly #supabase: SupabaseClient
  #debounceTimer: ReturnType<typeof setTimeout> | null = null
  #requestId = 0

  constructor(supabase: SupabaseClient, options: { locked?: boolean } = {}) {
    this.#supabase = supabase
    this.locked = options.locked ?? false
  }

  get query(): string {
    return this.#query
  }

  set query(value: string) {
    this.#query = value
    if (this.locked) return
    this.searchError = false
    const trimmed = value.trim()
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)

    // 4-digit UN number: load tool immediately, skip debounce
    if (UN_NUMBER_RE.test(trimmed)) {
      this.results = []
      this.selectedUn = trimmed
      return
    }

    this.selectedUn = null
    if (trimmed.length < MIN_QUERY_LENGTH) {
      this.results = []
      return
    }
    this.#debounceTimer = setTimeout(() => this.#search(value), DEBOUNCE_MS)
  }

  select(unNumber: string): void {
    this.selectedUn = unNumber
    this.results = []
  }

  /** re-run the current query at once (after a failure) */
  retry(): void {
    if (this.locked) return
    void this.#search(this.#query)
  }

  #queryTable({ table, nameColumns }: SearchTable, q: string) {
    const filters = nameColumns.map(column => `${column}.ilike.%${q}%`)
    if (/^\d+$/.test(q)) filters.push(`un_number.ilike.${q}%`)
    return this.#supabase
      .from(table)
      .select(['un_number', 'hazard_class', 'packing_group', ...nameColumns].join(', '))
      .or(filters.join(','))
      .order('un_number')
      .limit(PER_TABLE_LIMIT)
  }

  async #search(q: string): Promise<void> {
    const trimmed = sanitize(q)
    if (trimmed.length < MIN_QUERY_LENGTH) {
      this.results = []
      return
    }

    const currentRequest = ++this.#requestId
    this.isLoading = true
    try {
      const responses = await Promise.all(SEARCH_TABLES.map(t => this.#queryTable(t, trimmed)))
      if (currentRequest !== this.#requestId) return

      const rowsByMode: Partial<Record<Modal, Row[]>> = {}
      SEARCH_TABLES.forEach(({ mode }, i) => {
        const { data, error } = responses[i]!
        if (error) throw error
        rowsByMode[mode] = (data ?? []) as unknown as Row[]
      })
      this.results = mergeSearchRows(trimmed, rowsByMode)
      this.searchError = false
    }
    catch {
      if (currentRequest === this.#requestId) {
        this.results = []
        this.searchError = true
      }
    }
    finally {
      if (currentRequest === this.#requestId) this.isLoading = false
    }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- tests/search.svelte.test.ts`
Expected: PASS. (`tests/search-page.test.ts` now fails — Task 3 fixes it.)

- [ ] **Step 5: Autofixer**

Run the Svelte MCP `svelte-autofixer` on `src/lib/search/search.svelte.ts`; fix and re-run until clean.

- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 3: `/suche` result cards and error box

**Files:**
- Modify: `src/routes/(app)/suche/+page.svelte` (script `displayName` removal; results / no-results branches)
- Test: `tests/search-page.test.ts`

**Interfaces:**
- Consumes: `SearchResult`, `SearchState.searchError`, `SearchState.retry()` from Task 2.

- [ ] **Step 1: Update the page tests**

In `tests/search-page.test.ts`:

Replace the `stubSearch` helper with a per-table version (keeps the old signature for "same rows in every table"):

```ts
function stubSearch(data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>, errors: Record<string, unknown> = {}) {
  const from = vi.fn((table: string) => {
    const rows = Array.isArray(data) ? data : (data[table] ?? [])
    const builder = {
      select: () => builder,
      or: () => builder,
      order: () => builder,
      limit: () => Promise.resolve(errors[table] ? { data: null, error: errors[table] } : { data: rows, error: null }),
    }
    return builder
  })
  return { client: { from } as unknown as SupabaseClient, from }
}
```

Replace the test `'renders result cards for a text query after the debounce'` with:

```ts
  it('renders one card per UN number with names, packing groups and modes', async () => {
    const { client } = stubSearch({
      adr_entries: [ROW, { ...ROW, name: 'OTTOKRAFTSTOFF', name_en: 'GASOLINE', name_fr: null }],
      icao_entries: [{ un_number: '1203', name: 'Petrol', hazard_class: '3', packing_group: 'II' }],
    })
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'Benzin')

    expect(container).toHaveTextContent('1 UN-Nummer')
    expect(container.querySelectorAll('.space-y-2 > button')).toHaveLength(1)
    expect(container).toHaveTextContent('UN 1203')
    expect(container).toHaveTextContent('BENZIN')
    expect(container).toHaveTextContent('OTTOKRAFTSTOFF')
    expect(container).toHaveTextContent('Kl. 3')
    expect(container).toHaveTextContent('VG II')
    const badges = [...container.querySelectorAll('[data-testid="mode-badge"]')].map(b => b.textContent?.trim())
    expect(badges).toEqual(['ADR', 'ICAO'])
  })

  it('lists every packing group of a UN number', async () => {
    const rows = ['I', 'II', 'III'].map(pg => ({ ...ROW, un_number: '1993', name: 'ENTZÜNDBARER FLÜSSIGER STOFF, N.A.G.', packing_group: pg }))
    const { client } = stubSearch({ adr_entries: rows })
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'entzünd')
    expect(container).toHaveTextContent('VG I · II · III')
  })

  it('shows an error with a retry button instead of "Keine Ergebnisse" when a table fails', async () => {
    const { client, from } = stubSearch([], { rid_entries: { message: 'down' } })
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'Benzin')

    expect(container.querySelector('[role="alert"]')).toHaveTextContent('Die Suche ist fehlgeschlagen. Bitte versuche es erneut.')
    expect(container).not.toHaveTextContent('Keine Ergebnisse')

    const before = from.mock.calls.length
    await fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    await vi.advanceTimersByTimeAsync(0)
    expect(from.mock.calls.length).toBe(before + 4)
  })
```

Add `screen` to the `@testing-library/svelte` import. In `'opens the tool when a result card is clicked'` replace the last line (`…not.toHaveTextContent('Ergebnisse (ADR)')`) with:

```ts
    expect(container.querySelector('.space-y-2')).toBeNull()
```

In the locked test `'never queries when typing, even a 4-digit UN number'` replace `expect(container).not.toHaveTextContent('Ergebnisse (ADR)')` with `expect(container.querySelector('.space-y-2')).toBeNull()`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- tests/search-page.test.ts`
Expected: FAIL — "1 UN-Nummer", mode badges and the alert are not rendered; `displayName` reads removed fields.

- [ ] **Step 3: Update the page**

In `src/routes/(app)/suche/+page.svelte`:

Script: change the import line to
```ts
  import { MIN_QUERY_LENGTH, SearchState } from '$lib/search/search.svelte'
```
and delete the `displayName` function.

Replace everything from `{:else if search.results.length > 0}` up to (not including) `<!-- Tool -->` with:

```svelte
    {:else if search.searchError}
      <!-- a failed search must never read as "no results" -->
      <div role="alert" class="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-800">
        <p class="text-sm mb-4">Die Suche ist fehlgeschlagen. Bitte versuche es erneut.</p>
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 bg-white hover:bg-red-100 transition-colors"
          disabled={search.isLoading}
          onclick={() => search.retry()}
        >Erneut versuchen</button>
      </div>
    {:else if search.results.length > 0}
      <!-- Results list: one card per UN number -->
      <div class="space-y-2">
        <p class="text-xs text-[#5a7a99] mb-3">
          {search.results.length} {search.results.length === 1 ? 'UN-Nummer' : 'UN-Nummern'}
        </p>
        {#each search.results as r (r.unNumber)}
          <button
            type="button"
            class="w-full text-left bg-white rounded-xl px-5 py-4 shadow-sm border border-transparent hover:border-orange-300 hover:shadow-md transition-all group"
            onclick={() => search.select(r.unNumber)}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <span class="font-mono font-bold text-[#0f2744] text-sm group-hover:text-orange-600 transition-colors">
                  UN {r.unNumber}
                </span>
                <p class="text-sm text-[#0f2744] mt-0.5 truncate">{r.primaryName}</p>
                {#if r.otherNames.length > 0}
                  <p class="text-xs text-[#5a7a99] mt-0.5 line-clamp-2">{r.otherNames.join(' · ')}</p>
                {/if}
                <div class="flex flex-wrap gap-1 mt-2">
                  {#each r.modes as mode (mode)}
                    <span data-testid="mode-badge" class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[#e8eef5] text-[#5a7a99]">{mode}</span>
                  {/each}
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                {#if r.hazardClass}
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#e8eef5] text-[#0f2744]">
                    Kl. {r.hazardClass}
                  </span>
                {/if}
                {#if r.packingGroups.length > 0}
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#e8eef5] text-[#5a7a99]">
                    VG {r.packingGroups.join(' · ')}
                  </span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {:else if !search.isLoading && !search.selectedUn}
      <!-- No results: only after every table answered successfully -->
      <div class="text-center py-16">
        <p class="text-[#5a7a99] text-sm">Keine Ergebnisse für „{search.query}"</p>
      </div>
    {/if}

```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- tests/search-page.test.ts tests/search.svelte.test.ts`
Expected: PASS.

- [ ] **Step 5: Autofixer + Tailwind guard**

Run `svelte-autofixer` on `src/routes/(app)/suche/+page.svelte` until clean. Run `pnpm test -- tests/tailwind-classes.test.ts`; expected PASS (`line-clamp-2` is a core v4 utility).

- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 4: Variant state in `MultimodalToolState`

**Files:**
- Modify: `src/lib/multimodal/types.ts` (`LABELS`, all four languages)
- Modify: `src/lib/multimodal/multimodalTool.svelte.ts`
- Test: `tests/multimodalTool.svelte.test.ts` (append a describe block)

**Interfaces:**
- Consumes: `Variant`, `groupVariants`, `matchVariant`, `orderedNames`, `variantLabel` (Task 1); fixtures `UN_1203`, `UN_1993` (Task 1).
- Produces (used by Task 5), all on `MultimodalToolState`:
  - `variantsByMode: Partial<Record<Modal, Variant[]>>` (derived)
  - `anchorMode: Modal | null` (derived) · `anchorVariants: Variant[]` (derived)
  - `selectedVariantIndex: number` ($state) · `overrides: Partial<Record<Modal, number>>` ($state)
  - `hasRows(mode: Modal): boolean` · `variantFor(mode: Modal): Variant | null` · `isUnmatched(mode: Modal): boolean`
  - `selectVariant(index: number): void` · `overrideVariant(mode: Modal, index: number): void`
  - `variantNames(mode: Modal): { primary: string, others: string[] }`
  - `labelOf(variant: Variant, mode: Modal): string`
  - `getEntry(modal)` now returns `variantFor(modal)?.representative ?? null`
  - LABELS keys `variant`, `noVariantMatch` (contains the placeholder `{mode}`)

- [ ] **Step 1: Write the failing tests**

Append to `tests/multimodalTool.svelte.test.ts` (add `import type { Entry } from '$lib/multimodal/types'` and `import { UN_1203, UN_1993 } from './fixtures/variant-rows'` to the imports):

```ts
describe('MultimodalToolState — variants', () => {
  function tool1993() {
    return new MultimodalToolState({ initialData: UN_1993 as Record<string, Entry[]>, initialUnNumber: '1993' })
  }

  const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
  /** ADR one variant VG II; IMDG two VG II variants with unrelated specifications → no match */
  const AMBIGUOUS: Record<string, Entry[]> = {
    ADR: [e({ name: 'STOFF', packingGroup: 'II', limitedQty: '1 L' })],
    IMDG: [
      e({ sequenceNumber: 1, name: 'STOFF', packingGroup: 'II', specificationEn: 'A', limitedQty: '1 L' }),
      e({ sequenceNumber: 2, name: 'STOFF', packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' }),
    ],
  }

  it('lists the anchor mode variants and starts on the first', () => {
    const tool = tool1993()
    expect(tool.anchorMode).toBe('ADR')
    expect(tool.anchorVariants).toHaveLength(5)
    expect(tool.selectedVariantIndex).toBe(0)
    expect(tool.getEntry('ADR')?.packingGroup).toBe('I')
    expect(tool.getEntry('IMDG')?.packingGroup).toBe('I')
  })

  it('applies the chosen variant to every mode', () => {
    const tool = tool1993()
    tool.selectVariant(3) // ADR row 4: VG III, tunnel code D/E
    expect(tool.getEntry('ADR')?.tunnelCode).toBe('D/E')
    expect(tool.getEntry('RID')?.packingGroup).toBe('III')
    expect(tool.getEntry('IMDG')?.limitedQty).toBe('5 L')
    expect(tool.getEntry('ICAO')?.packingGroup).toBe('III')

    tool.selectVariant(4) // viscous VG III, tunnel code E
    expect(tool.getEntry('ADR')?.tunnelCode).toBe('E')
    expect(tool.getEntry('IMDG')?.packingGroup).toBe('III')
  })

  it('shows no picker material for a UN number with one variant', () => {
    const tool = new MultimodalToolState({ initialData: UN_1203 as Record<string, Entry[]>, initialUnNumber: '1203' })
    expect(tool.anchorVariants).toHaveLength(1)
  })

  it('names every row of the current variant, current language first', () => {
    const tool = new MultimodalToolState({ initialData: UN_1203 as Record<string, Entry[]>, initialUnNumber: '1203' })
    expect(tool.variantNames('ADR')).toEqual({
      primary: 'BENZIN',
      others: ['OTTOKRAFTSTOFF', 'MOTOR SPIRIT', 'GASOLINE', 'PETROL', 'ESSENCE'],
    })
    tool.setLang('en')
    expect(tool.variantNames('ADR').primary).toBe('MOTOR SPIRIT')
    expect(tool.variantNames('ADN')).toEqual({ primary: '', others: [] })
  })

  it('labels variants with the localised packing-group prefix', () => {
    const tool = tool1993()
    expect(tool.labelOf(tool.anchorVariants[0]!, 'ADR')).toBe('VP-Gr. I')
    tool.setLang('en')
    expect(tool.labelOf(tool.anchorVariants[0]!, 'ADR')).toBe('PG I')
  })

  it('reports a mode without an unambiguous match instead of guessing', () => {
    const tool = new MultimodalToolState({ initialData: AMBIGUOUS, initialUnNumber: '9999' })
    expect(tool.isUnmatched('IMDG')).toBe(true)
    expect(tool.getEntry('IMDG')).toBeNull()
    expect(tool.hasRows('IMDG')).toBe(true)
  })

  it('lets the user pick for an unmatched mode, and resets that pick on a new main choice', () => {
    const tool = new MultimodalToolState({ initialData: AMBIGUOUS, initialUnNumber: '9999' })
    tool.overrideVariant('IMDG', 1)
    expect(tool.getEntry('IMDG')?.limitedQty).toBe('5 L')
    expect(tool.isUnmatched('IMDG')).toBe(false)
    tool.selectVariant(0)
    expect(tool.getEntry('IMDG')).toBeNull()
  })

  it('treats a mode without rows as not available, not as unmatched', () => {
    const tool = tool1993()
    expect(tool.hasRows('ADN')).toBe(false)
    expect(tool.isUnmatched('ADN')).toBe(false)
    expect(tool.getEntry('ADN')).toBeNull()
  })

  it('allows switching to an unmatched mode', () => {
    const tool = new MultimodalToolState({ initialData: AMBIGUOUS, initialUnNumber: '9999' })
    tool.switchModal('IMDG')
    expect(tool.currentModal).toBe('IMDG')
  })

  it('resets the selection and overrides when a new UN number loads', async () => {
    const rows = UN_1203.ADR!.map(r => ({ un_number: r.unNumber, sequence_number: r.sequenceNumber, name: r.name, packing_group: r.packingGroup }))
    const { client } = stubSupabase({ adr_entries: { data: rows, error: null } })
    const tool = new MultimodalToolState({ initialData: UN_1993 as Record<string, Entry[]>, initialUnNumber: '1993', supabase: client })
    tool.selectVariant(4)
    tool.overrideVariant('IMDG', 2)
    await tool.loadCompare('1203')
    expect(tool.selectedVariantIndex).toBe(0)
    expect(tool.overrides).toEqual({})
    expect(tool.getEntry('ADR')?.sequenceNumber).toBe(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- tests/multimodalTool.svelte.test.ts`
Expected: FAIL — `anchorMode`, `selectVariant`, … are undefined.

- [ ] **Step 3: Add the labels**

In `src/lib/multimodal/types.ts`, add to each `LABELS` language object (after `retry`):

```ts
    // de
    variant: 'Variante', noVariantMatch: 'Für diese Variante gibt es in {mode} keine eindeutige Entsprechung. Bitte wähle:',
    // en
    variant: 'Variant', noVariantMatch: 'There is no unambiguous match for this variant in {mode}. Please choose:',
    // fr
    variant: 'Variante', noVariantMatch: 'Aucune correspondance univoque pour cette variante en {mode}. Veuillez choisir :',
    // tr
    variant: 'Varyant', noVariantMatch: 'Bu varyant için {mode} içinde net bir karşılık yok. Lütfen seçin:',
```

(Only the key/value pairs go in — the `// de` comments mark which object each line belongs to.)

- [ ] **Step 4: Implement the state**

In `src/lib/multimodal/multimodalTool.svelte.ts`:

Add the import:
```ts
import { groupVariants, matchVariant, orderedNames, type Variant, variantLabel } from './variants'
```

Add to the `// ── State` block:
```ts
  /** index into the anchor mode's variants (the main picker) */
  selectedVariantIndex = $state(0)
  /** manual pick per mode where matching found no unambiguous variant */
  overrides = $state<Partial<Record<Modal, number>>>({})
```

Add to the `// ── Derived` block, **before** `currentEntry` (derived fields initialise in order):
```ts
  readonly variantsByMode: Partial<Record<Modal, Variant[]>> = $derived.by(() => {
    const out: Partial<Record<Modal, Variant[]>> = {}
    for (const mode of MODALS) out[mode] = groupVariants(this.compareData[mode] ?? [], mode)
    return out
  })

  /** the first mode with rows; its variants feed the picker */
  readonly anchorMode: Modal | null = $derived(MODALS.find(m => (this.compareData[m]?.length ?? 0) > 0) ?? null)

  readonly anchorVariants: Variant[] = $derived(this.anchorMode ? (this.variantsByMode[this.anchorMode] ?? []) : [])
```

Replace `getEntry` and add the variant helpers in `// ── Helpers`:
```ts
  hasRows(mode: Modal): boolean {
    return (this.compareData[mode]?.length ?? 0) > 0
  }

  variantFor(mode: Modal): Variant | null {
    const variants = this.variantsByMode[mode] ?? []
    if (variants.length === 0) return null
    const chosen = this.anchorVariants[this.selectedVariantIndex] ?? this.anchorVariants[0] ?? null
    if (mode === this.anchorMode) return chosen
    const override = this.overrides[mode]
    if (override != null) return variants[override] ?? null
    return chosen ? matchVariant(chosen, variants) : null
  }

  /** the mode has rows, but none corresponds unambiguously to the chosen variant */
  isUnmatched(mode: Modal): boolean {
    return this.hasRows(mode) && this.variantFor(mode) === null
  }

  getEntry(modal: string): Entry | null {
    return this.variantFor(modal as Modal)?.representative ?? null
  }

  variantNames(mode: Modal): { primary: string, others: string[] } {
    const variant = this.variantFor(mode)
    if (!variant) return { primary: '', others: [] }
    const [primary = '', ...others] = orderedNames(variant.names, this.currentLang)
    return { primary, others }
  }

  labelOf(variant: Variant, mode: Modal): string {
    return variantLabel(variant, this.currentLang, mode, this.L('pgShort'))
  }
```

Add to `// ── Actions`:
```ts
  selectVariant(index: number): void {
    this.selectedVariantIndex = index
    this.overrides = {}
  }

  overrideVariant(mode: Modal, index: number): void {
    this.overrides = { ...this.overrides, [mode]: index }
  }
```

Change `switchModal` to:
```ts
  switchModal(modal: Modal): void {
    if (this.hasRows(modal)) this.currentModal = modal
  }
```

In `loadCompare`, add these two lines directly after `this.isLoading = true` (before `try`), so both success and failure start from a clean selection:
```ts
    this.selectedVariantIndex = 0
    this.overrides = {}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test -- tests/multimodalTool.svelte.test.ts tests/multimodal-i18n.test.ts tests/MultimodalTool.test.ts`
Expected: PASS, including every pre-existing case (demo data has one row per mode, so behaviour is unchanged for it).

- [ ] **Step 6: Autofixer**

Run `svelte-autofixer` on `src/lib/multimodal/multimodalTool.svelte.ts` until clean.

- [ ] **Step 7: Leave changes uncommitted.**

---

### Task 5: Picker, names and unmatched note in `MultimodalTool.svelte`

**Files:**
- Modify: `src/lib/multimodal/MultimodalTool.svelte`
- Test: `tests/MultimodalTool.test.ts` (append a describe block)

**Interfaces:**
- Consumes: everything Task 4 produces.

- [ ] **Step 1: Write the failing tests**

Append to `tests/MultimodalTool.test.ts` (add `import type { Entry } from '$lib/multimodal/types'` and `import { UN_1203, UN_1993 } from './fixtures/variant-rows'`):

```ts
describe('MultimodalTool — variants', () => {
  function render1993() {
    const { client } = stubSupabase({})
    return render(MultimodalTool, { props: { unNumber: '1993', initialData: UN_1993 as Record<string, Entry[]>, supabase: client } })
  }

  it('shows the variant picker for a UN number with several variants', () => {
    render1993()
    const picker = screen.getByRole('group', { name: 'Variante' })
    const buttons = picker.querySelectorAll('button')
    expect(buttons).toHaveLength(5)
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[0]).toHaveTextContent('VP-Gr. I')
  })

  it('hides the picker when there is only one variant', () => {
    const { client } = stubSupabase({})
    render(MultimodalTool, { props: { unNumber: '1203', initialData: UN_1203 as Record<string, Entry[]>, supabase: client } })
    expect(screen.queryByRole('group', { name: 'Variante' })).toBeNull()
  })

  it('switches every tab to the chosen variant', async () => {
    const { container } = render1993()
    const buttons = screen.getByRole('group', { name: 'Variante' }).querySelectorAll('button')
    await fireEvent.click(buttons[3]!)
    expect(buttons[3]).toHaveAttribute('aria-pressed', 'true')
    expect(container).toHaveTextContent('5 L')
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    expect(container.querySelector('[role="tabpanel"]')).toHaveTextContent('VP-Gr. III')
  })

  it('shows every name of the variant in the header', () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '1203', initialData: UN_1203 as Record<string, Entry[]>, supabase: client } })
    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel).toHaveTextContent('BENZIN')
    expect(panel).toHaveTextContent('OTTOKRAFTSTOFF · MOTOR SPIRIT · GASOLINE · PETROL · ESSENCE')
  })

  it('explains an unmatched mode and offers its own variants', async () => {
    const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
    const data: Record<string, Entry[]> = {
      ADR: [e({ name: 'STOFF', packingGroup: 'II', limitedQty: '1 L' })],
      IMDG: [
        e({ sequenceNumber: 1, name: 'STOFF', packingGroup: 'II', specificationEn: 'A', specification: 'A', limitedQty: '1 L' }),
        e({ sequenceNumber: 2, name: 'STOFF', packingGroup: 'II', specificationEn: 'B', specification: 'B', limitedQty: '5 L' }),
      ],
    }
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '9999', initialData: data, supabase: client } })

    const imdgTab = screen.getByRole('tab', { name: /IMDG/ })
    expect(imdgTab).not.toBeDisabled()
    await fireEvent.click(imdgTab)

    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel).toHaveTextContent('Für diese Variante gibt es in IMDG keine eindeutige Entsprechung. Bitte wähle:')
    expect(panel).not.toHaveTextContent('nicht vorhanden')
    expect(panel).not.toHaveTextContent('5 L')

    const own = screen.getByRole('group', { name: 'Variante (IMDG)' }).querySelectorAll('button')
    expect(own).toHaveLength(2)
    await fireEvent.click(own[1]!)
    expect(panel).toHaveTextContent('5 L')
  })

  it('marks an unmatched mode with "?" in the overview strip', () => {
    const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
    const data: Record<string, Entry[]> = {
      ADR: [e({ packingGroup: 'II' })],
      IMDG: [e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A' }), e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' })],
    }
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '9999', initialData: data, supabase: client } })
    expect(container.querySelector('[data-testid="overview-IMDG"]')).toHaveTextContent('?')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- tests/MultimodalTool.test.ts`
Expected: FAIL — no `group` named "Variante", no unmatched note, the IMDG tab is disabled.

- [ ] **Step 3: Implement the markup**

All edits in `src/lib/multimodal/MultimodalTool.svelte`.

(a) Picker — insert directly after `{:else if tool.hasData}` (before `<!-- Compare overview -->`):

```svelte
      <!-- Variant picker: one choice for all tabs (spec 2026-11-08) -->
      {#if tool.anchorMode && tool.anchorVariants.length > 1}
        {@const anchor = tool.anchorMode}
        <div
          role="group"
          aria-label={tool.L('variant')}
          class="flex flex-wrap items-center gap-2 px-4 py-3 mb-0.5 bg-[#f4f7fa] border border-[#b0c4d8]"
        >
          <span class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mr-1">
            {tool.L('variant')} · {anchor}
          </span>
          {#each tool.anchorVariants as variant, i (variant.key)}
            {@const label = tool.labelOf(variant, anchor)}
            <button
              type="button"
              aria-pressed={tool.selectedVariantIndex === i}
              title={label}
              class={['max-w-full sm:max-w-xs truncate px-2.5 py-1 font-mono text-[11px] font-bold border transition-colors', tool.selectedVariantIndex === i
                ? 'bg-orange-500 border-orange-500 text-black'
                : 'bg-[#dce8f2] border-[#b0c4d8] text-[#0f2744] hover:border-orange-400']}
              onclick={() => tool.selectVariant(i)}
            >{label}</button>
          {/each}
        </div>
      {/if}
```

(b) Overview strip — in the `{#each tool.MODALS as modal (modal)}` block of the overview, add `data-testid={`overview-${modal}`}` to the card `<div` (next to `role="button"`), and replace

```svelte
              {:else}
                <div class="text-xs italic text-[#b0c4d8]">–</div>
              {/if}
              <div class="text-[10px] text-[#5a7a99] mt-1 leading-tight">{tool.modalDesc(modal)}</div>
```

with

```svelte
              {:else if tool.isUnmatched(modal)}
                <div class="font-mono text-base font-bold text-amber-600" title={tool.L('noVariantMatch').replace('{mode}', modal)}>?</div>
              {:else}
                <div class="text-xs italic text-[#b0c4d8]">–</div>
              {/if}
              <div class="text-[10px] text-[#5a7a99] mt-1 leading-tight">{tool.modalDesc(modal)}</div>
```

and make unmatched cards clickable: in the same card, replace every `entry` in the `class`, `tabindex`, `onclick` and `onkeydown` expressions with `tool.hasRows(modal)` (the content block keeps using `entry`).

(c) Tabs — in the `<!-- Modal tabs -->` loop, replace the `entry` conditions with row checks and colour the dot by match state:

```svelte
          {@const entry = tool.getEntry(modal)}
          {@const rows = tool.hasRows(modal)}
```
then use `rows` instead of `entry` in the button's `class` ternary, `disabled={!rows}` and `onclick={() => { if (rows) tool.switchModal(modal) }}`, and change the dot to
```svelte
            <span class={['w-1.5 h-1.5 rounded-full', entry ? 'bg-orange-500' : rows ? 'bg-amber-500' : 'bg-[#b0c4d8]']}></span>
```

(d) Header names — add this line directly after `{@const currentEntry = tool.currentEntry}` (`{@const}` is only allowed as the first child of a block, not inside the `<div>`):

```svelte
          {@const names = tool.variantNames(tool.currentModal)}
```

then replace

```svelte
              <div class="text-base font-semibold text-[#0f2744]">{tool.getName(currentEntry)}</div>
              {#if tool.getNameSub(currentEntry)}
                <div class="text-sm text-[#5a7a99] mt-0.5">
                  {tool.getNameSub(currentEntry)}
                </div>
              {/if}
```

with

```svelte
              <div class="text-base font-semibold text-[#0f2744]">{names.primary}</div>
              {#if names.others.length > 0}
                <div class="text-sm text-[#5a7a99] mt-0.5">
                  {names.others.join(' · ')}
                </div>
              {/if}
```

(e) Unmatched panel — replace

```svelte
        {:else}
          <!-- Empty state (no data for current modal) -->
```

with

```svelte
        {:else if tool.isUnmatched(tool.currentModal)}
          {@const mode = tool.currentModal}
          <!-- rows exist, but none corresponds unambiguously: ask, never guess -->
          <div class="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p class="mb-3">{tool.L('noVariantMatch').replace('{mode}', mode)}</p>
            <div role="group" aria-label={`${tool.L('variant')} (${mode})`} class="flex flex-wrap gap-2">
              {#each tool.variantsByMode[mode] ?? [] as variant, i (variant.key)}
                {@const label = tool.labelOf(variant, mode)}
                <button
                  type="button"
                  title={label}
                  class="max-w-full sm:max-w-xs truncate px-2.5 py-1 font-mono text-[11px] font-bold border border-amber-400 bg-white text-[#0f2744] hover:border-orange-500 transition-colors"
                  onclick={() => tool.overrideVariant(mode, i)}
                >{label}</button>
              {/each}
            </div>
          </div>
        {:else}
          <!-- Empty state (no data for current modal) -->
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- tests/MultimodalTool.test.ts tests/multimodalTool.svelte.test.ts tests/un-page.test.ts`
Expected: PASS, including the pre-existing demo/language/link cases.

- [ ] **Step 5: Autofixer + Tailwind guard**

Run `svelte-autofixer` on `src/lib/multimodal/MultimodalTool.svelte` until clean. Run `pnpm test -- tests/tailwind-classes.test.ts`; expected PASS.

- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 6: Full verification and docs

**Files:**
- Modify: `docs/STATUS.md`, `docs/README.md`

- [ ] **Step 1: Whole suite, type check, build**

Run: `pnpm test` → all green (previous count 706 plus the new cases; report the new total).
Run: `pnpm check` → 0 errors, 0 warnings in touched files.
Run: `pnpm build` → succeeds.

- [ ] **Step 2: Smoke test**

`pnpm preview`, then `curl -s -o /dev/null -w '%{http_code}' http://localhost:4173/healthz` → `200` (or `503` only when `ADR_BOOK_PATH` is unset locally — note which). `/suche` and `/un/1993` need an activated login against the live project; do **not** log in or create users. Report that the browser check of the picker is left to the owner, with these three URLs to try: `/un/1993` (picker, 5 variants), `/un/1203` (no picker, five names), `/suche` → "petrol" (one card, PETROL as primary name).

- [ ] **Step 3: Update `docs/STATUS.md`**

- Header line: today's date, new test count.
- F-01 row: `✅ done` — "searches ADR/RID/IMDG/ICAO, one card per UN number, error state; variant picker in the tool (spec 2026-11-08)".
- Next steps: drop item 3 (Stoffsuche gaps); F-10 item now reads "F-10 regulatory comparison — open question #1 answered (variants); open questions #2 (critical fields) and #3 (landing Phase 2 claims) remain; refresh the 2026-09-28 plan on top of `variants.ts`".
- Known issues: add "Search ranks within the first 50 rows per table (ordered by UN number); a very broad query can miss a better-ranked name further down."

- [ ] **Step 4: Update `docs/README.md`**

Row `2026-11-08 | Stoffsuche gaps + regulatory variants (F-01)`: status `✅ done`, plan link `[plan](superpowers/plans/2026-11-08-stoffsuche-variants.md)`. Add an "Execution notes" section at the end of this plan recording any deviation taken during the build.

- [ ] **Step 5: Leave changes uncommitted** and tell the owner what is ready to commit.

---

## Execution notes (2026-11-08, native execution)

- No worktree, no commits: CLAUDE.md — the owner commits. Per-file test runs used `pnpm exec vitest run <file>` (`pnpm test -- <file>` runs the whole suite).
- Task 1: added a test that pins matchVariant rule 1 (mutation check showed the plan's tests passed without it).
- Task 4: added "refuses to switch to a mode whose row list is empty" (ADN: []); `switchModal` now checks `hasRows`.
- Final review (fresh reviewer) → five fixes, each test-first: selection reset moved after the load's await and no silent fallback to variant 0; every query change invalidates in-flight search responses; `SearchState.belowMinimum` uses the sanitised query (`%%` keeps the empty state; `"` stripped too); a manual pick stays visible and revisable (`manualVariant` label, `modePicker` snippet); the header lists every specification of a merged variant (`variantSpecs`).
- Result: 766 tests green, `pnpm check` 0 errors (5 pre-existing `@apply` warnings), `pnpm build` OK, preview `/healthz` 200. Browser check of the picker left to the owner.
