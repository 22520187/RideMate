// Centralized env access (Expo: only EXPO_PUBLIC_* are available at runtime).
// Docs: https://docs.expo.dev/guides/environment-variables/

function required(name, value) {
  if (value == null || value === "") {
    console.warn(`❌ Missing env var: ${name}`);
  }
  return value;
}

export const ENV = {
  API_BASE_URL: required("EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL),
  STREAM_API_KEY: required("EXPO_PUBLIC_STREAM_API_KEY", process.env.EXPO_PUBLIC_STREAM_API_KEY),
  SUPABASE_URL: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  GEMINI_API_KEY: required("EXPO_PUBLIC_GEMINI_API_KEY", process.env.EXPO_PUBLIC_GEMINI_API_KEY),
  GOOGLE_VISION_API_KEY: required(
    "EXPO_PUBLIC_GOOGLE_VISION_API_KEY",
    process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY
  ),
};


