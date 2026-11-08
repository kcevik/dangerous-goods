# Stoffsuche gaps + regulatory variants — Design

> **Status:** design agreed with the owner on 2026-11-08 (brainstorming, three sections).
> Closes the F-01 gaps listed in `docs/STATUS.md` and lays the shared foundation for F-10.

## Goal

1. `/suche` finds substances in **every** mode, lists each UN number **once**, and never shows
   a failed search as "Keine Ergebnisse".
2. The multimodal tool (on `/suche` and `/un/:nummer`) stops silently showing only the first
   row per mode. The user picks a **regulatory variant** once and every mode shows its
   matching variant.

## Why

- `SearchState` queries `adr_entries` names only. A substance missing from ADR, or named
  differently in IMDG/ICAO, cannot be found by name.
- A failed query clears the list, so the page says "Keine Ergebnisse" — a false statement about
  the regulation (`CLAUDE.md`: failures are never "no data").
- Results are keyed by UN number, but one UN number has several ADR rows; a query such as `120`
  matches several 1203 rows → duplicate `{#each}` keys.
- `MultimodalToolState.getEntry()` returns `compareData[mode][0]`. For UN 1993 (Entzündbarer
  flüssiger Stoff, n.a.g.) ADR has six rows over packing groups I, II and III; the tool shows only
  VG I (LQ 0, BK 1) with no hint that II and III exist. A PG III shipper reads wrong values.

## Findings from the BAM source (`csvbase/`, 2026-11-08)

- Most extra rows per UN number are **name variants**, not different substances. BAM adds a row
  whenever a name exists in one language without a counterpart in another (remark "Kein
  deutsches Pendant …"). UN 1203 has three ADR rows (BENZIN / OTTOKRAFTSTOFF / PETROL) with
  identical regulatory data.
- ADR: 578 UN numbers have several rows; only 401 of them differ in regulatory content.
- 1,917 of 2,349 UN numbers (82 %) have exactly one regulatory variant in **every** mode.
- Of the 432 UN numbers with real variants, row **position** is unreliable across modes (IMDG and
  UN order TNT dry/wetted differently from ADR). Packing group + English specification yields the
  same variant set in every mode for 371 of 432.

## Decisions

1. **Variants, not rows.** Rows with identical regulatory data are one variant carrying all their
   names. This also answers F-10 open question #1 (see the F-10 spec, §4).
2. **One picker for all tabs** (owner choice). The chosen variant is matched into every other mode
   automatically; where no unambiguous match exists, that tab says so and offers its own picker.
   The tool never guesses.
3. **Search queries from the browser**, four tables in parallel, merged in TypeScript. No
   migration, no change to the live database. A Postgres search function is deferred (Phase 3 /
   Meilisearch, or if latency demands it).
4. **`un_entries` is not searched.** Its English names add nothing the other tables lack. It
   becomes a grey reference column in F-10 instead (owner decision, recorded in the F-10 spec).
5. **Any failed query fails the whole search.** Partial results could hide the only table that
   contains the substance.

## 1. Variant model — `src/lib/multimodal/variants.ts`

Pure TypeScript, no runes.

```ts
export interface Variant {
  /** stable key: the serialised regulatory fields */
  key: string
  /** rows of this mode that share the regulatory data, in source order */
  entries: Entry[]
  /** entries[0]; the row whose values are displayed */
  representative: Entry
  packingGroup: string | null
  /** distinct names across all rows, per language, in source order */
  names: { de: string[]; en: string[]; fr: string[] }
  /** distinct normalised English specifications of its rows ('' = row without one) */
  matchSpecs: string[]
}

export function groupVariants(entries: readonly Entry[], mode: Modal): Variant[]
export function matchVariant(chosen: Variant, candidates: readonly Variant[]): Variant | null
export function normalizeSpec(s: string | null | undefined): string
```

**Regulatory fields** = every `Entry` field except `unNumber`, `sequenceNumber`, `name*`,
`specification*` and `remark`. Two rows with equal regulatory fields are one variant even when
their specification text differs (the values are what the user acts on); the variant lists all
distinct specifications for display.

**English specification for matching:** `specificationEn` for ADR, RID and IMDG; `specification`
for ICAO (its specification column is English). ICAO names likewise count as English names.
UN 1993 ADR rows 5 and 6 share all values but differ in vapour pressure, so one variant can
carry several specifications — hence `matchSpecs` is a list.

**`normalizeSpec`:** uppercase, strip everything that is not a letter or digit (so `25 %` equals
`25%`, trailing spaces and commas vanish).

**`matchVariant` rules**, in order:

1. Exactly one candidate with the same packing group (no packing group equals no packing group)
   **and** at least one shared `matchSpecs` value → it.
2. Otherwise exactly one candidate with the same packing group → it.
3. Otherwise `null` (no match; several candidates tie, or none share the packing group).

A mode with exactly one variant matches trivially only if rule 1 or 2 holds; a single candidate
with a different packing group is **not** a match.

**Anchor mode:** the first mode in `MODALS` order with rows (normally ADR). Its variants feed the
main picker.

**Picker label** (`variantLabel(variant, lang, mode, pgShort)` in the same module): the localised
packing-group prefix (`LABELS.pgShort`, e.g. "VP-Gr. III") plus the variant's distinct
specifications in the current language joined with " / " (fallback chain as `getSpez`); without a
packing group the specifications alone; without either, the first name. Long labels are
truncated in the button and shown in full as its `title`.

## 2. Search — `src/lib/search/search.svelte.ts`

**Query.** For a query of at least `MIN_QUERY_LENGTH` characters (PostgREST delimiters `,()`
stripped as today), four queries in parallel:

| Table | Name columns | Selected |
|---|---|---|
| `adr_entries`, `rid_entries` | `name`, `name_en`, `name_fr` | `un_number, name, name_en, name_fr, hazard_class, packing_group` |
| `imdg_entries` | `name`, `name_en` | same minus `name_fr` |
| `icao_entries` | `name` (English) | `un_number, name, hazard_class, packing_group` |

When the query is all digits, each filter also gets `un_number.ilike.<q>%`. Each query is
limited to 50 rows. A 4-digit number still selects the UN number directly without querying.

**Merge.** Rows are grouped by UN number into

```ts
export interface SearchResult {
  unNumber: string
  /** the name that matched the query best (see ranking) */
  primaryName: string
  /** all other distinct names, de/en/fr/ICAO, case-insensitively de-duplicated */
  otherNames: string[]
  hazardClass: string | null      // from the first row (ADR order), as today
  packingGroups: string[]         // distinct, sorted I < II < III
  modes: Modal[]                  // modes with at least one matching row, MODALS order
}
```

**Ranking** per UN number by its best row: (0) UN-number prefix match, (1) a name starting with
the query, (2) a name containing it; ties by UN number. At most 20 results.

**State.** `results`, `isLoading` as today, plus `searchError: boolean`. If any of the four
queries returns an error or throws, `results = []` and `searchError = true`. `retry()` re-runs the
current query. Stale responses are still dropped via the request counter.

**Page (`/suche`).**

- Result card per UN number: `UN nnnn`, class badge, `VG I · II · III`, the primary name, the
  other names smaller below, and mode badges (ADR RID IMDG ICAO).
- Header line: "N UN-Nummern".
- Error: `role="alert"` box "Die Suche ist fehlgeschlagen. Bitte versuche es erneut." with an
  "Erneut versuchen" button calling `search.retry()`.
- "Keine Ergebnisse für „…"" only when no error and no results.
- `{#each}` keyed by UN number (now unique).

## 3. Tool — `MultimodalToolState` + `MultimodalTool.svelte`

**State additions** (`src/lib/multimodal/multimodalTool.svelte.ts`):

- `variantsByMode = $derived(...)` — `groupVariants` per mode.
- `anchorMode = $derived(...)` — first mode with rows.
- `selectedVariantIndex = $state(0)` — index into the anchor's variants.
- `overrides = $state<Partial<Record<Modal, number>>>({})` — manual pick per mode for unmatched
  tabs; cleared whenever `selectVariant()` runs or a new UN number loads.
- `variantFor(mode): Variant | null` — anchor: the selected variant; other modes: the override if
  set, else `matchVariant(...)`.
- `isUnmatched(mode): boolean` — the mode has rows but `variantFor` is `null`.
- `getEntry(mode)` returns `variantFor(mode)?.representative ?? null` (was `[0]`). Everything that
  reads `getEntry` / `currentEntry` (overview strip, tab panel, special provisions) follows.
- `selectVariant(index)`, `overrideVariant(mode, index)`.
- `loadCompare()` and the constructor reset `selectedVariantIndex` and `overrides`.

**UI** (`src/lib/multimodal/MultimodalTool.svelte`):

- **Variant picker** below the language bar, only when the anchor has more than one variant: a row
  of buttons labelled by `variantLabel`, the selected one highlighted, `aria-pressed`.
- **Header names:** all names of the current variant in the current language first, then the
  others (`·`-separated), replacing the first-row name.
- **Unmatched tab:** amber note "Für diese Variante gibt es in {mode} keine eindeutige
  Entsprechung. Bitte wähle:" with that mode's own variant buttons. No values are shown until
  the user picks.
- **Overview strip:** an unmatched mode shows "?" instead of class/PG.
- Demo (locked users, UN 1203): one variant, so no picker; unchanged.

New tool labels go into `LABELS` (de/en/fr/tr): `variant`, `noVariantMatch`. The search error
text is page copy on `/suche` (German only, like the rest of that page).

## 4. Testing

Written first, per the owner rule.

- `tests/fixtures/variant-rows.ts` — mapped `Entry` rows copied from the BAM source for UN 1203,
  1993 and 0209 in ADR/RID/IMDG/ICAO.
- `tests/variants.test.ts` (`// @vitest-environment node`): 1203 → one variant with all five names;
  1993 → five ADR variants (rows 5+6 merge) matched to IMDG's three by packing group; 0209 →
  dry/wetted rows collapse into one variant because their mapped values are identical;
  differing spacing/percent signs still match; two candidates with equal PG and spec → `null`;
  single candidate with another PG → `null`; labels with and without packing group.
- `tests/search.svelte.test.ts` (extended): four tables queried; merge by UN number; ranking;
  `packingGroups` and `modes`; any failing table → `searchError` and empty results; `retry()`;
  "no results" state only when every query succeeded; stale responses ignored.
- `tests/multimodalTool.svelte.test.ts` (extended): selection propagates to every mode; reset on
  new UN number; unmatched mode → `getEntry` null + `isUnmatched`; override picks a variant and is
  cleared by `selectVariant`.
- `tests/search-page.test.ts` (extended): result card (names, PGs, mode badges), error box +
  retry, no-results only without error.
- `tests/MultimodalTool.test.ts` (extended): picker shown for 1993 and hidden for 1203; unmatched
  note rendered.

## Out of scope

- F-10 comparison page (its spec is updated to build on this model).
- A Postgres search function / full-text index.
- Searching `un_entries`.
- Synonyms (e.g. "Tunnelcode").
