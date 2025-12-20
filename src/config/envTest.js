// Test file to check if .env is loading correctly
import { 
  API_BASE_URL, 
  STREAM_API_KEY, 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  GEMINI_API_KEY,
  GOOGLE_VISION_API_KEY 
} from '@env';

console.log('========================================');
console.log('🧪 ENV TEST - Checking all variables:');
console.log('========================================');
console.log('API_BASE_URL:', API_BASE_URL || '❌ MISSING');
console.log('STREAM_API_KEY:', STREAM_API_KEY || '❌ MISSING');
console.log('SUPABASE_URL:', SUPABASE_URL || '❌ MISSING');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('GOOGLE_VISION_API_KEY:', GOOGLE_VISION_API_KEY ? '✅ EXISTS' : '❌ MISSING');
console.log('========================================');

export default {
  API_BASE_URL,
  STREAM_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GEMINI_API_KEY,
  GOOGLE_VISION_API_KEY,
};
