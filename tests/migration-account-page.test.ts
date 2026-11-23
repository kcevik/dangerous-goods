// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Static guard for the account page migration: the billing address is readable and writable
 * by its owner only, and the self-deletion RPC can only ever delete the caller.
 */
const SQL = readFileSync(
  fileURLToPath(new URL('../supabase/migrations/20261123120000_account_page.sql', import.meta.url)),
  'utf-8',
).toLowerCase()

const policies = [...SQL.matchAll(/create policy [^;]*;/g)].map(m => m[0])

describe('account page migration — billing_addresses', () => {
  it('creates one row per user, removed with the auth user', () => {
    expect(SQL).toMatch(/create table public\.billing_addresses/)
    expect(SQL).toMatch(/user_id\s+uuid primary key references auth\.users \(id\) on delete cascade/)
    for (const col of ['company', 'first_name', 'last_name', 'street', 'postal_code', 'city', 'country', 'vat_id', 'updated_at']) {
      expect(SQL, col).toMatch(new RegExp(`\\n\\s+${col}\\s`))
    }
    expect(SQL).toMatch(/country\s+text not null default 'de'/)
  })

  it('backs the app validation with check constraints', () => {
    expect(SQL).toMatch(/check \(vat_id is null or company is not null\)/)
    expect(SQL).toMatch(/check \(country ~ '\^\[a-z\]\{2\}\$'\)/)
  })

  it('enables RLS', () => {
    expect(SQL).toMatch(/alter table public\.billing_addresses enable row level security/)
  })

  it('has exactly select, insert and update policies, all own-row and authenticated only', () => {
    expect(policies).toHaveLength(3)
    expect(policies.map(p => p.match(/ for (\w+) /)![1]).sort()).toEqual(['insert', 'select', 'update'])
    for (const p of policies) {
      expect(p).toMatch(/on public\.billing_addresses/)
      expect(p).toMatch(/to authenticated/)
      expect(p).not.toMatch(/\banon\b/)
      expect(p).toMatch(/\(select auth\.uid\(\)\) = user_id/)
    }
    const update = policies.find(p => p.includes(' for update '))!
    expect(update).toMatch(/using \(/)
    expect(update).toMatch(/with check \(/)
    expect(policies.find(p => p.includes(' for insert '))).toMatch(/with check \(/)
  })

  it('revokes everything from the API roles and grants authenticated select/insert/update only', () => {
    expect(SQL).toMatch(/revoke all on table public\.billing_addresses from public, anon, authenticated/)
    expect(SQL).toMatch(/grant select, insert, update on table public\.billing_addresses to authenticated;/)
    expect(SQL).not.toMatch(/grant [^;]* on table public\.billing_addresses to [^;]*anon/)
    expect(SQL).not.toMatch(/grant [^;]*delete[^;]* on table public\.billing_addresses/)
  })

  it('keeps the updated_at trigger function off the RPC surface', () => {
    expect(SQL).toMatch(/create function public\.billing_addresses_touch\(\)/)
    expect(SQL).toMatch(/revoke execute on function public\.billing_addresses_touch\(\) from public, anon, authenticated/)
  })
})

describe('account page migration — delete_own_account()', () => {
  const fn = SQL.match(/create function public\.delete_own_account\(\)[\s\S]*?\$\$;/)?.[0] ?? ''

  it('is a security-definer function with an empty search_path that returns nothing', () => {
    expect(fn).not.toBe('')
    expect(fn).toMatch(/returns void/)
    expect(fn).toMatch(/security definer/)
    expect(fn).toMatch(/set search_path = ''/)
  })

  it('deletes only the caller, and refuses without a caller', () => {
    expect(fn).toMatch(/auth\.uid\(\)/)
    expect(fn).toMatch(/if v_uid is null then\s+raise exception/)
    expect(fn).toMatch(/delete from auth\.users where id = v_uid;/)
    expect(fn.match(/delete from/g)).toHaveLength(1)
  })

  it('is executable by authenticated users only', () => {
    expect(SQL).toMatch(/revoke all on function public\.delete_own_account\(\) from public, anon/)
    expect(SQL).toMatch(/grant execute on function public\.delete_own_account\(\) to authenticated;/)
  })
})
