-- Reliable Team "Session" / presence: updates `profiles.last_seen_at` for the signed-in user.
-- Run in Supabase SQL Editor. Requires `last_seen_at` on `profiles` (profiles_last_seen.sql).
--
-- Direct UPDATE from the browser can fail under RLS; this RPC runs as the table owner and bypasses RLS.

create or replace function public.touch_my_presence()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  update public.profiles
  set last_seen_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

revoke all on function public.touch_my_presence() from public;
grant execute on function public.touch_my_presence() to authenticated;
