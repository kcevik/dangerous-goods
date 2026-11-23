import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import ComparisonView from '$lib/multimodal/ComparisonView.svelte'
import { ComparisonViewState } from '$lib/multimodal/comparisonView.svelte'
import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'

/** Persona test 2026-11-23, section 1 — what the comparison page and the mode tabs say. */

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const cell = (container: HTMLElement, field: string, mode: string) =>
  container.querySelector(`tr[data-field="${field}"] td[data-mode="${mode}"]`)!
const srText = (el: Element) => [...el.querySelectorAll('.sr-only')].map(s => s.textContent).join(' ')

const UN_1005: Record<string, Entry[]> = {
  ADR: [e({ unNumber: '1005', hazardClass: '2', classificationCode: '2TC', limitedQty: '0', kemlerNumber: '268' })],
  RID: [e({ unNumber: '1005', hazardClass: '2', classificationCode: '2TC', limitedQty: '0' })],
  IMDG: [e({ unNumber: '1005', hazardClass: '2.3', limitedQty: '0', ems1: 'F-C', ems2: 'S-U!' })],
  ICAO: [e({ unNumber: '1005', name: 'Ammonia, anhydrous', hazardClass: '2.3', packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'FORBIDDEN', stateVariations: 'AU 1, CA 9, IR 3, NL 1, US 3' })],
}

const UN_3480: Record<string, Entry[]> = {
  ADR: [e({ unNumber: '3480', hazardClass: '9', limitedQty: '0' })],
  ICAO: [e({ unNumber: '3480', hazardClass: '9', packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'See 965' })],
}

describe('comparison page: prohibitions, source gaps, references', () => {
  it('flags an ICAO prohibition as critical in the summary, the table and the cards (UN 1005)', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1005', data: UN_1005 } })
    const summary = screen.getByTestId('deviation-summary')
    expect(summary).toHaveTextContent('Kritische Abweichungen')
    expect(screen.getByTestId('air-prohibition')).toHaveTextContent('Luftverkehr (ICAO): Beförderung verboten – auf Passagier- und Frachtflugzeugen')
    expect(summary).not.toHaveTextContent('Keine kritischen Abweichungen')
    expect(cell(container, 'packingInstrPassenger', 'ICAO')).toHaveAttribute('data-forbidden', 'true')
    expect(srText(cell(container, 'packingInstrPassenger', 'ICAO'))).toContain('Beförderung verboten')
    const card = screen.getByTestId('comparison-cards').querySelector('li[data-field="packingInstrCargo"]')!
    expect(card).toHaveTextContent('Verboten')
    expect(card.querySelector('[data-mode="ICAO"]')).toHaveAttribute('data-forbidden', 'true')
  })

  it('says "passenger aircraft forbidden – cargo aircraft only" (UN 3480)', () => {
    render(ComparisonView, { props: { unNumber: '3480', data: UN_3480 } })
    expect(screen.getByTestId('air-prohibition')).toHaveTextContent('Passagierflugzeug (ICAO): verboten – nur Frachtflugzeug')
  })

  it('keeps a prohibition visible with the "only differences" filter', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1005', data: UN_1005 } })
    await fireEvent.click(screen.getByLabelText('Nur Abweichungen zeigen'))
    const fields = [...container.querySelectorAll('tbody tr')].map(tr => tr.getAttribute('data-field'))
    expect(fields).toContain('packingInstrPassenger')
  })

  it('says "no data in the source" for the RID hazard number, in the table and the cards', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1005', data: UN_1005 } })
    expect(cell(container, 'kemlerNumber', 'RID')).toHaveAttribute('title', 'Keine Angabe in der Quelle (BAM)')
    expect(cell(container, 'kemlerNumber', 'IMDG')).toHaveAttribute('title', 'In diesem Regelwerk nicht vorgesehen')
    const card = screen.getByTestId('comparison-cards').querySelector('li[data-field="kemlerNumber"]')!
    expect([...card.querySelectorAll('[data-mode]')].map(d => d.getAttribute('data-mode'))).toEqual(['ADR', 'RID'])
    expect(srText(card.querySelector('[data-mode="RID"]')!)).toContain('Keine Angabe in der Quelle (BAM)')
    expect(screen.getAllByText('Keine Angabe in der Quelle (BAM)').length).toBeGreaterThan(0)
  })

  it('shows IMDG "See SP277" as a reference, not as a deviation (UN 1950)', () => {
    const data = { ADR: [e({ limitedQty: '1 L' })], RID: [e({ limitedQty: '1 L' })], IMDG: [e({ limitedQty: 'See SP277' })] }
    const { container } = render(ComparisonView, { props: { unNumber: '1950', data } })
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('Keine kritischen Abweichungen')
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveAttribute('data-deviates', 'false')
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveAttribute('title', 'Verweis auf eine Sondervorschrift – nicht verglichen')
  })

  it('shows ICAO limited quantity and state variations, uncompared', () => {
    const data = { ADR: [e({ limitedQty: '1 L' })], ICAO: [e({ limitedQty: 'Y341 · max 1 L', stateVariations: 'US 3' })] }
    const { container } = render(ComparisonView, { props: { unNumber: '1170', data } })
    expect(cell(container, 'limitedQty', 'ICAO')).toHaveTextContent('Y341 · max 1 L')
    expect(cell(container, 'limitedQty', 'ICAO')).toHaveAttribute('data-deviates', 'false')
    expect(cell(container, 'stateVariations', 'ICAO')).toHaveTextContent('US 3')
  })

  it('points the ICAO packing-instruction cell to the passenger and cargo rows', () => {
    const data = { ADR: [e({ packingInstructions: 'P001' })], ICAO: [e({ packingInstrPassenger: '353' })] }
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data } })
    expect(cell(container, 'packingInstructions', 'ICAO')).toHaveAttribute('title', 'Im Luftverkehr: siehe PI Passagier, PI Fracht')
  })

  it('renders an underlined EmS without the BAM "!" and explains it', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1005', data: UN_1005 } })
    const ems = cell(container, 'ems2', 'IMDG')
    expect(ems.querySelector('u')).toHaveTextContent('S-U')
    expect(ems.textContent).not.toContain('!')
    expect(srText(ems)).toContain('EmS-Leitfaden')
  })

  it('translates the language group label and marks the switched region with its language', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    expect(screen.getByRole('group', { name: 'Sprache' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'TR' }))
    expect(screen.getByRole('group', { name: 'Dil' })).toBeInTheDocument()
    expect(container.querySelector('[lang="tr"]')).not.toBeNull()
  })
})

describe('ComparisonViewState prohibition notice', () => {
  it('names the prohibition in the current language and keeps it out of the plain deviation list', () => {
    const view = new ComparisonViewState(UN_3480)
    expect(view.prohibitionNotice).toBe('Passagierflugzeug (ICAO): verboten – nur Frachtflugzeug')
    expect(view.deviations.map(r => r.field)).toEqual(['packingInstrPassenger'])
    expect(view.listedDeviations).toEqual([])
    view.setLang('en')
    expect(view.prohibitionNotice).toBe('Passenger aircraft (ICAO): forbidden – cargo aircraft only')
  })
})

describe('MultimodalTool tabs', () => {
  it('separates the packing instructions of the demo sheet (no "P001IBC02R001")', () => {
    render(MultimodalTool, { props: { demo: true } })
    const table = screen.getByTestId('fields-table')
    expect(table.textContent).not.toContain('P001IBC02')
    expect(table.textContent).toMatch(/P001,\s*IBC02,\s*R001/)
  })

  it('shows the IMDG IBC instruction and an underlined EmS in the IMDG tab', async () => {
    const data = { IMDG: [e({ unNumber: '1203', hazardClass: '3', packingInstructions: 'P001, IBC02', ems1: 'F-E', ems2: 'S-E!' })] }
    render(MultimodalTool, { props: { unNumber: '1203', initialData: data } })
    const table = screen.getByTestId('fields-table')
    expect(table).toHaveTextContent('IBC02')
    expect(table.querySelector('u')).toHaveTextContent('S-E')
    expect(table.textContent).not.toContain('S-E!')
  })

  it('shows ICAO limited quantity, state variations and FORBIDDEN in the ICAO tab', () => {
    const data = { ICAO: [e({ unNumber: '1005', hazardClass: '2.3', limitedQty: 'Y341 · max 1 L', stateVariations: 'AU 1, US 3', packingInstrPassenger: 'FORBIDDEN', packingInstrCargo: 'FORBIDDEN' })] }
    render(MultimodalTool, { props: { unNumber: '1005', initialData: data } })
    const table = screen.getByTestId('fields-table')
    expect(table).toHaveTextContent('Begrenzte Mengen')
    expect(table).toHaveTextContent('Y341 · max 1 L')
    expect(table).toHaveTextContent('Staatenabweichungen')
    expect(table).toHaveTextContent('AU 1, US 3')
    expect(table.querySelectorAll('[data-forbidden="true"]')).toHaveLength(2)
    expect(table).toHaveTextContent('Beförderung verboten')
  })

  it('marks the language-switched region with its language', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('button', { name: 'TR' }))
    expect(container.querySelector('[lang="tr"]')).not.toBeNull()
    expect(screen.getByRole('group', { name: 'Dil' })).toBeInTheDocument()
  })
})
