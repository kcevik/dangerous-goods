import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuickSearch from '$lib/search/QuickSearch.svelte'

const { goto } = vi.hoisted(() => ({ goto: vi.fn() }))
vi.mock('$app/navigation', () => ({ goto }))

const ROW = { un_number: '1203', hazard_class: '3', packing_group: 'II', name: 'BENZIN', name_en: 'MOTOR SPIRIT', name_fr: null }

function stubSearch(rows: Record<string, unknown>[], error: unknown = null) {
  const from = vi.fn(() => {
    const builder = {
      select: () => builder,
      or: () => builder,
      neq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => Promise.resolve(error ? { data: null, error } : { data: rows, error: null }),
    }
    return builder
  })
  return { client: { from } as unknown as SupabaseClient, from }
}

const hrefFor = (un: string) => `/un/${un}/vergleich`

async function type(text: string) {
  await fireEvent.input(screen.getByRole('searchbox'), { target: { value: text } })
  await vi.advanceTimersByTimeAsync(300)
  await tick()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  goto.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('QuickSearch', () => {
  it('gives the field a 44 px touch target', () => {
    const { client } = stubSearch([])
    render(QuickSearch, { props: { supabase: client, hrefFor } })
    expect(screen.getByRole('searchbox')).toHaveClass('min-h-11')
  })

  it('lists name hits as links to the target of each UN number', async () => {
    const { client } = stubSearch([ROW])
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('benzin')
    const link = container.querySelector('a[href="/un/1203/vergleich"]')!
    expect(link).toHaveTextContent('UN 1203')
    expect(link).toHaveTextContent('BENZIN')
  })

  it('offers a 4-digit UN number directly and jumps there on Enter, without querying', async () => {
    const { client, from } = stubSearch([])
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('1090')
    expect(container.querySelector('a[href="/un/1090/vergleich"]')).toHaveTextContent('UN 1090')
    await fireEvent.submit(container.querySelector('form')!)
    expect(goto).toHaveBeenCalledWith('/un/1090/vergleich')
    expect(from).not.toHaveBeenCalled()
  })

  it('jumps to the single hit on Enter and does nothing on Enter without a target', async () => {
    const { client } = stubSearch([ROW])
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await fireEvent.submit(container.querySelector('form')!)
    expect(goto).not.toHaveBeenCalled()
    await type('benzin')
    await fireEvent.submit(container.querySelector('form')!)
    expect(goto).toHaveBeenCalledWith('/un/1203/vergleich')
  })

  it('closes and clears when a hit is picked (the page stays mounted on a same-route jump)', async () => {
    const { client } = stubSearch([ROW])
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('benzin')
    const link = container.querySelector('a[href="/un/1203/vergleich"]')!
    link.addEventListener('click', e => e.preventDefault()) // jsdom cannot navigate
    await fireEvent.click(link)
    expect(container.querySelector('a[href="/un/1203/vergleich"]')).toBeNull()
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('closes and clears after jumping with Enter', async () => {
    const { client } = stubSearch([])
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('1090')
    await fireEvent.submit(container.querySelector('form')!)
    expect(goto).toHaveBeenCalledWith('/un/1090/vergleich')
    expect(container.querySelector('a[href="/un/1090/vergleich"]')).toBeNull()
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('shows a failed search as an error, never as "no results"', async () => {
    const { client } = stubSearch([], { message: 'down' })
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('benzin')
    expect(screen.getByRole('alert')).toHaveTextContent('Die Suche ist fehlgeschlagen')
    expect(container).not.toHaveTextContent('Keine Ergebnisse')
  })

  it('says so when a successful search finds nothing', async () => {
    const { client } = stubSearch([])
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('xyzzy')
    expect(container).toHaveTextContent('Keine Ergebnisse für „xyzzy“')
  })

  it('marks synonym hits', async () => {
    // no official name matches; only the detail load (.in) returns the synonym's row
    const row = { un_number: '1824', hazard_class: '8', packing_group: 'II', name: 'NATRIUMHYDROXIDLÖSUNG' }
    const from = vi.fn(() => {
      let detail = false
      const builder = {
        select: () => builder,
        or: () => builder,
        neq: () => builder,
        in: () => { detail = true; return builder },
        order: () => builder,
        limit: () => Promise.resolve({ data: detail ? [row] : [], error: null }),
      }
      return builder
    })
    const { container } = render(QuickSearch, { props: { supabase: { from } as unknown as SupabaseClient, hrefFor } })
    await type('Natronlauge')
    expect(container.querySelector('a[href="/un/1824/vergleich"]')).toHaveTextContent('NATRIUMHYDROXIDLÖSUNG')
    expect(screen.getByTestId('synonym-notice')).toHaveTextContent('Über Synonym „Natronlauge“ gefunden')
  })

  it('asks to refine instead of presenting a cut list as complete', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ ...ROW, un_number: String(3000 + i), name: 'ACID' }))
    const { client } = stubSearch(rows)
    const { container } = render(QuickSearch, { props: { supabase: client, hrefFor } })
    await type('acid')
    expect(container.querySelectorAll('li')).toHaveLength(20)
    expect(screen.getByTestId('refine-hint')).toHaveTextContent('Weitere Treffer – Suche verfeinern')
  })
})
