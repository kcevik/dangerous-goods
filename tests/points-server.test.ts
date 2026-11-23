// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshIp } from './helpers/bookEvent'

const getBookIndex = vi.fn()
vi.mock('$lib/server/adrBook/index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/adrBook/index')>()
  return { ...actual, getBookIndex }
})

const { load } = await import('../src/routes/(app)/tools/1000-punkte/+page.server')
const { GET } = await import('../src/routes/(app)/tools/1000-punkte/eintrag/+server')

function stubSupabase(response: { data: unknown[] | null, error: unknown }) {
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ order: () => Promise.resolve(response) }) }),
  }))
  return { client: { from } as unknown as SupabaseClient, from }
}

beforeEach(() => {
  getBookIndex.mockReset().mockReturnValue({ headings: [{ sectionNo: '1.1.3.6.3' }, { sectionNo: '8.3.3' }, { sectionNo: '9.9.9' }] })
})

describe('/tools/1000-punkte load', () => {
  type Loaded = { locked: boolean, linkedSections?: string[] }
  const run = async (isActive: boolean) => await load({ parent: async () => ({ isActive }) } as never) as Loaded

  it('locked: returns only the lock marker and touches nothing', async () => {
    expect(await run(false)).toEqual({ locked: true })
    expect(getBookIndex).not.toHaveBeenCalled()
  })

  it('active: returns the referenced sections that are headings in the book', async () => {
    const data = await run(true)
    expect(data.locked).toBe(false)
    expect(data.linkedSections).toEqual(expect.arrayContaining(['1.1.3.6.3', '8.3.3']))
    expect(data.linkedSections).not.toContain('9.9.9') // not referenced by the page
  })

  it('active without a book: no links, but the calculator still loads', async () => {
    getBookIndex.mockImplementation(() => {
      throw new Error('ADR_BOOK_PATH is not set')
    })
    expect(await run(true)).toEqual({ locked: false, linkedSections: [] })
  })
})

describe('GET /tools/1000-punkte/eintrag', () => {
  function event(opts: { un?: string, session?: boolean, isActive?: boolean, client?: SupabaseClient, ip?: string }) {
    const url = new URL(`http://localhost/tools/1000-punkte/eintrag${opts.un === undefined ? '' : `?un=${opts.un}`}`)
    const signedIn = opts.session ?? true
    return {
      url,
      getClientAddress: () => opts.ip ?? freshIp(),
      locals: {
        supabase: opts.client ?? stubSupabase({ data: [], error: null }).client,
        safeGetSession: async () => signedIn
          ? { session: {}, user: { id: 'u1' }, isActive: opts.isActive ?? true }
          : { session: null, user: null, isActive: false },
      },
    } as never
  }

  it('401 without a session, before any query', async () => {
    const { client, from } = stubSupabase({ data: [], error: null })
    const res = await GET(event({ un: '1203', session: false, client }))
    expect(res.status).toBe(401)
    expect(from).not.toHaveBeenCalled()
  })

  it('403 for a locked account, before any query', async () => {
    const { client, from } = stubSupabase({ data: [], error: null })
    const res = await GET(event({ un: '1203', isActive: false, client }))
    expect(res.status).toBe(403)
    expect(from).not.toHaveBeenCalled()
  })

  it('400 for anything but a 4-digit UN number', async () => {
    for (const un of [undefined, '12', '12345', 'abcd']) {
      const { client, from } = stubSupabase({ data: [], error: null })
      expect((await GET(event({ un, client }))).status).toBe(400)
      expect(from).not.toHaveBeenCalled()
    }
  })

  it('returns the mapped ADR rows for an active account', async () => {
    const { client, from } = stubSupabase({
      data: [{ un_number: '1203', sequence_number: 1, name: 'BENZIN', transport_category: '2', multiplier: 3 }],
      error: null,
    })
    const res = await GET(event({ un: '1203', client }))
    expect(res.status).toBe(200)
    expect(from).toHaveBeenCalledWith('adr_entries')
    const body = await res.json()
    expect(body.entries[0]).toMatchObject({ unNumber: '1203', name: 'BENZIN', transportCategory: '2', multiplier: '3' })
  })

  it('a database failure is a 500, never an empty list', async () => {
    const { client } = stubSupabase({ data: null, error: { message: 'down' } })
    const res = await GET(event({ un: '1203', client }))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'lookupFailed' })
  })

  it('rate-limits per client address', async () => {
    const ip = freshIp()
    let last = 200
    for (let i = 0; i < 121; i++) last = (await GET(event({ un: '1203', ip }))).status
    expect(last).toBe(429)
  })
})
