import { fail } from '@sveltejs/kit'
import { CONSENT_VERSION } from '$lib/prelaunch/consent'
import { validateEmail, validateRegistration } from '$lib/server/authValidation'
import { createRateLimiter } from '$lib/server/rateLimit'
import { registrationMode } from '$lib/server/registrationMode'
import type { Actions, PageServerLoad, RequestEvent } from './$types'

const limiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

export const load: PageServerLoad = () => ({ mode: registrationMode() })

export const actions: Actions = {
  default: async (event) => {
    if (!limiter.check(event.getClientAddress())) {
      return fail(429, { error: 'rateLimited' as const })
    }
    const form = await event.request.formData()
    // decided on the server, so a hand-built POST cannot create an account in waitlist mode
    return registrationMode() === 'open' ? register(event, form) : notify(event, form)
  },
}

async function register({ locals, url }: RequestEvent, form: FormData) {
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
  return { sent: true as const }
}

async function notify({ locals }: RequestEvent, form: FormData) {
  // bots fill every field; people never see this one
  if (String(form.get('website') ?? '') !== '') return { notified: true as const }

  const submittedEmail = String(form.get('email') ?? '').trim().toLowerCase()
  const email = validateEmail(form.get('email'))
  if (!email.ok) return fail(400, { error: email.error, email: submittedEmail })
  if (form.get('consent') !== 'on') return fail(400, { error: 'consent_required' as const, email: email.email })

  const { error } = await locals.supabase.rpc('join_launch_list', {
    p_email: email.email,
    p_consent_version: CONSENT_VERSION,
  })
  if (error) return fail(500, { error: 'error' as const, email: email.email })

  // new or already listed: the same answer, so the list cannot be probed
  return { notified: true as const }
}
