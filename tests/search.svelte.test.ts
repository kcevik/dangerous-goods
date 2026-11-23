import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildSearchResults,
  DETAIL_LIMIT,
  MIN_QUERY_LENGTH,
  NAME_ROW_LIMIT,
  PAGE_SIZE,
  rankSearchRows,
  SearchState,
  synonymHitsFor,
} from '$lib/search/search.svelte'
import type { Synonym } from '$lib/search/synonyms'

type Row = Record<string, unknown>
interface Res { data: Row[] | null, error: unknown }
interface Call {
  table: string
  columns: string
  orFilter?: string
  neq?: [string, string]
  inList?: string[]
  limit?: number
  resolve: (value: Res) => void
  reject: (reason: unknown) => void
}

const TABLES = ['adr_entries', 'rid_entries', 'imdg_entries', 'icao_entries']

/**
 * One chainable builder per from() call → deferred promise at limit().
 * Name searches use .or(); detail loads use .in(). Four of each per search.
 */
function createSupabaseMock() {
  const calls: Call[] = []
  const from = vi.fn((table: string) => {
    const call = { table, columns: '' } as Call
    const builder = {
      select: (columns: string) => { call.columns = columns; return builder },
      or: (filter: string) => { call.orFilter = filter; return builder },
      neq: (column: string, value: string) => { call.neq = [column, value]; return builder },
      in: (column: string, values: string[]) => { call.inList = values; return builder },
      order: () => builder,
      limit: (n: number) => new Promise<Res>((resolve, reject) => {
        call.limit = n
        call.resolve = resolve
        call.reject = reject
        calls.push(call)
      }),
    }
    return builder
  })
  const nameCalls = () => calls.filter(c => c.orFilter !== undefined)
  const detailCalls = () => calls.filter(c => c.inList !== undefined)
  return { client: { from } as unknown as SupabaseClient, from, calls, nameCalls, detailCalls }
}

type Mock = ReturnType<typeof createSupabaseMock>
type Tables = Partial<Record<string, Row[]>>

function respond(batch: Call[], rows: Tables, errors: Partial<Record<string, unknown>> = {}, filter = false) {
  for (const c of batch) {
    if (errors[c.table]) {
      c.resolve({ data: null, error: errors[c.table] })
      continue
    }
    const all = rows[c.table] ?? []
    c.resolve({ data: filter ? all.filter(r => c.inList!.includes(String(r.un_number))) : all, error: null })
  }
}

function nameBatch(mock: Mock, n: number) {
  return mock.nameCalls().slice(n * 4, n * 4 + 4)
}

function detailBatch(mock: Mock, n: number) {
  return mock.detailCalls().slice(n * 4, n * 4 + 4)
}

async function settle() {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

/** answers name search n with `names` and its detail load with `detail` (default: same rows) */
async function answer(mock: Mock, n: number, names: Tables, detail: Tables = names) {
  respond(nameBatch(mock, n), names)
  await settle()
  respond(detailBatch(mock, n), detail, {}, true)
  await settle()
}

async function runSearchTimer() {
  await vi.advanceTimersByTimeAsync(300)
}

const ADR_1203 = { un_number: '1203', name: 'BENZIN', name_en: 'MOTOR SPIRIT', name_fr: 'ESSENCE', hazard_class: '3', packing_group: 'II' }
const ADR_1203_B = { un_number: '1203', name: 'OTTOKRAFTSTOFF', name_en: 'GASOLINE', name_fr: null, hazard_class: '3', packing_group: 'II' }
const ICAO_1203 = { un_number: '1203', name: 'Petrol', hazard_class: '3', packing_group: 'II' }

describe('rankSearchRows', () => {
  it('ranks UN prefix, whole name, name start, word start, then contains; ties by UN number', () => {
    const hits = rankSearchRows('12', {
      ADR: [
        { un_number: '3000', name: 'X12 CONTAINS' },
        { un_number: '2500', name: 'A 12 WORD' },
        { un_number: '2000', name: '12 STARTS' },
        { un_number: '2100', name: '12' },
        { un_number: '1203', name: 'BENZIN' },
      ],
    })
    expect(hits.map(h => h.unNumber)).toEqual(['1203', '2100', '2000', '2500', '3000'])
  })

  it('folds umlauts, so "Schwefelsaeure" ranks the official name as a whole-name match', () => {
    const hits = rankSearchRows('Schwefelsaeure', {
      ADR: [
        { un_number: '1831', name: 'SCHWEFELSÄURE, RAUCHEND' },
        { un_number: '1830', name: 'SCHWEFELSÄURE' },
        { un_number: '2796', name: 'BATTERIEFLÜSSIGKEIT, SAUER' },
      ],
    })
    expect(hits.map(h => [h.unNumber, h.rank])).toEqual([['1830', 1], ['1831', 2], ['2796', 4]])
    expect(hits[0]!.primaryName).toBe('SCHWEFELSÄURE')
  })

  it('takes the best-matching name of any mode as the primary name', () => {
    const [hit] = rankSearchRows('petrol', { ADR: [ADR_1203], ICAO: [ICAO_1203] })
    expect(hit!.primaryName).toBe('Petrol')
  })

  it('drops the ICAO placeholder UN 9999', () => {
    const hits = rankSearchRows('formaldehyd', {
      ICAO: [{ un_number: '9999', name: 'Formaldehyde solution' }, { un_number: '2209', name: 'Formaldehyde solution' }],
    })
    expect(hits.map(h => h.unNumber)).toEqual(['2209'])
  })
})

describe('buildSearchResults', () => {
  it('shows every mode that has data, not only the modes whose name matched (ICAO badge fix)', () => {
    const hits = rankSearchRows('Schwefelsäure', { ADR: [{ un_number: '1830', name: 'SCHWEFELSÄURE' }] })
    const [r] = buildSearchResults(hits, [], {
      ADR: [{ un_number: '1830', name: 'SCHWEFELSÄURE', name_en: 'SULPHURIC ACID', hazard_class: '8', packing_group: 'II' }],
      IMDG: [{ un_number: '1830', name: 'SCHWEFELSÄURE', hazard_class: '8', packing_group: 'II' }],
      ICAO: [{ un_number: '1830', name: 'Sulphuric acid', hazard_class: '8', packing_group: 'II' }],
    })
    expect(r!.modes).toEqual(['ADR', 'IMDG', 'ICAO'])
    expect(r!.primaryName).toBe('SCHWEFELSÄURE')
    expect(r!.otherNames).toEqual(['SULPHURIC ACID'])
  })

  it('sorts packing groups and takes the class from the first mode that has one', () => {
    const [r] = buildSearchResults([{ unNumber: '1993', rank: 2, primaryName: 'X' }], [], {
      RID: ['III', 'I'].map(pg => ({ un_number: '1993', name: 'X', hazard_class: '3', packing_group: pg })),
      ADR: [{ un_number: '1993', name: 'X', hazard_class: null, packing_group: 'II' }],
    })
    expect(r!.packingGroups).toEqual(['I', 'II', 'III'])
    expect(r!.hazardClass).toBe('3')
  })

  it('appends synonym hits after every official hit and marks them', () => {
    const syn: Synonym = { term: 'Salzsäure', unNumbers: ['1789'], source: 'test' }
    const results = buildSearchResults(
      [{ unNumber: '1798', rank: 4, primaryName: 'GEMISCHE AUS SALPETERSÄURE UND SALZSÄURE' }],
      [{ unNumber: '1789', synonym: syn }],
      {
        ADR: [
          { un_number: '1789', name: 'CHLORWASSERSTOFFSÄURE' },
          { un_number: '1798', name: 'GEMISCHE AUS SALPETERSÄURE UND SALZSÄURE' },
        ],
      },
    )
    expect(results.map(r => r.unNumber)).toEqual(['1798', '1789'])
    expect(results[0]!.synonym).toBeUndefined()
    expect(results[1]!.synonym).toEqual({ term: 'Salzsäure' })
    expect(results[1]!.primaryName).toBe('CHLORWASSERSTOFFSÄURE')
  })

  it('drops a UN number without any rows', () => {
    expect(buildSearchResults([{ unNumber: '1234', rank: 4, primaryName: 'X' }], [], {})).toEqual([])
  })
})

describe('synonymHitsFor', () => {
  it('skips UN numbers the official search found and de-duplicates across synonyms', () => {
    const a: Synonym = { term: 'A', unNumbers: ['3480', '3481'], source: 't' }
    const b: Synonym = { term: 'B', unNumbers: ['3481', '2794'], source: 't' }
    expect(synonymHitsFor([a, b], ['2794']).map(h => [h.unNumber, h.synonym.term])).toEqual([['3480', 'A'], ['3481', 'A']])
  })
})

describe('SearchState', () => {
  let mock: Mock

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

  it(`searches the names of all four tables at ${MIN_QUERY_LENGTH} characters, without UN 9999`, async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()

    const names = nameBatch(mock, 0)
    expect(names.map(c => c.table)).toEqual(TABLES)
    expect(names[0]!.orFilter).toBe('name.ilike.%be%,name_en.ilike.%be%,name_fr.ilike.%be%')
    expect(names[0]!.columns).toBe('un_number, name, name_en, name_fr')
    expect(names[2]!.orFilter).toBe('name.ilike.%be%,name_en.ilike.%be%')
    expect(names[3]!.orFilter).toBe('name.ilike.%be%')
    for (const c of names) {
      expect(c.neq).toEqual(['un_number', '9999'])
      expect(c.limit).toBe(NAME_ROW_LIMIT + 1)
    }
    expect(s.isLoading).toBe(true)
  })

  it('loads every mode of the hits in a second step, so badges reflect the data', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    respond(nameBatch(mock, 0), { adr_entries: [ADR_1203] })
    await settle()

    const detail = detailBatch(mock, 0)
    expect(detail.map(c => c.table)).toEqual(TABLES)
    expect(detail[0]!.inList).toEqual(['1203'])
    expect(detail[0]!.columns).toBe('un_number, hazard_class, packing_group, name, name_en, name_fr')
    respond(detail, { adr_entries: [ADR_1203, ADR_1203_B], icao_entries: [ICAO_1203] }, {}, true)
    await settle()

    expect(s.isLoading).toBe(false)
    expect(s.answered).toBe(true)
    expect(s.results).toHaveLength(1)
    expect(s.results[0]!.modes).toEqual(['ADR', 'ICAO'])
    expect(s.results[0]!.otherNames).toContain('OTTOKRAFTSTOFF')
  })

  it('searches typed umlaut spellings and word gaps', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Schwefel-saeure'
    await runSearchTimer()
    const filter = nameBatch(mock, 0)[0]!.orFilter!
    expect(filter).toContain('name.ilike.%schwefel%saeure%')
    expect(filter).toContain('name.ilike.%schwefel%säure%')
  })

  it('adds a un_number prefix filter for partial numbers, also with "UN"', async () => {
    const s = new SearchState(mock.client)
    s.query = 'UN 12'
    await runSearchTimer()
    for (const c of nameBatch(mock, 0)) expect(c.orFilter).toContain('un_number.like.12%')
  })

  it('does not add a un_number filter for text queries', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    for (const c of nameBatch(mock, 0)) expect(c.orFilter).not.toContain('un_number')
  })

  it('strips PostgREST delimiters and LIKE wildcards from user input', async () => {
    const s = new SearchState(mock.client)
    s.query = 'a,b(c)d%e*f_g\\h'
    await runSearchTimer()
    expect(nameBatch(mock, 0)[0]!.orFilter).toContain('name.ilike.%a%b%c%d%e%f%g%h%')
  })

  it.each(['1203', 'UN1203', 'UN 1203', 'un-1203'])('selects %s as UN 1203 at once, without querying', async (q) => {
    const s = new SearchState(mock.client)
    s.query = q
    await runSearchTimer()
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
    expect(mock.from).not.toHaveBeenCalled()
  })

  it('never selects the ICAO placeholder 9999', async () => {
    const s = new SearchState(mock.client)
    s.query = '9999'
    await runSearchTimer()
    expect(s.selectedUn).toBeNull()
  })

  it('adds synonym hits after the official ones, marked, without a second copy', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Salzsäure'
    await runSearchTimer()
    const official = { un_number: '1798', name: 'GEMISCHE AUS SALPETERSÄURE UND SALZSÄURE' }
    respond(nameBatch(mock, 0), { adr_entries: [official] })
    await settle()
    expect(detailBatch(mock, 0)[0]!.inList).toEqual(['1798', '1789'])
    respond(detailBatch(mock, 0), { adr_entries: [official, { un_number: '1789', name: 'CHLORWASSERSTOFFSÄURE' }] }, {}, true)
    await settle()
    expect(s.results.map(r => r.unNumber)).toEqual(['1798', '1789'])
    expect(s.results[1]!.synonym?.term).toBe('Salzsäure')
  })

  it('finds a synonym when no official name matches', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Natronlauge'
    await runSearchTimer()
    await answer(mock, 0, {}, { adr_entries: [{ un_number: '1824', name: 'NATRIUMHYDROXIDLÖSUNG' }] })
    expect(s.results.map(r => [r.unNumber, r.synonym?.term])).toEqual([['1824', 'Natronlauge']])
  })

  it('exposes "usually not dangerous goods" hints', async () => {
    const s = new SearchState(mock.client)
    s.query = 'AdBlue'
    await runSearchTimer()
    await answer(mock, 0, {})
    expect(s.hints.map(h => h.term)).toEqual(['AdBlue'])
    expect(s.results).toEqual([])
    expect(s.answered).toBe(true)
    expect(mock.detailCalls()).toHaveLength(0)
  })

  it(`shows ${PAGE_SIZE} results at first and more on showMore()`, async () => {
    const s = new SearchState(mock.client)
    s.query = 'acid'
    await runSearchTimer()
    const rows = Array.from({ length: 30 }, (_, i) => ({ un_number: String(3000 + i), name: 'ACID' }))
    await answer(mock, 0, { adr_entries: rows })
    expect(s.results).toHaveLength(30)
    expect(s.visibleResults).toHaveLength(PAGE_SIZE)
    expect(s.hasMore).toBe(true)
    expect(s.incomplete).toBe(false)
    s.showMore()
    expect(s.visibleResults).toHaveLength(30)
    expect(s.hasMore).toBe(false)
  })

  it('flags the list incomplete when a table hits its row limit', async () => {
    const s = new SearchState(mock.client)
    s.query = 'acid'
    await runSearchTimer()
    const rows = Array.from({ length: NAME_ROW_LIMIT + 1 }, (_, i) => ({ un_number: String(1000 + i), name: 'ACID' }))
    await answer(mock, 0, { adr_entries: rows })
    expect(s.incomplete).toBe(true)
    expect(s.results).toHaveLength(DETAIL_LIMIT)
  })

  it(`flags the list incomplete when more than ${DETAIL_LIMIT} UN numbers match, and ranks before cutting`, async () => {
    const s = new SearchState(mock.client)
    s.query = 'acid'
    await runSearchTimer()
    const rows = Array.from({ length: DETAIL_LIMIT + 5 }, (_, i) => ({ un_number: String(1000 + i), name: 'X ACID' }))
    rows.push({ un_number: '3999', name: 'ACID' })
    await answer(mock, 0, { adr_entries: rows })
    expect(s.incomplete).toBe(true)
    expect(s.results[0]!.unNumber).toBe('3999')
  })

  it('reports an error and no results when a name query fails', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    respond(nameBatch(mock, 0), { adr_entries: [ADR_1203] }, { imdg_entries: { message: 'down' } })
    await settle()
    expect(s.searchError).toBe(true)
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
    expect(s.answered).toBe(false)
  })

  it('reports an error when the detail load fails', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    respond(nameBatch(mock, 0), { adr_entries: [ADR_1203] })
    await settle()
    respond(detailBatch(mock, 0), {}, { icao_entries: { message: 'down' } }, true)
    await settle()
    expect(s.searchError).toBe(true)
    expect(s.results).toEqual([])
    expect(s.answered).toBe(false)
  })

  it('reports an error when a query rejects', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    const [first, ...rest] = nameBatch(mock, 0)
    first!.reject(new Error('network'))
    for (const c of rest) c.resolve({ data: [], error: null })
    await settle()
    expect(s.searchError).toBe(true)
  })

  it('retry() runs the current query again and clears the error on success', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    respond(nameBatch(mock, 0), {}, { adr_entries: { message: 'down' } })
    await settle()
    expect(s.searchError).toBe(true)

    s.retry()
    await settle()
    respond(nameBatch(mock, 1), { adr_entries: [ADR_1203] })
    await settle()
    // the failed first search never reached its detail load, so this is detail batch 0
    respond(detailBatch(mock, 0), { adr_entries: [ADR_1203] }, {}, true)
    await settle()
    expect(s.searchError).toBe(false)
    expect(s.results).toHaveLength(1)
  })

  it('clears the error as soon as the query changes', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    await runSearchTimer()
    respond(nameBatch(mock, 0), {}, { adr_entries: { message: 'down' } })
    await settle()
    s.query = 'Benzi'
    expect(s.searchError).toBe(false)
  })

  it('ignores a slow stale response arriving after a newer one', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benz'
    await runSearchTimer()
    s.query = 'Benzi'
    await runSearchTimer()

    const second = mock.nameCalls().slice(4, 8)
    respond(second, { adr_entries: [ADR_1203] })
    await settle()
    respond(detailBatch(mock, 0), { adr_entries: [ADR_1203] }, {}, true)
    await settle()
    respond(nameBatch(mock, 0), {}, { adr_entries: { message: 'late' } })
    await settle()

    expect(s.searchError).toBe(false)
    expect(s.results.map(r => r.unNumber)).toEqual(['1203'])
  })

  it('discards an in-flight response when the query switches to a UN number (review fix)', async () => {
    const s = new SearchState(mock.client)
    s.query = '120'
    await runSearchTimer()
    s.query = 'UN1203'
    respond(nameBatch(mock, 0), { adr_entries: [ADR_1203] })
    await settle()
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
    expect(s.isLoading).toBe(false)
    expect(mock.detailCalls()).toHaveLength(0)
  })

  it('treats a query that strips below the minimum as not yet searchable (review fix)', async () => {
    const s = new SearchState(mock.client)
    s.query = '%%'
    await runSearchTimer()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.belowMinimum).toBe(true)
    s.query = 'a"b'
    await runSearchTimer()
    expect(s.belowMinimum).toBe(false)
  })

  it('reports answered only once a successful search for the current query has finished', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Benzin'
    expect(s.answered).toBe(false)
    await runSearchTimer()
    expect(s.answered).toBe(false)
    await answer(mock, 0, {})
    expect(s.answered).toBe(true)
    s.query = 'Benzi'
    expect(s.answered).toBe(false)
  })

  it('select() opens a UN and clears the result list', async () => {
    const s = new SearchState(mock.client)
    s.query = 'Be'
    await runSearchTimer()
    await answer(mock, 0, { adr_entries: [ADR_1203] })
    s.select('1203')
    expect(s.selectedUn).toBe('1203')
    expect(s.results).toEqual([])
  })

  it('start() runs the initial query at once, without the debounce', async () => {
    const s = new SearchState(mock.client, { initialQuery: 'Diesel' })
    expect(s.query).toBe('Diesel')
    expect(mock.from).not.toHaveBeenCalled()
    s.start()
    await settle()
    expect(nameBatch(mock, 0)).toHaveLength(4)
  })

  it('start() selects an initial UN number', () => {
    const s = new SearchState(mock.client, { initialQuery: 'UN3373' })
    s.start()
    expect(s.selectedUn).toBe('3373')
  })

  it('reports the settled query through onCommit (debounced), and start() at once', async () => {
    const onCommit = vi.fn()
    const s = new SearchState(mock.client, { initialQuery: ' Diesel ', onCommit })
    s.start()
    expect(onCommit).toHaveBeenLastCalledWith('Diesel')
    s.query = 'Ben'
    s.query = 'Benz'
    expect(onCommit).toHaveBeenCalledTimes(1)
    await runSearchTimer()
    expect(onCommit).toHaveBeenCalledTimes(2)
    expect(onCommit).toHaveBeenLastCalledWith('Benz')
    s.query = ''
    await runSearchTimer()
    expect(onCommit).toHaveBeenLastCalledWith('')
  })
})

describe('SearchState when locked', () => {
  let mock: Mock

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mock = createSupabaseMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('never queries for a text search, nor on retry() or start()', async () => {
    const s = new SearchState(mock.client, { locked: true, initialQuery: 'Natronlauge' })
    s.start()
    s.query = 'Benzin'
    await runSearchTimer()
    s.retry()
    await settle()
    expect(mock.from).not.toHaveBeenCalled()
    expect(s.results).toEqual([])
    expect(s.hints).toEqual([])
    expect(s.isLoading).toBe(false)
  })

  it('does not select a UN number', async () => {
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
