import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import MultimodalTool from '$lib/multimodal/MultimodalTool.svelte'
import { DEMO_DATA } from '$lib/multimodal/types'

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
  it('renders the demo data for UN 1203 with a DEMO badge and read-only search box', () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    expect(container).toHaveTextContent('DEMO')
    expect(container).toHaveTextContent('UN 1203 · Verfügbarkeit in allen Modi')
    expect(container).toHaveTextContent('BENZIN')
    const input = container.querySelector('input')!
    expect(input).toHaveValue('UN 1203 – BENZIN')
    expect(input).toHaveAttribute('readonly')
  })

  it('switches labels when a language button is clicked', async () => {
    const { container } = render(MultimodalTool, { props: { demo: true } })
    await fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(container).toHaveTextContent('Availability in all modes')
    expect(container).toHaveTextContent('PETROL')
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
})
