// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import UnPage from '~/pages/un/[nummer].vue'

const { supabaseClientMock } = vi.hoisted(() => ({ supabaseClientMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => supabaseClientMock)

const TOOL_STUB = {
  props: ['unNumber'],
  template: '<div data-testid="tool-stub">TOOL:{{ unNumber }}</div>',
}

describe('/un/:nummer page', () => {
  it('passes the route param to MultimodalTool', async () => {
    const wrapper = await mountSuspended(UnPage, {
      route: '/un/1090',
      global: { stubs: { MultimodalTool: TOOL_STUB } },
    })
    expect(wrapper.find('[data-testid="tool-stub"]').text()).toBe('TOOL:1090')
  })

  it('renders a back link to the landing page', async () => {
    const wrapper = await mountSuspended(UnPage, {
      route: '/un/1090',
      global: { stubs: { MultimodalTool: TOOL_STUB } },
    })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/')
    expect(link.text()).toContain('zurück')
  })
})
