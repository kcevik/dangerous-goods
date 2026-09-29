import { json } from '@sveltejs/kit'

/**
 * The entitlement gate for the book endpoints.
 *
 * This check IS the gate: the book is a file, not a Postgres table, so there is no
 * row-level-security backstop behind it (spec §7.2). It runs before the index is
 * touched. The `(app)` guard in hooks.server.ts already redirects anonymous
 * requests; the 401 here is defence in depth for a handler reached without it.
 */
export async function bookAccessDenied(locals: App.Locals): Promise<Response | null> {
  const { session, isActive } = await locals.safeGetSession()
  if (!session) return json({ error: 'unauthenticated' }, { status: 401 })
  if (!isActive) return json({ error: 'locked' }, { status: 403 })
  return null
}

/** Parses a strictly positive integer query value; anything else is null. */
export function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}
