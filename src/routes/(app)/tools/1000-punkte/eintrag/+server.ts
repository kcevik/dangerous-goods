import { json } from '@sveltejs/kit'
import { fetchAdrEntries } from '$lib/multimodal/mappers'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

const limiter = createRateLimiter({ max: 120, windowMs: 60 * 1000 })
const UN_RE = /^\d{4}$/

/**
 * GET ?un=<4 digits> → `{ entries }`: the ADR rows of one UN number for the
 * 1000-Punkte-Rechner. The entitlement check runs before any query (RLS is only
 * the backstop); a failed query is a 500, never an empty list.
 */
export const GET: RequestHandler = async ({ url, locals, getClientAddress }) => {
  if (!limiter.check(getClientAddress())) return json({ error: 'rateLimited' }, { status: 429 })

  const { session, isActive } = await locals.safeGetSession()
  if (!session) return json({ error: 'unauthenticated' }, { status: 401 })
  if (!isActive) return json({ error: 'locked' }, { status: 403 })

  const un = url.searchParams.get('un') ?? ''
  if (!UN_RE.test(un)) return json({ error: 'badRequest' }, { status: 400 })

  try {
    return json({ entries: await fetchAdrEntries(locals.supabase, un) })
  }
  catch (error) {
    console.error('1000-Punkte lookup failed', error)
    return json({ error: 'lookupFailed' }, { status: 500 })
  }
}
