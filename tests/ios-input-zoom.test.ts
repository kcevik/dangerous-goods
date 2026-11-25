// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// jsdom has no layout: fields under 16px make iOS Safari zoom in on focus (2026-11-25).
it('app.css keeps form fields at 16px on phones', () => {
  const css = readFileSync('src/app.css', 'utf8')
  expect(css).toMatch(/max-width:\s*767px\)\s*\{[^}]*select[^}]*font-size:\s*16px/)
})
