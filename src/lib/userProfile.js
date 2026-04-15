import { supabase } from "./supabaseClient";
import { USER_ROLES, normalizeRole } from "./rbac";

/** Thrown when `profiles.active` is 0 — user must not use the app (soft-removed from team). */
export const ERR_PROFILE_INACTIVE = "ERR_PROFILE_INACTIVE";

export function isProfileInactiveError(e) {
  return e?.message === ERR_PROFILE_INACTIVE;
}

export async function ensureUserProfile(user) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, created_at, active")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingProfile) {
    if (Number(existingProfile.active ?? 1) === 0) {
      throw new Error(ERR_PROFILE_INACTIVE);
    }
    return { ...existingProfile, role: normalizeRole(existingProfile.role) };
  }

  const fallbackName = user.email?.split("@")[0] || "User";
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  const fullName = metadataName || fallbackName;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: USER_ROLES.VIEWER,
      active: 1
    })
    .select("id, email, full_name, role, avatar_url, created_at, active")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted;
}
