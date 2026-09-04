import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_DATA } from '$lib/multimodal/types'
import { load } from '../src/routes/(app)/un/[nummer]/+page.server'

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

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>

function call(nummer: string, client: SupabaseClient, isActive: boolean): Promise<LoadResult> {
  return load({
    params: { nummer },
    locals: { supabase: client },
    parent: async () => ({ isActive }),
  } as never) as Promise<LoadResult>
}

describe('/un/[nummer] load (active account)', () => {
  it('returns the UN number and comparison data for a valid 4-digit number', async () => {
    const { client, from } = stubSupabase({
      adr_entries: { data: [{ un_number: '1203', sequence_number: 1, name: 'BENZIN', hazard_class: '3' }], error: null },
    })
    const result = await call('1203', client, true)
    expect(result.locked).toBe(false)
    expect(result.unNumber).toBe('1203')
    expect(result.compareData?.ADR[0]?.name).toBe('BENZIN')
    expect(from).toHaveBeenCalledWith('adr_entries')
  })

  it('throws 404 for a non-4-digit param without querying', async () => {
    const { client, from } = stubSupabase({})
    await expect(call('abc', client, true)).rejects.toMatchObject({ status: 404 })
    await expect(call('12345', client, true)).rejects.toMatchObject({ status: 404 })
    expect(from).not.toHaveBeenCalled()
  })

  it('propagates database errors', async () => {
    const { client } = stubSupabase({ rid_entries: { data: null, error: new Error('rid down') } })
    await expect(call('1203', client, true)).rejects.toThrow('rid down')
  })
})

describe('/un/[nummer] load (locked account)', () => {
  it('serves the hardcoded demo for UN 1203 without querying', async () => {
    const { client, from } = stubSupabase({})
    const result = await call('1203', client, false)
    expect(result).toEqual({ unNumber: '1203', locked: true, compareData: DEMO_DATA })
    expect(from).not.toHaveBeenCalled()
  })

  it('returns no data for any other UN number without querying', async () => {
    const { client, from } = stubSupabase({})
    const result = await call('1090', client, false)
    expect(result).toEqual({ unNumber: '1090', locked: true, compareData: null })
    expect(from).not.toHaveBeenCalled()
  })

  it('still 404s on a malformed number', async () => {
    const { client } = stubSupabase({})
    await expect(call('x', client, false)).rejects.toMatchObject({ status: 404 })
  })
})
