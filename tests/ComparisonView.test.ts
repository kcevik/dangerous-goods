import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import ComparisonView from '$lib/multimodal/ComparisonView.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'
import { UN_1993 } from './fixtures/variant-rows'

const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
const cell = (container: HTMLElement, field: string, mode: string) =>
  container.querySelector(`tr[data-field="${field}"] td[data-mode="${mode}"]`)!

describe('ComparisonView', () => {
  it('shows every mode side by side, ADN as "no data", inside its own scroll container', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    const heads = [...container.querySelectorAll('thead th')].map(th => th.textContent?.trim().split(/\s/)[0])
    expect(heads).toEqual(['Angabe', 'ADR', 'RID', 'IMDG', 'ICAO', 'ADN'])
    expect(container.querySelector('td[data-mode="ADN"]')).toHaveTextContent('Die BAM veröffentlicht keine ADN-Daten.')
    expect(container.querySelector('table')!.parentElement).toHaveClass('overflow-x-auto')
  })

  it('states that UN 1203 has no critical deviation and marks road-only fields as not applicable elsewhere', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('Keine kritischen Abweichungen zwischen den Regelwerken.')
    expect(cell(container, 'tunnelCode', 'IMDG')).toHaveAttribute('title', 'In diesem Regelwerk nicht vorgesehen')
    expect(cell(container, 'tunnelCode', 'ADR')).toHaveAttribute('data-deviates', 'false')
    expect(cell(container, 'specialProvisions', 'IMDG')).toHaveAttribute('title', 'Nicht verglichen: abweichende Systematik')
  })

  it('flags a real critical difference and lists it in the summary', () => {
    const data = { ADR: [e({ limitedQty: '5 L' })], RID: [e({ limitedQty: '5 L' })], IMDG: [e({ limitedQty: '1 L' })] }
    const { container } = render(ComparisonView, { props: { unNumber: '1286', data } })
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveAttribute('data-deviates', 'true')
    expect(cell(container, 'limitedQty', 'ADR')).toHaveAttribute('data-deviates', 'false')
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('Begrenzte Mengen: ADR 5 L · RID 5 L · IMDG 1 L')
  })

  it('filters to differences only', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    await fireEvent.click(screen.getByLabelText('Nur Abweichungen zeigen'))
    expect([...container.querySelectorAll('tbody tr')].map(tr => tr.getAttribute('data-field'))).toEqual(['specialProvisions'])
  })

  it('switches the labels with the language', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container.querySelector('thead th')).toHaveTextContent('Field')
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('No critical differences')
  })

  it('offers the variant picker and recomputes the table', async () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1993', data: UN_1993 as Record<string, Entry[]> } })
    const buttons = screen.getByRole('group', { name: 'Variante' }).querySelectorAll('button')
    expect(buttons).toHaveLength(5)
    await fireEvent.click(buttons[3]!)
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveTextContent('5 L')
  })

  it('asks for a pick where a mode has no unambiguous variant and shows "?" until then', async () => {
    const data = {
      ADR: [e({ packingGroup: 'II', limitedQty: '1 L' })],
      IMDG: [e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', specification: 'A', limitedQty: '1 L' }), e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', specification: 'B', limitedQty: '5 L' })],
    }
    const { container } = render(ComparisonView, { props: { unNumber: '9999', data } })
    expect(container).toHaveTextContent('Für diese Variante gibt es in IMDG keine eindeutige Entsprechung.')
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveTextContent('?')
    await fireEvent.click(screen.getByRole('group', { name: 'Variante (IMDG)' }).querySelectorAll('button')[1]!)
    expect(cell(container, 'limitedQty', 'IMDG')).toHaveTextContent('5 L')
    expect(container).toHaveTextContent('Für IMDG manuell gewählt:')
  })

  it('does not claim "no deviations" when a mode was not compared (review I3)', () => {
    const data = {
      ADR: [e({ packingGroup: 'II', limitedQty: '1 L' })],
      RID: [e({ packingGroup: 'II', limitedQty: '1 L' })],
      IMDG: [e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A', specification: 'A', limitedQty: '1 L' }), e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', specification: 'B', limitedQty: '5 L' })],
    }
    render(ComparisonView, { props: { unNumber: '9999', data } })
    const summary = screen.getByTestId('deviation-summary')
    expect(summary).toHaveTextContent('Keine kritischen Abweichungen zwischen ADR und RID.')
    expect(summary).toHaveTextContent('Nicht verglichen: IMDG (keine eindeutige Variante).')
  })

  it('says there is nothing to compare when only one mode has data', () => {
    render(ComparisonView, { props: { unNumber: '9999', data: { ADR: [e({ packingGroup: 'II' })], RID: [], IMDG: [], ICAO: [], ADN: [] } } })
    expect(screen.getByTestId('deviation-summary')).toHaveTextContent('Nur ein Regelwerk enthält diese UN-Nummer – es gibt nichts zu vergleichen.')
  })

  it('adds the grey UN reference column when reference rows exist', () => {
    const reference = [e({ packingGroup: 'II', limitedQty: '1 L', specialProvisions: '243' })]
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA, reference } })
    expect(container.querySelector('thead')).toHaveTextContent('UN-Modellvorschriften')
    expect(cell(container, 'specialProvisions', 'UN')).toHaveTextContent('243')
  })

  it('says so when no regulation has the UN number', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '0000', data: { ADR: [], RID: [], IMDG: [], ICAO: [], ADN: [] } } })
    expect(container).toHaveTextContent('Für diese UN-Nummer gibt es in keinem Regelwerk einen Eintrag.')
    expect(container.querySelector('table')).toBeNull()
  })

  it('carries the BAM attribution', () => {
    const { container } = render(ComparisonView, { props: { unNumber: '1203', data: DEMO_DATA } })
    expect(container).toHaveTextContent('dl-de/by-2-0')
  })
})
