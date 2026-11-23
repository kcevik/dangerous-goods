import { describe, expect, it } from 'vitest'
import { bookSections, DETAIL_FIELDS, DETAIL_GROUPS, detailGroups } from '$lib/multimodal/details'
import { type Entry, getL, LABELS } from '$lib/multimodal/types'

const L = (key: string) => getL('de', key)
const e = (partial: Partial<Entry>): Entry => ({ unNumber: '1203', sequenceNumber: 1, ...partial })

// UN 1203 seq. 1 as the live ADR/RID tables carry it (2026-11-23)
const ADR_1203 = e({
  packingSv: 'BB2', coPacking: 'MP19',
  portableTankInstr: 'T4', portableTankSv: 'TP1',
  tankCodes: 'LGBF', tankSv: 'TU9', tankVehicle: 'FL',
  operationSv: 'S2, S20',
  securityLevel: '1', securityQtyTank: '3000', securityQtyBulk: 'a)', securityQtyPackages: 'b)',
  envHazard: '+',
})

const byField = (groups: ReturnType<typeof detailGroups>) =>
  Object.fromEntries(groups.flatMap(g => g.rows.map(r => [r.field, r])))

describe('detailGroups', () => {
  it('groups the ADR detail columns in reading order and drops empty groups', () => {
    const groups = detailGroups(ADR_1203, 'ADR', L)
    expect(groups.map(g => g.label)).toEqual(['Verpackung', 'Tank', 'Beförderung', 'Sicherung (1.10)', 'Weitere Angaben'])
    expect(groups[1]!.rows.map(r => r.label)).toEqual([
      'Ortsbewegliche Tanks und Schüttgut-Container', 'Sondervorschriften ortsbewegliche Tanks', 'Tankcodierung', 'Sondervorschriften Tanks', 'Fahrzeug für Tankbeförderung',
    ])
  })

  it('splits code lists and links each ADR row to the section that defines its codes', () => {
    const rows = byField(detailGroups(ADR_1203, 'ADR', L))
    expect(rows.operationSv).toMatchObject({ codes: ['S2', 'S20'], sections: ['8.5'] })
    expect(rows.coPacking!.sections).toEqual(['4.1.10'])
    expect(rows.tankCodes!.sections).toEqual(['4.3.4.1.1'])
    expect(rows.tankSv!.sections).toEqual(['4.3.5'])
    expect(rows.securityLevel!.sections).toEqual(['1.10.3'])
  })

  it('never links outside the ADR — the viewer holds the ADR only', () => {
    const rid = detailGroups({ ...ADR_1203, tankSv: 'TU38, TE22' }, 'RID', L)
    for (const row of rid.flatMap(g => g.rows)) expect(row.sections).toEqual([])
  })

  it('explains the 1.10.3 values in words (BAM: "a)" moot, "b)" never applies)', () => {
    const rows = byField(detailGroups(ADR_1203, 'ADR', L))
    expect(rows.securityLevel!.text).toBe('Ja – 1.10.3 gilt oberhalb der Mengen unten')
    expect(rows.securityQtyTank!.text).toBe('> 3000 l')
    expect(rows.securityQtyBulk!.text).toBe('gegenstandslos')
    expect(rows.securityQtyPackages!.text).toBe('gilt nicht, unabhängig von der Menge')
    expect(detailGroups(e({ securityLevel: '1', securityQtyPackages: '0' }), 'ADR', L)
      .flatMap(g => g.rows).find(r => r.field === 'securityQtyPackages')!.text).toBe('jede Menge')
  })

  it('shows no thresholds for a good that is not high consequence', () => {
    const rows = byField(detailGroups(e({ securityLevel: '0', securityQtyTank: '3000' }), 'ADR', L))
    expect(rows.securityLevel!.text).toBe('Nein – 1.10.3 gilt nicht')
    expect(rows.securityQtyTank).toBeUndefined()
  })

  it('states BAM\'s "no statement" as "Keine Angabe in der Quelle (BAM)" instead of leaving it out', () => {
    const rows = byField(detailGroups(e({}), 'ADR', L))
    expect(rows.envHazard).toMatchObject({ noSource: true, text: null })
    expect(rows.securityLevel).toMatchObject({ noSource: true })
    // an empty Table A cell is not ours to interpret: left out
    expect(rows.tankCodes).toBeUndefined()
  })

  it('reads the N mark ("+", "-", "E")', () => {
    const text = (v: string) => byField(detailGroups(e({ envHazard: v }), 'ADR', L)).envHazard!.text
    expect(text('+')).toBe('Ja')
    expect(text('-')).toBe('Nein')
    expect(text('E')).toMatch(/Versender entscheidet/)
  })

  it('shows IMDG only its own columns — no ADR tank code, no 1.10 rows', () => {
    const groups = detailGroups(e({ portableTankInstr: 'T4', portableTankSv: 'TP1', imdgHandling: 'H1', segregationGroups: 'SGG1', tankCodes: 'LGBF' }), 'IMDG', L)
    const rows = byField(groups)
    expect(Object.keys(rows)).toEqual(['portableTankInstr', 'portableTankSv', 'imdgHandling', 'segregationGroups'])
    expect(groups.map(g => g.key)).toEqual(['tank', 'stowage'])
  })

  it('has no detail rows for ICAO', () => {
    expect(detailGroups(ADR_1203, 'ICAO', L)).toEqual([])
  })
})

describe('bookSections', () => {
  it('maps every code family to the ADR section that defines it', () => {
    expect(bookSections('packingSv', ['PP87', 'RR6', 'L2', 'B3', 'BB2'])).toEqual(['4.1.4'])
    expect(bookSections('portableTankInstr', ['T1', 'BK1', 'BK2'])).toEqual(['4.2.5.2.6', '7.3.2'])
    expect(bookSections('portableTankSv', ['TP33'])).toEqual(['4.2.5.3'])
    expect(bookSections('tankSv', ['TU38', 'TE22', 'TA4', 'TT8', 'TM6', 'TC1'])).toEqual(['4.3.5', '6.8.4'])
    expect(bookSections('tankCodes', ['PxBH(M)'])).toEqual(['4.3.3.1.1'])
    expect(bookSections('tankCodes', ['SGAV', 'LGBV'])).toEqual(['4.3.4.1.1'])
    expect(bookSections('packageSv', ['V12'])).toEqual(['7.2.4'])
    expect(bookSections('bulkSv', ['VC1', 'AP6'])).toEqual(['7.3.3'])
    expect(bookSections('handlingSv', ['CV9'])).toEqual(['7.5.11'])
    expect(bookSections('tankVehicle', ['FL'])).toEqual(['9.1.1.2'])
    expect(bookSections('compatibilityGroup', ['D'])).toEqual(['7.5.2.2'])
  })

  it('links nothing it cannot place', () => {
    expect(bookSections('packageSv', ['X99'])).toEqual([])
  })
})

describe('DETAIL_FIELDS', () => {
  it('has a label in every language for every field and group', () => {
    for (const key of [...DETAIL_FIELDS.map(f => f.labelKey), ...DETAIL_GROUPS.map(g => g.labelKey)]) {
      expect(LABELS.de[key], key).toBeTruthy()
    }
  })

  it('never lists ADN or ICAO (no such columns in the feed)', () => {
    for (const f of DETAIL_FIELDS) expect(f.modes.some(m => m === 'ADN' || m === 'ICAO'), f.field).toBe(false)
  })
})
