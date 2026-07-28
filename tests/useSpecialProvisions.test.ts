// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSpecialProvisionsCache, useSpecialProvisions } from '~/composables/useSpecialProvisions'

const { supabaseClientMock } = vi.hoisted(() => ({ supabaseClientMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => supabaseClientMock)

function createSupabaseMock(rows: Record<string, unknown | null>) {
  let mode = ''
  let code = ''

  const builder = {
    select: () => builder,
    eq: (column: string, value: string) => {
      if (column === 'mode') mode = value
      if (column === 'code') code = value
      return builder
    },
    maybeSingle: vi.fn(() =>
      Promise.resolve({ data: rows[`${mode}:${code}`] ?? null, error: null }),
    ),
  }

  const from = vi.fn(() => builder)
  return { client: { from }, from, maybeSingle: builder.maybeSingle }
}

describe('useSpecialProvisions', () => {
  beforeEach(() => {
    clearSpecialProvisionsCache()
  })

  it('loads a provision and exposes all language variants', async () => {
    const mock = createSupabaseMock({
      'ADR:640': { text_de: 'Deutscher Text', text_en: 'English text', text_fr: null },
    })
    supabaseClientMock.mockReturnValue(mock.client)

    const { get, load } = useSpecialProvisions()
    expect(get('ADR', '640')).toBeUndefined()

    const result = await load('ADR', '640')
    expect(result).toEqual({ textDe: 'Deutscher Text', textEn: 'English text', textFr: null })
    expect(get('ADR', '640')).toEqual(result)
  })

  it('returns null for a code without a row (e.g. mode not imported)', async () => {
    const mock = createSupabaseMock({})
    supabaseClientMock.mockReturnValue(mock.client)

    const { get, load } = useSpecialProvisions()
    expect(await load('ICAO', 'A1')).toBeNull()
    expect(get('ICAO', 'A1')).toBeNull()
  })

  it('caches per mode+code — second load does not hit the network', async () => {
    const mock = createSupabaseMock({ 'ADR:640': { text_de: 'x', text_en: null, text_fr: null } })
    supabaseClientMock.mockReturnValue(mock.client)

    const { load } = useSpecialProvisions()
    await load('ADR', '640')
    await load('ADR', '640')
    expect(mock.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent loads for the same key', async () => {
    const mock = createSupabaseMock({ 'ADR:640': { text_de: 'x', text_en: null, text_fr: null } })
    supabaseClientMock.mockReturnValue(mock.client)

    const { load } = useSpecialProvisions()
    await Promise.all([load('ADR', '640'), load('ADR', '640')])
    expect(mock.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('handles missing text_en/text_fr columns (pre-migration rows)', async () => {
    const mock = createSupabaseMock({ 'RID:617': { text_de: 'Nur Deutsch' } })
    supabaseClientMock.mockReturnValue(mock.client)

    const { load } = useSpecialProvisions()
    expect(await load('RID', '617')).toEqual({ textDe: 'Nur Deutsch', textEn: null, textFr: null })
  })
})
