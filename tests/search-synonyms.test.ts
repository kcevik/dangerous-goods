// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { matchSynonyms } from '$lib/search/matchSynonyms'
import { foldedStem } from '$lib/search/normalize'
import { SYNONYMS } from '$lib/search/synonyms'

const unsFor = (q: string) => [...new Set(matchSynonyms(q).flatMap(s => s.unNumbers))]

describe('SYNONYMS list', () => {
  it('has between 150 and 250 entries', () => {
    expect(SYNONYMS.length).toBeGreaterThanOrEqual(150)
    expect(SYNONYMS.length).toBeLessThanOrEqual(250)
  })

  it('uses 4-digit UN numbers only, never the ICAO placeholder 9999', () => {
    for (const s of SYNONYMS) {
      for (const un of s.unNumbers) {
        expect(un, s.term).toMatch(/^\d{4}$/)
        expect(un, s.term).not.toBe('9999')
      }
    }
  })

  it('has no duplicate UN numbers within an entry', () => {
    for (const s of SYNONYMS) expect(new Set(s.unNumbers).size, s.term).toBe(s.unNumbers.length)
  })

  it('has no duplicate terms, even ignoring case, umlauts, separators and plurals', () => {
    const seen = new Map<string, string>()
    for (const s of SYNONYMS) {
      const key = foldedStem(s.term)
      expect(seen.get(key), `${s.term} duplicates ${seen.get(key)}`).toBeUndefined()
      seen.set(key, s.term)
    }
  })

  it('gives every entry a source, and every entry without UN numbers a note', () => {
    for (const s of SYNONYMS) {
      expect(s.source.trim(), s.term).not.toBe('')
      if (s.unNumbers.length === 0) expect(s.note, s.term).toBeTruthy()
    }
  })

  it.each([
    ['Natronlauge', ['1824']],
    ['Salzsäure', ['1789']],
    ['Batteriesäure', ['2796']],
    ['Lithium-Ionen-Akku', ['3480', '3481']],
    ['Lithium-Metall-Batterie', ['3090', '3091']],
    ['Altbatterien', ['3480', '3090', '2794', '2800']],
    ['Spraydose', ['1950']],
    ['Verdünnung', ['1263', '1993']],
    ['Altöl', ['3082', '1202', '1993']],
    ['Flüssiggas', ['1965', '1978', '1075']],
    ['Spiritus', ['1170', '1987']],
    ['Airbag', ['3268', '0503']],
    ['Streichhölzer', ['1944', '1945', '1331']],
  ])('maps %s to %j', (term, uns) => {
    const entry = SYNONYMS.find(s => s.term === term)
    expect(entry, term).toBeDefined()
    expect(entry!.unNumbers).toEqual(uns)
  })

  it('marks Glykol-Kühlmittel as usually not dangerous goods', () => {
    const glykol = SYNONYMS.find(s => s.term === 'Glykol')!
    expect(glykol.unNumbers).toEqual([])
    expect(glykol.note).toContain('in der Regel kein Gefahrgut')
  })
})

describe('matchSynonyms', () => {
  it('ignores case, umlauts and separators', () => {
    expect(unsFor('natronlauge')).toEqual(['1824'])
    expect(unsFor('Salzsaeure')).toEqual(['1789'])
    expect(unsFor('lithium ionen akku')).toEqual(['3480', '3481'])
  })

  it('tolerates plurals', () => {
    expect(unsFor('Spraydosen')).toEqual(['1950'])
    expect(unsFor('Akkus')).toEqual(['3480', '3481'])
  })

  it('matches a term the query contains as whole words', () => {
    expect(unsFor('Natronlauge 50 %')).toEqual(['1824'])
    expect(unsFor('Spraydosen leer')).toEqual(['1950'])
  })

  it('matches the start of a term from 5 characters on', () => {
    expect(unsFor('Natronl')).toEqual(['1824'])
    expect(matchSynonyms('Akk').length).toBe(0)
  })

  it('matches short abbreviations only exactly', () => {
    expect(unsFor('IPA')).toEqual(['1219'])
    expect(unsFor('ip')).toEqual([])
    expect(unsFor('UN3373')).toEqual([])
  })

  it('finds English everyday names', () => {
    expect(unsFor('battery')).toContain('3480')
    expect(unsFor('batteries')).toContain('3480')
  })

  it('returns nothing for an empty query', () => {
    expect(matchSynonyms('  ')).toEqual([])
  })
})
