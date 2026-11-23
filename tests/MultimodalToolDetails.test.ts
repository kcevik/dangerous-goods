import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'

const client = { from: vi.fn() } as unknown as SupabaseClient
const group = (container: HTMLElement, key: string) => container.querySelector(`[data-testid="detail-groups"] [data-group="${key}"]`)
const live = (initialData: Record<string, Entry[]> = DEMO_DATA) =>
  render(MultimodalTool, { props: { unNumber: '1203', initialData, supabase: client } })

describe('MultimodalTool — no ADN tab', () => {
  it('shows no ADN tab or tile, only one note that the BAM source has no ADN data', () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    expect(screen.queryByRole('tab', { name: /ADN/ })).toBeNull()
    expect(container.querySelector('[data-testid="overview-ADN"]')).toBeNull()
    expect(screen.getByTestId('adn-note')).toHaveTextContent('ADN (Binnenschifffahrt): keine Daten in der BAM-Quelle.')
  })
})

describe('MultimodalTool — Table A detail sections (persona test 2026-11-23)', () => {
  it('shows the ADR detail columns of the demo in readable groups', () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    const sections = [...container.querySelectorAll('[data-testid="detail-groups"] section')]
    expect(sections.map(s => s.querySelector('h3')!.textContent)).toEqual(['Verpackung', 'Tank', 'Beförderung', 'Sicherung (1.10)', 'Weitere Angaben'])
    expect(group(container, 'tank')!.querySelector('[data-field="tankCodes"]')).toHaveTextContent('LGBF')
    expect(group(container, 'tank')!.querySelector('[data-field="tankVehicle"]')).toHaveTextContent('FL')
    expect(group(container, 'carriage')!.querySelector('[data-field="operationSv"]')).toHaveTextContent(/S2,\s?S20/)
    expect(group(container, 'security')).toHaveTextContent('> 3000 l')
    expect(group(container, 'other')!.querySelector('[data-field="envHazard"]')).toHaveTextContent('Ja')
  })

  it('links ADR codes to the defining ADR section — but not in demo mode (locked users have no book)', () => {
    const demo = render(MultimodalTool, { props: { demo: true } })
    expect(demo.container.querySelector('a[href*="?section="]')).toBeNull()
    expect(demo.container).toHaveTextContent('Für diese Codes enthält die BAM-Quelle keine Texte.')
    demo.unmount()

    const { container } = live()
    const link = group(container, 'tank')!.querySelector('[data-field="tankCodes"] a')!
    expect(link).toHaveAttribute('href', '/regelwerk/adr?section=4.3.4.1.1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAccessibleName('Abschnitt 4.3.4.1.1 im ADR-Text öffnen')
    expect(link).toHaveClass('min-h-11')
  })

  it('shows the RID equivalents without book links and names the column BAM does not carry', async () => {
    const { container } = live()
    await fireEvent.click(screen.getByRole('tab', { name: /RID/ }))
    expect(group(container, 'carriage')!.querySelector('[data-field="expressFreight"]')).toHaveTextContent('CE7')
    expect(container.querySelector('[data-testid="detail-groups"] a')).toBeNull()
    // RID has the hazard identification number; the BAM RID feed has no column for it
    const gap = container.querySelector('[data-testid="fields-table"] tr[data-gap="noSource"]')!
    expect(gap).toHaveTextContent('Kemler-Zahl')
    expect(gap).toHaveTextContent('Keine Angabe in der Quelle (BAM)')
  })

  it('shows IMDG tank instructions and translates the sections', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    expect(group(container, 'tank')!.querySelector('[data-field="portableTankInstr"]')).toHaveTextContent('T4')
    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(group(container, 'tank')).toHaveTextContent('Portable tanks and bulk containers')
  })

  it('states BAM\'s missing N mark as "no data in the source", not as "no"', () => {
    const entry: Entry = { ...DEMO_DATA.ADR![0]!, envHazard: undefined }
    const { container } = live({ ADR: [entry] })
    expect(group(container, 'other')!.querySelector('[data-field="envHazard"]')).toHaveTextContent('Keine Angabe in der Quelle (BAM)')
  })

  it('explains the missing code texts only where codes are shown', () => {
    const entry: Entry = { unNumber: '3480', sequenceNumber: 1, hazardClass: '9', securityLevel: '0' }
    const { container } = live({ ADR: [entry] })
    expect(group(container, 'security')).not.toBeNull()
    expect(container).not.toHaveTextContent('Für diese Codes')
  })

  it('shows no detail sections for ICAO', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('tab', { name: /ICAO/ }))
    expect(container.querySelector('[data-testid="detail-groups"]')).toBeNull()
  })
})
