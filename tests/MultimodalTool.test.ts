import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
import { DEMO_DATA, DEMO_SVS, type Entry } from '$lib/multimodal/types'
import { UN_1203, UN_1993 } from './fixtures/variant-rows'

function stubSupabase(responses: Partial<Record<string, { data: unknown[] | null, error: unknown }>>) {
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve(responses[table] ?? { data: [], error: null }),
      }),
    }),
  }))
  return { client: { from } as unknown as SupabaseClient, from }
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('MultimodalTool', () => {
  it('renders the demo data for UN 1203 with a DEMO badge and the substance as text, not a search box', () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    expect(container).toHaveTextContent('DEMO')
    expect(container).toHaveTextContent('UN 1203 · Verfügbarkeit in allen Modi')
    expect(screen.getByTestId('tool-subject')).toHaveTextContent('UN 1203 – BENZIN')
    // the pages own the search; a second, inert field here confused users (owner, 2026-11-08)
    expect(container.querySelector('input')).toBeNull()
  })

  it('switches labels when a language button is clicked', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container).toHaveTextContent('Availability in all modes')
    expect(container).toHaveTextContent('MOTOR SPIRIT')
  })

  it('switches the detail panel when a mode tab is clicked', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    expect(container).toHaveTextContent('EmS')
    expect(container).toHaveTextContent('F-E / S-E')
  })

  it('renders server-provided initialData without calling supabase', () => {
    const { client, from } = stubSupabase({})
    const { container } = render(MultimodalTool, {
      props: { unNumber: '1203', initialData: DEMO_DATA, supabase: client },
    })
    expect(container).toHaveTextContent('BENZIN')
    expect(container).not.toHaveTextContent('DEMO')
    expect(from).not.toHaveBeenCalled()
  })

  it('loads data client-side when only a unNumber is given', async () => {
    const { client, from } = stubSupabase({
      imdg_entries: { data: [{ un_number: '1080', sequence_number: 1, name: 'SF6', hazard_class: '2.2' }], error: null },
    })
    const { container } = render(MultimodalTool, { props: { unNumber: '1080', supabase: client } })
    await flush()
    expect(from).toHaveBeenCalled()
    expect(container).toHaveTextContent('SF6')
  })

  it('shows the initial empty state when there is no data', () => {
    const { container } = render(MultimodalTool, { props: {} })
    expect(container).toHaveTextContent('UN-Nummer oder Stoffname…')
    expect(container).not.toHaveTextContent('Verfügbarkeit in allen Modi')
  })

  it('translates the packing-group and transport-category badges', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    expect(container).toHaveTextContent('VP-Gr. II')
    expect(container).toHaveTextContent('BK 2')

    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container).not.toHaveTextContent('VP-Gr.')
    expect(container).not.toHaveTextContent('BK 2')
    expect(container).toHaveTextContent('PG II')
    expect(container).toHaveTextContent('TC 2')
  })

  it('leaves no German badge text behind in French or Turkish', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    for (const lang of ['FR', 'TR']) {
      await fireEvent.click(screen.getByRole('button', { name: lang }))
      expect(container.textContent, lang).not.toContain('VP-Gr.')
    }
  })

  it('switches the demo special-provision text with the language', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    expect(container).toHaveTextContent(DEMO_SVS['ADR:243']!.textDe!.slice(0, 40))

    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container).toHaveTextContent(DEMO_SVS['ADR:243']!.textEn!.slice(0, 40))
    expect(container).not.toHaveTextContent(DEMO_SVS['ADR:243']!.textDe!.slice(0, 40))

    await fireEvent.click(screen.getByRole('button', { name: 'FR' }))
    expect(container).toHaveTextContent(DEMO_SVS['ADR:243']!.textFr!.slice(0, 40))
  })
})

describe('MultimodalTool — UN link into the ADR text', () => {
  it('links the UN header to the book for real ADR data', () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '1203', initialData: DEMO_DATA, supabase: client } })
    const link = container.querySelector('a[href="/regelwerk/adr?un=1203"]')!
    expect(link).not.toBeNull()
    expect(link).toHaveTextContent('UN 1203')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('keeps the header plain in demo mode and on other modes', async () => {
    const demo = render(MultimodalTool, { props: { demo: true } })
    expect(demo.container.querySelector('a[href^="/regelwerk/"]')).toBeNull()
    demo.unmount()

    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '1203', initialData: DEMO_DATA, supabase: client } })
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    expect(container.querySelector('a[href="/regelwerk/adr?un=1203"]')).toBeNull()
  })
})

describe('MultimodalTool — failed load', () => {
  it('shows an error with a retry button instead of "nicht vorhanden"', async () => {
    const { client, from } = stubSupabase({ adr_entries: { data: null, error: { message: 'boom' } } })
    const { container } = render(MultimodalTool, { props: { unNumber: '1090', supabase: client } })
    await flush()
    const alert = container.querySelector('[role="alert"]')
    expect(alert).toHaveTextContent('Die Daten konnten nicht geladen werden.')
    expect(container).not.toHaveTextContent('nicht vorhanden')
    const calls = from.mock.calls.length
    await fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    await flush()
    expect(from.mock.calls.length).toBeGreaterThan(calls)
  })
})

describe('MultimodalTool — variants', () => {
  function render1993() {
    const { client } = stubSupabase({})
    return render(MultimodalTool, { props: { unNumber: '1993', initialData: UN_1993 as Record<string, Entry[]>, supabase: client } })
  }

  const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })

  it('shows the variant picker for a UN number with several variants', () => {
    render1993()
    const picker = screen.getByRole('group', { name: 'Variante' })
    const buttons = picker.querySelectorAll('button')
    expect(buttons).toHaveLength(5)
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[0]).toHaveTextContent('VP-Gr. I')
  })

  it('hides the picker when there is only one variant', () => {
    const { client } = stubSupabase({})
    render(MultimodalTool, { props: { unNumber: '1203', initialData: UN_1203 as Record<string, Entry[]>, supabase: client } })
    expect(screen.queryByRole('group', { name: 'Variante' })).toBeNull()
  })

  it('switches every tab to the chosen variant', async () => {
    const { container } = render1993()
    const buttons = screen.getByRole('group', { name: 'Variante' }).querySelectorAll('button')
    await fireEvent.click(buttons[3]!)
    expect(buttons[3]).toHaveAttribute('aria-pressed', 'true')
    expect(container).toHaveTextContent('5 L')
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    expect(container.querySelector('[role="tabpanel"]')).toHaveTextContent('VP-Gr. III')
  })

  it('shows every name of the variant in the header', () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '1203', initialData: UN_1203 as Record<string, Entry[]>, supabase: client } })
    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel).toHaveTextContent('BENZIN')
    expect(panel).toHaveTextContent('OTTOKRAFTSTOFF · MOTOR SPIRIT · GASOLINE · PETROL · ESSENCE')
  })

  it('explains an unmatched mode and offers its own variants', async () => {
    const data: Record<string, Entry[]> = {
      ADR: [e({ name: 'STOFF', packingGroup: 'II', limitedQty: '1 L' })],
      IMDG: [
        e({ sequenceNumber: 1, name: 'STOFF', packingGroup: 'II', specificationEn: 'A', specification: 'A', limitedQty: '1 L' }),
        e({ sequenceNumber: 2, name: 'STOFF', packingGroup: 'II', specificationEn: 'B', specification: 'B', limitedQty: '5 L' }),
      ],
    }
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '9999', initialData: data, supabase: client } })

    const imdgTab = screen.getByRole('tab', { name: /IMDG/ })
    expect(imdgTab).not.toBeDisabled()
    await fireEvent.click(imdgTab)

    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel).toHaveTextContent('Für diese Variante gibt es in IMDG keine eindeutige Entsprechung. Bitte wähle:')
    expect(panel).not.toHaveTextContent('nicht vorhanden')
    expect(panel).not.toHaveTextContent('5 L')

    const own = screen.getByRole('group', { name: 'Variante (IMDG)' }).querySelectorAll('button')
    expect(own).toHaveLength(2)
    await fireEvent.click(own[1]!)
    expect(panel).toHaveTextContent('5 L')
  })

  it('keeps a manual pick visible and revisable (review fix)', async () => {
    const data: Record<string, Entry[]> = {
      ADR: [e({ name: 'STOFF', packingGroup: 'II', limitedQty: '1 L' })],
      IMDG: [
        e({ sequenceNumber: 1, name: 'STOFF', packingGroup: 'II', specificationEn: 'A', specification: 'A', limitedQty: '1 L' }),
        e({ sequenceNumber: 2, name: 'STOFF', packingGroup: 'II', specificationEn: 'B', specification: 'B', limitedQty: '5 L' }),
      ],
    }
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '9999', initialData: data, supabase: client } })
    await fireEvent.click(screen.getByRole('tab', { name: /IMDG/ }))
    await fireEvent.click(screen.getByRole('group', { name: 'Variante (IMDG)' }).querySelectorAll('button')[1]!)

    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel).toHaveTextContent('Für IMDG manuell gewählt:')
    const own = screen.getByRole('group', { name: 'Variante (IMDG)' }).querySelectorAll('button')
    expect(own[1]).toHaveAttribute('aria-pressed', 'true')
    expect(panel).toHaveTextContent('5 L')

    await fireEvent.click(own[0]!)
    expect(panel).not.toHaveTextContent('5 L')
    expect(panel).toHaveTextContent('1 L')
  })

  it('shows every specification of a merged variant in the header (review fix)', async () => {
    const { container } = render1993()
    await fireEvent.click(screen.getByRole('group', { name: 'Variante' }).querySelectorAll('button')[4]!)
    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel).toHaveTextContent('größer als 110 kPa')
    expect(panel).toHaveTextContent('höchstens 110 kPa')
  })

  it('marks an unmatched mode with "?" in the overview strip', () => {
    const data: Record<string, Entry[]> = {
      ADR: [e({ packingGroup: 'II' })],
      IMDG: [e({ sequenceNumber: 1, packingGroup: 'II', specificationEn: 'A' }), e({ sequenceNumber: 2, packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' })],
    }
    const { client } = stubSupabase({})
    const { container } = render(MultimodalTool, { props: { unNumber: '9999', initialData: data, supabase: client } })
    expect(container.querySelector('[data-testid="overview-IMDG"]')).toHaveTextContent('?')
  })
})
