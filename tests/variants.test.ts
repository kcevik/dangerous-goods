// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Entry } from '$lib/multimodal/types'
import {
  groupVariants,
  matchVariant,
  normalizeSpec,
  orderedNames,
  variantLabel,
} from '$lib/multimodal/variants'
import { UN_0209, UN_1203, UN_1993 } from './fixtures/variant-rows'

function e(partial: Partial<Entry>): Entry {
  return { unNumber: '9999', sequenceNumber: 1, ...partial }
}

describe('normalizeSpec', () => {
  it('ignores case, spacing and punctuation', () => {
    expect(normalizeSpec('with not less than 25 % water,')).toBe(normalizeSpec('With not less than 25% water'))
  })

  it('maps missing values to the empty string', () => {
    expect(normalizeSpec(undefined)).toBe('')
    expect(normalizeSpec(null)).toBe('')
    expect(normalizeSpec('  ')).toBe('')
  })
})

describe('groupVariants', () => {
  it('collapses the three UN 1203 ADR name rows into one variant with every name', () => {
    const variants = groupVariants(UN_1203.ADR!, 'ADR')
    expect(variants).toHaveLength(1)
    const [v] = variants
    expect(v!.entries.map(x => x.sequenceNumber)).toEqual([1, 2, 3])
    expect(v!.representative.sequenceNumber).toBe(1)
    expect(v!.names.de).toEqual(['BENZIN', 'OTTOKRAFTSTOFF'])
    expect(v!.names.en).toEqual(['MOTOR SPIRIT', 'GASOLINE', 'PETROL'])
    expect(v!.names.fr).toEqual(['ESSENCE'])
    expect(v!.packingGroup).toBe('II')
  })

  it('splits UN 1993 ADR into five variants and merges rows 5 and 6', () => {
    const variants = groupVariants(UN_1993.ADR!, 'ADR')
    expect(variants.map(v => v.entries.map(x => x.sequenceNumber))).toEqual([[1], [2], [3], [4], [5, 6]])
    expect(variants.map(v => v.packingGroup)).toEqual(['I', 'II', 'II', 'III', 'III'])
    expect(variants[4]!.matchSpecs).toHaveLength(2)
  })

  it('collapses TNT dry and wetted rows whose mapped values are identical', () => {
    expect(groupVariants(UN_0209.ADR!, 'ADR')).toHaveLength(1)
    expect(groupVariants(UN_0209.IMDG!, 'IMDG')).toHaveLength(1)
  })

  it('treats ICAO names and specifications as English', () => {
    const [v] = groupVariants(UN_1203.ICAO!, 'ICAO')
    expect(v!.names.de).toEqual([])
    expect(v!.names.en).toEqual(['Gasoline', 'Motor spirit', 'Petrol'])
  })

  it('returns no variants for no rows', () => {
    expect(groupVariants([], 'ADN')).toEqual([])
  })

  it('ignores remarks when grouping', () => {
    const variants = groupVariants([
      e({ sequenceNumber: 1, packingGroup: 'II', remark: 'a' }),
      e({ sequenceNumber: 2, packingGroup: 'II', remark: 'b' }),
    ], 'ADR')
    expect(variants).toHaveLength(1)
  })
})

describe('matchVariant', () => {
  const adr = groupVariants(UN_1993.ADR!, 'ADR')
  const imdg = groupVariants(UN_1993.IMDG!, 'IMDG')

  it('matches by packing group and shared specification', () => {
    // ADR row 4 (VG III, no specification) ↔ IMDG VG III (no specification)
    expect(matchVariant(adr[3]!, imdg)?.packingGroup).toBe('III')
  })

  it('falls back to the single candidate with the same packing group', () => {
    // ADR VG II "(vapour pressure … more than 110 kPa)" ↔ IMDG's only VG II row
    expect(matchVariant(adr[1]!, imdg)?.representative.limitedQty).toBe('1 L')
    // ADR viscous VG III ↔ IMDG VG III
    expect(matchVariant(adr[4]!, imdg)?.packingGroup).toBe('III')
  })

  it('matches variants without a packing group to each other', () => {
    const [chosen] = groupVariants(UN_0209.ADR!, 'ADR')
    expect(matchVariant(chosen!, groupVariants(UN_0209.ICAO!, 'ICAO'))).not.toBeNull()
  })

  it('returns null when several candidates share the packing group and none shares the specification', () => {
    const [chosen] = groupVariants([e({ packingGroup: 'II' })], 'ADR')
    const candidates = groupVariants([
      e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', limitedQty: '1 L' }),
      e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' }),
    ], 'IMDG')
    expect(candidates).toHaveLength(2)
    expect(matchVariant(chosen!, candidates)).toBeNull()
  })

  it('lets the specification decide between candidates with the same packing group', () => {
    const [chosen] = groupVariants([e({ packingGroup: 'II', specificationEn: 'with not less than 25 % water' })], 'ADR')
    const candidates = groupVariants([
      e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'dry', limitedQty: '0' }),
      e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'with not less than 25% water', limitedQty: '1 L' }),
    ], 'IMDG')
    expect(matchVariant(chosen!, candidates)?.representative.limitedQty).toBe('1 L')
  })

  it('returns null for a single candidate with another packing group', () => {
    const [chosen] = groupVariants([e({ packingGroup: 'II' })], 'ADR')
    const candidates = groupVariants([e({ packingGroup: 'III' })], 'IMDG')
    expect(matchVariant(chosen!, candidates)).toBeNull()
  })

  it('returns null for no candidates', () => {
    expect(matchVariant(adr[0]!, [])).toBeNull()
  })
})

describe('orderedNames', () => {
  const [v] = groupVariants(UN_1203.ADR!, 'ADR')

  it('puts the current language first and de-duplicates case-insensitively', () => {
    expect(orderedNames(v!.names, 'de')).toEqual(['BENZIN', 'OTTOKRAFTSTOFF', 'MOTOR SPIRIT', 'GASOLINE', 'PETROL', 'ESSENCE'])
    expect(orderedNames(v!.names, 'en')[0]).toBe('MOTOR SPIRIT')
    expect(orderedNames(v!.names, 'fr')[0]).toBe('ESSENCE')
    expect(orderedNames(v!.names, 'tr')[0]).toBe('MOTOR SPIRIT')
    expect(orderedNames({ de: ['A'], en: ['a'], fr: [] }, 'de')).toEqual(['A'])
  })
})

describe('variantLabel', () => {
  const adr = groupVariants(UN_1993.ADR!, 'ADR')

  it('shows the packing group alone when there is no specification', () => {
    expect(variantLabel(adr[0]!, 'de', 'ADR', 'VP-Gr.')).toBe('VP-Gr. I')
  })

  it('adds the specification in the current language', () => {
    expect(variantLabel(adr[1]!, 'de', 'ADR', 'VP-Gr.')).toBe('VP-Gr. II · (Dampfdruck bei 50 °C größer als 110 kPa)')
    expect(variantLabel(adr[1]!, 'en', 'ADR', 'PG')).toBe('PG II · (vapour pressure at 50 °C more than 110 kPa)')
  })

  it('joins several specifications of a merged variant', () => {
    expect(variantLabel(adr[4]!, 'en', 'ADR', 'PG')).toContain(' / ')
  })

  it('uses the specification alone without a packing group, else the first name', () => {
    const [tnt] = groupVariants(UN_0209.RID!, 'RID')
    expect(variantLabel(tnt!, 'en', 'RID', 'PG')).toMatch(/^dry \/ wetted/)
    const [bare] = groupVariants([e({ name: 'STOFF' })], 'ADR')
    expect(variantLabel(bare!, 'de', 'ADR', 'VP-Gr.')).toBe('STOFF')
  })
})
