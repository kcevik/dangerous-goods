// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { match } from '../src/params/bookMode'

describe('bookMode route matcher', () => {
  it('accepts only the books that exist', () => {
    expect(match('adr')).toBe(true)
    for (const other of ['rid', 'imdg', 'icao', 'adn', 'ADR', '', 'adr2025']) expect(match(other)).toBe(false)
  })
})
