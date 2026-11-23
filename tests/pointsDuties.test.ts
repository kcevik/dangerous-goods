import { describe, expect, it } from 'vitest'
import {
  adrSectionHref,
  CALCULATION_NOTES,
  DISCLAIMER,
  LIFTED_RULES,
  REFERENCED_SECTIONS,
  REMAINING_DUTIES,
  RULE_REF,
} from '$lib/points/duties'

const SECTION_RE = /^\d+(?:\.\d+){0,5}$/

describe('1.1.3.6 duties', () => {
  it('keeps the duties 1.1.3.6.2 leaves in force', () => {
    const refs = REMAINING_DUTIES.flatMap(d => d.refs.map(r => r.label ?? r.section)).join(' ')
    for (const ref of ['5.4.1', '8.1.2.1 a)', '8.1.4.2 bis 8.1.4.5', '8.2.3', '8.3.3', '8.3.4', '8.3.5', 'Kapitel 8.4', '7.5.2', '1.10.3.1']) {
      expect(refs).toContain(ref)
    }
    const text = REMAINING_DUTIES.map(d => d.text).join(' ')
    expect(text).toContain('2 kg')
    expect(text).toContain('S1 (3) und (6), S2 (1), S4, S5, S14 bis S21 und S24')
  })

  it('lists what is lifted, including placards, written instructions and tunnels', () => {
    const text = LIFTED_RULES.map(d => `${d.text} ${d.refs.map(r => r.label ?? r.section).join(' ')}`).join(' ')
    expect(text).toContain('Kapitel 5.3')
    expect(text).toContain('5.4.3')
    expect(text).toContain('Kapitel 8.6')
    expect(text).toContain('Teil 9')
  })

  it('tells that LQ/EQ do not count (1.1.3.6.5, 3.4, 3.5)', () => {
    const lq = CALCULATION_NOTES.find(n => n.text.includes('LQ'))!
    expect(lq.refs.map(r => r.section)).toEqual(['1.1.3.6.5', '3.4', '3.5'])
  })

  it('carries the disclaimer word for word', () => {
    expect(DISCLAIMER).toBe('Hilfsmittel – keine Rechtsberatung, maßgeblich ist der ADR-Text.')
  })

  it('collects every referenced section once, all valid for ?section=', () => {
    expect(new Set(REFERENCED_SECTIONS).size).toBe(REFERENCED_SECTIONS.length)
    expect(REFERENCED_SECTIONS).toContain(RULE_REF.section)
    expect(REFERENCED_SECTIONS).toContain('8.1.4.2')
    for (const s of REFERENCED_SECTIONS) expect(s).toMatch(SECTION_RE)
  })

  it('links a section only when the book has it as a heading', () => {
    const linkable = new Set(['8.3.3'])
    expect(adrSectionHref('8.3.3', linkable)).toBe('/regelwerk/adr?section=8.3.3')
    expect(adrSectionHref('1.1.3.6.2', linkable)).toBeNull()
  })
})
