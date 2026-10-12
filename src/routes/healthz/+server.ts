import { bookStatus } from '$lib/server/adrBook/index'
import type { RequestHandler } from './$types'

const HEADERS = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }

/**
 * Health probe for Docker and the deploy script. Never touches Supabase. A
 * configured but unloadable ADR book counts as unhealthy, so a deploy with a
 * missing or truncated book file is rolled back. The reason is logged at startup,
 * never returned here — this endpoint is public.
 */
export const GET: RequestHandler = () =>
  bookStatus().state === 'failed'
    ? new Response('book unavailable', { status: 503, headers: HEADERS })
    : new Response('ok', { headers: HEADERS })
