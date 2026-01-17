/**
 * Sentry Verification Script
 * Tests Sentry integration and debugging infrastructure
 */

import { logger } from './lib/logging.js';

console.log('🔍 Verifying Sentry Integration...\n');

// Test 1: Check if Sentry is available
try {
  const Sentry = await import('@sentry/nextjs');
  console.log('✅ Sentry package is installed');
  
  if (Sentry.default) {
    console.log('✅ Sentry default export available');
  } else {
    console.log('❌ Sentry default export not available');
  }
} catch (error) {
  console.log('❌ Sentry package not available:', error.message);
}

// Test 2: Check environment variables
console.log('\n📋 Environment Variables Check:');
const sentryDsn = process.env.SENTRY_DSN;
const monitoringEnabled = process.env.MONITORING_ENABLED;

if (sentryDsn) {
  console.log('✅ SENTRY_DSN is configured');
  console.log(`   DSN: ${sentryDsn.substring(0, 20)}...`);
} else {
  console.log('❌ SENTRY_DSN is not configured');
}

if (monitoringEnabled === 'true') {
  console.log('✅ MONITORING_ENABLED is true');
} else {
  console.log('❌ MONITORING_ENABLED is not true');
}

// Test 3: Test logging with Sentry
console.log('\n🧪 Testing Logging with Sentry:');

try {
  // Test different log levels
  logger.debug('Sentry verification - debug level', { 
    test: 'sentry-debug',
    timestamp: new Date().toISOString()
  });

  logger.info('Sentry verification - info level', { 
    test: 'sentry-info',
    component: 'verify-sentry'
  });

  logger.warn('Sentry verification - warning level', { 
    test: 'sentry-warn',
    severity: 'low'
  });

  // Test error logging (this should go to Sentry)
  logger.error('Sentry verification - error level', { 
    test: 'sentry-error',
    error: new Error('Test error for Sentry verification'),
    component: 'verify-sentry',
    userId: 'test-user-123'
  });

  console.log('✅ Logging test completed');
  console.log('📊 Check your Sentry dashboard for the error logs');
  
} catch (error) {
  console.log('❌ Logging test failed:', error.message);
}

// Test 4: Test production monitoring
console.log('\n🏭 Production Monitoring Check:');

try {
  const { productionMonitoring } = await import('./lib/monitoring.js');
  const status = productionMonitoring.getStatus();
  
  console.log('📊 Production Monitoring Status:', status);
  
  if (status.enabled) {
    console.log('✅ Production monitoring is enabled');
  } else {
    console.log('❌ Production monitoring is disabled');
  }
} catch (error) {
  console.log('❌ Production monitoring not available:', error.message);
}

console.log('\n🎯 Verification Complete!');
console.log('📝 Next Steps:');
console.log('   1. Check your Sentry dashboard for the test error');
console.log('   2. Verify error appears with proper context');
console.log('   3. Test in your application components');
console.log('   4. Check database error_logs table for entries');
