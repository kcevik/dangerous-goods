// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { AGB } from '$lib/legalPages/agb'
import { DATENSCHUTZ } from '$lib/legalPages/datenschutz'
import { fillDocument, type LegalDocument } from '$lib/legalPages/document'
import { FACT_LABELS, type LegalFacts, LEGAL_FACTS } from '$lib/legalPages/facts'
import { IMPRESSUM } from '$lib/legalPages/impressum'
import { WIDERRUF } from '$lib/legalPages/widerruf'

const DOCUMENTS: Record<string, LegalDocument> = { IMPRESSUM, DATENSCHUTZ, AGB, WIDERRUF }

const COMPLETE: LegalFacts = Object.fromEntries(
  Object.keys(LEGAL_FACTS).map(key => [key, `«${key}»`]),
) as unknown as LegalFacts

const doc: LegalDocument = {
  title: 'Test',
  blocks: [
    { kind: 'p', text: 'Betreiber: {companyName}, {city}' },
    { kind: 'p', text: 'USt-IdNr.: {vatId}', requires: 'vatId' },
    { kind: 'ul', items: ['Mail {email}'] },
  ],
}

describe('fillDocument', () => {
  it('fills known facts and marks missing ones as placeholders', () => {
    const filled = fillDocument(doc, { ...COMPLETE, companyName: 'Muster GmbH', city: null })
    expect(filled.blocks[0]).toEqual({ kind: 'p', text: `Betreiber: Muster GmbH, [[${FACT_LABELS.city}]]` })
    expect(filled.missing).toEqual([FACT_LABELS.city])
  })

  it('drops a block whose required fact does not apply (false)', () => {
    const filled = fillDocument(doc, { ...COMPLETE, vatId: false })
    expect(filled.blocks.map(b => b.kind)).toEqual(['p', 'ul'])
    expect(filled.missing).toEqual([])
  })

  it('lists each missing fact once, also inside lists', () => {
    const filled = fillDocument({ title: 'x', blocks: [{ kind: 'p', text: '{email}' }, { kind: 'ul', items: ['{email}'] }] }, { ...COMPLETE, email: null })
    expect(filled.missing).toEqual([FACT_LABELS.email])
    expect(filled.blocks[1]).toEqual({ kind: 'ul', items: [`[[${FACT_LABELS.email}]]`] })
  })
})

describe('legal documents', () => {
  for (const [name, document] of Object.entries(DOCUMENTS)) {
    it(`${name} uses only known facts and is complete once every fact is set`, () => {
      const filled = fillDocument(document, COMPLETE)
      expect(filled.missing).toEqual([])
      const text = JSON.stringify(filled.blocks)
      expect(text, 'unknown {token}').not.toMatch(/\{[a-zA-Z]+\}/)
      expect(text).not.toContain('[[')
    })
  }

  it('every fact has a German label for the placeholder report', () => {
    expect(Object.keys(FACT_LABELS).sort()).toEqual(Object.keys(LEGAL_FACTS).sort())
  })

  it('the Impressum names the operator, contact and the content responsible (§ 5 DDG, § 18 MStV)', () => {
    const text = JSON.stringify(fillDocument(IMPRESSUM, COMPLETE).blocks)
    for (const key of ['companyName', 'street', 'postalCode', 'city', 'email', 'phone', 'contentResponsible']) {
      expect(text, key).toContain(`«${key}»`)
    }
    expect(text).toContain('§ 5 DDG')
    expect(text).toContain('dl-de/by-2-0')
    expect(text).toContain('BMIMI')
  })

  it('the Datenschutzerklärung covers processors, cookies, the launch list and the data subject rights', () => {
    const text = JSON.stringify(DATENSCHUTZ.blocks)
    for (const needle of ['STRATO AG', 'Supabase', 'Frankfurt', 'Standardvertragsklauseln', 'Double-Opt-in', '§ 25 Abs. 2 Nr. 2 TDDDG', 'Stripe', 'Art. 15', 'Art. 21', 'Art. 77', 'Widerspruchsrecht']) {
      expect(text, needle).toContain(needle)
    }
  })

  it('the AGB address consumers and businesses, the binding-text disclaimer and the monthly notice after the minimum term', () => {
    const text = JSON.stringify(AGB.blocks)
    for (const needle of ['§ 13 BGB', '§ 14 BGB', 'kein rechtsverbindlicher Text', 'keine Rechtsberatung', 'einem Monat', '§§ 327 ff. BGB', 'Widerrufsbelehrung']) {
      expect(text, needle).toContain(needle)
    }
  })

  it('the Widerrufsbelehrung follows the statutory model and contains the model form', () => {
    const text = JSON.stringify(WIDERRUF.blocks)
    expect(text).toContain('binnen vierzehn Tagen ohne Angabe von Gründen')
    expect(text).toContain('Muster-Widerrufsformular')
    expect(text).toContain('angemessenen Betrag')
  })
})
