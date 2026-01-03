#!/usr/bin/env node
/**
 * Validate Supabase Connection
 * Uses Next.js environment variable loading (no dotenv needed)
 */

// Next.js automatically loads .env.local, but for Node scripts we need to read it manually
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = envVars.DATABASE_URL;

console.log('🔍 Validating Supabase Configuration...\n');

// Validation checks
const checks = [];

// Check URL
if (!SUPABASE_URL) {
  checks.push({ status: '❌', name: 'NEXT_PUBLIC_SUPABASE_URL', message: 'MISSING' });
} else if (SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost')) {
  checks.push({ status: '✅', name: 'NEXT_PUBLIC_SUPABASE_URL', message: `Local development (${SUPABASE_URL})` });
} else if (SUPABASE_URL.includes('supabase.co')) {
  checks.push({ status: '✅', name: 'NEXT_PUBLIC_SUPABASE_URL', message: `Hosted project (${SUPABASE_URL})` });
} else {
  checks.push({ status: '⚠️', name: 'NEXT_PUBLIC_SUPABASE_URL', message: 'Unknown format' });
}

// Check Anon Key
if (!SUPABASE_ANON_KEY) {
  checks.push({ status: '❌', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', message: 'MISSING' });
} else if (SUPABASE_ANON_KEY.includes('your-') || SUPABASE_ANON_KEY.includes('<')) {
  checks.push({ status: '❌', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', message: 'Placeholder value - replace with actual key' });
} else if (SUPABASE_ANON_KEY.startsWith('eyJ') && SUPABASE_ANON_KEY.length > 100) {
  // Check if it's the local dev key (should match project if hosted)
  if (SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0') {
    if (SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
      checks.push({ status: '⚠️', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', message: 'Using local dev key with hosted project - should use project key' });
    } else {
      checks.push({ status: '✅', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', message: `Valid JWT (local dev key, ${SUPABASE_ANON_KEY.length} chars)` });
    }
  } else {
    checks.push({ status: '✅', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', message: `Valid JWT (${SUPABASE_ANON_KEY.length} chars)` });
  }
} else {
  checks.push({ status: '⚠️', name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', message: 'Invalid format (should be JWT token)' });
}

// Check Service Key
if (!SUPABASE_SERVICE_KEY) {
  checks.push({ status: '❌', name: 'SUPABASE_SERVICE_ROLE_KEY', message: 'MISSING' });
} else if (SUPABASE_SERVICE_KEY.includes('your-') || SUPABASE_SERVICE_KEY.includes('<')) {
  checks.push({ status: '❌', name: 'SUPABASE_SERVICE_ROLE_KEY', message: 'Placeholder value - replace with actual key' });
} else if (SUPABASE_SERVICE_KEY.startsWith('eyJ') && SUPABASE_SERVICE_KEY.length > 100) {
  // Check if it's the local dev key
  if (SUPABASE_SERVICE_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU') {
    if (SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
      checks.push({ status: '⚠️', name: 'SUPABASE_SERVICE_ROLE_KEY', message: 'Using local dev key with hosted project - should use project key' });
    } else {
      checks.push({ status: '✅', name: 'SUPABASE_SERVICE_ROLE_KEY', message: `Valid JWT (local dev key, ${SUPABASE_SERVICE_KEY.length} chars)` });
    }
  } else {
    checks.push({ status: '✅', name: 'SUPABASE_SERVICE_ROLE_KEY', message: `Valid JWT (${SUPABASE_SERVICE_KEY.length} chars)` });
  }
} else {
  checks.push({ status: '⚠️', name: 'SUPABASE_SERVICE_ROLE_KEY', message: 'Invalid format (should be JWT token)' });
}

// Check Database URL
if (!DATABASE_URL) {
  checks.push({ status: '⚠️', name: 'DATABASE_URL', message: 'Not set (optional for app, needed for tools)' });
} else if (DATABASE_URL.includes('pooler') || DATABASE_URL.includes('127.0.0.1')) {
  checks.push({ status: '✅', name: 'DATABASE_URL', message: 'Valid connection string (IPv4 compatible)' });
} else if (DATABASE_URL.includes('db.') && DATABASE_URL.includes(':5432')) {
  checks.push({ status: '⚠️', name: 'DATABASE_URL', message: 'Direct connection (IPv6 only - may not work on IPv4)' });
} else {
  checks.push({ status: '✅', name: 'DATABASE_URL', message: 'Valid connection string' });
}

// Display results
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.message}`);
});

console.log('\n' + '='.repeat(60));

// Test connection if credentials are valid
const allValid = checks.every(c => !c.status.includes('❌'));
const hasHostedProject = SUPABASE_URL && SUPABASE_URL.includes('supabase.co');

if (allValid && SUPABASE_URL && SUPABASE_ANON_KEY) {
  console.log('\n🧪 Testing Supabase Connection...\n');
  
  try {
    // Try to use Supabase client if available
    const supabaseModule = require.resolve('@supabase/supabase-js');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test with a lightweight API call
    supabase.from('_realtime').select('*').limit(0)
      .then(({ error }) => {
        if (error) {
          if (error.code === 'PGRST301' || error.message.includes('relation') || error.message.includes('does not exist')) {
            console.log('✅ Connection successful! Supabase is reachable.');
            console.log('   → API responded (table not found is expected - connection works)');
          } else if (error.message.includes('Invalid API key') || error.code === 'PGRST301') {
            console.log('❌ Connection failed: Invalid API key');
            console.log('   → Check that your anon key matches your project');
          } else {
            console.log(`⚠️  Connection test: ${error.message}`);
          }
        } else {
          console.log('✅ Connection successful! Supabase is reachable.');
        }
      })
      .catch((err) => {
        if (err.message.includes('fetch')) {
          console.log('❌ Connection failed: Cannot reach Supabase');
          console.log('   → Check your network connection and URL');
          if (hasHostedProject) {
            console.log('   → Verify project is active in Supabase dashboard');
          } else {
            console.log('   → Make sure "supabase start" is running for local dev');
          }
        } else {
          console.log(`⚠️  Connection test error: ${err.message}`);
        }
      });
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  Cannot test connection: @supabase/supabase-js not found');
      console.log('   → Run: npm install @supabase/supabase-js');
    } else {
      console.log(`⚠️  Could not test connection: ${err.message}`);
    }
  }
} else {
  console.log('\n⚠️  Cannot test connection - credentials incomplete');
  console.log('   → Fix missing credentials above, then run validation again');
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Summary:');

const hasIssues = checks.some(c => c.status.includes('❌') || c.status.includes('⚠️'));
if (!hasIssues) {
  console.log('✅ All credentials are valid and properly configured');
  if (hasHostedProject) {
    console.log('   → Using hosted Supabase project');
  } else {
    console.log('   → Using local Supabase (make sure "supabase start" is running)');
  }
} else {
  const criticalIssues = checks.filter(c => c.status.includes('❌'));
  if (criticalIssues.length > 0) {
    console.log('❌ Critical issues found - fix these first:');
    criticalIssues.forEach(c => console.log(`   - ${c.name}: ${c.message}`));
  }
  const warnings = checks.filter(c => c.status.includes('⚠️'));
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(c => console.log(`   - ${c.name}: ${c.message}`));
  }
  console.log('\n   → See SUPABASE_SETUP.md for instructions');
}

process.exit(hasIssues ? 1 : 0);

