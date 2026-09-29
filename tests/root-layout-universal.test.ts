import { describe, expect, it, vi } from 'vitest'

vi.mock('$env/static/public', () => ({ PUBLIC_SUPABASE_URL: 'http://sb.test', PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'pk' }))
vi.mock('@supabase/ssr', () => ({
  isBrowser: () => false,
  createServerClient: () => ({ kind: 'server' }),
  createBrowserClient: () => ({ kind: 'browser' }),
}))

const { load } = await import('../src/routes/+layout')

describe('root +layout.ts (universal)', () => {
  it('passes the server layout data through, including registrationOpen', async () => {
    const data = { cookies: [], session: null, user: null, isActive: false, registrationOpen: true }
    const result = await load({ fetch, data, depends: vi.fn() } as never)
    expect(result).toMatchObject({ session: null, user: null, isActive: false, registrationOpen: true })
    expect(result).toHaveProperty('supabase')
  })
})
