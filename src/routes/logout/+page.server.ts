import { redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

/** GET has nothing to show — send visitors home. Logging out is POST only. */
export const load: PageServerLoad = async () => {
  redirect(303, '/')
}

export const actions: Actions = {
  default: async ({ locals }) => {
    await locals.supabase.auth.signOut()
    redirect(303, '/')
  },
}
