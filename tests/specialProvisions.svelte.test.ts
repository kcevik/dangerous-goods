import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSpecialProvisionsCache,
  getSpecialProvision,
  loadSpecialProvision,
} from '$lib/multimodal/specialProvisions.svelte'

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
  return { client: { from } as unknown as SupabaseClient, from, maybeSingle: builder.maybeSingle }
}

describe('specialProvisions', () => {
  beforeEach(() => {
    clearSpecialProvisionsCache()
  })

  it('loads a provision and exposes all language variants', async () => {
    const mock = createSupabaseMock({
      'ADR:640': { text_de: 'Deutscher Text', text_en: 'English text', text_fr: null },
    })
    expect(getSpecialProvision('ADR', '640')).toBeUndefined()

    const result = await loadSpecialProvision(mock.client, 'ADR', '640')
    expect(result).toEqual({ textDe: 'Deutscher Text', textEn: 'English text', textFr: null })
    expect(getSpecialProvision('ADR', '640')).toEqual(result)
  })

  it('returns null for a code without a row (e.g. mode not imported)', async () => {
    const mock = createSupabaseMock({})
    expect(await loadSpecialProvision(mock.client, 'ICAO', 'A1')).toBeNull()
    expect(getSpecialProvision('ICAO', 'A1')).toBeNull()
  })

  it('caches per mode+code — second load does not hit the network', async () => {
    const mock = createSupabaseMock({ 'ADR:640': { text_de: 'x', text_en: null, text_fr: null } })
    await loadSpecialProvision(mock.client, 'ADR', '640')
    await loadSpecialProvision(mock.client, 'ADR', '640')
    expect(mock.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent loads for the same key', async () => {
    const mock = createSupabaseMock({ 'ADR:640': { text_de: 'x', text_en: null, text_fr: null } })
    await Promise.all([
      loadSpecialProvision(mock.client, 'ADR', '640'),
      loadSpecialProvision(mock.client, 'ADR', '640'),
    ])
    expect(mock.maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('handles missing text_en/text_fr columns (pre-migration rows)', async () => {
    const mock = createSupabaseMock({ 'RID:617': { text_de: 'Nur Deutsch' } })
    expect(await loadSpecialProvision(mock.client, 'RID', '617')).toEqual({ textDe: 'Nur Deutsch', textEn: null, textFr: null })
  })

  it('does not cache errors, so the next load retries', async () => {
    const failing = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: new Error('down') }) }),
          }),
        }),
      }),
    } as unknown as SupabaseClient
    expect(await loadSpecialProvision(failing, 'ADR', '163')).toBeNull()
    expect(getSpecialProvision('ADR', '163')).toBeUndefined()

    const mock = createSupabaseMock({ 'ADR:163': { text_de: 'ok' } })
    expect(await loadSpecialProvision(mock.client, 'ADR', '163')).toEqual({ textDe: 'ok', textEn: null, textFr: null })
  })
})
