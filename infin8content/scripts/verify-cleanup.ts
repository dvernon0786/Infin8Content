#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Create service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyCleanup() {
  console.log('🔍 Verifying database cleanup...')
  
  try {
    // Check articles
    const { count: articlesCount, error: articlesError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
    
    if (articlesError) {
      console.warn('⚠️  Error checking articles:', articlesError.message)
    } else {
      console.log(`📄 Articles: ${articlesCount} records`)
    }

    // Check organizations
    const { count: orgsCount, error: orgsError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
    
    if (orgsError) {
      console.warn('⚠️  Error checking organizations:', orgsError.message)
    } else {
      console.log(`🏢 Organizations: ${orgsCount} records`)
    }

    // Check article progress
    const { count: progressCount, error: progressError } = await supabase
      .from('article_progress')
      .select('*', { count: 'exact', head: true })
    
    if (progressError) {
      console.warn('⚠️  Error checking article progress:', progressError.message)
    } else {
      console.log(`📊 Article Progress: ${progressCount} records`)
    }

    // Check auth users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.warn('⚠️  Error checking users:', usersError.message)
    } else {
      console.log(`👤 Auth Users: ${users.users.length} records`)
      if (users.users.length > 0) {
        console.log('   Remaining users:')
        users.users.forEach(user => console.log(`   - ${user.email}`))
      }
    }

    console.log('\n✅ Cleanup verification completed!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run verification
verifyCleanup()
