// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MultimodalSvsAccordion from '~/components/multimodal/MultimodalSvsAccordion.vue'
import { clearSpecialProvisionsCache } from '~/composables/useSpecialProvisions'
import { DEMO_SVS } from '~/utils/multimodal'

const { supabaseClientMock } = vi.hoisted(() => ({ supabaseClientMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => supabaseClientMock)

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
  supabaseClientMock.mockReturnValue({ from: () => builder })
  return counter
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  clearSpecialProvisionsCache()
})

describe('MultimodalSvsAccordion', () => {
  it('renders nothing when svs is empty', () => {
    stubSupabase({})
    const wrapper = mount(MultimodalSvsAccordion, { props: { ...BASE_PROPS, svs: '' } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders one row per comma-separated code', () => {
    stubSupabase({})
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163, 243, 640D', mode: 'ADR' },
    })
    const rows = wrapper.findAll('button')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toContain('SV 163')
    expect(rows[2]!.text()).toContain('SV 640D')
  })

  it('shows the click-to-open hint before a row is expanded', () => {
    stubSupabase({})
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', mode: 'ADR' },
    })
    expect(wrapper.text()).toContain(BASE_PROPS.clickLoad)
  })

  it('demo mode shows DEMO_SVS text without any network call', async () => {
    const fromSpy = vi.fn()
    supabaseClientMock.mockReturnValue({ from: fromSpy })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', demo: true },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain(DEMO_SVS['163'])
    expect(fromSpy).not.toHaveBeenCalled()
  })

  it('expanding a row loads and shows the German text', async () => {
    stubSupabase({ 'ADR:163': { text_de: 'Deutscher SV-Text', text_en: 'English SV text' } })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', mode: 'ADR' },
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain('Deutscher SV-Text')
  })

  it('prefers English text when lang is "en"', async () => {
    stubSupabase({ 'ICAO:A1': { text_de: null, text_en: 'English only' } })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: 'A1', mode: 'ICAO', lang: 'en' },
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain('English only')
  })

  it('Turkish prefers English text over German (no Turkish data in BAM dataset)', async () => {
    stubSupabase({ 'ADR:163': { text_de: 'Deutsch', text_en: 'English' } })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', mode: 'ADR', lang: 'tr' },
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).not.toContain('Deutsch')
  })

  it('switching the language re-renders the already-loaded text without refetching', async () => {
    const mock = stubSupabase({ 'ADR:163': { text_de: 'Deutsch', text_en: 'English' } })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', mode: 'ADR', lang: 'de' },
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain('Deutsch')

    await wrapper.setProps({ lang: 'en' })
    expect(wrapper.text()).toContain('English')
    expect(mock.calls).toBe(1)
  })

  it('reloads texts for open rows when the transport mode changes (no stuck "…")', async () => {
    stubSupabase({
      'ADR:163': { text_de: 'ADR-Text' },
      'RID:163': { text_de: 'RID-Text' },
    })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', mode: 'ADR' },
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain('ADR-Text')

    await wrapper.setProps({ mode: 'RID' })
    await flush()
    expect(wrapper.text()).toContain('RID-Text')
    expect(wrapper.text()).not.toContain('…')
  })

  it('falls back to another language when the preferred one is missing', async () => {
    stubSupabase({ 'ICAO:A1': { text_de: null, text_en: 'English fallback' } })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: 'A1', mode: 'ICAO' }, // lang defaults to de
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain('English fallback')
  })

  it('shows the no-text fallback when no row exists for the code', async () => {
    stubSupabase({})
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '999', mode: 'ADN' },
    })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.text()).toContain(BASE_PROPS.noText)
  })

  it('collapses an expanded row on second click, keeping a preview snippet', async () => {
    stubSupabase({ 'ADR:163': { text_de: 'Voller SV-Text' } })
    const wrapper = mount(MultimodalSvsAccordion, {
      props: { ...BASE_PROPS, svs: '163', mode: 'ADR' },
    })
    const button = wrapper.find('button')
    const panel = () => wrapper.find('.whitespace-pre-wrap')

    await button.trigger('click')
    await flush()
    expect(panel().exists()).toBe(true)

    await button.trigger('click')
    expect(panel().exists()).toBe(false)
    // once loaded, the closed row shows a text preview instead of the click hint
    expect(wrapper.text()).toContain('Voller SV-Text')
    expect(wrapper.text()).not.toContain(BASE_PROPS.clickLoad)
  })
})
