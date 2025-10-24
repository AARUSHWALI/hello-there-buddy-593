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
// Load env from multiple locations to work when running from project root or server/
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Try server/.env next to this file
dotenv.config({ path: path.resolve(__dirname, '../.env') })
// Also try .env from current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

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
