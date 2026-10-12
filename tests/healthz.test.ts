// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

const { status } = vi.hoisted(() => ({ status: { value: { state: 'ready', lines: 1 } as Record<string, unknown> } }))
vi.mock('$lib/server/adrBook/index', () => ({ bookStatus: () => status.value }))

const { GET } = await import('../src/routes/healthz/+server')

describe('GET /healthz', () => {
  it('fails health when the configured book cannot be loaded, without leaking the reason', async () => {
    status.value = { state: 'failed', error: 'ADR book not found at /var/lib/gefahrgut/secret-path.md' }
    const res = await GET({} as never)
    expect(res.status).toBe(503)
    const body = await res.text()
    expect(body).toBe('book unavailable')
    expect(body).not.toContain('/var/lib')
    status.value = { state: 'ready', lines: 1 }
  })

  it('stays healthy when no book is configured (the viewer is simply off)', async () => {
    status.value = { state: 'unconfigured' }
    expect((await GET({} as never)).status).toBe(200)
    status.value = { state: 'ready', lines: 1 }
  })

  it('answers ok without touching Supabase', async () => {
    const locals = new Proxy({}, { get: () => { throw new Error('locals must not be used') } })
    const res = await GET({ locals } as never)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toBe('ok')
  })
})
