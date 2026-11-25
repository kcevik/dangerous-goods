// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// jsdom has no layout: a long unbreakable URL widened the whole page on phones (2026-11-25).
it('book text wraps long unbreakable strings', () => {
  const css = readFileSync('src/lib/regulations/BookViewer.svelte', 'utf8')
  expect(css).toMatch(/\.book-window\)\s*\{[^}]*overflow-wrap:\s*anywhere/)
})
