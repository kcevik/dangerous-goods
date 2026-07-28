import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

let supabase: SupabaseClient | undefined

// Caddy (our reverse proxy) appends the real client IP as the LAST hop of
// X-Forwarded-For; earlier hops can be forged by the client. h3's built-in
// xForwardedFor option takes the FIRST entry, which is bypassable — so we
// parse the header ourselves and take the last entry instead.
function getClientIp(event: H3Event): string {
  const header = getRequestHeader(event, 'x-forwarded-for')
  if (header) {
    const parts = header.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length > 0) {
      return parts[parts.length - 1]!
    }
  }
  return getRequestIP(event) ?? 'unknown'
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!limiter.check(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }

  const body = await readBody(event).catch(() => null)

  // CAPTCHA: verify Turnstile token here (read token from body, POST to
  // https://challenges.cloudflare.com/turnstile/v0/siteverify with the secret
  // from runtimeConfig) before accepting the submission.

  const result = validateWaitlistInput(body)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.error })
  }

  if (result.data.honeypot) {
    // bot filled the hidden field — pretend success, store nothing
    setResponseStatus(event, 201)
    return { status: 'ok' }
  }

  if (!supabase) {
    const config = useRuntimeConfig(event)
    supabase = createClient(config.public.supabase.url, config.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })
  }

  const { error } = await supabase.from('waitlist').insert({
    name: result.data.name,
    email: result.data.email,
    consented_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '23505') return { status: 'already_registered' }
    throw createError({ statusCode: 500, statusMessage: 'Internal error' })
  }

  setResponseStatus(event, 201)
  return { status: 'ok' }
})
