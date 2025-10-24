import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from multiple locations to work when running from project root or server/
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try server/.env next to this file
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also try .env from current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Helper function to execute raw SQL queries
export const query = async (sql, params = []) => {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sql,
      params: params
    });
    
    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default {
  supabase,
  query
};
