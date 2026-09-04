import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import LockNotice, { LOCK_MESSAGE } from '$lib/auth/LockNotice.svelte'

describe('LockNotice', () => {
  it('renders the shared lock message as a status region', () => {
    const { getByRole } = render(LockNotice)
    const notice = getByRole('status')
    expect(notice).toHaveTextContent('noch nicht freigeschaltet')
    expect(notice).toHaveTextContent(LOCK_MESSAGE)
  })
})
