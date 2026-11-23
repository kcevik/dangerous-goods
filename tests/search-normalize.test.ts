// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  foldedStem,
  foldText,
  namePatterns,
  parseUnNumber,
  searchableLength,
  searchTokens,
  stemToken,
  unPrefix,
} from '$lib/search/normalize'

describe('foldText', () => {
  it('folds case, umlauts and ß both ways', () => {
    expect(foldText('SCHWEFELSÄURE')).toBe('schwefelsaeure')
    expect(foldText('Schwefelsaeure')).toBe('schwefelsaeure')
    expect(foldText('Weißer Phosphor')).toBe(foldText('WEISSER PHOSPHOR'))
    expect(foldText('Öl')).toBe('oel')
    expect(foldText('Übermangansäure')).toBe('uebermangansaeure')
  })

  it('turns hyphens, commas and runs of spaces into one space', () => {
    expect(foldText('  LITHIUM-IONEN-BATTERIEN,   MIT  AUSRÜSTUNGEN ')).toBe('lithium ionen batterien mit ausruestungen')
  })

  it('drops accents (French names)', () => {
    expect(foldText('Éther éthylique')).toBe('ether ethylique')
  })
})

describe('parseUnNumber', () => {
  it.each(['3373', 'UN3373', 'UN 3373', 'un-3373', ' un 3373 ', 'Un3373', 'UN - 3373'])('%s → 3373', (q) => {
    expect(parseUnNumber(q)).toBe('3373')
  })

  it.each(['337', '33733', 'UN33733', 'Benzin', '3373 Benzin', 'UNX3373'])('%s is no UN number', (q) => {
    expect(parseUnNumber(q)).toBeNull()
  })
})

describe('unPrefix', () => {
  it('reads partial UN numbers with or without "UN"', () => {
    expect(unPrefix('33')).toBe('33')
    expect(unPrefix('UN 33')).toBe('33')
    expect(unPrefix('un-120')).toBe('120')
    expect(unPrefix('Benzin')).toBeNull()
    expect(unPrefix('12 Benzin')).toBeNull()
  })
})

describe('stemToken', () => {
  it('drops plural endings of words with 5+ letters only', () => {
    expect(stemToken('batterien')).toBe('batterie')
    expect(stemToken('farben')).toBe('farbe')
    expect(stemToken('spraydosen')).toBe('spraydose')
    expect(stemToken('akkus')).toBe('akku')
    expect(stemToken('battery')).toBe('batter')
    expect(stemToken('benzin')).toBe('benzin')
    expect(stemToken('fluss')).toBe('fluss')
    expect(stemToken('gas')).toBe('gas')
  })
})

describe('searchTokens / namePatterns', () => {
  it('splits on spaces and hyphens and keeps umlauts', () => {
    expect(searchTokens('Lithium  Ionen-Akku')).toEqual(['lithium', 'ione', 'akku'])
    expect(searchTokens('Säure')).toEqual(['säure'])
  })

  it('joins words with % so separators in the official name do not matter', () => {
    expect(namePatterns('Lithium Ionen')).toEqual(['%lithium%ione%'])
    expect(namePatterns('lithium-ionen')).toEqual(['%lithium%ione%'])
  })

  it('tries ae/oe/ue as typed and as umlaut', () => {
    expect(namePatterns('Salzsaeure').sort()).toEqual(['%salzsaeure%', '%salzsäure%'].sort())
    expect(namePatterns('Heizoel').sort()).toEqual(['%heizoel%', '%heizöl%'].sort())
  })

  it('combines several umlaut sites', () => {
    expect(namePatterns('aeoe')).toHaveLength(4)
  })

  it('turns ß into ss (the BAM names never contain ß)', () => {
    expect(namePatterns('Weißer')).toEqual(['%weisser%'])
  })

  it('removes PostgREST delimiters and LIKE wildcards', () => {
    expect(namePatterns('a,b(c)d%e*f_g\\h"i:j')).toEqual(['%a%b%c%d%e%f%g%h%i%j%'])
    expect(namePatterns('%%')).toEqual([])
  })

  it('measures what is left to search', () => {
    expect(searchableLength('%%')).toBe(0)
    expect(searchableLength(' - ')).toBe(0)
    expect(searchableLength('a"b')).toBe(2)
  })
})

describe('foldedStem', () => {
  it('folds and stems every word', () => {
    expect(foldedStem('Spraydosen')).toBe('spraydose')
    expect(foldedStem('Lithium-Ionen-Akkus')).toBe('lithium ione akku')
  })
})
