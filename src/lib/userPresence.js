import { supabase } from "./supabaseClient";

const HEARTBEAT_MS = 60_000;

/** If `last_seen_at` is newer than this, treat the user as on the platform (admin Team view). */
export const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

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
    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", userId);
    if (error && import.meta.env.DEV) {
      console.debug("[presence] last_seen_at update:", error.message);
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
