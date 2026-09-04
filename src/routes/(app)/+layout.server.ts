import type { LayoutServerLoad } from './$types'

/** The root layout already resolved the session; just narrow what (app) pages need. */
export const load: LayoutServerLoad = async ({ parent }) => {
  const { user, isActive } = await parent()
  return { user, isActive }
}
