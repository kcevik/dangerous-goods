import { render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { load } from '../src/routes/+layout.server'
import RootLayout from '../src/routes/+layout.svelte'
import { createRawSnippet } from 'svelte'

const { invalidateMock } = vi.hoisted(() => ({ invalidateMock: vi.fn() }))
vi.mock('$app/navigation', () => ({ invalidate: invalidateMock }))

describe('root +layout.server load', () => {
  it('exposes cookies, session, a slim user and isActive from safeGetSession', async () => {
    const session = { access_token: 't', expires_at: 123 }
    const result = await load({
      cookies: { getAll: () => [{ name: 'a', value: 'b' }] },
      locals: {
        safeGetSession: async () => ({
          session,
          user: { id: 'u1', email: 'k@example.de', app_metadata: {}, user_metadata: {} },
          isActive: true,
        }),
      },
    } as never)
    expect(result).toEqual({
      cookies: [{ name: 'a', value: 'b' }],
      session,
      user: { id: 'u1', email: 'k@example.de' },
      isActive: true,
    })
  })

  it('returns null user and inactive when logged out', async () => {
    const result = await load({
      cookies: { getAll: () => [] },
      locals: { safeGetSession: async () => ({ session: null, user: null, isActive: false }) },
    } as never)
    expect(result).toMatchObject({ session: null, user: null, isActive: false })
  })
})

describe('root +layout.svelte', () => {
  function renderLayout(session: { expires_at: number } | null) {
    let callback: ((event: string, session: { expires_at: number } | null) => void) | undefined
    const supabase = {
      auth: {
        onAuthStateChange: vi.fn((cb: typeof callback) => {
          callback = cb
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
      },
    }
    const children = createRawSnippet(() => ({ render: () => '<p>child</p>' }))
    render(RootLayout, { props: { data: { supabase, session } as never, children } })
    return { fire: (s: { expires_at: number } | null) => callback?.('SIGNED_IN', s) }
  }

  it('renders its children', () => {
    renderLayout(null)
    expect(document.body).toHaveTextContent('child')
  })

  it('invalidates supabase:auth when the session expiry changes', () => {
    invalidateMock.mockClear()
    const { fire } = renderLayout({ expires_at: 1 })
    fire({ expires_at: 2 })
    expect(invalidateMock).toHaveBeenCalledWith('supabase:auth')
  })

  it('does not invalidate when the session is unchanged', () => {
    invalidateMock.mockClear()
    const { fire } = renderLayout({ expires_at: 1 })
    fire({ expires_at: 1 })
    expect(invalidateMock).not.toHaveBeenCalled()
  })
})
