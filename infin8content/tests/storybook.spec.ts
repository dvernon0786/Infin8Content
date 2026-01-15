import { test, expect } from '@playwright/test';

test.describe('Component Library Storybook Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Storybook
    await page.goto('http://localhost:6006');
  });

  test('Storybook loads correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="storybook-preview-iframe"]')).toBeVisible();
  });

  test('Button component stories render', async ({ page }) => {
    // Navigate to Button stories
    await page.goto('http://localhost:6006/?path=/story/ui-button--default');
    
    // Wait for the story to load
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    
    // Switch to the iframe context
    const frame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    
    // Test default button
    await expect(frame.locator('button')).toContainText('Button');
    await expect(frame.locator('button')).toHaveClass(/bg-primary/);
  });

  test('Button variants render correctly', async ({ page }) => {
    // Test Primary variant
    await page.goto('http://localhost:6006/?path=/story/ui-button--primary');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const primaryFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(primaryFrame.locator('button')).toHaveClass(/bg-\[--color-primary-blue\]/);
    
    // Test Secondary variant
    await page.goto('http://localhost:6006/?path=/story/ui-button--secondary');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const secondaryFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(secondaryFrame.locator('button')).toHaveClass(/bg-\[--color-primary-purple\]/);
    
    // Test Ghost variant
    await page.goto('http://localhost:6006/?path=/story/ui-button--ghost');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const ghostFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(ghostFrame.locator('button')).toHaveClass(/hover:bg-accent/);
    
    // Test Destructive variant
    await page.goto('http://localhost:6006/?path=/story/ui-button--destructive');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const destructiveFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(destructiveFrame.locator('button')).toHaveClass(/bg-destructive/);
  });

  test('Button states render correctly', async ({ page }) => {
    // Test Loading state
    await page.goto('http://localhost:6006/?path=/story/ui-button--loading');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const loadingFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(loadingFrame.locator('button')).toBeDisabled();
    await expect(loadingFrame.locator('svg.animate-spin')).toBeVisible();
    
    // Test Disabled state
    await page.goto('http://localhost:6006/?path=/story/ui-button--disabled');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const disabledFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(disabledFrame.locator('button')).toBeDisabled();
    await expect(disabledFrame.locator('button')).toHaveClass(/disabled:opacity-50/);
  });

  test('Badge component stories render', async ({ page }) => {
    // Navigate to Badge stories
    await page.goto('http://localhost:6006/?path=/story/ui-badge--default');
    
    // Wait for the story to load
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    
    // Switch to the iframe context
    const frame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    
    // Test default badge
    await expect(frame.locator('span')).toContainText('Badge');
  });

  test('Badge variants render correctly', async ({ page }) => {
    // Test Success variant
    await page.goto('http://localhost:6006/?path=/story/ui-badge--success');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const successFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(successFrame.locator('span')).toHaveClass(/bg-\[--color-success\]/);
    
    // Test Warning variant
    await page.goto('http://localhost:6006/?path=/story/ui-badge--warning');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const warningFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(warningFrame.locator('span')).toHaveClass(/bg-\[--color-warning\]/);
    
    // Test Error variant
    await page.goto('http://localhost:6006/?path=/story/ui-badge--error');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const errorFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(errorFrame.locator('span')).toHaveClass(/bg-\[--color-error\]/);
    
    // Test Info variant
    await page.goto('http://localhost:6006/?path=/story/ui-badge--info');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const infoFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(infoFrame.locator('span')).toHaveClass(/bg-\[--color-info\]/);
    
    // Test Brand variant
    await page.goto('http://localhost:6006/?path=/story/ui-badge--brand');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const brandFrame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    await expect(brandFrame.locator('span')).toHaveClass(/bg-\[--gradient-brand\]/);
  });

  test('Design tokens are applied correctly', async ({ page }) => {
    // Test that design tokens are working by checking computed styles
    await page.goto('http://localhost:6006/?path=/story/ui-button--primary');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const frame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    
    // Get the button element and check its computed styles
    const button = frame.locator('button');
    await expect(button).toBeVisible();
    
    // Check that the button has the design token class
    await expect(button).toHaveClass(/bg-\[--color-primary-blue\]/);
  });

  test('Accessibility attributes are present', async ({ page }) => {
    // Test button accessibility
    await page.goto('http://localhost:6006/?path=/story/ui-button--default');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const frame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    
    const button = frame.locator('button');
    await expect(button).toHaveAttribute('role', 'button');
    await expect(button).toHaveAttribute('data-slot', 'button');
    await expect(button).toHaveAttribute('data-variant', 'default');
  });

  test('Component interactions work', async ({ page }) => {
    // Test button hover states
    await page.goto('http://localhost:6006/?path=/story/ui-button--primary');
    await page.waitForSelector('[data-testid="storybook-preview-iframe"]');
    const frame = page.frameLocator('[data-testid="storybook-preview-iframe"]');
    
    const button = frame.locator('button');
    await button.hover();
    // Check that hover state is applied
    await expect(button).toHaveClass(/hover:bg-\[--color-primary-blue\]\/90/);
  });
});
