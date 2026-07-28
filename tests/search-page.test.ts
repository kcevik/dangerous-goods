// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchPage from '~/pages/search.vue'

const { supabaseClientMock } = vi.hoisted(() => ({ supabaseClientMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => supabaseClientMock)

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
  supabaseClientMock.mockReturnValue({ from })
  return { from }
}

const TOOL_STUB = {
  props: ['unNumber'],
  template: '<div data-testid="tool-stub">TOOL:{{ unNumber }}</div>',
}

function mountPage() {
  return mountSuspended(SearchPage, {
    global: { stubs: { MultimodalTool: TOOL_STUB } },
  })
}

async function typeAndDebounce(wrapper: Awaited<ReturnType<typeof mountPage>>, text: string) {
  await wrapper.find('input').setValue(text)
  vi.advanceTimersByTime(300)
  await flushPromises()
}

describe('/search page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the empty state with example chips initially', async () => {
    stubSearch([])
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Gib eine UN-Nummer oder einen Stoffnamen ein')
    const chips = wrapper.findAll('.rounded-full')
    expect(chips.length).toBe(4)
    expect(chips[0]!.text()).toContain('1203')
  })

  it('keeps the empty state below the minimum query length without querying', async () => {
    const { from } = stubSearch([])
    const wrapper = await mountPage()
    await typeAndDebounce(wrapper, 'B')
    expect(from).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Gib eine UN-Nummer')
  })

  it('renders result cards for a text query after the debounce', async () => {
    stubSearch([ROW])
    const wrapper = await mountPage()
    await typeAndDebounce(wrapper, 'Benzin')

    expect(wrapper.text()).toContain('1 Ergebnisse (ADR)')
    expect(wrapper.text()).toContain('UN 1203')
    expect(wrapper.text()).toContain('BENZIN')
    expect(wrapper.text()).toContain('Kl. 3')
    expect(wrapper.text()).toContain('VG II')
  })

  it('opens the tool when a result card is clicked', async () => {
    stubSearch([ROW])
    const wrapper = await mountPage()
    await typeAndDebounce(wrapper, 'Benzin')

    await wrapper.find('.space-y-2 button').trigger('click')
    expect(wrapper.find('[data-testid="tool-stub"]').text()).toBe('TOOL:1203')
    expect(wrapper.text()).not.toContain('Ergebnisse (ADR)')
  })

  it('loads the tool directly for a 4-digit UN number without querying', async () => {
    const { from } = stubSearch([])
    const wrapper = await mountPage()
    await typeAndDebounce(wrapper, '1203')

    expect(from).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="tool-stub"]').text()).toBe('TOOL:1203')
  })

  it('shows the no-results message for an unmatched query', async () => {
    stubSearch([])
    const wrapper = await mountPage()
    await typeAndDebounce(wrapper, 'xyzxyzxyz')
    expect(wrapper.text()).toContain('Keine Ergebnisse für')
  })

  it('fills the query and loads the tool when an example chip is clicked', async () => {
    stubSearch([])
    const wrapper = await mountPage()
    await wrapper.find('.rounded-full').trigger('click')
    await flushPromises()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1203')
    expect(wrapper.find('[data-testid="tool-stub"]').text()).toBe('TOOL:1203')
  })
})
