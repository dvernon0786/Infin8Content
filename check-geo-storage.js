const { createClient } = require('@supabase/supabase-js')

// Use environment variables or fallback to localhost
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGeoStorage() {
  try {
    console.log('🔍 Checking geo storage in organizations table...')
    
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, keyword_settings, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    console.log(`📊 Found ${data.length} organizations:`)
    
    data.forEach((org, index) => {
      console.log(`\n${index + 1}. Organization: ${org.name}`)
      console.log(`   ID: ${org.id}`)
      console.log(`   Created: ${org.created_at}`)
      console.log(`   Updated: ${org.updated_at}`)
      
      if (org.keyword_settings) {
        console.log(`   📍 Geo Settings:`, org.keyword_settings)
        
        // Check if it has the expected fields
        const settings = org.keyword_settings
        console.log(`   🎯 Target Region: "${settings.target_region || 'MISSING'}"`)
        console.log(`   🌐 Language Code: "${settings.language_code || 'MISSING'}"`)
        
        // Validate the values
        if (settings.target_region) {
          console.log(`   ✅ Region exists: ${settings.target_region.length} chars`)
        } else {
          console.log(`   ❌ Region missing`)
        }
        
        if (settings.language_code) {
          console.log(`   ✅ Language exists: ${settings.language_code.length} chars`)
        } else {
          console.log(`   ❌ Language missing`)
        }
      } else {
        console.log(`   ❌ No keyword_settings found`)
      }
    })

    console.log('\n🏁 Check complete!')

  } catch (err) {
    console.error('❌ Error checking geo storage:', err)
  }
}

checkGeoStorage()
