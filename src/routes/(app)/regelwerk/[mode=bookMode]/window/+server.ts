import { json } from '@sveltejs/kit'
import { ADJACENT_WINDOW_LINES } from '$lib/regulations/bookTypes'
import { bookAccessDenied, positiveInt } from '$lib/server/adrBook/access'
import { windowAt } from '$lib/server/adrBook/api'
import { getBookIndex } from '$lib/server/adrBook/index'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

// scrolling through the book is chatty (spec §6.1)
const limiter = createRateLimiter({ max: 120, windowMs: 60 * 1000 })

/**
 * GET ?line=<n>            window centred on line n
 * GET ?line=<n>&dir=1      window starting at n (reading forward)
 * GET ?line=<n>&dir=-1     window ending at n (reading backward)
 */
export const GET: RequestHandler = async ({ url, locals, getClientAddress }) => {
  if (!limiter.check(getClientAddress())) return json({ error: 'rateLimited' }, { status: 429 })

  const denied = await bookAccessDenied(locals)
  if (denied) return denied

  const line = positiveInt(url.searchParams.get('line'))
  const dir = url.searchParams.get('dir')
  if (line === null || (dir !== null && dir !== '1' && dir !== '-1')) {
    return json({ error: 'badRequest' }, { status: 400 })
  }

  const index = getBookIndex()
  if (line > index.lines.length) return json({ error: 'badRequest' }, { status: 400 })

  const window = dir === '1'
    ? windowAt(index, line, 0, ADJACENT_WINDOW_LINES)
    : dir === '-1'
      ? windowAt(index, line, ADJACENT_WINDOW_LINES, 0)
      : windowAt(index, line)
  return json(window)
}
