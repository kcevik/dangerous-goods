import { fail, redirect } from '@sveltejs/kit'
import { validatePassword } from '$lib/server/authValidation'
import type { Actions, PageServerLoad } from './$types'

/** Only reachable with the session created by the recovery link. */
export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession()
  if (!session) redirect(303, '/login')
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { session } = await locals.safeGetSession()
    if (!session) redirect(303, '/login')

    const form = await request.formData()
    const password = validatePassword(form.get('password'))
    if (!password.ok) return fail(400, { error: password.error })
    if (form.get('passwordRepeat') !== password.password) {
      return fail(400, { error: 'password_mismatch' as const })
    }

    const { error } = await locals.supabase.auth.updateUser({ password: password.password })
    if (error) return fail(500, { error: 'error' as const })

    redirect(303, '/dashboard')
  },
}
