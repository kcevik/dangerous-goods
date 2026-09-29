// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { GET } from '../src/routes/healthz/+server'

describe('GET /healthz', () => {
  it('answers ok without touching Supabase or the book', async () => {
    const locals = new Proxy({}, { get: () => { throw new Error('locals must not be used') } })
    const res = await GET({ locals } as never)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.text()).toBe('ok')
  })
})
