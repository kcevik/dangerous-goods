import { resolve } from '$app/paths'
import type { Entry } from '$lib/multimodal/types'

/** ADR rows of one UN number from `/tools/1000-punkte/eintrag`; throws on any failure */
export async function fetchPointsEntries(unNumber: string, fetchFn: typeof fetch = fetch): Promise<Entry[]> {
  const res = await fetchFn(`${resolve('/(app)/tools/1000-punkte/eintrag')}?un=${encodeURIComponent(unNumber)}`)
  if (!res.ok) throw new Error(`lookup failed: ${res.status}`)
  const body = await res.json() as { entries?: unknown }
  if (!Array.isArray(body.entries)) throw new Error('lookup failed: malformed answer')
  return body.entries as Entry[]
}
