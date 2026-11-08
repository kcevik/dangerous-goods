import { error } from '@sveltejs/kit'
import { fetchCompareForUn, fetchUnReference } from '$lib/multimodal/mappers'
import { DEMO_DATA } from '$lib/multimodal/types'
import type { PageServerLoad } from './$types'

const UN_NUMBER_RE = /^\d{4}$/
const DEMO_UN = '1203'

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  if (!UN_NUMBER_RE.test(params.nummer)) {
    error(404, 'Not found')
  }

  const { isActive } = await parent()

  // Locked preview: never touch the database; only the hardcoded demo is available.
  if (!isActive) {
    return {
      unNumber: params.nummer,
      locked: true,
      compareData: params.nummer === DEMO_UN ? DEMO_DATA : null,
      reference: null,
    }
  }

  // a failure throws → German error page; never an empty comparison
  const [compareData, reference] = await Promise.all([
    fetchCompareForUn(locals.supabase, params.nummer),
    fetchUnReference(locals.supabase, params.nummer),
  ])
  return { unNumber: params.nummer, locked: false, compareData, reference }
}
