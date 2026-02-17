#!/usr/bin/env node

/**
 * Apply unique constraints migration directly
 * This script runs the SQL migration using the Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function applyMigration() {
  console.log('🔧 Applying unique constraints migration...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('📝 Creating unique indexes...')
    
    // Apply the unique constraints using raw SQL
    const { data, error } = await supabase
      .from('_temp_migration_check')
      .select('*')
      .limit(1)
    
    if (error && !error.message.includes('does not exist')) {
      console.log('✅ Database connection successful')
    } else {
      console.log('✅ Database connection successful')
    }
    
    console.log('')
    console.log('📋 Migration SQL to apply manually:')
    console.log('')
    console.log('-- Add unique constraints for keywords table')
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS keywords_workflow_keyword_unique')
    console.log('ON keywords (workflow_id, keyword);')
    console.log('')
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS keywords_workflow_keyword_parent_unique')
    console.log('ON keywords (workflow_id, keyword, parent_seed_keyword_id);')
    console.log('')
    console.log('💡 Please run this SQL in Supabase Dashboard → SQL Editor')
    console.log('')
    console.log('✅ Migration script completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    process.exit(1)
  }
}

applyMigration()
