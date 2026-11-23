// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

/**
 * The responsive layout of the landing page and the Stoffsuche leans on a few
 * utilities that are easy to get wrong (newer v4 names such as `wrap-anywhere`,
 * arbitrary breakpoints, variants inside `@apply`). Tailwind drops unknown
 * classes silently, so every one of them must compile to real CSS here.
 */

const require = createRequire(import.meta.url)
const tailwindDir = dirname(require.resolve('tailwindcss/package.json'))

async function compiler() {
  return compile('@import "tailwindcss";', {
    base: tailwindDir,
    loadStylesheet: async (id: string, base: string) => {
      const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '').replace(/^\.\//, '')
      const path = `${tailwindDir}/${file}`
      return { path, base, content: readFileSync(path, 'utf-8') }
    },
  })
}

const RESPONSIVE_UTILITIES = [
  'overflow-x-clip',
  'wrap-anywhere',
  'hyphens-auto',
  'break-words',
  'min-h-11',
  'min-w-11',
  'w-11',
  'h-11',
  '-mr-2.5',
  'sm:min-h-0',
  'basis-48',
  'max-sm:block',
  'max-sm:w-auto',
  'max-sm:whitespace-normal',
  'max-sm:border-b-0',
  'max-sm:sr-only',
  'min-[400px]:text-4xl',
  'min-[375px]:text-3xl',
  'overscroll-x-contain',
  'sm:flex-none',
  'min-[375px]:px-3',
  'min-[375px]:gap-1.5',
  'last:mr-0',
  'lg:min-h-0',
  'lg:py-0.5',
  'lg:space-y-2.5',
  // 1000-Punkte-Rechner: print view and row grid
  'print:hidden',
  'print:block',
  'print:bg-white',
  'print:min-h-0',
  'print:max-w-none',
  'print:p-0',
  'print:no-underline',
  'sm:grid-cols-[7rem_minmax(0,1fr)_11rem]',
  'accent-orange-600',
  'text-[10px]',
]

describe('responsive utilities compile to CSS', () => {
  it.each(RESPONSIVE_UTILITIES)('%s produces a rule', async (utility) => {
    const { build } = await compiler()
    const empty = build([])
    const css = build([utility])
    expect(css.length).toBeGreaterThan(empty.length)
  })
})
