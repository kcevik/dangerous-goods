import type { SupabaseClient } from '@supabase/supabase-js'

export interface SpecialProvisionText {
  textDe: string | null
  textEn: string | null
  textFr: string | null
}

/** Module-level cache shared by all accordion instances; key = `${mode}:${code}` */
const cache = $state<Record<string, SpecialProvisionText | null>>({})
// plain Map on purpose: internal request dedupe, never read by templates
const pending = new Map<string, Promise<SpecialProvisionText | null>>()

function cacheKey(mode: string, code: string): string {
  return `${mode}:${code}`
}

/** Test-only: reset module state between test cases */
export function clearSpecialProvisionsCache(): void {
  for (const k of Object.keys(cache)) delete cache[k]
  pending.clear()
}

/** Synchronous cache read; `undefined` = not fetched yet, `null` = fetched, no row */
export function getSpecialProvision(mode: string, code: string): SpecialProvisionText | null | undefined {
  return cache[cacheKey(mode, code)]
}

export async function loadSpecialProvision(
  supabase: SupabaseClient,
  mode: string,
  code: string,
): Promise<SpecialProvisionText | null> {
  const key = cacheKey(mode, code)
  if (key in cache) return cache[key] ?? null

  const inFlight = pending.get(key)
  if (inFlight) return inFlight

  const request = (async () => {
    try {
      // select * so this works before and after the text_en/text_fr migration
      const { data, error } = await supabase
        .from('special_provisions')
        .select('*')
        .eq('mode', mode)
        .eq('code', code)
        .maybeSingle()

      if (error) throw error

      const row = data as Record<string, unknown> | null
      const result: SpecialProvisionText | null = row
        ? {
            textDe: (row.text_de as string | null) ?? null,
            textEn: (row.text_en as string | null) ?? null,
            textFr: (row.text_fr as string | null) ?? null,
          }
        : null
      cache[key] = result
      return result
    }
    catch {
      // don't cache errors — allow retry on next toggle
      return null
    }
    finally {
      pending.delete(key)
    }
  })()

  pending.set(key, request)
  return request
}
