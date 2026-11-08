import { resolve } from '$app/paths'

/**
 * Legal pages live in the app (`src/routes/(legal)/`, texts in `lib/legalPages/`); the blog
 * stays on WordPress until it moves to blog.gefahrgut.org (rollout Phase B, spec 2026-09-29 §6).
 * This file is the only place for these links.
 */
export const IMPRINT_URL = resolve('/(legal)/impressum')
export const PRIVACY_URL = resolve('/(legal)/datenschutz')
export const TERMS_URL = resolve('/(legal)/agb')
export const WITHDRAWAL_URL = resolve('/(legal)/widerruf')
export const BLOG_URL = 'https://gefahrgut.org/blog/'

export const LEGAL_LINKS = [
  { label: 'Impressum', href: IMPRINT_URL },
  { label: 'Datenschutz', href: PRIVACY_URL },
  { label: 'AGB', href: TERMS_URL },
  { label: 'Widerruf', href: WITHDRAWAL_URL },
] as const
