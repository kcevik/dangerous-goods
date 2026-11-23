import { fireEvent, render, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { Entry } from '$lib/multimodal/types'
import { fetchPointsEntries } from '$lib/points/fetchEntries'
import PointsCalculator from '$lib/points/PointsCalculator.svelte'
import PointsPage from '../src/routes/(app)/tools/1000-punkte/+page.svelte'

function entry(over: Partial<Entry> = {}): Entry {
  return { unNumber: '1203', sequenceNumber: 1, name: 'BENZIN', hazardClass: '3', classificationCode: 'F1', packingGroup: 'II', transportCategory: '2', multiplier: '3', ...over }
}

const DATA: Record<string, Entry[]> = {
  1203: [entry()],
  2215: [entry({ unNumber: '2215', name: 'MALEINSÄUREANHYDRID, GESCHMOLZEN', hazardClass: '8', transportCategory: '0', multiplier: undefined, packingGroup: 'III' })],
  3166: [entry({ unNumber: '3166', name: 'FAHRZEUG MIT ANTRIEB DURCH ENTZÜNDBARES GAS', hazardClass: '9', transportCategory: '-', multiplier: undefined, packingGroup: undefined })],
}

function renderCalculator(fetcher = vi.fn(async (un: string) => DATA[un] ?? []), linkedSections: string[] = ['8.3.3', '1.1.3.6.3']) {
  return { fetcher, ...render(PointsCalculator, { props: { linkedSections, fetcher } }) }
}

async function fillRow(container: HTMLElement, index: number, un: string, qty: string) {
  const rows = container.querySelectorAll('[data-testid="points-row"]')
  const row = rows[index]!
  await fireEvent.input(row.querySelector('input[inputmode="numeric"]')!, { target: { value: un } })
  await fireEvent.input(row.querySelector('input[inputmode="decimal"]')!, { target: { value: qty } })
}

const verdict = (container: HTMLElement) => container.querySelector('[data-testid="points-verdict"]')!

describe('/tools/1000-punkte page', () => {
  it('locked: explains the activation, shows no calculator and no demo', () => {
    const { container, getByTestId } = render(PointsPage, { props: { data: { locked: true, isActive: false } as never } })
    expect(getByTestId('points-locked')).toHaveTextContent('Freischaltung')
    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('[data-testid="points-row"]')).toBeNull()
    expect(document.title).toBe('1000-Punkte-Rechner – gefahrgut.org')
  })

  it('active: renders the calculator', () => {
    const { container } = render(PointsPage, { props: { data: { locked: false, isActive: true, linkedSections: [] } as never } })
    expect(container.querySelectorAll('[data-testid="points-row"]')).toHaveLength(1)
  })
})

describe('PointsCalculator', () => {
  it('computes a row and shows the exempt verdict with the duties', async () => {
    const { container, getByTestId } = renderCalculator()
    await fillRow(container, 0, '1203', '300')
    await waitFor(() => expect(getByTestId('row-points')).toHaveTextContent('900'))
    expect(verdict(container)).toHaveAttribute('data-verdict', 'exempt')
    expect(verdict(container)).toHaveTextContent('Freistellung nach 1.1.3.6 möglich')
    expect(verdict(container)).toHaveTextContent('900 von 1.000 Punkten')
    expect(getByTestId('remaining-duties')).toHaveTextContent('2 kg')
    expect(getByTestId('lifted-rules')).toHaveTextContent('Tunnel')
    expect(container.querySelector('a[href="/un/1203"]')).toHaveAttribute('target', '_blank')
  })

  it('links only sections the book has as headings, in a new tab', async () => {
    const { container } = renderCalculator()
    await fillRow(container, 0, '1203', '10')
    await waitFor(() => expect(verdict(container)).toHaveAttribute('data-verdict', 'exempt'))
    const link = container.querySelector('a[href="/regelwerk/adr?section=8.3.3"]')
    expect(link).toHaveAttribute('target', '_blank')
    expect(container.querySelector('a[href="/regelwerk/adr?section=8.2.3"]')).toBeNull()
    expect(container).toHaveTextContent('8.2.3')
  })

  it('a mixed load over 1000 is not exempt', async () => {
    const { container, getByText } = renderCalculator()
    await fillRow(container, 0, '1203', '300')
    await fireEvent.click(getByText('+ Position hinzufügen'))
    await fillRow(container, 1, '1203', '34')
    await waitFor(() => expect(verdict(container)).toHaveAttribute('data-verdict', 'notExempt'))
    expect(verdict(container)).toHaveTextContent('nicht möglich')
    expect(verdict(container)).toHaveTextContent('1.002 von 1.000 Punkten')
    expect(container.querySelector('[data-testid="remaining-duties"]')).toBeNull()
  })

  it('BK 0 is not exempt; a missing category asks for checking', async () => {
    const { container } = renderCalculator()
    await fillRow(container, 0, '2215', '1')
    await waitFor(() => expect(verdict(container)).toHaveAttribute('data-verdict', 'notExempt'))
    expect(container).toHaveTextContent('Beförderungskategorie 0')

    const second = renderCalculator()
    await fillRow(second.container, 0, '3166', '1')
    await waitFor(() => expect(verdict(second.container)).toHaveAttribute('data-verdict', 'check'))
    expect(second.container).toHaveTextContent('keine Beförderungskategorie angegeben')
  })

  it('a failed lookup is an error with retry, never 0 points', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue(DATA['1203'])
    const { container, getByTestId, getByText } = renderCalculator(fetcher)
    await fillRow(container, 0, '1203', '100')
    await waitFor(() => expect(verdict(container)).toHaveAttribute('data-verdict', 'lookupFailed'))
    expect(getByTestId('row-points')).toHaveTextContent('–')
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    await fireEvent.click(getByText('Erneut versuchen'))
    await waitFor(() => expect(getByTestId('row-points')).toHaveTextContent('300'))
  })

  it('empty packaging turns the row into BK 4 with 0 points', async () => {
    const { container, getByTestId, getByLabelText } = renderCalculator()
    await fillRow(container, 0, '1203', '100')
    await waitFor(() => expect(getByTestId('row-points')).toHaveTextContent('300'))
    await fireEvent.click(getByLabelText('Leere ungereinigte Verpackung'))
    expect(getByTestId('row-category')).toHaveTextContent('4 (statt 2)')
    expect(getByTestId('row-points')).toHaveTextContent('0')
  })

  it('removes rows', async () => {
    const { container, getByText, getByLabelText } = renderCalculator()
    await fireEvent.click(getByText('+ Position hinzufügen'))
    expect(container.querySelectorAll('[data-testid="points-row"]')).toHaveLength(2)
    await fireEvent.click(getByLabelText('Position 2 entfernen'))
    expect(container.querySelectorAll('[data-testid="points-row"]')).toHaveLength(1)
  })

  it('uses touch targets of at least 44 px for inputs and buttons', () => {
    const { container } = renderCalculator()
    for (const el of container.querySelectorAll('[data-testid="points-row"] input[type="text"], [data-testid="points-row"] select, button')) {
      expect(el.className, el.outerHTML.slice(0, 60)).toMatch(/min-h-11/)
    }
  })

  it('print markup: a print-only sheet with date, table and total; inputs hidden; disclaimer and source', async () => {
    const { container, getByTestId } = renderCalculator()
    await fillRow(container, 0, '1203', '300')
    await waitFor(() => expect(getByTestId('print-total')).toHaveTextContent('900'))
    const sheet = getByTestId('points-print-sheet')
    expect(sheet).toHaveClass('hidden', 'print:block')
    expect(sheet).toHaveTextContent('1000-Punkte-Berechnung nach ADR 1.1.3.6')
    expect(sheet).toHaveTextContent(/Erstellt am \d/)
    expect(sheet.querySelectorAll('tbody tr')).toHaveLength(1)
    expect(sheet).toHaveTextContent('300 L')
    expect(container.querySelector('[data-testid="points-row"]')!.closest('.print\\:hidden')).not.toBeNull()
    expect(getByTestId('points-disclaimer')).toHaveTextContent('Hilfsmittel – keine Rechtsberatung, maßgeblich ist der ADR-Text.')
    expect(container).toHaveTextContent('BAM GEFAHRGUT (ADR 2025)')
    expect(container).toHaveTextContent('dl-de/by-2-0')
  })
})

describe('fetchPointsEntries', () => {
  it('asks the endpoint and returns its entries', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ entries: [entry()] })))
    expect(await fetchPointsEntries('1203', fetchFn as never)).toEqual([entry()])
    expect(fetchFn).toHaveBeenCalledWith('/tools/1000-punkte/eintrag?un=1203')
  })

  it('throws on an error status or a malformed answer', async () => {
    await expect(fetchPointsEntries('1203', (async () => new Response('{}', { status: 500 })) as never)).rejects.toThrow()
    await expect(fetchPointsEntries('1203', (async () => new Response('{}')) as never)).rejects.toThrow()
  })
})
