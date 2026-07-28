// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { MIN_QUERY_LENGTH, useSearch } from '~/composables/useSearch'

const { supabaseClientMock } = vi.hoisted(() => ({ supabaseClientMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => supabaseClientMock)

interface Deferred {
  resolve: (value: { data: unknown[] | null, error: unknown }) => void
  orFilter: string
}

/**
 * Chainable mock of the supabase query builder used by useSearch:
 * from().select().or().order().limit() → Promise<{ data, error }>
 * Each call to limit() pops the next deferred so tests can resolve
 * requests out of order (race-condition testing).
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
  return { client: { from }, from, deferreds }
}

const ROW = {
  un_number: '1203',
  name: 'BENZIN',
  name_en: 'PETROL',
  name_fr: 'ESSENCE',
  hazard_class: '3',
  packing_group: 'II',
}

// flush the debounce timer plus the async search() it kicks off
async function runSearchTimer() {
  await nextTick()
  vi.advanceTimersByTime(300)
  await Promise.resolve()
  await Promise.resolve()
}

describe('useSearch', () => {
  let mock: ReturnType<typeof createSupabaseMock>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mock = createSupabaseMock()
    supabaseClientMock.mockReturnValue(mock.client)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not query below the minimum query length', async () => {
    const { query, results } = useSearch()
    query.value = 'B'
    await runSearchTimer()
    expect(mock.from).not.toHaveBeenCalled()
    expect(results.value).toEqual([])
  })

  it(`searches at ${MIN_QUERY_LENGTH} characters and maps results`, async () => {
    const { query, results, isLoading } = useSearch()
    query.value = 'Be'
    await runSearchTimer()

    expect(mock.from).toHaveBeenCalledWith('adr_entries')
    expect(mock.deferreds).toHaveLength(1)
    expect(mock.deferreds[0]!.orFilter).toContain('name.ilike.%Be%')
    expect(isLoading.value).toBe(true)

    mock.deferreds[0]!.resolve({ data: [ROW], error: null })
    await Promise.resolve()
    await Promise.resolve()

    expect(isLoading.value).toBe(false)
    expect(results.value).toEqual([{
      unNumber: '1203',
      name: 'BENZIN',
      nameEn: 'PETROL',
      nameFr: 'ESSENCE',
      hazardClass: '3',
      packingGroup: 'II',
    }])
  })

  it('adds a un_number prefix filter for numeric queries', async () => {
    const { query } = useSearch()
    query.value = '12'
    await runSearchTimer()
    expect(mock.deferreds[0]!.orFilter).toContain('un_number.ilike.12%')
  })

  it('does not add a un_number filter for text queries', async () => {
    const { query } = useSearch()
    query.value = 'Benzin'
    await runSearchTimer()
    expect(mock.deferreds[0]!.orFilter).not.toContain('un_number')
  })

  it('strips PostgREST delimiters from user input', async () => {
    const { query } = useSearch()
    query.value = 'a,b(c)d'
    await runSearchTimer()
    expect(mock.deferreds[0]!.orFilter).toContain('name.ilike.%abcd%')
    expect(mock.deferreds[0]!.orFilter).not.toContain('(c)')
  })

  it('loads the tool immediately for a 4-digit UN number without querying', async () => {
    const { query, selectedUn, results } = useSearch()
    query.value = '1203'
    await runSearchTimer()
    expect(selectedUn.value).toBe('1203')
    expect(results.value).toEqual([])
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('ignores a slow stale response arriving after a newer one', async () => {
    const { query, results } = useSearch()

    query.value = 'Benz'
    await runSearchTimer()
    query.value = 'Benzi'
    await runSearchTimer()
    expect(mock.deferreds).toHaveLength(2)

    // newer request resolves first
    mock.deferreds[1]!.resolve({ data: [ROW], error: null })
    await Promise.resolve()
    await Promise.resolve()
    expect(results.value).toHaveLength(1)

    // stale request resolves afterwards with different data — must be ignored
    mock.deferreds[0]!.resolve({ data: [{ ...ROW, un_number: '9999' }], error: null })
    await Promise.resolve()
    await Promise.resolve()
    expect(results.value).toHaveLength(1)
    expect(results.value[0]!.unNumber).toBe('1203')
  })

  it('clears results when the query drops below the minimum length', async () => {
    const { query, results } = useSearch()
    query.value = 'Be'
    await runSearchTimer()
    mock.deferreds[0]!.resolve({ data: [ROW], error: null })
    await Promise.resolve()
    await Promise.resolve()
    expect(results.value).toHaveLength(1)

    query.value = 'B'
    await runSearchTimer()
    expect(results.value).toEqual([])
  })
})
