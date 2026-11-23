import { fail, redirect } from '@sveltejs/kit'
import { BILLING_ADDRESS_COLUMNS, type BillingAddress, fromRow, toRow } from '$lib/account/address'
import { ACCOUNT_DELETE_CONFIRM_WORD } from '$lib/account/messages'
import { CHECKOUT_AVAILABLE, subscriptionStatus } from '$lib/account/subscription'
import { validateAddress } from '$lib/server/accountValidation'
import { validatePassword } from '$lib/server/authValidation'
import { createRateLimiter } from '$lib/server/rateLimit'
import type { Actions, PageServerLoad } from './$types'

// Keyed by user id: a hijacked session is one user, whatever IP it comes from.
const passwordLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 })
const deleteLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 })
const addressLimiter = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 })

const LOGIN = `/login?next=${encodeURIComponent('/konto')}`

async function requireUser(locals: App.Locals) {
  const { session, user } = await locals.safeGetSession()
  if (!session || !user) redirect(303, LOGIN)
  return user
}

/** Re-authentication with the session's own email; true = the password is right. */
async function passwordIsCorrect(locals: App.Locals, email: string | undefined, password: string): Promise<boolean> {
  if (!email) return false
  const { error } = await locals.supabase.auth.signInWithPassword({ email, password })
  return !error
}

function text(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v : ''
}

/** /konto touches no regulation data: locked users get the full page. */
export const load: PageServerLoad = async ({ locals }) => {
  const user = await requireUser(locals)

  const [profile, address] = await Promise.all([
    locals.supabase.from('profiles').select('activated_at').eq('id', user.id).maybeSingle(),
    locals.supabase.from('billing_addresses').select(BILLING_ADDRESS_COLUMNS).eq('user_id', user.id).maybeSingle(),
  ])

  return {
    email: user.email ?? '',
    subscription: subscriptionStatus({
      activatedAt: (profile.data as { activated_at: string | null } | null)?.activated_at ?? null,
      failed: !!profile.error || !profile.data,
    }),
    checkoutAvailable: CHECKOUT_AVAILABLE,
    address: address.error || !address.data ? null : fromRow(address.data as never) as BillingAddress,
    addressFailed: !!address.error,
  }
}

export const actions: Actions = {
  password: async ({ request, locals }) => {
    const user = await requireUser(locals)
    if (!passwordLimiter.check(user.id)) return fail(429, { action: 'password' as const, error: 'rateLimited' as const })

    const form = await request.formData()
    const current = text(form, 'currentPassword')
    if (current.length === 0) return fail(400, { action: 'password' as const, error: 'current_password_required' as const })

    const next = validatePassword(form.get('newPassword'))
    if (!next.ok) return fail(400, { action: 'password' as const, error: next.error })
    if (text(form, 'newPasswordRepeat') !== next.password) {
      return fail(400, { action: 'password' as const, error: 'password_mismatch' as const })
    }
    if (next.password === current) return fail(400, { action: 'password' as const, error: 'password_unchanged' as const })

    if (!(await passwordIsCorrect(locals, user.email, current))) {
      return fail(400, { action: 'password' as const, error: 'wrong_password' as const })
    }

    const { error } = await locals.supabase.auth.updateUser({ password: next.password })
    if (error) return fail(500, { action: 'password' as const, error: 'error' as const })

    return { action: 'password' as const, success: true }
  },

  address: async ({ request, locals }) => {
    const user = await requireUser(locals)
    if (!addressLimiter.check(user.id)) return fail(429, { action: 'address' as const, error: 'rateLimited' as const })

    const result = validateAddress(await request.formData())
    if (!result.ok) {
      return fail(400, { action: 'address' as const, fieldErrors: result.errors, values: result.values })
    }

    // the user's own client: RLS allows exactly their row
    const { error } = await locals.supabase
      .from('billing_addresses')
      .upsert(toRow(user.id, result.address), { onConflict: 'user_id' })
    if (error) {
      return fail(500, {
        action: 'address' as const,
        error: 'error' as const,
        values: { ...result.address, company: result.address.company ?? '', vatId: result.address.vatId ?? '' },
      })
    }

    return { action: 'address' as const, success: true }
  },

  delete: async ({ request, locals }) => {
    const user = await requireUser(locals)
    if (!deleteLimiter.check(user.id)) return fail(429, { action: 'delete' as const, error: 'rateLimited' as const })

    const form = await request.formData()
    if (text(form, 'confirmation').trim().toUpperCase() !== ACCOUNT_DELETE_CONFIRM_WORD) {
      return fail(400, { action: 'delete' as const, error: 'confirm_required' as const })
    }
    const current = text(form, 'currentPassword')
    if (current.length === 0) return fail(400, { action: 'delete' as const, error: 'current_password_required' as const })

    if (!(await passwordIsCorrect(locals, user.email, current))) {
      return fail(400, { action: 'delete' as const, error: 'wrong_password' as const })
    }

    // security definer, deletes exactly auth.uid(); profile and address cascade
    const { error } = await locals.supabase.rpc('delete_own_account')
    if (error) return fail(500, { action: 'delete' as const, error: 'delete_failed' as const })

    // the user is gone; signOut may report that, but it clears the cookies either way
    await locals.supabase.auth.signOut().catch(() => {})
    redirect(303, '/?konto=geloescht')
  },
}
