// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { SITE_URL } from '../src/lib/seo/structuredData'

it('robots.txt points at a sitemap that lists the landing page, with the canonical host', () => {
  expect(readFileSync('static/robots.txt', 'utf8')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  expect(readFileSync('static/sitemap.xml', 'utf8')).toContain(`<loc>${SITE_URL}/</loc>`)
})
