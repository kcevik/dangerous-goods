import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      // SvelteKit's cookie API requires `path`; '/' replicates standard behaviour.
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      },
    },
  })

  /**
   * getSession() only reads the cookie; getUser() validates the JWT against
   * Supabase Auth. Never trust the session alone on the server.
   * isActive = the user's profile has activated_at set (manual activation).
   */
  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null, isActive: false }

    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error || !user) return { session: null, user: null, isActive: false }

    const { data: profile } = await event.locals.supabase
      .from('profiles')
      .select('activated_at')
      .eq('id', user.id)
      .maybeSingle()

    return { session, user, isActive: !!profile?.activated_at }
  }

  await authGuard(event)

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

/** (app) routes need a session; logged-in users have no business on login/register. */
async function authGuard(event: Parameters<Handle>[0]['event']): Promise<void> {
  const routeId = event.route.id ?? ''
  const isAppRoute = routeId.startsWith('/(app)')
  const isEntryRoute = routeId === '/(auth)/login' || routeId === '/(auth)/registrieren'

  if (isAppRoute || isEntryRoute) {
    const { session } = await event.locals.safeGetSession()
    if (isAppRoute && !session) {
      const next = event.url.pathname + event.url.search
      redirect(303, `/login?next=${encodeURIComponent(next)}`)
    }
    if (isEntryRoute && session) {
      redirect(303, '/dashboard')
    }
  }
}
