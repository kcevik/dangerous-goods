import { describe, expect, it, vi } from 'vitest'

const { status } = vi.hoisted(() => ({ status: { value: {} as Record<string, unknown> } }))
vi.mock('$lib/server/adrBook/index', () => ({ bookStatus: () => status.value }))
vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
vi.mock('$env/static/public', () => ({ PUBLIC_SUPABASE_URL: 'https://t.supabase.co', PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'k' }))

const { init } = await import('../src/hooks.server')

describe('hooks init (book warm-up at server start)', () => {
  it('logs a broken book loudly at boot', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    status.value = { state: 'failed', error: 'ADR book at /x is only 7 bytes' }
    await init()
    expect(error).toHaveBeenCalledWith('[adr-book] ADR book at /x is only 7 bytes')
    error.mockRestore()
  })

  it('stays quiet when no book is configured', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    status.value = { state: 'unconfigured' }
    await init()
    expect(error).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
    error.mockRestore()
    info.mockRestore()
  })
})
