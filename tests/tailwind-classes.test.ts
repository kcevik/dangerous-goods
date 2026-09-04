// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Tailwind silently drops class names it does not recognize — a typo or a
 * utility from an older Tailwind version produces no CSS and no warning,
 * only a subtly broken layout (e.g. `placeholder-slate-400` is Tailwind v2
 * syntax; v4 requires `placeholder:text-slate-400`).
 */

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url))

function collectSvelteFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...collectSvelteFiles(full))
    else if (entry.endsWith('.svelte')) files.push(full)
  }
  return files
}

// utility → [invalid pattern, fix]; only list utilities verified to produce
// no CSS in this project's Tailwind version
const REMOVED_UTILITIES: [RegExp, string][] = [
  [/\bplaceholder-(?:[a-z]+-\d{2,3}|white|black)\b/, 'use placeholder:text-* (v4 variant syntax)'],
]

describe('tailwind class validity', () => {
  const files = collectSvelteFiles(SRC_DIR)

  it('finds svelte files to scan', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const [pattern, fix] of REMOVED_UTILITIES) {
    it(`no template uses removed utility ${pattern.source}`, () => {
      const offenders = files
        .map(f => ({ file: f, match: readFileSync(f, 'utf-8').match(pattern) }))
        .filter(o => o.match)
        .map(o => `${o.file}: "${o.match![0]}" — ${fix}`)
      expect(offenders).toEqual([])
    })
  }
})
