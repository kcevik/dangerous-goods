// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { LANGS } from '$lib/multimodal/types'
import {
  BOOK_LABELS,
  formatBookLabel,
  getBookLabel,
  HIT_LIMIT,
  MAX_BOOK_QUERY_LENGTH,
  MIN_BOOK_QUERY_LENGTH,
  RANK_BY_ROLE,
} from '$lib/regulations/bookTypes'

describe('BOOK_LABELS', () => {
  const deKeys = Object.keys(BOOK_LABELS.de).sort()

  for (const lang of LANGS) {
    it(`"${lang}" has exactly the same keys as "de"`, () => {
      expect(Object.keys(BOOK_LABELS[lang]).sort()).toEqual(deKeys)
    })

    it(`"${lang}" has no empty values`, () => {
      for (const [key, value] of Object.entries(BOOK_LABELS[lang])) {
        expect(value.trim(), `${lang}.${key}`).not.toBe('')
      }
    })
  }

  it('tells non-German readers that the book text is German only', () => {
    for (const lang of LANGS) {
      expect(BOOK_LABELS[lang].germanOnly?.trim(), lang).toBeTruthy()
    }
  })

  it('keeps every placeholder that the German string declares', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const [key, de] of Object.entries(BOOK_LABELS.de)) {
      const expected = placeholders(de)
      if (expected.length === 0) continue
      for (const lang of LANGS) {
        expect(placeholders(BOOK_LABELS[lang][key]!), `${lang}.${key}`).toEqual(expected)
      }
    }
  })
})

describe('German copy matches the spec verbatim', () => {
  // spec §8 fixes these so implementation cannot invent them
  const fixed: Record<string, string> = {
    bookTitle: 'ADR 2025 – konsolidierter Text',
    noHits: 'Keine Treffer',
    notBinding: 'Kein rechtsverbindlicher Text. Maßgeblich ist die amtliche Fassung.',
    lockedNotice: 'Der ADR-Volltext ist nach der Freischaltung verfügbar.',
    openInBook: 'Im ADR-Text öffnen',
  }

  for (const [key, value] of Object.entries(fixed)) {
    it(`${key}`, () => {
      expect(BOOK_LABELS.de[key]).toBe(value)
    })
  }
})

describe('getBookLabel', () => {
  it('returns the label in the requested language', () => {
    expect(getBookLabel('de', 'noHits')).toBe('Keine Treffer')
    expect(getBookLabel('en', 'noHits')).toBe('No matches')
  })

  it('falls back to German when the language has no such key', () => {
    // simulate a key present only in German
    const key = 'onlyInGerman'
    BOOK_LABELS.de[key] = 'Nur Deutsch'
    try {
      expect(getBookLabel('tr', key)).toBe('Nur Deutsch')
    }
    finally {
      delete BOOK_LABELS.de[key]
    }
  })

  it('falls back to the key itself when nothing has it', () => {
    expect(getBookLabel('tr', 'unknownKey')).toBe('unknownKey')
  })
})

describe('formatBookLabel', () => {
  it('fills named placeholders', () => {
    expect(formatBookLabel('de', 'hitCounter', { current: 3, total: 778 }))
      .toBe('Treffer 3 von 778')
  })

  it('leaves a placeholder alone when no value is given', () => {
    expect(formatBookLabel('de', 'sectionNotFound', {})).toContain('{code}')
  })

  it('works across languages', () => {
    expect(formatBookLabel('en', 'hitCounter', { current: 1, total: 2 })).toBe('Match 1 of 2')
    expect(formatBookLabel('fr', 'cappedNote', { limit: 500 })).toContain('500')
  })
})

describe('shared constants', () => {
  it('ranks the definition above every other role', () => {
    expect(RANK_BY_ROLE.definition).toBe(1)
    expect(RANK_BY_ROLE.tableARow).toBe(1)
    for (const [role, rank] of Object.entries(RANK_BY_ROLE)) {
      if (role === 'definition' || role === 'tableARow') continue
      expect(rank, role).toBeGreaterThan(1)
    }
  })

  it('treats incidental hits as the noise class', () => {
    expect(RANK_BY_ROLE.incidental).toBe(5)
  })

  it('has a sane query length window and hit cap', () => {
    expect(MIN_BOOK_QUERY_LENGTH).toBeGreaterThanOrEqual(2)
    expect(MAX_BOOK_QUERY_LENGTH).toBeGreaterThan(MIN_BOOK_QUERY_LENGTH)
    expect(HIT_LIMIT).toBeGreaterThan(0)
  })
})
