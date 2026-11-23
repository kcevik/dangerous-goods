import { describe, expect, it, vi } from 'vitest'
import type { Entry } from '$lib/multimodal/types'
import { PointsCalculatorState } from '$lib/points/pointsCalculator.svelte'

function entry(over: Partial<Entry> = {}): Entry {
  return { unNumber: '1203', sequenceNumber: 1, name: 'BENZIN', hazardClass: '3', classificationCode: 'F1', packingGroup: 'II', transportCategory: '2', multiplier: '3', ...over }
}

const DATA: Record<string, Entry[]> = {
  1203: [entry()],
  1830: [entry({ unNumber: '1830', name: 'SCHWEFELSÄURE', hazardClass: '8', classificationCode: 'C1' })],
  1005: [entry({ unNumber: '1005', name: 'AMMONIAK, WASSERFREI', hazardClass: '2', classificationCode: '2TC', packingGroup: undefined, transportCategory: '1', multiplier: '20' })],
  1993: [
    entry({ unNumber: '1993', sequenceNumber: 1, packingGroup: 'I', transportCategory: '1', multiplier: '50' }),
    entry({ unNumber: '1993', sequenceNumber: 2, packingGroup: 'II', transportCategory: '2', multiplier: '3' }),
    entry({ unNumber: '1993', sequenceNumber: 3, packingGroup: 'III', transportCategory: '3', multiplier: '1' }),
  ],
}

function fakeFetcher() {
  return vi.fn(async (un: string) => DATA[un] ?? [])
}

/** lets pending promises settle */
const flush = () => new Promise(r => setTimeout(r, 0))

describe('PointsCalculatorState', () => {
  it('starts with one empty row and an empty verdict', () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    expect(calc.rows).toHaveLength(1)
    expect(calc.summary.verdict).toBe('empty')
  })

  it('looks up a 4-digit UN number and computes the points', async () => {
    const fetcher = fakeFetcher()
    const calc = new PointsCalculatorState(fetcher)
    const row = calc.rows[0]!
    calc.setUn(row, '1203')
    expect(row.result.status).toBe('loading')
    row.quantity = '300'
    await flush()
    expect(fetcher).toHaveBeenCalledWith('1203')
    expect(row.result.status).toBe('counted')
    expect(row.result.points).toBe(900)
    expect(calc.summary.verdict).toBe('exempt')
    expect(calc.summary.total).toBe(900)
  })

  it('does not query while the number is incomplete', () => {
    const fetcher = fakeFetcher()
    const calc = new PointsCalculatorState(fetcher)
    calc.setUn(calc.rows[0]!, '120')
    expect(fetcher).not.toHaveBeenCalled()
    expect(calc.rows[0]!.result.status).toBe('invalidUn')
  })

  it('computes the mixed load of persona p5 live', async () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    const add = (un: string, qty: string) => {
      const row = calc.rows.at(-1)!.un ? calc.addRow() : calc.rows.at(-1)!
      calc.setUn(row, un)
      row.quantity = qty
      return row
    }
    add('1203', '300')
    const r1993 = add('1993', '400')
    add('1830', '100')
    await flush()
    expect(calc.summary.verdict).toBe('incomplete') // 1993 needs a packing group
    r1993.variantKey = r1993.result.variants.find(v => v.packingGroup === 'III')!.key
    expect(calc.summary.total).toBe(900 + 400 + 300)
    expect(calc.summary.verdict).toBe('notExempt')
  })

  it('caches lookups per UN number', async () => {
    const fetcher = fakeFetcher()
    const calc = new PointsCalculatorState(fetcher)
    calc.setUn(calc.rows[0]!, '1203')
    await flush()
    const second = calc.addRow()
    calc.setUn(second, '1203')
    expect(second.result.status).not.toBe('loading')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('shows a failed lookup as an error and retries', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue(DATA['1203'])
    const calc = new PointsCalculatorState(fetcher)
    const row = calc.rows[0]!
    calc.setUn(row, '1203')
    row.quantity = '10'
    await flush()
    expect(row.result.status).toBe('lookupFailed')
    expect(row.result.points).toBeNull()
    expect(calc.summary.verdict).toBe('lookupFailed')
    calc.retry(row)
    await flush()
    expect(row.result.status).toBe('counted')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ignores a stale response after the number changed', async () => {
    let release!: (v: Entry[]) => void
    const fetcher = vi.fn((un: string) => un === '1830'
      ? new Promise<Entry[]>((r) => { release = r })
      : Promise.resolve(DATA[un] ?? []))
    const calc = new PointsCalculatorState(fetcher)
    const row = calc.rows[0]!
    calc.setUn(row, '1830')
    calc.setUn(row, '1203')
    await flush()
    release(DATA['1830']!)
    await flush()
    expect(row.result.entry?.unNumber).toBe('1203')
  })

  it('resets the variant choice when the number changes', async () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    const row = calc.rows[0]!
    calc.setUn(row, '1993')
    await flush()
    row.variantKey = row.result.variants[0]!.key
    calc.setUn(row, '1203')
    expect(row.variantKey).toBeNull()
  })

  it('suggests a unit from the data until the user picks one', async () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    const row = calc.rows[0]!
    calc.setUn(row, '1203')
    await flush()
    expect(row.unit).toBe('l')
    row.unit = 'kg'
    calc.setUn(row, '1830')
    await flush()
    expect(row.unit).toBe('kg')
    const other = calc.addRow()
    calc.setUn(other, '1203')
    expect(other.unit).toBe('l') // from the cache
  })

  it('adds and removes rows; the last row is cleared instead of removed', async () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    const second = calc.addRow()
    expect(calc.rows).toHaveLength(2)
    calc.removeRow(second.id)
    expect(calc.rows).toHaveLength(1)
    const only = calc.rows[0]!
    calc.setUn(only, '1203')
    only.quantity = '5'
    calc.removeRow(only.id)
    expect(calc.rows).toHaveLength(1)
    expect(calc.rows[0]!.un).toBe('')
    expect(calc.summary.verdict).toBe('empty')
  })

  it('handles footnote a) and empty packagings through the rows', async () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    const nh3 = calc.rows[0]!
    calc.setUn(nh3, '1005')
    nh3.quantity = '50'
    const empty = calc.addRow()
    calc.setUn(empty, '1203')
    empty.emptyPackaging = true
    await flush()
    expect(nh3.result.factor).toBe(20)
    expect(empty.result.points).toBe(0)
    expect(calc.summary.total).toBe(1000)
    expect(calc.summary.verdict).toBe('exempt')
  })

  it('lists only the filled rows for print', async () => {
    const calc = new PointsCalculatorState(fakeFetcher())
    calc.setUn(calc.rows[0]!, '1203')
    calc.addRow()
    expect(calc.filledRows).toHaveLength(1)
  })
})
