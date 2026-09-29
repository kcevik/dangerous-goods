import type { RequestHandler } from './$types'

/** Liveness probe for Docker and the deploy script. Touches neither Supabase nor the book. */
export const GET: RequestHandler = () =>
  new Response('ok', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
