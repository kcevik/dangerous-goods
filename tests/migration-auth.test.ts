// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Static guard for the auth/entitlement migration. It cannot run SQL, but it
 * prevents a later edit from silently dropping one table's policy swap or
 * weakening the security-definer trigger.
 */
const SQL = readFileSync(
  fileURLToPath(new URL('../supabase/migrations/20260904120000_auth_and_entitlement.sql', import.meta.url)),
  'utf-8',
).toLowerCase()

const REGULATION_TABLES = [
  'adr_entries', 'rid_entries', 'icao_entries', 'imdg_entries', 'un_entries',
  'special_provisions', 'segregation_matrix', 'segregation_codes',
]

describe('auth and entitlement migration', () => {
  it('creates profiles with a nullable activated_at and RLS', () => {
    expect(SQL).toMatch(/create table profiles \(/)
    expect(SQL).toMatch(/activated_at\s+timestamptz/)
    expect(SQL).toMatch(/alter table profiles enable row level security/)
    expect(SQL).toMatch(/create policy "own profile" on profiles for select to authenticated/)
  })

  it('creates the signup trigger with a pinned search_path', () => {
    expect(SQL).toMatch(/function public\.handle_new_user\(\)/)
    expect(SQL).toMatch(/security definer/)
    expect(SQL).toMatch(/set search_path = ''/)
    expect(SQL).toMatch(/after insert on auth\.users/)
  })

  it('defines is_activated() as a security-invoker helper', () => {
    expect(SQL).toMatch(/function public\.is_activated\(\)/)
    expect(SQL).toMatch(/security invoker/)
    expect(SQL).toMatch(/activated_at is not null/)
  })

  for (const table of REGULATION_TABLES) {
    it(`swaps ${table} from public read to activated read`, () => {
      expect(SQL).toContain(`drop policy "public read" on ${table}`)
      expect(SQL).toMatch(new RegExp(`create policy "activated read" on ${table} for select to authenticated using \\(\\(select public\\.is_activated\\(\\)\\)\\)`))
    })
  }

  it('drops the unused view and the retired waitlist table', () => {
    expect(SQL).toContain('drop view if exists un_comparison')
    expect(SQL).toContain('drop table if exists waitlist')
  })

  it('warns about exporting waitlist rows first', () => {
    expect(SQL).toContain('export waitlist rows before applying')
  })
})
