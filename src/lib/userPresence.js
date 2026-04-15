import { supabase } from "./supabaseClient";

/** Event name: fired after a successful `last_seen_at` write (Team page can refresh). */
export const PRESENCE_PING_EVENT = "salesgym:presence-ping";

const HEARTBEAT_MS = 30_000;

/**
 * If `last_seen_at` is newer than this, treat the user as online (admin Team view).
 * Must exceed heartbeat interval + typical list refresh delay so active users still show Online.
 */
export const ONLINE_THRESHOLD_MS = 6 * 60 * 1000;

export function isUserOnline(lastSeenAt, nowMs = Date.now()) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t <= ONLINE_THRESHOLD_MS;
}

/** Short label for non-online users with a known last activity time. */
export function formatLastSeenRelative(lastSeenAt, nowMs = Date.now()) {
  if (!lastSeenAt) return "—";
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = nowMs - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Ping `profiles.last_seen_at` on an interval while the dashboard is open.
 * Requires column `last_seen_at` on `profiles` (see supabase/profiles_last_seen.sql).
 */
export function startPresenceHeartbeat(userId) {
  if (!supabase || !userId) {
    return () => {};
  }

  let cancelled = false;

  async function ping() {
    if (cancelled) return;

    let success = false;
    const { error: rpcError } = await supabase.rpc("touch_my_presence");
    if (!rpcError) {
      success = true;
    } else {
      const ts = new Date().toISOString();
      const { data, error } = await supabase
        .from("profiles")
        .update({ last_seen_at: ts })
        .eq("id", userId)
        .select("id");
      if (!error) {
        success = true;
        if (!data?.length && import.meta.env.DEV) {
          console.warn(
            "[presence] 0 rows updated. Run supabase/profiles_touch_presence_rpc.sql in Supabase SQL Editor."
          );
        }
      } else if (import.meta.env.DEV) {
        console.warn("[presence] fallback update failed:", error.message);
      }
      if (!success && import.meta.env.DEV) {
        console.warn("[presence] touch_my_presence RPC failed:", rpcError.message);
      }
    }

    if (success) {
      window.dispatchEvent(new CustomEvent(PRESENCE_PING_EVENT, { detail: { at: Date.now() } }));
    }
  }

  ping();
  const intervalId = setInterval(ping, HEARTBEAT_MS);

  function onVisibility() {
    if (document.visibilityState === "visible") {
      ping();
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
