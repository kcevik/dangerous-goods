// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { useMultimodalTool } from '~/composables/useMultimodalTool'
import { DEMO_DATA } from '~/utils/multimodal'

const { supabaseClientMock } = vi.hoisted(() => ({ supabaseClientMock: vi.fn() }))
mockNuxtImport('useSupabaseClient', () => supabaseClientMock)

function stubSupabase(responses: Partial<Record<string, { data: unknown[] | null, error: unknown }>>) {
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve(responses[table] ?? { data: [], error: null }),
      }),
    }),
  }))
  supabaseClientMock.mockReturnValue({ from })
  return { from }
}

describe('useMultimodalTool', () => {
  it('starts empty by default', () => {
    const tool = useMultimodalTool()
    expect(tool.currentUnNumber.value).toBe('')
    expect(tool.compareData.value).toEqual({})
    expect(tool.currentEntry.value).toBeNull()
    expect(tool.searchDisplay.value).toBe('')
  })

  it('preloads UN 1203 demo data in demo mode', () => {
    const tool = useMultimodalTool({ demo: true })
    expect(tool.currentUnNumber.value).toBe('1203')
    expect(tool.compareData.value).toEqual(DEMO_DATA)
    expect(tool.currentEntry.value?.name).toBe('BENZIN')
    expect(tool.searchDisplay.value).toBe('UN 1203 – BENZIN')
  })

  describe('L (labels)', () => {
    it('returns the label in the current language and falls back to the key', () => {
      const tool = useMultimodalTool()
      expect(tool.L('class')).toBe('Klasse')
      tool.setLang('en')
      expect(tool.L('class')).toBe('Class')
      expect(tool.L('unknownKey')).toBe('unknownKey')
    })
  })

  describe('getName', () => {
    it('follows the language fallback chain', () => {
      const tool = useMultimodalTool({ demo: true })
      const entry = tool.currentEntry.value!

      expect(tool.getName(entry)).toBe('BENZIN')
      tool.setLang('en')
      expect(tool.getName(entry)).toBe('PETROL')
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('ESSENCE')
      tool.setLang('tr')
      expect(tool.getName(entry)).toBe('PETROL')
    })

    it('always uses the raw name for ICAO (English-only dataset)', () => {
      const tool = useMultimodalTool({ demo: true })
      tool.switchModal('ICAO')
      const entry = tool.currentEntry.value!
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('Gasoline')
    })
  })

  describe('getNameSub', () => {
    it('lists the other language names, excluding the current language', () => {
      const tool = useMultimodalTool({ demo: true })
      const entry = tool.currentEntry.value!
      expect(tool.getNameSub(entry)).toBe('PETROL · ESSENCE')
      tool.setLang('en')
      expect(tool.getNameSub(entry)).toBe('BENZIN · ESSENCE')
    })
  })

  describe('getSpez', () => {
    it('follows the language fallback chain for specifications', () => {
      const tool = useMultimodalTool({ demo: true })
      const entry = tool.currentEntry.value!
      expect(tool.getSpez(entry)).toBe('oder KRAFTSTOFF FÜR MOTOREN, BENZIN')
      tool.setLang('en')
      expect(tool.getSpez(entry)).toBe('or MOTOR SPIRIT or GASOLINE')
      // no French specification on the demo IMDG entry → falls back to English
      tool.setLang('fr')
      tool.switchModal('IMDG')
      expect(tool.getSpez(tool.currentEntry.value!)).toBe('or PETROL or MOTOR SPIRIT')
    })
  })

  describe('switchModal', () => {
    it('switches only to modes that have data', () => {
      const tool = useMultimodalTool({ demo: true })
      tool.switchModal('RID')
      expect(tool.currentModal.value).toBe('RID')
    })

    it('ignores modes without data', () => {
      const tool = useMultimodalTool()
      tool.switchModal('IMDG')
      expect(tool.currentModal.value).toBe('ADR')
    })
  })

  describe('bkClass', () => {
    it('returns the mapped class or a gray fallback', () => {
      const tool = useMultimodalTool()
      expect(tool.bkClass('0')).toContain('bg-red-900')
      expect(tool.bkClass('99')).toContain('bg-gray-200')
    })
  })

  describe('loadCompare', () => {
    it('does nothing for a blank UN number', async () => {
      const { from } = stubSupabase({})
      const tool = useMultimodalTool()
      await tool.loadCompare('  ')
      expect(from).not.toHaveBeenCalled()
    })

    it('loads data, selects the first available mode, and clears loading', async () => {
      stubSupabase({
        imdg_entries: {
          data: [{ un_number: '1080', sequence_number: 1, name: 'SF6', hazard_class: '2.2' }],
          error: null,
        },
      })
      const tool = useMultimodalTool()
      await tool.loadCompare('1080')

      expect(tool.currentUnNumber.value).toBe('1080')
      expect(tool.currentModal.value).toBe('IMDG')
      expect(tool.currentEntry.value?.name).toBe('SF6')
      expect(tool.isLoading.value).toBe(false)
      expect(tool.compareData.value.ADR).toEqual([])
    })

    it('clears the loading flag even when the fetch fails', async () => {
      stubSupabase({ adr_entries: { data: null, error: new Error('boom') } })
      const tool = useMultimodalTool()
      await expect(tool.loadCompare('1203')).rejects.toThrow('boom')
      expect(tool.isLoading.value).toBe(false)
    })
  })
})
