import type { RequestEvent } from '@sveltejs/kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface Scenario {
  session?: { access_token: string, expires_at: number } | null
  user?: { id: string, email: string } | null
  userError?: boolean
  activatedAt?: string | null
}

const { scenario, createServerClientMock } = vi.hoisted(() => {
  const scenario: Scenario = {}
  const createServerClientMock = vi.fn(() => ({
    auth: {
      getSession: async () => ({ data: { session: scenario.session ?? null } }),
      getUser: async () => scenario.userError
        ? { data: { user: null }, error: new Error('bad token') }
        : { data: { user: scenario.user ?? null }, error: null },
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: table === 'profiles' && scenario.user ? { activated_at: scenario.activatedAt ?? null } : null,
            error: null,
          }),
        }),
      }),
    }),
  }))
  return { scenario, createServerClientMock }
})

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'key',
}))

import { handle } from '../src/hooks.server'

const SESSION = { access_token: 't', expires_at: 9999999999 }
const USER = { id: 'user-1', email: 'k@example.de' }

function makeEvent(path: string, routeId: string | null) {
  const locals: Record<string, unknown> = {}
  return {
    cookies: { getAll: () => [], set: vi.fn() },
    locals,
    route: { id: routeId },
    url: new URL(`http://localhost${path}`),
    setHeaders: vi.fn(),
  } as unknown as RequestEvent
}

const resolve = vi.fn(async () => new Response('ok'))

async function run(path: string, routeId: string | null) {
  const event = makeEvent(path, routeId)
  const response = await handle({ event, resolve })
  return { event, response }
}

beforeEach(() => {
  scenario.session = null
  scenario.user = null
  scenario.userError = false
  scenario.activatedAt = null
  resolve.mockClear()
})

describe('safeGetSession', () => {
  it('returns no session and inactive when there is no cookie session', async () => {
    const { event } = await run('/', '/')
    expect(await event.locals.safeGetSession()).toEqual({ session: null, user: null, isActive: false })
  })

  it('treats a session whose JWT fails validation as no session', async () => {
    scenario.session = SESSION
    scenario.userError = true
    const { event } = await run('/', '/')
    expect(await event.locals.safeGetSession()).toEqual({ session: null, user: null, isActive: false })
  })

  it('is inactive for a validated user without activated_at', async () => {
    scenario.session = SESSION
    scenario.user = USER
    const { event } = await run('/', '/')
    const result = await event.locals.safeGetSession()
    expect(result.user).toEqual(USER)
    expect(result.isActive).toBe(false)
  })

  it('is active once activated_at is set', async () => {
    scenario.session = SESSION
    scenario.user = USER
    scenario.activatedAt = '2026-09-04T12:00:00Z'
    const { event } = await run('/', '/')
    expect((await event.locals.safeGetSession()).isActive).toBe(true)
  })
})

describe('authGuard', () => {
  it('redirects anonymous visitors of (app) routes to login with next', async () => {
    await expect(run('/dashboard', '/(app)/dashboard')).rejects.toMatchObject({
      status: 303,
      location: '/login?next=%2Fdashboard',
    })
  })

  it('keeps the query string in next', async () => {
    await expect(run('/suche?q=Benzin', '/(app)/suche')).rejects.toMatchObject({
      status: 303,
      location: `/login?next=${encodeURIComponent('/suche?q=Benzin')}`,
    })
  })

  it('lets authenticated users into (app) routes', async () => {
    scenario.session = SESSION
    scenario.user = USER
    const { response } = await run('/dashboard', '/(app)/dashboard')
    expect(response.status).toBe(200)
    expect(resolve).toHaveBeenCalled()
  })

  it('sends authenticated users away from login and register', async () => {
    scenario.session = SESSION
    scenario.user = USER
    await expect(run('/login', '/(auth)/login')).rejects.toMatchObject({ status: 303, location: '/dashboard' })
    await expect(run('/registrieren', '/(auth)/registrieren')).rejects.toMatchObject({ status: 303, location: '/dashboard' })
  })

  it('never redirects the landing page or auth routes for anonymous visitors', async () => {
    expect((await run('/', '/')).response.status).toBe(200)
    expect((await run('/login', '/(auth)/login')).response.status).toBe(200)
    expect((await run('/auth/confirm', '/auth/confirm')).response.status).toBe(200)
  })
})
