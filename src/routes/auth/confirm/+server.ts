import { redirect } from '@sveltejs/kit'
import type { EmailOtpType } from '@supabase/supabase-js'
import { safeNext } from '$lib/auth/safeNext'
import type { RequestHandler } from './$types'

/**
 * Server-side token exchange for confirmation / recovery / email-change mails.
 * Email templates link here with ?token_hash=…&type=…&next=… (see spec §6).
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = safeNext(url.searchParams.get('next'))

  if (tokenHash && type) {
    const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) redirect(303, next)
  }

  redirect(303, '/auth/fehler')
}
