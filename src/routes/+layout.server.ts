import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  const { session, user, isActive } = await locals.safeGetSession()
  return {
    cookies: cookies.getAll(),
    session,
    // only what the UI needs — never ship the full auth user object to the client
    user: user ? { id: user.id, email: user.email ?? '' } : null,
    isActive,
  }
}
