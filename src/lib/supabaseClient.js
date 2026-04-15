import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const missingSupabaseMessage =
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env next to package.json, then restart the dev server.";

/**
 * OAuth and password-reset redirects. In production, set VITE_APP_URL to your
 * canonical site (e.g. https://your-app.vercel.app) so links never use localhost.
 */
export function getAuthSiteUrl() {
  const fromEnv = import.meta.env.VITE_APP_URL?.trim?.();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

let client = null;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
