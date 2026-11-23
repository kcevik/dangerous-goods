# 1000-Punkte-Rechner (F-02, ADR 1.1.3.6) — Design

> **Status:** decisions taken by the owner on 2026-11-23 (task brief). Wanted most by the
> personas p1, p3 and p5 (`docs/research/2026-11-23-persona-tests/`): "am Handy in 30 Sekunden",
> "mit Ausdruck für die Kundenakte".

## Goal

A logged-in, **activated** user enters the dangerous goods of one transport unit (UN number,
quantity, unit, "leere ungereinigte Verpackung") and sees live, per row, the transport category
(BK), the factor and the points, plus the total and the verdict "Freistellung nach 1.1.3.6
möglich (x von 1000 Punkten)" or "nicht möglich". If exempt, the page lists the duties that
still apply. A print view (browser print dialog → PDF) carries date, rows, total, verdict,
duties, disclaimer and data source.

Version 1: calculation + print view. No saving, no DB writes, no Puppeteer.

## Owner decisions

1. **Route** `/tools/1000-punkte` in `(app)` (login required). Nav entry "1000 Punkte" in
   `APP_NAV_ITEMS` and a dashboard tile (the "In Vorbereitung" chip goes away).
2. **Locked users:** no demo. They see the layout's upsell banner/modal and a short
   explanation that the calculator unlocks with activation. The page load and the lookup
   endpoint check `isActive` **before** any query; RLS is the backstop.
3. **Landing page and `docs/STATUS.md` are not touched** by this branch (parallel branches);
   the owner un-greys the landing card afterwards.

## Domain — read from the ADR text (BMIMI consolidated ADR 2025, `ADR_BOOK_PATH`)

Quoted paragraphs were read in the real file (OCR-corrupted; read carefully, cross-checked
against ADR 2025).

### Transport categories and factors (1.1.3.6.1, 1.1.3.6.3, 1.1.3.6.4)

| BK | Column 3 of 1.1.3.6.3 (same category only) | Factor in 1.1.3.6.4 |
|---|---|---|
| 0 | 0 — never exempt | — |
| 1 | 20 | 50 |
| 1, footnote a) (UN 0081, 0082, 0084, 0241, 0331, 0332, 0482, 1005, 1017) | 50 kg | 20 |
| 2 | 333 | 3 |
| 3 | 1000 | 1 |
| 4 | unbegrenzt | 0 |

- **Boundary:** 1.1.3.6.4 — the sum "darf … einen berechneten Wert von 1000 **nicht
  überschreiten**". 1000 points is exempt, 1000.01 is not.
- **Same-category rule (1.1.3.6.2/.3):** if every counted row has the same category, column 3
  applies. For BK 1 (20 → ×50 = 1000), footnote a) (50 kg → ×20 = 1000) and BK 3 (1000 → ×1)
  this equals the points rule. For **BK 2 alone the table says 333**, while 333.3 L × 3 =
  999.9 points. The calculator applies the stricter column-3 limit when all counted rows are
  BK 2 (shown as its own reason). Footnote b) ("entspricht einem berechneten Wert von 1000")
  suggests the authors meant the same thing; we stay on the safe side.
- **BK 0:** column 3 is 0 → any BK 0 row makes the load not exempt, whatever the total.
- **Footnote a)** is taken from the data: `adr_entries.multiplier = 20` on exactly the nine
  UN numbers (checked with SQL on 2026-11-23: 12 rows, all BK 1). Factor rule: BK 1 → 20 if
  `multiplier = 20`, else 50.

### Empty uncleaned packagings (1.1.3.6.1)

"Ungereinigte leere Verpackungen, die Stoffe enthalten haben, die der Beförderungskategorie
«0» zugeordnet sind, werden ebenfalls der Beförderungskategorie «0» zugeordnet. … anderen
Beförderungskategorien als … «0» … werden der Beförderungskategorie «4» zugeordnet."
→ checkbox: BK 0 stays BK 0; BK 1–4 become BK 4 (0 points, no quantity needed).
A row without a category stays "prüfen". (The table row for BK 0 excludes packagings of
UN 2908; the BAM data gives 2908 BK 4 anyway.)

### Quantities (1.1.3.6.3, text after the table)

"höchstzulässige Gesamtmenge je Beförderungseinheit" means:
- **articles:** total mass in kg of the articles **without their packagings**; class 1: **net
  mass of the explosive substance**; dangerous goods in machinery/equipment: total quantity of
  the dangerous goods contained (kg or L);
- **solids, liquefied gases, refrigerated liquefied gases, dissolved gases:** net mass in kg;
- **liquids:** total quantity in litres;
- **compressed gases, adsorbed gases, chemicals under pressure:** water capacity of the
  receptacle in litres.

Aerosols are articles by definition (1.2.1 "Druckgaspackung (Aerosol): Ein Gegenstand …"), so
they count as **mass of the cans without outer packaging** in kg. (The brief said "gross mass";
the text says mass without packaging — we follow the text.)

The unit (kg / L / L Fassungsraum) does not change the arithmetic; it is documented per row
and printed. A default is suggested from the classification (class 1 → kg; class 2 code 1x/9x
and UN 3500–3505 → L Fassungsraum; other class 2 → kg; class 3 → L; else kg) and a per-row
hint names the quantity to enter. An info box next to the table quotes all four rules.

### Not counted (1.1.3.6.5)

Goods exempt under 1.1.3.1 a) and d)–f), 1.1.3.2–1.1.3.5, 1.1.3.7, 1.1.3.9, 1.1.3.10 are
disregarded — notably LQ (chapter 3.4) and EQ (chapter 3.5). The page says: don't enter them.

### Scope

1.1.3.6.2: goods "in Versandstücken" only — not tanks or bulk. Shown as a note.

### Duties that still apply when exempt (1.1.3.6.2)

1.1.3.6.2 lists what does **not** apply: chapter 1.10 (except high-consequence class 1 goods per
1.10.3.1 and excepted packages UN 2910/2911 above A2), chapter 5.3, section 5.4.3, chapter 7.2
except V 5 and V 8 (7.2.4), CV 1 (7.5.11), Part 8 **except** 8.1.2.1 a), 8.1.4.2–8.1.4.5,
8.2.3, 8.3.3, 8.3.4, 8.3.5, chapter 8.4, S1 (3) and (6), S2 (1), S4, S5, S14–S21, S24
(chapter 8.5), and Part 9. Everything else of the ADR still applies. The page lists:

1. Transport document per 5.4.1, carried in the cab (8.1.2.1 a)); with the total quantity and
   the calculated value per category (5.4.1.1.1 f) Bem. 1).
2. One portable fire extinguisher, classes A/B/C, ≥ 2 kg powder (8.1.4.2); suitable (EN 3-7,
   8.1.4.3), sealed with a date (8.1.4.4), accessible and protected (8.1.4.5).
3. Training per chapter 1.3 for everyone involved, including drivers without an ADR
   certificate (8.2.3).
4. No opening of packages (8.3.3), no spark-producing portable lighting (8.3.4), no smoking
   during loading, e-cigarettes included (8.3.5).
5. Vehicle supervision (chapter 8.4) and S1 (3)/(6), S2 (1), S4, S5, S14–S21, S24 where
   Table A column 19 assigns them.
6. Mixed-loading prohibitions (7.5.2), load securing (7.5.7), V 5 and V 8 (7.2.4).
7. Packaging (Part 4) and marking/labelling of packages (chapter 5.2).
8. Security (chapter 1.10) for high-consequence class 1 goods (1.10.3.1) and UN 2910/2911
   above A2.
9. Safety obligations of the participants (chapter 1.4).

Listed as **not applicable**: orange plates and placards (5.3), instructions in writing
(5.4.3), driver training certificate (8.2.1), other equipment (8.1.5), **tunnel restrictions
(chapter 8.6, part of Part 8)**, Part 9.

Note: 1.8.3.2 b) lets the competent authority exempt companies working only within these
limits from appointing a safety adviser — the page says to check the national rule.

## Data (`adr_entries`, checked with SQL 2026-11-23)

| `transport_category` | `multiplier` | rows |
|---|---|---|
| '0' | NULL | 144 |
| '1' | 50 / 20 | 967 / 12 |
| '2' | 3 | 1466 |
| '3' | 1 | 654 |
| '4' | 0 | 76 |
| '-' | NULL | 23 (vehicles, engines, UN 3373, 1043 …) |
| NULL | NULL | 32 |

The `prohibited` column is **not usable**: it is `true` on almost every row and `false` on the
rows whose `remark` reads "BEFÖRDERUNG VERBOTEN" or "UNTERLIEGT NICHT DEN VORSCHRIFTEN DES ADR".
The calculator therefore reads the **remark**:

- remark contains "BEFÖRDERUNG VERBOTEN" → **verboten**, never exempt;
- remark contains "UNTERLIEGT NICHT DEN VORSCHRIFTEN DES ADR" → **nicht ADR-pflichtig**, shown
  with the remark, not counted (explicit, never a silent 0);
- BK '-' or NULL otherwise → **keine Beförderungskategorie – nicht freistellbar, prüfen**.

## Rules for the result

Per row status: `empty` (ignored), `invalidUn`, `loading`, `lookupFailed`, `notFound`,
`needsVariant`, `needsQuantity`, `invalidQuantity`, `forbidden`, `notSubject`, `noCategory`,
`category0`, `counted`.

Verdict priority: `lookupFailed` > `incomplete` > `notExempt` > `check` > `exempt`;
`empty` when no row is filled. A failed lookup is an error state, never 0 points.

- `notExempt` reasons: a `forbidden` row, a `category0` row, total > 1000, BK 2 alone > 333.
- `check`: a row without a category (and nothing else decides).
- `exempt`: total ≤ 1000.

Quantities: German input, comma or point as decimal separator; a thousands point ("1.000")
is rejected with a hint, so 1.000 is never read as 1. Must be > 0. Not required for rows whose
outcome does not depend on it (BK 0, BK 4, empty packaging, forbidden, no category).

## Variants

`adr_entries` may hold several rows per UN number (`sequence_number`). Rows are grouped with
the existing `groupVariants()`; if the variants differ in BK/factor/status, the row asks for a
choice (`<select>` with `variantLabel()`), otherwise the first variant is used. UN 1993 has
BK 1/2/3 by packing group, so it must be picked.

## Architecture

- `src/lib/points/points.ts` — pure: units, `parseQuantity`, `factorFor`, `evaluateRow`,
  `evaluateLoad`, `suggestUnit`, `unitHint`, formatting.
- `src/lib/points/duties.ts` — duties / not-applicable / notes with ADR references;
  `REFERENCED_SECTIONS`; `adrSectionHref()`.
- `src/lib/points/pointsCalculator.svelte.ts` — `PointsCalculatorState` (rows, lookup with an
  injected fetcher, per-UN cache, stale-response guard, retry) + `PointsRowState`.
- `src/lib/multimodal/mappers.ts` — new `fetchAdrEntries()` (ADR rows only, throws on error).
- `src/routes/(app)/tools/1000-punkte/+page.server.ts` — locked → `{ locked: true }` without
  query; active → `{ locked: false, linkedSections }` (sections that exist as headings in the
  ADR book; book unavailable → none, references stay plain text).
- `src/routes/(app)/tools/1000-punkte/eintrag/+server.ts` — `GET ?un=dddd` → `{ entries }`;
  401/403 before any query, 400 on a bad number, 429 rate limit, 500 `lookupFailed`.
- UI: `PointsCalculator.svelte`, `PointsRow.svelte`, `PointsResult.svelte`,
  `PointsPrintSheet.svelte` (print-only header + table + source).
- `(app)/+layout.svelte`: header, upsell banner and footer get `print:hidden`.

## Links

UN numbers → `/un/:nummer`. Paragraph references → `/regelwerk/adr?section=…` only where the
section is a heading in the book (checked server-side at load time, since many paragraph
numbers like 1.1.3.6.2 are not headings and would land on "nicht gefunden"); otherwise plain
text.

## Print

`@media print` via Tailwind `print:` variants: no nav, no banner, no inputs; a print-only
sheet with title, date, table (UN, Benennung, BK, Menge, Faktor, Punkte), total, verdict,
duties, disclaimer "Hilfsmittel – keine Rechtsberatung, maßgeblich ist der ADR-Text." and the
source "BAM GEFAHRGUT (ADR 2025), dl-de/by-2-0, Berechnung durch gefahrgut.org".

## Mobile

Rows are cards that stack at 320 px; inputs and buttons ≥ 44 px (`min-h-11`); no horizontal
scroll (the screen table is replaced by cards; the print table is print-only).

## Tests

- `points.test.ts`: every BK, footnote a), mixed loads, 1000 / 1000.01 / 1001, BK 0, '-'/NULL,
  forbidden, not subject, empty packaging, BK 2 alone 333/334, quantity parsing, unit defaults.
- `pointsCalculator.svelte.test.ts`: lookup, cache, failure + retry, stale responses, variants,
  add/remove, unit suggestion vs. user choice.
- `points-page-load.test.ts`, `points-lookup-endpoint.test.ts`: locked → no query, active →
  data, failure → error.
- `points-page.test.ts`: locked view, rows, result, duties, print markup.
- Static: print utilities compile (Tailwind), nav + dashboard tile.

## Out of scope

Saving, sharing via URL, name search inside rows, RID (1.1.3.6 of RID differs), PDF generation
on the server, LQ/EQ calculator (F-12).
