import { chromium, type FullConfig } from '@playwright/test'

/**
 * Global teardown for Playwright tests
 * Cleans up test environment
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Playwright test environment...')
  
  // Clean up authentication if needed
  const { cleanupAuth } = require('./__tests__/auth-setup')
  await cleanupAuth()
  
  console.log('✅ Playwright test environment cleaned up')
}

export default globalTeardown
