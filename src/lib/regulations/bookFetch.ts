import type { CodeTarget, ViewerDeps } from './adrBookViewer.svelte'
import type { HitListResult, RenderedWindow } from './bookTypes'

/**
 * The viewer's network calls against the two book endpoints under `base`
 * (e.g. `/regelwerk/adr`). A non-2xx answer rejects, so the state class can
 * keep its position and show `loadFailed`.
 */
export function createBookFetchers(base: string, fetchFn: typeof fetch = fetch): ViewerDeps {
  async function getJson<T>(path: string): Promise<T> {
    const res = await fetchFn(`${base}${path}`, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`${path} → ${res.status}`)
    return await res.json() as T
  }

  return {
    fetchWindow: ({ line, dir }) =>
      getJson<RenderedWindow>(`/window?line=${line}${dir ? `&dir=${dir}` : ''}`),
    searchText: term =>
      getJson<HitListResult>(`/search?q=${encodeURIComponent(term)}`),
    fetchCodeHits: (target: CodeTarget, includeIncidental: boolean) =>
      getJson<HitListResult>(`/search?${target.kind}=${encodeURIComponent(target.code)}${includeIncidental ? '&all=1' : ''}`),
  }
}
