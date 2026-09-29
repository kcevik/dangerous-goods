import { describe, expect, it, vi } from 'vitest'
import { createBookFetchers } from '$lib/regulations/bookFetch'

function fakeFetch(status = 200, body: unknown = { ok: true }) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }))
}

describe('createBookFetchers', () => {
  it('builds the window, search and code-hit URLs under the base path', async () => {
    const fetchFn = fakeFetch()
    const deps = createBookFetchers('/regelwerk/adr', fetchFn as never)
    await deps.fetchWindow({ line: 12 })
    await deps.fetchWindow({ line: 12, dir: -1 })
    await deps.searchText('Tank & Co')
    await deps.fetchCodeHits({ kind: 'sv', code: '640D' }, true)
    await deps.fetchCodeHits({ kind: 'un', code: '1203' }, false)
    expect(fetchFn.mock.calls.map(call => (call as unknown[])[0])).toEqual([
      '/regelwerk/adr/window?line=12',
      '/regelwerk/adr/window?line=12&dir=-1',
      '/regelwerk/adr/search?q=Tank%20%26%20Co',
      '/regelwerk/adr/search?sv=640D&all=1',
      '/regelwerk/adr/search?un=1203',
    ])
  })

  it('rejects on a non-2xx answer such as the 403 lock', async () => {
    const deps = createBookFetchers('/regelwerk/adr', fakeFetch(403, { error: 'locked' }) as never)
    await expect(deps.fetchWindow({ line: 1 })).rejects.toThrow('403')
  })
})
