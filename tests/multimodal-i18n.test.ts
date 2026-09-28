import { describe, expect, it } from 'vitest'
import {
  BK_CLASSES,
  DEMO_DATA,
  DEMO_SVS,
  getL,
  LABELS,
  LANGS,
  MODAL_DESC_I18N,
  MODALS,
  pickSvText,
} from '$lib/multimodal/types'

describe('LABELS', () => {
  const deKeys = Object.keys(LABELS.de).sort()

  for (const lang of LANGS) {
    it(`"${lang}" has exactly the same label keys as "de"`, () => {
      expect(Object.keys(LABELS[lang]).sort()).toEqual(deKeys)
    })

    it(`"${lang}" has no empty label values`, () => {
      for (const [key, value] of Object.entries(LABELS[lang])) {
        expect(value.trim(), `${lang}.${key}`).not.toBe('')
      }
    })
  }
})

describe('MODAL_DESC_I18N', () => {
  for (const lang of LANGS) {
    it(`"${lang}" describes every transport mode`, () => {
      expect(Object.keys(MODAL_DESC_I18N[lang]).sort()).toEqual([...MODALS].sort())
    })
  }
})

describe('getL', () => {
  it('returns the label for a known key', () => {
    expect(getL('de', 'class')).toBe('Klasse')
    expect(getL('en', 'class')).toBe('Class')
  })

  it('returns the key itself when no label exists', () => {
    expect(getL('de', 'doesNotExist')).toBe('doesNotExist')
  })
})

describe('DEMO_DATA', () => {
  it('only contains known transport modes', () => {
    for (const mode of Object.keys(DEMO_DATA)) {
      expect(MODALS).toContain(mode)
    }
  })

  it('all demo entries are UN 1203', () => {
    for (const entries of Object.values(DEMO_DATA)) {
      for (const entry of entries) {
        expect(entry.unNumber).toBe('1203')
      }
    }
  })

  it('every special provision code referenced in demo entries has a DEMO_SVS text for that mode', () => {
    for (const [mode, entries] of Object.entries(DEMO_DATA)) {
      for (const entry of entries) {
        const codes = (entry.specialProvisions ?? '').split(',').map(s => s.trim()).filter(Boolean)
        for (const code of codes) {
          expect(DEMO_SVS[`${mode}:${code}`], `${mode} SV ${code}`).toBeTruthy()
        }
      }
    }
  })

  it('has no ADN rows, because the BAM dataset ships none', () => {
    expect(DEMO_DATA.ADN).toEqual([])
  })
})

describe('BK_CLASSES', () => {
  it('every value is a non-empty class string', () => {
    for (const value of Object.values(BK_CLASSES)) {
      expect(value).toMatch(/bg-/)
    }
  })
})

describe('DEMO_SVS', () => {
  it('is keyed by mode and code', () => {
    for (const key of Object.keys(DEMO_SVS)) {
      const [mode] = key.split(':')
      expect(MODALS, key).toContain(mode)
    }
  })

  it('has at least one language for every provision', () => {
    for (const [key, sv] of Object.entries(DEMO_SVS)) {
      const any = sv.textDe ?? sv.textEn ?? sv.textFr
      expect(any?.trim(), key).toBeTruthy()
    }
  })

  it('mirrors the real language coverage of the BAM dataset', () => {
    // road has all three; rail and sea have no French; air is English only
    expect(DEMO_SVS['ADR:243']?.textFr).toBeTruthy()
    expect(DEMO_SVS['RID:243']?.textFr).toBeNull()
    expect(DEMO_SVS['IMDG:243']?.textFr).toBeNull()
    expect(DEMO_SVS['ICAO:A100']?.textDe).toBeNull()
    expect(DEMO_SVS['ICAO:A100']?.textEn).toBeTruthy()
  })

  it('never repeats one language text in another language slot', () => {
    for (const [key, sv] of Object.entries(DEMO_SVS)) {
      if (sv.textDe && sv.textEn) expect(sv.textEn, key).not.toBe(sv.textDe)
      if (sv.textDe && sv.textFr) expect(sv.textFr, key).not.toBe(sv.textDe)
    }
  })
})

describe('pickSvText', () => {
  const all = { textDe: 'de', textEn: 'en', textFr: 'fr' }

  it('returns the text for the requested language', () => {
    expect(pickSvText(all, 'de')).toBe('de')
    expect(pickSvText(all, 'en')).toBe('en')
    expect(pickSvText(all, 'fr')).toBe('fr')
  })

  it('reads English first for Turkish, which the dataset never carries', () => {
    expect(pickSvText(all, 'tr')).toBe('en')
    expect(pickSvText({ textDe: 'de', textEn: null, textFr: null }, 'tr')).toBe('de')
  })

  it('falls back through the other languages and finally to null', () => {
    expect(pickSvText({ textDe: null, textEn: 'en', textFr: null }, 'fr')).toBe('en')
    expect(pickSvText({ textDe: 'de', textEn: null, textFr: null }, 'fr')).toBe('de')
    expect(pickSvText({ textDe: null, textEn: null, textFr: null }, 'de')).toBeNull()
  })
})

describe('translated short badges', () => {
  it('every language has its own packing-group and transport-category abbreviation', () => {
    const pg = LANGS.map(l => LABELS[l].pgShort)
    const tc = LANGS.map(l => LABELS[l].transportCatShort)
    for (const v of [...pg, ...tc]) expect(v?.trim()).toBeTruthy()
    expect(new Set(pg).size).toBeGreaterThan(1)
    expect(new Set(tc).size).toBeGreaterThan(1)
  })
})
