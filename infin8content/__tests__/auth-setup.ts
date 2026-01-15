import { chromium, type Browser, type BrowserContext, type Cookie } from '@playwright/test'

/**
 * Authentication setup for Playwright tests
 * Handles login and session management
 */

// Test user credentials (use environment variables in production)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
  firstName: 'Test',
  lastName: 'User'
}

let authCookies: Cookie[] = []

async function setupAuth() {
  console.log('🔐 Setting up test authentication...')
  
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Check if user exists, create if needed
    await page.goto('http://localhost:3000/register')
    
    // Fill registration form
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.fill('input[name="firstName"]', TEST_USER.firstName)
    await page.fill('input[name="lastName"]', TEST_USER.lastName)
    
    // Submit registration
    await page.click('button[type="submit"]')
    
    // Wait for registration to complete
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    
    // Store authentication cookies
    authCookies = await context.cookies()
    
    console.log('✅ Test authentication setup complete')
    
  } catch (error) {
    console.log('ℹ️ User may already exist, attempting login...')
    
    // Try login instead
    await page.goto('http://localhost:3000/login')
    
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    
    authCookies = await context.cookies()
    
    console.log('✅ Test authentication setup complete via login')
  }
  
  await browser.close()
}

async function cleanupAuth() {
  console.log('🧹 Cleaning up test authentication...')
  // Clean up any test data if needed
  authCookies = []
  console.log('✅ Test authentication cleaned up')
}

async function getAuthCookies() {
  return authCookies
}

async function createAuthenticatedContext(browser: Browser) {
  const context = await browser.newContext()
  
  if (authCookies.length > 0) {
    await context.addCookies(authCookies)
  }
  
  return context
}

module.exports = {
  setupAuth,
  cleanupAuth,
  getAuthCookies,
  createAuthenticatedContext,
  TEST_USER
}
