/**
 * Payment Helpers for E2E Tests
 * 
 * Helper functions for payment flows in E2E tests
 */

import type { Page } from '@playwright/test'

/**
 * Navigate to payment page
 */
export async function goToPaymentPage(page: Page, suspended: boolean = false) {
  const url = suspended ? '/payment?suspended=true' : '/payment'
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

/**
 * Check if grace period banner is visible
 */
export async function isGracePeriodBannerVisible(page: Page): Promise<boolean> {
  try {
    const banner = page.locator('text=Payment Failed - Action Required').first()
    await banner.waitFor({ timeout: 5000 })
    return await banner.isVisible()
  } catch {
    return false
  }
}

/**
 * Check if suspension banner is visible
 */
export async function isSuspensionBannerVisible(page: Page): Promise<boolean> {
  try {
    const banner = page.locator('text=Account Suspended - Payment Required').first()
    await banner.waitFor({ timeout: 5000 })
    return await banner.isVisible()
  } catch {
    return false
  }
}

/**
 * Get grace period days remaining from banner
 */
export async function getGracePeriodDaysRemaining(page: Page): Promise<number | null> {
  try {
    const bannerText = await page.locator('text=/\\d+ (day|days) remaining/').first().textContent()
    if (bannerText) {
      const match = bannerText.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Click Retry Payment button
 */
export async function clickRetryPayment(page: Page) {
  // Try data-testid first, then fallback to text
  const retryButton = page.locator('[data-testid="retry-payment-button"], [data-testid="grace-period-retry-payment-button"], button:has-text("Retry Payment"), a:has-text("Retry Payment")').first()
  await retryButton.click()
  await page.waitForLoadState('networkidle')
}

