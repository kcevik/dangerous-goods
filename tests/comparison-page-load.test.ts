// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_DATA } from '$lib/multimodal/types'
import { load } from '../src/routes/(app)/un/[nummer]/vergleich/+page.server'

function stubSupabase(responses: Partial<Record<string, { data: unknown[] | null, error: unknown }>>) {
  const from = vi.fn((table: string) => ({
    select: () => ({ eq: () => ({ order: () => Promise.resolve(responses[table] ?? { data: [], error: null }) }) }),
  }))
  return { client: { from } as unknown as SupabaseClient, from }
}

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>

function call(nummer: string, client: SupabaseClient, isActive: boolean): Promise<LoadResult> {
  return load({ params: { nummer }, locals: { supabase: client }, parent: async () => ({ isActive }) } as never) as Promise<LoadResult>
}

describe('/un/[nummer]/vergleich load', () => {
  it('404s a parameter that is not four digits, without querying', async () => {
    const { client, from } = stubSupabase({})
    await expect(call('12a4', client, true)).rejects.toMatchObject({ status: 404 })
    expect(from).not.toHaveBeenCalled()
  })

  it('gives a locked account the demo for UN 1203 without querying', async () => {
    const { client, from } = stubSupabase({})
    const result = await call('1203', client, false)
    expect(result).toEqual({ unNumber: '1203', locked: true, compareData: DEMO_DATA, reference: null })
    expect(from).not.toHaveBeenCalled()
  })

  it('gives a locked account nothing for any other UN number, without querying', async () => {
    const { client, from } = stubSupabase({})
    const result = await call('1090', client, false)
    expect(result).toEqual({ unNumber: '1090', locked: true, compareData: null, reference: null })
    expect(from).not.toHaveBeenCalled()
  })

  it('loads the four modes and the UN reference for an active account', async () => {
    const { client, from } = stubSupabase({
      adr_entries: { data: [{ un_number: '1203', sequence_number: 1, name: 'BENZIN', hazard_class: '3' }], error: null },
      un_entries: { data: [{ un_number: '1203', sequence_number: 1, name: 'MOTOR SPIRIT', hazard_class: '3' }], error: null },
    })
    const result = await call('1203', client, true)
    expect(result.locked).toBe(false)
    expect(result.compareData?.ADR[0]?.name).toBe('BENZIN')
    expect(result.reference?.[0]?.name).toBe('MOTOR SPIRIT')
    expect(from).toHaveBeenCalledWith('un_entries')
  })

  it('fails loudly when the reference query fails', async () => {
    const { client } = stubSupabase({ un_entries: { data: null, error: { message: 'down' } } })
    await expect(call('1203', client, true)).rejects.toEqual({ message: 'down' })
  })
})
