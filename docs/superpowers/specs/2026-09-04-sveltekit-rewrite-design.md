# SvelteKit Rewrite — Design

**Date:** 2026-09-04
**Status:** implemented 2026-09-04. Superseded in parts by the auth spec (waitlist retired, product routes moved to `(app)`, `/search` → `/suche`).

## Goal

Replace the Nuxt 4 application with a SvelteKit application at feature parity, in the same repository, keeping Supabase as database and future auth provider. No new user-facing features. The result must render the same pages with the same markup and Tailwind classes, pass the same test intent (102 tests), and be deployable to Netcup via adapter-node behind Caddy.

## Decisions (already made)

| Question | Decision |
|---|---|
| Location | Replace in place. Nuxt files deleted; `supabase/`, `scripts/`, `csvbase/`, `docs/`, `public/` untouched. |
| Supabase client | `@supabase/ssr` scaffolding now (hooks + layout clients), no login pages yet. |
| Scope | Feature parity only: landing + waitlist + SEO, `/search`, `/un/:nummer`. |
| Tests | Vitest + jsdom + `@testing-library/svelte`. No browser mode. |
| Approach | Structural port plus two idiom fixes: server load for `/un/:nummer`, form action for the waitlist. |
| Adapter | `@sveltejs/adapter-node`. |
| UI library | None. The current app uses zero Nuxt UI components and zero icon classes; all styling is hand-written Tailwind. |
| Package manager | pnpm only. |

## Versions

Pin to the versions current on 2026-09-04 (exact versions go in `package.json`; use `pnpm view <pkg> version` at scaffold time and pin what comes back):

svelte 5.57, @sveltejs/kit 2.70, @sveltejs/adapter-node 5.5, @sveltejs/vite-plugin-svelte 7.3, vite 8.2, vitest 5.0, tailwindcss + @tailwindcss/vite 4.3, @supabase/ssr 0.12, @supabase/supabase-js 2.115, @testing-library/svelte 5.4, @testing-library/jest-dom 7.0, jsdom 30, svelte-check 4.7, typescript 5.x (not 7; supabase-js and svelte-check target 5).

`experimental.async` (await expressions) is **not** enabled. Remote functions are **not** used.

## 1. Project layout

```
src/
  app.html                 <html lang="de">, %sveltekit.head%, %sveltekit.body%
  app.css                  @import "tailwindcss";
  app.d.ts                 App.Locals { supabase: SupabaseClient }, App.PageData { supabase }
  hooks.server.ts
  lib/
    multimodal/
      types.ts             Entry, Modal, Lang, MODALS, LANGS, LABELS, MODAL_DESC_I18N,
                           DEMO_DATA, DEMO_SVS, BK_CLASSES, getL   (= old utils/multimodal.ts)
      mappers.ts           per-mode row→Entry mappers, fetchCompareForUn  (= old multimodalMappers.ts)
      multimodalTool.svelte.ts    MultimodalToolState class
      specialProvisions.svelte.ts shared cache + loader
      MultimodalTool.svelte
      MultimodalSvsAccordion.svelte
    landing/
      Navbar.svelte Hero.svelte Stats.svelte Features.svelte MultimodalDemo.svelte
      Comparison.svelte SeoContent.svelte Waitlist.svelte DataSource.svelte
      Faq.svelte Cta.svelte Footer.svelte
      faq.ts               FAQ_ITEMS  (= old utils/landingFaq.ts)
      waitlistForm.svelte.ts   WaitlistFormState class
    seo/
      structuredData.ts    SITE_URL + JSON-LD builders (unchanged)
    search/
      search.svelte.ts     SearchState class, SearchResult, MIN_QUERY_LENGTH
    server/
      rateLimit.ts         createRateLimiter (unchanged)
      waitlistValidation.ts validateWaitlistInput (unchanged)
      supabaseAdmin.ts     lazy service-role client
  routes/
    +layout.server.ts      returns { cookies }
    +layout.ts             creates browser/server client, returns { supabase }
    +layout.svelte         imports app.css, font <link>s, renders children
    +page.svelte           landing page
    +page.server.ts        waitlist form action
    search/+page.svelte
    un/[nummer]/+page.server.ts
    un/[nummer]/+page.svelte
tests/                     vitest files, same names as today where the subject survives
static/                    = old public/ (llms.txt, og-image.png, robots, favicon)
svelte.config.js  vite.config.ts  tsconfig.json  package.json
```

Deleted: `app/`, `server/`, `nuxt.config.ts`, `.nuxt/`, `.output/`, Nuxt dependencies (`nuxt`, `vue`, `vue-router`, `@nuxt/*`, `@nuxtjs/*`, `@vue/test-utils`, `@vitejs/plugin-vue`, `happy-dom`). `dotenv` and `tsx` stay for the import script. `public/` is renamed to `static/`.

Scripts:

```
dev            vite dev
build          vite build
preview        vite preview
check          svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
test           vitest run
test:watch     vitest
import:regulations  tsx scripts/import-regulations.ts
```

Environment variables:

| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | `$env/static/public` | project URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `$env/static/public` | publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | `$env/dynamic/private` | waitlist insert; runtime only, never in the build |
| `ORIGIN` | adapter-node | `https://gefahrgut.org`; required for form actions |
| `ADDRESS_HEADER` / `XFF_DEPTH` | adapter-node | `X-Forwarded-For` / `1`; client IP = right-most hop appended by Caddy |
| `PORT` | adapter-node | default 3000 |

`scripts/import-regulations.ts` is updated to read `PUBLIC_SUPABASE_URL` (was `NUXT_PUBLIC_SUPABASE_URL`). `.env` keys are renamed accordingly.

## 2. Data layer

**`hooks.server.ts`** — per request, `createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: { getAll, setAll } })` with `setAll` writing each cookie with `path: '/'`; result stored on `event.locals.supabase`; `resolve` with `filterSerializedResponseHeaders` allowing `content-range` and `x-supabase-api-version`. No `safeGetSession` yet (nothing is authenticated); it is added with F-04.

**`+layout.server.ts`** — returns `{ cookies: cookies.getAll() }`.

**`+layout.ts`** — `depends('supabase:auth')`; in the browser `createBrowserClient(...)`, during SSR `createServerClient(...)` with `getAll` reading `data.cookies`; both with `global: { fetch }`. Returns `{ supabase }`. No `getClaims` call yet.

Access paths:

| Page | Where data is fetched | Client |
|---|---|---|
| `/` | none (demo data hardcoded) | — |
| `/search` | client, live as you type | `data.supabase` from layout |
| `/un/[nummer]` | server, in `+page.server.ts` via `fetchCompareForUn(locals.supabase, params.nummer)` | `locals.supabase` |
| SV accordion (any page) | client, lazy on expand | `data.supabase` from layout |

`/un/[nummer]` validates `params.nummer` against `/^\d{4}$/` and throws `error(404)` otherwise. If no mode returns rows, the page still renders with the tool's "no data" state (as today).

The `un_comparison` view is untouched. No schema changes.

## 3. State and components

### State classes (`.svelte.ts`)

**`MultimodalToolState`** (`lib/multimodal/multimodalTool.svelte.ts`)

```ts
constructor(opts: { initialData?: Record<string, Entry[]>; initialUnNumber?: string; supabase?: SupabaseClient })
// $state: currentLang, currentModal, currentUnNumber, compareData, isLoading
// $derived getters: currentEntry, searchDisplay, hasData
// helpers: L, modalDesc, getEntry, getName, getNameSub, getSpez, bkClass
// actions: setLang, switchModal, loadCompare(unNumber)
```

`initialData` replaces the `demo` flag at the state level: the landing embed passes `DEMO_DATA` + `'1203'`, the UN page passes the server-loaded data + the route param. `loadCompare` needs `supabase` and is only used if the component's `unNumber` prop changes client-side after mount (client navigation between UN pages goes through the load function anyway, so this path is defensive). When `compareData` is set, `currentModal` moves to the first mode with rows, as today.

**`SearchState`** (`lib/search/search.svelte.ts`)

```ts
constructor(supabase: SupabaseClient)
// $state: query, results, selectedUn, isLoading
// action: select(unNumber)
```

`query` is a setter-backed field: setting it runs the same logic as the old `watch` — clear timer; 4-digit UN sets `selectedUn` immediately; shorter than `MIN_QUERY_LENGTH` (2) clears results; otherwise debounce 300 ms then query `adr_entries` with the same `.or()` filter set (delimiters stripped), `.order('un_number').limit(20)`. Request-id race guard kept. `SearchResult` and `MIN_QUERY_LENGTH` exported.

**`specialProvisions.svelte.ts`** — module-level `$state<Record<string, SpecialProvisionText | null>>({})` cache + pending `Map`; exports `getSpecialProvision(mode, code)` (sync read), `loadSpecialProvision(supabase, mode, code)`, `clearSpecialProvisionsCache()` (tests). Same semantics: `undefined` = not fetched, `null` = no row, errors not cached.

**`WaitlistFormState`** (`lib/landing/waitlistForm.svelte.ts`) — `$state`: `name`, `email`, `consent`, `honeypot`, `status: 'idle' | 'submitting' | 'success' | 'already' | 'rateLimited' | 'error'`; `$derived` `canSubmit` with the same rule (name ≥ 2 chars, email regex, consent, not submitting). Submission itself is done by the form action + `use:enhance` (section 4); the class only owns field state and `canSubmit`.

### Components

One-to-one with the Vue files. Rules for the port:

- Copy every Tailwind class string and inline `style` verbatim. Do not restyle.
- `defineProps` → `let { ... } = $props()`; `v-if/v-else` → `{#if}{:else}`; `v-for` → `{#each items as item (key)}` with a real key; `@click` → `onclick`; `v-model` → `bind:value` / `bind:checked`; `ref` on elements → `bind:this`; `NuxtLink` → `<a href>`; `nextTick` → `await tick()`.
- Copy text content verbatim (German copy, FAQ, legal links to `gefahrgut.org/impressum` and `/datenschutz`).
- `MultimodalTool.svelte` props: `{ demo?: boolean; unNumber?: string; initialData?: Record<string, Entry[]>; supabase?: SupabaseClient }`. With `demo` it builds state from `DEMO_DATA`; otherwise from `initialData`. `MultimodalSvsAccordion.svelte` keeps today's props `{ svs: string; label; noText; clickLoad; demo?; mode?: Modal; lang?: Lang }` and adds `supabase?: SupabaseClient`; it lazy-loads texts on expand via `loadSpecialProvision`, re-fetches open rows when `mode`/`svs` change (via `$effect`), and keeps the language fallback exactly: en/tr → textEn, textDe, textFr; fr → textFr, textEn, textDe; de → textDe, textEn, textFr; demo mode reads `DEMO_SVS`.
- `MultimodalDemo.svelte` keeps `id="demo"`; `Waitlist.svelte` keeps `id="waitlist"`; navbar anchors unchanged.
- Pages receive `data` via `let { data } = $props()` and pass what children need explicitly (no context, no global store).

## 4. Waitlist form action

`routes/+page.server.ts`:

```ts
export const actions = {
  waitlist: async ({ request, getClientAddress }) => {
    if (!limiter.check(getClientAddress())) return fail(429, { status: 'rateLimited' })
    const form = await request.formData()
    const body = { name: form.get('name'), email: form.get('email'), consent: form.get('consent') === 'on', website: form.get('website') }
    const result = validateWaitlistInput(body)   // unchanged pure function; expects consent === true, honeypot from `website`
    if (!result.ok) return fail(400, { status: 'error', message: result.error })
    if (result.data.honeypot) return { status: 'ok' }   // pretend success, store nothing
    // CAPTCHA: Turnstile verification slot (comment carried over)
    const { error } = await getSupabaseAdmin().from('waitlist').insert({ name, email, consented_at })
    if (error?.code === '23505') return { status: 'already_registered' }
    if (error) return fail(500, { status: 'error' })
    return { status: 'ok' }
  }
}
```

`limiter` is a module-level `createRateLimiter({ max: 5, windowMs: 3_600_000 })` (sliding window, in-memory, one process — same as today). `getSupabaseAdmin()` in `lib/server/supabaseAdmin.ts` creates the service-role client once with `auth: { persistSession: false }`, reading `PUBLIC_SUPABASE_URL` and `env.SUPABASE_SERVICE_ROLE_KEY` from `$env/dynamic/private`.

`Waitlist.svelte`: `<form method="POST" action="?/waitlist" use:enhance={...}>`. The enhance callback sets `status = 'submitting'` before the request and maps the result: `success` → `'ok'` / `'already_registered'` → `'success'` / `'already'`; `failure` with status 429 → `'rateLimited'`; any other failure or error → `'error'`. After a success/already result, focus moves to the result panel (`tick()` then `panel.focus()`). Without JavaScript the same form posts natively and the page re-renders reading `form` (the `ActionData` prop) to pick the panel or message. The submit button is `disabled={!state.canSubmit}` only when JavaScript is running (initial SSR renders it enabled so the no-JS path works; use a `mounted` flag).

The old `POST /api/waitlist` route is removed. The rate-limit-IP note in CLAUDE.md is replaced by the adapter-node `ADDRESS_HEADER`/`XFF_DEPTH` note.

## 5. SEO and head

- `app.html` sets `lang="de"`, viewport, charset, favicon.
- `+layout.svelte`: `<svelte:head>` with the two `preconnect` links and the Plus Jakarta Sans stylesheet link (verbatim from `index.vue`).
- `+page.svelte` (landing): `<svelte:head>` with title, description, canonical, robots, OG and Twitter meta (same values as `useSeoMeta` today), and four `<script type="application/ld+json">` blocks built from `buildOrganizationLd`, `buildWebSiteLd`, `buildSoftwareApplicationLd`, `buildFaqPageLd(FAQ_ITEMS)`. JSON is injected with `{@html}` inside the script tag after escaping `<` as `<`.
- `un/[nummer]/+page.svelte`: title `UN <nummer> – <name> | gefahrgut.org` (falls back to `UN <nummer>`), meta description from the ADR entry when present, canonical `${SITE_URL}/un/<nummer>`.
- `search/+page.svelte`: `<meta name="robots" content="noindex">` and a plain title, as today.
- `static/llms.txt`, `og-image.png`, `robots.txt` unchanged. Site facts (16,730 entries, 1,354 SVs) stay consistent across meta description, FAQ, SeoContent, llms.txt.

## 6. Testing

`vite.config.ts` registers `sveltekit()` and `tailwindcss()` plugins and a `test` block: `environment: 'jsdom'`, `include: ['tests/**/*.test.ts']`, `setupFiles: ['tests/setup.ts']` (imports `@testing-library/jest-dom/vitest`), `resolve.conditions: ['browser']` when `process.env.VITEST`.

| Old test | New test | Kind |
|---|---|---|
| multimodalMappers | same | pure, unchanged |
| structuredData | same | pure, unchanged |
| rateLimit | same | pure, unchanged |
| waitlistValidation | same | pure, unchanged |
| multimodal-i18n | same | pure, unchanged |
| tailwind-classes | same, scans `src/**/*.svelte` | pure |
| useMultimodalTool | multimodalTool.svelte.test.ts | logic: instantiate `MultimodalToolState` with mock client, `flushSync` where needed |
| useSearch | search.svelte.test.ts | logic: fake timers, mock client returning canned rows, race guard |
| useSpecialProvisions | specialProvisions.svelte.test.ts | logic: cache/pending/error semantics |
| useWaitlist | waitlistForm.svelte.test.ts | logic: `canSubmit` rules |
| MultimodalSvsAccordion | same | component: `render`, expand, text + language fallback |
| waitlist-section | same | component: `render(Waitlist)`, field validation, panels for each status (enhance is mocked via `$app/forms` `vi.mock`) |
| search-page | same | component: `render(SearchPage, { props: { data: { supabase: mock } } })`, `MultimodalTool` stubbed via `vi.mock` |
| un-page | same | component: `render(UnPage, { props: { data } })` renders back link and passes data down |
| — | waitlist-action.test.ts | server: call `actions.waitlist` with a fabricated event (`request` with FormData, `getClientAddress`); mock `supabaseAdmin`; assert 429/400/honeypot/23505/ok |
| — | un-page-load.test.ts | server: `load` with valid/invalid `nummer`, mock `locals.supabase` |

Test files touching Supabase mock the client by hand (an object with chainable `from/select/or/eq/order/limit/maybeSingle` returning canned `{ data, error }`), passed in through constructors or `data` props. `$app/*` modules are mocked with `vi.mock` where a component imports them.

Definition of done: `pnpm test` green with at least the same 102 cases plus the two server suites; `pnpm check` clean; `pnpm build` succeeds; `pnpm preview` serves `/`, `/search`, `/un/1203` with real data.

## 7. Cleanup and documentation

- Rewrite `CLAUDE.md`: tech stack (SvelteKit 2 / Svelte 5 / Tailwind 4 / Supabase / adapter-node), project structure per section 1, commands, env var table, testing conventions (jsdom + testing-library, `.svelte.test.ts` for rune tests, hand-built Supabase mocks, `vi.mock('$app/...')`), the adapter-node proxy env note, SEO invariant, "no auth yet — every route is public; when F-04 lands, guards go in `hooks.server.ts`". Remove all Nuxt-specific gotchas (auto-imports, `mockNuxtImport`, `mountSuspended`, Tailwind file-scan restart note if it no longer reproduces, `onMounted` SSR caveat — now fixed).
- `docs/database-schema-and-import-plan.md`: env var rename only.
- Add a short deployment note (`node build` with `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, `PORT`, `SUPABASE_SERVICE_ROLE_KEY`) to CLAUDE.md.
- Update the project memory: remove Nuxt-specific test-mocking facts.

## Out of scope

Auth/login/dashboard (F-04, F-05), tools, any schema change, dropping/recreating `un_comparison`, Turnstile, i18n routing, blog migration, ESLint setup, Playwright e2e.
