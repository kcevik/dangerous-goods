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
  return { ...actual, windowAt: vi.fn(actual.windowAt) }
})

const { buildBookIndex } = await import('$lib/server/adrBook/index')
const { windowAt } = await import('$lib/server/adrBook/api')
const { GET } = await import('../src/routes/(app)/regelwerk/[mode=bookMode]/window/+server')

const fixtureIndex = buildBookIndex(readFileSync(join(process.cwd(), 'tests/fixtures/adr-book-sample.md'), 'utf8').split('\n'))

async function call(search: string, opts: Parameters<typeof makeBookEvent>[0] = {}) {
  const res = await GET(makeBookEvent({ path: '/regelwerk/adr/window', search, ...opts }) as never)
  return { status: res.status, body: await res.json() }
}

beforeEach(() => {
  getBookIndex.mockReset().mockReturnValue(fixtureIndex)
  vi.mocked(windowAt).mockClear()
})

describe('GET /regelwerk/adr/window', () => {
  it('answers 401 without a session and never touches the book', async () => {
    const { status } = await call('?line=5', { session: false })
    expect(status).toBe(401)
    expect(getBookIndex).not.toHaveBeenCalled()
  })

  it('answers 403 locked for an account that is not activated, without touching the book', async () => {
    const { status, body } = await call('?line=5', { isActive: false })
    expect(status).toBe(403)
    expect(body).toEqual({ error: 'locked' })
    expect(getBookIndex).not.toHaveBeenCalled()
  })

  it.each(['', '?line=', '?line=abc', '?line=0', '?line=-3', '?line=1.5', '?line=999999', '?line=5&dir=2'])(
    'answers 400 for malformed input %s',
    async (search) => {
      const { status } = await call(search)
      expect(status).toBe(400)
    },
  )

  it('returns a rendered window around the line', async () => {
    const { status, body } = await call('?line=20')
    expect(status).toBe(200)
    expect(body.lineStart).toBeLessThanOrEqual(20)
    expect(body.lineEnd).toBeGreaterThanOrEqual(20)
    expect(typeof body.html).toBe('string')
    expect(Array.isArray(body.headings)).toBe(true)
    expect(windowAt).toHaveBeenCalledWith(fixtureIndex, 20)
  })

  it('reads forward from the line with dir=1 and backward with dir=-1', async () => {
    await call('?line=20&dir=1')
    expect(windowAt).toHaveBeenLastCalledWith(fixtureIndex, 20, 0, 300)
    await call('?line=20&dir=-1')
    expect(windowAt).toHaveBeenLastCalledWith(fixtureIndex, 20, 300, 0)
  })

  it('answers 429 after 120 requests per minute from one address', async () => {
    const ip = freshIp()
    for (let i = 0; i < 120; i++) {
      expect((await call('?line=5', { ip })).status).toBe(200)
    }
    const { status, body } = await call('?line=5', { ip })
    expect(status).toBe(429)
    expect(body).toEqual({ error: 'rateLimited' })
  })
})
