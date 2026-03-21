const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function applyStatelessFix() {
  try {
    console.log('🔧 Applying Step 2 stateless database fix...')
    
    // Test database connection
    const { error: testError } = await supabase
      .from('keywords')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      return
    }
    
    console.log('✅ Database connection verified')
    
    // The actual fix needs to be applied manually in Supabase dashboard
    console.log('\n📋 MANUAL STEP REQUIRED:')
    console.log('Go to Supabase Dashboard → SQL Editor → Run this SQL:')
    console.log('\n-- Step 2 Stateless Fix (Clean Architecture)')
    console.log('ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_competitor_url_id_fkey;')
    console.log('ALTER TABLE keywords ALTER COLUMN competitor_url_id DROP NOT NULL;')
    console.log('DROP INDEX IF EXISTS idx_keywords_seed_unique;')
    console.log('-- IMPORTANT: Also drop any other constraints containing competitor_url_id')
    console.log('ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_organization_competitor_seed_keyword_unique;')
    console.log('CREATE UNIQUE INDEX idx_keywords_seed_unique')
    console.log('ON keywords (organization_id, workflow_id, seed_keyword)')
    console.log('WHERE parent_seed_keyword_id IS NULL;')
    
    console.log('\n🔍 CRITICAL VERIFICATION STEP:')
    console.log('After running SQL, verify in Supabase Dashboard:')
    console.log('1. Table: keywords → Constraints tab')
    console.log('2. Ensure NO constraints contain competitor_url_id')
    console.log('3. Expected final uniqueness: (organization_id, workflow_id, seed_keyword)')
    
    console.log('\n🎯 Expected Result After Fix:')
    console.log('- Extraction: ✅ 25 keywords from DataForSEO')
    console.log('- Persistence: ✅ Inserts with competitor_url_id = NULL')
    console.log('- Workflow: ✅ Transitions to COMPETITOR_COMPLETED')
    console.log('- Step 3: ✅ Unlocked for keyword curation')
    
    console.log('\n✅ Code implementation complete!')
    console.log('⚡ Ready for testing once database fix is applied')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

applyStatelessFix()
