import { fail, redirect } from '@sveltejs/kit'
import { safeNext } from '$lib/auth/safeNext'
import { validateEmail } from '$lib/server/authValidation'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { Actions, PageServerLoad } from './$types'

const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 })

export const load: PageServerLoad = async ({ url }) => {
  return { next: safeNext(url.searchParams.get('next')) }
}

export const actions: Actions = {
  default: async ({ request, locals, getClientAddress }) => {
    if (!limiter.check(getClientAddress())) {
      return fail(429, { error: 'rateLimited' as const })
    }

    const form = await request.formData()
    const email = validateEmail(form.get('email'))
    const password = form.get('password')
    const next = safeNext(String(form.get('next') ?? ''))

    // a malformed email can never be a valid login — same message, no Supabase call
    if (!email.ok || typeof password !== 'string' || password.length === 0) {
      return fail(400, { error: 'invalid_credentials' as const, email: String(form.get('email') ?? '') })
    }

    const { error } = await locals.supabase.auth.signInWithPassword({ email: email.email, password })
    if (error) {
      return fail(400, { error: 'invalid_credentials' as const, email: email.email })
    }

    redirect(303, next)
  },
}
