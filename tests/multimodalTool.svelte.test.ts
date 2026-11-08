import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { MultimodalToolState } from '$lib/multimodal/multimodalTool.svelte'
import { DEMO_DATA, type Entry } from '$lib/multimodal/types'
import { UN_1203, UN_1993 } from './fixtures/variant-rows'

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
      expect(tool.getName(entry)).toBe('MOTOR SPIRIT')
      tool.setLang('fr')
      expect(tool.getName(entry)).toBe('ESSENCE')
      tool.setLang('tr')
      expect(tool.getName(entry)).toBe('MOTOR SPIRIT')
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
      expect(tool.getNameSub(entry)).toBe('MOTOR SPIRIT · ESSENCE')
      tool.setLang('en')
      expect(tool.getNameSub(entry)).toBe('BENZIN · ESSENCE')
    })
  })

  describe('getSpez', () => {
    // UN 1203 carries no specification in any mode, so use a literal entry here
    const spezEntry = {
      unNumber: '1263', sequenceNumber: 1,
      specification: 'oder FARBZUBEHÖRSTOFFE',
      specificationEn: 'or PAINT RELATED MATERIAL',
      specificationFr: 'ou MATIÈRES APPARENTÉES AUX PEINTURES',
    }

    it('follows the language fallback chain for specifications', () => {
      const tool = new MultimodalToolState()
      expect(tool.getSpez(spezEntry)).toBe('oder FARBZUBEHÖRSTOFFE')
      tool.setLang('en')
      expect(tool.getSpez(spezEntry)).toBe('or PAINT RELATED MATERIAL')
      tool.setLang('fr')
      expect(tool.getSpez(spezEntry)).toBe('ou MATIÈRES APPARENTÉES AUX PEINTURES')
    })

    it('falls back to English for French and Turkish when no French text exists', () => {
      const tool = new MultimodalToolState()
      const noFrench = { ...spezEntry, specificationFr: undefined }
      tool.setLang('fr')
      expect(tool.getSpez(noFrench)).toBe('or PAINT RELATED MATERIAL')
      tool.setLang('tr')
      expect(tool.getSpez(noFrench)).toBe('or PAINT RELATED MATERIAL')
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
      // the failure is reported through loadError (nobody awaited the old rejection)
      await expect(tool.loadCompare('1203')).resolves.toBeUndefined()
      expect(tool.isLoading).toBe(false)
      expect(tool.loadError).toBe(true)
    })
  })
})

describe('MultimodalToolState — failed loads (code review 2026-09-29)', () => {
  it('reports a failed load instead of looking like "no data", and clears the old UN', async () => {
    const { client } = stubSupabase({ rid_entries: { data: null, error: { message: 'network down' } } })
    const tool = demoTool(client)
    await expect(tool.loadCompare('1090')).resolves.toBeUndefined()
    expect(tool.loadError).toBe(true)
    expect(tool.isLoading).toBe(false)
    expect(tool.hasData).toBe(false)
    expect(tool.currentUnNumber).toBe('1090')
  })

  it('clears the error on the next successful load', async () => {
    const responses: Record<string, { data: unknown[] | null, error: unknown }> = { adr_entries: { data: null, error: { message: 'x' } } }
    const { client } = stubSupabase(responses)
    const tool = demoTool(client)
    await tool.loadCompare('1090')
    expect(tool.loadError).toBe(true)
    delete responses.adr_entries
    await tool.loadCompare('1090')
    expect(tool.loadError).toBe(false)
  })
})

describe('MultimodalToolState — variants', () => {
  function tool1993() {
    return new MultimodalToolState({ initialData: UN_1993 as Record<string, Entry[]>, initialUnNumber: '1993' })
  }

  const e = (partial: Partial<Entry>): Entry => ({ unNumber: '9999', sequenceNumber: 1, ...partial })
  /** ADR one variant VG II; IMDG two VG II variants with unrelated specifications → no match */
  const AMBIGUOUS: Record<string, Entry[]> = {
    ADR: [e({ name: 'STOFF', packingGroup: 'II', limitedQty: '1 L' })],
    IMDG: [
      e({ sequenceNumber: 1, name: 'STOFF', packingGroup: 'II', specificationEn: 'A', limitedQty: '1 L' }),
      e({ sequenceNumber: 2, name: 'STOFF', packingGroup: 'II', specificationEn: 'B', limitedQty: '5 L' }),
    ],
  }

  it('lists the anchor mode variants and starts on the first', () => {
    const tool = tool1993()
    expect(tool.anchorMode).toBe('ADR')
    expect(tool.anchorVariants).toHaveLength(5)
    expect(tool.selectedVariantIndex).toBe(0)
    expect(tool.getEntry('ADR')?.packingGroup).toBe('I')
    expect(tool.getEntry('IMDG')?.packingGroup).toBe('I')
  })

  it('applies the chosen variant to every mode', () => {
    const tool = tool1993()
    tool.selectVariant(3) // ADR row 4: VG III, tunnel code D/E
    expect(tool.getEntry('ADR')?.tunnelCode).toBe('D/E')
    expect(tool.getEntry('RID')?.packingGroup).toBe('III')
    expect(tool.getEntry('IMDG')?.limitedQty).toBe('5 L')
    expect(tool.getEntry('ICAO')?.packingGroup).toBe('III')

    tool.selectVariant(4) // viscous VG III, tunnel code E
    expect(tool.getEntry('ADR')?.tunnelCode).toBe('E')
    expect(tool.getEntry('IMDG')?.packingGroup).toBe('III')
  })

  it('shows no picker material for a UN number with one variant', () => {
    const tool = new MultimodalToolState({ initialData: UN_1203 as Record<string, Entry[]>, initialUnNumber: '1203' })
    expect(tool.anchorVariants).toHaveLength(1)
  })

  it('names every row of the current variant, current language first', () => {
    const tool = new MultimodalToolState({ initialData: UN_1203 as Record<string, Entry[]>, initialUnNumber: '1203' })
    expect(tool.variantNames('ADR')).toEqual({
      primary: 'BENZIN',
      others: ['OTTOKRAFTSTOFF', 'MOTOR SPIRIT', 'GASOLINE', 'PETROL', 'ESSENCE'],
    })
    tool.setLang('en')
    expect(tool.variantNames('ADR').primary).toBe('MOTOR SPIRIT')
    expect(tool.variantNames('ADN')).toEqual({ primary: '', others: [] })
  })

  it('labels variants with the localised packing-group prefix', () => {
    const tool = tool1993()
    expect(tool.labelOf(tool.anchorVariants[0]!, 'ADR')).toBe('VP-Gr. I')
    tool.setLang('en')
    expect(tool.labelOf(tool.anchorVariants[0]!, 'ADR')).toBe('PG I')
  })

  it('reports a mode without an unambiguous match instead of guessing', () => {
    const tool = new MultimodalToolState({ initialData: AMBIGUOUS, initialUnNumber: '9999' })
    expect(tool.isUnmatched('IMDG')).toBe(true)
    expect(tool.getEntry('IMDG')).toBeNull()
    expect(tool.hasRows('IMDG')).toBe(true)
  })

  it('lets the user pick for an unmatched mode, and resets that pick on a new main choice', () => {
    const tool = new MultimodalToolState({ initialData: AMBIGUOUS, initialUnNumber: '9999' })
    tool.overrideVariant('IMDG', 1)
    expect(tool.getEntry('IMDG')?.limitedQty).toBe('5 L')
    expect(tool.isUnmatched('IMDG')).toBe(false)
    tool.selectVariant(0)
    expect(tool.getEntry('IMDG')).toBeNull()
  })

  it('treats a mode without rows as not available, not as unmatched', () => {
    const tool = tool1993()
    expect(tool.hasRows('ADN')).toBe(false)
    expect(tool.isUnmatched('ADN')).toBe(false)
    expect(tool.getEntry('ADN')).toBeNull()
  })

  it('allows switching to an unmatched mode', () => {
    const tool = new MultimodalToolState({ initialData: AMBIGUOUS, initialUnNumber: '9999' })
    tool.switchModal('IMDG')
    expect(tool.currentModal).toBe('IMDG')
  })

  it('refuses to switch to a mode whose row list is empty', () => {
    // fetchCompareForUn always returns ADN: []
    const tool = new MultimodalToolState({ initialData: { ...UN_1993, ADN: [] } as Record<string, Entry[]>, initialUnNumber: '1993' })
    tool.switchModal('ADN')
    expect(tool.currentModal).toBe('ADR')
  })

  it('applies no variant picked during a load to the next UN number (review fix)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const rows = UN_1203.ADR!.map(r => ({ un_number: r.unNumber, sequence_number: r.sequenceNumber, name: r.name, packing_group: r.packingGroup }))
    const from = vi.fn((table: string) => ({
      select: () => ({
        eq: () => ({
          order: async () => {
            await gate
            return { data: table === 'adr_entries' ? rows : [], error: null }
          },
        }),
      }),
    }))
    const tool = new MultimodalToolState({ initialData: UN_1993 as Record<string, Entry[]>, initialUnNumber: '1993', supabase: { from } as unknown as SupabaseClient })
    const pending = tool.loadCompare('1203')
    tool.selectVariant(3) // clicked on the old UN while the new one loads
    tool.overrideVariant('IMDG', 1)
    release()
    await pending
    expect(tool.selectedVariantIndex).toBe(0)
    expect(tool.overrides).toEqual({})
  })

  it('shows nothing rather than silently falling back to the first variant for an out-of-range index (review fix)', () => {
    const tool = tool1993()
    tool.selectVariant(9)
    expect(tool.getEntry('ADR')).toBeNull()
    expect(tool.getEntry('IMDG')).toBeNull()
  })

  it('lists every specification of a merged variant (review fix)', () => {
    const tool = tool1993()
    tool.selectVariant(4) // ADR rows 5 + 6, differing vapour pressure
    const specs = tool.variantSpecs('ADR')
    expect(specs).toHaveLength(2)
    expect(specs[0]).toContain('größer als 110 kPa')
    expect(specs[1]).toContain('höchstens 110 kPa')
    tool.setLang('en')
    expect(tool.variantSpecs('ADR')[1]).toContain('not more than 110 kPa')
    expect(tool.variantSpecs('ADN')).toEqual([])
  })

  it('resets the selection and overrides when a new UN number loads', async () => {
    const rows = UN_1203.ADR!.map(r => ({ un_number: r.unNumber, sequence_number: r.sequenceNumber, name: r.name, packing_group: r.packingGroup }))
    const { client } = stubSupabase({ adr_entries: { data: rows, error: null } })
    const tool = new MultimodalToolState({ initialData: UN_1993 as Record<string, Entry[]>, initialUnNumber: '1993', supabase: client })
    tool.selectVariant(4)
    tool.overrideVariant('IMDG', 2)
    await tool.loadCompare('1203')
    expect(tool.selectedVariantIndex).toBe(0)
    expect(tool.overrides).toEqual({})
    expect(tool.getEntry('ADR')?.sequenceNumber).toBe(1)
  })
})
