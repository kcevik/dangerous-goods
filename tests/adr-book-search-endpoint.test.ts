// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshIp, makeBookEvent } from './helpers/bookEvent'

const getBookIndex = vi.fn()
vi.mock('$lib/server/adrBook/index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/adrBook/index')>()
  return { ...actual, getBookIndex }
})
vi.mock('$lib/server/adrBook/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/adrBook/api')>()
  return { ...actual, hitsFor: vi.fn(actual.hitsFor) }
})

const { buildBookIndex } = await import('$lib/server/adrBook/index')
const { hitsFor } = await import('$lib/server/adrBook/api')
const { GET } = await import('../src/routes/(app)/regelwerk/[mode=bookMode]/search/+server')

const fixtureIndex = buildBookIndex(readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8').split('\n'))

async function call(search: string, opts: Parameters<typeof makeBookEvent>[0] = {}) {
  const res = await GET(makeBookEvent({ path: '/regelwerk/adr/search', search, ...opts }) as never)
  return { status: res.status, body: await res.json() }
}

beforeEach(() => {
  getBookIndex.mockReset().mockReturnValue(fixtureIndex)
  vi.mocked(hitsFor).mockClear()
})

describe('GET /regelwerk/adr/search', () => {
  it('answers 401 without a session and never touches the book', async () => {
    const { status } = await call('?q=Tank', { session: false })
    expect(status).toBe(401)
    expect(getBookIndex).not.toHaveBeenCalled()
  })

  it('answers 403 locked for an account that is not activated, without touching the book', async () => {
    const { status, body } = await call('?q=Tank', { isActive: false })
    expect(status).toBe(403)
    expect(body).toEqual({ error: 'locked' })
    expect(getBookIndex).not.toHaveBeenCalled()
  })

  it.each(['', '?q=B', `?q=${'x'.repeat(121)}`, '?sv=abc', '?sv=12345', '?un=12', '?un=1203a', '?q=Tank&limit=0'])(
    'answers 400 for malformed input %s',
    async (search) => {
      const { status } = await call(search)
      expect(status).toBe(400)
    },
  )

  it('finds free text and reports the total', async () => {
    const { status, body } = await call('?q=Additivierungseinrichtungen')
    expect(status).toBe(200)
    expect(body.hits.length).toBeGreaterThan(0)
    expect(body.total).toBe(body.hits.length)
    expect(body.capped).toBe(false)
  })

  it('answers code hits from the index for sv and un, passing the incidental flag', async () => {
    const sv = await call('?sv=163')
    expect(sv.status).toBe(200)
    expect(sv.body.hits[0].rank).toBe(1)
    expect(hitsFor).toHaveBeenLastCalledWith(fixtureIndex, 'sv', '163', { includeIncidental: false, limit: 500 })

    await call('?un=1203&all=1')
    expect(hitsFor).toHaveBeenLastCalledWith(fixtureIndex, 'un', '1203', { includeIncidental: true, limit: 500 })
  })

  it('honours a smaller limit', async () => {
    const { body } = await call('?q=Tank&limit=1')
    expect(body.hits.length).toBeLessThanOrEqual(1)
  })

  it('answers 429 after 60 requests per minute from one address', async () => {
    const ip = freshIp()
    for (let i = 0; i < 60; i++) {
      expect((await call('?sv=163', { ip })).status).toBe(200)
    }
    const { status, body } = await call('?sv=163', { ip })
    expect(status).toBe(429)
    expect(body).toEqual({ error: 'rateLimited' })
  })
})
