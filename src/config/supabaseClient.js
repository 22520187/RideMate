import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

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
    EXPO_PUBLIC_SUPABASE_URL: supabaseUrl ? "✅" : "❌",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "✅" : "❌",
  });
} else {
  console.log("✅ Supabase client initialized");
}

export default supabase;
