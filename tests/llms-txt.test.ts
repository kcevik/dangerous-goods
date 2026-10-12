// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const llms = readFileSync('static/llms.txt', 'utf8')

describe('static/llms.txt', () => {
  it('does not promise open registration while the site is pre-launch', () => {
    expect(llms).not.toMatch(/Registrierung ist offen/)
    expect(llms).toMatch(/Benachrichtigung zum Start/)
  })

  it('keeps the site facts shared with the landing page (SEO invariant)', () => {
    expect(llms).toContain('16.730')
  })
})
