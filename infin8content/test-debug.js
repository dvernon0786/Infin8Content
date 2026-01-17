// Quick test script to verify the debugging infrastructure
import { logger } from './lib/logging.js';

console.log('🧪 Testing Debugging Infrastructure...\n');

// Test basic logging
logger.debug('Debug message test', { test: true });
logger.info('Info message test', { test: true });
logger.warn('Warning message test', { test: true });
logger.error('Error message test', { test: true });

// Test specialized logging
logger.logPerformance('test_operation', 150, 'ms');
logger.logApiCall('GET', '/api/test', 200, 45);
logger.logUserAction('test_action', 'user-123');

console.log('\n✅ Debug logging test completed!');
console.log('📊 Check your database for the logged entries.');
console.log('🔍 Tables to check: error_logs, debug_sessions, debug_events');
