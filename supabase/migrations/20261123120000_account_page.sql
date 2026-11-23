-- Account page /konto (spec: docs/superpowers/specs/2026-11-23-account-page-design.md)
--
-- 1. billing_addresses: one postal address per user (private or business customer).
--    RLS: the owner may select, insert and update their own row; nothing else. There is no
--    delete policy — the row goes with the account (on delete cascade).
-- 2. delete_own_account(): lets a signed-in user delete their own auth user without the
--    service-role key. profiles and billing_addresses cascade.

-- ── 1. billing_addresses ────────────────────────────────────────────────────

create table public.billing_addresses (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  company     text check (company is null or length(company) between 1 and 200),
  first_name  text not null check (length(first_name) between 1 and 100),
  last_name   text not null check (length(last_name) between 1 and 100),
  street      text not null check (length(street) between 1 and 200),
  postal_code text not null check (length(postal_code) between 2 and 10),
  city        text not null check (length(city) between 1 and 100),
  country     text not null default 'DE' check (country ~ '^[A-Z]{2}$'),
  vat_id      text check (vat_id is null or vat_id ~ '^[A-Z]{2}[A-Z0-9]{2,13}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint billing_addresses_vat_id_needs_company check (vat_id is null or company is not null)
);

comment on table public.billing_addresses is 'Billing address per user; written by the user on /konto. Deleted with the auth user.';

alter table public.billing_addresses enable row level security;

revoke all on table public.billing_addresses from public, anon, authenticated;
grant select, insert, update on table public.billing_addresses to authenticated;

create policy "own address read" on public.billing_addresses for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "own address insert" on public.billing_addresses for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "own address update" on public.billing_addresses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.billing_addresses_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.billing_addresses_touch() from public, anon, authenticated;

create trigger billing_addresses_touch
  before update on public.billing_addresses
  for each row execute function public.billing_addresses_touch();

-- ── 2. self-service account deletion ────────────────────────────────────────

create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
