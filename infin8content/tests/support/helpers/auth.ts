/**
 * Authentication Helpers for E2E Tests
 * 
 * Helper functions for authentication flows in E2E tests
 */

import type { Page } from '@playwright/test'

/**
 * Login helper function
 * Logs in a user with the provided credentials
 */
export async function login(page: Page, email: string, password: string) {
  // Navigate to login page
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  // Fill in email and password
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  
  // Click login button
  await page.click('[data-testid="login-button"]')
  
  // Wait for navigation or API response
  await page.waitForLoadState('networkidle')
}

/**
 * Wait for redirect helper
 * Waits for a redirect to occur and returns the final URL
 */
export async function waitForRedirect(page: Page, expectedPath?: string): Promise<string> {
  if (expectedPath) {
    await page.waitForURL(`**${expectedPath}**`)
  } else {
    // Wait for any navigation
    await page.waitForLoadState('networkidle')
  }
  return page.url()
}

/**
 * Check if user is on suspension page
 */
export async function isOnSuspensionPage(page: Page): Promise<boolean> {
  const url = page.url()
  return url.includes('/suspended')
}

/**
 * Check if user is on payment page
 */
export async function isOnPaymentPage(page: Page): Promise<boolean> {
  const url = page.url()
  return url.includes('/payment')
}

/**
 * Check if user is on dashboard
 */
export async function isOnDashboard(page: Page): Promise<boolean> {
  const url = page.url()
  return url.includes('/dashboard')
}

