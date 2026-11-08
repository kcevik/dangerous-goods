# Regulatory Comparison View (F-10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Rewritten 2026-11-08.** The first version of this plan (2026-09-28) was never started; it
> predated the variant model (`src/lib/multimodal/variants.ts`) and the comparability
> measurements now in the spec's "Revision 2026-11-08".

**Goal:** A side-by-side comparison of ADR, RID, IMDG, ICAO (plus ADN as "no data" and the UN Model Regulations as a grey reference column) for one UN number at `/un/:nummer/vergleich`, flagging only real differences, and a landing page that shows only what ships.

**Architecture:** `compare.ts` is pure: a field registry (which modes carry a field, which share a notation and are compared), per-kind normalisation, `buildComparison` and `summarizeDeviations`. `ComparisonViewState` reuses `groupVariants`/`matchVariant` for the variant choice and derives the rows. Components render; the route mirrors `/un/[nummer]` including the locked branch.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind v4 (hand-written), Supabase JS, Vitest 5 + jsdom + @testing-library/svelte, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-28-regulatory-comparison-design.md` (read the "Revision 2026-11-08" section last — it overrides §1's `modes`-only model).

## Global Constraints

- pnpm only. Per-file test runs: `pnpm exec vitest run <file>`; whole suite `pnpm test`.
- **The owner commits.** Never `git add` / `git commit` / inspect history. Tasks end with "leave changes uncommitted".
- Test-first: write the failing test, watch it fail for the right reason, implement, watch it pass.
- Svelte MCP `svelte-autofixer` on every new or touched `.svelte` / `.svelte.ts` until no new issues (the "href without resolve()" warning on query-string links is a known false positive).
- Svelte 5 runes only; logic in `.svelte.ts` classes; never a variable named `state`.
- English identifiers; German "du" copy. Tool labels live in `LABELS` (de/en/fr/tr, identical key sets — `tests/multimodal-i18n.test.ts` enforces it).
- Internal links via `resolve()` with group route IDs, e.g. `resolve('/(app)/un/[nummer]/vergleich', { nummer })`.
- Locked accounts never query regulation tables; they get `DEMO_DATA` for UN 1203 only.
- Failures are never "no data": a failed load throws (German error page), never an empty table.
- Absence is not a deviation; values outside a field's `compareModes` are shown, never compared.
- No database or migration change. `un_entries` is read with the existing `activated read` RLS policy.

## Review Focus

1. **Explosives and gases** (`hazardClass` `1` vs `1.1D`, `2` vs `2.3`) must read `same` when compatible and `differs` when two divisions disagree — Task 2 tests both.
2. **A mode whose variant is unresolved** shows "?" and never counts as agreeing or disagreeing — Task 2 (`unresolved`) and Task 3.
3. **Language-only differences** (`siehe SV 251` vs `See SP251`) are `same` — Task 2.
4. **The UN reference column never changes a row's status**, and an unmatched reference variant reads "?" not "–" — Task 2 and Task 3.
5. **Narrow screens:** the table scrolls inside its own container, the first column stays visible, the page body never scrolls sideways — Task 4 asserts the container class; the owner checks at 375 px.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/multimodal/variants.ts` | gains the `'UN'` source (English-only like ICAO) |
| `src/lib/multimodal/mappers.ts` | gains `fetchUnReference` (reads `un_entries`) |
| `src/lib/multimodal/compare.ts` (new) | registry, normalisation, `buildComparison`, `summarizeDeviations` |
| `src/lib/multimodal/comparisonView.svelte.ts` (new) | `ComparisonViewState` |
| `src/lib/multimodal/VariantPicker.svelte` (new) | row of variant buttons |
| `src/lib/multimodal/ComparisonTable.svelte` (new) | the grid |
| `src/lib/multimodal/ComparisonLegend.svelte` (new) | legend + BAM attribution |
| `src/lib/multimodal/ComparisonView.svelte` (new) | header, picker, notes, summary, toggle, table, legend |
| `src/lib/multimodal/types.ts` | new `LABELS` keys |
| `src/routes/(app)/un/[nummer]/vergleich/+page.server.ts`, `+page.svelte` (new) | load + page |
| `src/routes/(app)/un/[nummer]/+page.svelte`, `src/routes/(app)/suche/+page.svelte`, `src/routes/(app)/dashboard/+page.svelte` | entry links |
| `src/lib/landing/Comparison.svelte`, `Hero.svelte`, `MultimodalDemo.svelte` | landing truthfulness (spec §7) |
| `CLAUDE.md`, `docs/STATUS.md`, `docs/README.md` | docs |

---

### Task 1: UN reference source

**Files:**
- Modify: `src/lib/multimodal/variants.ts`, `src/lib/multimodal/mappers.ts`
- Test: `tests/variants.test.ts`, `tests/multimodalMappers.test.ts`

**Interfaces:**
- Produces: `type Source = Modal | 'UN'` exported from `variants.ts`; `groupVariants(entries, mode: Source)`, `variantLabel(v, lang, mode: Source, pgShort)`, `variantSpecs(v, lang, mode: Source)`; `fetchUnReference(supabase: SupabaseClient, unNumber: string): Promise<Entry[]>`.

- [ ] **Step 1: Failing tests**

Append to `tests/variants.test.ts`:

```ts
describe('UN Model Regulations source', () => {
  it('treats UN names and specifications as English, like ICAO', () => {
    const [v] = groupVariants([e({ name: 'MOTOR SPIRIT', specification: 'or PETROL', packingGroup: 'II' })], 'UN')
    expect(v!.names).toEqual({ de: [], en: ['MOTOR SPIRIT'], fr: [] })
    expect(v!.matchSpecs).toEqual(['ORPETROL'])
    expect(variantLabel(v!, 'de', 'UN', 'VP-Gr.')).toBe('VP-Gr. II · or PETROL')
  })
})
```

Append to `tests/multimodalMappers.test.ts` (add `fetchUnReference` to the import):

```ts
describe('fetchUnReference', () => {
  it('reads un_entries for the trimmed UN number and maps the shared fields', async () => {
    const { client, from, eqCalls } = createClient({
      un_entries: {
        data: [{
          un_number: '1203', sequence_number: 1, name: 'MOTOR SPIRIT', specification: null,
          hazard_class: '3', subsidiary_risks: null, packing_group: 'II',
          special_provision_codes: ['243', '534'], limited_qty: '1 L', excepted_qty: 'E2',
          packing_instructions: ['P001', 'IBC02'], remark: null,
        }],
        error: null,
      },
    })
    const rows = await fetchUnReference(client, ' 1203 ')
    expect(from).toHaveBeenCalledWith('un_entries')
    expect(eqCalls.un_entries).toBe('1203')
    expect(rows).toEqual([{
      unNumber: '1203', sequenceNumber: 1, name: 'MOTOR SPIRIT', specification: undefined,
      hazardClass: '3', packingGroup: 'II', hazardLabels: undefined,
      exceptedQty: 'E2', limitedQty: '1 L', packingInstructions: 'P001, IBC02',
      specialProvisions: '243, 534', remark: undefined,
    }])
  })

  it('throws on a query error instead of returning no rows', async () => {
    const { client } = createClient({ un_entries: { data: null, error: { message: 'down' } } })
    await expect(fetchUnReference(client, '1203')).rejects.toEqual({ message: 'down' })
  })

  it('returns no rows for a blank UN number without querying', async () => {
    const { client, from } = createClient({})
    expect(await fetchUnReference(client, '  ')).toEqual([])
    expect(from).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`'UN'` not assignable / names land in `de`; `fetchUnReference` not exported).

Run: `pnpm exec vitest run tests/variants.test.ts tests/multimodalMappers.test.ts`

- [ ] **Step 3: Implement**

`src/lib/multimodal/variants.ts`:
- after the import add
  ```ts
  /** a transport mode, or the UN Model Regulations (reference only, English like ICAO) */
  export type Source = Modal | 'UN'

  function englishOnly(mode: Source): boolean {
    return mode === 'ICAO' || mode === 'UN'
  }
  ```
- change every `mode: Modal` parameter to `mode: Source` (`englishSpec`, `groupVariants`, `localSpec`, `variantSpecs`, `variantLabel`) and every `mode === 'ICAO'` test to `englishOnly(mode)`.

`src/lib/multimodal/mappers.ts` — add after `mapIcao`:

```ts
type RawUn = Record<string, unknown>

/** UN Model Regulations: the shared fields only (spec §4a); subsidiary risks stand in for labels */
function mapUn(r: RawUn): Entry {
  return {
    unNumber: String(r.un_number),
    sequenceNumber: Number(r.sequence_number),
    name: str(r.name),
    specification: str(r.specification),
    hazardClass: str(r.hazard_class),
    packingGroup: str(r.packing_group),
    hazardLabels: joinArr(r.subsidiary_risks),
    exceptedQty: str(r.excepted_qty),
    limitedQty: str(r.limited_qty),
    packingInstructions: joinArr(r.packing_instructions),
    specialProvisions: joinArr(r.special_provision_codes),
    remark: str(r.remark),
  }
}

/** rows of the UN Model Regulations for the grey reference column; throws on failure */
export async function fetchUnReference(supabase: SupabaseClient, unNumber: string): Promise<Entry[]> {
  const cleaned = unNumber.trim()
  if (!cleaned) return []
  const { data, error } = await supabase.from('un_entries').select('*').eq('un_number', cleaned).order('sequence_number')
  if (error) throw error
  return (data ?? []).map(mapUn)
}
```

- [ ] **Step 4: Run — expect PASS.** Same command.
- [ ] **Step 5: Leave changes uncommitted.**

---

### Task 2: Comparison logic

**Files:**
- Create: `src/lib/multimodal/compare.ts`
- Test: `tests/compare.test.ts`

**Interfaces:**
- Produces:
  - `type CompareKind = 'text' | 'quantity' | 'set' | 'labels' | 'class'`
  - `interface CompareField { field: keyof Entry, labelKey: string, modes: readonly Modal[], compareModes: readonly Modal[], reference: boolean, critical: boolean, kind: CompareKind }`
  - `COMPARE_FIELDS: readonly CompareField[]`
  - `type CompareStatus = 'same' | 'differs' | 'onlyOne' | 'missing'`
  - `interface CompareCell { raw: string | null, applicable: boolean, compared: boolean, deviates: boolean, unresolved: boolean }`
  - `interface CompareRow { field: keyof Entry, labelKey: string, critical: boolean, status: CompareStatus, cells: Record<Modal, CompareCell>, reference: CompareCell | null }`
  - `interface CompareOptions { reference?: Entry | null, referenceUnresolved?: boolean, unresolved?: readonly Modal[] }`
  - `normalizeValue(kind: CompareKind, raw: string): string`
  - `buildComparison(selection: Partial<Record<Modal, Entry | null>>, options?: CompareOptions): CompareRow[]`
  - `summarizeDeviations(rows: readonly CompareRow[]): CompareRow[]`

- [ ] **Step 1: Failing tests** — create `tests/compare.test.ts`:

```ts
// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { buildComparison, COMPARE_FIELDS, normalizeValue, summarizeDeviations } from '$lib/multimodal/compare'
import { fetchCompareForUn } from '$lib/multimodal/mappers'
import { DEMO_DATA, type Entry, type Modal } from '$lib/multimodal/types'

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const row = (rows: ReturnType<typeof buildComparison>, field: keyof Entry) => rows.find(r => r.field === field)!

const DEMO = { ADR: DEMO_DATA.ADR![0]!, RID: DEMO_DATA.RID![0]!, IMDG: DEMO_DATA.IMDG![0]!, ICAO: DEMO_DATA.ICAO![0]! }

describe('normalizeValue', () => {
  it('treats language-only quantity references as equal', () => {
    expect(normalizeValue('quantity', 'siehe SV 251')).toBe(normalizeValue('quantity', 'See SP251'))
    expect(normalizeValue('quantity', '1 L')).toBe(normalizeValue('quantity', '1L'))
  })

  it('compares sets regardless of order, spacing and parentheses', () => {
    expect(normalizeValue('set', 'P001, IBC02')).toBe(normalizeValue('set', 'IBC02,P001'))
    expect(normalizeValue('set', 'P112(b), P112(c)')).toBe(normalizeValue('set', 'P112b, P112c'))
  })

  it('drops parenthesised label markers', () => {
    expect(normalizeValue('labels', '3, 6.1, (13)')).toBe(normalizeValue('labels', '6.1, 3'))
  })

  it('maps whitespace-only values to the empty string', () => {
    expect(normalizeValue('text', '   ')).toBe('')
  })
})

describe('buildComparison', () => {
  it('finds no critical deviation for the UN 1203 demo', () => {
    const rows = buildComparison(DEMO)
    for (const field of ['hazardClass', 'packingGroup', 'limitedQty', 'exceptedQty', 'classificationCode'] as const) {
      expect(row(rows, field).status, field).toBe('same')
    }
    expect(summarizeDeviations(rows)).toEqual([])
  })

  it('compares special provisions between ADR and RID only and shows the others uncompared', () => {
    const sp = row(buildComparison(DEMO), 'specialProvisions')
    expect(sp.status).toBe('differs') // ADR 243, 534, 664 vs RID 243, 534
    expect(sp.critical).toBe(false)
    expect(sp.cells.IMDG).toMatchObject({ raw: '243', compared: false, deviates: false })
    expect(sp.cells.ICAO).toMatchObject({ compared: false, deviates: false })
  })

  it('never flags a field that only one mode defines', () => {
    const rows = buildComparison(DEMO)
    for (const field of ['tunnelCode', 'kemlerNumber', 'ems1', 'packingInstrCargo'] as const) {
      expect(row(rows, field).status, field).toBe('onlyOne')
    }
    expect(row(rows, 'tunnelCode').cells.IMDG).toMatchObject({ applicable: false, raw: null })
  })

  it('reads a class without division as compatible with one division of that class', () => {
    const rows = buildComparison({ ADR: e({ hazardClass: '1' }), RID: e({ hazardClass: '1' }), IMDG: e({ hazardClass: '1.1D' }), ICAO: e({ hazardClass: '1.1D' }) })
    expect(row(rows, 'hazardClass').status).toBe('same')
  })

  it('flags two different divisions', () => {
    const rows = buildComparison({ ADR: e({ hazardClass: '1' }), IMDG: e({ hazardClass: '1.1D' }), ICAO: e({ hazardClass: '1.4S' }) })
    expect(row(rows, 'hazardClass').status).toBe('differs')
  })

  it('marks the cell that disagrees with the majority (UN 1286 pattern)', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '5 L' }), RID: e({ limitedQty: '5 L' }), IMDG: e({ limitedQty: '1 L' }) })
    const lq = row(rows, 'limitedQty')
    expect(lq.status).toBe('differs')
    expect([lq.cells.ADR.deviates, lq.cells.RID.deviates, lq.cells.IMDG.deviates]).toEqual([false, false, true])
    expect(summarizeDeviations(rows).map(r => r.field)).toEqual(['limitedQty'])
  })

  it('marks every compared cell on a tie', () => {
    const eq = row(buildComparison({ ADR: e({ exceptedQty: 'E0' }), IMDG: e({ exceptedQty: 'E1' }) }), 'exceptedQty')
    expect([eq.cells.ADR.deviates, eq.cells.IMDG.deviates]).toEqual([true, true])
  })

  it('treats language-only differences as the same', () => {
    expect(row(buildComparison({ ADR: e({ limitedQty: 'siehe SV 251' }), IMDG: e({ limitedQty: 'See SP251' }) }), 'limitedQty').status).toBe('same')
  })

  it('compares labels across ADR and RID only, ignoring RID markers', () => {
    const labels = row(buildComparison({ ADR: e({ hazardLabels: '3, 6.1' }), RID: e({ hazardLabels: '3, 6.1, (13)' }), ICAO: e({ hazardLabels: 'Toxic' }) }), 'hazardLabels')
    expect(labels.status).toBe('same')
    expect(labels.cells.ICAO).toMatchObject({ raw: 'Toxic', compared: false })
  })

  it('keeps the raw text for display', () => {
    const pi = row(buildComparison({ ADR: e({ packingInstructions: 'P001, IBC02' }), RID: e({ packingInstructions: 'IBC02, P001' }) }), 'packingInstructions')
    expect(pi.status).toBe('same')
    expect(pi.cells.RID.raw).toBe('IBC02, P001')
  })

  it('reports missing when no mode carries the field and counts blank values as absent', () => {
    const rows = buildComparison({ ADR: e({ marpol: '   ' }) })
    expect(row(rows, 'marpol').status).toBe('missing')
    expect(row(rows, 'limitedQty').status).toBe('missing')
  })

  it('shows unresolved modes as such and leaves them out of the status', () => {
    const rows = buildComparison({ ADR: e({ packingGroup: 'II' }), RID: e({ packingGroup: 'II' }), IMDG: null }, { unresolved: ['IMDG'] })
    const pg = row(rows, 'packingGroup')
    expect(pg.status).toBe('same')
    expect(pg.cells.IMDG).toMatchObject({ unresolved: true, raw: null, deviates: false })
  })

  it('fills the reference cell for shared fields only and never lets it change the status', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '1 L' }), RID: e({ limitedQty: '1 L' }) }, { reference: e({ limitedQty: '5 L', hazardLabels: '6.1' }) })
    expect(row(rows, 'limitedQty').status).toBe('same')
    expect(row(rows, 'limitedQty').reference).toMatchObject({ raw: '5 L', compared: false })
    expect(row(rows, 'hazardLabels').reference).toBeNull()
  })

  it('marks an unmatched reference variant as unresolved', () => {
    const rows = buildComparison({ ADR: e({ limitedQty: '1 L' }) }, { referenceUnresolved: true })
    expect(row(rows, 'limitedQty').reference).toMatchObject({ unresolved: true, raw: null })
  })
})

describe('COMPARE_FIELDS', () => {
  it('lists every field the mappers write, for exactly the modes that write it', async () => {
    // every column of every table answers ['x'] → each mapper writes every field it knows
    const everything = new Proxy({}, { get: () => ['x'] })
    const builder = { select: () => builder, eq: () => builder, order: () => Promise.resolve({ data: [everything], error: null }) }
    const client = { from: () => builder } as unknown as SupabaseClient
    const data = await fetchCompareForUn(client, '1203')

    const ignored = new Set(['unNumber', 'sequenceNumber', 'name', 'nameEn', 'nameFr', 'specification', 'specificationEn', 'specificationFr', 'remark'])
    const written: Record<string, Modal[]> = {}
    for (const [mode, entries] of Object.entries(data) as [Modal, Entry[]][]) {
      for (const [field, value] of Object.entries(entries[0] ?? {})) {
        if (ignored.has(field) || value === undefined) continue
        ;(written[field] ??= []).push(mode)
      }
    }
    const registry = Object.fromEntries(COMPARE_FIELDS.map(f => [f.field, [...f.modes]]))
    expect(registry).toEqual(written)
  })

  it('only compares modes that carry the field', () => {
    for (const f of COMPARE_FIELDS) {
      for (const m of f.compareModes) expect(f.modes, f.field).toContain(m)
    }
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (module missing). `pnpm exec vitest run tests/compare.test.ts`

- [ ] **Step 3: Implement** — create `src/lib/multimodal/compare.ts`:

```ts
import { type Entry, type Modal, MODALS } from './types'

/**
 * Cross-mode comparison of one UN number (F-10).
 * Spec: docs/superpowers/specs/2026-09-28-regulatory-comparison-design.md, incl. "Revision 2026-11-08".
 * Absence is never a deviation, and only modes that share a notation are compared.
 */

export type CompareKind = 'text' | 'quantity' | 'set' | 'labels' | 'class'

export interface CompareField {
  field: keyof Entry
  /** LABELS key */
  labelKey: string
  /** modes whose mapper writes this field */
  modes: readonly Modal[]
  /** modes whose values share one notation and are compared; the others are shown only */
  compareModes: readonly Modal[]
  /** the UN Model Regulations reference column shows this field */
  reference: boolean
  /** a disagreement here can give a planner a genuinely wrong answer (spec §3) */
  critical: boolean
  kind: CompareKind
}

const ALL: readonly Modal[] = ['ADR', 'RID', 'IMDG', 'ICAO']
const LAND: readonly Modal[] = ['ADR', 'RID']
const ROAD_RAIL_SEA: readonly Modal[] = ['ADR', 'RID', 'IMDG']
const ROAD: readonly Modal[] = ['ADR']
const SEA: readonly Modal[] = ['IMDG']
const AIR: readonly Modal[] = ['ICAO']

function field(
  name: keyof Entry,
  labelKey: string,
  kind: CompareKind,
  modes: readonly Modal[],
  options: { compareModes?: readonly Modal[], reference?: boolean, critical?: boolean } = {},
): CompareField {
  return {
    field: name,
    labelKey,
    kind,
    modes,
    compareModes: options.compareModes ?? modes,
    reference: options.reference ?? false,
    critical: options.critical ?? false,
  }
}

/** ordered like the regulation reads: classification, quantities, packaging, road/rail, sea, air, provisions */
export const COMPARE_FIELDS: readonly CompareField[] = [
  field('hazardClass', 'class', 'class', ALL, { reference: true, critical: true }),
  field('classificationCode', 'classCode', 'text', LAND, { critical: true }),
  field('packingGroup', 'packingGroup', 'text', ALL, { reference: true, critical: true }),
  field('hazardLabels', 'labels', 'labels', ALL, { compareModes: LAND, critical: true }),
  field('limitedQty', 'limitedQty', 'quantity', ROAD_RAIL_SEA, { reference: true, critical: true }),
  field('exceptedQty', 'exceptedQty', 'quantity', ALL, { reference: true, critical: true }),
  field('packingInstructions', 'packingInstr', 'set', ROAD_RAIL_SEA, { compareModes: LAND, reference: true }),
  field('transportCategory', 'transportCat', 'text', LAND),
  field('multiplier', 'multiplier', 'text', LAND),
  field('kemlerNumber', 'kemler', 'text', ROAD),
  field('tunnelCode', 'tunnelCode', 'text', ROAD),
  field('ems1', 'emsFire', 'text', SEA),
  field('ems2', 'emsSpill', 'text', SEA),
  field('stowageCategory', 'stowageCat', 'text', SEA),
  field('stowage', 'stowage', 'set', SEA),
  field('segregation', 'segregation', 'set', SEA),
  field('marpol', 'marpol', 'text', SEA),
  field('packingInstrPassenger', 'piPassenger', 'text', AIR),
  field('maxNetPassenger', 'maxNetPassenger', 'text', AIR),
  field('packingInstrCargo', 'piCargo', 'text', AIR),
  field('maxNetCargo', 'maxNetCargo', 'text', AIR),
  field('specialProvisions', 'specialProvisions', 'set', ALL, { compareModes: LAND, reference: true }),
]

export type CompareStatus = 'same' | 'differs' | 'onlyOne' | 'missing'

export interface CompareCell {
  /** what to render; null = nothing to show */
  raw: string | null
  /** the mode's dataset has this field at all */
  applicable: boolean
  /** the value takes part in the comparison (shared notation) */
  compared: boolean
  /** disagrees with the majority (or a tie) in a `differs` row */
  deviates: boolean
  /** the mode has rows but no unambiguous variant was chosen */
  unresolved: boolean
}

export interface CompareRow {
  field: keyof Entry
  labelKey: string
  critical: boolean
  status: CompareStatus
  cells: Record<Modal, CompareCell>
  /** UN Model Regulations cell; null when the field has no reference */
  reference: CompareCell | null
}

export interface CompareOptions {
  reference?: Entry | null
  referenceUnresolved?: boolean
  unresolved?: readonly Modal[]
}

function splitSet(raw: string): string {
  return raw
    .split(',')
    .map(part => part.replace(/[\s()]/g, '').toUpperCase())
    .filter(Boolean)
    .sort()
    .join(',')
}

export function normalizeValue(kind: CompareKind, raw: string): string {
  switch (kind) {
    case 'quantity': {
      // "siehe SV 251" (German) and "See SP251" (English) name the same provision
      const reference = raw.trim().match(/^(?:siehe\s+SV|see\s+SP)\s*(\S+)$/i)
      return reference ? `SP${reference[1]!.toUpperCase()}` : raw.replace(/\s+/g, '').toUpperCase()
    }
    case 'set':
      return splitSet(raw)
    case 'labels':
      // RID adds markers such as "(13)"; they are not hazard labels
      return splitSet(raw.replace(/\([^)]*\)/g, ''))
    default:
      return raw.trim().replace(/\s+/g, ' ').toUpperCase()
  }
}

/** ADR/RID write "1" or "2" where IMDG/ICAO write the division: compatible with exactly one division */
function resolveClassKeys(keys: Partial<Record<Modal, string>>): Partial<Record<Modal, string>> {
  const values = Object.values(keys)
  const out = { ...keys }
  for (const [mode, value] of Object.entries(keys) as [Modal, string][]) {
    if (value.includes('.')) continue
    const divisions = [...new Set(values.filter(v => v.startsWith(`${value}.`)))]
    if (divisions.length === 1) out[mode] = divisions[0]!
  }
  return out
}

function display(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

export function buildComparison(selection: Partial<Record<Modal, Entry | null>>, options: CompareOptions = {}): CompareRow[] {
  const unresolved = new Set(options.unresolved ?? [])

  return COMPARE_FIELDS.map((def) => {
    const cells = {} as Record<Modal, CompareCell>
    let keys: Partial<Record<Modal, string>> = {}

    for (const mode of MODALS) {
      const applicable = def.modes.includes(mode)
      const compared = def.compareModes.includes(mode)
      const isUnresolved = applicable && unresolved.has(mode)
      const raw = applicable && !isUnresolved ? display(selection[mode]?.[def.field]) : null
      cells[mode] = { raw, applicable, compared, deviates: false, unresolved: isUnresolved }
      if (compared && raw) {
        const key = normalizeValue(def.kind, raw)
        if (key) keys[mode] = key
      }
    }
    if (def.kind === 'class') keys = resolveClassKeys(keys)

    const reference: CompareCell | null = def.reference
      ? {
          raw: options.referenceUnresolved ? null : display(options.reference?.[def.field]),
          applicable: true,
          compared: false,
          deviates: false,
          unresolved: options.referenceUnresolved ?? false,
        }
      : null

    const present = Object.entries(keys) as [Modal, string][]
    let status: CompareStatus
    if (present.length >= 2) {
      status = new Set(present.map(([, key]) => key)).size === 1 ? 'same' : 'differs'
    }
    else {
      const anything = MODALS.some(m => cells[m].raw) || reference?.raw
      status = anything ? 'onlyOne' : 'missing'
    }

    if (status === 'differs') {
      const counts = new Map<string, number>()
      for (const [, key] of present) counts.set(key, (counts.get(key) ?? 0) + 1)
      const max = Math.max(...counts.values())
      const leaders = [...counts].filter(([, count]) => count === max)
      const majority = leaders.length === 1 ? leaders[0]![0] : null
      for (const [mode, key] of present) cells[mode].deviates = majority === null || key !== majority
    }

    return { field: def.field, labelKey: def.labelKey, critical: def.critical, status, cells, reference }
  })
}

/** critical rows whose compared values disagree — the facts the page states, nothing more */
export function summarizeDeviations(rows: readonly CompareRow[]): CompareRow[] {
  return rows.filter(r => r.critical && r.status === 'differs')
}
```

- [ ] **Step 4: Run — expect PASS.** If the registry test fails, the diff names the field/mode the mappers write that the registry lacks (or vice versa): fix the registry, not the mappers.
- [ ] **Step 5: Mutation check** — delete the `multiplier` line from `COMPARE_FIELDS`, run, see the registry test fail, restore. Ledger the result.
- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 3: View state and labels

**Files:**
- Create: `src/lib/multimodal/comparisonView.svelte.ts`
- Modify: `src/lib/multimodal/types.ts` (`LABELS`)
- Test: `tests/comparisonView.svelte.test.ts`

**Interfaces:**
- Consumes: Task 1 (`Source`, `groupVariants`, `matchVariant`, `orderedNames`, `variantLabel`), Task 2 (`buildComparison`, `summarizeDeviations`, `CompareRow`).
- Produces `ComparisonViewState`:
  - constructor `(data: Record<string, Entry[]>, reference?: readonly Entry[])`
  - state: `currentLang`, `selectedVariantIndex`, `overrides: Partial<Record<Modal, number>>`, `onlyDifferences`
  - readonly: `variantsByMode`, `referenceVariants`, `anchorMode: Modal | null`, `anchorVariants`, `hasReference`
  - derived: `chosen`, `pickModes: Modal[]`, `referenceVariant`, `rows`, `visibleRows`, `deviations`, `title: { primary: string, others: string[] }`
  - methods: `hasRows(mode)`, `variantFor(mode)`, `L(key)`, `modalDesc(mode)`, `labelOf(variant, mode: Source)`, `deviationText(row)`, `setLang(lang)`, `selectVariant(i)`, `overrideVariant(mode, i)`
- New LABELS keys (all four languages): `field`, `multiplier`, `emsFire`, `emsSpill`, `maxNetPassenger`, `maxNetCargo`, `unReference`, `onlyDifferences`, `notApplicable`, `notCompared`, `noAdnData`, `noDeviations`, `deviationsTitle`, `legendDiffers`, `legendCritical`, `criticalField`, `unresolved`, `compareTitle`, `noEntries`.

- [ ] **Step 1: Failing tests** — create `tests/comparisonView.svelte.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ComparisonViewState } from '$lib/multimodal/comparisonView.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'
import { UN_1203, UN_1993 } from './fixtures/variant-rows'

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const rowOf = (view: ComparisonViewState, field: keyof Entry) => view.rows.find(r => r.field === field)!

const AMBIGUOUS: Record<string, Entry[]> = {
  ADR: [e({ packingGroup: 'II', limitedQty: '1 L' })],
  IMDG: [
    e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', limitedQty: '1 L' }),
    e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' }),
  ],
}

describe('ComparisonViewState', () => {
  it('compares the chosen variant across modes', () => {
    const view = new ComparisonViewState(UN_1993 as Record<string, Entry[]>)
    expect(view.anchorMode).toBe('ADR')
    expect(view.anchorVariants).toHaveLength(5)
    expect(rowOf(view, 'limitedQty').cells.IMDG.raw).toBe('0')
    view.selectVariant(3)
    expect(rowOf(view, 'limitedQty').cells.IMDG.raw).toBe('5 L')
    expect(rowOf(view, 'packingGroup').status).toBe('same')
  })

  it('names the substance by the chosen variant, current language first', () => {
    const view = new ComparisonViewState(UN_1203 as Record<string, Entry[]>)
    expect(view.title.primary).toBe('BENZIN')
    view.setLang('en')
    expect(view.title.primary).toBe('MOTOR SPIRIT')
    expect(view.L('limitedQty')).toBe('Limited qty.')
  })

  it('hides missing rows and, on request, every row without a difference', () => {
    const view = new ComparisonViewState(DEMO_DATA)
    expect(view.visibleRows.some(r => r.status === 'missing')).toBe(false)
    view.onlyDifferences = true
    expect(view.visibleRows.map(r => r.field)).toEqual(['specialProvisions'])
  })

  it('summarises critical deviations as plain facts', () => {
    const view = new ComparisonViewState({ ADR: [e({ limitedQty: '5 L' })], RID: [e({ limitedQty: '5 L' })], IMDG: [e({ limitedQty: '1 L' })] })
    expect(view.deviations.map(r => r.field)).toEqual(['limitedQty'])
    expect(view.deviationText(view.deviations[0]!)).toBe('ADR 5 L · RID 5 L · IMDG 1 L')
  })

  it('asks for a pick where no variant matches, keeps the picker after a manual pick, and resets it', () => {
    const view = new ComparisonViewState(AMBIGUOUS)
    expect(view.pickModes).toEqual(['IMDG'])
    expect(rowOf(view, 'limitedQty').cells.IMDG.unresolved).toBe(true)
    view.overrideVariant('IMDG', 1)
    expect(rowOf(view, 'limitedQty').cells.IMDG.raw).toBe('5 L')
    expect(view.pickModes).toEqual(['IMDG'])
    view.selectVariant(0)
    expect(view.overrides).toEqual({})
  })

  it('never treats a mode without rows as needing a pick', () => {
    const view = new ComparisonViewState({ ...DEMO_DATA, ADN: [] })
    expect(view.pickModes).toEqual([])
    expect(view.hasRows('ADN')).toBe(false)
  })

  it('matches the UN reference variant and marks it unresolved when ambiguous', () => {
    const ref = [e({ packingGroup: 'II', limitedQty: '1 L', specialProvisions: '243' })]
    const view = new ComparisonViewState(DEMO_DATA, ref)
    expect(view.hasReference).toBe(true)
    expect(rowOf(view, 'specialProvisions').reference?.raw).toBe('243')

    const twoRefs = [e({ sequenceNumber: 1, packingGroup: 'II', specification: 'A' }), e({ sequenceNumber: 2, packingGroup: 'II', specification: 'B', limitedQty: '5 L' })]
    const ambiguous = new ComparisonViewState(DEMO_DATA, twoRefs)
    expect(rowOf(ambiguous, 'limitedQty').reference?.unresolved).toBe(true)
  })

  it('handles a UN number with no rows in any mode', () => {
    const view = new ComparisonViewState({ ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] })
    expect(view.anchorMode).toBeNull()
    expect(view.visibleRows).toEqual([])
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (module missing). `pnpm exec vitest run tests/comparisonView.svelte.test.ts`

- [ ] **Step 3: Add the labels** to `src/lib/multimodal/types.ts`, one line per language after the `manualVariant` line:

```ts
    // de
    field: 'Angabe', multiplier: 'Multiplikator', emsFire: 'EmS Feuer', emsSpill: 'EmS Leckage', maxNetPassenger: 'Max. netto Passagier', maxNetCargo: 'Max. netto Fracht', unReference: 'UN-Modellvorschriften', onlyDifferences: 'Nur Abweichungen zeigen', notApplicable: 'In diesem Regelwerk nicht vorgesehen', notCompared: 'Nicht verglichen: abweichende Systematik', noAdnData: 'Die BAM veröffentlicht keine ADN-Daten.', noDeviations: 'Keine kritischen Abweichungen zwischen den Regelwerken.', deviationsTitle: 'Kritische Abweichungen', legendDiffers: 'Abweichung', legendCritical: 'Kritische Abweichung', criticalField: 'Kritische Angabe', unresolved: 'Keine eindeutige Variante', compareTitle: 'Regelwerksvergleich', noEntries: 'Für diese UN-Nummer gibt es in keinem Regelwerk einen Eintrag.',
    // en
    field: 'Field', multiplier: 'Multiplier', emsFire: 'EmS fire', emsSpill: 'EmS spillage', maxNetPassenger: 'Max. net passenger', maxNetCargo: 'Max. net cargo', unReference: 'UN Model Regulations', onlyDifferences: 'Show differences only', notApplicable: 'Not part of this regulation', notCompared: 'Not compared: different notation', noAdnData: 'BAM publishes no ADN data.', noDeviations: 'No critical differences between the regulations.', deviationsTitle: 'Critical differences', legendDiffers: 'Difference', legendCritical: 'Critical difference', criticalField: 'Critical field', unresolved: 'No unambiguous variant', compareTitle: 'Regulatory comparison', noEntries: 'No regulation has an entry for this UN number.',
    // fr
    field: 'Donnée', multiplier: 'Multiplicateur', emsFire: 'EmS incendie', emsSpill: 'EmS déversement', maxNetPassenger: 'Qté nette max. passagers', maxNetCargo: 'Qté nette max. cargo', unReference: 'Règlement type de l’ONU', onlyDifferences: 'Écarts uniquement', notApplicable: 'Non prévu dans ce règlement', notCompared: 'Non comparé : notation différente', noAdnData: 'Le BAM ne publie pas de données ADN.', noDeviations: 'Aucun écart critique entre les règlements.', deviationsTitle: 'Écarts critiques', legendDiffers: 'Écart', legendCritical: 'Écart critique', criticalField: 'Donnée critique', unresolved: 'Pas de variante univoque', compareTitle: 'Comparaison réglementaire', noEntries: 'Aucun règlement ne contient ce numéro ONU.',
    // tr
    field: 'Alan', multiplier: 'Çarpan', emsFire: 'EmS yangın', emsSpill: 'EmS sızıntı', maxNetPassenger: 'Maks. net yolcu', maxNetCargo: 'Maks. net kargo', unReference: 'BM Model Düzenlemeleri', onlyDifferences: 'Yalnızca farkları göster', notApplicable: 'Bu düzenlemede yer almıyor', notCompared: 'Karşılaştırılmadı: farklı gösterim', noAdnData: 'BAM ADN verisi yayımlamıyor.', noDeviations: 'Düzenlemeler arasında kritik fark yok.', deviationsTitle: 'Kritik farklar', legendDiffers: 'Fark', legendCritical: 'Kritik fark', criticalField: 'Kritik alan', unresolved: 'Net varyant yok', compareTitle: 'Mevzuat karşılaştırması', noEntries: 'Bu BM numarası için hiçbir düzenlemede kayıt yok.',
```

- [ ] **Step 4: Implement** — create `src/lib/multimodal/comparisonView.svelte.ts`:

```ts
import { buildComparison, type CompareRow, summarizeDeviations } from './compare'
import { type Entry, type Lang, LABELS, type Modal, MODAL_DESC_I18N, MODALS } from './types'
import { groupVariants, matchVariant, orderedNames, type Source, type Variant, variantLabel } from './variants'

/**
 * View state of /un/:nummer/vergleich. The data is fixed per instance (the page re-mounts per
 * UN number); the user's choices — language, variant, manual picks, filter — are state.
 */
export class ComparisonViewState {
  currentLang = $state<Lang>('de')
  selectedVariantIndex = $state(0)
  overrides = $state<Partial<Record<Modal, number>>>({})
  onlyDifferences = $state(false)

  readonly variantsByMode: Partial<Record<Modal, Variant[]>>
  readonly referenceVariants: Variant[]
  readonly anchorMode: Modal | null
  readonly anchorVariants: Variant[]
  readonly hasReference: boolean

  constructor(data: Record<string, Entry[]>, reference: readonly Entry[] = []) {
    const byMode: Partial<Record<Modal, Variant[]>> = {}
    for (const mode of MODALS) byMode[mode] = groupVariants(data[mode] ?? [], mode)
    this.variantsByMode = byMode
    this.referenceVariants = groupVariants(reference, 'UN')
    this.anchorMode = MODALS.find(m => (byMode[m]?.length ?? 0) > 0) ?? null
    this.anchorVariants = this.anchorMode ? (byMode[this.anchorMode] ?? []) : []
    this.hasReference = this.referenceVariants.length > 0
  }

  /** the anchor variant; null only for an out-of-range index (never a silent fallback) */
  readonly chosen: Variant | null = $derived(this.anchorVariants[this.selectedVariantIndex] ?? null)

  hasRows(mode: Modal): boolean {
    return (this.variantsByMode[mode]?.length ?? 0) > 0
  }

  /** automatic match, ignoring manual picks */
  #matched(mode: Modal): Variant | null {
    const variants = this.variantsByMode[mode] ?? []
    if (variants.length === 0 || !this.chosen) return null
    if (mode === this.anchorMode) return this.chosen
    return matchVariant(this.chosen, variants)
  }

  variantFor(mode: Modal): Variant | null {
    const override = mode === this.anchorMode ? undefined : this.overrides[mode]
    if (override != null) return this.variantsByMode[mode]?.[override] ?? null
    return this.#matched(mode)
  }

  /** modes with rows but no automatic match; they keep their picker after a manual pick */
  readonly pickModes: Modal[] = $derived(MODALS.filter(m => this.chosen !== null && this.hasRows(m) && this.#matched(m) === null))

  readonly referenceVariant: Variant | null = $derived(this.chosen ? matchVariant(this.chosen, this.referenceVariants) : null)

  readonly rows: CompareRow[] = $derived.by(() => {
    const selection: Partial<Record<Modal, Entry | null>> = {}
    const unresolved: Modal[] = []
    for (const mode of MODALS) {
      const variant = this.variantFor(mode)
      selection[mode] = variant?.representative ?? null
      if (!variant && this.hasRows(mode)) unresolved.push(mode)
    }
    return buildComparison(selection, {
      reference: this.referenceVariant?.representative ?? null,
      referenceUnresolved: this.hasReference && this.referenceVariant === null,
      unresolved,
    })
  })

  readonly visibleRows: CompareRow[] = $derived(
    this.rows.filter(r => r.status !== 'missing' && (!this.onlyDifferences || r.status === 'differs')),
  )

  readonly deviations: CompareRow[] = $derived(summarizeDeviations(this.rows))

  readonly title: { primary: string, others: string[] } = $derived.by(() => {
    const [primary = '', ...others] = this.chosen ? orderedNames(this.chosen.names, this.currentLang) : []
    return { primary, others }
  })

  L(key: string): string {
    return LABELS[this.currentLang]?.[key] ?? LABELS.de[key] ?? key
  }

  modalDesc(mode: Modal): string {
    return MODAL_DESC_I18N[this.currentLang]?.[mode] ?? mode
  }

  labelOf(variant: Variant, mode: Source): string {
    return variantLabel(variant, this.currentLang, mode, this.L('pgShort'))
  }

  /** "ADR 5 L · RID 5 L · IMDG 1 L" — what each compared mode says, no advice */
  deviationText(row: CompareRow): string {
    return MODALS
      .filter(m => row.cells[m].compared && row.cells[m].raw)
      .map(m => `${m} ${row.cells[m].raw}`)
      .join(' · ')
  }

  setLang(lang: Lang): void {
    this.currentLang = lang
  }

  selectVariant(index: number): void {
    this.selectedVariantIndex = index
    this.overrides = {}
  }

  overrideVariant(mode: Modal, index: number): void {
    this.overrides = { ...this.overrides, [mode]: index }
  }
}
```

- [ ] **Step 5: Run — expect PASS:** `pnpm exec vitest run tests/comparisonView.svelte.test.ts tests/multimodal-i18n.test.ts`
- [ ] **Step 6: Autofixer** on `comparisonView.svelte.ts`.
- [ ] **Step 7: Leave changes uncommitted.**

---

### Task 4: Components

**Files:**
- Create: `src/lib/multimodal/VariantPicker.svelte`, `ComparisonTable.svelte`, `ComparisonLegend.svelte`, `ComparisonView.svelte`
- Test: `tests/ComparisonView.test.ts`

**Interfaces:**
- Consumes: Task 3.
- Produces: `<ComparisonView unNumber data reference? demo? />`; `<VariantPicker variants selected label ariaLabel onselect tone? />`.

- [ ] **Step 1: Failing tests** — create `tests/ComparisonView.test.ts`:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import ComparisonView from '$lib/multimodal/ComparisonView.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'
import { UN_1993 } from './fixtures/variant-rows'

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const cell = (container: HTMLElement, field: string, mode: string) =>
  container.querySelector(`tr[data-field="${field}"] td[data-mode="${mode}"]`)!

describe('ComparisonView', () => {
  it('shows every mode side by side, ADN as "no data", inside its own scroll container', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    const heads = [...container.querySelectorAll('thead th')].map(th => th.textContent?.trim().split(/\s/)[0])
    expect(heads).toEqual(['Angabe', 'ADR', 'RID', 'IMDG', 'ICAO', 'ADN'])
    expect(container.querySelector('td[data-mode="ADN"]')).toHaveTextContent('Die BAM veröffentlicht keine ADN-Daten.')
    expect(container.querySelector('table')!.parentElement).toHaveClass('overflow-x-auto')
  })

  it('states that UN 1203 has no critical deviation and marks road-only fields as not applicable elsewhere', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('Keine kritischen Abweichungen zwischen den Regelwerken.')
    expect(cell(container, 'tunnelCode', 'IMDG')).toHaveAttribute('title', 'In diesem Regelwerk nicht vorgesehen')
    expect(cell(container, 'tunnelCode', 'ADR')).toHaveAttribute('data-deviates', 'false')
    expect(cell(container, 'specialProvisions', 'IMDG')).toHaveAttribute('title', 'Nicht verglichen: abweichende Systematik')
  })

  it('flags a real critical difference and lists it in the summary', () => {
    const data = { ADR: [e({ limitedQty: '5 L' })], RID: [e({ limitedQty: '5 L' })], IMDG: [e({ limitedQty: '1 L' })] }
    const { container } = render(ComparisonView, { props: { unNumber: '1286', data } })
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveAttribute('data-deviates', 'true')
    expect(cell(container, 'limitedQty', 'ADR')).toHaveAttribute('data-deviates', 'false')
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('Begrenzte Mengen: ADR 5 L · RID 5 L · IMDG 1 L')
  })

  it('filters to differences only', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    await fireEvent.click(screen.getByLabelText('Nur Abweichungen zeigen'))
    expect([...container.querySelectorAll('tbody tr')].map(tr => tr.getAttribute('data-field'))).toEqual(['specialProvisions'])
  })

  it('switches the labels with the language', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container.querySelector('thead th')).toHaveTextContent('Field')
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('No critical differences')
  })

  it('offers the variant picker and recomputes the table', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1993', data: UN_1993 as Record<string, Entry[]> } })
    const buttons = screen.getByRole('group', { name: 'Variante' }).querySelectorAll('button')
    expect(buttons).toHaveLength(5)
    await fireEvent.click(buttons[3]!)
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveTextContent('5 L')
  })

  it('asks for a pick where a mode has no unambiguous variant and shows "?" until then', async () => {
    const data = {
      ADR: [e({ packingGroup: 'II', limitedQty: '1 L' })],
      IMDG: [e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', specification: 'A', limitedQty: '1 L' }), e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', specification: 'B', limitedQty: '5 L' })],
    }
    const { container } = render(ComparisonView, { props: { unNumber: '9999', data } })
    expect(container).toHaveTextContent('Für diese Variante gibt es in IMDG keine eindeutige Entsprechung.')
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveTextContent('?')
    await fireEvent.click(screen.getByRole('group', { name: 'Variante (IMDG)' }).querySelectorAll('button')[1]!)
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveTextContent('5 L')
    expect(container).toHaveTextContent('Für IMDG manuell gewählt:')
  })

  it('adds the grey UN reference column when reference rows exist', () => {
    const reference = [e({ packingGroup: 'II', limitedQty: '1 L', specialProvisions: '243' })]
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA, reference } })
    expect(container.querySelector('thead')).toHaveTextContent('UN-Modellvorschriften')
    expect(cell(container, 'specialProvisions', 'UN')).toHaveTextContent('243')
  })

  it('says so when no regulation has the UN number', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '0000', data: { ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] } } })
    expect(container).toHaveTextContent('Für diese UN-Nummer gibt es in keinem Regelwerk einen Eintrag.')
    expect(container.querySelector('table')).toBeNull()
  })

  it('carries the BAM attribution', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    expect(container).toHaveTextContent('dl-de/by-2-0')
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (component missing). `pnpm exec vitest run tests/ComparisonView.test.ts`

- [ ] **Step 3: Implement the components**

`src/lib/multimodal/VariantPicker.svelte`:

```svelte
<script lang="ts">
  import type { Variant } from './variants'

  interface Props {
    variants: Variant[]
    /** index of the pressed button; null/undefined = none */
    selected: number | null | undefined
    label: (variant: Variant) => string
    ariaLabel: string
    onselect: (index: number) => void
    tone?: 'orange' | 'amber'
  }

  let { variants, selected, label, ariaLabel, onselect, tone = 'orange' }: Props = $props()
</script>

<div role="group" aria-label={ariaLabel} class="flex flex-wrap items-center gap-2">
  {#each variants as variant, i (variant.key)}
    {@const text = label(variant)}
    <button
      type="button"
      aria-pressed={selected === i}
      title={text}
      class={['max-w-full sm:max-w-xs truncate px-2.5 py-1 font-mono text-[11px] font-bold border transition-colors', selected === i
        ? (tone === 'orange' ? 'bg-orange-500 border-orange-500 text-black' : 'bg-amber-400 border-amber-500 text-black')
        : (tone === 'orange' ? 'bg-[#dce8f2] border-[#b0c4d8] text-[#0f2744] hover:border-orange-400' : 'bg-white border-amber-400 text-[#0f2744] hover:border-orange-500')]}
      onclick={() => onselect(i)}
    >{text}</button>
  {/each}
</div>
```

`src/lib/multimodal/ComparisonTable.svelte`:

```svelte
<script lang="ts">
  import type { CompareCell, CompareRow } from './compare'
  import type { ComparisonViewState } from './comparisonView.svelte'
  import { MODALS } from './types'

  let { view }: { view: ComparisonViewState } = $props()

  function tone(row: CompareRow, cell: CompareCell): string {
    if (cell.deviates) return row.critical ? 'bg-orange-100 text-orange-900 font-bold' : 'bg-amber-50 text-[#0f2744] font-semibold'
    if (cell.raw && !cell.compared) return 'text-[#5a7a99] italic'
    return row.status === 'same' ? 'text-[#5a7a99]' : 'text-[#0f2744]'
  }

  function hint(cell: CompareCell): string | undefined {
    if (!cell.applicable) return view.L('notApplicable')
    if (cell.unresolved) return view.L('unresolved')
    if (cell.raw && !cell.compared) return view.L('notCompared')
    return undefined
  }
</script>

<!-- the table scrolls inside this box; the page body never scrolls sideways -->
<div class="overflow-x-auto border border-[#b0c4d8] bg-[#f4f7fa]">
  <table class="w-full min-w-[760px] text-sm border-collapse">
    <thead>
      <tr>
        <th scope="col" class="sticky left-0 z-20 bg-[#0f2744] px-3 py-2.5 text-left align-bottom font-mono text-[10px] font-bold uppercase tracking-[1px] text-slate-300">{view.L('field')}</th>
        {#each MODALS as mode (mode)}
          <th scope="col" class="bg-[#0f2744] px-3 py-2.5 text-left align-bottom">
            <span class="block font-mono text-xs font-bold text-white">{mode}</span>
            <span class="block text-[10px] font-normal text-slate-400">{view.modalDesc(mode)}</span>
          </th>
        {/each}
        {#if view.hasReference}
          <th scope="col" class="bg-slate-600 px-3 py-2.5 text-left align-bottom">
            <span class="block font-mono text-xs font-bold text-white">UN</span>
            <span class="block text-[10px] font-normal text-slate-300">{view.L('unReference')}</span>
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each view.visibleRows as row, i (row.field)}
        <tr data-field={row.field} data-status={row.status} class="border-t border-[#c8d6e5]">
          <th scope="row" class="sticky left-0 z-10 bg-[#f4f7fa] px-3 py-2 text-left align-top font-mono text-[10px] font-bold uppercase tracking-[0.5px] text-[#5a7a99] whitespace-nowrap">
            {view.L(row.labelKey)}{#if row.critical}<span class="ml-1 text-orange-500" title={view.L('criticalField')}>*</span>{/if}
          </th>
          {#each MODALS as mode (mode)}
            {@const cell = row.cells[mode]}
            {#if mode === 'ADN'}
              {#if i === 0}
                <td data-mode="ADN" rowspan={view.visibleRows.length} class="px-3 py-2 align-top text-xs italic text-[#5a7a99] bg-[#eef2f6]">{view.L('noAdnData')}</td>
              {/if}
            {:else}
              <td data-mode={mode} data-deviates={cell.deviates} title={hint(cell)} class={['px-3 py-2 align-top font-mono text-[13px]', tone(row, cell)]}>
                {#if !cell.applicable}
                  <span class="text-[#b0c4d8]">—</span>
                {:else if cell.unresolved}
                  <span class="font-bold text-amber-600">?</span>
                {:else if cell.raw}
                  {#if cell.deviates && row.critical}<span class="mr-1" aria-hidden="true">▲</span>{/if}{cell.raw}
                {:else}
                  <span class="text-[#b0c4d8]">–</span>
                {/if}
              </td>
            {/if}
          {/each}
          {#if view.hasReference}
            <td data-mode="UN" title={row.reference?.unresolved ? view.L('unresolved') : undefined} class="px-3 py-2 align-top font-mono text-[13px] text-slate-500 bg-slate-50">
              {#if !row.reference}
                <span class="text-[#b0c4d8]">—</span>
              {:else if row.reference.unresolved}
                <span class="font-bold text-amber-600">?</span>
              {:else if row.reference.raw}
                {row.reference.raw}
              {:else}
                <span class="text-[#b0c4d8]">–</span>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

`src/lib/multimodal/ComparisonLegend.svelte`:

```svelte
<script lang="ts">
  import type { ComparisonViewState } from './comparisonView.svelte'

  let { view }: { view: ComparisonViewState } = $props()
</script>

<div class="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-[#5a7a99]">
  <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-orange-100 border border-orange-300"></span>{view.L('legendCritical')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-amber-50 border border-amber-300"></span>{view.L('legendDiffers')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="font-bold text-orange-500">*</span>{view.L('criticalField')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="text-[#b0c4d8]">—</span>{view.L('notApplicable')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="italic">abc</span>{view.L('notCompared')}</span>
  <span class="inline-flex items-center gap-1.5"><span class="font-bold text-amber-600">?</span>{view.L('unresolved')}</span>
</div>
<p class="px-1 mt-2 text-[11px] text-[#5a7a99]">
  Quelle: BAM GEFAHRGUT, Datenlizenz Deutschland – Namensnennung – Version 2.0 (dl-de/by-2-0). Darstellung und Vergleich verändert durch gefahrgut.org; kein rechtsverbindlicher Text.
</p>
```

`src/lib/multimodal/ComparisonView.svelte`:

```svelte
<script lang="ts">
  import { untrack } from 'svelte'
  import ComparisonLegend from './ComparisonLegend.svelte'
  import ComparisonTable from './ComparisonTable.svelte'
  import { ComparisonViewState } from './comparisonView.svelte'
  import { type Entry, LANGS } from './types'
  import VariantPicker from './VariantPicker.svelte'

  interface Props {
    unNumber: string
    data: Record<string, Entry[]>
    /** UN Model Regulations rows for the grey reference column */
    reference?: Entry[]
    /** locked preview with DEMO_DATA */
    demo?: boolean
  }

  let { unNumber, data, reference = [], demo = false }: Props = $props()

  // the page re-mounts this component per UN number ({#key}), so the data is captured once
  const view = untrack(() => new ComparisonViewState(data, reference))
</script>

<div class="space-y-3">
  <div class="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 bg-[#f4f7fa] border border-[#c8d6e5] border-t-[3px] border-t-orange-500">
    <div class="min-w-0">
      <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99]">
        {view.L('compareTitle')}{#if demo}<span class="ml-2 px-1.5 py-0.5 bg-orange-500 text-black">DEMO</span>{/if}
      </div>
      <h1 class="font-mono text-2xl font-bold text-orange-500 mt-1">UN {unNumber}</h1>
      {#if view.title.primary}
        <p class="text-sm font-semibold text-[#0f2744]">{view.title.primary}</p>
      {/if}
      {#if view.title.others.length > 0}
        <p class="text-xs text-[#5a7a99]">{view.title.others.join(' · ')}</p>
      {/if}
    </div>
    <div class="flex overflow-hidden border-[1.5px] border-[#b0c4d8]">
      {#each LANGS as lang (lang)}
        <button
          type="button"
          aria-pressed={view.currentLang === lang}
          class={['px-3 py-1.5 font-mono text-[11px] font-bold transition-colors', view.currentLang === lang ? 'bg-[#0f2744] text-white' : 'bg-[#dce8f2] text-[#5a7a99] hover:text-[#0f2744]']}
          onclick={() => view.setLang(lang)}
        >{lang.toUpperCase()}</button>
      {/each}
    </div>
  </div>

  {#if !view.anchorMode}
    <p role="status" class="bg-[#f4f7fa] border border-[#b0c4d8] p-6 text-sm text-[#2d5070]">{view.L('noEntries')}</p>
  {:else}
    {@const anchor = view.anchorMode}
    {#if view.anchorVariants.length > 1}
      <div class="px-4 py-3 bg-[#f4f7fa] border border-[#b0c4d8]">
        <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2">{view.L('variant')} · {anchor}</div>
        <VariantPicker
          variants={view.anchorVariants}
          selected={view.selectedVariantIndex}
          label={v => view.labelOf(v, anchor)}
          ariaLabel={view.L('variant')}
          onselect={i => view.selectVariant(i)}
        />
      </div>
    {/if}

    {#each view.pickModes as mode (mode)}
      <div class="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <p class="mb-2">{(view.overrides[mode] != null ? view.L('manualVariant') : view.L('noVariantMatch')).replace('{mode}', mode)}</p>
        <VariantPicker
          tone="amber"
          variants={view.variantsByMode[mode] ?? []}
          selected={view.overrides[mode]}
          label={v => view.labelOf(v, mode)}
          ariaLabel={`${view.L('variant')} (${mode})`}
          onselect={i => view.overrideVariant(mode, i)}
        />
      </div>
    {/each}

    <div
      data-testid="deviation-summary"
      role="status"
      class={['border p-3 text-sm', view.deviations.length > 0 ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-[#c8d6e5] bg-[#f4f7fa] text-[#2d5070]']}
    >
      {#if view.deviations.length === 0}
        {view.L('noDeviations')}
      {:else}
        <p class="font-semibold mb-1">{view.L('deviationsTitle')}</p>
        <ul class="space-y-0.5">
          {#each view.deviations as row (row.field)}
            <li>{view.L(row.labelKey)}: <span class="font-mono">{view.deviationText(row)}</span></li>
          {/each}
        </ul>
      {/if}
    </div>

    <label class="inline-flex items-center gap-2 text-sm text-[#2d5070]">
      <input type="checkbox" bind:checked={view.onlyDifferences} class="accent-orange-500" />
      {view.L('onlyDifferences')}
    </label>

    <ComparisonTable {view} />
    <ComparisonLegend {view} />
  {/if}
</div>
```

- [ ] **Step 4: Run — expect PASS:** `pnpm exec vitest run tests/ComparisonView.test.ts tests/tailwind-classes.test.ts`
- [ ] **Step 5: Autofixer** on all four components.
- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 5: Route `/un/[nummer]/vergleich`

**Files:**
- Create: `src/routes/(app)/un/[nummer]/vergleich/+page.server.ts`, `+page.svelte`
- Test: `tests/comparison-page-load.test.ts`, `tests/comparison-page.test.ts`

**Interfaces:**
- Consumes: `fetchCompareForUn`, `fetchUnReference` (Task 1), `ComparisonView` (Task 4).
- Produces load data `{ unNumber: string, locked: boolean, compareData: Record<string, Entry[]> | null, reference: Entry[] | null }`.

- [ ] **Step 1: Failing tests**

`tests/comparison-page-load.test.ts`:

```ts
// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_DATA } from '$lib/multimodal/types'
import { load } from '../src/routes/(app)/un/[nummer]/vergleich/+page.server'

function stubSupabase(responses: Partial<Record<string, { data: unknown[] | null, error: unknown }>>) {
  const from = vi.fn((table: string) => ({
    select: () => ({ eq: () => ({ order: () => Promise.resolve(responses[table] ?? { data: [], error: null }) }) }),
  }))
  return { client: { from } as unknown as SupabaseClient, from }
}

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>

function call(nummer: string, client: SupabaseClient, isActive: boolean): Promise<LoadResult> {
  return load({ params: { nummer }, locals: { supabase: client }, parent: async () => ({ isActive }) } as never) as Promise<LoadResult>
}

describe('/un/[nummer]/vergleich load', () => {
  it('404s a parameter that is not four digits, without querying', async () => {
    const { client, from } = stubSupabase({})
    await expect(call('12a4', client, true)).rejects.toMatchObject({ status: 404 })
    expect(from).not.toHaveBeenCalled()
  })

  it('gives a locked account the demo for UN 1203 without querying', async () => {
    const { client, from } = stubSupabase({})
    const result = await call('1203', client, false)
    expect(result).toEqual({ unNumber: '1203', locked: true, compareData: DEMO_DATA, reference: null })
    expect(from).not.toHaveBeenCalled()
  })

  it('gives a locked account nothing for any other UN number, without querying', async () => {
    const { client, from } = stubSupabase({})
    const result = await call('1090', client, false)
    expect(result).toEqual({ unNumber: '1090', locked: true, compareData: null, reference: null })
    expect(from).not.toHaveBeenCalled()
  })

  it('loads the four modes and the UN reference for an active account', async () => {
    const { client, from } = stubSupabase({
      adr_entries: { data: [{ un_number: '1203', sequence_number: 1, name: 'BENZIN', hazard_class: '3' }], error: null },
      un_entries: { data: [{ un_number: '1203', sequence_number: 1, name: 'MOTOR SPIRIT', hazard_class: '3' }], error: null },
    })
    const result = await call('1203', client, true)
    expect(result.locked).toBe(false)
    expect(result.compareData?.ADR[0]?.name).toBe('BENZIN')
    expect(result.reference?.[0]?.name).toBe('MOTOR SPIRIT')
    expect(from).toHaveBeenCalledWith('un_entries')
  })

  it('fails loudly when the reference query fails', async () => {
    const { client } = stubSupabase({ un_entries: { data: null, error: { message: 'down' } } })
    await expect(call('1203', client, true)).rejects.toEqual({ message: 'down' })
  })
})
```

`tests/comparison-page.test.ts`:

```ts
import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'
import { DEMO_DATA } from '$lib/multimodal/types'
import ComparisonPage from '../src/routes/(app)/un/[nummer]/vergleich/+page.svelte'

afterEach(() => {
  document.head.innerHTML = ''
})

function renderPage(data: { unNumber: string, locked: boolean, compareData: Record<string, unknown[]> | null, reference: unknown[] | null }) {
  return render(ComparisonPage, { props: { data: { supabase: {}, cookies: [], isActive: !data.locked, ...data } as never } })
}

describe('/un/[nummer]/vergleich page', () => {
  it('renders the comparison with a back link and a canonical URL', () => {
    const { container } = renderPage({ unNumber: '1203', locked: false, compareData: DEMO_DATA, reference: [] })
    expect(container.querySelector('table')).not.toBeNull()
    expect(container.querySelector('a[href="/un/1203"]')).toHaveTextContent('UN 1203')
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://gefahrgut.org/un/1203/vergleich')
    expect(document.title).toBe('Regelwerksvergleich UN 1203 | gefahrgut.org')
  })

  it('shows the demo with the lock notice for a locked account on UN 1203', () => {
    const { container } = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA, reference: null })
    expect(container).toHaveTextContent(LOCK_MESSAGE)
    expect(container).toHaveTextContent('DEMO')
    expect(container.querySelector('table')).not.toBeNull()
  })

  it('shows only the lock notice and a demo link for a locked account elsewhere', () => {
    const { container } = renderPage({ unNumber: '1090', locked: true, compareData: null, reference: null })
    expect(container).toHaveTextContent(LOCK_MESSAGE)
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('a[href="/un/1203/vergleich"]')).not.toBeNull()
  })
})
```

Check `SITE_URL` in `src/lib/seo/structuredData.ts` first; if it is not `https://gefahrgut.org`, use its value in the canonical assertion.

- [ ] **Step 2: Run — expect FAIL** (route missing): `pnpm exec vitest run tests/comparison-page-load.test.ts tests/comparison-page.test.ts`

- [ ] **Step 3: Implement**

`src/routes/(app)/un/[nummer]/vergleich/+page.server.ts`:

```ts
import { error } from '@sveltejs/kit'
import { fetchCompareForUn, fetchUnReference } from '$lib/multimodal/mappers'
import { DEMO_DATA } from '$lib/multimodal/types'
import type { PageServerLoad } from './$types'

const UN_NUMBER_RE = /^\d{4}$/
const DEMO_UN = '1203'

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  if (!UN_NUMBER_RE.test(params.nummer)) {
    error(404, 'Not found')
  }

  const { isActive } = await parent()

  // Locked preview: never touch the database; only the hardcoded demo is available.
  if (!isActive) {
    return {
      unNumber: params.nummer,
      locked: true,
      compareData: params.nummer === DEMO_UN ? DEMO_DATA : null,
      reference: null,
    }
  }

  // a failure throws → German error page; never an empty comparison
  const [compareData, reference] = await Promise.all([
    fetchCompareForUn(locals.supabase, params.nummer),
    fetchUnReference(locals.supabase, params.nummer),
  ])
  return { unNumber: params.nummer, locked: false, compareData, reference }
}
```

`src/routes/(app)/un/[nummer]/vergleich/+page.svelte`:

```svelte
<script lang="ts">
  import { resolve } from '$app/paths'
  import LockNotice from '$lib/auth/LockNotice.svelte'
  import ComparisonView from '$lib/multimodal/ComparisonView.svelte'
  import { SITE_URL } from '$lib/seo/structuredData'

  let { data } = $props()
</script>

<svelte:head>
  <title>Regelwerksvergleich UN {data.unNumber} | gefahrgut.org</title>
  <meta name="description" content={`UN ${data.unNumber}: ADR, RID, IMDG und ICAO nebeneinander – Abweichungen zwischen den Regelwerken auf einen Blick.`} />
  <link rel="canonical" href={`${SITE_URL}/un/${data.unNumber}/vergleich`} />
</svelte:head>

<div class="min-h-screen bg-[#e8eef5] py-8">
  <div class="max-w-6xl mx-auto px-4">
    <a href={resolve('/(app)/un/[nummer]', { nummer: data.unNumber })} class="inline-block mb-4 text-sm text-[#5a7a99] hover:text-orange-500 font-mono">
      ← UN {data.unNumber}
    </a>
    {#key data.unNumber}
      {#if data.compareData}
        {#if data.locked}
          <div class="mb-4"><LockNotice /></div>
        {/if}
        <ComparisonView unNumber={data.unNumber} data={data.compareData} reference={data.reference ?? []} demo={data.locked} />
      {:else}
        <div class="space-y-4">
          <LockNotice />
          <p class="text-sm text-[#5a7a99]">
            Die Demo findest du unter <a href={resolve('/(app)/un/[nummer]/vergleich', { nummer: '1203' })} class="underline hover:text-orange-500">UN 1203</a>.
          </p>
        </div>
      {/if}
    {/key}
  </div>
</div>
```

- [ ] **Step 4: Run — expect PASS**, then `pnpm check` (the new route's `$types` must resolve).
- [ ] **Step 5: Autofixer** on the page.
- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 6: Entry points

**Files:**
- Modify: `src/routes/(app)/un/[nummer]/+page.svelte`, `src/routes/(app)/suche/+page.svelte`, `src/routes/(app)/dashboard/+page.svelte`
- Test: `tests/un-page.test.ts`, `tests/search-page.test.ts`, `tests/dashboard-page.test.ts`

- [ ] **Step 1: Failing tests**

`tests/un-page.test.ts` — add:

```ts
describe('/un/[nummer] page — comparison link', () => {
  it('links an active account to the comparison of this UN number', () => {
    const { container } = renderPage({ unNumber: '1090', locked: false, compareData: EMPTY })
    expect(container.querySelector('a[href="/un/1090/vergleich"]')).toHaveTextContent('Alle Modi vergleichen')
  })

  it('links the locked demo, but nothing for other locked UN numbers', () => {
    const demo = renderPage({ unNumber: '1203', locked: true, compareData: DEMO_DATA })
    expect(demo.container.querySelector('a[href="/un/1203/vergleich"]')).not.toBeNull()
    demo.unmount()
    const other = renderPage({ unNumber: '1090', locked: true, compareData: null })
    expect(other.container.querySelector('a[href$="/vergleich"]')).toBeNull()
  })
})
```

`tests/search-page.test.ts` — add inside the active describe:

```ts
  it('links the selected UN number to its comparison', async () => {
    const { client } = stubSearch([])
    const { container } = renderPage(client)
    await typeAndDebounce(container, '1203')
    expect(container.querySelector('a[href="/un/1203/vergleich"]')).toHaveTextContent('Alle Modi vergleichen')
  })
```

and in the locked test `'never queries when typing, even a 4-digit UN number'` add `expect(container.querySelector('a[href$="/vergleich"]')).toBeNull()`.

`tests/dashboard-page.test.ts` — replace the test `'shows the regulatory comparison as a disabled coming-soon tile'` with:

```ts
  it('links the regulatory comparison tile to the UN 1203 comparison', () => {
    const { container } = renderDashboard(true)
    const tile = container.querySelector('a[href="/un/1203/vergleich"]')
    expect(tile).toHaveTextContent('Regelwerksvergleich')
    expect(container.querySelector('[aria-disabled="true"]')).toBeNull()
    expect(container).not.toHaveTextContent('Demnächst verfügbar')
  })
```

- [ ] **Step 2: Run — expect FAIL:** `pnpm exec vitest run tests/un-page.test.ts tests/search-page.test.ts tests/dashboard-page.test.ts`

- [ ] **Step 3: Implement**

`/un/[nummer]/+page.svelte` — directly after the back link:

```svelte
    {#if data.compareData}
      <a
        href={resolve('/(app)/un/[nummer]/vergleich', { nummer: data.unNumber })}
        class="inline-block mb-4 ml-4 text-sm font-semibold text-orange-600 hover:text-orange-500"
      >Alle Modi vergleichen →</a>
    {/if}
```

`/suche/+page.svelte` — inside `{#if !search.locked && search.selectedUn}`, before `<div class="mt-6">`:

```svelte
      <a
        href={resolve('/(app)/un/[nummer]/vergleich', { nummer: search.selectedUn })}
        class="inline-block mt-6 text-sm font-semibold text-orange-600 hover:text-orange-500"
      >Alle Modi vergleichen →</a>
```

`/dashboard/+page.svelte` — the tool entry becomes

```ts
    { title: 'Regelwerksvergleich', description: 'ADR, RID, IMDG und ICAO nebeneinander – Abweichungen auf einen Blick (Beispiel UN 1203).', href: resolve('/(app)/un/[nummer]/vergleich', { nummer: '1203' }) },
```

and the comment above `tools` reads `// \`href: null\` = announced but not built yet.`

- [ ] **Step 4: Run — expect PASS.** Autofixer on the three pages.
- [ ] **Step 5: Leave changes uncommitted.**

---

### Task 7: Landing page truthfulness (spec §7, owner decision 3)

**Files:**
- Modify: `src/lib/landing/Comparison.svelte` (rewrite script + table + footer), `src/lib/landing/Hero.svelte:14`, `src/lib/landing/MultimodalDemo.svelte:20`
- Test: `tests/landing-page.test.ts`

- [ ] **Step 1: Failing test** — replace `'does not advertise the regulatory comparison as available'` with:

```ts
  it('presents the regulatory comparison truthfully, from the demo data', () => {
    const { container } = render(LandingPage, { props: PROPS })
    const section = container.querySelector('#comparison')!
    expect(container).toHaveTextContent('Neu: Regelwerksvergleich ADR · RID · IMDG · ICAO')
    expect(section).not.toHaveTextContent('Demnächst verfügbar')
    expect(section).not.toHaveTextContent(/PDF/)
    expect(section).not.toHaveTextContent(/Transportassistent/)
    expect(container).not.toHaveTextContent('ICAO und ADN')
    const modes = [...section.querySelectorAll('tbody tr td:first-child')].map(td => td.textContent?.trim())
    expect(modes).toEqual(['ADR', 'RID', 'IMDG', 'ICAO'])
    expect(section.querySelector('tbody tr td:nth-child(4)')).toHaveTextContent('1 L') // ADR limited quantity from DEMO_DATA
    expect(section).toHaveTextContent('Keine kritischen Abweichungen für UN 1203')
    expect(section.querySelector('a[href="/un/1203/vergleich"]')).toHaveTextContent('Vergleich ansehen')
  })
```

- [ ] **Step 2: Run — expect FAIL:** `pnpm exec vitest run tests/landing-page.test.ts`

- [ ] **Step 3: Implement**

`Comparison.svelte` script becomes:

```svelte
<script lang="ts">
  import { resolve } from '$app/paths'
  import { buildComparison, summarizeDeviations } from '$lib/multimodal/compare'
  import { DEMO_DATA, getL, type Modal, MODALS } from '$lib/multimodal/types'

  const highlights = [
    'Unterschiede farblich hervorgehoben',
    'Warnhinweise bei kritischen Abweichungen',
  ]

  // built from the generated demo data with the product's own comparison, so it cannot drift
  const modes: Modal[] = MODALS.filter(m => (DEMO_DATA[m]?.length ?? 0) > 0)
  const rows = buildComparison(Object.fromEntries(modes.map(m => [m, DEMO_DATA[m]![0]!])))
  const columns = (['hazardClass', 'packingGroup', 'limitedQty', 'exceptedQty', 'tunnelCode'] as const)
    .map(field => rows.find(r => r.field === field)!)
  const deviations = summarizeDeviations(rows)
</script>
```

Copy and layout changes in the same file:
- delete the `<span …>Demnächst verfügbar</span>` badge;
- the paragraph reads `ADR, RID, IMDG und ICAO nebeneinander – Abweichungen zwischen den Regelwerken werden automatisch erkannt und farblich hervorgehoben.`;
- the call to action: `href={resolve('/(app)/un/[nummer]/vergleich', { nummer: '1203' })}`, text `Vergleich ansehen`;
- the table header: `<th scope="col">Regelwerk</th>` then `{#each columns as col (col.field)}<th …>{getL('de', col.labelKey)}</th>{/each}` (same classes as today);
- the body:

```svelte
              {#each modes as mode (mode)}
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-semibold" style="color: #0f2744;">{mode}</td>
                  {#each columns as col (col.field)}
                    {@const cell = col.cells[mode]}
                    <td class="px-4 py-3">
                      {#if cell.deviates}
                        <span class="px-1.5 py-0.5 rounded text-xs font-medium" style="background: rgba(249,115,22,0.12); color: #ea580c;">{cell.raw}</span>
                      {:else}
                        <span class="text-slate-600">{cell.raw ?? '–'}</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
```

- the footer text: `{deviations.length === 0 ? 'Keine kritischen Abweichungen für UN 1203 – Klasse, Verpackungsgruppe und Mengengrenzen stimmen überein.' : `Abweichungen: ${deviations.map(r => getL('de', r.labelKey)).join(', ')}`}`; when there are none, the footer uses the neutral slate style (`background: #f8fafc`, text `#5a7a99`) and no warning icon.

`Hero.svelte:14`: `Neu: Regelwerksvergleich ADR · RID · IMDG · ICAO`.
`MultimodalDemo.svelte:20`: `UN 1203 · Benzin — ADR, RID, IMDG und ICAO auf einen Blick.`

- [ ] **Step 4: Run — expect PASS:** `pnpm exec vitest run tests/landing-page.test.ts tests/llms-txt.test.ts tests/tailwind-classes.test.ts`. Check the SEO invariant by hand: `grep -n "ADN\|Regelwerksvergleich" src/routes/+page.svelte src/lib/landing/*.svelte src/lib/landing/faq.ts static/llms.txt` — no remaining claim that ADN is compared or that the comparison is "Demnächst".
- [ ] **Step 5: Autofixer** on the three landing components.
- [ ] **Step 6: Leave changes uncommitted.**

---

### Task 8: Verification and docs

- [ ] `pnpm test` (report the count), `pnpm check` (0 errors; the 5 `@apply` warnings in `MultimodalTool.svelte` are pre-existing), `pnpm build`.
- [ ] `pnpm preview`: `/healthz` → 200; `/un/1203/vergleich` → 303 to `/login?next=%2Fun%2F1203%2Fvergleich`. Stop the server.
- [ ] Final whole-branch review (fresh reviewer, most capable model) with this plan's Review Focus; one fix pass, each fix test-first.
- [ ] `CLAUDE.md`: Routes gain `/un/:nummer/vergleich`; Project Structure `lib/multimodal/` gains `variants.ts, compare.ts, comparisonView.svelte.ts, Comparison*.svelte, VariantPicker.svelte`; Features: F-10 shipped.
- [ ] `docs/STATUS.md`: F-10 ✅ (browser check open), F-05 dashboard tile live, landing comparison section live; next steps updated; test count.
- [ ] `docs/README.md`: F-10 row ✅.
- [ ] Execution notes at the end of this plan.
- [ ] Leave everything uncommitted; tell the owner what is ready.

---

## Execution notes (2026-11-08)

Executed natively, Tasks 1–8. Suite 825/825, `pnpm check` 0 errors, build OK, smoke test OK.

- Ruling (Task 5): `chosen` and `referenceVariant` use `$derived.by(() => …)`; TypeScript flagged `$derived(expr)` as use-before-init of constructor-set fields. Runtime identical.
- Final review (fresh reviewer) — fixed test-first:
  - **I1** ADR/RID class 2 is always the bare `2`; the division now comes from the classification code (class 1: the code itself; class 2: T → 2.3, else F → 2.1, else 2.2). The "exactly one division" rule is only the fallback without a code. Case: UN 1950 ADR 5T vs a manually picked ICAO 2.2 previously read "same".
  - **I2** a bare class left next to divisions no longer wins the majority; all compared cells are marked.
  - **I3** a row whose only applicable mode is unresolved stays visible with "?"; the summary names the modes that were not compared, says "nichts zu vergleichen" with a single mode, and only says "Keine kritischen Abweichungen zwischen den Regelwerken" when every mode with rows was compared.
- Deferred minors: stale demo after unlock on the same URL (`{#key data.unNumber}`); empty table body under "Nur Abweichungen" when there are none; hints only in `title` (no sr-only text); no `focus-visible` style on picker buttons.
