import { test, expect } from '@playwright/test'

test('onboarding integration completes and unlocks dashboard', async ({ page }) => {
  // 1. Go to onboarding
  await page.goto('/onboarding')

  // 2. Fill WordPress credentials
  await page.fill('input[placeholder="https://your-site.com"]', process.env.WP_URL!)
  await page.fill('input[placeholder="WordPress username"]', process.env.WP_USER!)
  await page.fill('input[type="password"]', process.env.WP_APP_PASSWORD!)

  // 3. Submit integration
  await page.click('text=Test & Connect')

  // 4. Wait for navigation to dashboard (proves onboarding completed)
  await page.waitForURL('/dashboard', { timeout: 15000 })

  // 5. Assert dashboard loaded
  await expect(page.locator('h1')).toContainText(/dashboard/i)

  // 6. Hard reload to confirm middleware enforcement (no redirect loop)
  await page.reload()

  // 7. Verify we stay on dashboard (middleware allows access)
  await expect(page).toHaveURL('/dashboard')

  // 8. Verify onboarding is marked complete in database (via API check)
  const response = await page.request.get('/api/onboarding/status')
  expect(response.ok()).toBeTruthy()
  const status = await response.json()
  expect(status.onboarding_completed).toBe(true)
})

test('onboarding rejects invalid WordPress credentials', async ({ page }) => {
  // 1. Go to onboarding
  await page.goto('/onboarding')

  // 2. Fill invalid WordPress credentials
  await page.fill('input[placeholder="https://your-site.com"]', 'https://invalid-site.com')
  await page.fill('input[placeholder="WordPress username"]', 'invalid-user')
  await page.fill('input[type="password"]', 'invalid-password')

  // 3. Submit integration
  await page.click('text=Test & Connect')

  // 4. Should stay on onboarding page (not redirect to dashboard)
  await page.waitForTimeout(3000) // Wait for API response
  await expect(page).toHaveURL(/\/onboarding/)

  // 5. Should show error message
  await expect(page.locator('text=Failed to connect')).toBeVisible()
})

test('middleware blocks dashboard access before onboarding', async ({ page }) => {
  // 1. Try to access dashboard directly (simulate fresh user)
  await page.goto('/dashboard')

  // 2. Should be redirected to onboarding
  await page.waitForURL(/\/onboarding\/business/, { timeout: 10000 })

  // 3. Verify we're on onboarding page
  await expect(page.locator('text=Business Information')).toBeVisible()
})
