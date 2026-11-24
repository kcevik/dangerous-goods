import { redirect } from '@sveltejs/kit'
import type { EmailOtpType } from '@supabase/supabase-js'
import { safeNext } from '$lib/auth/safeNext'
import type { Actions, PageServerLoad } from './$types'

/**
 * Confirmation / recovery / email-change mails link here with ?token_hash=…&type=…&next=… (spec §6).
 * The page only shows a button: mail scanners GET links and would use up the one-time token.
 * The button posts to this same URL, and only that POST runs `verifyOtp`.
 */
export const load: PageServerLoad = async ({ url }) => {
  if (!url.searchParams.get('token_hash') || !url.searchParams.get('type')) redirect(303, '/auth/fehler')
}

export const actions: Actions = {
  default: async ({ url, locals }) => {
    const tokenHash = url.searchParams.get('token_hash')
    const type = url.searchParams.get('type') as EmailOtpType | null
    const next = safeNext(url.searchParams.get('next'))

    if (tokenHash && type) {
      const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      if (!error) redirect(303, next)
    }

    redirect(303, '/auth/fehler')
  },
}
