import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MIN_QUERY_LENGTH, SearchState } from '$lib/search/search.svelte'

interface Deferred {
  resolve: (value: { data: unknown[] | null, error: unknown }) => void
  orFilter: string
}

/**
 * Chainable mock of the supabase query builder used by SearchState:
 * from().select().or().order().limit() → Promise<{ data, error }>
 * Each call to limit() pushes a deferred so tests can resolve requests
 * out of order (race-condition testing).
 */
function createSupabaseMock() {
  const deferreds: Deferred[] = []
  let currentOr = ''

  const builder = {
    select: () => builder,
    or: (filter: string) => {
      currentOr = filter
      return builder
    },
    order: () => builder,
    limit: () =>
      new Promise((resolve) => {
        deferreds.push({ resolve: resolve as Deferred['resolve'], orFilter: currentOr })
      }),
  }

  const from = vi.fn(() => builder)
  return { client: { from } as unknown as SupabaseClient, from, deferreds }
}

const ROW = {
  un_number: '1203',
  name: 'BENZIN',
  name_en: 'PETROL',
  name_fr: 'ESSENCE',
  hazard_class: '3',
  packing_group: 'II',
}

// flush the debounce timer plus the async search it kicks off
async function runSearchTimer() {
  await vi.advanceTimersByTimeAsync(300)
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('SearchState', () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mock = createSupabaseMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not query below the minimum query length', async () => {
    const s = new SearchState(mock.client)
    s.query = 'B'
    await runSearchTimer()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.results).toEqual([])
  })

  it(`searches at ${MIN_QUERY_LENGTH} characters and maps results`, async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()

    expect(mock.from).toHaveBeenCalledWith('adr_entries')
    expect(mock.deferreds).toHaveLength(1)
    expect(mock.deferreds[0]!.orFilter).toContain('name.ilike.%Be%')
    expect(s.isLoading).toBe(true)

    mock.deferreds[0]!.resolve({ data: [ROW], error: null })
    await settle()

    expect(s.isLoading).toBe(false)
    expect(s.results).toEqual([{
      unNumber: '1203',
      name: 'BENZIN',
      nameEn: 'PETROL',
      nameFr: 'ESSENCE',
      hazardClass: '3',
      packingGroup: 'II',
    }])
  })

  it('adds a un_number prefix filter for numeric queries', async () => {
    const s = new SearchState(mock.client)
    s.query = '12'
    await runSearchTimer()
    expect(mock.deferreds[0]!.orFilter).toContain('un_number.ilike.12%')
  })

  it('does not add a un_number filter for text queries', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    expect(mock.deferreds[0]!.orFilter).not.toContain('un_number')
  })

  it('strips PostgREST delimiters from user input', async () => {
    const s = new SearchState(mock.client)
    s.query = 'a,b(c)d'
    await runSearchTimer()
    expect(mock.deferreds[0]!.orFilter).toContain('name.ilike.%abcd%')
    expect(mock.deferreds[0]!.orFilter).not.toContain('(c)')
  })

  it('loads the tool immediately for a 4-digit UN number without querying', async () => {
    const s = new SearchState(mock.client)
    s.query = '1203'
    await runSearchTimer()
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('ignores a slow stale response arriving after a newer one', async () => {
    const s = new SearchState(mock.client)

    s.query = 'Benz'
    await runSearchTimer()
    s.query = 'Benzi'
    await runSearchTimer()
    expect(mock.deferreds).toHaveLength(2)

    // newer request resolves first
    mock.deferreds[1]!.resolve({ data: [ROW], error: null })
    await settle()
    expect(s.results).toHaveLength(1)

    // stale request resolves afterwards with different data — must be ignored
    mock.deferreds[0]!.resolve({ data: [{ ...ROW, un_number: '9999' }], error: null })
    await settle()
    expect(s.results).toHaveLength(1)
    expect(s.results[0]!.unNumber).toBe('1203')
  })

  it('clears results when the query drops below the minimum length', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    mock.deferreds[0]!.resolve({ data: [ROW], error: null })
    await settle()
    expect(s.results).toHaveLength(1)

    s.query = 'B'
    await runSearchTimer()
    expect(s.results).toEqual([])
  })

  it('select() opens a UN and clears the result list', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    mock.deferreds[0]!.resolve({ data: [ROW], error: null })
    await settle()
    s.select('1203')
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
  })
})

describe('SearchState when locked', () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mock = createSupabaseMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('never queries for a text search', async () => {
    const s = new SearchState(mock.client, { locked: true })
    s.query = 'Benzin'
    await runSearchTimer()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('does not select a UN number for a 4-digit query', async () => {
    const s = new SearchState(mock.client, { locked: true })
    s.query = '1203'
    await runSearchTimer()
    expect(s.selectedUn).toBeNull()
  })

  it('exposes the locked flag', () => {
    expect(new SearchState(mock.client, { locked: true }).locked).toBe(true)
    expect(new SearchState(mock.client).locked).toBe(false)
  })
})
