import type { CodeTarget, ViewerDeps } from './adrBookViewer.svelte'
import type { HitListResult, RenderedWindow } from './bookTypes'

/**
 * The viewer's network calls against the two book endpoints under `base`
 * (e.g. `/regelwerk/adr`). A non-2xx answer rejects, so the state class can
 * keep its position and show `loadFailed` / `searchFailed`.
 *
 * So does a redirected or non-JSON answer: an expired session is sent to
 * `/login` by the route guard, and `fetch` follows that 303 to a 200 HTML page.
 * That must surface as a failure, never be parsed as (or mistaken for) data.
 */
export function createBookFetchers(base: string, fetchFn: typeof fetch = fetch): ViewerDeps {
  async function getJson<T>(path: string): Promise<T> {
    const res = await fetchFn(`${base}${path}`, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`${path} → ${res.status}`)
    if (res.redirected) throw new Error(`${path} → redirected to ${res.url}`)
    if (!/\bjson\b/i.test(res.headers.get('content-type') ?? '')) throw new Error(`${path} → not JSON`)
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
