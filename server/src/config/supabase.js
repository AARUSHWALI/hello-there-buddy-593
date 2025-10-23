// import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';

// dotenv.config();

// // Initialize Supabase client
// export const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_KEY,
//   {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false
//     }
//   }
// );

// export default supabase;
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// ✅ Explicitly load .env file — adjust path if running from project root
dotenv.config({ path: './server/.env' })

// Debug logs to confirm environment variables are loaded
console.log("🔍 Supabase URL:", process.env.SUPABASE_URL || '❌ Not found')
console.log("🔍 Supabase Key loaded:", process.env.SUPABASE_SERVICE_KEY ? '✅ Yes' : '❌ No')

// Throw error if any variable is missing
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables. Check your .env file.")
}

// ✅ Create Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export default supabase
