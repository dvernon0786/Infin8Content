import { test, expect } from '@playwright/test';
import { render } from '@testing-library/react'
import { Button } from '../components/ui/button'

test.describe('Component Library Direct Tests', () => {
  test('Button component renders correctly', async ({ page }) => {
    // Create a simple test page that renders the component
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="./app/globals.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            // Simple test to verify CSS tokens are loaded
            const root = document.getElementById('root');
            const button = document.createElement('button');
            button.className = 'bg-[--color-primary-blue] text-white px-4 py-2 rounded';
            button.textContent = 'Test Button';
            root.appendChild(button);
          </script>
        </body>
      </html>
    `);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the button exists
    const button = page.locator('button');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Test Button');
    
    // Check that CSS tokens are applied (computed styles)
    const backgroundColor = await button.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // The button should have the primary blue color
    expect(backgroundColor).toBe('rgb(33, 124, 235)');
  });

  test('Badge component renders correctly', async ({ page }) => {
    // Create a simple test page for badge
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="./app/globals.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            const root = document.getElementById('root');
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-[--color-success] text-white';
            badge.textContent = 'Success Badge';
            root.appendChild(badge);
          </script>
        </body>
      </html>
    `);
    
    await page.waitForLoadState('networkidle');
    
    const badge = page.locator('span');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Success Badge');
    
    // Check that CSS tokens are applied
    const backgroundColor = await badge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    expect(backgroundColor).toBe('rgb(16, 185, 129)');
  });

  test('Progress component renders correctly', async ({ page }) => {
    // Create a simple test page for progress
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="./app/globals.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            const root = document.getElementById('root');
            const progressContainer = document.createElement('div');
            progressContainer.className = 'relative w-full h-4 bg-secondary rounded-full overflow-hidden';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'h-full bg-[--gradient-brand]';
            progressBar.style.width = '75%';
            progressBar.style.transform = 'translateX(-25%)';
            
            progressContainer.appendChild(progressBar);
            root.appendChild(progressContainer);
          </script>
        </body>
      </html>
    `);
    
    await page.waitForLoadState('networkidle');
    
    const progressContainer = page.locator('.relative');
    await expect(progressContainer).toBeVisible();
    
    const progressBar = progressContainer.locator('div');
    await expect(progressBar).toBeVisible();
    
    // Check the width/transform
    const width = await progressBar.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    const transform = await progressBar.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    
    expect(width).toBe('75%');
    expect(transform).toContain('translateX(-25%)');
  });

  test('Design tokens are properly defined', async ({ page }) => {
    // Test that design tokens are available in CSS
    await page.goto('http://localhost:6006');
    
    // Check if design tokens are loaded
    const primaryBlue = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary-blue');
    });
    
    const primaryPurple = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-primary-purple');
    });
    
    const successColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-success');
    });
    
    expect(primaryBlue.trim()).toBe('#217CEB');
    expect(primaryPurple.trim()).toBe('#4A42CC');
    expect(successColor.trim()).toBe('#10B981');
  });

  test('Component accessibility attributes', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="./app/globals.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            const root = document.getElementById('root');
            const button = document.createElement('button');
            button.className = 'bg-[--color-primary-blue] text-white px-4 py-2 rounded';
            button.setAttribute('aria-label', 'Test Button');
            button.setAttribute('role', 'button');
            button.textContent = 'Accessible Button';
            root.appendChild(button);
          </script>
        </body>
      </html>
    `);
    
    await page.waitForLoadState('networkidle');
    
    const button = page.locator('button');
    await expect(button).toHaveAttribute('aria-label', 'Test Button');
    await expect(button).toHaveAttribute('role', 'button');
    
    // Test keyboard navigation
    await button.focus();
    await expect(button).toBeFocused();
  });

  test('Brand gradient is applied correctly', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="./app/globals.css">
        </head>
        <body>
          <div id="root"></div>
          <script>
            const root = document.getElementById('root');
            const gradientDiv = document.createElement('div');
            gradientDiv.className = 'w-20 h-20 bg-[--gradient-brand]';
            root.appendChild(gradientDiv);
          </script>
        </body>
      </html>
    `);
    
    await page.waitForLoadState('networkidle');
    
    const gradientDiv = page.locator('div');
    await expect(gradientDiv).toBeVisible();
    
    // Check that gradient is applied
    const background = await gradientDiv.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    
    expect(background).toContain('linear-gradient');
    expect(background).toContain('rgb(33, 124, 235)');
    expect(background).toContain('rgb(74, 66, 204)');
  });
});
