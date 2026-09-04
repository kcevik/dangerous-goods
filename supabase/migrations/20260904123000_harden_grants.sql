-- Grant hardening after the entitlement migration (advisor lints 0026/0028/0029).
--
-- RLS already returns zero rows to anon, but anon still held table-level SELECT,
-- which keeps every table discoverable through GraphQL/REST introspection.
-- Regulation data is now for authenticated + activated users only, so anon loses
-- SELECT outright. `authenticated` keeps SELECT: RLS decides which rows it sees.
--
-- The trigger function is SECURITY DEFINER and therefore must not be callable
-- through /rest/v1/rpc. Same for the pre-existing rls_auto_enable() helper.

revoke select on table public.adr_entries        from anon;
revoke select on table public.rid_entries        from anon;
revoke select on table public.icao_entries       from anon;
revoke select on table public.imdg_entries       from anon;
revoke select on table public.un_entries         from anon;
revoke select on table public.special_provisions from anon;
revoke select on table public.segregation_matrix from anon;
revoke select on table public.segregation_codes  from anon;
revoke select on table public.profiles           from anon;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
