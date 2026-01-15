import { chromium, type FullConfig } from '@playwright/test'

/**
 * Global setup for Playwright tests
 * Sets up test environment and handles authentication
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up Playwright test environment...')
  
  // Create test results directory
  const fs = require('fs')
  const path = require('path')
  
  const testResultsDir = path.join(process.cwd(), 'test-results')
  const visualRegressionDir = path.join(testResultsDir, 'visual-regression')
  
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true })
  }
  
  if (!fs.existsSync(visualRegressionDir)) {
    fs.mkdirSync(visualRegressionDir, { recursive: true })
  }
  
  // Set up authentication if needed
  const { setupAuth } = require('./__tests__/auth-setup')
  await setupAuth()
  
  console.log('✅ Playwright test environment ready')
}

export default globalSetup
