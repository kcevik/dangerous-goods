// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWaitlist } from '~/composables/useWaitlist'

const fetchMock = vi.fn()

function filled() {
  const w = useWaitlist()
  w.name.value = 'Kerem'
  w.email.value = 'k@example.de'
  w.consent.value = true
  return w
}

describe('useWaitlist', () => {
  beforeEach(() => vi.stubGlobal('$fetch', fetchMock))
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('cannot submit without valid name, email and consent', async () => {
    const w = useWaitlist()
    expect(w.canSubmit.value).toBe(false)
    w.name.value = 'Kerem'
    w.email.value = 'not-an-email'
    w.consent.value = true
    expect(w.canSubmit.value).toBe(false)
    await w.submit()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(w.state.value).toBe('idle')
  })

  it('submits and reaches success state', async () => {
    fetchMock.mockResolvedValue({ status: 'ok' })
    const w = filled()
    expect(w.canSubmit.value).toBe(true)
    await w.submit()
    expect(fetchMock).toHaveBeenCalledWith('/api/waitlist', {
      method: 'POST',
      body: { name: 'Kerem', email: 'k@example.de', consent: true, website: '' },
    })
    expect(w.state.value).toBe('success')
  })

  it('maps already_registered', async () => {
    fetchMock.mockResolvedValue({ status: 'already_registered' })
    const w = filled()
    await w.submit()
    expect(w.state.value).toBe('already')
  })

  it('maps 429 to rateLimited', async () => {
    fetchMock.mockRejectedValue({ statusCode: 429 })
    const w = filled()
    await w.submit()
    expect(w.state.value).toBe('rateLimited')
  })

  it('maps other failures to error', async () => {
    fetchMock.mockRejectedValue({ statusCode: 500 })
    const w = filled()
    await w.submit()
    expect(w.state.value).toBe('error')
  })
})
