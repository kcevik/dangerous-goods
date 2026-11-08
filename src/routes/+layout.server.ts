import { registrationMode } from '$lib/server/registrationMode'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  const { session, user, isActive } = await locals.safeGetSession()
  return {
    cookies: cookies.getAll(),
    // only the expiry: the client compares it to spot a refreshed session. Reading
    // session.user here (also implicitly, by serialising the whole object) makes Supabase warn,
    // and the tokens need not travel as page data.
    session: session ? { expires_at: session.expires_at } : null,
    // only what the UI needs — never ship the full auth user object to the client
    user: user ? { id: user.id, email: user.email ?? '' } : null,
    isActive,
    // pre-launch: "Registrieren" collects launch notifications unless this is true
    registrationOpen: registrationMode() === 'open',
  }
}
