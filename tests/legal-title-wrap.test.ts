// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// jsdom has no layout: "Allgemeine Geschäftsbedingungen" widened the page at 320 px (2026-11-25).
it('legal page title shrinks and breaks on narrow phones', () => {
  const src = readFileSync('src/lib/legalPages/LegalPage.svelte', 'utf8')
  expect(src).toMatch(/<h1 class="[^"]*text-2xl sm:text-3xl[^"]*break-words/)
})
