import { describe, expect, it } from 'vitest'
import { ComparisonViewState } from '$lib/multimodal/comparisonView.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'
import { UN_1203, UN_1993 } from './fixtures/variant-rows'

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const rowOf = (view: ComparisonViewState, field: keyof Entry) => view.rows.find(r => r.field === field)!

const AMBIGUOUS: Record<string, Entry[]> = {
  ADR: [e({ packingGroup: 'II', limitedQty: '1 L' })],
  IMDG: [
    e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', limitedQty: '1 L' }),
    e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' }),
  ],
}

describe('ComparisonViewState', () => {
  it('compares the chosen variant across modes', () => {
    const view = new ComparisonViewState(UN_1993 as Record<string, Entry[]>)
    expect(view.anchorMode).toBe('ADR')
    expect(view.anchorVariants).toHaveLength(5)
    expect(rowOf(view, 'limitedQty').cells.IMDG.raw).toBe('0')
    view.selectVariant(3)
    expect(rowOf(view, 'limitedQty').cells.IMDG.raw).toBe('5 L')
    expect(rowOf(view, 'packingGroup').status).toBe('same')
  })

  it('names the substance by the chosen variant, current language first', () => {
    const view = new ComparisonViewState(UN_1203 as Record<string, Entry[]>)
    expect(view.title.primary).toBe('BENZIN')
    view.setLang('en')
    expect(view.title.primary).toBe('MOTOR SPIRIT')
    expect(view.L('limitedQty')).toBe('Limited qty.')
  })

  it('hides missing rows and, on request, every row without a difference', () => {
    const view = new ComparisonViewState(DEMO_DATA)
    expect(view.visibleRows.some(r => r.status === 'missing')).toBe(false)
    view.onlyDifferences = true
    expect(view.visibleRows.map(r => r.field)).toEqual(['specialProvisions'])
  })

  it('summarises critical deviations as plain facts', () => {
    const view = new ComparisonViewState({ ADR: [e({ limitedQty: '5 L' })], RID: [e({ limitedQty: '5 L' })], IMDG: [e({ limitedQty: '1 L' })] })
    expect(view.deviations.map(r => r.field)).toEqual(['limitedQty'])
    expect(view.deviationText(view.deviations[0]!)).toBe('ADR 5 L · RID 5 L · IMDG 1 L')
  })

  it('asks for a pick where no variant matches, keeps the picker after a manual pick, and resets it', () => {
    const view = new ComparisonViewState(AMBIGUOUS)
    expect(view.pickModes).toEqual(['IMDG'])
    expect(rowOf(view, 'limitedQty').cells.IMDG.unresolved).toBe(true)
    view.overrideVariant('IMDG', 1)
    expect(rowOf(view, 'limitedQty').cells.IMDG.raw).toBe('5 L')
    expect(view.pickModes).toEqual(['IMDG'])
    view.selectVariant(0)
    expect(view.overrides).toEqual({})
  })

  it('names the modes that were not compared and does not claim agreement for them (review I3)', () => {
    const view = new ComparisonViewState(AMBIGUOUS)
    expect(view.unresolvedModes).toEqual(['IMDG'])
    expect(view.comparedModes).toEqual(['ADR'])
    expect(view.visibleRows.some(r => r.field === 'ems1')).toBe(true)
  })

  it('never treats a mode without rows as needing a pick', () => {
    const view = new ComparisonViewState({ ...DEMO_DATA, ADN: [] })
    expect(view.pickModes).toEqual([])
    expect(view.hasRows('ADN')).toBe(false)
  })

  it('matches the UN reference variant and marks it unresolved when ambiguous', () => {
    const ref = [e({ packingGroup: 'II', limitedQty: '1 L', specialProvisions: '243' })]
    const view = new ComparisonViewState(DEMO_DATA, ref)
    expect(view.hasReference).toBe(true)
    expect(rowOf(view, 'specialProvisions').reference?.raw).toBe('243')

    const twoRefs = [e({ sequenceNumber: 1, packingGroup: 'II', specification: 'A' }), e({ sequenceNumber: 2, packingGroup: 'II', specification: 'B', limitedQty: '5 L' })]
    const ambiguous = new ComparisonViewState(DEMO_DATA, twoRefs)
    expect(rowOf(ambiguous, 'limitedQty').reference?.unresolved).toBe(true)
  })

  it('handles a UN number with no rows in any mode', () => {
    const view = new ComparisonViewState({ ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] })
    expect(view.anchorMode).toBeNull()
    expect(view.visibleRows).toEqual([])
  })
})
