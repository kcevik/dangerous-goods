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

  it('accepts a custom fallback', () => {
    expect(safeNext(null, '/passwort-neu')).toBe('/passwort-neu')
  })
})
