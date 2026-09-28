# ADR Book Viewer — Design

**Date:** 2026-09-28
**Status:** design only — not implemented. **Blocked on the owner answering §11.1 (licence/provenance of the source file) before any of this ships.**
**Feature:** F-13 — the consolidated ADR 2025 text as a readable, deep-linkable, searchable companion to the comparison tool.

## Goal

From the comparison tool, one click on a special-provision code (`SV 243`) or on a UN number (`UN 1203`) opens the consolidated German ADR 2025 text **in a separate browser window**, rendered as HTML, scrolled to the place where that number is actually defined — the provision's own paragraph in chapter 3.3, or the substance's own row in chapter 3.2 Table A. Because the same number appears many times in different roles, the viewer also offers a Ctrl-F-style find bar so the user can walk every other occurrence.

## Non-goals

- Not a replacement for the licensed printed/official ADR. The viewer carries a "nicht rechtsverbindlich" disclaimer (§10).
- No RID / IMDG / ICAO / ADN book text. Only `ADR2025-konsolidiert.md` exists; the route is deliberately named so siblings can be added later.
- No editing, annotation, bookmarking, highlighting-persistence or PDF export in v1.
- No modal, no popup, no drawer. It is a real route opened with `target="_blank"` (owner's explicit requirement).
- No cross-year diffing (`/changes` is a separate planned feature).
- No Meilisearch. Free-text find is a scoped Postgres query; full-text search stays Phase 3.
- No locked-mode demo of the book text. Licensed content + unknown provenance = locked users see `LockNotice` only.
- No client-side markdown parsing and no runtime markdown dependency.

## Decisions (made in this design)

| Question | Decision |
|---|---|
| Where does the 8.2 MB live? | **A file on the server.** Path from `ADR_BOOK_PATH`. Never in Postgres, never in `static/`, never committed. |
| Index | Built **in memory at server start**, one pass over the file. Measured: 37 ms, 25 MB heap. No tables, no migration, no import step. |
| Rendered where? | **On demand, per requested slice** of roughly 300 lines, sanitised at request time and kept in a small LRU cache. The whole document is never rendered. |
| Markdown library | `marked` + `sanitize-html` as **runtime** dependencies, because rendering now happens in the server process rather than in a one-off script. |
| Route | `/regulations/adr` (route id `/(app)/regulations/adr`), matching the planned URL structure in `CLAUDE.md`. Entry point is query params, not path segments. |
| Entitlement | `(app)` group → session guard in `hooks.server.ts`; the page load and both endpoints check `isActive` explicitly. **There is no RLS backstop**, because the content is not in Postgres — the endpoint check is the gate. See §7.2. Nothing goes into `static/`. |
| Find bar | Sticky bar with term input, `‹`/`›`, `n / m` counter, rank filter, chapter jump list. Keyboard: Enter / Shift+Enter, F3 / Shift+F3, Ctrl+F intercepted, Escape clears. |
| Highlighting | Client-side `TreeWalker` over loaded section DOM, wrapping matches in `<mark>`. No `CSS.highlights` (patchy Firefox history, and untestable in jsdom). |
| Hit ranking | Five rank classes computed at import time and stored on the index row. The user lands on the best-ranked hit. |
| Images | The 57 referenced `*_img.jpg` files are **not in the repo**. `<img>` is replaced at import time with a labelled placeholder carrying the `alt` text. See §11.4. |
| Locked mode | Page returns `{ locked: true }` and queries nothing. Links into the viewer are hidden when the tool runs in `demo`. |

---

## 1. URL and route design

### 1.1 The route

```
src/routes/(app)/regulations/adr/+page.server.ts
src/routes/(app)/regulations/adr/+page.svelte
src/routes/(app)/regulations/adr/window/+server.ts      # GET, lazy window fetch
src/routes/(app)/regulations/adr/search/+server.ts      # GET, free-text hit list
```

`/regulations/adr` is already in the planned URL structure in `CLAUDE.md`; this feature fills it in. The path segments stay English (as that list has them); all user-visible copy is German.

### 1.2 Query parameters

All state that must survive a shared link lives in the query string. Exactly one *target* parameter is honoured; if several are present the precedence is `sv` > `un` > `section` > `q`.

| Param | Example | Meaning |
|---|---|---|
| `sv` | `?sv=243` | Jump to special provision 243. Hit list = ranked occurrences of that code. |
| `un` | `?un=1203` | Jump to UN 1203. Hit list = ranked occurrences of that number. |
| `section` | `?section=1.1.3.6` | Jump to a numbered ADR section by its own numbering. No hit list. |
| `q` | `?q=Tunnelcode` | Free-text find. Hit list = document-order matches, unranked. |
| `hit` | `?hit=4` | 1-based index into the hit list. Default `1`. |
| `all` | `?all=1` | Include rank-5 (`incidental`) hits in the list. Default: excluded. |

No target parameter → the viewer opens at the table of contents with an empty find bar.

Anchors: every rendered window carries `data-line-start`/`data-line-end`, and every heading inside it gets `id="h-<slug>"` (slug of the ADR number when the heading carries one, e.g. `h-1-1-3-6`). The URL fragment is set from the active hit via `replaceState` so a copied link reproduces the exact position.

### 1.3 Links from the comparison tool

`resolve()` does not take search params, so links are built as `` `${resolve('/(app)/regulations/adr')}?sv=${code}` ``.

- **`MultimodalSvsAccordion.svelte`** — each SV row gets a small trailing link `Im ADR-Text öffnen ↗` with `target="_blank" rel="noopener"`, `href=?sv=<code>`, and `aria-label={`Sondervorschrift ${nr} im ADR-Text öffnen`}`. Rendered **only when `mode === 'ADR'`** (there is no RID/IMDG/ICAO book text) **and not when `demo`** (locked users would get a lock notice). The link must not be nested inside the existing accordion `<button>` — it goes into the row header as a sibling, after the preview span.
- **`MultimodalTool.svelte`** — the big `UN {unNumber}` header in the detail panel becomes a link to `?un=<unNumber>` under the same two conditions (`currentModal === 'ADR'`, not `demo`).
- **`(app)/+layout.svelte`** — a nav link "ADR-Text" to `resolve('/(app)/regulations/adr')`.

Both tool links carry German `title` attributes and open in a new window; nothing about the comparison tool's own state changes.

---

## 2. Storage and indexing strategy

### 2.1 Measured facts about the source (verified 2026-09-28)

| Fact | Value |
|---|---|
| File | `csvbase/ADR2025-konsolidiert.md`, 8,534,589 bytes, 36,781 lines, German |
| **Not in git** | `.gitignore:25` excludes `csvbase` — the source is a local artefact, never committed, never deployed |
| Headings | 1,506 total (h1 10, h2 140, h3 208, h4 613, h5 396, h6 139) |
| Splitting at h1–h5 | 1,368 blocks, of which **15 exceed 64 KB**, together 5.01 MB |
| Biggest block | Table A body, lines 9154–13635, **2,619 KB** |
| Chapter 3.2 (Table A + Table B) | lines 8963–16694, 3,109,934 bytes |
| Chapter 3.3 (special provisions) | lines 16695–18321, 256,676 bytes |
| Table A data rows | 3,842 rows, 25 pipe columns, longest line 4,699 chars |
| Raw HTML in the markdown | `<br>` ×12,761, `<b>` ×1,766, `<sup>` ×1,444, `<sub>` ×385, `<p>`, `<ul>/<li>`, `<div>`, `<i>`, `<u>`, `<img>` ×57 |
| Referenced images | 57 distinct `*_img.jpg` filenames — **the files are absent** |

### 2.2 Options weighed

The decisive measurement, taken on the real file in a plain Node process on the owner's
machine, is that **there is no expensive preprocessing to avoid**:

| Step | Measured |
|---|---|
| Read 8.1 MB from disk | 22 ms |
| Split 36,782 lines | 5 ms |
| Build heading map + occurrence index, one pass | 10 ms |
| **Total work at server start** | **37 ms** |
| Slice ~300 lines around a hit | 0.03 ms |
| Resident heap for the index | 25 MB |

Every storage-based option below exists to pre-compute something that costs 37
milliseconds once per process. That is the whole argument.

**A — ship the whole document to the browser.** One 8.2 MB response (~1.8 MB gzipped), a
DOM of several hundred thousand nodes, and the browser's own Ctrl-F works. Rejected: the
payload is indefensible, mobile browsers choke on the Table A DOM, and it is re-downloaded
per visit.

**B — prerender chunk files into `static/`.** **Rejected outright:** `static/` is served
with no authentication at all, and this is licensed content behind a paid gate. Forbidden
by the locked-mode rule in `CLAUDE.md`.

**C — Postgres chunk table plus a prebuilt occurrence index, imported by a script.**
This was the original design here and it is **rejected**. It requires a migration, two
tables, roughly 1,441 chunk rows and 18,800 index rows, a 64 KB hard-split algorithm that
has to re-emit table headers so a split table still renders, a plain-text shadow column,
and a service-role import step the owner must run every year. All of it to avoid 37 ms of
startup work. It also stores a second, derived copy of the licensed text, which makes the
licensing question in §11.1 worse rather than better. Its one real advantage is an RLS
backstop on the content (see §7.2); that is not worth the rest.

**D — Supabase Storage with signed URLs.** Rejected: a signed URL is a shareable bearer
token for the whole object for its whole lifetime, and there is nothing to index against.

**E — serve a PDF and jump to the page, like the competitor.** Rejected, and it is worth
being precise about why, because it looks like the cheap option:

1. **There is no PDF.** The repository contains no ADR book PDF, only small
   table-description and version-status documents. The artefact that exists is the
   markdown.
2. **The preprocessing does not go away, it gets worse.** Jumping to a provision still
   needs a number-to-position index. With a PDF that index has to be rebuilt by
   extracting text page by page, which is slower and less reliable than reading markdown
   lines.
3. **There is no bridge from what we have to page numbers.** The markdown carries no page
   numbers anywhere. Its only positional metadata is bounding boxes on 55 images. So a
   PDF would have to be sourced or generated independently, and then re-indexed.
4. **Precision drops.** Only the `#page=` fragment is reliable across browsers. Text
   fragments are not portable, so "this occurrence" degrades to "somewhere on this page",
   and Safari gives you the page only.
5. **It leaks more.** Serving the file hands every activated user a complete, shareable
   copy of the licensed document. Slices are a smaller exposure.
6. **It throws away what the owner values.** The correctly formatted tables, responsive
   layout, dark mode, in-page highlighting and the find bar all come from rendering HTML.

**F — chosen: keep the markdown as a file, index it in memory at boot, render slices on
demand.**

### 2.3 The chosen approach

Three parts, all in `src/lib/server/adrBook/`:

1. **`index.ts` — the boot-time index.** On first use the module reads the file at
   `ADR_BOOK_PATH`, splits it into lines, and walks it once building:
   - a **heading map**: every `#`–`######` heading with its level, text, derived ADR
     number, slug and line number (1,506 entries);
   - an **occurrence index**: for every special-provision code and UN number, the lines
     where it appears together with its rank class (§3.3).

   Held in module scope, built once per process. A loud startup check fails fast with a
   clear German-free operator message if the file is missing or implausibly small, so a
   misconfigured deploy breaks at boot rather than on the first user request.

2. **`slice.ts` — windowing.** `sliceAround(line, before, after)` returns the markdown
   lines around a target, snapped outward to safe boundaries so a slice never starts or
   ends mid-table-row or mid-paragraph. When a slice begins inside a markdown table, the
   table's header lines (header, alignment row, and the `(1) (2) (3a)…` numbering row that
   Table A carries) are re-emitted at the top so the fragment renders as a valid table.
   Default window is 300 lines, which covers a substance's Table A row with context.

3. **`render.ts` — on-demand rendering.** `renderSlice(markdown)` runs `marked` with
   `gfm: true`, `breaks: false` and inline HTML allowed (the source's own `<br>`, `<sup>`,
   `<b>` must survive), then `sanitize-html` with a strict allowlist, then the
   post-processing in §2.4. Results are cached in a small LRU keyed by the slice range, so
   re-reading the same region is free. Measured cost for a 300-line slice is well under
   the 30 ms budget in §9.

No chunk table. No fixed chunk boundaries at all: the window is centred on whatever the
user asked for, which is strictly better than snapping to the nearest precomputed chunk.

### 2.4 Rendering and sanitisation

`sanitize-html` allowlist: `p h1 h2 h3 h4 h5 h6 ul ol li table thead tbody tr th td br b
strong i em u sup sub blockquote code pre a span div hr`. Attributes: `a: [href, title]`
with `allowedSchemes: ['http','https','mailto']`, `*: [id, class]` where `class` is
filtered to the `book-` prefix, `th/td: [colspan, rowspan]`. Everything else is dropped:
`<script>`, `<style>`, `<iframe>`, every `on*` handler, `style`, `data-bbox`, and
`javascript:` hrefs. The source is a machine conversion from an unverified pipeline, so it
is treated as untrusted even though we author it. A test asserts the allowlist.

Post-processing, because sanitisation alone is not enough:

- every `<table>` is wrapped in
  `<div class="book-table-scroll" role="region" tabindex="0" aria-label="Tabelle, horizontal scrollbar">`
  so a 25-column table scrolls **inside its own container** instead of widening the page;
- every heading gets a stable `id` derived from its ADR number where present
  (`#### 1.1.1 Aufbau` → `h-1-1-1`), otherwise from its text, de-duplicated;
- `<img>` becomes
  `<span class="book-figure-missing" role="img" aria-label="<alt>">[Abbildung: <alt>]</span>`
  (§11.4).

**Class names in the generated HTML are semantic (`book-`-prefixed), never Tailwind
utilities.** Tailwind v4 scans `src/**`; classes produced at runtime are invisible to it
and would compile to nothing, which is exactly what `tests/tailwind-classes.test.ts`
guards against. The viewer styles `.book-*` itself in a `<style>` block with
`@reference "tailwindcss"`.

### 2.5 Free-text search

Searching runs over the in-memory line array with a case- and diacritic-insensitive
substring scan, returning ranked line hits. Measured at a few milliseconds over 8 MB, so
no index is needed. Because the scan is over source lines rather than rendered HTML, a
user searching `table` cannot match `<table>`.

---

## 3. In-memory index data model

### 3.1 Shapes

No migration and no tables. The index is plain TypeScript held in module scope, built once
per server process by `src/lib/server/adrBook/index.ts`.

```ts
export interface BookHeading {
  level: number          // 1..6
  text: string           // raw heading text
  sectionNo: string | null   // '1.1.3.6' when the heading carries an ADR number
  slug: string           // 'h-1-1-3-6', stable, de-duplicated
  line: number           // 1-based line in the source file
  path: string[]         // ['Teil 3 …', 'Kapitel 3.3', 'Für bestimmte …']
}

export type HitRole =
  | 'definition' | 'tableARow' | 'tableASvCell' | 'tableB' | 'crossReference' | 'incidental'

export interface BookHit {
  kind: 'sv' | 'un'
  code: string           // '243', '640D', '1203'
  line: number           // 1-based line of the match
  rank: 1 | 2 | 3 | 4 | 5
  role: HitRole
  context: string        // ~160 chars around the match, for the hit list UI
  heading: BookHeading   // nearest enclosing heading, for grouping the list
}

export interface BookIndex {
  lines: string[]                       // the whole file, split once
  headings: BookHeading[]               // 1,506 entries
  hits: Map<string, BookHit[]>          // key `${kind}:${code}`, each list rank-sorted
  bytes: number
  builtAt: number
}

export function getBookIndex(): BookIndex   // memoised; builds on first call
```

Measured on the real file: 1,506 headings, roughly 18,800 hits across all codes, 25 MB
resident, 37 ms to build.

**Operational consequence.** Each worker process holds its own copy of the index, so
budget about 25 MB per worker in the process manager, or pin this route to a single
worker. This is the one real cost of dropping the database and it is worth stating in the
deploy notes.

### 3.2 What gets indexed, and how the codes are found

**SV codes.** Chapter 3.3 (lines 16695–18321) defines them, but the machine conversion produced **three different shapes** for a definition, which a naive single pattern misses:

| Shape | Example | Count |
|---|---|---|
| `- <code> text` | `- 163 Ein in Kapitel 3.2 Tabelle A namentlich …` (line 16736) | 174 |
| `<space><code> text` | ` 363 Diese Eintragung darf nur verwendet werden …` (line 17195) | — |
| `**<code>** text` | `**654** Abfall-Feuerzeuge, die getrennt gesammelt …` (line 17905) | — |

The detector matches `^(?:- |\s+|\*\*)?(\d{1,3}[A-Z]?)\*{0,2}\s` inside the 3.3 line range and yields **377 codes**. The import script must print a **coverage report**: the set of distinct `special_provision_codes` for mode ADR in `adr_entries` minus the set of codes with a `definition` row. A non-empty difference is a warning, not a failure — it means the conversion mangled that provision and the owner should know.

**SV occurrences.** 7,264 across the document. They are found in two ways, never by a single bare regex:
- Inside **Table A rows** (`^\| \d{4} `): the row is split on `|` and only **column 6** (`Sondervorschriften`) is scanned, its space-separated codes taken as exact tokens. This is what makes SV 60 usable at all — a bare `\b60\b` scan matches "60 °C" and "60 %" hundreds of times and drowns the real hits.
- **Outside tables**: a token match with non-alphanumeric boundaries, classified `cross_reference` when "Sondervorschrift", "Sondervorschriften" or "Kapitel 3.3" occurs within 60 characters, otherwise `incidental`.

**UN numbers.** 11,520 occurrences of the 2,347 distinct UN numbers present in `ADR25_csv.txt`. Only numbers that are actually UN numbers are indexed — indexing every 4-digit token gives 12,615 hits over 2,513 tokens, most of them years. Even so, **years collide with real UN numbers**: the top "UN numbers" by raw frequency are 2019 (91), 2014 (88), 2018 (82), 2012, 2026, 2015 — these are dates in transitional provisions, and UN 2019/2014/2018 are real entries. So a match is demoted to `incidental` when a German month name, a year-context word (`vor dem`, `ab dem`, `bis zum`, `Ausgabe`, `Fassung`, `ISO`, `EN`) or a `dd.mm.` pattern sits within 30 characters to its left.

### 3.3 Hit ranking

`rank` is stored so the server never re-scans. Lower wins.

| rank | role | For `sv=<code>` | For `un=<code>` |
|---|---|---|---|
| 1 | `definition` / `table_a_row` | the provision's own paragraph in chapter 3.3 | the Table A row whose column 1 is the UN number |
| 2 | `table_b` | — | the alphabetical Table B entry (ch. 3.2, from line 13636) and the Teil-4 substance table (around line 18913) |
| 3 | `cross_reference` | prose mention near "Sondervorschrift"/"Kapitel 3.3" | prose mention near "UN-Nummer"/"UN " |
| 4 | `table_a_sv_cell` | appearance in a Table A column-6 cell (the bulk) | — |
| 5 | `incidental` | bare token, no supporting context | bare token / year-shaped context |

Ordering of the hit list: `rank asc, line asc`. Rank 5 is excluded unless `?all=1`.

Consequence, with real numbers: `?sv=243` → 7 occurrences, lands on line 16892 (its 3.3 definition). `?sv=274` → 778 occurrences, still lands on the definition, with 770-odd rank-4 Table A cells behind it. `?un=1203` → 10 occurrences, lands on the Table A row at line 10015, with Table B (13969, 15800), the Teil-4 table (18913) and four prose mentions in transitional provisions (1545, 1675, 2076, 23988, 24820) behind it. `?sv=163` → 24. `?sv=640D` → 22.

Multiple rank-1 hits are possible and legal (a UN number with several Table A rows, e.g. UN 1202 has four). The list keeps them all in document order; the counter shows the true total.

---

## 4. Loading strategy — the window

The viewer never holds the whole book, and it never needs to, because the index knows where
every hit is without the text being present.

1. **Server load** (`+page.server.ts`) resolves the target to a **primary line** (§3.3),
   then renders one window centred on it: by default 150 lines before and 150 after,
   snapped outward to safe boundaries (§2.3).
2. **Hit list** comes from the in-memory index in one call, capped at 500 entries (§5.1).
   Each hit carries `{ line, rank, role, context, heading }` — enough to render a
   chapter-grouped jump list and a counter **with no body text loaded at all**. This is the
   whole answer to "how does find-next work when hits lie outside the loaded region":
   *the hit list is index data, not DOM*.
3. **Navigation to a hit outside the loaded window** — `next()` sets `currentIndex`; if the
   hit's line falls outside every loaded window, the state class awaits
   `GET /regulations/adr/window?line=<n>`, splices the returned window into the ordered
   list, lets the highlighter mark it, then scrolls to the matching `<mark>`. A spinner
   replaces the counter while in flight and `‹`/`›` are disabled, so rapid presses cannot
   queue up scroll jumps.
4. **Reading forward** — an `IntersectionObserver` sentinel at each end of the loaded range
   fetches the adjoining window when the user scrolls within 600 px of the edge, so
   continuous reading works without touching the find bar. Windows stay in line order in
   one array; gaps are allowed and shown as a "… Abschnitt überspringen …" divider with a
   button that loads the gap.
5. **Cap** — at most **40 loaded windows**. Beyond that the viewer offers
   "Viele Abschnitte geladen — Ansicht zurücksetzen?" and a reset that reloads around the
   current hit. No virtualisation in v1; it is noted as future work.

Because windows are centred on the target rather than snapped to precomputed boundaries,
the user always lands with context on both sides of the hit, which the chunked design could
not guarantee.

---

## 5. Viewer UI

Layout, inside the existing `(app)` shell (so the brand, nav, logout and — for locked users — the lock banner are all there; a separate window does not mean a separate chrome):

```
┌─ (app) header ──────────────────────────────────────────────┐
├─ Find bar (sticky, top: 56px) ──────────────────────────────┤
│ [ADR 2025]  [🔎 243            ] ‹ 1/7 ›  [Alle Treffer ▢]  │
│ Chip: "Sondervorschrift 243"          [Treffer ▾] [TOC ▾]   │
├──────────────┬──────────────────────────────────────────────┤
│ TOC (aside)  │ <main> book prose, sections in order         │
│ Teil 1..9    │   … marked hits, active one distinguished    │
│ (lvl 1–3)    │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Brand / colours** follow the existing tool palette: `#e8eef5` page, `#f4f7fa` panels, `#0f2744` ink, `#c8d6e5`/`#b0c4d8` borders, orange `#f97316` accents, `font-mono` for codes. The book prose gets a comfortable measure (`max-width: 78ch`) **except** `.book-table-scroll`, which spans the full column and scrolls horizontally.
- **TOC** — `<nav aria-label="Inhaltsverzeichnis">`, levels 1–3 only (358 entries, ~20 KB) shipped with the initial load; level 4–5 children load on expand from the sections endpoint. Collapses to a `<details>` above the content below `md`.
- **Chip** — when the user arrived by deep link, the bar shows a non-editable chip naming the target in German ("Sondervorschrift 243", "UN-Nummer 1203", "Abschnitt 1.1.3.6") next to the editable term input. Editing the input drops the chip and switches to free-text mode.
- **Rank filter** — a checkbox "Auch beiläufige Treffer" (`?all=1`), shown only when rank-5 hits exist for the current code, with the count in the label ("+ 312 beiläufige").
- **Hit list dropdown** ("Treffer ▾") — the ranked hits grouped by chapter, each row showing `heading_path` tail + the stored `context` snippet with the match emphasised. This is the escape hatch for high-count terms: with 778 hits nobody presses `›` 700 times, but "Kapitel 3.2 Tabelle A (742)" collapsed to one expandable group is navigable.

### 5.1 Find bar behaviour

| Situation | Behaviour |
|---|---|
| Arrive with `?sv=` / `?un=` | Hit list from the index, ranked. `currentHit = ?hit ?? 1`. Term input prefilled with the code, chip shown. Active hit scrolled to centre on mount. Counter "1 / 7". |
| Arrive with `?section=` | No hit list, no marks. Section scrolled to top of the content column. Counter hidden; the bar shows only the term input. |
| Arrive with `?q=` | Hit list from the search endpoint, document order. Counter "1 / m". |
| Arrive with nothing | TOC-first view, empty bar, focus in the term input. |
| User types a term | 300 ms debounce, minimum 2 characters (`MIN_QUERY_LENGTH`, same as `SearchState`). On each settled term: the server search runs, the hit list is replaced, all loaded sections are re-marked, and `currentHit` resets to 1. A stale-response guard (a request id, like `SearchState`'s race guard) discards out-of-order replies. The URL is updated with `replaceState` so the position is shareable. |
| Term shorter than 2 chars | Marks cleared, counter hidden, no request. |
| Zero hits | Counter shows "Keine Treffer", `‹`/`›` disabled, and the bar suggests "Im Inhaltsverzeichnis suchen". |
| **Very common term, hundreds of hits** | The server caps the list at 500 and returns `total` separately. The counter reads "3 / 500+ (778 Treffer)" and a note appears: "Mehr als 500 Treffer — bitte Suchbegriff einschränken oder die Trefferliste nach Kapitel verwenden." Because the list is rank-ordered, the cap can never hide a rank-1/2/3 hit. For free text (no ranking) the cap is document order and the note says so. |
| `‹` at hit 1 | Wraps to the last hit; an `aria-live` message says "Am Ende fortgesetzt". Same in reverse for `›`. |

### 5.2 Keyboard

| Key | Action |
|---|---|
| `Ctrl`/`⌘` + `F` | **Intercepted** (`preventDefault`) → focuses and selects the term input. Rationale: the native find only searches the loaded window, so it would report "3 of 12" for a term with 778 hits — actively misleading. A hint line under the bar states "Ctrl+F sucht im gesamten ADR-Text, nicht nur im geladenen Abschnitt." A second `Ctrl+F` while the input is already focused lets the event through to the browser, so the native find is never permanently stolen. |
| `Enter` (in the input) | Next hit |
| `Shift` + `Enter` | Previous hit |
| `F3` / `Ctrl`+`G` | Next hit (document-wide, `preventDefault`) |
| `Shift`+`F3` / `Ctrl`+`Shift`+`G` | Previous hit |
| `Escape` | First press: clear the term and all marks, keep the scroll position. Second press: blur the input. |
| `Alt`+`I` | Toggle the TOC |

All handlers are attached with `{@attach …}` on the page root (never `use:action`, never a bare `window` listener that outlives the page), and are skipped when the event target is a `<textarea>` or a `contenteditable`.

### 5.3 Highlighting

`src/lib/regulations/bookHighlighter.ts` — a pure DOM function, no rune state:

```ts
export function markMatches(root: Element, term: string): HTMLElement[]
export function clearMarks(root: Element): void
```

- Walks text nodes with `document.createTreeWalker(root, NodeFilter.SHOW_TEXT)`, **skipping** nodes inside an existing `<mark>`, `<script>`, `<style>`, or `.book-figure-missing`.
- Comparison is case-insensitive and diacritic-insensitive via `String.prototype.localeCompare`-compatible normalisation (`toLocaleLowerCase('de')` + `normalize('NFD')` with combining marks stripped), so `Straße`/`STRASSE` and `Ätzend`/`ätzend` behave as a reader expects. The normalised form is index-mapped back to the original offsets so the wrapping is byte-exact.
- Wraps each match in `<mark class="book-hit" data-line="<n>" data-nth="<k>">`. The active hit additionally gets `class="book-hit book-hit-active"` and `aria-current="location"`.
- `clearMarks` unwraps and calls `normalize()` on the parent so repeated term changes cannot fragment the text nodes without bound.
- Never operates on HTML strings — string replacement over stored HTML would corrupt tags and attributes. This is the reason the highlighter is DOM-based and not server-side.
- Styling: inactive `background:#fde68a; color:#0f2744`; active `background:#f97316; color:#0b1b2e; outline:2px solid #0f2744` — both ≥ 4.5:1 contrast. `scroll-margin-top` accounts for the sticky bar; `scrollIntoView({block:'center', behavior: prefersReducedMotion ? 'auto' : 'smooth'})`.

### 5.4 State class

`src/lib/regulations/adrBookViewer.svelte.ts` — `AdrBookViewerState`, per `CLAUDE.md`'s "logic lives in `.svelte.ts` classes":

```ts
export class AdrBookViewerState {
  term = $state('')
  hits = $state<BookHit[]>([])
  totalHits = $state(0)          // may exceed hits.length when capped
  currentIndex = $state(0)       // 0-based into hits
  includeIncidental = $state(false)
  windows = $state<RenderedWindow[]>([]) // ordered by line, gaps allowed
  isLoading = $state(false)
  readonly currentHit = $derived(...)
  readonly counterLabel = $derived(...)  // "3 / 500+" | "Keine Treffer" | ''
  readonly hitsByChapter = $derived(...)
  next(): Promise<void>; previous(): Promise<void>; goTo(i: number): Promise<void>
  setTerm(t: string): void               // debounced search
  ensureLineLoaded(line: number): Promise<void>
  loadAdjacent(direction: 1 | -1): Promise<void>
  reset(): void
}
```

Constructed once per component and wrapped in `untrack(() => new AdrBookViewerState(...))`. No variable named `state`. Identifiers English; every user-visible string comes from the label table (§8).

---

## 6. Server data access

`src/lib/server/adrBook/api.ts` — pure functions over the in-memory index. No Supabase
client is involved, because the content is not in Postgres. The caller is responsible for
having already checked entitlement (§7.2).

```ts
export function resolvePrimaryHit(target: BookTarget): BookHit | null
export function hitsFor(kind: 'sv' | 'un', code: string,
                        opts: { includeIncidental: boolean, limit: number }): { hits: BookHit[], total: number, capped: boolean }
export function searchText(term: string, limit: number): { hits: BookHit[], total: number, capped: boolean }
export function windowAt(line: number, before?: number, after?: number): RenderedWindow
export function toc(maxLevel?: number): TocEntry[]
```

`windowAt` is the workhorse: it slices the line array (§2.3), renders and sanitises the
slice (§2.4), and returns the HTML plus the line range it covers and the headings it spans.
Results come from the LRU cache when the same range is requested again.

`searchText` scans the line array for a case- and diacritic-insensitive substring. The
server answers "which lines, in what order, how many"; the client highlighter answers
"exactly where inside this rendered window" (§5.3). Neither has to ship what the other
knows. The search term is used as a literal, never as a regular expression, so a user
typing `.*` cannot widen the scan or cause backtracking.

### 6.1 Endpoints

| Endpoint | Guard | Behaviour |
|---|---|---|
| `GET /regulations/adr/window?line=12345` | in `(app)` → session enforced by `hooks.server.ts`; the handler additionally calls `locals.safeGetSession()` and returns **403** `{ error: 'locked' }` when `!isActive` | validates `line` as an integer in range; returns `{ html, lineStart, lineEnd, headings }`. `400` on malformed input. |
| `GET /regulations/adr/search?q=…&limit=…` | same | `400` when `q` is shorter than 2 or longer than 120 characters; returns `{ hits, total, capped }`. |

Both endpoints sit behind a rate limiter from `$lib/server/rateLimit`: 120 requests per IP
per minute for `window` (scrolling is chatty) and 60 for `search`. `429` returns
`{ error: 'rateLimited' }`, with the same `getClientAddress()` semantics as the auth
limiters.

---

## 7. Entitlement and licensing

### 7.1 Where the content lives, and where it must not

- The markdown lives at a path given by `ADR_BOOK_PATH`, outside the web root and outside
  the repository. `.gitignore` already excludes `csvbase`, so it is never committed.
- Deploying it is a **deliberate, separate step**: copy the file to the server and set the
  variable. It is not part of the build, and the app fails loudly at boot if it is absent.
- **Nothing goes into `static/`.** `static/` is served by adapter-node with no
  authentication whatsoever; putting licensed regulation text there would hand the entire
  ADR to anonymous crawlers. Stated explicitly because it is the obvious shortcut and it is
  forbidden.
- No rendered copy is persisted anywhere. Slices are rendered on demand and held only in
  an in-process cache.

### 7.2 Three layers of gate, and the one that is missing

1. **Route group** — `/(app)/regulations/adr` and both endpoints are under `(app)`, so `authGuard` in `hooks.server.ts` redirects anonymous requests to `/login?next=…`.
2. **Explicit `isActive` check** — `+page.server.ts` calls `await parent()` and, when `!isActive`, returns `{ locked: true }` **before any query**, exactly like `un/[nummer]/+page.server.ts`. The endpoints call `locals.safeGetSession()` and 403. Per `CLAUDE.md`: "every code path checks `isActive` before touching regulation data".
3. **Rate limiting** — both endpoints are limited per IP (§6.1), so an activated account
   cannot cheaply walk the whole document.

**The missing layer, stated plainly.** `CLAUDE.md` says RLS is the backstop for every path
that touches regulation data. File-backed content has no RLS, so for this feature the
explicit `isActive` check **is** the gate rather than the first of two. This is the one
genuine advantage the rejected database option had (§2.2 option C), and it is the price of
dropping it. Two mitigations make it acceptable: the check sits in exactly three places
(the page load and the two endpoints), and a test asserts each of them returns 403 or
`locked` for a non-activated session. Any future endpoint that reads the book must go
through `api.ts` and repeat the check; the module carries a comment saying so.

Note that a PDF approach would have the same gap, so it is not a reason to prefer one file
strategy over another.

### 7.3 Locked mode

Locked users get the app shell's amber banner plus `LockNotice` and a sentence: "Der ADR-Volltext ist nach der Freischaltung verfügbar." **No demo excerpt.** The comparison tool's links into the viewer are hidden whenever it renders with `demo`, so a locked user is never offered a door that closes in their face.

### 7.4 Licensing — the open problem

`CLAUDE.md` documents the **BAM GEFAHRGUT database** as dl-de/by-2-0 (attribution required, modifications must be marked). **That licence does not cover this file.** `ADR2025-konsolidiert.md` is a different artefact with unstated provenance, and the evidence in the file says it was produced by a PDF-to-markdown conversion (57 `<img src="<hash>_img.jpg">` tags with `data-bbox` pixel coordinates and long descriptive `alt` texts — the signature of an automated, probably AI-assisted extraction). Nothing in the 36,781 lines states a source, publisher, edition or licence.

This matters because the plausible sources have incompatible terms:

- the **official German ADR translation** published as a Bundesgesetzblatt Anlageband — an official work, but the specific edition and any publisher's additions still need naming;
- a **commercial consolidated edition** (the German market has several) — the consolidation, typesetting, cross-references and index are the publisher's protected work, and republishing it to paying subscribers is a licence matter, not a fair-use matter;
- a **UNECE** publication — UNECE permits reproduction with attribution but has its own conditions.

**Therefore:** the feature must not go live until the owner states the source. Until then it can be built and tested locally, with the data loaded into the hosted project only behind the activated gate. Whatever the answer, the viewer ships with a persistent attribution block (§10) and the conversion is marked as a modification, because it demonstrably is one. Recorded as open question §11.1.

---

## 8. i18n and copy

The book text itself is German only; there is no translated ADR in this dataset. The **chrome** (find bar, counter, TOC header, errors, disclaimer) follows the existing pattern: a `BOOK_LABELS: Record<Lang, Record<string, string>>` in `src/lib/regulations/bookTypes.ts` with `de/en/fr/tr` keys, mirroring `LABELS` in `multimodal/types.ts`, plus a note in the non-German locales that the text is German ("Der ADR-Text liegt nur auf Deutsch vor." / "The ADR text is available in German only." / …). A test asserts every locale has every key, like `tests/multimodal-i18n.test.ts`.

German copy, fixed here so implementation does not invent it:

| Key | de |
|---|---|
| `bookTitle` | `ADR 2025 – konsolidierter Text` |
| `findPlaceholder` | `Im ADR-Text suchen…` |
| `prevHit` | `Vorheriger Treffer` |
| `nextHit` | `Nächster Treffer` |
| `noHits` | `Keine Treffer` |
| `hitCounter` | `Treffer {current} von {total}` |
| `cappedNote` | `Mehr als {limit} Treffer – bitte Suchbegriff einschränken oder die Trefferliste nach Kapitel verwenden.` |
| `includeIncidental` | `Auch beiläufige Treffer` |
| `hitList` | `Trefferliste` |
| `toc` | `Inhaltsverzeichnis` |
| `ctrlFHint` | `Ctrl+F sucht im gesamten ADR-Text, nicht nur im geladenen Abschnitt.` |
| `wrapped` | `Am Ende fortgesetzt` |
| `loadGap` | `Übersprungenen Abschnitt laden` |
| `tooManySections` | `Viele Abschnitte geladen – Ansicht zurücksetzen?` |
| `resetView` | `Ansicht zurücksetzen` |
| `lockedNotice` | `Der ADR-Volltext ist nach der Freischaltung verfügbar.` |
| `openInBook` | `Im ADR-Text öffnen` |
| `notBinding` | `Kein rechtsverbindlicher Text. Maßgeblich ist die amtliche Fassung.` |
| `sectionNotFound` | `Zu {code} wurde keine Stelle im ADR-Text gefunden.` |

---

## 9. Performance budgets

| Thing | Budget | Basis |
|---|---|---|
| Server start: read + index the file | **≤ 100 ms** | measured 37 ms; alarm if it triples |
| Index resident memory, **per worker** | **≤ 40 MB** | measured 25 MB; budget per process-manager worker |
| Initial page payload (one window + hit list + TOC) | **≤ 350 KB** uncompressed, ≤ 90 KB gzipped | a 300-line Table A window is the worst case; TOC (levels 1–3) ~20 KB; hit list ≤ 60 KB |
| Hit list | ≤ 500 rows × ~120 B ≈ **60 KB** | cap in §5.1 |
| One `window` fetch | ≤ **200 KB**, p95 < 300 ms | slice 0.03 ms + render; render dominates |
| `resolvePrimaryHit` + hit list | < **5 ms** | in-memory `Map` lookup, no I/O |
| `searchText` over 36,782 lines | < **50 ms** p95 | in-memory substring scan over 8 MB |
| `markMatches` on one rendered window | < 50 ms | ~2,000 text nodes |
| Loaded DOM | ≤ 40 windows; soft warn at 40 | §4.5 |
| Lighthouse on the viewer with a Table A target | LCP < 2.5 s, CLS < 0.1, TBT < 200 ms | sticky bar reserves its own height; `scroll-margin-top` prevents jump |

Checked during implementation with `pnpm build` + preview and the browser devtools network/performance panels; numbers recorded in the plan's final checkpoint.

---

## 10. Accessibility and attribution

**Accessibility**

- A skip link "Zum Inhalt springen" → `<main id="book-content" tabindex="-1">`.
- Find bar is `<form role="search">` with a `<label for>`-bound input (visually hidden label, visible placeholder is not a label).
- The counter lives in a `<p aria-live="polite" aria-atomic="true">` so screen-reader users hear "Treffer 3 von 778" and the wrap message; the polite level avoids interrupting during rapid `›` presses.
- `‹`/`›` are real `<button type="button">` with `aria-label` and `disabled` when there are no hits or a fetch is in flight.
- Active hit gets `aria-current="location"`; after scrolling, focus moves to the active `<mark>` (given `tabindex="-1"`) so keyboard users are where they think they are.
- Wide tables: `role="region"` + `aria-label` + `tabindex="0"` on `.book-table-scroll` — a keyboard user can scroll them; without `tabindex` an overflow container is a keyboard trap for content.
- TOC is a `<nav aria-label="Inhaltsverzeichnis">` with a real nested list; `aria-current="true"` on the section in view.
- Contrast: all `<mark>` states ≥ 4.5:1; the orange accent is never the only signal (active hit also gets an outline).
- `prefers-reduced-motion: reduce` → `behavior: 'auto'` for every scroll and no transitions.
- Keyboard shortcut reference in a `<details><summary>Tastaturkürzel</summary>` in the bar, so the shortcuts are discoverable without a tooltip.
- `lang="de"` on the book content wrapper regardless of the chrome language, so screen readers pronounce the German text correctly.

**Attribution** — a persistent block at the foot of the content column and in the page's `<svelte:head>` as a `meta name="robots" content="noindex"` (already inherited from the `(app)` layout):

> **Quelle:** <von der Eigentümerin zu ergänzen — siehe offene Frage 1>. Maschinell aus dem Ausgangsdokument nach HTML konvertiert; die Gliederung wurde für die Anzeige in Abschnitte zerlegt. **Kein rechtsverbindlicher Text. Maßgeblich ist die amtliche Fassung.** Stoffdaten separat: BAM GEFAHRGUT, dl-de/by-2-0.

The BAM attribution stays where it already is; it is not extended to cover this file.

---

## 11. Open questions for the owner

1. **Provenance and licence of `csvbase/ADR2025-konsolidiert.md` — blocking.** Which document was converted (publisher or authority, edition, date, ISBN/BGBl reference), and under what terms may it be shown to paying subscribers? The dl-de/by-2-0 licence on the BAM database does **not** extend to it, and the file itself names no source. Until answered, the feature must not be deployed. If the answer is "a commercial consolidated edition", the realistic options are: obtain a licence, replace the source with the official BGBl/UNECE text, or drop the feature.
2. **Conversion fidelity.** The file is a machine conversion and it shows: the 3.3 provision definitions come in three different line shapes, and the detector finds 377 codes where the BAM ADR data references more. Who is accountable for text accuracy? The disclaimer in §10 is the minimum; a spot-check protocol against the official text (say 20 random provisions and 20 Table A rows) before go-live would be better. Does the owner want that as an acceptance gate?
3. **Getting the file onto the server.** There is no import step any more, but the 8.2 MB
   markdown has to reach the Netcup host and `ADR_BOOK_PATH` has to point at it. How should
   that happen: scp as part of the deploy ritual, or a persistent directory outside the
   release that survives redeploys? The second is better, because a forgotten copy step
   then cannot take the viewer down. Confirm which, and note it in the deploy docs that do
   not exist yet.
4. **The 57 missing images.** The markdown references `<hash>_img.jpg` files that are not in `csvbase/`. Does the owner have them? If yes, they need a home (Supabase Storage bucket + signed access, or `static/` if and only if the hazard labels themselves are freely reproducible — hazard-label pictograms from the ADR generally are, but that is part of question 1). If no, the placeholders in §2.4 stand and the Gefahrzettel illustrations are simply absent from the viewer.
5. **Route naming.** `CLAUDE.md`'s planned URL list says `/regulations/adr` (English) while live routes are German (`/suche`, `/un/…`). Keep `/regulations/adr` as planned, or switch the whole planned block to German (`/regelwerk/adr`) now, before there are links to break? The design uses `/regulations/adr`.
6. **Ctrl+F interception.** The design steals the first `Ctrl+F` because the native find would report wrong counts over a partially loaded document. Some power users hate that. Acceptable, or should the bar only advertise itself and leave `Ctrl+F` alone?
7. **Hit cap.** 500 with a rank-ordered list and a chapter-grouped jump list. Is 500 the right number for how the owner actually works — or would 200 with better grouping be more usable?
8. **Yearly update.** When ADR 2027 lands, does the viewer keep both editions (a
   `/regulations/adr/2025` versus `/2027` axis) or replace 2025 in place? This is now much
   cheaper to change than it was under the database design: an edition is just a second
   file and a second index, keyed by a route parameter, with no schema involved. v1 assumes
   replace-in-place. Worth deciding if `/changes` is going to compare editions.
9. **RID/IMDG/ICAO books.** Are consolidated markdown files for the other modes expected?
   If yes, the index module should be parameterised by mode from day one, so the route
   becomes `/regulations/[mode]` over a map of loaded indexes. Cheap to do now, tedious
   later. v1 assumes ADR only. Note each additional book costs another ~25 MB per worker.

## Out of scope

Virtualised rendering, offline caching, print/PDF export, annotations and bookmarks, cross-edition diff, full-text ranking (BM25/Meilisearch), translated ADR text, image assets, `/regulations/rid|imdg|icao|adn`, linking packaging instructions (`P001`) or tank codes (`LGBF`) into the book (an obvious follow-up once the index generalises beyond `sv`/`un`).
