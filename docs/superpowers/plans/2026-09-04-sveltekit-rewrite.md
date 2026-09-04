# SvelteKit Rewrite Implementation Plan

> **Status 2026-09-04:** all tasks done; see the auth plan for what changed afterwards.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Nuxt 4 app with a SvelteKit 2 / Svelte 5 app at feature parity (landing + waitlist, `/search`, `/un/:nummer`), keeping Supabase, in the same repository.

**Architecture:** Structural port. Framework-free TypeScript (types, mappers, validation, rate limiter, JSON-LD builders, FAQ) moves unchanged into `src/lib`. Vue composables become `.svelte.ts` classes with `$state`/`$derived`. Components are transliterated one to one with Tailwind classes copied verbatim. Two idiom fixes: `/un/[nummer]` loads on the server, and the waitlist becomes a form action with `use:enhance`. Supabase is wired through `@supabase/ssr` (hooks + layout clients) so auth can be added later without rewiring.

**Tech Stack:** SvelteKit 2.70, Svelte 5.57, Vite 8, Tailwind 4.3 (`@tailwindcss/vite`), `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.115, `@sveltejs/adapter-node` 5.5, Vitest 5 + jsdom + `@testing-library/svelte` 5.4, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-04-sveltekit-rewrite-design.md`

## Global Constraints

- **pnpm only.** Never run `npm` or `npx`. Use `pnpm add`, `pnpm dlx`, `pnpm exec`.
- **No git commits or staging by the executor.** The project owner handles all git operations. Where a plan would normally say "commit", this plan says **Checkpoint** — stop, run the listed verification, and report. Do not run `git add`, `git commit`, `git mv`, or `git stash`.
- **Tailwind classes and inline `style` attributes are copied verbatim** from the Vue source. Do not restyle, rename colors, or "clean up" markup.
- **German copy is copied verbatim** (including `&shy;`, typographic quotes, and dashes).
- **Identifiers are English** (`hazardClass`, not `klasse`). Route param stays `nummer` because it is part of the public URL `/un/:nummer`.
- **Site facts stay consistent:** 16.730 entries, 1.354 special provisions, 5 free searches per month.
- **Every Svelte file must pass the Svelte MCP autofixer** (`svelte-autofixer` tool, or `pnpm dlx @sveltejs/mcp svelte-autofixer <file>`) with no remaining issues before its task is done. Use the `svelte-file-editor` agent or the `svelte-code-writer` skill for every `.svelte` / `.svelte.ts` file.
- **Tests are required for every task** that adds behavior. Test runner: `pnpm test` (Vitest, jsdom). Rune-using test files must be named `*.svelte.test.ts`.
- **Port order:** the Nuxt sources in `app/` and `server/` stay on disk until Task 11 so every task can read the original next to its port. Do not delete them earlier.
- **Version pins:** exact versions in `package.json` for the Svelte/Vite/Vitest/Supabase packages listed in Task 1. If `pnpm install` reports one of them does not exist, run `pnpm view <pkg> version` and pin what it returns; do not fall back to `latest`.
- **Experimental features off:** no `experimental.async`, no remote functions.

---

## File map

| New file | Responsibility | Source |
|---|---|---|
| `src/app.html`, `src/app.css`, `src/app.d.ts` | shell, global CSS, ambient types | new |
| `src/hooks.server.ts` | per-request Supabase server client on `event.locals` | new |
| `src/routes/+layout.server.ts`, `+layout.ts`, `+layout.svelte` | cookie pass-through, browser/server client, font links | new |
| `src/lib/multimodal/types.ts` | `Entry`, `Modal`, `Lang`, labels, demo data | `app/utils/multimodal.ts` (unchanged) |
| `src/lib/multimodal/mappers.ts` | row → `Entry`, `fetchCompareForUn` | `app/utils/multimodalMappers.ts` (unchanged) |
| `src/lib/multimodal/multimodalTool.svelte.ts` | `MultimodalToolState` | `app/composables/useMultimodalTool.ts` |
| `src/lib/multimodal/specialProvisions.svelte.ts` | SV cache + loader | `app/composables/useSpecialProvisions.ts` |
| `src/lib/multimodal/MultimodalSvsAccordion.svelte` | SV accordion | `app/components/multimodal/MultimodalSvsAccordion.vue` |
| `src/lib/multimodal/MultimodalTool.svelte` | comparison tool | `app/components/multimodal/MultimodalTool.vue` |
| `src/lib/landing/*.svelte` (12 files) | landing sections | `app/components/landing/*.vue` |
| `src/lib/landing/faq.ts` | `FAQ_ITEMS` | `app/utils/landingFaq.ts` (unchanged) |
| `src/lib/landing/waitlistForm.svelte.ts` | `WaitlistFormState` | `app/composables/useWaitlist.ts` |
| `src/lib/seo/structuredData.ts` | JSON-LD builders | `app/utils/structuredData.ts` (import path only) |
| `src/lib/search/search.svelte.ts` | `SearchState` | `app/composables/useSearch.ts` |
| `src/lib/server/rateLimit.ts` | sliding-window limiter | `server/utils/rateLimit.ts` (unchanged) |
| `src/lib/server/waitlistValidation.ts` | input validation | `server/utils/waitlistValidation.ts` (unchanged) |
| `src/lib/server/supabaseAdmin.ts` | lazy service-role client | `server/api/waitlist.post.ts` (extracted) |
| `src/routes/+page.svelte`, `+page.server.ts` | landing page + head + waitlist action | `app/pages/index.vue`, `server/api/waitlist.post.ts` |
| `src/routes/search/+page.svelte` | live search | `app/pages/search.vue` |
| `src/routes/un/[nummer]/+page.server.ts`, `+page.svelte` | server-loaded UN detail | `app/pages/un/[nummer].vue` |
| `static/` | `favicon.ico`, `llms.txt`, `og-image.png`, `robots.txt` | `public/` (moved) |
| `tests/setup.ts`, `tests/stubs/ToolStub.svelte` | jest-dom matchers, tool stub | new |

---

### Task 1: SvelteKit scaffold next to the Nuxt app, pure modules moved, pure tests green

**Files:**
- Create: `package.json` (replace), `svelte.config.js`, `vite.config.ts`, `tsconfig.json` (replace), `.gitignore` (edit), `src/app.html`, `src/app.css`, `src/app.d.ts`, `tests/setup.ts`, `tests/fixtures/Counter.svelte`, `tests/smoke.test.ts`, `.env.example`
- Move: `public/` → `static/`; `app/utils/multimodal.ts` → `src/lib/multimodal/types.ts`; `app/utils/multimodalMappers.ts` → `src/lib/multimodal/mappers.ts`; `app/utils/landingFaq.ts` → `src/lib/landing/faq.ts`; `app/utils/structuredData.ts` → `src/lib/seo/structuredData.ts`; `server/utils/rateLimit.ts` → `src/lib/server/rateLimit.ts`; `server/utils/waitlistValidation.ts` → `src/lib/server/waitlistValidation.ts`
- Modify: `tests/multimodal-i18n.test.ts`, `tests/multimodalMappers.test.ts`, `tests/structuredData.test.ts`, `tests/rateLimit.test.ts`, `tests/waitlistValidation.test.ts` (import paths only)
- Delete: `vitest.config.ts`, `pnpm-lock.yaml`, `node_modules/`, `.nuxt/`, `.output/`
- Temporarily disable (rename with `.skip` suffix so Vitest ignores them until their task ports them): `tests/MultimodalSvsAccordion.test.ts`, `tests/search-page.test.ts`, `tests/un-page.test.ts`, `tests/useMultimodalTool.test.ts`, `tests/useSearch.test.ts`, `tests/useSpecialProvisions.test.ts`, `tests/useWaitlist.test.ts`, `tests/waitlist-section.test.ts`, `tests/tailwind-classes.test.ts` → e.g. `tests/useSearch.test.ts.skip`

**Interfaces:**
- Produces: `$lib/multimodal/types` (`Entry`, `Modal`, `Lang`, `MODALS`, `LANGS`, `LABELS`, `MODAL_DESC_I18N`, `DEMO_DATA`, `DEMO_SVS`, `BK_CLASSES`, `getL`), `$lib/multimodal/mappers` (`fetchCompareForUn(supabase, un): Promise<Record<Modal, Entry[]>>`), `$lib/landing/faq` (`FAQ_ITEMS`, `FaqItem`), `$lib/seo/structuredData` (`SITE_URL`, `buildOrganizationLd`, `buildWebSiteLd`, `buildSoftwareApplicationLd`, `buildFaqPageLd`), `$lib/server/rateLimit` (`createRateLimiter`), `$lib/server/waitlistValidation` (`validateWaitlistInput`).

- [ ] **Step 1: Remove Nuxt build state and the old lockfile**

```bash
rm -rf node_modules .nuxt .output pnpm-lock.yaml vitest.config.ts
```

- [ ] **Step 2: Write the new `package.json`**

```json
{
  "name": "dangerous-goods",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "prepare": "svelte-kit sync || echo ''",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "import:regulations": "tsx scripts/import-regulations.ts"
  },
  "dependencies": {
    "@supabase/ssr": "0.12.5",
    "@supabase/supabase-js": "2.115.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "5.5.7",
    "@sveltejs/kit": "2.70.3",
    "@sveltejs/vite-plugin-svelte": "7.3.0",
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/svelte": "5.4.2",
    "dotenv": "^17.4.2",
    "jsdom": "30.0.1",
    "svelte": "5.57.0",
    "svelte-check": "4.7.6",
    "tailwindcss": "4.3.3",
    "tsx": "^4.22.3",
    "typescript": "^5.9.0",
    "vite": "8.2.2",
    "vitest": "5.0.0"
  },
  "packageManager": "pnpm@10.9.0+sha512.0486e394640d3c1fb3c9d43d49cf92879ff74f8516959c235308f5a8f62e2e19528a65cdc2a3058f587cde71eba3d5b56327c8c33a97e4c4051ca48a10ca2d5f"
}
```

Keep the existing `pnpm-workspace.yaml` (`onlyBuiltDependencies: [esbuild]`) as is.

- [ ] **Step 3: Write `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
}

export default config
```

- [ ] **Step 4: Write `vite.config.ts`**

```ts
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defaultClientConditions } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
  // Svelte ships separate client/server builds; tests mount components in
  // jsdom, so resolve the browser entry points even though Vitest runs in Node.
  resolve: process.env.VITEST
    ? { conditions: ['browser', ...defaultClientConditions] }
    : undefined,
})
```

If `defaultClientConditions` is not exported by the installed Vite, replace the `resolve` block with `{ conditions: ['browser'] }`.

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

- [ ] **Step 6: Replace the Nuxt block in `.gitignore`**

Replace the first block (`# Nuxt dev/build outputs` through `dist`) with:

```
# SvelteKit dev/build outputs
.svelte-kit
build
dist
.cache
```

Leave the rest of the file unchanged.

- [ ] **Step 7: Write `src/app.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 8: Write `src/app.css`** (global styles that lived in `app/pages/index.vue`'s unscoped `<style>`)

```css
@import "tailwindcss";

html { scroll-behavior: smooth; }
body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 9: Write `src/app.d.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
    }
    interface PageData {
      supabase: SupabaseClient
    }
    // interface Error {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
```

- [ ] **Step 10: Move static assets and pure modules**

```bash
mv public static
mkdir -p src/lib/multimodal src/lib/landing src/lib/seo src/lib/search src/lib/server
mv app/utils/multimodal.ts        src/lib/multimodal/types.ts
mv app/utils/multimodalMappers.ts src/lib/multimodal/mappers.ts
mv app/utils/landingFaq.ts        src/lib/landing/faq.ts
mv app/utils/structuredData.ts    src/lib/seo/structuredData.ts
mv server/utils/rateLimit.ts      src/lib/server/rateLimit.ts
mv server/utils/waitlistValidation.ts src/lib/server/waitlistValidation.ts
```

Then fix the two internal imports:
- `src/lib/multimodal/mappers.ts` line 2: `import type { Entry, Modal } from './multimodal'` → `from './types'`
- `src/lib/seo/structuredData.ts` line 1: `import type { FaqItem } from './landingFaq'` → `from '$lib/landing/faq'`

The moved files are otherwise byte-identical to their sources.

- [ ] **Step 11: Park the tests that depend on not-yet-ported code**

```bash
cd tests
for f in MultimodalSvsAccordion search-page un-page useMultimodalTool useSearch useSpecialProvisions useWaitlist waitlist-section tailwind-classes; do
  mv "$f.test.ts" "$f.test.ts.skip"
done
cd ..
```

- [ ] **Step 12: Update import paths in the five pure tests**

- `tests/multimodal-i18n.test.ts`: `from '~/utils/multimodal'` → `from '$lib/multimodal/types'`
- `tests/multimodalMappers.test.ts`: `from '~/utils/multimodalMappers'` → `from '$lib/multimodal/mappers'`
- `tests/structuredData.test.ts`: `from '~/utils/landingFaq'` → `from '$lib/landing/faq'`; `from '~/utils/structuredData'` → `from '$lib/seo/structuredData'`
- `tests/rateLimit.test.ts`: `from '../server/utils/rateLimit'` → `from '$lib/server/rateLimit'`
- `tests/waitlistValidation.test.ts`: `from '../server/utils/waitlistValidation'` → `from '$lib/server/waitlistValidation'`

No other lines change.

- [ ] **Step 13: Write the test setup file and a smoke component test**

`tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

`tests/fixtures/Counter.svelte`:

```svelte
<script lang="ts">
  let count = $state(0)
</script>

<button onclick={() => count++}>{count}</button>
```

`tests/smoke.test.ts`:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Counter from './fixtures/Counter.svelte'

describe('vitest + jsdom + svelte setup', () => {
  it('mounts a runes component and reacts to a click', async () => {
    render(Counter)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('0')
    await fireEvent.click(button)
    expect(button).toHaveTextContent('1')
  })
})
```

- [ ] **Step 14: Write `.env.example`** (committed template; real `.env` is edited in Task 2)

```
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server only, never exposed
```

- [ ] **Step 15: Install and sync**

Run: `pnpm install && pnpm exec svelte-kit sync`
Expected: install completes; `.svelte-kit/tsconfig.json` exists. If a pinned version is rejected, follow the Global Constraints rule on versions.

- [ ] **Step 16: Run the tests**

Run: `pnpm test`
Expected: 6 files pass (`multimodal-i18n`, `multimodalMappers`, `structuredData`, `rateLimit`, `waitlistValidation`, `smoke`). The smoke test proves jsdom + browser conditions are right. If `smoke` fails with `lifecycle_function_unavailable` or `mount(...) is not available on the server`, the `resolve.conditions` block in `vite.config.ts` is not taking effect; fix that before continuing.

- [ ] **Step 17: Checkpoint**

Report: test count, and that `app/` and `server/` still exist (they must, until Task 11).

---

### Task 2: Supabase wiring — hooks, layout clients, admin client, env rename

**Files:**
- Create: `src/hooks.server.ts`, `src/routes/+layout.server.ts`, `src/routes/+layout.ts`, `src/routes/+layout.svelte`, `src/lib/server/supabaseAdmin.ts`, `tests/supabaseAdmin.test.ts`
- Modify: `.env`, `.env.local`, `scripts/import-regulations.ts:22-26`

**Interfaces:**
- Produces: `event.locals.supabase: SupabaseClient` (server), layout `data.supabase: SupabaseClient` (both), `getSupabaseAdmin(): SupabaseClient` from `$lib/server/supabaseAdmin` (server only, lazily created once).

- [ ] **Step 1: Rename env vars in `.env` and `.env.local`**

```bash
for f in .env .env.local; do
  [ -f "$f" ] || continue
  sed -i \
    -e 's/^NUXT_PUBLIC_SUPABASE_URL=/PUBLIC_SUPABASE_URL=/' \
    -e 's/^NUXT_PUBLIC_SUPABASE_KEY=/PUBLIC_SUPABASE_PUBLISHABLE_KEY=/' \
    -e '/^NUXT_SUPABASE_SERVICE_ROLE_KEY=/d' \
    "$f"
done
grep -o '^[A-Z_]*=' .env
```

Expected output lists `PUBLIC_SUPABASE_URL=`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY=`, `SUPABASE_SERVICE_ROLE_KEY=` and no `NUXT_` keys.

- [ ] **Step 2: Update the import script**

In `scripts/import-regulations.ts` replace:

```ts
const SUPABASE_URL = process.env.NUXT_PUBLIC_SUPABASE_URL!
```
with
```ts
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!
```
and the error message `'Missing NUXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'` with `'Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'`.

- [ ] **Step 3: Write the failing test for the admin client**

`tests/supabaseAdmin.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn(() => ({ tag: 'admin-client' })) }))

vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('$env/static/public', () => ({ PUBLIC_SUPABASE_URL: 'https://test.supabase.co' }))
vi.mock('$env/dynamic/private', () => ({ env: { SUPABASE_SERVICE_ROLE_KEY: 'service-key' } }))

describe('getSupabaseAdmin', () => {
  beforeEach(() => {
    createClientMock.mockClear()
    vi.resetModules()
  })

  it('creates the service-role client once with persistSession disabled', async () => {
    const { getSupabaseAdmin } = await import('$lib/server/supabaseAdmin')
    const a = getSupabaseAdmin()
    const b = getSupabaseAdmin()
    expect(a).toBe(b)
    expect(createClientMock).toHaveBeenCalledTimes(1)
    expect(createClientMock).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'service-key',
      { auth: { persistSession: false } },
    )
  })

  it('throws a clear error when the service-role key is missing', async () => {
    vi.doMock('$env/dynamic/private', () => ({ env: {} }))
    const { getSupabaseAdmin } = await import('$lib/server/supabaseAdmin')
    expect(() => getSupabaseAdmin()).toThrow('SUPABASE_SERVICE_ROLE_KEY')
  })
})
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `pnpm test tests/supabaseAdmin.test.ts`
Expected: FAIL — cannot resolve `$lib/server/supabaseAdmin`.

- [ ] **Step 5: Write `src/lib/server/supabaseAdmin.ts`**

```ts
import { env } from '$env/dynamic/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

/**
 * Service-role client for server-only writes (waitlist insert). Created lazily
 * so a missing key fails at first use, not at boot, and read from
 * $env/dynamic/private so the secret is a runtime value, never baked into the build.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  client = createClient(PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } })
  return client
}
```

- [ ] **Step 6: Run the test**

Run: `pnpm test tests/supabaseAdmin.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Write `src/hooks.server.ts`**

```ts
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      // SvelteKit's cookie API requires `path`; '/' replicates standard behaviour.
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
        if (headers && Object.keys(headers).length > 0) {
          event.setHeaders(headers)
        }
      },
    },
  })

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}
```

If `pnpm check` reports that `setAll` takes a single parameter in the installed `@supabase/ssr`, drop the `headers` parameter and the `event.setHeaders` block.

- [ ] **Step 8: Write `src/routes/+layout.server.ts`**

```ts
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies }) => {
  return {
    cookies: cookies.getAll(),
  }
}
```

- [ ] **Step 9: Write `src/routes/+layout.ts`**

```ts
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: { fetch },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: { fetch },
        cookies: {
          getAll() {
            return data.cookies
          },
        },
      })

  return { supabase }
}
```

- [ ] **Step 10: Write `src/routes/+layout.svelte`** (font links come verbatim from `app/pages/index.vue`'s `useHead`)

```svelte
<script lang="ts">
  import '../app.css'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" />
</svelte:head>

{@render children()}
```

- [ ] **Step 11: Type-check and run the dev server once**

Run: `pnpm check`
Expected: 0 errors (warnings about unused `$types` are fine).

Run: `pnpm dev` in the background, then `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/`
Expected: `404` (no `+page.svelte` yet) — the point is that hooks and layout load without throwing. Stop the dev server.

- [ ] **Step 12: Checkpoint**

Run `pnpm test` (7 files green) and report.

---

### Task 3: `MultimodalToolState` class

**Files:**
- Create: `src/lib/multimodal/multimodalTool.svelte.ts`
- Create: `tests/multimodalTool.svelte.test.ts` (replaces `tests/useMultimodalTool.test.ts.skip`, which is deleted at the end of this task)

**Interfaces:**
- Consumes: `$lib/multimodal/types`, `fetchCompareForUn` from `$lib/multimodal/mappers`.
- Produces:

```ts
export interface MultimodalToolOptions {
  initialData?: Record<string, Entry[]>
  initialUnNumber?: string
  supabase?: SupabaseClient
}
export class MultimodalToolState {
  currentLang: Lang            // $state, default 'de'
  currentModal: Modal          // $state, default 'ADR' or first mode with rows in initialData
  currentUnNumber: string      // $state
  compareData: Record<string, Entry[]>  // $state
  isLoading: boolean           // $state
  readonly currentEntry: Entry | null   // $derived
  readonly searchDisplay: string        // $derived
  readonly hasData: boolean             // $derived
  readonly MODALS: readonly Modal[]
  L(key: string): string
  modalDesc(modal: Modal): string
  getEntry(modal: string): Entry | null
  getName(entry: Entry): string
  getNameSub(entry: Entry): string
  getSpez(entry: Entry): string
  bkClass(bk: string | number): string
  setLang(lang: Lang): void
  switchModal(modal: Modal): void
  loadCompare(unNumber: string): Promise<void>   // throws if no supabase client was given
}
```

- [ ] **Step 1: Write the failing test**

`tests/multimodalTool.svelte.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { MultimodalToolState } from '$lib/multimodal/multimodalTool.svelte'
import { DEMO_DATA } from '$lib/multimodal/types'

function stubSupabase(responses: Partial<Record<string, { data: unknown[] | null, error: unknown }>>) {
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve(responses[table] ?? { data: [], error: null }),
      }),
    }),
  }))
  return { client: { from } as unknown as SupabaseClient, from }
}

function demoTool(supabase?: SupabaseClient) {
  return new MultimodalToolState({ initialData: DEMO_DATA, initialUnNumber: '1203', supabase })
}

describe('MultimodalToolState', () => {
  it('starts empty by default', () => {
    const tool = new MultimodalToolState()
    expect(tool.currentUnNumber).toBe('')
    expect(tool.compareData).toEqual({})
    expect(tool.currentEntry).toBeNull()
    expect(tool.searchDisplay).toBe('')
    expect(tool.hasData).toBe(false)
  })

  it('preloads UN 1203 demo data when given initialData', () => {
    const tool = demoTool()
    expect(tool.currentUnNumber).toBe('1203')
    expect(tool.compareData).toEqual(DEMO_DATA)
    expect(tool.currentEntry?.name).toBe('BENZIN')
    expect(tool.searchDisplay).toBe('UN 1203 – BENZIN')
    expect(tool.hasData).toBe(true)
  })

  it('selects the first mode with rows when initialData has no ADR entry', () => {
    const tool = new MultimodalToolState({
      initialData: { ADR: [], RID: [], IMDG: DEMO_DATA.IMDG!, ICAO: [], ADN: [] },
      initialUnNumber: '1203',
    })
    expect(tool.currentModal).toBe('IMDG')
  })

  describe('L (labels)', () => {
    it('returns the label in the current language and falls back to the key', () => {
      const tool = new MultimodalToolState()
      expect(tool.L('class')).toBe('Klasse')
      tool.setLang('en')
      expect(tool.L('class')).toBe('Class')
      expect(tool.L('unknownKey')).toBe('unknownKey')
    })
  })

  describe('getName', () => {
    it('follows the language fallback chain', () => {
      const tool = demoTool()
      const entry = tool.currentEntry!
      expect(tool.getName(entry)).toBe('BENZIN')
      tool.setLang('en')
      expect(tool.getName(entry)).toBe('PETROL')
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('ESSENCE')
      tool.setLang('tr')
      expect(tool.getName(entry)).toBe('PETROL')
    })

    it('always uses the raw name for ICAO (English-only dataset)', () => {
      const tool = demoTool()
      tool.switchModal('ICAO')
      const entry = tool.currentEntry!
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('Gasoline')
    })
  })

  describe('getNameSub', () => {
    it('lists the other language names, excluding the current language', () => {
      const tool = demoTool()
      const entry = tool.currentEntry!
      expect(tool.getNameSub(entry)).toBe('PETROL · ESSENCE')
      tool.setLang('en')
      expect(tool.getNameSub(entry)).toBe('BENZIN · ESSENCE')
    })
  })

  describe('getSpez', () => {
    it('follows the language fallback chain for specifications', () => {
      const tool = demoTool()
      const entry = tool.currentEntry!
      expect(tool.getSpez(entry)).toBe('oder KRAFTSTOFF FÜR MOTOREN, BENZIN')
      tool.setLang('en')
      expect(tool.getSpez(entry)).toBe('or MOTOR SPIRIT or GASOLINE')
      tool.setLang('fr')
      tool.switchModal('IMDG')
      expect(tool.getSpez(tool.currentEntry!)).toBe('or PETROL or MOTOR SPIRIT')
    })
  })

  describe('switchModal', () => {
    it('switches only to modes that have data', () => {
      const tool = demoTool()
      tool.switchModal('RID')
      expect(tool.currentModal).toBe('RID')
    })

    it('ignores modes without data', () => {
      const tool = new MultimodalToolState()
      tool.switchModal('IMDG')
      expect(tool.currentModal).toBe('ADR')
    })
  })

  describe('bkClass', () => {
    it('returns the mapped class or a gray fallback', () => {
      const tool = new MultimodalToolState()
      expect(tool.bkClass('0')).toContain('bg-red-900')
      expect(tool.bkClass('99')).toContain('bg-gray-200')
    })
  })

  describe('loadCompare', () => {
    it('does nothing for a blank UN number', async () => {
      const { client, from } = stubSupabase({})
      const tool = new MultimodalToolState({ supabase: client })
      await tool.loadCompare('  ')
      expect(from).not.toHaveBeenCalled()
    })

    it('throws when no supabase client was provided', async () => {
      const tool = new MultimodalToolState()
      await expect(tool.loadCompare('1203')).rejects.toThrow('supabase')
    })

    it('loads data, selects the first available mode, and clears loading', async () => {
      const { client } = stubSupabase({
        imdg_entries: {
          data: [{ un_number: '1080', sequence_number: 1, name: 'SF6', hazard_class: '2.2' }],
          error: null,
        },
      })
      const tool = new MultimodalToolState({ supabase: client })
      await tool.loadCompare('1080')

      expect(tool.currentUnNumber).toBe('1080')
      expect(tool.currentModal).toBe('IMDG')
      expect(tool.currentEntry?.name).toBe('SF6')
      expect(tool.isLoading).toBe(false)
      expect(tool.compareData.ADR).toEqual([])
    })

    it('clears the loading flag even when the fetch fails', async () => {
      const { client } = stubSupabase({ adr_entries: { data: null, error: new Error('boom') } })
      const tool = new MultimodalToolState({ supabase: client })
      await expect(tool.loadCompare('1203')).rejects.toThrow('boom')
      expect(tool.isLoading).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/multimodalTool.svelte.test.ts`
Expected: FAIL — cannot resolve `$lib/multimodal/multimodalTool.svelte`.

- [ ] **Step 3: Write `src/lib/multimodal/multimodalTool.svelte.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchCompareForUn } from './mappers'
import {
  BK_CLASSES,
  type Entry,
  type Lang,
  LABELS,
  type Modal,
  MODAL_DESC_I18N,
  MODALS,
} from './types'

export interface MultimodalToolOptions {
  /** Pre-loaded comparison data (demo data, or server-loaded data on the UN page) */
  initialData?: Record<string, Entry[]>
  /** UN number the initial data belongs to */
  initialUnNumber?: string
  /** Needed only if `loadCompare` will be called client-side */
  supabase?: SupabaseClient
}

function firstModeWithRows(data: Record<string, Entry[]>): Modal {
  return MODALS.find(m => data[m]?.length) ?? 'ADR'
}

export class MultimodalToolState {
  // ── State ──────────────────────────────────────────────────
  currentLang = $state<Lang>('de')
  currentModal = $state<Modal>('ADR')
  currentUnNumber = $state('')
  compareData = $state<Record<string, Entry[]>>({})
  isLoading = $state(false)

  readonly MODALS = MODALS
  readonly #supabase: SupabaseClient | undefined

  constructor(options: MultimodalToolOptions = {}) {
    this.#supabase = options.supabase
    if (options.initialData) {
      this.compareData = options.initialData
      this.currentModal = firstModeWithRows(options.initialData)
    }
    if (options.initialUnNumber) this.currentUnNumber = options.initialUnNumber
  }

  // ── Derived ────────────────────────────────────────────────
  readonly currentEntry: Entry | null = $derived.by(() => this.getEntry(this.currentModal))

  readonly hasData: boolean = $derived(
    Object.values(this.compareData).some(arr => arr && arr.length > 0),
  )

  readonly searchDisplay: string = $derived.by(() => {
    if (!this.currentUnNumber) return ''
    const entry = this.getEntry('ADR') ?? this.getEntry('RID') ?? this.getEntry('IMDG') ?? this.getEntry('ICAO') ?? this.getEntry('ADN')
    if (!entry) return `UN ${this.currentUnNumber}`
    return `UN ${this.currentUnNumber} – ${this.getName(entry)}`
  })

  // ── Helpers ────────────────────────────────────────────────
  L(key: string): string {
    return LABELS[this.currentLang]?.[key] ?? LABELS.de[key] ?? key
  }

  modalDesc(modal: Modal): string {
    return MODAL_DESC_I18N[this.currentLang]?.[modal] ?? modal
  }

  getEntry(modal: string): Entry | null {
    return this.compareData[modal]?.[0] ?? null
  }

  getName(entry: Entry): string {
    if (this.currentModal === 'ICAO') return entry.name ?? ''
    if (this.currentLang === 'en') return entry.nameEn ?? entry.name ?? ''
    if (this.currentLang === 'fr') return entry.nameFr ?? entry.nameEn ?? entry.name ?? ''
    if (this.currentLang === 'tr') return entry.nameEn ?? entry.name ?? ''
    return entry.name ?? entry.nameEn ?? ''
  }

  getNameSub(entry: Entry): string {
    if (this.currentModal === 'ICAO') return ''
    const all: Record<string, string | undefined> = { de: entry.name, en: entry.nameEn, fr: entry.nameFr }
    return Object.entries(all)
      .filter(([l, v]) => l !== this.currentLang && v)
      .map(([, v]) => v)
      .join(' · ')
  }

  getSpez(entry: Entry): string {
    if (this.currentLang === 'en') return entry.specificationEn ?? entry.specification ?? ''
    if (this.currentLang === 'fr') return entry.specificationFr ?? entry.specificationEn ?? entry.specification ?? ''
    if (this.currentLang === 'tr') return entry.specificationEn ?? entry.specification ?? ''
    return entry.specification ?? ''
  }

  bkClass(bk: string | number): string {
    return BK_CLASSES[String(bk)] ?? 'bg-gray-200 text-gray-600'
  }

  // ── Actions ────────────────────────────────────────────────
  setLang(lang: Lang): void {
    this.currentLang = lang
  }

  switchModal(modal: Modal): void {
    if (this.compareData[modal]) this.currentModal = modal
  }

  async loadCompare(unNumber: string): Promise<void> {
    const cleaned = unNumber.trim()
    if (!cleaned) return
    if (!this.#supabase) throw new Error('MultimodalToolState: no supabase client provided')

    this.isLoading = true
    try {
      const data = await fetchCompareForUn(this.#supabase, cleaned)
      this.compareData = data
      this.currentUnNumber = cleaned
      this.currentModal = firstModeWithRows(data)
    }
    finally {
      this.isLoading = false
    }
  }
}
```

Note the class uses `$state`/`$derived` in class fields, which is why the file ends in `.svelte.ts`. `switchModal` keeps the original semantics: it checks that a key exists in `compareData` (an empty array counts as "present"), exactly like the Vue composable.

- [ ] **Step 4: Run the test**

Run: `pnpm test tests/multimodalTool.svelte.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 5: Autofix check**

Run the Svelte autofixer on `src/lib/multimodal/multimodalTool.svelte.ts`. Resolve every reported issue, re-run tests.

- [ ] **Step 6: Delete the parked Vue test and checkpoint**

```bash
rm tests/useMultimodalTool.test.ts.skip
pnpm test
```

Expected: all green (8 files).

---

### Task 4: Special provisions cache module

**Files:**
- Create: `src/lib/multimodal/specialProvisions.svelte.ts`
- Create: `tests/specialProvisions.svelte.test.ts` (replaces `tests/useSpecialProvisions.test.ts.skip`, deleted at the end)

**Interfaces:**
- Produces:

```ts
export interface SpecialProvisionText { textDe: string | null; textEn: string | null; textFr: string | null }
export function getSpecialProvision(mode: string, code: string): SpecialProvisionText | null | undefined
//   undefined = not fetched yet, null = fetched, no row
export function loadSpecialProvision(supabase: SupabaseClient, mode: string, code: string): Promise<SpecialProvisionText | null>
export function clearSpecialProvisionsCache(): void   // tests only
```

- [ ] **Step 1: Write the failing test**

`tests/specialProvisions.svelte.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSpecialProvisionsCache,
  getSpecialProvision,
  loadSpecialProvision,
} from '$lib/multimodal/specialProvisions.svelte'

function createSupabaseMock(rows: Record<string, unknown | null>) {
  let mode = ''
  let code = ''
  const builder = {
    select: () => builder,
    eq: (column: string, value: string) => {
      if (column === 'mode') mode = value
      if (column === 'code') code = value
      return builder
    },
    maybeSingle: vi.fn(() =>
      Promise.resolve({ data: rows[`${mode}:${code}`] ?? null, error: null }),
    ),
  }
  const from = vi.fn(() => builder)
  return { client: { from } as unknown as SupabaseClient, from, maybeSingle: builder.maybeSingle }
}

describe('specialProvisions', () => {
  beforeEach(() => {
    clearSpecialProvisionsCache()
  })

  it('loads a provision and exposes all language variants', async () => {
    const mock = createSupabaseMock({
      'ADR:640': { text_de: 'Deutscher Text', text_en: 'English text', text_fr: null },
    })
    expect(getSpecialProvision('ADR', '640')).toBeUndefined()

    const result = await loadSpecialProvision(mock.client, 'ADR', '640')
    expect(result).toEqual({ textDe: 'Deutscher Text', textEn: 'English text', textFr: null })
    expect(getSpecialProvision('ADR', '640')).toEqual(result)
  })

  it('returns null for a code without a row (e.g. mode not imported)', async () => {
    const mock = createSupabaseMock({})
    expect(await loadSpecialProvision(mock.client, 'ICAO', 'A1')).toBeNull()
    expect(getSpecialProvision('ICAO', 'A1')).toBeNull()
  })

  it('caches per mode+code — second load does not hit the network', async () => {
    const mock = createSupabaseMock({ 'ADR:640': { text_de: 'x', text_en: null, text_fr: null } })
    await loadSpecialProvision(mock.client, 'ADR', '640')
    await loadSpecialProvision(mock.client, 'ADR', '640')
    expect(mock.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent loads for the same key', async () => {
    const mock = createSupabaseMock({ 'ADR:640': { text_de: 'x', text_en: null, text_fr: null } })
    await Promise.all([
      loadSpecialProvision(mock.client, 'ADR', '640'),
      loadSpecialProvision(mock.client, 'ADR', '640'),
    ])
    expect(mock.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('handles missing text_en/text_fr columns (pre-migration rows)', async () => {
    const mock = createSupabaseMock({ 'RID:617': { text_de: 'Nur Deutsch' } })
    expect(await loadSpecialProvision(mock.client, 'RID', '617')).toEqual({ textDe: 'Nur Deutsch', textEn: null, textFr: null })
  })

  it('does not cache errors, so the next load retries', async () => {
    const failing = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('down') }) }),
          }),
        }),
      }),
    } as unknown as SupabaseClient
    expect(await loadSpecialProvision(failing, 'ADR', '163')).toBeNull()
    expect(getSpecialProvision('ADR', '163')).toBeUndefined()

    const mock = createSupabaseMock({ 'ADR:163': { text_de: 'ok' } })
    expect(await loadSpecialProvision(mock.client, 'ADR', '163')).toEqual({ textDe: 'ok', textEn: null, textFr: null })
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/specialProvisions.svelte.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/lib/multimodal/specialProvisions.svelte.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SpecialProvisionText {
  textDe: string | null
  textEn: string | null
  textFr: string | null
}

/** Module-level cache shared by all accordion instances; key = `${mode}:${code}` */
const cache = $state<Record<string, SpecialProvisionText | null>>({})
const pending = new Map<string, Promise<SpecialProvisionText | null>>()

function cacheKey(mode: string, code: string): string {
  return `${mode}:${code}`
}

/** Test-only: reset module state between test cases */
export function clearSpecialProvisionsCache(): void {
  for (const k of Object.keys(cache)) delete cache[k]
  pending.clear()
}

/** Synchronous cache read; `undefined` = not fetched yet, `null` = fetched, no row */
export function getSpecialProvision(mode: string, code: string): SpecialProvisionText | null | undefined {
  return cache[cacheKey(mode, code)]
}

export async function loadSpecialProvision(
  supabase: SupabaseClient,
  mode: string,
  code: string,
): Promise<SpecialProvisionText | null> {
  const key = cacheKey(mode, code)
  if (key in cache) return cache[key] ?? null

  const inFlight = pending.get(key)
  if (inFlight) return inFlight

  const request = (async () => {
    try {
      // select * so this works before and after the text_en/text_fr migration
      const { data, error } = await supabase
        .from('special_provisions')
        .select('*')
        .eq('mode', mode)
        .eq('code', code)
        .maybeSingle()

      if (error) throw error

      const row = data as Record<string, unknown> | null
      const result: SpecialProvisionText | null = row
        ? {
            textDe: (row.text_de as string | null) ?? null,
            textEn: (row.text_en as string | null) ?? null,
            textFr: (row.text_fr as string | null) ?? null,
          }
        : null
      cache[key] = result
      return result
    }
    catch {
      // don't cache errors — allow retry on next toggle
      return null
    }
    finally {
      pending.delete(key)
    }
  })()

  pending.set(key, request)
  return request
}
```

The cache is a module-level `$state` object. Components that read `getSpecialProvision(...)` in their template re-render when a key is written. Module-level state is safe here because it holds public regulatory text, not per-user data, and it only ever grows on the client (the accordion loads lazily on click).

- [ ] **Step 4: Run the test**

Run: `pnpm test tests/specialProvisions.svelte.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Autofix check, delete parked test, checkpoint**

Run the Svelte autofixer on the new file and resolve issues. Then:

```bash
rm tests/useSpecialProvisions.test.ts.skip
pnpm test
```

Expected: all green (9 files).

---

### Task 5: `MultimodalSvsAccordion.svelte`

**Files:**
- Create: `src/lib/multimodal/MultimodalSvsAccordion.svelte`
- Create: `tests/MultimodalSvsAccordion.test.ts` (replaces the `.skip` file, deleted at the end)
- Source to read: `app/components/multimodal/MultimodalSvsAccordion.vue`

**Interfaces:**
- Consumes: `getSpecialProvision`, `loadSpecialProvision` (Task 4), `DEMO_SVS`, `Lang`, `Modal` (Task 1).
- Produces component props:

```ts
interface Props {
  svs: string          // comma-separated SV codes, e.g. '163, 243, 640D'
  label: string
  noText: string
  clickLoad: string
  demo?: boolean       // read DEMO_SVS instead of Supabase
  mode?: Modal         // default 'ADR'
  lang?: Lang          // default 'de'
  supabase?: SupabaseClient  // required for live lookup (demo = false)
}
```

- [ ] **Step 1: Write the failing test**

`tests/MultimodalSvsAccordion.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MultimodalSvsAccordion from '$lib/multimodal/MultimodalSvsAccordion.svelte'
import { clearSpecialProvisionsCache } from '$lib/multimodal/specialProvisions.svelte'
import { DEMO_SVS } from '$lib/multimodal/types'

const BASE_PROPS = {
  label: 'Sondervorschriften',
  noText: 'Kein Text verfügbar',
  clickLoad: 'Klicken zum Öffnen…',
}

function stubSupabase(rows: Record<string, Record<string, unknown> | null>) {
  let mode = ''
  let code = ''
  const counter = { calls: 0 }
  const builder = {
    select: () => builder,
    eq: (column: string, value: string) => {
      if (column === 'mode') mode = value
      if (column === 'code') code = value
      return builder
    },
    maybeSingle: () => {
      counter.calls++
      return Promise.resolve({ data: rows[`${mode}:${code}`] ?? null, error: null })
    },
  }
  const from = vi.fn(() => builder)
  return { client: { from } as unknown as SupabaseClient, from, counter }
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  clearSpecialProvisionsCache()
})

describe('MultimodalSvsAccordion', () => {
  it('renders nothing when svs is empty', () => {
    const { client } = stubSupabase({})
    render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '', supabase: client } })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders one row per comma-separated code', () => {
    const { client } = stubSupabase({})
    render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163, 243, 640D', mode: 'ADR', supabase: client } })
    const rows = screen.getAllByRole('button')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('SV 163')
    expect(rows[2]).toHaveTextContent('SV 640D')
  })

  it('shows the click-to-open hint before a row is expanded', () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', supabase: client } })
    expect(container).toHaveTextContent(BASE_PROPS.clickLoad)
  })

  it('demo mode shows DEMO_SVS text without any network call', async () => {
    const { client, from } = stubSupabase({})
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', demo: true, supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    expect(container).toHaveTextContent(DEMO_SVS['163']!)
    expect(from).not.toHaveBeenCalled()
  })

  it('expanding a row loads and shows the German text', async () => {
    const { client } = stubSupabase({ 'ADR:163': { text_de: 'Deutscher SV-Text', text_en: 'English SV text' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('Deutscher SV-Text')
  })

  it('prefers English text when lang is "en"', async () => {
    const { client } = stubSupabase({ 'ICAO:A1': { text_de: null, text_en: 'English only' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: 'A1', mode: 'ICAO', lang: 'en', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('English only')
  })

  it('Turkish prefers English text over German (no Turkish data in BAM dataset)', async () => {
    const { client } = stubSupabase({ 'ADR:163': { text_de: 'Deutsch', text_en: 'English' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', lang: 'tr', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('English')
    expect(container).not.toHaveTextContent('Deutsch')
  })

  it('switching the language re-renders the already-loaded text without refetching', async () => {
    const { client, counter } = stubSupabase({ 'ADR:163': { text_de: 'Deutsch', text_en: 'English' } })
    const props = { ...BASE_PROPS, svs: '163', mode: 'ADR' as const, lang: 'de' as const, supabase: client }
    const { container, rerender } = render(MultimodalSvsAccordion, { props })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('Deutsch')

    await rerender({ ...props, lang: 'en' })
    expect(container).toHaveTextContent('English')
    expect(counter.calls).toBe(1)
  })

  it('reloads texts for open rows when the transport mode changes (no stuck "…")', async () => {
    const { client } = stubSupabase({
      'ADR:163': { text_de: 'ADR-Text' },
      'RID:163': { text_de: 'RID-Text' },
    })
    const props = { ...BASE_PROPS, svs: '163', mode: 'ADR' as const, supabase: client }
    const { container, rerender } = render(MultimodalSvsAccordion, { props })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('ADR-Text')

    await rerender({ ...props, mode: 'RID' })
    await flush()
    expect(container).toHaveTextContent('RID-Text')
    expect(container).not.toHaveTextContent('…')
  })

  it('falls back to another language when the preferred one is missing', async () => {
    const { client } = stubSupabase({ 'ICAO:A1': { text_de: null, text_en: 'English fallback' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: 'A1', mode: 'ICAO', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('English fallback')
  })

  it('shows the no-text fallback when no row exists for the code', async () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '999', mode: 'ADN', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent(BASE_PROPS.noText)
  })

  it('collapses an expanded row on second click, keeping a preview snippet', async () => {
    const { client } = stubSupabase({ 'ADR:163': { text_de: 'Voller SV-Text' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', supabase: client } })
    const button = screen.getByRole('button')
    const panel = () => container.querySelector('.whitespace-pre-wrap')

    await fireEvent.click(button)
    await flush()
    expect(panel()).not.toBeNull()

    await fireEvent.click(button)
    expect(panel()).toBeNull()
    expect(container).toHaveTextContent('Voller SV-Text')
    expect(container).not.toHaveTextContent(BASE_PROPS.clickLoad)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/MultimodalSvsAccordion.test.ts`
Expected: FAIL — component not found.

- [ ] **Step 3: Write `src/lib/multimodal/MultimodalSvsAccordion.svelte`**

```svelte
<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js'
  import { getSpecialProvision, loadSpecialProvision } from './specialProvisions.svelte'
  import { DEMO_SVS, type Lang, type Modal } from './types'

  interface Props {
    svs: string
    label: string
    noText: string
    clickLoad: string
    /** When true, uses hardcoded DEMO_SVS instead of Supabase */
    demo?: boolean
    /** Transport mode the SV codes belong to — required for live lookup */
    mode?: Modal
    lang?: Lang
    supabase?: SupabaseClient
  }

  let { svs, label, noText, clickLoad, demo = false, mode = 'ADR', lang = 'de', supabase }: Props = $props()

  let open = $state<Record<string, boolean>>({})

  const nrs = $derived(svs.split(',').map(s => s.trim()).filter(Boolean))

  function text(nr: string): string {
    if (demo) return DEMO_SVS[nr] ?? noText
    const sv = getSpecialProvision(mode, nr)
    if (sv === undefined) return '…'
    if (sv === null) return noText
    // language preference mirrors getName(): tr users read English before German
    if (lang === 'en' || lang === 'tr') return sv.textEn ?? sv.textDe ?? sv.textFr ?? noText
    if (lang === 'fr') return sv.textFr ?? sv.textEn ?? sv.textDe ?? noText
    return sv.textDe ?? sv.textEn ?? sv.textFr ?? noText
  }

  function preview(nr: string): string {
    if (open[nr]) return ''
    const t = text(nr)
    if (!t || t === noText || t === '…') return clickLoad
    return t.length > 80 ? t.substring(0, 80) + '…' : t
  }

  function toggle(nr: string) {
    open[nr] = !open[nr]
    if (open[nr] && !demo && supabase) loadSpecialProvision(supabase, mode, nr)
  }

  // rows stay open across mode/UN switches — fetch their texts for the new context,
  // otherwise they would be stuck on the "…" loading placeholder
  $effect(() => {
    if (demo || !supabase) return
    for (const nr of nrs) {
      if (open[nr]) loadSpecialProvision(supabase, mode, nr)
    }
  })
</script>

{#if nrs.length}
  <div class="mt-5">
    <div class="font-mono text-[10px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2 pb-1.5 border-b border-[#c8d6e5]">
      {label} ({svs})
    </div>
    <div class="flex flex-col gap-1.5">
      {#each nrs as nr (nr)}
        <div class="border border-[#c8d6e5] bg-[#f4f7fa]">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#dce8f2] transition-colors cursor-pointer select-none"
            onclick={() => toggle(nr)}
          >
            <span class="font-mono text-xs font-bold text-orange-500 min-w-[44px]">SV {nr}</span>
            <span class="flex-1 text-[11px] text-[#5a7a99] truncate">{preview(nr)}</span>
            <span
              class={['font-mono text-[11px] text-[#5a7a99] flex-shrink-0 transition-transform duration-200', { 'rotate-180': open[nr] }]}
            >▼</span>
          </button>
          {#if open[nr]}
            <div class="px-3.5 py-3 border-t border-[#c8d6e5] text-[13px] leading-relaxed text-[#2d5070] whitespace-pre-wrap">{text(nr)}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
```

Behavioral note: the `$effect` re-runs whenever `mode`, `nrs`, or any `open[nr]` changes. Opening a row therefore triggers both `toggle`'s load and the effect's load; the pending-map in `specialProvisions.svelte.ts` dedupes them to one network call (the "switching the language … without refetching" test asserts exactly one call).

- [ ] **Step 4: Run the test**

Run: `pnpm test tests/MultimodalSvsAccordion.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Autofix check, delete parked test, checkpoint**

Run the Svelte autofixer on the component; resolve issues. Then:

```bash
rm tests/MultimodalSvsAccordion.test.ts.skip
pnpm test
```

Expected: all green (10 files).

---

### Task 6: `MultimodalTool.svelte`

**Files:**
- Create: `src/lib/multimodal/MultimodalTool.svelte`
- Create: `tests/MultimodalTool.test.ts`
- Source to read: `app/components/multimodal/MultimodalTool.vue` (334 lines — the template is transliterated in full below)

**Interfaces:**
- Consumes: `MultimodalToolState` (Task 3), `MultimodalSvsAccordion` (Task 5), `DEMO_DATA`, `LANGS`, `Entry` (Task 1).
- Produces component props:

```ts
interface Props {
  demo?: boolean                        // hardcoded UN 1203 data, read-only search box
  unNumber?: string                     // UN number to show; loads client-side if no initialData
  initialData?: Record<string, Entry[]> // server-loaded data for unNumber
  supabase?: SupabaseClient             // needed for client-side loads and SV texts
}
```

- [ ] **Step 1: Write the failing test**

`tests/MultimodalTool.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
import { DEMO_DATA } from '$lib/multimodal/types'

function stubSupabase(responses: Partial<Record<string, { data: unknown[] | null, error: unknown }>>) {
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve(responses[table] ?? { data: [], error: null }),
      }),
    }),
  }))
  return { client: { from } as unknown as SupabaseClient, from }
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('MultimodalTool', () => {
  it('renders the demo data for UN 1203 with a DEMO badge and read-only search box', () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    expect(container).toHaveTextContent('DEMO')
    expect(container).toHaveTextContent('UN 1203 · Verfügbarkeit in allen Modi')
    expect(container).toHaveTextContent('BENZIN')
    const input = container.querySelector('input')!
    expect(input).toHaveValue('UN 1203 – BENZIN')
    expect(input).toHaveAttribute('readonly')
  })

  it('switches labels when a language button is clicked', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container).toHaveTextContent('Availability in all modes')
    expect(container).toHaveTextContent('PETROL')
  })

  it('switches the detail panel when a mode tab is clicked', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    expect(container).toHaveTextContent('EmS')
    expect(container).toHaveTextContent('F-E / S-E')
  })

  it('renders server-provided initialData without calling supabase', () => {
    const { client, from } = stubSupabase({})
    const { container } = render(MultimodalTool, {
      props: { unNumber: '1203', initialData: DEMO_DATA, supabase: client },
    })
    expect(container).toHaveTextContent('BENZIN')
    expect(container).not.toHaveTextContent('DEMO')
    expect(from).not.toHaveBeenCalled()
  })

  it('loads data client-side when only a unNumber is given', async () => {
    const { client, from } = stubSupabase({
      imdg_entries: { data: [{ un_number: '1080', sequence_number: 1, name: 'SF6', hazard_class: '2.2' }], error: null },
    })
    const { container } = render(MultimodalTool, { props: { unNumber: '1080', supabase: client } })
    await flush()
    expect(from).toHaveBeenCalled()
    expect(container).toHaveTextContent('SF6')
  })

  it('shows the initial empty state when there is no data', () => {
    const { container } = render(MultimodalTool, { props: {} })
    expect(container).toHaveTextContent('UN-Nummer oder Stoffname…')
    expect(container).not.toHaveTextContent('Verfügbarkeit in allen Modi')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/MultimodalTool.test.ts`
Expected: FAIL — component not found.

- [ ] **Step 3: Write `src/lib/multimodal/MultimodalTool.svelte`**

```svelte
<script lang="ts">
  import type { SupabaseClient } from '@supabase/supabase-js'
  import MultimodalSvsAccordion from './MultimodalSvsAccordion.svelte'
  import { MultimodalToolState } from './multimodalTool.svelte'
  import { DEMO_DATA, type Entry, LANGS } from './types'

  interface Props {
    /** Use hardcoded UN 1203 demo data (no API needed) */
    demo?: boolean
    /** UN number to show; loaded client-side if `initialData` is absent */
    unNumber?: string
    /** Server-loaded comparison data for `unNumber` */
    initialData?: Record<string, Entry[]>
    supabase?: SupabaseClient
  }

  let { demo = false, unNumber, initialData, supabase }: Props = $props()

  const tool = new MultimodalToolState({
    initialData: demo ? DEMO_DATA : initialData,
    initialUnNumber: demo ? '1203' : (initialData ? unNumber : undefined),
    supabase,
  })

  let showDemoNotice = $state(false)

  // client-side load when the prop changes and nothing was preloaded for it
  $effect(() => {
    if (demo || !unNumber) return
    if (unNumber !== tool.currentUnNumber) tool.loadCompare(unNumber)
  })
</script>

<div class="bg-[#e8eef5] font-sans">
  <div class="max-w-5xl mx-auto">

    <!-- Info banner -->
    <div class="flex items-start gap-3 px-4 py-3 mb-4 text-sm border border-l-4 bg-[#f4f7fa] border-[#c8d6e5] border-l-orange-500">
      <span class="text-xl flex-shrink-0 mt-0.5">🌐</span>
      <span class="text-[#2d5070] leading-relaxed">
        <strong>{tool.L('bannerTitle')}</strong>{tool.L('bannerSub')}
      </span>
      {#if demo}
        <span class="ml-auto flex-shrink-0 font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 bg-orange-500 text-black self-center">
          DEMO
        </span>
      {/if}
    </div>

    <!-- Search bar -->
    <div class="flex flex-wrap items-center gap-2.5 px-4 py-3.5 mb-4 bg-[#f4f7fa] border border-[#c8d6e5] border-t-[3px] border-t-orange-500">
      <div class="relative flex-1 min-w-[200px]">
        <input
          value={tool.searchDisplay}
          placeholder={tool.L('searchPlaceholder')}
          readonly={demo}
          class={['w-full px-3.5 py-2.5 font-mono text-sm border-[1.5px] border-[#b0c4d8] bg-[#dce8f2] text-[#0f2744] outline-none focus:border-orange-500 transition-colors', demo ? 'cursor-default' : 'cursor-text']}
          autocomplete="off"
          onfocus={() => { if (demo) showDemoNotice = true }}
          onblur={() => { showDemoNotice = false }}
        />
        {#if showDemoNotice}
          <div class="absolute top-full left-0 right-0 mt-1 px-3 py-2 text-xs bg-[#f4f7fa] border-[1.5px] border-orange-500 text-[#2d5070] z-10 shadow-md">
            🔍 {tool.L('demoNotice')}
          </div>
        {/if}
      </div>

      <!-- Language toggle -->
      <div class="flex overflow-hidden border-[1.5px] border-[#b0c4d8]">
        {#each LANGS as lang (lang)}
          <button
            type="button"
            class={['px-3.5 py-2 font-mono text-[11px] font-bold tracking-[0.5px] transition-colors', tool.currentLang === lang
              ? 'bg-orange-500 text-black'
              : 'bg-[#dce8f2] text-[#5a7a99] hover:bg-[#d4e2ef]']}
            onclick={() => tool.setLang(lang)}
          >{lang.toUpperCase()}</button>
        {/each}
      </div>
    </div>

    <!-- Results -->
    {#if tool.hasData}

      <!-- Compare overview -->
      <div class="px-4 py-3.5 mb-0.5 bg-[#f4f7fa] border border-[#b0c4d8] border-t-[3px] border-t-orange-500">
        <div class="font-mono text-[9px] font-bold tracking-[1.5px] uppercase text-[#5a7a99] mb-2.5">
          UN {tool.currentUnNumber} · {tool.L('availability')}
        </div>
        <div class="grid grid-cols-5 gap-2 max-sm:grid-cols-3">
          {#each tool.MODALS as modal (modal)}
            {@const entry = tool.getEntry(modal)}
            <div
              class={['p-2.5 border bg-[#f4f7fa] transition-all', entry
                ? ['cursor-pointer', 'hover:border-orange-400',
                   modal === tool.currentModal
                     ? 'border-orange-500 border-t-[3px]'
                     : 'border-[#c8d6e5]']
                : ['border-[#c8d6e5]', 'opacity-40']]}
              role="button"
              tabindex={entry ? 0 : -1}
              onclick={() => { if (entry) tool.switchModal(modal) }}
              onkeydown={(e) => { if (entry && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tool.switchModal(modal) } }}
            >
              <div class="font-mono text-[10px] font-bold tracking-[1px] uppercase text-[#5a7a99] mb-1">{modal}</div>
              {#if entry}
                <div class="font-mono text-base font-bold text-[#0f2744]">{entry.hazardClass}</div>
                {#if entry.packingGroup}
                  <div class="font-mono text-[11px] text-[#5a7a99] mt-0.5">
                    VP-Gr. {entry.packingGroup}
                  </div>
                {/if}
                {#if entry.kemlerNumber}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    Kemler: {entry.kemlerNumber}
                  </div>
                {:else if entry.ems1}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    EmS: {entry.ems1}
                  </div>
                {:else if entry.packingInstrCargo}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    PI: {entry.packingInstrCargo}
                  </div>
                {:else if entry.cones != null}
                  <div class="font-mono text-[11px] text-orange-500 mt-0.5">
                    {tool.L('cones')}: {entry.cones}
                  </div>
                {/if}
              {:else}
                <div class="text-xs italic text-[#b0c4d8]">–</div>
              {/if}
              <div class="text-[10px] text-[#5a7a99] mt-1 leading-tight">{tool.modalDesc(modal)}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Modal tabs -->
      <div class="flex overflow-x-auto border-b-2 border-[#b0c4d8]" role="tablist">
        {#each tool.MODALS as modal (modal)}
          {@const entry = tool.getEntry(modal)}
          <button
            type="button"
            class={['flex items-center gap-1.5 px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.5px] whitespace-nowrap mr-0.5 relative top-px border border-b-0 transition-all', modal === tool.currentModal
              ? 'bg-[#f4f7fa] text-[#0f2744] border-[#b0c4d8] border-b-2 border-b-[#f4f7fa]'
              : entry
                ? 'bg-[#dce8f2] text-[#0f2744] border-[#b0c4d8] hover:bg-[#d4e2ef] cursor-pointer'
                : 'bg-[#dce8f2] text-[#5a7a99] border-[#b0c4d8] opacity-40 cursor-default']}
            role="tab"
            aria-selected={modal === tool.currentModal}
            disabled={!entry}
            onclick={() => { if (entry) tool.switchModal(modal) }}
          >
            <span class={['w-1.5 h-1.5 rounded-full', entry ? 'bg-orange-500' : 'bg-[#b0c4d8]']}></span>
            {modal}
          </button>
        {/each}
      </div>

      <!-- Detail panel -->
      <div class="bg-[#f4f7fa] border border-[#b0c4d8] border-t-0 p-5" role="tabpanel">
        {#if tool.currentEntry}
          {@const currentEntry = tool.currentEntry}

          <!-- UN header -->
          <div class="flex flex-wrap items-start gap-3.5 pb-4 mb-4 border-b border-[#c8d6e5]">
            <div class="font-mono text-3xl font-bold text-orange-500 leading-none flex-shrink-0">
              UN {currentEntry.unNumber}
            </div>
            <div>
              <div class="text-base font-semibold text-[#0f2744]">{tool.getName(currentEntry)}</div>
              {#if tool.getNameSub(currentEntry)}
                <div class="text-sm text-[#5a7a99] mt-0.5">
                  {tool.getNameSub(currentEntry)}
                </div>
              {/if}
              {#if tool.getSpez(currentEntry)}
                <div class="text-sm italic text-[#2d5070] mt-0.5">
                  {tool.getSpez(currentEntry)}
                </div>
              {/if}
            </div>
          </div>

          <!-- Fields table -->
          <table class="w-full text-sm border-collapse">
            <tbody>
              {#if currentEntry.hazardClass}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('class')}</td>
                  <td class="field-value">
                    <span class="badge bg-[#0f2744] text-white">{currentEntry.hazardClass}</span>
                  </td>
                </tr>
              {/if}
              {#if currentEntry.classificationCode}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('classCode')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.classificationCode}</span></td>
                </tr>
              {/if}
              {#if currentEntry.packingGroup}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('packingGroup')}</td>
                  <td class="field-value">
                    <span class="badge bg-[#1e3a5f] text-blue-200">VP-Gr. {currentEntry.packingGroup}</span>
                  </td>
                </tr>
              {/if}
              {#if currentEntry.hazardLabels}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('labels')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.hazardLabels}</span></td>
                </tr>
              {/if}
              {#if currentEntry.exceptedQty}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('exceptedQty')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.exceptedQty}</span></td>
                </tr>
              {/if}
              {#if currentEntry.limitedQty}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('limitedQty')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.limitedQty}</span></td>
                </tr>
              {/if}
              {#if currentEntry.packingInstructions}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('packingInstr')}</td>
                  <td class="field-value">
                    {#each currentEntry.packingInstructions.split(',') as p (p)}
                      <span class="badge bg-[#1e3a5f] text-blue-200 mr-0.5">{p.trim()}</span>
                    {/each}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.transportCategory != null && currentEntry.transportCategory !== ''}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('transportCat')}</td>
                  <td class="field-value">
                    <span class={['badge', tool.bkClass(currentEntry.transportCategory)]}>BK {currentEntry.transportCategory}</span>
                    {#if currentEntry.multiplier}
                      <span class="font-mono text-xs text-[#5a7a99] ml-1.5">
                        × {currentEntry.multiplier}
                      </span>
                    {/if}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.kemlerNumber}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('kemler')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.kemlerNumber}</span></td>
                </tr>
              {/if}
              {#if currentEntry.tunnelCode}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('tunnelCode')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.tunnelCode}</span></td>
                </tr>
              {/if}
              {#if currentEntry.ems1}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('ems')}</td>
                  <td class="field-value">
                    <span class="mono-val">{currentEntry.ems1}{currentEntry.ems2 ? ' / ' + currentEntry.ems2 : ''}</span>
                  </td>
                </tr>
              {/if}
              {#if currentEntry.stowageCategory}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('stowageCat')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.stowageCategory}</span></td>
                </tr>
              {/if}
              {#if currentEntry.stowage}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('stowage')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.stowage}</span></td>
                </tr>
              {/if}
              {#if currentEntry.segregation}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('segregation')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.segregation}</span></td>
                </tr>
              {/if}
              {#if currentEntry.marpol}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('marpol')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.marpol}</span></td>
                </tr>
              {/if}
              {#if currentEntry.packingInstrPassenger}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('piPassenger')}</td>
                  <td class="field-value">
                    <span class="mono-val">{currentEntry.packingInstrPassenger}</span>
                    {#if currentEntry.maxNetPassenger}<span class="text-xs text-[#5a7a99] ml-1.5">· max {currentEntry.maxNetPassenger}</span>{/if}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.packingInstrCargo}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('piCargo')}</td>
                  <td class="field-value">
                    <span class="mono-val">{currentEntry.packingInstrCargo}</span>
                    {#if currentEntry.maxNetCargo}<span class="text-xs text-[#5a7a99] ml-1.5">· max {currentEntry.maxNetCargo}</span>{/if}
                  </td>
                </tr>
              {/if}
              {#if currentEntry.cones != null && currentEntry.cones !== ''}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('cones')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.cones}</span></td>
                </tr>
              {/if}
              {#if currentEntry.equipment}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('equipment')}</td>
                  <td class="field-value"><span class="mono-val">{currentEntry.equipment}</span></td>
                </tr>
              {/if}
              {#if currentEntry.remark}
                <tr class="even:bg-[#dce8f2]">
                  <td class="field-label">{tool.L('remark')}</td>
                  <td class="field-value text-sm leading-relaxed text-[#2d5070]">{currentEntry.remark}</td>
                </tr>
              {/if}
            </tbody>
          </table>

          <!-- Special provisions -->
          {#if currentEntry.specialProvisions}
            <MultimodalSvsAccordion
              svs={currentEntry.specialProvisions}
              label={tool.L('specialProvisions')}
              noText={tool.L('noText')}
              clickLoad={tool.L('clickLoad')}
              {demo}
              mode={tool.currentModal}
              lang={tool.currentLang}
              {supabase}
            />
          {/if}
        {:else}
          <!-- Empty state (no data for current modal) -->
          <div class="text-center py-12 text-[#5a7a99]">
            <div class="text-4xl mb-3 opacity-30">📭</div>
            <p class="text-sm">UN {tool.currentUnNumber} – {tool.currentModal} {tool.L('notFound')}.</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Initial empty state (no search yet) -->
      <div class="bg-[#f4f7fa] border border-[#b0c4d8] p-14 text-center text-[#5a7a99]">
        <div class="text-5xl mb-3 opacity-30">🌍</div>
        <p class="text-sm leading-relaxed">
          <strong class="text-[#0f2744]">{tool.L('searchPlaceholder')}</strong><br />
          {tool.L('bannerSub')}
        </p>
      </div>
    {/if}

  </div>
</div>

<style>
  @reference "tailwindcss";

  .field-label {
    @apply font-mono text-[10px] font-bold tracking-[0.5px] uppercase text-[#5a7a99] py-2 px-2.5 border-b border-[#c8d6e5] align-top whitespace-nowrap w-[150px];
  }
  .field-value {
    @apply py-2 px-2.5 border-b border-[#c8d6e5] align-top text-[#2d5070];
  }
  .badge {
    @apply inline-block font-mono text-[10px] font-bold px-2 py-0.5 tracking-[0.3px];
  }
  .mono-val {
    @apply font-mono text-[13px] font-semibold text-[#0f2744];
  }
</style>
```

Two deliberate deviations from the Vue template, both accessibility fixes the autofixer will otherwise flag: the overview cards get `role="button"`, `tabindex`, and a keyboard handler (the Vue version had a bare clickable `div`), and every `<button>` gets `type="button"`. The class strings themselves are unchanged. The `{@const entry}` blocks replace the repeated `getEntry(modal)!` calls; they are equivalent.

- [ ] **Step 4: Run the test**

Run: `pnpm test tests/MultimodalTool.test.ts`
Expected: PASS (6 tests). If the `@apply` block fails to compile under Vitest, confirm `@reference "tailwindcss";` is the first line of `<style>` and that the `tailwindcss()` plugin precedes `sveltekit()` in `vite.config.ts`.

- [ ] **Step 5: Autofix check and checkpoint**

Run the Svelte autofixer on `MultimodalTool.svelte`; resolve issues; `pnpm test` all green (11 files).

---

### Task 7: Landing sections (all but Waitlist) and the landing page with SEO head

**Files:**
- Create: `src/lib/landing/Navbar.svelte`, `Hero.svelte`, `Stats.svelte`, `Features.svelte`, `MultimodalDemo.svelte`, `Comparison.svelte`, `SeoContent.svelte`, `DataSource.svelte`, `Faq.svelte`, `Cta.svelte`, `Footer.svelte`
- Create: `src/routes/+page.svelte`
- Create: `tests/landing-page.test.ts`
- Source to read: `app/components/landing/<Name>.vue`, `app/pages/index.vue`

**Interfaces:**
- Consumes: `MultimodalTool` (Task 6), `FAQ_ITEMS` (Task 1), JSON-LD builders (Task 1).
- Produces: `+page.svelte` renders `<Waitlist form={form} />` — the `Waitlist` component and the `form` prop come from Task 8. Until Task 8 lands, the page imports a placeholder? **No.** Task 7 renders the page *without* the Waitlist section and Task 8 adds it. The landing test in this task therefore does not assert on `#waitlist`.

**Transliteration rules for every component in this task** (apply to the `<template>` body of the Vue file):

1. Drop the `<template>`/`</template>` wrapper and any leading `<!-- app/components/... -->` comment. Svelte components are the markup at top level.
2. `<script setup lang="ts">` → `<script lang="ts">`, placed *above* the markup. Constants stay as `const`.
3. `v-for="x in xs" :key="k"` → `{#each xs as x (k)}` … `{/each}`. The key expression is the same one Vue used.
4. `v-if` / `v-else-if` / `v-else` → `{#if}` / `{:else if}` / `{:else}` / `{/if}`.
5. `{{ expr }}` → `{expr}`.
6. `:attr="expr"` → `attr={expr}`; `:style="`...`"` → `style={`...`}`; `:class="`...`"` → `class={`...`}`.
7. `onmouseenter="this.style.background='#ea580c'"` (an HTML inline-handler string) → `onmouseenter={(e) => { e.currentTarget.style.background = '#ea580c' }}`; same for `onmouseleave`. Svelte 5 requires a function for `on*` attributes.
8. `<br>` → `<br />`; self-closing `<path .../>` and `<svg>` are unchanged.
9. Every `class="..."`, `style="..."`, text node, `id`, `aria-*`, and `href` is copied byte for byte.

**Known no-op preserved for parity:** `Features.vue` builds `hover:border-[${feature.color}]` and `group-hover:bg-[${feature.color}]` at runtime. Tailwind cannot see those literals, so they produced no CSS in the Nuxt app either. Copy them as they are; do not fix.

- [ ] **Step 1: Write the failing landing-page test**

`tests/landing-page.test.ts`:

```ts
import { render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import LandingPage from '../src/routes/+page.svelte'
import { FAQ_ITEMS } from '$lib/landing/faq'

afterEach(() => {
  document.head.innerHTML = ''
})

describe('landing page', () => {
  it('renders the main sections in order', () => {
    const { container } = render(LandingPage, { props: { data: {}, form: null } })
    const ids = Array.from(container.querySelectorAll('section[id], header, footer')).map(el => el.id || el.tagName.toLowerCase())
    expect(ids).toEqual(['header', 'features', 'demo', 'comparison', 'faq', 'footer'])
  })

  it('renders the embedded demo tool with UN 1203', () => {
    const { container } = render(LandingPage, { props: { data: {}, form: null } })
    expect(container.querySelector('#demo')).toHaveTextContent('UN 1203 · Verfügbarkeit in allen Modi')
  })

  it('renders every FAQ item as a details element', () => {
    render(LandingPage, { props: { data: {}, form: null } })
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument()
    }
    expect(document.querySelectorAll('#faq details')).toHaveLength(FAQ_ITEMS.length)
  })

  it('emits title, description, canonical and four JSON-LD graphs into <head>', () => {
    render(LandingPage, { props: { data: {}, form: null } })
    expect(document.title).toBe('gefahrgut.org – Gefahrgut-Datenbank & Tools für Gefahrgutbeauftragte')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('16.730 Einträge')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://gefahrgut.org/')
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://gefahrgut.org/og-image.png')

    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    expect(scripts).toHaveLength(4)
    const types = scripts.map(s => JSON.parse(s.textContent ?? '{}')['@type']).sort()
    expect(types).toEqual(['FAQPage', 'Organization', 'SoftwareApplication', 'WebSite'])
  })

  it('FAQPage JSON-LD mirrors the visible FAQ exactly (SEO invariant)', () => {
    render(LandingPage, { props: { data: {}, form: null } })
    const faqLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(s => JSON.parse(s.textContent ?? '{}'))
      .find(ld => ld['@type'] === 'FAQPage')
    expect(faqLd.mainEntity.map((e: { name: string }) => e.name)).toEqual(FAQ_ITEMS.map(i => i.question))
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/landing-page.test.ts`
Expected: FAIL — `+page.svelte` not found.

- [ ] **Step 3: Write the four markup-only components**

`Navbar.svelte`, `MultimodalDemo.svelte`, `SeoContent.svelte`, `Cta.svelte` have no `<script>` in Vue. Apply rules 1, 7, 8, 9. `MultimodalDemo.svelte` additionally needs:

```svelte
<script lang="ts">
  import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
</script>
```

at the top and `<MultimodalTool demo />` stays `<MultimodalTool demo />`. Navbar keeps `<header>`; Cta keeps `<section>` without an id (it is not in the test's id list because it has no `id`).

- [ ] **Step 4: Write `Hero.svelte`**

```svelte
<script lang="ts">
  const trustSignals = ['Kostenlos starten', 'Keine Kreditkarte erforderlich', 'BAM-zertifizierte Datenbasis']
</script>

<section class="relative pt-16 overflow-hidden" style="background: #0f2744;">
  <!-- Subtle grid pattern -->
  <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"></div>

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
    <div class="max-w-3xl">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style="background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); color: #fdba74;">
        <span class="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse"></span>
        Neu: Regelwerksvergleich ADR · RID · IMDG · ICAO · ADN
      </div>

      <!-- Headline -->
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
        Alle Gefahrgut&shy;vorschriften.<br />
        <span style="color: #f97316;">Ein Werkzeug.</span>
      </h1>

      <!-- Subtext -->
      <p class="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
        Die Arbeitsplattform für Gefahrgutbeauftragte – alle Regelwerke, alle Werkzeuge, alle Dokumente. Zentral, schnell und immer aktuell.
      </p>

      <!-- CTA -->
      <div class="mb-10">
        <a
          href="#demo"
          class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
          style="background: #f97316;"
          onmouseenter={(e) => { e.currentTarget.style.background = '#ea580c' }}
          onmouseleave={(e) => { e.currentTarget.style.background = '#f97316' }}
        >
          Jetzt ausprobieren
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </a>
      </div>

      <!-- Trust signals -->
      <div class="flex flex-wrap items-center gap-6 text-sm text-slate-400">
        {#each trustSignals as signal (signal)}
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {signal}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Wave divider -->
  <div class="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" preserveAspectRatio="none" class="absolute bottom-0 w-full h-full" fill="white" aria-hidden="true">
      <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z"/>
    </svg>
  </div>
</section>
```

- [ ] **Step 5: Write `Stats.svelte`**

```svelte
<script lang="ts">
  const stats = [
    { value: '2.347+', label: 'UN-Nummern' },
    { value: '5', label: 'Regelwerke' },
    { value: '< 300ms', label: 'Antwortzeit' },
    { value: '100%', label: 'BAM-Datenbasis' },
  ]
</script>

<section class="bg-white border-b border-slate-100" aria-label="Kennzahlen">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {#each stats as stat (stat.label)}
        <div class="text-center">
          <div class="text-3xl font-bold mb-1" style="color: #0f2744;">{stat.value}</div>
          <div class="text-sm text-slate-500">{stat.label}</div>
        </div>
      {/each}
    </div>
  </div>
</section>
```

- [ ] **Step 6: Write `Features.svelte`**

Script block: copy the `features` array from `Features.vue` verbatim (six objects with `title`, `description`, `icon`, `color`, `bgColor`). Markup:

```svelte
<section id="features" class="py-20 lg:py-28 bg-white" aria-labelledby="features-heading">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #f97316; background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.2);">
        Funktionen
      </div>
      <h2 id="features-heading" class="text-3xl sm:text-4xl font-bold mb-4" style="color: #0f2744;">
        Eine Plattform. Alle Werkzeuge.
      </h2>
      <p class="text-lg text-slate-500 max-w-2xl mx-auto">
        Spezialisierte Tools für jeden Aspekt der Gefahrgutarbeit – nahtlos integriert in einer Oberfläche.
      </p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each features as feature (feature.title)}
        <div
          class={['group rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer', `hover:border-[${feature.color}]`]}
        >
          <div
            class={['w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200', `group-hover:bg-[${feature.color}]`]}
            style={`background: ${feature.bgColor};`}
          >
            <svg
              class="w-6 h-6 transition-colors duration-200 group-hover:text-white"
              style={`color: ${feature.color};`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={feature.icon}/>
            </svg>
          </div>
          <h3 class="font-semibold text-lg mb-2" style="color: #0f2744;">{feature.title}</h3>
          <p class="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
```

- [ ] **Step 7: Write `Comparison.svelte`**

Script block: copy `highlights` (4 strings) and `tableRows` (5 objects) from `Comparison.vue` verbatim. Markup: apply the rules to the template. The two `v-for`s become `{#each highlights as point (point)}` and `{#each tableRows as row (row.name)}`; the two `v-if/v-else` span pairs become `{#if row.vpGrDeviation}…{:else}…{/if}` and `{#if row.lqDeviation}…{:else}…{/if}`; the CTA anchor gets the rule-7 mouse handlers with `'#1e3a5f'` / `'#0f2744'`.

- [ ] **Step 8: Write `DataSource.svelte`**

Script block: copy `stats` (4 objects) verbatim. Markup: `{#each stats as stat (stat.label)}` around the inner card `div`.

- [ ] **Step 9: Write `Faq.svelte`**

```svelte
<script lang="ts">
  import { FAQ_ITEMS } from './faq'
</script>

<section id="faq" class="py-20 lg:py-28 bg-white" aria-labelledby="faq-heading">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border" style="color: #15779b; background: rgba(21,119,155,0.08); border-color: rgba(21,119,155,0.2);">
        FAQ
      </div>
      <h2 id="faq-heading" class="text-3xl sm:text-4xl font-bold" style="color: #0f2744;">
        Häufige Fragen
      </h2>
    </div>

    <div class="flex flex-col gap-3">
      {#each FAQ_ITEMS as item (item.question)}
        <details class="group rounded-xl border border-slate-200 bg-white open:shadow-md transition-shadow">
          <summary class="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none text-sm font-semibold list-none [&::-webkit-details-marker]:hidden" style="color: #0f2744;">
            {item.question}
            <span class="text-slate-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <p class="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.answer}</p>
        </details>
      {/each}
    </div>
  </div>
</section>
```

- [ ] **Step 10: Write `Footer.svelte`**

Script block: copy `linkColumns` (3 columns) verbatim. Markup: `{#each linkColumns as col (col.heading)}` around the column `div`, `{#each col.links as link (link.label)}` around the `li`, `:href="link.href"` → `href={link.href}`.

- [ ] **Step 11: Write `src/routes/+page.svelte`**

The meta values are copied from `app/pages/index.vue`. JSON-LD is written with `{@html}` inside `<svelte:head>`; `<` is escaped so a `</script>` inside content can never break out.

```svelte
<script lang="ts">
  import Comparison from '$lib/landing/Comparison.svelte'
  import Cta from '$lib/landing/Cta.svelte'
  import DataSource from '$lib/landing/DataSource.svelte'
  import Faq from '$lib/landing/Faq.svelte'
  import Features from '$lib/landing/Features.svelte'
  import Footer from '$lib/landing/Footer.svelte'
  import Hero from '$lib/landing/Hero.svelte'
  import MultimodalDemo from '$lib/landing/MultimodalDemo.svelte'
  import Navbar from '$lib/landing/Navbar.svelte'
  import SeoContent from '$lib/landing/SeoContent.svelte'
  import Stats from '$lib/landing/Stats.svelte'
  import { FAQ_ITEMS } from '$lib/landing/faq'
  import {
    buildFaqPageLd,
    buildOrganizationLd,
    buildSoftwareApplicationLd,
    buildWebSiteLd,
    SITE_URL,
  } from '$lib/seo/structuredData'

  const title = 'gefahrgut.org – Gefahrgut-Datenbank & Tools für Gefahrgutbeauftragte'
  const description = 'ADR, RID, IMDG und ICAO in einer Plattform: 16.730 Einträge der BAM-GEFAHRGUT-Datenbank, multimodaler Regelwerksvergleich, Sondervorschriften im Volltext und Werkzeuge wie der 1000-Punkte-Rechner. Jetzt auf die Warteliste.'

  function ldScript(ld: unknown): string {
    const json = JSON.stringify(ld).replace(/</g, '\\u003c')
    return `<script type="application/ld+json">${json}<\/script>`
  }

  const jsonLd = [
    buildOrganizationLd(),
    buildWebSiteLd(),
    buildSoftwareApplicationLd(),
    buildFaqPageLd(FAQ_ITEMS),
  ].map(ldScript).join('')
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href={`${SITE_URL}/`} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={`${SITE_URL}/`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta property="og:locale" content="de_DE" />
  <meta property="og:site_name" content="gefahrgut.org" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
  {@html jsonLd}
</svelte:head>

<div class="min-h-screen bg-white font-sans antialiased">
  <Navbar />
  <Hero />
  <Stats />
  <Features />
  <MultimodalDemo />
  <Comparison />
  <SeoContent />
  <!-- Waitlist section is added in Task 8 -->
  <DataSource />
  <Faq />
  <Cta />
  <Footer />
</div>
```

The page does not read `data` or `form` yet (`$props()` is added in Task 8 when Waitlist needs `form`). The test passes `data`/`form` anyway so it does not need to change later.

- [ ] **Step 12: Run the test**

Run: `pnpm test tests/landing-page.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 13: Visual parity check in the browser**

Run `pnpm dev`, open `http://localhost:5173/`. Compare against the Nuxt app if it is still runnable elsewhere, or against `git show HEAD:app/pages/index.vue` mentally: navbar, hero with wave, stats, six feature cards, demo tool (interactive: language buttons and tabs work), comparison table with orange deviation badges, SEO copy, data source card, FAQ accordion, CTA, footer. Fonts must be Plus Jakarta Sans. Stop the dev server.

- [ ] **Step 14: Autofix check and checkpoint**

Run the Svelte autofixer on all 12 new `.svelte` files; resolve issues. `pnpm test` all green (12 files). Report.

---

### Tasks 8–11 (executed directly from the spec)

Detailed steps for these were not written out; the spec sections referenced are the source of truth and each task still follows write-test → fail → implement → pass → autofix → checkpoint.

- **Task 8 — Waitlist:** `WaitlistFormState` (`$lib/landing/waitlistForm.svelte.ts`), form action in `src/routes/+page.server.ts`, `Waitlist.svelte` with `use:enhance`, page passes `form`. Spec §3 (`WaitlistFormState`) and §4. Tests: `waitlistForm.svelte.test.ts`, `waitlist-action.test.ts`, `waitlist-section.test.ts`.
- **Task 9 — Search:** `SearchState` (`$lib/search/search.svelte.ts`), `src/routes/search/+page.svelte`, `tests/stubs/ToolStub.svelte`. Spec §3 (`SearchState`), §5 (noindex). Tests: `search.svelte.test.ts`, `search-page.test.ts`.
- **Task 10 — UN page:** `src/routes/un/[nummer]/+page.server.ts` (404 on non-4-digit, `fetchCompareForUn(locals.supabase, …)`), `+page.svelte` with `{#key data.unNumber}` around `MultimodalTool`, head per spec §5. Tests: `un-page-load.test.ts`, `un-page.test.ts`.
- **Task 11 — Cleanup:** delete `app/`, `server/`, `nuxt.config.ts`; retarget `tailwind-classes.test.ts` to `src/**/*.svelte`; rewrite `CLAUDE.md`; env rename in `docs/database-schema-and-import-plan.md`; `pnpm check`, `pnpm build`, `pnpm preview` smoke on `/`, `/search`, `/un/1203`. Spec §6 definition of done, §7.
