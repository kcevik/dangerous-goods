import type { SupabaseClient } from '@supabase/supabase-js'
import { fireEvent, render } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'
import SearchPage from '../src/routes/(app)/suche/+page.svelte'

vi.mock('$lib/multimodal/MultimodalTool.svelte', async () => ({
  default: (await import('./stubs/ToolStub.svelte')).default,
}))

const ROW = {
  un_number: '1203',
  name: 'BENZIN',
  name_en: 'PETROL',
  name_fr: 'ESSENCE',
  hazard_class: '3',
  packing_group: 'II',
}

function stubSearch(data: Record<string, unknown>[]) {
  const builder = {
    select: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => Promise.resolve({ data, error: null }),
  }
  const from = vi.fn(() => builder)
  return { client: { from } as unknown as SupabaseClient, from }
}

function renderPage(client: SupabaseClient, isActive = true) {
  return render(SearchPage, { props: { data: { supabase: client, cookies: [], isActive } as never } })
}

async function typeAndDebounce(container: HTMLElement, text: string) {
  await fireEvent.input(container.querySelector('input')!, { target: { value: text } })
  await vi.advanceTimersByTimeAsync(300)
  await tick()
}

describe('/suche page (active account)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the empty state with example chips initially and focuses the input', () => {
    const { client } = stubSearch([])
    const { container } = renderPage(client)
    expect(container).toHaveTextContent('Gib eine UN-Nummer oder einen Stoffnamen ein')
    const chips = container.querySelectorAll('.rounded-full')
    expect(chips).toHaveLength(4)
    expect(chips[0]).toHaveTextContent('1203')
    expect(document.activeElement).toBe(container.querySelector('input'))
  })

  it('keeps the empty state below the minimum query length without querying', async () => {
    const { client, from } = stubSearch([])
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'B')
    expect(from).not.toHaveBeenCalled()
    expect(container).toHaveTextContent('Gib eine UN-Nummer')
  })

  it('renders result cards for a text query after the debounce', async () => {
    const { client } = stubSearch([ROW])
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'Benzin')

    expect(container).toHaveTextContent('1 Ergebnisse (ADR)')
    expect(container).toHaveTextContent('UN 1203')
    expect(container).toHaveTextContent('BENZIN')
    expect(container).toHaveTextContent('Kl. 3')
    expect(container).toHaveTextContent('VG II')
  })

  it('opens the tool when a result card is clicked', async () => {
    const { client } = stubSearch([ROW])
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'Benzin')

    await fireEvent.click(container.querySelector('.space-y-2 button')!)
    expect(container.querySelector('[data-testid="tool-stub"]')).toHaveTextContent('TOOL:1203')
    expect(container).not.toHaveTextContent('Ergebnisse (ADR)')
  })

  it('loads the tool directly for a 4-digit UN number without querying', async () => {
    const { client, from } = stubSearch([])
    const { container } = renderPage(client)
    await typeAndDebounce(container, '1203')

    expect(from).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="tool-stub"]')).toHaveTextContent('TOOL:1203')
  })

  it('shows the no-results message for an unmatched query', async () => {
    const { client } = stubSearch([])
    const { container } = renderPage(client)
    await typeAndDebounce(container, 'xyzxyzxyz')
    expect(container).toHaveTextContent('Keine Ergebnisse für')
  })

  it('fills the query and loads the tool when an example chip is clicked', async () => {
    const { client } = stubSearch([])
    const { container } = renderPage(client)
    await fireEvent.click(container.querySelector('.rounded-full')!)
    await tick()
    expect(container.querySelector('input')).toHaveValue('1203')
    expect(container.querySelector('[data-testid="tool-stub"]')).toHaveTextContent('TOOL:1203')
  })

  it('does not show the lock notice or the demo tool', () => {
    const { client } = stubSearch([])
    const { container } = renderPage(client)
    expect(container).not.toHaveTextContent(LOCK_MESSAGE)
    expect(container.querySelector('[data-testid="tool-stub"]')).toBeNull()
  })
})

describe('/suche page (locked account)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the lock notice and the demo tool instead of the example chips', () => {
    const { client } = stubSearch([])
    const { container } = renderPage(client, false)
    expect(container).toHaveTextContent(LOCK_MESSAGE)
    expect(container.querySelector('[data-testid="tool-stub"]')).toHaveTextContent('TOOL:1203')
    expect(container.querySelectorAll('.rounded-full')).toHaveLength(0)
  })

  it('never queries when typing, even a 4-digit UN number', async () => {
    const { client, from } = stubSearch([ROW])
    const { container } = renderPage(client, false)
    await typeAndDebounce(container, 'Benzin')
    await typeAndDebounce(container, '1090')
    expect(from).not.toHaveBeenCalled()
    expect(container).not.toHaveTextContent('Ergebnisse (ADR)')
    expect(container).not.toHaveTextContent('TOOL:1090')
    expect(container).toHaveTextContent(LOCK_MESSAGE)
  })
})
