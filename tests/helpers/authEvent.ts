import type { RequestEvent } from '@sveltejs/kit'
import { vi } from 'vitest'

let ipCounter = 0

export interface AuthMock {
  signInWithPassword: ReturnType<typeof vi.fn>
  signUp: ReturnType<typeof vi.fn>
  resetPasswordForEmail: ReturnType<typeof vi.fn>
  updateUser: ReturnType<typeof vi.fn>
  verifyOtp: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
}

export function createAuthMock(): AuthMock {
  return {
    signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
    signUp: vi.fn(async () => ({ data: {}, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(async () => ({ data: {}, error: null })),
    verifyOtp: vi.fn(async () => ({ data: {}, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  }
}

/** A fabricated RequestEvent for calling form actions / endpoints directly. */
export function makeAuthEvent(opts: {
  fields?: Record<string, string>
  auth?: AuthMock
  session?: object | null
  ip?: string
  path?: string
  search?: string
} = {}) {
  const auth = opts.auth ?? createAuthMock()
  const formData = new FormData()
  for (const [k, v] of Object.entries(opts.fields ?? {})) formData.set(k, v)
  const url = new URL(`http://localhost${opts.path ?? '/'}${opts.search ?? ''}`)
  const request = new Request(url, { method: 'POST', body: formData })
  const session = opts.session ?? null
  const event = {
    request,
    url,
    getClientAddress: () => opts.ip ?? `10.1.0.${++ipCounter}`,
    locals: {
      supabase: { auth },
      safeGetSession: async () => session
        ? { session, user: { id: 'u1', email: 'k@example.de' }, isActive: false }
        : { session: null, user: null, isActive: false },
    },
  } as unknown as RequestEvent
  return { event, auth }
}
