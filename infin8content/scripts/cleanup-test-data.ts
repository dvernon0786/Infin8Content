#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupTestData() {
  console.log('🧹 Starting database cleanup for testing...')
  
  try {
    // Delete in order of dependencies to avoid foreign key constraints
    
    // 1. Delete article progress tracking
    console.log('📊 Deleting article progress records...')
    const { error: progressError } = await supabase
      .from('article_progress')
      .delete()
      .gte('created_at', '2000-01-01') // Delete all records
    
    if (progressError) {
      console.warn('⚠️  Error deleting article progress:', progressError.message)
    } else {
      console.log('✅ Article progress records deleted')
    }

    // 2. Delete articles (if table exists)
    console.log('📄 Deleting articles...')
    const { error: articlesError } = await supabase
      .from('articles')
      .delete()
      .gte('created_at', '2000-01-01') // Delete all records
    
    if (articlesError) {
      console.warn('⚠️  Error deleting articles:', articlesError.message)
    } else {
      console.log('✅ Articles deleted')
    }

    // 3. Delete organizations (if table exists)
    console.log('🏢 Deleting organizations...')
    const { error: orgsError } = await supabase
      .from('organizations')
      .delete()
      .gte('created_at', '2000-01-01') // Delete all records
    
    if (orgsError) {
      console.warn('⚠️  Error deleting organizations:', orgsError.message)
    } else {
      console.log('✅ Organizations deleted')
    }

    // 4. Delete auth users (requires admin API)
    console.log('🔐 Deleting auth users...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.warn('⚠️  Error listing users:', listError.message)
    } else {
      console.log(`📋 Found ${users.users.length} users to delete`)
      
      for (const user of users.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteError) {
          console.warn(`⚠️  Error deleting user ${user.email}:`, deleteError.message)
        } else {
          console.log(`✅ Deleted user: ${user.email}`)
        }
      }
    }

    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('📧 You can now reuse the same email for testing')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run cleanup
cleanupTestData()
