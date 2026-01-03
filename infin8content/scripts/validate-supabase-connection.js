#!/usr/bin/env node
/**
 * Validate Supabase Connection
 * Checks if Supabase credentials are configured and tests the connection
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Validating Supabase Configuration...\n');

// Check if credentials exist
const checks = {
  url: {
    value: SUPABASE_URL,
    required: true,
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    validate: (val) => {
      if (!val) return { valid: false, message: '❌ MISSING' };
      if (val.includes('127.0.0.1') || val.includes('localhost')) {
        return { valid: true, message: '✅ Local development', type: 'local' };
      }
      if (val.includes('supabase.co')) {
        return { valid: true, message: '✅ Hosted project', type: 'hosted' };
      }
      return { valid: false, message: '⚠️  Unknown format' };
    }
  },
  anonKey: {
    value: SUPABASE_ANON_KEY,
    required: true,
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    validate: (val) => {
      if (!val) return { valid: false, message: '❌ MISSING' };
      if (val.startsWith('eyJ') && val.length > 100) {
        return { valid: true, message: `✅ Valid JWT (${val.length} chars)` };
      }
      if (val.includes('your-') || val.includes('<')) {
        return { valid: false, message: '❌ Placeholder value - replace with actual key' };
      }
      return { valid: false, message: '⚠️  Invalid format (should be JWT token)' };
    }
  },
  serviceKey: {
    value: SUPABASE_SERVICE_KEY,
    required: true,
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    validate: (val) => {
      if (!val) return { valid: false, message: '❌ MISSING' };
      if (val.startsWith('eyJ') && val.length > 100) {
        return { valid: true, message: `✅ Valid JWT (${val.length} chars)` };
      }
      if (val.includes('your-') || val.includes('<')) {
        return { valid: false, message: '❌ Placeholder value - replace with actual key' };
      }
      return { valid: false, message: '⚠️  Invalid format (should be JWT token)' };
    }
  },
  databaseUrl: {
    value: DATABASE_URL,
    required: false,
    name: 'DATABASE_URL',
    validate: (val) => {
      if (!val) return { valid: false, message: '⚠️  Not set (optional for app, needed for tools)' };
      if (!val.startsWith('postgresql://')) {
        return { valid: false, message: '⚠️  Invalid format (should start with postgresql://)' };
      }
      if (val.includes('pooler') || val.includes('127.0.0.1')) {
        return { valid: true, message: '✅ Valid connection string (IPv4 compatible)' };
      }
      if (val.includes('db.') && val.includes(':5432')) {
        return { valid: true, message: '⚠️  Direct connection (IPv6 only - may not work on IPv4)' };
      }
      return { valid: true, message: '✅ Valid connection string' };
    }
  }
};

let allValid = true;
const results = {};

for (const [key, check] of Object.entries(checks)) {
  const result = check.validate(check.value);
  results[key] = result;
  console.log(`${check.name}: ${result.message}`);
  
  if (check.required && !result.valid) {
    allValid = false;
  }
}

console.log('\n' + '='.repeat(50));

// Try to test connection if credentials are valid
if (allValid && SUPABASE_URL && SUPABASE_ANON_KEY) {
  console.log('\n🧪 Testing Supabase Connection...\n');
  
  try {
    // Try to import and test Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test connection by getting auth config (lightweight call)
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.log(`⚠️  Connection test: ${error.message}`);
          if (error.message.includes('Invalid API key')) {
            console.log('   → API key may be invalid or incorrect');
          } else if (error.message.includes('Failed to fetch')) {
            console.log('   → Cannot reach Supabase (check URL or network)');
          }
        } else {
          console.log('✅ Connection successful! Supabase is reachable.');
        }
      })
      .catch((err) => {
        console.log(`❌ Connection test failed: ${err.message}`);
        if (err.message.includes('fetch')) {
          console.log('   → This might be a network issue or invalid URL');
        }
      });
  } catch (err) {
    console.log(`⚠️  Could not test connection: ${err.message}`);
    console.log('   → Make sure @supabase/supabase-js is installed');
  }
} else {
  console.log('\n⚠️  Cannot test connection - credentials incomplete');
  console.log('   → Fix missing credentials above, then run validation again');
}

console.log('\n' + '='.repeat(50));
console.log('\n📝 Summary:');
if (allValid) {
  console.log('✅ All required credentials are present and valid');
  if (results.url.type === 'local') {
    console.log('   → Using local Supabase (make sure "supabase start" is running)');
  } else {
    console.log('   → Using hosted Supabase project');
  }
} else {
  console.log('❌ Some credentials are missing or invalid');
  console.log('   → Check SUPABASE_SETUP.md for instructions');
}

process.exit(allValid ? 0 : 1);

