// Test file to check if env is loading correctly
import { ENV } from "./env";
// Test file to check if .env is loading correctly
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

console.log("========================================");
console.log("🧪 ENV TEST - Checking all variables:");
console.log("========================================");
console.log("API_BASE_URL:", ENV.API_BASE_URL || "❌ MISSING");
console.log("STREAM_API_KEY:", ENV.STREAM_API_KEY || "❌ MISSING");
console.log("SUPABASE_URL:", ENV.SUPABASE_URL || "❌ MISSING");
console.log(
  "SUPABASE_ANON_KEY:",
  ENV.SUPABASE_ANON_KEY ? "✅ EXISTS" : "❌ MISSING"
);
console.log("GEMINI_API_KEY:", ENV.GEMINI_API_KEY ? "✅ EXISTS" : "❌ MISSING");
console.log(
  "GOOGLE_VISION_API_KEY:",
  ENV.GOOGLE_VISION_API_KEY ? "✅ EXISTS" : "❌ MISSING"
);
console.log("========================================");

export default ENV;
