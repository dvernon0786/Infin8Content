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

async function comprehensiveCleanup() {
  console.log('🧹 Starting COMPREHENSIVE database cleanup for testing...')
  
  try {
    // List of all tables to clean (in dependency order)
    const tables = [
      'stripe_webhook_events',
      'article_progress', 
      'article_sections',
      'articles',
      'team_members',
      'user_subscriptions',
      'usage_logs',
      'usage_credits',
      'billing_invoices',
      'payment_sessions',
      'user_profiles',
      'organizations'
    ]

    // Delete data from each table
    for (const tableName of tables) {
      try {
        console.log(`📊 Deleting ${tableName}...`)
        const { error } = await supabase
          .from(tableName as any)
          .delete()
          .gte('created_at', '2000-01-01') // Delete all records
        
        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('relation')) {
            console.log(`⚠️  Table ${tableName} does not exist - skipping`)
          } else {
            console.warn(`⚠️  Error deleting ${tableName}:`, error.message)
          }
        } else {
          console.log(`✅ ${tableName} deleted`)
        }
      } catch (err) {
        console.warn(`⚠️  Error with table ${tableName}:`, err)
      }
    }

    // Delete auth users
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

    // Verification
    console.log('\n🔍 Verifying cleanup results...')
    
    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`📊 ${tableName}: Table does not exist`)
          } else {
            console.warn(`⚠️  Error checking ${tableName}:`, error.message)
          }
        } else {
          console.log(`📊 ${tableName}: ${count} records remaining`)
        }
      } catch (err) {
        console.warn(`⚠️  Error checking table ${tableName}:`, err)
      }
    }

    // Check auth users
    const { data: remainingUsers, error: remainingError } = await supabase.auth.admin.listUsers()
    
    if (remainingError) {
      console.warn('⚠️  Error checking remaining users:', remainingError.message)
    } else {
      console.log(`👤 Auth Users: ${remainingUsers.users.length} records remaining`)
    }

    console.log('\n🎉 COMPREHENSIVE database cleanup completed successfully!')
    console.log('📧 You can now reuse the same email for testing')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run comprehensive cleanup
comprehensiveCleanup()
