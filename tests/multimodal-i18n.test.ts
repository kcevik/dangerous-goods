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

  it('every special provision code referenced in demo entries has a DEMO_SVS text', () => {
    for (const [mode, entries] of Object.entries(DEMO_DATA)) {
      for (const entry of entries) {
        const codes = (entry.specialProvisions ?? '').split(',').map(s => s.trim()).filter(Boolean)
        for (const code of codes) {
          expect(DEMO_SVS[code], `${mode} SV ${code}`).toBeTruthy()
        }
      }
    }
  })
})

describe('BK_CLASSES', () => {
  it('every value is a non-empty class string', () => {
    for (const value of Object.values(BK_CLASSES)) {
      expect(value).toMatch(/bg-/)
    }
  })
})
