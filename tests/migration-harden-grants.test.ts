// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Static guard for the grant-hardening migration that followed the entitlement
 * migration: anon must lose table-level SELECT on every regulation table and on
 * profiles (RLS already returns nothing, but the tables stayed discoverable), and
 * the security-definer trigger function must not be callable through the API.
 */
const SQL = readFileSync(
  fileURLToPath(new URL('../supabase/migrations/20260904123000_harden_grants.sql', import.meta.url)),
  'utf-8',
).toLowerCase()

const TABLES = [
  'adr_entries', 'rid_entries', 'icao_entries', 'imdg_entries', 'un_entries',
  'special_provisions', 'segregation_matrix', 'segregation_codes', 'profiles',
]

describe('harden grants migration', () => {
  for (const table of TABLES) {
    it(`revokes anon select on ${table}`, () => {
      expect(SQL).toMatch(new RegExp(`revoke (all|select)[^;]*on (table )?(public\\.)?${table}[^;]*from[^;]*anon`))
    })
  }

  it('keeps authenticated able to select (RLS filters rows)', () => {
    expect(SQL).not.toMatch(/revoke[^;]*on[^;]*adr_entries[^;]*from[^;]*authenticated/)
  })

  it('makes the trigger function and rls_auto_enable non-callable via the API', () => {
    expect(SQL).toMatch(/revoke execute on function public\.handle_new_user\(\) from public, anon, authenticated/)
    expect(SQL).toMatch(/revoke execute on function public\.rls_auto_enable\(\) from public, anon, authenticated/)
  })
})
