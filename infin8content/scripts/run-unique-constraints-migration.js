#!/usr/bin/env node

/**
 * Run unique constraints migration for keywords table
 * This script adds the required constraints for Inngest worker idempotency
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const migrationSQL = `
-- Add unique constraints for keywords table to ensure idempotency
-- Critical for Inngest worker retries to prevent duplicate data

-- Primary unique constraint for workflow + keyword combination
CREATE UNIQUE INDEX IF NOT EXISTS keywords_workflow_keyword_unique 
ON keywords (workflow_id, keyword);

-- Extended unique constraint for parent-child relationships
-- Prevents duplicate longtail keywords under same seed
CREATE UNIQUE INDEX IF NOT EXISTS keywords_workflow_keyword_parent_unique 
ON keywords (workflow_id, keyword, parent_seed_keyword_id);

-- Add comment explaining purpose
COMMENT ON INDEX keywords_workflow_keyword_unique IS 'Prevents duplicate keywords within same workflow during Inngest worker retries';
COMMENT ON INDEX keywords_workflow_keyword_parent_unique IS 'Prevents duplicate longtail keywords under same seed keyword during retries';
`

async function runMigration() {
  console.log('🔧 Running unique constraints migration...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('📝 Executing SQL migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('Added constraints:')
    console.log('- keywords_workflow_keyword_unique')
    console.log('- keywords_workflow_keyword_parent_unique')
    console.log('')
    console.log('Inngest workers are now idempotent-safe!')
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    
    // Fallback: try direct SQL via REST if RPC not available
    console.log('🔄 Trying direct SQL execution...')
    try {
      const { error: directError } = await supabase
        .from('_temp_migration')
        .select('*')
        .limit(1)
      
      if (directError && !directError.message.includes('does not exist')) {
        console.log('💡 Alternative: Run migration manually in Supabase Dashboard:')
        console.log('1. Go to your Supabase project dashboard')
        console.log('2. Click "SQL Editor" in sidebar')
        console.log('3. Copy and paste the SQL from:')
        console.log('   supabase/migrations/20260217225126_add_keywords_unique_constraints.sql')
        console.log('4. Click "Run"')
      }
    } catch (fallbackError) {
      console.log('💡 Please run migration manually in Supabase Dashboard')
    }
    
    process.exit(1)
  }
}

runMigration()
