-- Ensure heartbeat can update `last_seen_at` on your own row (Team Session column).
-- Run in Supabase SQL Editor if presence pings fail (check browser console in dev).

drop policy if exists "profiles_update_own_presence" on public.profiles;

create policy "profiles_update_own_presence"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
