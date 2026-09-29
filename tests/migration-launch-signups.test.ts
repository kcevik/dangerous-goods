// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Static guard for the launch list: nothing may be readable through the API, and
 * the only way in is the insert-only security-definer function.
 */
const SQL = readFileSync(
  fileURLToPath(new URL('../supabase/migrations/20260929120000_launch_signups.sql', import.meta.url)),
  'utf-8',
).toLowerCase()

describe('launch_signups migration', () => {
  it('creates the table with a normalised, unique email', () => {
    expect(SQL).toMatch(/create table public\.launch_signups/)
    expect(SQL).toMatch(/email\s+text not null unique/)
    expect(SQL).toMatch(/check \(email = lower\(btrim\(email\)\)/)
    expect(SQL).toMatch(/consent_version\s+text not null/)
    expect(SQL).toMatch(/confirmed_at\s+timestamptz/)
  })

  it('enables RLS and defines no policy at all', () => {
    expect(SQL).toMatch(/alter table public\.launch_signups enable row level security/)
    expect(SQL).not.toMatch(/create policy/)
  })

  it('revokes every table privilege from the API roles', () => {
    expect(SQL).toMatch(/revoke all on table public\.launch_signups from anon, authenticated/)
    expect(SQL).not.toMatch(/grant [^;]* on table public\.launch_signups/)
  })

  it('writes only through a security-definer function with an empty search_path', () => {
    expect(SQL).toMatch(/create function public\.join_launch_list\(p_email text, p_consent_version text\)/)
    expect(SQL).toMatch(/security definer/)
    expect(SQL).toMatch(/set search_path = ''/)
    expect(SQL).toMatch(/on conflict \(email\) do nothing/)
  })

  it('lets the API roles execute the function and nobody else by default', () => {
    expect(SQL).toMatch(/revoke all on function public\.join_launch_list\(text, text\) from public/)
    expect(SQL).toMatch(/grant execute on function public\.join_launch_list\(text, text\) to anon, authenticated/)
  })

  it('never returns data from the function', () => {
    expect(SQL).toMatch(/returns void/)
  })
})
