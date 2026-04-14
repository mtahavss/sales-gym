-- If the Team page only lists the signed-in user, RLS on `profiles` may be blocking reads of other rows.
-- Review existing policies first (Dashboard → Authentication → Policies, or SQL).
-- Example: allow any signed-in user to read all profiles (adjust to your security model).

-- drop policy if exists "profiles_select_team" on public.profiles;
-- create policy "profiles_select_team"
--   on public.profiles for select
--   to authenticated
--   using (true);
