-- Presence for Team page (admin sees who is on the platform).
-- Run in Supabase SQL Editor. Ensure authenticated users can UPDATE their own profile row (RLS).

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

comment on column public.profiles.last_seen_at is 'Heartbeat while the user has the app open; used for admin Team session visibility.';
