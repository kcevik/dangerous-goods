import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MultimodalSvsAccordion from '$lib/multimodal/MultimodalSvsAccordion.svelte'
import { clearSpecialProvisionsCache } from '$lib/multimodal/specialProvisions.svelte'
import { DEMO_SVS } from '$lib/multimodal/types'

const BASE_PROPS = {
  label: 'Sondervorschriften',
  noText: 'Kein Text verfügbar',
  clickLoad: 'Klicken zum Öffnen…',
}

function stubSupabase(rows: Record<string, Record<string, unknown> | null>) {
  let mode = ''
  let code = ''
  const counter = { calls: 0 }
  const builder = {
    select: () => builder,
    eq: (column: string, value: string) => {
      if (column === 'mode') mode = value
      if (column === 'code') code = value
      return builder
    },
    maybeSingle: () => {
      counter.calls++
      return Promise.resolve({ data: rows[`${mode}:${code}`] ?? null, error: null })
    },
  }
  const from = vi.fn(() => builder)
  return { client: { from } as unknown as SupabaseClient, from, counter }
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  clearSpecialProvisionsCache()
})

describe('MultimodalSvsAccordion', () => {
  it('renders nothing when svs is empty', () => {
    const { client } = stubSupabase({})
    render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '', supabase: client } })
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders one row per comma-separated code', () => {
    const { client } = stubSupabase({})
    render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163, 243, 640D', mode: 'ADR', supabase: client } })
    const rows = screen.getAllByRole('button')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('SV 163')
    expect(rows[2]).toHaveTextContent('SV 640D')
  })

  it('shows the click-to-open hint before a row is expanded', () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', supabase: client } })
    expect(container).toHaveTextContent(BASE_PROPS.clickLoad)
  })

  it('demo mode shows DEMO_SVS text without any network call', async () => {
    const { client, from } = stubSupabase({})
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', demo: true, supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    expect(container).toHaveTextContent(DEMO_SVS['163']!)
    expect(from).not.toHaveBeenCalled()
  })

  it('expanding a row loads and shows the German text', async () => {
    const { client } = stubSupabase({ 'ADR:163': { text_de: 'Deutscher SV-Text', text_en: 'English SV text' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('Deutscher SV-Text')
  })

  it('prefers English text when lang is "en"', async () => {
    const { client } = stubSupabase({ 'ICAO:A1': { text_de: null, text_en: 'English only' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: 'A1', mode: 'ICAO', lang: 'en', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('English only')
  })

  it('Turkish prefers English text over German (no Turkish data in BAM dataset)', async () => {
    const { client } = stubSupabase({ 'ADR:163': { text_de: 'Deutsch', text_en: 'English' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', lang: 'tr', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('English')
    expect(container).not.toHaveTextContent('Deutsch')
  })

  it('switching the language re-renders the already-loaded text without refetching', async () => {
    const { client, counter } = stubSupabase({ 'ADR:163': { text_de: 'Deutsch', text_en: 'English' } })
    const props = { ...BASE_PROPS, svs: '163', mode: 'ADR' as const, lang: 'de' as const, supabase: client }
    const { container, rerender } = render(MultimodalSvsAccordion, { props })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('Deutsch')

    await rerender({ ...props, lang: 'en' })
    expect(container).toHaveTextContent('English')
    expect(counter.calls).toBe(1)
  })

  it('reloads texts for open rows when the transport mode changes (no stuck "…")', async () => {
    const { client } = stubSupabase({
      'ADR:163': { text_de: 'ADR-Text' },
      'RID:163': { text_de: 'RID-Text' },
    })
    const props = { ...BASE_PROPS, svs: '163', mode: 'ADR' as const, supabase: client }
    const { container, rerender } = render(MultimodalSvsAccordion, { props })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('ADR-Text')

    await rerender({ ...props, mode: 'RID' })
    await flush()
    expect(container).toHaveTextContent('RID-Text')
    expect(container).not.toHaveTextContent('…')
  })

  it('falls back to another language when the preferred one is missing', async () => {
    const { client } = stubSupabase({ 'ICAO:A1': { text_de: null, text_en: 'English fallback' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: 'A1', mode: 'ICAO', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent('English fallback')
  })

  it('shows the no-text fallback when no row exists for the code', async () => {
    const { client } = stubSupabase({})
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '999', mode: 'ADN', supabase: client } })
    await fireEvent.click(screen.getByRole('button'))
    await flush()
    expect(container).toHaveTextContent(BASE_PROPS.noText)
  })

  it('collapses an expanded row on second click, keeping a preview snippet', async () => {
    const { client } = stubSupabase({ 'ADR:163': { text_de: 'Voller SV-Text' } })
    const { container } = render(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '163', mode: 'ADR', supabase: client } })
    const button = screen.getByRole('button')
    const panel = () => container.querySelector('.whitespace-pre-wrap')

    await fireEvent.click(button)
    await flush()
    expect(panel()).not.toBeNull()

    await fireEvent.click(button)
    expect(panel()).toBeNull()
    expect(container).toHaveTextContent('Voller SV-Text')
    expect(container).not.toHaveTextContent(BASE_PROPS.clickLoad)
  })
})
