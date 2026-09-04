import { fail } from '@sveltejs/kit'
import { validateEmail } from '$lib/server/authValidation'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { Actions } from './$types'

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

export const actions: Actions = {
  default: async ({ request, locals, url, getClientAddress }) => {
    if (!limiter.check(getClientAddress())) {
      return fail(429, { error: 'rateLimited' as const })
    }

    const form = await request.formData()
    const email = validateEmail(form.get('email'))

    // Always answer "sent": a malformed or unknown address must look identical.
    if (email.ok) {
      await locals.supabase.auth.resetPasswordForEmail(email.email, {
        redirectTo: `${url.origin}/auth/confirm?next=/passwort-neu`,
      })
    }

    return { sent: true }
  },
}
