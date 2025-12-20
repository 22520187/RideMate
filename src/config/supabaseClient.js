import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

// Fallbacks: Expo env system (EXPO_PUBLIC_*) and process.env in dev.
const supabaseUrl =
  SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY;

// IMPORTANT: Do not crash the app if env is missing.
// If credentials are missing, export supabase = null and let callers handle it gracefully.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase env missing at runtime:", {
    SUPABASE_URL: SUPABASE_URL ? "✅" : "❌",
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "✅" : "❌",
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ? "✅" : "❌",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? "✅"
      : "❌",
  });
} else {
  console.log("✅ Supabase client initialized");
}

export default supabase;
