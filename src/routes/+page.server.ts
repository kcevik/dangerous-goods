import type { PageServerLoad } from './$types'

/** `/?konto=geloescht` is where the account deletion on /konto lands. */
export const load: PageServerLoad = async ({ url }) => {
  return { accountDeleted: url.searchParams.get('konto') === 'geloescht' }
}
