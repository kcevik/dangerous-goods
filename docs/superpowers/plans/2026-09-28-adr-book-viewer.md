> **Progress 2026-09-29:** Tasks 11–16 **done** (inline; decisions in "Execution notes" at the end). Route is `/regelwerk/[mode=bookMode]`,
> Ctrl+F not intercepted (owner). 551 tests green, `pnpm check` 0 errors, `pnpm build` OK,
> anonymous smoke test on the build passes. Budgets measured on the real book: index build
> 245 ms (over 100 ms), `?sv=274` payload 390 KB raw (over 350 KB). The logged-in browser pass of
> Task 16 is still to do. **Task 9 stays owner-gated.**

# ADR Book Viewer Implementation Plan

> **Progress 2026-09-28 (implementation session):** Tasks 1–8 and 10 are **done**: the
> boot-time loader, the fixture, the slicer, the renderer, the indexer, the render cache,
> the query API, the label table and the highlighter. 446 tests green, `pnpm check` 0
> errors, `pnpm build` succeeds. Remaining code: Task 11 (state class), 12 (endpoints),
> 13 (page load), 14 (components), 15 (links from the tool), 16 (docs). **Task 9 stays
> owner-gated** and nothing is deployed.
>
> Three findings changed the design as built:
> 1. The source's Table A header is **OCR-corrupted**: eleven spellings in one 300-line
>    stretch, column counts of 22 and 23. The slicer now matches repeated headers by cell
>    similarity, not text. See spec §3.4.
> 2. The spec's occurrence counts were **inflated**; corrected in spec §3.1/§3.2.
> 3. **`640A`–`640O` have no definition of their own.** The query layer falls back to the
>    numeric parent, and the returned hit reports the parent's code so the UI can say so.

> **Revised 2026-09-28** after the owner rejected the database approach. The book is now
> read from a file and indexed in memory at server start; there is no migration, no chunk
> table and no import step. Measurements behind the change are in spec §2.2.

> **BLOCKED:** Task 0 is an owner decision on the source file's licence and provenance (spec §11.1). Tasks 1–8 may be built and tested locally without it. **Task 9 (putting the file on the server and exposing the viewer) and everything after must not run until Task 0 is answered.**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking an SV code or a UN number in the comparison tool opens `/regulations/adr` in a new browser window, showing the consolidated ADR 2025 text rendered as HTML, scrolled to that number's own definition, with a Ctrl-F-style find bar for every other occurrence.

**Architecture:** The 8.2 MB markdown stays a file on the server at `ADR_BOOK_PATH`. On first use the server reads it once and builds a heading map plus an occurrence index in memory (measured: 37 ms, 25 MB). A request resolves the target to a line, slices roughly 300 lines around it, renders and sanitises that slice on demand, and returns it together with the full ranked hit list. Find-next into an unloaded region is another slice. Highlighting is client-side DOM walking. Entitlement: `(app)` group guard plus an explicit `isActive` check in the page load and both endpoints; there is no RLS backstop because the content is not in Postgres (spec §7.2).

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Tailwind v4 (hand-written), Vitest 5 + jsdom + testing-library. No database involvement. Two new **runtime** dependencies, because rendering now happens in the server process: `marked`, `sanitize-html` (+ `@types/sanitize-html` as a devDependency).

**Spec:** `docs/superpowers/specs/2026-09-28-adr-book-viewer-design.md` — all SQL, copy, ranking rules, budgets and measured numbers live there; this plan references spec sections rather than repeating them.

## Global Constraints

- **pnpm only** (`pnpm add marked sanitize-html` and `pnpm add -D @types/sanitize-html`), never npm/npx.
- **No git commits by the executor** — the owner handles all version control. Do not inspect commit history either.
- **TDD:** every task writes its test file first, watches it fail, then implements. `pnpm test` green before the checkpoint.
- **Svelte MCP autofixer** on every `.svelte` and `.svelte.ts` file before the task's checkpoint.
- Svelte 5 runes only: `$state`/`$derived`/`$props`, `onclick=`, snippets, `{@attach}` not `use:action`, clsx-style `class={[...]}`. Never name a variable `state`. Wrap once-per-component object creation from props in `untrack()`.
- Identifiers **English**; all user-visible copy **German**, taken verbatim from spec §8.
- Internal links via `resolve()` with group segments: `resolve('/(app)/regulations/adr')`; query strings appended manually.
- **Locked-mode rule:** every code path checks `isActive` before touching regulation data. For this feature the check **is** the only gate, so it must exist in all three places (page load, both endpoints) and each must have a test. Any new reader of the book goes through `api.ts` and repeats it.
- **Nothing licensed goes into `static/`,** and no rendered copy is persisted anywhere. The source file is never committed.
- Generated HTML carries only `book-*` class names, never Tailwind utilities (`tests/tailwind-classes.test.ts` cannot see strings produced at runtime).
- Node-only tests get `// @vitest-environment node` at the top; tests that use runes in the test file itself are named `*.svelte.test.ts`.

---

## File map

| Path | Responsibility |
|---|---|
| `src/lib/server/adrBook/slice.ts` | pure: line window around a target, snapped to safe boundaries (spec §2.3) |
| `src/lib/server/adrBook/render.ts` | pure: slice markdown → sanitised HTML (spec §2.4) |
| `src/lib/server/adrBook/indexer.ts` | pure: lines → headings + occurrences with rank/role (spec §3.2–3.3) |
| `src/lib/server/adrBook/index.ts` | file read + memoised `getBookIndex()`, loud startup check (spec §3.1) |
| `src/lib/server/adrBook/api.ts` | query functions over the index + LRU render cache (spec §6) |
| `src/lib/regulations/bookTypes.ts` | `RenderedWindow`, `BookHit`, `TocEntry`, `BOOK_LABELS` (de/en/fr/tr), `getBookLabel` |
| `src/lib/regulations/bookHighlighter.ts` | `markMatches(root, term)`, `clearMarks(root)` |
| `src/lib/regulations/adrBookViewer.svelte.ts` | `AdrBookViewerState` (spec §5.4) |
| `src/lib/regulations/BookFindBar.svelte` | sticky find bar, counter, hit list dropdown |
| `src/lib/regulations/BookToc.svelte` | table of contents nav |
| `src/lib/regulations/BookWindow.svelte` | one rendered window: `{@html}` + heading anchors |
| `src/lib/regulations/BookAttribution.svelte` | source + "kein rechtsverbindlicher Text" block |
| `src/routes/(app)/regulations/adr/+page.server.ts` | target resolution, window, hit list, TOC, locked branch |
| `src/routes/(app)/regulations/adr/+page.svelte` | layout, keyboard handling, `<svelte:head>` |
| `src/routes/(app)/regulations/adr/window/+server.ts` | lazy window fetch, 403 when locked, rate-limited |
| `src/routes/(app)/regulations/adr/search/+server.ts` | free-text hit list, 403 when locked, rate-limited |
| `src/lib/multimodal/MultimodalSvsAccordion.svelte` | **modify:** "Im ADR-Text öffnen ↗" per SV row (ADR + not demo) |
| `src/lib/multimodal/MultimodalTool.svelte` | **modify:** UN header links to `?un=` (ADR + not demo) |
| `src/routes/(app)/+layout.svelte` | **modify:** nav link "ADR-Text" |
| `package.json` | **modify:** `marked` + `sanitize-html` runtime deps, `@types/sanitize-html` dev |
| `.env.example` | **modify:** document `ADR_BOOK_PATH` |
| `CLAUDE.md`, `README.md`, `static/llms.txt` | **modify:** docs (Task 12) |
| `tests/fixtures/adr-book-sample.md` | ~120-line fixture reproducing every structural quirk |

New test files: `adrBookIndex`, `adrBookSlice`, `adrBookRender`, `adrBookIndexer`, `adrBookApi`, `bookHighlighter`, `adrBookViewer.svelte`, `adr-book-page-load`, `adr-book-page`, `adr-book-window-endpoint`, `adr-book-search-endpoint`, `bookLabels`. Extended: `MultimodalSvsAccordion`, `MultimodalTool`, `app-layout`, `tailwind-classes` (no change expected — confirm it still passes).

---

### Task 0: Owner decision gate — licence and provenance (spec §7.4, §11)

- [ ] **STOP. Ask the owner spec §11.1 and §11.4 before writing any code that will be deployed:** which document was converted into `csvbase/ADR2025-konsolidiert.md` (publisher/authority, edition, date, BGBl or ISBN reference), under what terms it may be shown to paying subscribers, and whether the 57 referenced `*_img.jpg` files exist.
- [ ] Also get answers to §11.3 (who runs the import), §11.5 (route naming `/regulations/adr` vs `/regelwerk/adr`), §11.8 (edition column now or never) and §11.9 (other transport modes). §11.8 and §11.9 change the schema, so they must be settled **before Task 1**.
- [ ] Record the answers at the top of the spec under **Status**. If the licence answer is "unclear" or "a commercial edition without a licence", stop the whole feature here — build nothing.
- [ ] **Verify:** the spec's Status line names a source document and a licence, and the four schema-affecting questions are answered.

---

### Task 1: File location and loud startup check (spec §2.3, §7.1)

There is no migration. What replaces it is making a missing or wrong file impossible to
miss, because the whole feature now depends on one path being right.

- [x] Write `tests/adrBookIndex.test.ts` with `// @vitest-environment node`. Cover:
  - a missing path throws with a message naming `ADR_BOOK_PATH` and the path it tried
  - a file that is implausibly small (say under 1 MB) throws rather than serving a
    truncated book
  - a valid fixture builds an index and `getBookIndex()` returns the **same object** on a
    second call (memoised, file read once)
  - a test-only `resetBookIndex()` clears the memo, so other suites are isolated
- [x] Implement `src/lib/server/adrBook/index.ts`: read `ADR_BOOK_PATH` from
      `$env/dynamic/private`, read the file synchronously on first use, split into lines,
      delegate to the indexer (Task 5), memoise, export `resetBookIndex()` for tests.
- [x] Add `ADR_BOOK_PATH` to `.env.example` with a comment that the file is not in the repo.
- [x] `pnpm test` green.

**Verify:** unset the variable and start `pnpm dev`; hitting the route must fail with the
explicit message, not a stack trace about `undefined`.

### Task 2: Test fixture for the source's structural quirks

- [x] Write `tests/fixtures/adr-book-sample.md`, hand-built (~120 lines), reproducing every quirk found in the real file so the pure modules can be tested without the 8.2 MB:
  - headings at h1/h2/h3/h4/h5/h6, some numbered (`#### 1.1.1 Aufbau`), some not (`## Kapitel 3.3`), two with identical text (slug de-duplication);
  - a small Table A excerpt: header row + alignment row + the `| (1) | (2) | (3a) |…` numbering row + 4 data rows, one of them `| 1203 | BENZIN oder OTTOKRAFTSTOFF | 3 | F1 | II | 3 | 243 534 664 | …`, and one row for a UN number with two entries;
  - a `## Tabelle B` excerpt with `| OTTOKRAFTSTOFF | 1203 | |`;
  - a `## Kapitel 3.3` block containing **all three definition shapes**: `- 163 Ein in Kapitel…`, ` 363 Diese Eintragung…`, `**654** Abfall-Feuerzeuge…`;
  - prose with a cross reference ("siehe Kapitel 3.3 Sondervorschrift 654"), a year trap ("Vor dem 1. Juli 2019 gebaute…"), a quantity trap ("bei 50 °C … mehr als 60 %"), and a UN mention in a transitional provision ("Stoffe der UN-Nummern 1202, 1203, 1223");
  - raw HTML: `<br>`, `<sup>1)</sup>`, `<b>BB 2</b>`, `<sub>2</sub>`, a `<div>`, an `<img alt="Gefahrzettel 3: Flamme." data-bbox="1 2 3 4" src="abc_img.jpg"/>`;
  - one hostile line to prove sanitisation: `<script>alert(1)</script>` and `<a href="javascript:alert(1)" onclick="x()">x</a>`;
  - one long table block (8 wide rows) so a small test window can begin and end **inside** a table, exercising header re-emission in the slicer. (The old 64 KB hard-split requirement is gone with the chunking design.)
- [x] **Verify:** the fixture is ≤ 200 lines and every bullet above is present (grep each marker). Achieved: 110 lines.

---

### Task 3: Slicer (spec §2.3)

- [x] Write `tests/adrBookSlice.test.ts` with `// @vitest-environment node`, against the
      Task 2 fixture. Cover:
  - a window centred on a line returns the requested number of lines either side
  - clamping at the start and end of the document
  - a window that would begin mid-paragraph snaps outward to a blank line
  - a window that would begin mid-table re-emits the table's header line, alignment row and
    the `(1) (2) (3a)…` numbering row, so the fragment still renders as a valid table
  - a window that would end mid-table-row extends to the row boundary
  - the returned range reports the actual `lineStart`/`lineEnd` after snapping
- [x] Implement `src/lib/server/adrBook/slice.ts` as pure functions over `string[]`.
- [x] Add one assertion against the real file, skipped when `ADR_BOOK_PATH` is unset: a
      window centred on the UN 1203 Table A row renders a table with a header.
- [x] `pnpm test` green.

### Task 4: Renderer + sanitiser (spec §2.4)

- [x] `pnpm add marked sanitize-html` and `pnpm add -D @types/sanitize-html`. `marked` and `sanitize-html` are **runtime** dependencies now, because rendering happens per request in the server process.
- [x] Write `tests/adrBookRender.test.ts` (`// @vitest-environment node`) **first**:
  - GFM tables render to `<table>` and each is wrapped in `<div class="book-table-scroll" role="region" tabindex="0" aria-label="…">`;
  - `<br>`, `<sup>`, `<sub>`, `<b>`, `<i>`, `<u>` survive;
  - `<script>` is removed **including its text content**; `onclick` and every `on*` attribute removed; `href="javascript:…"` removed while `href="https://…"` survives; `data-bbox` removed; `style` removed;
  - `<img>` becomes `<span class="book-figure-missing" role="img" aria-label="Gefahrzettel 3: Flamme.">[Abbildung: Gefahrzettel 3: Flamme.]</span>`;
  - headings get `id="h-1-1-1"` from the ADR number, `id="h-<text-slug>"` otherwise, and duplicate slugs get a `-2` suffix;
  - **no class attribute in the output starts with anything but `book-`** (regex assertion over the whole output — this is the guard that keeps Tailwind utilities out of database strings);
  - `toPlainText` strips all markup, collapses whitespace, preserves `ßäöüÄÖÜ`, and turns `<br>` into a single space.
- [x] Run → red.
- [x] Implement `src/lib/server/adrBook/render.ts`:

```ts
export function renderSlice(markdown: string, opts?: { slugRegistry?: Set<string> }): string
export function toPlainText(html: string): string
```

`marked` with `{ gfm: true, breaks: false }`; `sanitize-html` with the allowlist in spec §2.4 step 2; post-processing in step 3. The `slugRegistry` is built once from the whole heading map at index time, so heading ids stay unique across the document rather than only within one rendered window.
- [x] Run → green.
- [x] **Verify:** `pnpm test tests/adrBookRender.test.ts`; `pnpm check` clean (the new dependency types resolve).

---

### Task 5: Indexer and ranking (spec §3.2–3.3)

- [x] Write `tests/adrBookIndexer.test.ts` (`// @vitest-environment node`) **first**, against the fixture:
  - **all three** SV definition shapes are detected as `role: 'definition'`, `rank: 1` (`- 163`, ` 363`, `**654**`);
  - a Table A row is indexed for its column-1 UN number as `role: 'table_a_row'`, `rank: 1`;
  - SV codes are read **only from Table A column 6** inside table rows: `243`, `534`, `664` from the 1203 row are `role: 'table_a_sv_cell'`, `rank: 4`, and the `3` in the Klasse column and the `II` in the packing-group column produce **no** SV rows;
  - `"mehr als 60 %"` and `"bei 50 °C"` produce **no** SV hit for codes 60 / 50 (the quantity trap);
  - `"Vor dem 1. Juli 2019 gebaute…"` produces a UN-2019 row with `rank: 5`, `role: 'incidental'`, not rank 3;
  - `"Stoffe der UN-Nummern 1202, 1203, 1223"` produces rank-3 `cross_reference` rows for each;
  - `"siehe Kapitel 3.3 Sondervorschrift 654"` is rank 3 for SV 654, and does **not** displace the rank-1 definition;
  - Tabelle B `| OTTOKRAFTSTOFF | 1203 |` is `role: 'table_b'`, `rank: 2`;
  - hits are emitted in document order and `(kind, code, line)` is unique across the whole output;
  - `context` is ≤ 180 characters and contains the matched code;
  - sorting by `(rank, line)` puts the definition first for every code in the fixture;
  - `coverageReport(knownSvCodes)` returns the codes with no rank-1 definition row.
- [x] Run → red.
- [x] Implement `src/lib/server/adrBook/indexer.ts`:

```ts
export type OccurrenceRole = 'definition' | 'table_a_row' | 'table_a_sv_cell' | 'table_b' | 'cross_reference' | 'incidental'
export interface BookHit { kind: 'sv' | 'un', code: string, line: number, rank: number, role: HitRole, context: string, heading: BookHeading }
export function indexBook(lines: string[], opts: { unNumbers: Set<string> }): { headings: BookHeading[], hits: Map<string, BookHit[]>, svCodes: Set<string> }
export function coverageReport(found: Set<string>, expected: Set<string>): string[]
```

SV codes come from the chapter-3.3 range detected by heading (`Kapitel 3.3` → the next `Kapitel`), not by hard-coded line numbers — line numbers change every edition. UN numbers are supplied by the caller from `ADR25_csv.txt`.
- [x] Run → green.
- [x] **Verified.** `pnpm test tests/adrBookIndexer.test.ts` → 36 green. Real-file run (throwaway, deleted): **377 provision codes** (validated against the BAM CSV, zero false positives), 1,506 headings, **4,134 provision occurrences, 10,828 UN occurrences over 2,347 distinct UN numbers, 14,962 hits total**; sv 274 → 764, sv 243 → 6, sv 163 → 24, sv 640D → 22, un 1203 → 10; best hit for sv=243 at line 16892 and un=1203 at line 10015, both as expected. The spec's earlier occurrence figures were inflated and have been corrected in §3.1/§3.2. Chapter 3.3 turned out to have **five** definition line shapes, not three.

---

### Task 6: Render cache (spec §2.3, §9)

The import script is gone. What it was buying — not re-rendering the same text — is now a
small in-process cache.

- [x] Extend `tests/adrBookRender.test.ts`: rendering the same line range twice calls the
      renderer once; the cache is bounded and evicts least-recently-used entries; the cache
      key includes the snapped range, so two different targets that resolve to the same
      window share an entry.
- [x] Implement the LRU inside `src/lib/server/adrBook/api.ts` (or a tiny local module it
      owns). No external dependency; a `Map` with insertion-order eviction is enough.
- [x] Size it deliberately and write the number in a comment with its memory implication,
      since this runs per worker alongside the 25 MB index.
- [x] `pnpm test` green.

### Task 7: Query API over the index (spec §6)

- [x] Write `tests/adrBookApi.test.ts` with `// @vitest-environment node`, building an index
      from the fixture. Cover:
  - `resolvePrimaryHit` returns the rank-1 definition for a provision code, and the Table A
    row for a UN number
  - `resolvePrimaryHit` returns `null` for a code that does not occur
  - `hitsFor` orders by rank then line, excludes rank 5 unless asked, and reports
    `total`/`capped` correctly at the 500 cap
  - `searchText` is case- and diacritic-insensitive, treats the term as a literal so `.*`
    matches nothing, and rejects terms shorter than 2 characters
  - `windowAt` returns HTML plus the snapped range and the headings it spans
  - `toc` respects `maxLevel` and preserves document order
- [x] Implement `src/lib/server/adrBook/api.ts`. Pure functions over the index, no Supabase
      client anywhere. Add the comment required by the Global Constraints: every caller must
      have checked `isActive` first.
- [x] `pnpm test` green.

### Task 8: Labels (spec §8)

- [x] Write `tests/bookLabels.test.ts` **first**: every locale in `LANGS` has every key present in `BOOK_LABELS.de`, no value is empty, `getBookLabel('tr', 'unknownKey')` falls back to the German string then the key, and the German values match spec §8 verbatim for `bookTitle`, `noHits`, `ctrlFHint`, `notBinding`, `lockedNotice`, `openInBook`. Mirror `tests/multimodal-i18n.test.ts`.
- [x] Run → red. Implement `BOOK_LABELS` + `getBookLabel` in `src/lib/regulations/bookTypes.ts`. Run → green.
- [x] **Verify:** `pnpm test tests/bookLabels.test.ts`.

---

### Task 9: Put the file on the server and prove the gate — **owner-gated**

Do not start until Task 0 is answered. This is the task that makes licensed content
reachable, so it is the one that must not run early.

- [ ] Confirm with the owner how the file reaches the Netcup host and where it lives
      (spec §11.3). Prefer a persistent directory outside the release directory, so a
      redeploy cannot leave the viewer without its source.
- [ ] Copy the file, set `ADR_BOOK_PATH` in the process manager's environment, restart, and
      confirm the startup check passes.
- [ ] Verify the gate by hand against the running app, all three paths:
  - anonymous request to the page and to both endpoints → redirected to login
  - authenticated but not activated → page returns the locked view, both endpoints 403
  - activated → page renders and both endpoints answer
- [ ] Confirm nothing licensed is reachable without a session: request the endpoints with no
      cookie and check the response body, and confirm the file is not served from any static
      path.
- [ ] Record the per-worker memory figure actually observed, and set the process manager's
      worker count or route pinning accordingly (spec §9).

### Task 10: Highlighter (spec §5.3)

- [x] Write `tests/bookHighlighter.test.ts` **first** (jsdom, no runes needed so a plain `.test.ts`):
  - a single match in a plain paragraph is wrapped in `<mark class="book-hit" data-nth="0">` and the returned array has length 1;
  - multiple matches are numbered 0, 1, 2 in document order across sibling and nested elements;
  - a match is found case-insensitively (`benzin` finds `BENZIN`) and diacritic-insensitively (`atzend` finds `Ätzend`, `strasse` finds `Straße`);
  - text inside an existing `<mark>`, a `<script>`, a `<style>` or `.book-figure-missing` is **skipped**;
  - a term that only appears inside an attribute (`aria-label="Gefahrzettel"`) produces **no** mark;
  - a term spanning an inline tag boundary (`Sonder<b>vorschrift</b>`) produces no false wrap and does not corrupt the DOM — assert `root.innerHTML` still contains the `<b>`;
  - `clearMarks` restores `root.innerHTML` to a byte-exact copy of the pre-mark HTML, and doing mark → clear → mark 20 times does not increase the text-node count;
  - a 2-character term works; an empty term marks nothing and throws nothing;
  - regex metacharacters in the term (`3.2`, `a+b`, `50 %`) are matched literally, not as a pattern.
- [x] Run → red. Implement `src/lib/regulations/bookHighlighter.ts` per spec §5.3 (TreeWalker, normalised comparison with an offset map back to the original string, never string replacement on HTML).
- [x] Run → green. **Verify:** `pnpm test tests/bookHighlighter.test.ts`.

---

### Task 11: `AdrBookViewerState` (spec §5.4)

- [ ] Write `tests/adrBookViewer.svelte.test.ts` **first** (`.svelte.test.ts` — the test constructs rune state), with an injected fake fetcher rather than a mocked `fetch`:
  - constructed with `{ hits, totalHits, sections, term, currentIndex }` it exposes `counterLabel` "Treffer 1 von 7";
  - `next()`/`previous()` advance and wrap (last → first, first → last) and set a `wrapped` flag that the UI reads for the `aria-live` message;
  - `next()` onto a hit whose line falls outside every loaded window calls the fetcher **once** with that line, splices the returned window into `windows` in line order, and resolves only after that;
  - a second `next()` while the first is still pending is **ignored** (no queued fetches) and `isLoading` is true in between;
  - `totalHits: 778` with `hits.length === 500` gives `counterLabel` "Treffer 3 von 500+ (778 Treffer)" and `isCapped === true`;
  - `hits: []` gives "Keine Treffer" and `canNavigate === false`;
  - `setTerm('Be')` debounces 300 ms then calls the search fetcher; `setTerm('B')` (1 char) calls nothing and clears hits; two rapid `setTerm` calls produce **one** search and a late response for the stale term is discarded (race guard, same pattern as `SearchState`);
  - toggling `includeIncidental` re-requests the code hits and resets `currentIndex` to 0;
  - `loadAdjacent(1)` appends the adjoining window; at the end of the document it is a no-op;
  - `sections.length` reaching 40 sets `isOverloaded`; `reset()` clears sections back to the window around the current hit;
  - `hitsByChapter` groups by the first two entries of `headingPath` with counts.
- [ ] Run → red. Implement `src/lib/regulations/adrBookViewer.svelte.ts`. Constructor takes `{ initial, fetchSections, searchText, fetchCodeHits }` so nothing network-shaped is hard-wired.
- [ ] Autofixer on the `.svelte.ts`. Run → green. **Verify:** `pnpm test tests/adrBookViewer.svelte.test.ts`.

---

### Task 12: Endpoints (spec §6.1)

- [ ] Write `tests/adr-book-window-endpoint.test.ts` and
      `tests/adr-book-search-endpoint.test.ts`, calling the handlers directly with
      fabricated events as the existing server tests do. Cover for each: missing session →
      the guard's behaviour; authenticated but locked → **403** `{ error: 'locked' }`;
      malformed input → **400**; valid request → the expected payload; over the rate limit →
      **429**. Use a distinct IP per case, because the limiters are module-level.
- [ ] Implement `src/routes/(app)/regulations/adr/window/+server.ts` and
      `.../search/+server.ts` per spec §6.1, both calling `locals.safeGetSession()` and
      checking `isActive` before touching `api.ts`.
- [ ] `pnpm test` green.

### Task 13: Page load (spec §1.2, §4, §7.2)

- [ ] Write `tests/adr-book-page-load.test.ts` **first**, calling `load` directly with a fabricated event (`params`, `url`, `locals.supabase` mock, `parent()` returning `{ isActive }`):
  - `isActive: false` → returns `{ locked: true }` and `locals.supabase.from` is **never called** (the locked-mode rule);
  - active, `?sv=243` → resolves the primary line, returns `{ locked: false, target: { kind: 'sv', code: '243' }, windows: [<one window>], hits, totalHits, toc, currentIndex: 0 }`;
  - `?un=1203` → same shape with `kind: 'un'`;
  - `?section=1.1.3.6` → sections window, **no** hits;
  - `?q=Tunnelcode` → hits from the text search, ordered by line;
  - `?sv=243&hit=3` → `currentIndex: 2`; `hit=0`, `hit=999`, `hit=abc` clamp to 0;
  - `?all=1` → `includeIncidental: true` passed through;
  - precedence: `?sv=243&un=1203&q=x` honours `sv` only;
  - `?sv=99999` (no occurrences) → 200 with `hits: []` and a `notFound: '99999'` marker for the German "Zu {code} wurde keine Stelle…" message — **not** a 404, because the user came from a valid SV code and deserves an explanation plus a usable TOC;
  - `?sv=<not a code>` (letters, 20 chars) → `error(400)`;
  - no parameters → TOC-first: `sections` = the first window, `hits: []`.
- [ ] Run → red. Implement `src/routes/(app)/regulations/adr/+page.server.ts`.
- [ ] Run → green. **Verify:** `pnpm test tests/adr-book-page-load.test.ts`; grep the file to confirm the `isActive` check precedes every `locals.supabase` use.

---

### Task 14: Viewer components (spec §5, §10)

- [ ] Write `tests/adr-book-page.test.ts` **first**, rendering the page with `data` as a prop and `vi.mock`ing the heavy section body if needed:
  - `locked: true` → renders `LockNotice`, the German `lockedNotice` sentence, and **no** find bar and **no** `{@html}` content;
  - active with `?sv=243` data → find bar present with `role="search"`, the chip "Sondervorschrift 243", a labelled term input prefilled `243`, `‹`/`›` buttons with German `aria-label`s, the counter "Treffer 1 von 7" inside an `aria-live="polite"` element;
  - `totalHits: 778, hits.length: 500` → the capped note text is rendered;
  - `hits: []` with a `notFound` marker → the "Zu 99999 wurde keine Stelle im ADR-Text gefunden." message and disabled `‹`/`›`;
  - the TOC renders as `<nav aria-label="Inhaltsverzeichnis">` with the level 1–3 entries and nothing deeper;
  - the skip link targets `#book-content` and `<main id="book-content">` exists with `tabindex="-1"`;
  - the attribution block renders the `notBinding` sentence and the BAM line;
  - a section's `html` is injected and its `.book-table-scroll` wrapper survives into the DOM (assert `role="region"` and `tabindex="0"` are present);
  - the `<svelte:head>` has a `<title>` containing "ADR 2025" and the content wrapper has `lang="de"`.
- [ ] Run → red.
- [ ] Implement `BookFindBar.svelte`, `BookToc.svelte`, `BookWindow.svelte`, `BookAttribution.svelte`, `+page.svelte`. Notes:
  - `BookWindow.svelte` uses `{@html window.html}` — safe because the HTML is sanitised by `render.ts` (Task 4) before it leaves the server, and the allowlist is asserted by a test. Add a comment saying exactly that, so nobody later feeds it unsanitised input.
  - Keyboard handling per spec §5.2, attached with `{@attach}` on the page root, skipping `<textarea>`/`contenteditable` targets; `Ctrl+F` passes through when the input already has focus.
  - `.book-*` styles live in `+page.svelte`'s `<style>` with `@reference "tailwindcss"` at the top (required by Tailwind v4 for `@apply`).
  - `AdrBookViewerState` created once via `untrack(() => new AdrBookViewerState(...))`.
  - `prefers-reduced-motion` respected via `window.matchMedia` read inside the scroll helper, not at module load.
- [ ] Autofixer on all five `.svelte` files. Run → green.
- [ ] **Verify:** `pnpm test tests/adr-book-page.test.ts`; `pnpm test tests/tailwind-classes.test.ts` still green (no runtime-built classes introduced).

---

### Task 15: Wire the links from the comparison tool (spec §1.3)

- [ ] Extend `tests/MultimodalSvsAccordion.test.ts` **first**:
  - with `mode="ADR"` and `demo` false, each SV row renders a link whose `href` is `/regulations/adr?sv=<code>`, `target="_blank"`, `rel="noopener"`, and whose accessible name is "Sondervorschrift 243 im ADR-Text öffnen";
  - with `demo` true → **no** link (a locked user must not be sent to a lock notice);
  - with `mode="IMDG"` (or RID/ICAO) → **no** link (no book text for those modes);
  - clicking the link does **not** toggle the accordion row (the link is a sibling of the toggle `<button>`, not nested inside it) — assert by checking the row's expanded state is unchanged after a click on the link.
- [ ] Extend `tests/MultimodalTool.test.ts`: with real (non-demo) ADR data, the `UN 1203` header is a link to `/regulations/adr?un=1203` with `target="_blank"`; in `demo` mode and for non-ADR modes it is plain text.
- [ ] Extend `tests/app-layout.test.ts`: the nav contains an "ADR-Text" link to `/regulations/adr`.
- [ ] Run → red.
- [ ] Modify `MultimodalSvsAccordion.svelte`, `MultimodalTool.svelte`, `(app)/+layout.svelte`. **Minimal diffs** — these files were just touched for the regenerated demo data (`DEMO_SVS` is now keyed `` `${mode}:${nr}` ``); do not refactor anything else while you are in there.
- [ ] Autofixer on the three files. Run → green.
- [ ] **Verify:** the three extended test files green; full `pnpm test` green.

---

### Task 16: Docs and full verification

- [ ] Update `CLAUDE.md`: add `/regulations/adr` to the URL structure as implemented; add the new `lib/regulations/` and `lib/server/adrBook/` entries to Project Structure; add `ADR_BOOK_PATH` to the environment-variable table; add a "ADR book source" paragraph stating that the file is gitignored, deployed by hand, indexed in memory at boot at roughly 25 MB per worker, rendered on demand, and that `marked`/`sanitize-html` are now runtime dependencies; state explicitly that this feature has no RLS backstop and why; update the test count; rewrite "Where we left off".
- [ ] Update `README.md` (one paragraph) and `static/llms.txt` — but **only** with what the Task 0 licence answer permits; do not advertise the ADR full text publicly if the licence does not allow it. Keep the site facts (16.730 entries, 1.354 SVs) consistent as the SEO invariant requires.
- [ ] Run the full gate: `pnpm test` (all green, record the new total), `pnpm check` (clean), `pnpm build`, `pnpm preview`.
- [ ] Preview smoke test, logged out: `/regulations/adr` → 303 `/login?next=%2Fregulations%2Fadr`; `/regulations/adr/window?line=1` → 303. Logged in but locked: page 200 with the lock notice, both endpoints 403, and no book text in any response body. Logged in and activated:
  - `?sv=243` lands on the 3.3 definition of 243, counter "Treffer 1 von 7";
  - `?sv=274` lands on its definition, counter "Treffer 1 von 500+ (778 Treffer)", capped note visible, chapter-grouped hit list usable;
  - `?un=1203` lands on the Table A row, `›` walks to Tabelle B and the transitional provisions, and pressing `›` into an unloaded region fetches that window and scrolls correctly;
  - `?q=Tunnelcode` marks and counts;
  - a 25-column Table A window scrolls **inside** `.book-table-scroll` with **no horizontal scrollbar on `<body>`** — check at 375 px, 768 px and 1440 px widths;
  - `Ctrl+F` focuses the bar, a second `Ctrl+F` opens the browser's own find;
  - keyboard-only pass: skip link → find bar → next/prev → TOC → table scroll, all reachable and visibly focused.
- [ ] Measure against the spec §9 budgets (index build time and resident memory at boot, initial payload, one `window` fetch, `markMatches` timing on a Table A window) and record the numbers in the checkpoint. Anything over budget is a finding, not a pass.
- [ ] **Verify:** every bullet above observed and recorded. Report to the owner, repeating spec §11's remaining open questions verbatim. **Do not commit** — the owner commits.

## Execution notes

Decisions and findings recorded while this plan was executed (copied from the execution
ledger, which is not in git). `Ruling:` = a decision taken on the owner's behalf, with its cost if wrong.

- Setup: Ruling: no worktree, no commits — owner rule (CLAUDE.md + memory) overrides skill; BASE = working tree — cost if wrong: none, owner commits
- Setup: Ruling: route /regelwerk/[mode] with a param matcher allowing only `adr` (owner 2026-09-29, spec §11.5/§11.9) — replaces /regulations/adr everywhere in Tasks 12–16 — cost if wrong: rename of one route dir
- Setup: Ruling: Ctrl+F is NOT intercepted (owner 2026-09-29, spec §11.6) — find bar always visible; drop the Ctrl+F test bullets — cost if wrong: add one key handler
- Setup: Ruling: source = official public text, exact document TBD (owner) — Task 0 partially answered; nothing deployed — cost if wrong: feature cannot ship
- Task 11: Ruling: window endpoint takes `dir=1/-1` (window starting after / ending before `line`, ADJACENT_WINDOW_LINES=300) besides centred `line` — sliceAround snaps outward, so a centred fetch next to a loaded window would render text twice; ensureLineLoaded uses adjacent fetches when the hit is within 300 lines of a loaded edge, centred otherwise — cost if wrong: rare one-line overlap (MAX_SNAP case)
- Task 11: Ruling: toggling includeIncidental calls fetchCodeHits → search endpoint also accepts `sv=`/`un=` (+`all=1`) and answers from hitsFor — spec §6.1 names no endpoint for it — cost if wrong: one extra query mode
- Task 11: Ruling: capped counter total comes from new label `cappedTotal` ('{shown}+ ({total} Treffer)') in all four languages — the plan's string embeds German "Treffer" — cost if wrong: none
- Task 11: Ruling: plan's `sections`/`isOverloaded` = spec's `windows`; cap MAX_LOADED_WINDOWS=40; reset() keeps only the window holding the current hit (sync, no fetch)
- Task 12: Ruling: endpoints answer 401 {error:'unauthenticated'} with no session (defence in depth behind the hooks redirect) and check the rate limit before the session (limits Supabase auth calls too) — cost if wrong: none
- Task 12: Ruling: shared gate in src/lib/server/adrBook/access.ts (bookAccessDenied); SV_CODE_RE/UN_NUMBER_RE live in bookTypes.ts because SvelteKit rejects extra exports from +server.ts
- Task 12: Ruling: added src/params/bookMode.ts matcher (only 'adr') + tests/bookMode-matcher.test.ts, per owner's /regelwerk/[mode] decision
- Task 13: Ruling: not-found case uses sv=999 (plan's 99999 fails the SV code shape → 400 by design); the "supabase.from never called" check becomes "getBookIndex never called" — the book is not in Postgres
- Task 13: Ruling: load returns focusLine (scroll target), resolvedCode (640D→640 parent fallback, whose hits are then listed) and totalLines; locked payload is { locked: true, mode } only
- Task 14: Ruling: renderer tags every non-heading block and every table row with `book-ln-<line>` (render.ts sourceLines + api.ts subsequence mapping) and the highlighter gains `wholeToken` + `sourceLineOf`/`pickActiveMark` — without them the active <mark> for "Treffer k von n" cannot be identified (marks only knew their window). Verified on the real book: 0/3551 row tags mismatched — cost if wrong: active highlight on a neighbouring occurrence
- Task 14: Ruling: added BookViewer.svelte (orchestrator) + bookFetch.ts (+test) beyond the plan's five files; BookPageData type moved to bookTypes.ts so components share it
- Task 14: Ruling: reading backward is a "Vorherigen Abschnitt laden" button, forward is IntersectionObserver + button — auto-prepending shifts the scroll position (no scroll anchoring in Safari) — cost if wrong: one click
- Task 14: Ruling: "Auch beiläufige Treffer" shown for every code target (spec: only when rank-5 hits exist, with a count) — the count needs an extra query — cost if wrong: a checkbox that sometimes changes nothing
- Task 14: Ruling: autofixer "replaceState() without resolve()" kept as false positive — the path is resolve()d inline; resolve() cannot carry the query string (spec §1.3). {@html} warning expected: server-sanitised HTML, commented in BookWindow.svelte
- Task 14: Final: minor (deferred): TOC has no aria-current for the section in view (needs scroll tracking)
- Task 15: Ruling: links point at /regelwerk/adr (owner route); link copy/aria from new labels openSvInBook/openUnInBook (4 langs); autofixer "href without resolve()" is the same resolve()+query false positive spec §1.3 prescribes
- Task 16: Ruling: budgets over — index build 245 ms (budget 100), ?sv=274 payload 390 KB raw (budget 350; 41 KB gz) — recorded as findings, not fixed — cost if wrong: slower first request per worker; heavier page for common codes
- Final review: self-review (no subagent tool use without owner request)
- Final: fixed focus stolen from the search field when a hit is activated — "keeps focus in the search field…" RED→GREEN, suite 554/554
- Final: fixed no scroll when a search's first hit lies outside the loaded windows (scroll key consumed before the window arrived) — "scrolls to the first hit of a search…" RED→GREEN, suite 554/554
- Final: fixed lettered provision (640D) marks/hits mismatch — load retargets to the parent and reports fallbackFrom — "retargets a lettered provision…" RED→GREEN, suite 554/554
- Final: minor (deferred): hit payload repeats the full heading object per hit (drives the 390 KB case)
- Final: minor (deferred): "Tunnelcode" has 0 hits — the ADR says "Tunnelbeschränkungscode"; synonyms would help
- Owner 2026-09-29: shortcut list removed from the find bar ("confusing"); keys still work — test 'shows no keyboard-shortcut list' RED→GREEN, suite 555/555
- Owner 2026-09-29: ALL shortcuts removed ("overkill") — only Enter in the search field = next hit; Ctrl+F hint removed — test 'has no keyboard shortcuts…' RED→GREEN, suite 554/554
