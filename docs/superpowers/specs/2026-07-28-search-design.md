# Search Feature Design

Date: 2026-07-28

## Overview

Two changes: (1) strip the non-functional search bar from the landing page Hero and replace it with a scroll-to-demo button, (2) build a real `/search` page that serves as the first screen after login.

---

## Part 1 — Landing Page Changes

### Hero.vue
- Remove the search `<input>` and "Suchen" `<button>`.
- Replace with a single orange CTA button: **"Jetzt ausprobieren →"**
- Button scrolls to `#demo` anchor on click (smooth scroll via `href="#demo"`).

### MultimodalDemo section (landing/MultimodalDemo.vue or wherever it renders)
- Add `id="demo"` to the section wrapper so the scroll target resolves.
- No other changes — it remains demo mode with hardcoded UN 1203.

---

## Part 2 — `/search` Page

### Route
`app/pages/search.vue` — added to `nuxt.config.ts` `supabase.redirectOptions.exclude` as `/search` for now. Auth gating added later.

### Layout
Two vertical zones on one page:

**Zone 1 — Search bar (always visible)**
- Single text input, placeholder: `"UN-Nummer oder Stoffname suchen …"`
- Results update as user types, debounced 300 ms.
- Behavior based on input:
  - Input matches `/^\d{4}$/` exactly → skip results list, load tool directly (Zone 2 shows MultimodalTool).
  - Input is 1–3 chars → no query yet (too short), show empty state.
  - Input is ≥ 4 chars and not a 4-digit number → text search, show results list.

**Zone 2 — Dynamic content area**
Three states:

| State | Trigger | Content |
|---|---|---|
| Empty | No query / < 4 chars | Short hint text + example UN number chips (e.g. 1203, 1090, 2794) |
| Results list | Text query ≥ 4 chars | Up to 20 result cards (UN number + localized name + hazard class + packing group). Clicking a card loads the tool below. |
| Tool loaded | 4-digit UN or card click | `MultimodalTool` component with `:un-number` prop. Results list collapses. |

### Result Cards
Each card shows:
- UN number (bold, monospace)
- Name in current UI language (`name` for `de`, `name_en` for `en`/`tr`, `name_fr` for `fr`) — falls back to `name` if translation is absent.
- Hazard class badge
- Packing group

### Data Source
Query `adr_entries` only. ADR has the most complete German names and already has a GIN FTS index. 20 results max.

```sql
SELECT un_number, name, name_en, name_fr, hazard_class, packing_group
FROM adr_entries
WHERE name ILIKE '%{q}%'
   OR name_en ILIKE '%{q}%'
   OR name_fr ILIKE '%{q}%'
ORDER BY un_number
LIMIT 20
```

Supabase client call uses `.ilike` chained with `.or()`.

### New Composable: `useSearch.ts`
Lives at `app/composables/useSearch.ts`. Responsibilities:
- `query` ref — bound to the input
- `debouncedQuery` — 300 ms debounced version
- `results` ref — array of search result rows
- `selectedUn` ref — the UN number currently loaded in the tool (null = no tool shown)
- `isLoading` ref
- `search()` — runs the Supabase query when `debouncedQuery` changes
- `select(unNumber)` — sets `selectedUn`, collapses results list

`search.vue` imports `useSearch` and `MultimodalTool`. No logic in the page component itself.

### Auth
`/search` added to `supabase.redirectOptions.exclude` in `nuxt.config.ts`. Marked with a `// TODO: remove when auth is implemented` comment.

---

## Out of Scope
- FTS / Meilisearch (Phase 3)
- Searching RID/IMDG/ICAO tables for name lookup (ADR is the source of truth for search)
- Pagination (20 results is sufficient for Phase 1)
- Search history / saved searches
