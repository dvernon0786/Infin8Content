/**
 * Article Content Generation E2E Tests
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 * 
 * End-to-end tests for article content generation flow:
 * - Article creation → Content generation → Quality validation → Citation integration
 * 
 * NOTE: These tests verify the full user-facing flow. Actual content generation
 * happens via Inngest workers, so tests verify:
 * 1. Article creation initiates generation
 * 2. Generated articles include proper content with citations
 * 3. Quality metrics are displayed correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Article Content Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to article creation page
    // Note: Requires authentication - tests will need proper setup
    await page.goto('/dashboard/articles/new')
  })

  test('should create article and initiate content generation', async ({ page }) => {
    // Fill article creation form
    const keywordInput = page.getByTestId('keyword-input')
    const titleInput = page.getByTestId('article-title-input')
    const createButton = page.getByTestId('create-article-button')

    await keywordInput.fill('best running shoes')
    await titleInput.fill('Best Running Shoes Guide')
    await createButton.click()

    // Should show generation in progress
    await expect(page.getByText(/generating/i)).toBeVisible()
    
    // Should redirect to article detail page
    await expect(page).toHaveURL(/\/dashboard\/articles\/[a-f0-9-]+/)
  })

  test('should display generated content with citations', async ({ page }) => {
    // Navigate to a generated article (requires test data)
    const articleId = 'test-article-id' // Would be actual article ID from test data
    await page.goto(`/dashboard/articles/${articleId}`)

    // Should display article content
    const contentSection = page.getByTestId('article-content')
    await expect(contentSection).toBeVisible()

    // Should include citations in content (not just at end)
    const content = await contentSection.textContent()
    expect(content).toContain('According to')
    expect(content).toMatch(/\[.*\]\(https?:\/\/.*\)/) // Markdown link pattern

    // Should have reference list at end
    await expect(page.getByText('## References')).toBeVisible()
  })

  test('should display quality metrics for generated content', async ({ page }) => {
    // Navigate to a generated article
    const articleId = 'test-article-id'
    await page.goto(`/dashboard/articles/${articleId}`)

    // Should display quality metrics
    const qualityMetrics = page.getByTestId('quality-metrics')
    await expect(qualityMetrics).toBeVisible()

    // Should show readability score
    await expect(page.getByText(/readability/i)).toBeVisible()
    
    // Should show citation count
    await expect(page.getByText(/citations/i)).toBeVisible()
    
    // Should show word count
    await expect(page.getByText(/word count/i)).toBeVisible()
  })

  test('should handle generation errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/articles/*/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Content generation failed',
          details: 'OpenRouter API error'
        })
      })
    })

    // Create article
    const keywordInput = page.getByTestId('keyword-input')
    const createButton = page.getByTestId('create-article-button')

    await keywordInput.fill('test keyword')
    await createButton.click()

    // Should display error message
    await expect(page.getByText(/generation failed/i)).toBeVisible()
    
    // Should allow retry
    const retryButton = page.getByTestId('retry-generation-button')
    await expect(retryButton).toBeVisible()
  })

  test('should show progress during section generation', async ({ page }) => {
    // Navigate to article being generated
    const articleId = 'test-article-id'
    await page.goto(`/dashboard/articles/${articleId}`)

    // Should show progress indicator
    const progressBar = page.getByTestId('generation-progress')
    await expect(progressBar).toBeVisible()

    // Should show current section being generated
    await expect(page.getByText(/generating section/i)).toBeVisible()
  })

  test('should validate content quality meets requirements', async ({ page }) => {
    // Navigate to generated article
    const articleId = 'test-article-id'
    await page.goto(`/dashboard/articles/${articleId}`)

    // Get quality metrics
    const qualityMetrics = page.getByTestId('quality-metrics')
    const metricsText = await qualityMetrics.textContent()

    // Should show quality passed indicator
    await expect(page.getByTestId('quality-passed-indicator')).toBeVisible()

    // Should show readability score > 60
    const readabilityMatch = metricsText?.match(/readability[:\s]+(\d+)/i)
    if (readabilityMatch) {
      const readabilityScore = parseInt(readabilityMatch[1])
      expect(readabilityScore).toBeGreaterThanOrEqual(60)
    }

    // Should show citations count >= 1
    const citationsMatch = metricsText?.match(/citations[:\s]+(\d+)/i)
    if (citationsMatch) {
      const citationsCount = parseInt(citationsMatch[1])
      expect(citationsCount).toBeGreaterThanOrEqual(1)
    }
  })

  test('should allow viewing individual section quality metrics', async ({ page }) => {
    // Navigate to generated article
    const articleId = 'test-article-id'
    await page.goto(`/dashboard/articles/${articleId}`)

    // Click on a section to view details
    const section = page.getByTestId('section-1')
    await section.click()

    // Should show section quality metrics
    const sectionMetrics = page.getByTestId('section-quality-metrics')
    await expect(sectionMetrics).toBeVisible()

    // Should show section word count
    await expect(page.getByText(/word count/i)).toBeVisible()
    
    // Should show section citations
    await expect(page.getByText(/citations/i)).toBeVisible()
  })

  test('should display API cost tracking (should be $0.00 for free models)', async ({ page }) => {
    // Navigate to generated article
    const articleId = 'test-article-id'
    await page.goto(`/dashboard/articles/${articleId}`)

    // Should show API costs section
    const apiCosts = page.getByTestId('api-costs')
    await expect(apiCosts).toBeVisible()

    // Should show OpenRouter costs as $0.00 (free models)
    await expect(page.getByText(/openrouter.*\$0\.00/i)).toBeVisible()
  })
})

