import { describe, expect, it } from 'vitest'
import { actions } from '../src/routes/logout/+page.server'
import { makeAuthEvent } from './helpers/authEvent'

describe('logout action', () => {
  it('signs out and redirects to the landing page', async () => {
    const { event, auth } = makeAuthEvent({ session: { access_token: 't' } })
    await expect(actions.default(event as never)).rejects.toMatchObject({ status: 303, location: '/' })
    expect(auth.signOut).toHaveBeenCalledTimes(1)
  })
})
