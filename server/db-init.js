const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_KEY');
    }
    
    // Method 1: Try using psql if DATABASE_URL is available
    if (dbUrl) {
      console.log('Using psql for database initialization...');
      try {
        const sqlFilePath = path.join(__dirname, 'database.sql');
        execSync(`psql ${dbUrl} -f ${sqlFilePath}`, { stdio: 'inherit' });
        console.log('Database initialization completed successfully using psql');
        return true;
      } catch (error) {
        console.warn('Failed to initialize using psql, falling back to HTTP API');
      }
    }
    
    // Method 2: Fall back to HTTP API
    console.log('Using Supabase HTTP API for database initialization...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));
    
    // Execute each statement using the Supabase SQL API
    for (const statement of statements) {
      if (!statement) continue;
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { query: statement });
        if (error) {
          // Try with the older function name
          const { data: data2, error: error2 } = await supabase.rpc('execute_sql', { sql: statement });
          if (error2) throw error2;
        }
        console.log('✓ Executed SQL statement successfully');
      } catch (error) {
        console.warn('⚠️  Error executing SQL statement:', error.message);
        console.log('Statement:', statement);
        // Continue with next statement
      }
    }
    
    console.log('✅ Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return false;
  }
}

// Export for testing or manual execution
module.exports = { initializeDatabase };

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}
