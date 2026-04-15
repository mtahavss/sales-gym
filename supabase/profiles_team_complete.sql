-- Fix: Team page only shows yourself (or too few people)
-- -----------------------------------------------------------------
-- Prerequisite for soft-remove (active column): run profiles_active.sql first.
-- The app reads public.profiles — not Logto/Auth0/etc. User lists.
-- Compare counts in Supabase Dashboard:
--   Authentication → Users   vs   Table Editor → profiles
--
-- Run this entire script in Supabase → SQL Editor (once), then refresh Team.

-- 1) Create missing profile rows for every Supabase Auth user
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(coalesce(u.email, 'user@unknown'), '@', 1)
  ),
  'viewer'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 2) Let signed-in users read all profiles (team directory).
--    If you already have a restrictive SELECT policy, add this policy OR replace the old one.
--    Drop first if you re-run this script:
drop policy if exists "profiles_select_team" on public.profiles;

create policy "profiles_select_team"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Optional: keep trigger so new sign-ups get a profile automatically (safe to re-run).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'user@unknown'), '@', 1)
    ),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
