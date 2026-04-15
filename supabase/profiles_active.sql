-- Soft-remove team members: `active = 0` hides them from Team; row stays in DB.
-- Run in Supabase SQL Editor after you have `public.profiles`.

alter table public.profiles
  add column if not exists active smallint not null default 1;

alter table public.profiles
  drop constraint if exists profiles_active_check;

alter table public.profiles
  add constraint profiles_active_check check (active in (0, 1));

comment on column public.profiles.active is '1 = visible on Team and team metrics; 0 = removed from team (soft delete).';

-- Let users update their own profile; let workspace admins update any profile (e.g. deactivate).
drop policy if exists "profiles_update_team_manage" on public.profiles;

create policy "profiles_update_team_manage"
  on public.profiles
  for update
  to authenticated
  using (
    (select auth.uid()) = id
    or exists (
      select 1 from public.profiles me
      where me.id = (select auth.uid())
        and lower(coalesce(me.role::text, '')) in ('admin', 'owner')
    )
  )
  with check (true);

-- Users must always be able to read their own row so the app can check `active` after removal.
drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- New auth users: ensure active = 1 (re-run after this migration if you use the trigger elsewhere).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'user@unknown'), '@', 1)
    ),
    'viewer',
    1
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
