/**
 * Simple Sentry Verification Script
 * Checks environment and basic setup
 */

console.log('🔍 Sentry Verification - Simple Check\n');

// Check environment variables
console.log('📋 Environment Variables Check:');

const sentryDsn = process.env.SENTRY_DSN;
const monitoringEnabled = process.env.MONITORING_ENABLED;
const logLevel = process.env.LOG_LEVEL;
const debugEnabled = process.env.DEBUG_ENABLED;

console.log(`SENTRY_DSN: ${sentryDsn ? '✅ Configured' : '❌ Missing'}`);
console.log(`MONITORING_ENABLED: ${monitoringEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`LOG_LEVEL: ${logLevel || '❌ Not set'}`);
console.log(`DEBUG_ENABLED: ${debugEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}`);

// Check package.json for Sentry
console.log('\n📦 Package Dependencies Check:');
try {
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const hasSentry = packageJson.dependencies && packageJson.dependencies['@sentry/nextjs'];
  const hasWinston = packageJson.dependencies && packageJson.dependencies.winston;
  
  console.log(`@sentry/nextjs: ${hasSentry ? '✅ Installed' : '❌ Missing'}`);
  console.log(`winston: ${hasWinston ? '✅ Installed' : '❌ Missing'}`);
  
} catch (error) {
  console.log('❌ Could not read package.json:', error.message);
}

// Check if logging file exists
console.log('\n📁 File Structure Check:');
try {
  const fs = require('fs');
  
  const loggingExists = fs.existsSync('./lib/logging.ts');
  const monitoringExists = fs.existsSync('./lib/monitoring.ts');
  const errorBoundaryExists = fs.existsSync('./components/dashboard/error-boundary.tsx');
  
  console.log(`lib/logging.ts: ${loggingExists ? '✅ Exists' : '❌ Missing'}`);
  console.log(`lib/monitoring.ts: ${monitoringExists ? '✅ Exists' : '❌ Missing'}`);
  console.log(`error-boundary.tsx: ${errorBoundaryExists ? '✅ Exists' : '❌ Missing'}`);
  
} catch (error) {
  console.log('❌ Could not check file structure:', error.message);
}

// Instructions
console.log('\n🎯 Verification Results:');
console.log('📝 Next Steps:');

if (!sentryDsn) {
  console.log('❌ SENTRY_DSN is missing - Sentry will not work');
  console.log('   1. Get your DSN from Sentry.io');
  console.log('   2. Add it to your .env.local file');
} else {
  console.log('✅ SENTRY_DSN is configured');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Test with: logger.error("Test error", { test: true })');
  console.log('   3. Check your Sentry dashboard');
}

if (!monitoringEnabled) {
  console.log('❌ MONITORING_ENABLED is false - monitoring disabled');
} else {
  console.log('✅ Production monitoring is enabled');
}

console.log('\n🔧 Quick Test (after fixing any issues):');
console.log('   1. Add this to any component:');
console.log('      import { logger } from "@/lib/logging";');
console.log('      logger.error("Test Sentry", { test: true });');
console.log('   2. Check browser console and Sentry dashboard');
