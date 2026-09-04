import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { MultimodalToolState } from '$lib/multimodal/multimodalTool.svelte'
import { DEMO_DATA } from '$lib/multimodal/types'

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

function demoTool(supabase?: SupabaseClient) {
  return new MultimodalToolState({ initialData: DEMO_DATA, initialUnNumber: '1203', supabase })
}

describe('MultimodalToolState', () => {
  it('starts empty by default', () => {
    const tool = new MultimodalToolState()
    expect(tool.currentUnNumber).toBe('')
    expect(tool.compareData).toEqual({})
    expect(tool.currentEntry).toBeNull()
    expect(tool.searchDisplay).toBe('')
    expect(tool.hasData).toBe(false)
  })

  it('preloads UN 1203 demo data when given initialData', () => {
    const tool = demoTool()
    expect(tool.currentUnNumber).toBe('1203')
    expect(tool.compareData).toEqual(DEMO_DATA)
    expect(tool.currentEntry?.name).toBe('BENZIN')
    expect(tool.searchDisplay).toBe('UN 1203 – BENZIN')
    expect(tool.hasData).toBe(true)
  })

  it('selects the first mode with rows when initialData has no ADR entry', () => {
    const tool = new MultimodalToolState({
      initialData: { ADR: [], RID: [], IMDG: DEMO_DATA.IMDG!, ICAO: [], ADN: [] },
      initialUnNumber: '1203',
    })
    expect(tool.currentModal).toBe('IMDG')
  })

  describe('L (labels)', () => {
    it('returns the label in the current language and falls back to the key', () => {
      const tool = new MultimodalToolState()
      expect(tool.L('class')).toBe('Klasse')
      tool.setLang('en')
      expect(tool.L('class')).toBe('Class')
      expect(tool.L('unknownKey')).toBe('unknownKey')
    })
  })

  describe('getName', () => {
    it('follows the language fallback chain', () => {
      const tool = demoTool()
      const entry = tool.currentEntry!
      expect(tool.getName(entry)).toBe('BENZIN')
      tool.setLang('en')
      expect(tool.getName(entry)).toBe('PETROL')
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('ESSENCE')
      tool.setLang('tr')
      expect(tool.getName(entry)).toBe('PETROL')
    })

    it('always uses the raw name for ICAO (English-only dataset)', () => {
      const tool = demoTool()
      tool.switchModal('ICAO')
      const entry = tool.currentEntry!
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('Gasoline')
    })
  })

  describe('getNameSub', () => {
    it('lists the other language names, excluding the current language', () => {
      const tool = demoTool()
      const entry = tool.currentEntry!
      expect(tool.getNameSub(entry)).toBe('PETROL · ESSENCE')
      tool.setLang('en')
      expect(tool.getNameSub(entry)).toBe('BENZIN · ESSENCE')
    })
  })

  describe('getSpez', () => {
    it('follows the language fallback chain for specifications', () => {
      const tool = demoTool()
      const entry = tool.currentEntry!
      expect(tool.getSpez(entry)).toBe('oder KRAFTSTOFF FÜR MOTOREN, BENZIN')
      tool.setLang('en')
      expect(tool.getSpez(entry)).toBe('or MOTOR SPIRIT or GASOLINE')
      tool.setLang('fr')
      tool.switchModal('IMDG')
      expect(tool.getSpez(tool.currentEntry!)).toBe('or PETROL or MOTOR SPIRIT')
    })
  })

  describe('switchModal', () => {
    it('switches only to modes that have data', () => {
      const tool = demoTool()
      tool.switchModal('RID')
      expect(tool.currentModal).toBe('RID')
    })

    it('ignores modes without data', () => {
      const tool = new MultimodalToolState()
      tool.switchModal('IMDG')
      expect(tool.currentModal).toBe('ADR')
    })
  })

  describe('bkClass', () => {
    it('returns the mapped class or a gray fallback', () => {
      const tool = new MultimodalToolState()
      expect(tool.bkClass('0')).toContain('bg-red-900')
      expect(tool.bkClass('99')).toContain('bg-gray-200')
    })
  })

  describe('loadCompare', () => {
    it('does nothing for a blank UN number', async () => {
      const { client, from } = stubSupabase({})
      const tool = new MultimodalToolState({ supabase: client })
      await tool.loadCompare('  ')
      expect(from).not.toHaveBeenCalled()
    })

    it('throws when no supabase client was provided', async () => {
      const tool = new MultimodalToolState()
      await expect(tool.loadCompare('1203')).rejects.toThrow('supabase')
    })

    it('loads data, selects the first available mode, and clears loading', async () => {
      const { client } = stubSupabase({
        imdg_entries: {
          data: [{ un_number: '1080', sequence_number: 1, name: 'SF6', hazard_class: '2.2' }],
          error: null,
        },
      })
      const tool = new MultimodalToolState({ supabase: client })
      await tool.loadCompare('1080')

      expect(tool.currentUnNumber).toBe('1080')
      expect(tool.currentModal).toBe('IMDG')
      expect(tool.currentEntry?.name).toBe('SF6')
      expect(tool.isLoading).toBe(false)
      expect(tool.compareData.ADR).toEqual([])
    })

    it('clears the loading flag even when the fetch fails', async () => {
      const { client } = stubSupabase({ adr_entries: { data: null, error: new Error('boom') } })
      const tool = new MultimodalToolState({ supabase: client })
      await expect(tool.loadCompare('1203')).rejects.toThrow('boom')
      expect(tool.isLoading).toBe(false)
    })
  })
})
