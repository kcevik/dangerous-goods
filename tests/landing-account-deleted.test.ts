import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it } from 'vitest'
import { ACCOUNT_DELETED_MESSAGE } from '$lib/account/messages'
import { load } from '../src/routes/+page.server'
import LandingPage from '../src/routes/+page.svelte'

afterEach(() => {
  document.head.innerHTML = ''
})

describe('landing page after account deletion', () => {
  it('load flags ?konto=geloescht only', async () => {
    expect(await load({ url: new URL('http://localhost/?konto=geloescht') } as never)).toEqual({ accountDeleted: true })
    expect(await load({ url: new URL('http://localhost/?konto=x') } as never)).toEqual({ accountDeleted: false })
    expect(await load({ url: new URL('http://localhost/') } as never)).toEqual({ accountDeleted: false })
  })

  it('shows the German confirmation only when flagged', () => {
    const shown = render(LandingPage, { props: { data: { registrationOpen: false, accountDeleted: true } as never } })
    expect(shown.getByRole('status')).toHaveTextContent(ACCOUNT_DELETED_MESSAGE)
    shown.unmount()
    const plain = render(LandingPage, { props: { data: { registrationOpen: false } as never } })
    expect(plain.container).not.toHaveTextContent(ACCOUNT_DELETED_MESSAGE)
  })
})
