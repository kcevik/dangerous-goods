import type { RequestEvent } from '@sveltejs/kit'

let ipCounter = 0

/** A distinct client address per call, because the endpoint rate limiters are module-level. */
export function freshIp(): string {
  return `10.2.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`
}

/** A fabricated GET event for the ADR book endpoints and page load. */
export function makeBookEvent(opts: {
  search?: string
  session?: boolean
  isActive?: boolean
  ip?: string
  path?: string
} = {}) {
  const url = new URL(`http://localhost${opts.path ?? '/regelwerk/adr'}${opts.search ?? ''}`)
  const signedIn = opts.session ?? true
  const safeGetSession = async () => signedIn
    ? { session: {}, user: { id: 'u1', email: 'k@example.de' }, isActive: opts.isActive ?? true }
    : { session: null, user: null, isActive: false }
  const ip = opts.ip ?? freshIp()
  return {
    request: new Request(url),
    url,
    params: { mode: 'adr' },
    getClientAddress: () => ip,
    locals: { safeGetSession },
  } as unknown as RequestEvent
}
