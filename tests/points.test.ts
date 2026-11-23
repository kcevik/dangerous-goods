// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Entry } from '$lib/multimodal/types'
import {
  BK2_ALONE_LIMIT,
  categoryOf,
  effectiveCategory,
  evaluateLoad,
  evaluateRow,
  factorFor,
  formatPoints,
  type Lookup,
  parseQuantity,
  POINTS_LIMIT,
  type RowInput,
  suggestUnit,
  unitHint,
} from '$lib/points/points'

function entry(over: Partial<Entry> = {}): Entry {
  return { unNumber: '1203', sequenceNumber: 1, name: 'BENZIN', hazardClass: '3', classificationCode: 'F1', packingGroup: 'II', transportCategory: '2', multiplier: '3', ...over }
}

function done(...entries: Entry[]): Lookup {
  return { state: 'done', entries }
}

function row(over: Partial<RowInput> = {}): RowInput {
  return { un: '1203', quantity: '100', emptyPackaging: false, lookup: done(entry()), variantKey: null, ...over }
}

/** a counted row of the given category, factor and quantity */
function rowOf(category: string, quantity: string, over: Partial<Entry> = {}): RowInput {
  const multiplier = { 1: '50', 2: '3', 3: '1', 4: '0' }[category] ?? undefined
  return row({ quantity, lookup: done(entry({ transportCategory: category, multiplier, ...over })) })
}

describe('constants', () => {
  it('pins the limits of 1.1.3.6.3/1.1.3.6.4', () => {
    expect(POINTS_LIMIT).toBe(1000)
    expect(BK2_ALONE_LIMIT).toBe(333)
  })
})

describe('parseQuantity', () => {
  it('accepts integers and both decimal separators', () => {
    expect(parseQuantity('300')).toEqual({ ok: true, value: 300 })
    expect(parseQuantity(' 1,5 ')).toEqual({ ok: true, value: 1.5 })
    expect(parseQuantity('2.25')).toEqual({ ok: true, value: 2.25 })
  })

  it('rejects empty input', () => {
    expect(parseQuantity('')).toEqual({ ok: false, reason: 'empty' })
    expect(parseQuantity('   ')).toEqual({ ok: false, reason: 'empty' })
  })

  it('rejects a thousands point so 1.000 is never read as 1', () => {
    expect(parseQuantity('1.000')).toEqual({ ok: false, reason: 'thousands' })
    expect(parseQuantity('12.500')).toEqual({ ok: false, reason: 'thousands' })
    expect(parseQuantity('1.000,5')).toEqual({ ok: false, reason: 'thousands' })
  })

  it('rejects zero, negatives and garbage', () => {
    expect(parseQuantity('0')).toEqual({ ok: false, reason: 'notPositive' })
    expect(parseQuantity('0,0')).toEqual({ ok: false, reason: 'notPositive' })
    expect(parseQuantity('-5')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseQuantity('5 kg')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseQuantity('1e3')).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('categoryOf / factorFor / effectiveCategory', () => {
  it('reads the transport category; "-", NULL and junk are no category', () => {
    expect(categoryOf(entry({ transportCategory: '0' }))).toBe('0')
    expect(categoryOf(entry({ transportCategory: '4' }))).toBe('4')
    expect(categoryOf(entry({ transportCategory: '-' }))).toBeNull()
    expect(categoryOf(entry({ transportCategory: undefined }))).toBeNull()
    expect(categoryOf(entry({ transportCategory: '5' }))).toBeNull()
  })

  it('uses the factors of 1.1.3.6.4', () => {
    expect(factorFor('0')).toBeNull()
    expect(factorFor('1')).toBe(50)
    expect(factorFor('1', '50')).toBe(50)
    expect(factorFor('1', '20')).toBe(20) // footnote a)
    expect(factorFor('2', '3')).toBe(3)
    expect(factorFor('3', '1')).toBe(1)
    expect(factorFor('4', '0')).toBe(0)
  })

  it('maps empty uncleaned packagings per 1.1.3.6.1', () => {
    expect(effectiveCategory('0', true)).toBe('0')
    expect(effectiveCategory('1', true)).toBe('4')
    expect(effectiveCategory('2', true)).toBe('4')
    expect(effectiveCategory('3', true)).toBe('4')
    expect(effectiveCategory('4', true)).toBe('4')
    expect(effectiveCategory('2', false)).toBe('2')
  })
})

describe('evaluateRow', () => {
  it('ignores an untouched row', () => {
    const r = evaluateRow(row({ un: '', quantity: '', lookup: { state: 'idle' } }))
    expect(r.status).toBe('empty')
    expect(r.points).toBeNull()
  })

  it('asks for a 4-digit UN number', () => {
    expect(evaluateRow(row({ un: '12', lookup: { state: 'idle' } })).status).toBe('invalidUn')
    expect(evaluateRow(row({ un: '12a4', lookup: { state: 'idle' } })).status).toBe('invalidUn')
  })

  it('reports loading and a failed lookup — never 0 points', () => {
    expect(evaluateRow(row({ lookup: { state: 'loading' } })).status).toBe('loading')
    const failed = evaluateRow(row({ lookup: { state: 'failed' } }))
    expect(failed.status).toBe('lookupFailed')
    expect(failed.points).toBeNull()
    expect(failed.message).toMatch(/fehlgeschlagen/)
  })

  it('reports a UN number missing from Table A', () => {
    const r = evaluateRow(row({ un: '9999', lookup: done() }))
    expect(r.status).toBe('notFound')
    expect(r.message).toContain('9999')
  })

  it.each([
    ['1', '50', 10, 50, 500],
    ['2', '3', 100, 3, 300],
    ['3', '1', 400, 1, 400],
    ['4', '0', 5000, 0, 0],
  ])('BK %s: quantity × factor', (category, multiplier, quantity, factor, points) => {
    const r = evaluateRow(row({ quantity: String(quantity), lookup: done(entry({ transportCategory: category, multiplier })) }))
    expect(r.status).toBe('counted')
    expect(r.category).toBe(category)
    expect(r.factor).toBe(factor)
    expect(r.points).toBe(points)
  })

  it('applies footnote a) (factor 20) from the data', () => {
    const r = evaluateRow(row({ un: '1005', quantity: '50', lookup: done(entry({ unNumber: '1005', transportCategory: '1', multiplier: '20', hazardClass: '2', classificationCode: '2TC' })) }))
    expect(r.factor).toBe(20)
    expect(r.points).toBe(1000)
    expect(r.footnoteA).toBe(true)
  })

  it('BK 0 is never exempt and needs no quantity', () => {
    const r = evaluateRow(row({ quantity: '', lookup: done(entry({ transportCategory: '0', multiplier: undefined })) }))
    expect(r.status).toBe('category0')
    expect(r.points).toBeNull()
    expect(r.message).toMatch(/Beförderungskategorie 0/)
  })

  it('a row without category ("-" or NULL) is flagged for checking, never counted as 0', () => {
    for (const transportCategory of ['-', undefined]) {
      const r = evaluateRow(row({ lookup: done(entry({ transportCategory, multiplier: undefined })) }))
      expect(r.status).toBe('noCategory')
      expect(r.points).toBeNull()
      expect(r.message).toMatch(/keine Beförderungskategorie/i)
    }
  })

  it('reads "BEFÖRDERUNG VERBOTEN" from the remark', () => {
    const r = evaluateRow(row({ un: '0020', lookup: done(entry({ transportCategory: undefined, multiplier: undefined, remark: 'BEFÖRDERUNG VERBOTEN' })) }))
    expect(r.status).toBe('forbidden')
    expect(r.points).toBeNull()
  })

  it('reads "UNTERLIEGT NICHT DEN VORSCHRIFTEN DES ADR" from the remark', () => {
    const r = evaluateRow(row({ un: '1327', lookup: done(entry({ transportCategory: undefined, multiplier: undefined, remark: 'UNTERLIEGT NICHT DEN VORSCHRIFTEN DES ADR' })) }))
    expect(r.status).toBe('notSubject')
    expect(r.points).toBeNull()
    expect(r.message).toMatch(/nicht mitgezählt/)
  })

  it('empty uncleaned packaging: BK 2 becomes BK 4 with 0 points and needs no quantity', () => {
    const r = evaluateRow(row({ quantity: '', emptyPackaging: true }))
    expect(r.status).toBe('counted')
    expect(r.sourceCategory).toBe('2')
    expect(r.category).toBe('4')
    expect(r.factor).toBe(0)
    expect(r.points).toBe(0)
  })

  it('empty uncleaned packaging of a BK 0 substance stays BK 0', () => {
    const r = evaluateRow(row({ emptyPackaging: true, lookup: done(entry({ transportCategory: '0', multiplier: undefined })) }))
    expect(r.status).toBe('category0')
  })

  it('asks for a quantity where the result depends on it', () => {
    expect(evaluateRow(row({ quantity: '' })).status).toBe('needsQuantity')
    const thousands = evaluateRow(row({ quantity: '1.000' }))
    expect(thousands.status).toBe('invalidQuantity')
    expect(thousands.message).toMatch(/Tausenderpunkt/)
    expect(evaluateRow(row({ quantity: '0' })).status).toBe('invalidQuantity')
  })

  it('BK 4 needs no quantity', () => {
    const r = evaluateRow(rowOf('4', ''))
    expect(r.status).toBe('counted')
    expect(r.points).toBe(0)
  })

  describe('variants', () => {
    const pg1 = entry({ unNumber: '1993', sequenceNumber: 1, packingGroup: 'I', transportCategory: '1', multiplier: '50' })
    const pg2 = entry({ unNumber: '1993', sequenceNumber: 2, packingGroup: 'II', transportCategory: '2', multiplier: '3' })
    const pg3 = entry({ unNumber: '1993', sequenceNumber: 3, packingGroup: 'III', transportCategory: '3', multiplier: '1' })

    it('asks for a choice when the variants differ in category', () => {
      const r = evaluateRow(row({ un: '1993', lookup: done(pg1, pg2, pg3) }))
      expect(r.status).toBe('needsVariant')
      expect(r.needsChoice).toBe(true)
      expect(r.variants).toHaveLength(3)
      expect(r.points).toBeNull()
    })

    it('uses the chosen variant', () => {
      const first = evaluateRow(row({ un: '1993', lookup: done(pg1, pg2, pg3) }))
      const key = first.variants[2]!.key
      const r = evaluateRow(row({ un: '1993', quantity: '400', lookup: done(pg1, pg2, pg3), variantKey: key }))
      expect(r.status).toBe('counted')
      expect(r.category).toBe('3')
      expect(r.points).toBe(400)
    })

    it('needs no choice when all variants share the category and factor', () => {
      const a = entry({ sequenceNumber: 1, specification: 'A' })
      const b = entry({ sequenceNumber: 2, specification: 'B', tunnelCode: 'D/E' })
      const r = evaluateRow(row({ lookup: done(a, b) }))
      expect(r.needsChoice).toBe(false)
      expect(r.status).toBe('counted')
    })
  })
})

describe('evaluateLoad', () => {
  const load = (...inputs: RowInput[]) => evaluateLoad(inputs.map(evaluateRow))

  it('is empty without filled rows', () => {
    expect(load(row({ un: '', quantity: '', lookup: { state: 'idle' } })).verdict).toBe('empty')
  })

  it('sums a mixed load (persona p5: 1203 + 1993 III + 1830 + 3480)', () => {
    const result = load(
      rowOf('2', '300'), // 1203, 300 L × 3 = 900
      rowOf('3', '400'), // 1993 VG III, 400 L × 1 = 400
      rowOf('2', '100'), // 1830, 100 kg × 3 = 300
      rowOf('2', '50'), // 3480, 50 kg × 3 = 150
    )
    expect(result.total).toBe(1750)
    expect(result.verdict).toBe('notExempt')
    expect(result.reasons.join(' ')).toMatch(/überschreitet 1\.000/)
  })

  it('exactly 1000 points is exempt ("nicht überschreiten")', () => {
    const result = load(rowOf('2', '200'), rowOf('3', '400'))
    expect(result.total).toBe(1000)
    expect(result.verdict).toBe('exempt')
  })

  it('1001 points is not exempt', () => {
    const result = load(rowOf('2', '200'), rowOf('3', '401'))
    expect(result.total).toBe(1001)
    expect(result.verdict).toBe('notExempt')
  })

  it('a fraction above 1000 is not exempt', () => {
    expect(load(rowOf('3', '1000,01')).verdict).toBe('notExempt')
  })

  it('does not trip over floating point near the boundary', () => {
    // 0,1 × 3 = 0.30000000000000004 in binary floating point
    expect(load(rowOf('2', '0,1'), rowOf('3', '999,7')).verdict).toBe('exempt')
  })

  it('one BK 0 row makes the load not exempt whatever the total', () => {
    const result = load(rowOf('3', '1'), row({ quantity: '', lookup: done(entry({ transportCategory: '0', multiplier: undefined })) }))
    expect(result.verdict).toBe('notExempt')
    expect(result.reasons.join(' ')).toMatch(/Beförderungskategorie 0/)
  })

  it('a forbidden row makes the load not exempt', () => {
    expect(load(rowOf('3', '1'), row({ lookup: done(entry({ transportCategory: undefined, remark: 'BEFÖRDERUNG VERBOTEN' })) })).verdict).toBe('notExempt')
  })

  it('a row without category asks for checking', () => {
    const result = load(rowOf('3', '10'), row({ lookup: done(entry({ transportCategory: '-', multiplier: undefined })) }))
    expect(result.verdict).toBe('check')
  })

  it('not-exempt wins over check', () => {
    expect(load(rowOf('3', '2000'), row({ lookup: done(entry({ transportCategory: '-' })) })).verdict).toBe('notExempt')
  })

  it('a failed lookup blocks the result', () => {
    const result = load(rowOf('3', '10'), row({ lookup: { state: 'failed' } }))
    expect(result.verdict).toBe('lookupFailed')
  })

  it('an unfinished row makes the result incomplete', () => {
    expect(load(rowOf('3', '10'), row({ quantity: '' })).verdict).toBe('incomplete')
    expect(load(rowOf('3', '10'), row({ lookup: { state: 'loading' } })).verdict).toBe('incomplete')
    expect(load(rowOf('3', '10'), row({ un: '12', lookup: { state: 'idle' } })).verdict).toBe('incomplete')
  })

  it('ignores empty rows', () => {
    expect(load(rowOf('3', '10'), row({ un: '', quantity: '', lookup: { state: 'idle' } })).verdict).toBe('exempt')
  })

  it('BK 2 alone: 333 is exempt, 333,5 is not (column 3 of 1.1.3.6.3)', () => {
    expect(load(rowOf('2', '333')).verdict).toBe('exempt')
    const over = load(rowOf('2', '300'), rowOf('2', '33,4'))
    expect(over.total).toBeCloseTo(1000.2)
    expect(over.verdict).toBe('notExempt')
    const between = load(rowOf('2', '333,3'))
    expect(between.total).toBeCloseTo(999.9)
    expect(between.verdict).toBe('notExempt')
    expect(between.reasons.join(' ')).toMatch(/333/)
  })

  it('BK 2 with a BK 4 row is a mixed load (points only)', () => {
    expect(load(rowOf('2', '333,3'), rowOf('4', '10')).verdict).toBe('exempt')
  })

  it('empty uncleaned packagings add no points', () => {
    const result = load(rowOf('3', '1000'), row({ quantity: '500', emptyPackaging: true }))
    expect(result.total).toBe(1000)
    expect(result.verdict).toBe('exempt')
  })

  it('a load of goods not subject to ADR is not called exempt', () => {
    const result = load(row({ lookup: done(entry({ transportCategory: undefined, remark: 'UNTERLIEGT NICHT DEN VORSCHRIFTEN DES ADR' })) }))
    expect(result.verdict).toBe('noAdrGoods')
    expect(result.notes).toHaveLength(1)
  })

  it('names the UN number and position in the reasons', () => {
    const result = load(rowOf('3', '10'), row({ un: '2215', lookup: done(entry({ unNumber: '2215', transportCategory: '0' })) }))
    expect(result.reasons.join(' ')).toContain('UN 2215')
  })
})

describe('units', () => {
  it('suggests a unit from class and classification code (1.1.3.6.3)', () => {
    expect(suggestUnit(entry({ hazardClass: '1', classificationCode: '1.1D' }))).toBe('kg')
    expect(suggestUnit(entry({ hazardClass: '2', classificationCode: '1A' }))).toBe('lw') // compressed
    expect(suggestUnit(entry({ hazardClass: '2', classificationCode: '9TF' }))).toBe('lw') // adsorbed
    expect(suggestUnit(entry({ unNumber: '3500', hazardClass: '2', classificationCode: '8A' }))).toBe('lw') // chemical under pressure
    expect(suggestUnit(entry({ hazardClass: '2', classificationCode: '2F' }))).toBe('kg') // liquefied
    expect(suggestUnit(entry({ hazardClass: '2', classificationCode: '5F' }))).toBe('kg') // aerosol
    expect(suggestUnit(entry({ hazardClass: '3', classificationCode: 'F1' }))).toBe('l')
    expect(suggestUnit(entry({ hazardClass: '8', classificationCode: 'C1' }))).toBe('kg')
  })

  it('names the quantity to enter where the class tells', () => {
    expect(unitHint(entry({ hazardClass: '1', classificationCode: '1.4S' }))).toMatch(/Nettomasse des explosiven Stoffes/)
    expect(unitHint(entry({ hazardClass: '2', classificationCode: '5F' }))).toMatch(/ohne Verpackung/)
    expect(unitHint(entry({ hazardClass: '2', classificationCode: '1A' }))).toMatch(/Fassungsraum/)
    expect(unitHint(entry({ hazardClass: '2', classificationCode: '2F' }))).toMatch(/Nettomasse/)
    expect(unitHint(entry({ hazardClass: '3' }))).toMatch(/Litern/)
    expect(unitHint(entry({ hazardClass: '9', name: 'LITHIUM-IONEN-BATTERIEN' }))).toMatch(/ohne Verpackung/)
    expect(unitHint(entry({ hazardClass: '8', name: 'SCHWEFELSÄURE' }))).toBeNull()
  })
})

describe('formatPoints', () => {
  it('uses German separators and at most two decimals', () => {
    expect(formatPoints(1750)).toBe('1.750')
    expect(formatPoints(999.9)).toBe('999,9')
    expect(formatPoints(0.30000000000000004)).toBe('0,3')
  })
})
