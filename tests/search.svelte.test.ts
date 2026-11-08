import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_RESULTS, mergeSearchRows, MIN_QUERY_LENGTH, SearchState } from '$lib/search/search.svelte'

type Row = Record<string, unknown>
interface Res { data: Row[] | null, error: unknown }
interface Call {
  table: string
  columns: string
  orFilter: string
  resolve: (value: Res) => void
  reject: (reason: unknown) => void
}

const TABLES = ['adr_entries', 'rid_entries', 'imdg_entries', 'icao_entries']

/**
 * One chainable builder per from() call: from(table).select(cols).or(filter).order().limit()
 * → deferred promise. `calls` records them in order, four per search.
 */
function createSupabaseMock() {
  const calls: Call[] = []
  const from = vi.fn((table: string) => {
    const call = { table, columns: '', orFilter: '' } as Call
    const builder = {
      select: (columns: string) => { call.columns = columns; return builder },
      or: (filter: string) => { call.orFilter = filter; return builder },
      order: () => builder,
      limit: () => new Promise<Res>((resolve, reject) => {
        call.resolve = resolve
        call.reject = reject
        calls.push(call)
      }),
    }
    return builder
  })
  return { client: { from } as unknown as SupabaseClient, from, calls }
}

function batch(calls: Call[], n: number): Call[] {
  return calls.slice(n * 4, n * 4 + 4)
}

function resolveBatch(calls: Call[], n: number, rows: Partial<Record<string, Row[]>>, errors: Partial<Record<string, unknown>> = {}) {
  for (const c of batch(calls, n)) {
    c.resolve(errors[c.table] ? { data: null, error: errors[c.table] } : { data: rows[c.table] ?? [], error: null })
  }
}

const ADR_1203 = { un_number: '1203', name: 'BENZIN', name_en: 'MOTOR SPIRIT', name_fr: 'ESSENCE', hazard_class: '3', packing_group: 'II' }
const ADR_1203_B = { un_number: '1203', name: 'OTTOKRAFTSTOFF', name_en: 'GASOLINE', name_fr: null, hazard_class: '3', packing_group: 'II' }
const ADR_1203_C = { un_number: '1203', name: null, name_en: 'PETROL', name_fr: null, hazard_class: '3', packing_group: 'II' }
const ICAO_1203 = { un_number: '1203', name: 'Petrol', hazard_class: '3', packing_group: 'II' }

async function runSearchTimer() {
  await vi.advanceTimersByTimeAsync(300)
}

async function settle() {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

describe('mergeSearchRows', () => {
  it('lists each UN number once with all names, packing groups and modes', () => {
    const results = mergeSearchRows('benz', {
      ADR: [ADR_1203, ADR_1203_B, ADR_1203_C],
      ICAO: [ICAO_1203],
    })
    expect(results).toEqual([{
      unNumber: '1203',
      primaryName: 'BENZIN',
      otherNames: ['MOTOR SPIRIT', 'ESSENCE', 'OTTOKRAFTSTOFF', 'GASOLINE', 'PETROL'],
      hazardClass: '3',
      packingGroups: ['II'],
      modes: ['ADR', 'ICAO'],
    }])
  })

  it('uses the name that matched as the primary name', () => {
    const [r] = mergeSearchRows('petrol', { ADR: [ADR_1203, ADR_1203_C], ICAO: [ICAO_1203] })
    expect(r!.primaryName).toBe('PETROL')
    expect(r!.otherNames).not.toContain('Petrol')
  })

  it('sorts packing groups I < II < III', () => {
    const rows = ['III', 'I', 'II', 'III'].map(pg => ({ un_number: '1993', name: 'ENTZÜNDBARER FLÜSSIGER STOFF', packing_group: pg }))
    expect(mergeSearchRows('entz', { ADR: rows })[0]!.packingGroups).toEqual(['I', 'II', 'III'])
  })

  it('ranks UN prefix, then names starting with the query, then names containing it', () => {
    const results = mergeSearchRows('12', {
      ADR: [
        { un_number: '3000', name: 'X 12 CONTAINS' },
        { un_number: '2000', name: '12 STARTS' },
        { un_number: '1203', name: 'BENZIN' },
      ],
    })
    expect(results.map(r => r.unNumber)).toEqual(['1203', '2000', '3000'])
  })

  it('breaks ties by UN number and caps the list', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ un_number: String(3000 - i), name: 'ACID' }))
    const results = mergeSearchRows('acid', { ADR: rows })
    expect(results).toHaveLength(MAX_RESULTS)
    expect(results[0]!.unNumber).toBe('2971')
  })

  it('takes the class from the first mode that has one', () => {
    const [r] = mergeSearchRows('x', { RID: [{ un_number: '1', name: 'X', hazard_class: '8' }], IMDG: [{ un_number: '1', name: 'X', hazard_class: '9' }] })
    expect(r!.hazardClass).toBe('8')
  })
})

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

  it(`queries all four mode tables at ${MIN_QUERY_LENGTH} characters`, async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()

    expect(mock.calls.map(c => c.table)).toEqual(TABLES)
    const adr = mock.calls[0]!
    expect(adr.orFilter).toBe('name.ilike.%Be%,name_en.ilike.%Be%,name_fr.ilike.%Be%')
    expect(adr.columns).toBe('un_number, hazard_class, packing_group, name, name_en, name_fr')
    expect(mock.calls[2]!.orFilter).toBe('name.ilike.%Be%,name_en.ilike.%Be%')
    expect(mock.calls[3]!.orFilter).toBe('name.ilike.%Be%')
    expect(s.isLoading).toBe(true)

    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203], icao_entries: [ICAO_1203] })
    await settle()

    expect(s.isLoading).toBe(false)
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
    expect(s.results[0]!.modes).toEqual(['ADR', 'ICAO'])
  })

  it('adds a un_number prefix filter to every table for numeric queries', async () => {
    const s = new SearchState(mock.client)
    s.query = '12'
    await runSearchTimer()
    for (const c of mock.calls) expect(c.orFilter).toContain('un_number.ilike.12%')
  })

  it('does not add a un_number filter for text queries', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    for (const c of mock.calls) expect(c.orFilter).not.toContain('un_number')
  })

  it('strips PostgREST delimiters and LIKE wildcards from user input', async () => {
    const s = new SearchState(mock.client)
    s.query = 'a,b(c)d%e*f_g\\h'
    await runSearchTimer()
    expect(mock.calls[0]!.orFilter).toContain('name.ilike.%abcdefgh%')
  })

  it('loads the tool immediately for a 4-digit UN number without querying', async () => {
    const s = new SearchState(mock.client)
    s.query = '1203'
    await runSearchTimer()
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('reports an error and no results when one table fails', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] }, { imdg_entries: { message: 'down' } })
    await settle()
    expect(s.searchError).toBe(true)
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('reports an error when a query rejects', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    const [first, ...rest] = batch(mock.calls, 0)
    first!.reject(new Error('network'))
    for (const c of rest) c.resolve({ data: [], error: null })
    await settle()
    expect(s.searchError).toBe(true)
  })

  it('treats data: null without an error as an empty table', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    for (const c of batch(mock.calls, 0)) c.resolve({ data: c.table === 'adr_entries' ? [ADR_1203] : null, error: null })
    await settle()
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
  })

  it('retry() runs the current query again and clears the error on success', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'down' } })
    await settle()
    expect(s.searchError).toBe(true)

    s.retry()
    await settle()
    expect(batch(mock.calls, 1)).toHaveLength(4)
    resolveBatch(mock.calls, 1, { adr_entries: [ADR_1203] })
    await settle()
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
  })

  it('clears the error as soon as the query changes', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'down' } })
    await settle()
    s.query = 'Benzi'
    expect(s.searchError).toBe(false)
  })

  it('ignores a stale failure arriving after a newer success', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benz'
    await runSearchTimer()
    s.query = 'Benzi'
    await runSearchTimer()

    resolveBatch(mock.calls, 1, { adr_entries: [ADR_1203] })
    await settle()
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'late' } })
    await settle()

    expect(s.searchError).toBe(false)
    expect(s.results[0]!.unNumber).toBe('1203')
  })

  it('ignores a slow stale response arriving after a newer one', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benz'
    await runSearchTimer()
    s.query = 'Benzi'
    await runSearchTimer()

    resolveBatch(mock.calls, 1, { adr_entries: [ADR_1203] })
    await settle()
    resolveBatch(mock.calls, 0, { adr_entries: [{ ...ADR_1203, un_number: '9999' }] })
    await settle()
    expect(s.results).toHaveLength(1)
    expect(s.results[0]!.unNumber).toBe('1203')
  })

  it('clears results when the query drops below the minimum length', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] })
    await settle()
    expect(s.results).toHaveLength(1)

    s.query = 'B'
    await runSearchTimer()
    expect(s.results).toEqual([])
  })

  it('discards an in-flight response when the query switches to a 4-digit UN number (review fix)', async () => {
    const s = new SearchState(mock.client)
    s.query = '120'
    await runSearchTimer()
    s.query = '1203'
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] })
    await settle()
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('discards a late failure arriving during the debounce of a newer query (review fix)', async () => {
    const s = new SearchState(mock.client)
    s.query = 'abc'
    await runSearchTimer()
    s.query = 'abcd'
    resolveBatch(mock.calls, 0, {}, { adr_entries: { message: 'late' } })
    await settle()
    expect(s.searchError).toBe(false)
  })

  it('treats a query that sanitizes below the minimum as not yet searchable (review fix)', async () => {
    const s = new SearchState(mock.client)
    s.query = '%%'
    await runSearchTimer()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.belowMinimum).toBe(true)
    s.query = 'a"b'
    await runSearchTimer()
    expect(s.belowMinimum).toBe(false)
    expect(mock.calls[0]!.orFilter).toContain('name.ilike.%ab%')
  })

  it('select() opens a UN and clears the result list', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    resolveBatch(mock.calls, 0, { adr_entries: [ADR_1203] })
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

  it('never queries for a text search, nor on retry()', async () => {
    const s = new SearchState(mock.client, { locked: true })
    s.query = 'Benzin'
    await runSearchTimer()
    s.retry()
    await settle()
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
