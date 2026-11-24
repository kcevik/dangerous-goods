// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('tab icon', () => {
  const html = readFileSync('src/app.html', 'utf8')

  it('links the PNG icon, and the file exists in static/', () => {
    expect(html).toContain('<link rel="icon" type="image/png" href="%sveltekit.assets%/icon.png" />')
    expect(existsSync('static/icon.png')).toBe(true)
  })

  it('also serves it as the Apple touch icon', () => {
    expect(html).toContain('<link rel="apple-touch-icon" href="%sveltekit.assets%/icon.png" />')
  })
})

describe('logo in every header and footer', () => {
  const files = [
    'src/lib/landing/Navbar.svelte',
    'src/lib/landing/Footer.svelte',
    'src/routes/(auth)/+layout.svelte',
    'src/routes/(app)/+layout.svelte',
    'src/routes/(legal)/+layout.svelte',
  ]
  it.each(files)('%s shows the icon', (file) => {
    expect(readFileSync(file, 'utf8')).toContain('src="/icon.png"')
  })
  it.each(['src/routes/(auth)/+layout.svelte', 'src/routes/(app)/+layout.svelte'])('%s puts it on a white tile (navy background)', (file) => {
    expect(readFileSync(file, 'utf8')).toMatch(/<img src="\/icon.png"[^>]*class="[^"]*bg-white/)
  })
})
