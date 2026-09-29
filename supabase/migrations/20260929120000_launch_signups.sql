-- Launch-notification list (pre-launch mode, spec 2026-09-29 §2).
--
-- Nothing here is readable through the API: RLS is on with NO policies and every
-- table privilege is revoked. The only way in is join_launch_list(), a
-- security-definer function that can insert but never read, so a caller cannot
-- even learn whether an address is already listed.
--
-- Honest limit: the function must be callable with the publishable key (the app
-- uses that key too), so it can be called directly, past the app's rate limit.
-- Worst case is junk rows; the later double opt-in filters them out.

create table public.launch_signups (
  id              bigint generated always as identity primary key,
  email           text not null unique
                  check (email = lower(btrim(email)) and length(email) between 6 and 254),
  consent_version text not null check (length(consent_version) between 1 and 40),
  consented_at    timestamptz not null default now(),
  confirmed_at    timestamptz,          -- set by the later double opt-in
  created_at      timestamptz not null default now()
);

alter table public.launch_signups enable row level security;
revoke all on table public.launch_signups from anon, authenticated;

create function public.join_launch_list(p_email text, p_consent_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_email is null or length(p_email) > 254
     or lower(btrim(p_email)) !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if p_consent_version is null or length(p_consent_version) not between 1 and 40 then
    raise exception 'invalid consent version' using errcode = '22023';
  end if;

  insert into public.launch_signups (email, consent_version)
  values (lower(btrim(p_email)), p_consent_version)
  on conflict (email) do nothing;
end;
$$;

revoke all on function public.join_launch_list(text, text) from public;
grant execute on function public.join_launch_list(text, text) to anon, authenticated;
