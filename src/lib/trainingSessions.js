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
    .select("id, closer_name, goal, scenario, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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
    .select("id, closer_name, goal, scenario, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
