import { fail } from '@sveltejs/kit'
import { validateRegistration } from '$lib/server/authValidation'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { Actions } from './$types'

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

export const actions: Actions = {
  default: async ({ request, locals, url, getClientAddress }) => {
    if (!limiter.check(getClientAddress())) {
      return fail(429, { error: 'rateLimited' as const })
    }

    const form = await request.formData()
    const submittedEmail = String(form.get('email') ?? '').trim().toLowerCase()
    const result = validateRegistration({
      email: form.get('email'),
      password: form.get('password'),
      passwordRepeat: form.get('passwordRepeat'),
      consent: form.get('consent') === 'on',
    })
    if (!result.ok) {
      return fail(400, { error: result.error, email: submittedEmail })
    }

    const { error } = await locals.supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: { emailRedirectTo: `${url.origin}/auth/confirm?next=/dashboard` },
    })
    if (error) {
      return fail(500, { error: 'error' as const, email: result.data.email })
    }

    // Existing address: Supabase answers without a new user but without an error,
    // so this state is identical and reveals nothing.
    return { sent: true }
  },
}
