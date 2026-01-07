/**
 * Keyword Research E2E Tests
 * 
 * End-to-end tests for keyword research flow
 * Story 3.1: Keyword Research Interface and DataForSEO Integration
 */

import { test, expect } from '@playwright/test'

test.describe('Keyword Research Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to keyword research page
    // Note: Requires authentication - tests will need proper setup
    await page.goto('/dashboard/research/keywords')
  })

  test('should display keyword research form', async ({ page }) => {
    // Check if form elements are present
    await expect(page.getByTestId('keyword-input')).toBeVisible()
    await expect(page.getByTestId('research-button')).toBeVisible()
  })

  test('should show validation error for empty keyword', async ({ page }) => {
    const researchButton = page.getByTestId('research-button')
    await researchButton.click()

    // Should show validation error
    await expect(page.getByText('Please enter a keyword to research')).toBeVisible()
  })

  test('should show validation error for keyword too long', async ({ page }) => {
    const input = page.getByTestId('keyword-input')
    const longKeyword = 'a'.repeat(201)

    await input.fill(longKeyword)
    await page.getByTestId('research-button').click()

    // Should show validation error
    await expect(page.getByText(/less than 200 characters/)).toBeVisible()
  })

  test('should submit research request on Enter key', async ({ page }) => {
    const input = page.getByTestId('keyword-input')
    
    // Mock API response
    await page.route('/api/research/keywords', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            keyword: 'test keyword',
            results: [{
              keyword: 'test keyword',
              searchVolume: 1000,
              keywordDifficulty: 50,
              trend: [1000, 1100, 1200],
              cpc: 1.0,
              competition: 'Medium',
            }],
            apiCost: 0.001,
            cached: false,
            usage: {
              current: 1,
              limit: 50,
            },
          },
        }),
      })
    })

    await input.fill('test keyword')
    await input.press('Enter')

    // Should show results
    await expect(page.getByText('Keyword Research Results')).toBeVisible()
    await expect(page.getByText('test keyword')).toBeVisible()
  })

  test('should display loading state during research', async ({ page }) => {
    // Mock delayed API response
    await page.route('/api/research/keywords', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            keyword: 'test keyword',
            results: [],
            apiCost: 0.001,
            cached: false,
            usage: { current: 1, limit: 50 },
          },
        }),
      })
    })

    const input = page.getByTestId('keyword-input')
    await input.fill('test keyword')
    await page.getByTestId('research-button').click()

    // Should show loading state
    await expect(page.getByText('Researching...')).toBeVisible()
  })

  test('should display error message on API failure', async ({ page }) => {
    // Mock API error
    await page.route('/api/research/keywords', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Keyword research failed. Please try again.',
        }),
      })
    })

    const input = page.getByTestId('keyword-input')
    await input.fill('test keyword')
    await page.getByTestId('research-button').click()

    // Should show error message
    await expect(page.getByText('Keyword research failed. Please try again.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  })

  test('should display usage limit message when limit exceeded', async ({ page }) => {
    // Mock usage limit exceeded response
    await page.route('/api/research/keywords', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: "You've reached your keyword research limit for this month",
          details: {
            code: 'USAGE_LIMIT_EXCEEDED',
            usageLimitExceeded: true,
            currentUsage: 50,
            limit: 50,
          },
        }),
      })
    })

    const input = page.getByTestId('keyword-input')
    await input.fill('test keyword')
    await page.getByTestId('research-button').click()

    // Should show usage limit message
    await expect(page.getByText(/reached your keyword research limit/)).toBeVisible()
    await expect(page.getByText('50 / 50')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upgrade Plan' })).toBeVisible()
  })

  test('should display API cost information', async ({ page }) => {
    // Mock successful API response
    await page.route('/api/research/keywords', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            keyword: 'test keyword',
            results: [{
              keyword: 'test keyword',
              searchVolume: 1000,
              keywordDifficulty: 50,
              trend: [1000],
              competition: 'Medium',
            }],
            apiCost: 0.001,
            cached: false,
            usage: { current: 1, limit: 50 },
          },
        }),
      })
    })

    const input = page.getByTestId('keyword-input')
    await input.fill('test keyword')
    await page.getByTestId('research-button').click()

    // Should show API cost
    await expect(page.getByText(/Cost: \$0.001/)).toBeVisible()
  })

  test('should display cached badge for cached results', async ({ page }) => {
    // Mock cached response
    await page.route('/api/research/keywords', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            keyword: 'test keyword',
            results: [{
              keyword: 'test keyword',
              searchVolume: 1000,
              keywordDifficulty: 50,
              trend: [1000],
              competition: 'Medium',
            }],
            apiCost: 0.001,
            cached: true,
            usage: { current: 1, limit: 50 },
          },
        }),
      })
    })

    const input = page.getByTestId('keyword-input')
    await input.fill('test keyword')
    await page.getByTestId('research-button').click()

    // Should show cached badge
    await expect(page.getByText('Cached')).toBeVisible()
  })
})

