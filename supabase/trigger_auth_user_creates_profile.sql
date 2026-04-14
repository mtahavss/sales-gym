-- Team page lists `public.profiles`. Having an email in Authentication is not enough:
-- a row must exist in `profiles`. This trigger creates it when a user is added to auth.users
-- (invite accepted, sign-up, etc.), so they can appear on Team before first app login.
--
-- Run in Supabase SQL Editor. Then run the backfill block if older users are missing profiles.

-- 1) Trigger: new auth user → insert profile
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

-- 2) One-time backfill: auth users without a profile row yet
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
