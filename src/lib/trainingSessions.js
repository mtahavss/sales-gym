import { supabase } from "./supabaseClient";

/** Logged when training session list may have changed (overview refetch). */
export const TRAINING_SESSIONS_CHANGED_EVENT = "salesgym:training-sessions-changed";

/** Prefix on `training_sessions.scenario` for rows created when an AI roleplay call completes. */
export const AI_ROLEPLAY_SESSION_SCENARIO_PREFIX = "[ai_roleplay]";

export function isAiRoleplayTrainingSession(session) {
  const s = session?.scenario;
  return typeof s === "string" && s.startsWith(AI_ROLEPLAY_SESSION_SCENARIO_PREFIX);
}

export async function listTrainingSessions(userId) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, user_id, closer_name, goal, scenario, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

const IN_CHUNK = 100;

/**
 * Training rows for many users (e.g. team overview). Requires RLS to allow select for those rows.
 * @param {string[]} userIds
 */
export async function fetchTrainingSessionsForUserIds(userIds) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) {
    return [];
  }

  const all = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const chunk = ids.slice(i, i + IN_CHUNK);
    const { data, error } = await supabase
      .from("training_sessions")
      .select("id, user_id, closer_name, goal, scenario, created_at")
      .in("user_id", chunk)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    if (data?.length) {
      all.push(...data);
    }
  }

  return all;
}

/** All profiles’ sessions — same workspace (single-tenant) team view. */
export async function fetchAllTeamTrainingSessions() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id")
    .eq("active", 1);
  if (pe) {
    throw new Error(pe.message);
  }
  const ids = (profiles ?? []).map((p) => p.id);
  return fetchTrainingSessionsForUserIds(ids);
}

/**
 * @param {Array<{ user_id?: string, created_at?: string }>} sessions
 * @returns {Record<string, { totalCalls: number, lastCallAt: string | null }>}
 */
export function aggregateCallStatsByUserId(sessions) {
  /** @type {Record<string, { totalCalls: number, lastCallAt: string | null }>} */
  const map = {};
  for (const s of sessions || []) {
    const uid = s.user_id;
    if (!uid) continue;
    if (!map[uid]) {
      map[uid] = { totalCalls: 0, lastCallAt: null };
    }
    map[uid].totalCalls += 1;
    const t = s.created_at;
    if (t && (!map[uid].lastCallAt || t > map[uid].lastCallAt)) {
      map[uid].lastCallAt = t;
    }
  }
  return map;
}

export async function createTrainingSession({ userId, closerName, goal, scenario }) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      user_id: userId,
      closer_name: closerName,
      goal,
      scenario
    })
    .select("id, user_id, closer_name, goal, scenario, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
