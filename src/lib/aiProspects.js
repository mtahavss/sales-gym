import { supabase } from "./supabaseClient";

export async function listAiProspects(userId) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("ai_prospects")
    .select("id, user_id, prospect_type, form_data, session_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createAiProspect({ userId, formData }) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const prospectType = formData.prospectType === "b2c" ? "b2c" : "b2b";

  const { data, error } = await supabase
    .from("ai_prospects")
    .insert({
      user_id: userId,
      prospect_type: prospectType,
      form_data: formData,
    })
    .select("id, user_id, prospect_type, form_data, session_count, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateAiProspect({ id, userId, formData }) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const prospectType = formData.prospectType === "b2c" ? "b2c" : "b2b";

  const { data, error } = await supabase
    .from("ai_prospects")
    .update({
      prospect_type: prospectType,
      form_data: formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, user_id, prospect_type, form_data, session_count, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAiProspect({ id, userId }) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("ai_prospects").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

/** Bump `session_count` for a prospect after a completed training session (RLS: own row only). */
export async function incrementAiProspectSessionCount({ id, userId }) {
  if (!supabase || !id || !userId) {
    return;
  }

  const { data: row, error: fetchError } = await supabase
    .from("ai_prospects")
    .select("session_count")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }
  if (!row) {
    return;
  }

  const next = (typeof row.session_count === "number" ? row.session_count : 0) + 1;

  const { error: updateError } = await supabase
    .from("ai_prospects")
    .update({
      session_count: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
