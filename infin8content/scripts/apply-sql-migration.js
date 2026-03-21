#!/usr/bin/env node

/**
 * Direct SQL Migration Runner
 * Applies the unique constraints migration using PostgreSQL client
 */

const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function applyMigration() {
  console.log('🔧 Applying SQL migration for unique constraints...')
  
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment')
    console.error('Please ensure DATABASE_URL is set in .env.local')
    process.exit(1)
  }
  
  const client = new Client({
    connectionString: databaseUrl
  })
  
  try {
    console.log('📝 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully')
    
    console.log('📋 Applying migration SQL...')
    
    // Read and apply the migration
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
    
    await client.query(migrationSQL)
    
    console.log('✅ Migration applied successfully!')
    
    // Verify the indexes were created
    console.log('🔍 Verifying indexes...')
    
    const result = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename = 'keywords' 
      AND indexname LIKE '%keywords_workflow%'
      ORDER BY indexname
    `)
    
    console.log('📊 Created indexes:')
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.indexname} on ${row.tablename}`)
    })
    
    console.log('')
    console.log('🎉 Database migration completed successfully!')
    console.log('🛡️ Unique constraints are now active for Inngest worker idempotency')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('📝 Database connection closed')
  }
}

applyMigration()
