import type { PageLoad } from './$types'

/** `/suche?q=…` prefills the field and runs the search; the page keeps `?q=` in sync via replaceState */
export const load: PageLoad = ({ url }) => ({ q: url.searchParams.get('q') ?? '' })
