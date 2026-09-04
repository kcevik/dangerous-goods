-- Auth and entitlement gate (spec: docs/superpowers/specs/2026-09-04-auth-and-entitlement-design.md)
--
-- !! Export waitlist rows before applying — this drops the table. !!
--
-- 1. profiles: one row per auth user; activated_at NULL = locked preview.
-- 2. handle_new_user trigger creates the profile on signup.
-- 3. is_activated() helper for RLS.
-- 4. Regulation tables: "public read" -> "activated read" (anon reads nothing).
-- 5. Drop unused SECURITY DEFINER view un_comparison and the retired waitlist table.

-- ── 1. profiles ─────────────────────────────────────────────────────────────

create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  activated_at timestamptz,          -- null = locked preview; the owner sets this to activate
  created_at   timestamptz not null default now()
);

comment on column profiles.activated_at is 'NULL = locked preview. Set to now() to activate a paid account.';

alter table profiles enable row level security;

create policy "own profile" on profiles for select to authenticated
  using ((select auth.uid()) = id);
-- no insert/update/delete policies: rows come from the trigger, activation happens in the dashboard

-- ── 2. signup trigger ───────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3. activation helper ────────────────────────────────────────────────────

create or replace function public.is_activated()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and activated_at is not null
  )
$$;

-- ── 4. regulation data: activated users only ────────────────────────────────

drop policy "public read" on adr_entries;
create policy "activated read" on adr_entries for select to authenticated using ((select public.is_activated()));

drop policy "public read" on rid_entries;
create policy "activated read" on rid_entries for select to authenticated using ((select public.is_activated()));

drop policy "public read" on icao_entries;
create policy "activated read" on icao_entries for select to authenticated using ((select public.is_activated()));

drop policy "public read" on imdg_entries;
create policy "activated read" on imdg_entries for select to authenticated using ((select public.is_activated()));

drop policy "public read" on un_entries;
create policy "activated read" on un_entries for select to authenticated using ((select public.is_activated()));

drop policy "public read" on special_provisions;
create policy "activated read" on special_provisions for select to authenticated using ((select public.is_activated()));

drop policy "public read" on segregation_matrix;
create policy "activated read" on segregation_matrix for select to authenticated using ((select public.is_activated()));

drop policy "public read" on segregation_codes;
create policy "activated read" on segregation_codes for select to authenticated using ((select public.is_activated()));

-- ── 5. cleanup ──────────────────────────────────────────────────────────────

drop view if exists un_comparison;
drop table if exists waitlist;
