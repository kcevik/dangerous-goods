import { resolve } from '$app/paths'

export interface NavItem {
  label: string
  href: string
}

/**
 * Main navigation of the logged-in app, rendered both inline (md and up) and
 * in the burger menu. Add an entry here and it shows up in both places.
 */
export const APP_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: resolve('/(app)/dashboard') },
  { label: 'Suche', href: resolve('/(app)/suche') },
  { label: 'ADR-Text', href: resolve('/(app)/regelwerk/[mode=bookMode]', { mode: 'adr' }) },
]
