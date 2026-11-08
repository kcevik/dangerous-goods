// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Fonts are self-hosted: loading them from Google without consent is a GDPR risk (LG München I, 2022). */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('self-hosted fonts', () => {
  it('never loads anything from Google Fonts', () => {
    const offenders = [...files('src'), ...files('static'), 'src/app.html']
      .filter(path => /\.(svelte|ts|css|html|txt)$/.test(path))
      .filter(path => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(path, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('bundles Plus Jakarta Sans from the fontsource package', () => {
    const css = readFileSync('src/app.css', 'utf8')
    expect(css).toContain("@import '@fontsource-variable/plus-jakarta-sans';")
    expect(css).toContain("font-family: 'Plus Jakarta Sans Variable'")
  })
})
