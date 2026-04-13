import { supabase } from "./supabaseClient";

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
