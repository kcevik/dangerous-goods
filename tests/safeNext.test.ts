import { describe, expect, it } from 'vitest'
import { safeNext } from '$lib/auth/safeNext'

describe('safeNext', () => {
  it('keeps a same-origin absolute path', () => {
    expect(safeNext('/suche')).toBe('/suche')
    expect(safeNext('/suche?q=1')).toBe('/suche?q=1')
  })

  it('falls back to /dashboard for protocol-relative and absolute URLs', () => {
    expect(safeNext('//evil.com')).toBe('/dashboard')
    expect(safeNext('https://evil.com')).toBe('/dashboard')
    expect(safeNext('/\\evil.com')).toBe('/dashboard')
  })

  it('falls back for empty, relative, null or undefined values', () => {
    expect(safeNext('')).toBe('/dashboard')
    expect(safeNext('suche')).toBe('/dashboard')
    expect(safeNext(null)).toBe('/dashboard')
    expect(safeNext(undefined)).toBe('/dashboard')
  })

  // Browsers strip tab/CR/LF from URLs, so "/\t/evil.example" becomes "//evil.example"
  // after our check — a real open redirect (code review 2026-09-29).
  it.each([
    '/\t/evil.example/',
    '/\n/evil.example/',
    '/\r/evil.example/',
    '\t//evil.example',
    '/%09/evil.example/',
    '/%5Cevil.example',
    '/\\evil.example',
    '/\u0000/evil.example',
    '/./\t/evil.example',
  ])('falls back for %j, which a browser could resolve off-site', (value) => {
    expect(safeNext(value)).toBe('/dashboard')
  })

  it('keeps query and hash on a same-origin target', () => {
    expect(safeNext('/regelwerk/adr?sv=243#h-3-3-1')).toBe('/regelwerk/adr?sv=243#h-3-3-1')
  })

  it('accepts a custom fallback', () => {
    expect(safeNext(null, '/passwort-neu')).toBe('/passwort-neu')
  })
})
