import { json } from '@sveltejs/kit'
import {
  HIT_LIMIT,
  MAX_BOOK_QUERY_LENGTH,
  MIN_BOOK_QUERY_LENGTH,
  SV_CODE_RE,
  UN_NUMBER_RE,
} from '$lib/regulations/bookTypes'
import { bookAccessDenied, positiveInt } from '$lib/server/adrBook/access'
import { hitsFor, searchText } from '$lib/server/adrBook/api'
import { getBookIndex } from '$lib/server/adrBook/index'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

const limiter = createRateLimiter({ max: 60, windowMs: 60 * 1000 })

/**
 * GET ?q=<term>              free-text hits, document order
 * GET ?sv=<code>[&all=1]     ranked hits for a special provision
 * GET ?un=<number>[&all=1]   ranked hits for a UN number
 * Optional `limit` (1..500). Answers `{ hits, total, capped }`.
 */
export const GET: RequestHandler = async ({ url, locals, getClientAddress }) => {
  if (!limiter.check(getClientAddress())) return json({ error: 'rateLimited' }, { status: 429 })

  const denied = await bookAccessDenied(locals)
  if (denied) return denied

  const params = url.searchParams
  const rawLimit = params.get('limit')
  const limit = rawLimit === null ? HIT_LIMIT : positiveInt(rawLimit)
  if (limit === null) return badRequest()
  const cappedLimit = Math.min(limit, HIT_LIMIT)
  const includeIncidental = params.get('all') === '1'

  const sv = params.get('sv')
  if (sv !== null) {
    if (!SV_CODE_RE.test(sv)) return badRequest()
    return json(hitsFor(getBookIndex(), 'sv', sv, { includeIncidental, limit: cappedLimit }))
  }

  const un = params.get('un')
  if (un !== null) {
    if (!UN_NUMBER_RE.test(un)) return badRequest()
    return json(hitsFor(getBookIndex(), 'un', un, { includeIncidental, limit: cappedLimit }))
  }

  const q = params.get('q')?.trim() ?? ''
  if (q.length < MIN_BOOK_QUERY_LENGTH || q.length > MAX_BOOK_QUERY_LENGTH) return badRequest()
  return json(searchText(getBookIndex(), q, cappedLimit))
}

function badRequest(): Response {
  return json({ error: 'badRequest' }, { status: 400 })
}
