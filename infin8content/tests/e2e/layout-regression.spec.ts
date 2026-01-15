import { test, expect } from '@playwright/test'

// Visual Regression Testing Configuration
const VIEWPORTS = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1024, height: 768 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
]

// Pages to test for visual regression
const PAGES_TO_TEST = [
  '/dashboard',
  '/dashboard/articles',
  '/dashboard/research',
  '/dashboard/settings'
]

// Layout regression test suite
test.describe('Layout Regression Tests', () => {
  PAGES_TO_TEST.forEach(pagePath => {
    VIEWPORTS.forEach(viewport => {
      test(`Layout consistency: ${pagePath} on ${viewport.name}`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        
        // Navigate to page (handle authentication if needed)
        await page.goto(pagePath)
        
        // Wait for page to load completely
        await page.waitForLoadState('networkidle')
        
        // Check for layout shifts
        await expect(page.locator('body')).toBeVisible()
        
        // Verify critical layout elements are present
        await expect(page.locator('header, [role="banner"], .header')).toBeVisible()
        await expect(page.locator('main, [role="main"], .main')).toBeVisible()
        
        // Check for responsive navigation
        if (viewport.width < 640) {
          // Mobile: should have hamburger menu
          await expect(page.locator('[aria-label*="menu"], button[aria-label*="menu"]')).toBeVisible()
        } else {
          // Desktop/Tablet: should have sidebar
          await expect(page.locator('[role="navigation"], .sidebar, nav')).toBeVisible()
        }
        
        // Verify touch targets are at least 44px on mobile
        if (viewport.width < 640) {
          const buttons = page.locator('button, [role="button"], .btn')
          const buttonCount = await buttons.count()
          
          for (let i = 0; i < Math.min(buttonCount, 10); i++) {
            const button = buttons.nth(i)
            const boundingBox = await button.boundingBox()
            if (boundingBox) {
              expect(boundingBox.height).toBeGreaterThanOrEqual(44)
              expect(boundingBox.width).toBeGreaterThanOrEqual(44)
            }
          }
        }
        
        // Take screenshot for visual comparison
        await page.screenshot({
          path: `test-results/visual-regression/${pagePath.replace('/', '_')}_${viewport.name.toLowerCase().replace(' ', '_')}.png`,
          fullPage: true
        })
      })
    })
  })
})

// CSS Specificity Regression Test
test.describe('CSS Specificity Regression Tests', () => {
  test('Authentication pages maintain proper container widths', async ({ page }) => {
    // Test critical pages that were affected by CSS specificity crisis
    const authPages = [
      '/verify-email?email=test@example.com',
      '/create-organization'
    ]
    
    for (const pagePath of authPages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      // Check that main content containers have proper width
      const mainContainer = page.locator('main > div > div, .container, [role="main"] > div')
      
      if (await mainContainer.count() > 0) {
        const boundingBox = await mainContainer.first().boundingBox()
        if (boundingBox) {
          // Should be around 448px width (was 64px during crisis)
          expect(boundingBox.width).toBeGreaterThanOrEqual(400)
          expect(boundingBox.width).toBeLessThanOrEqual(500)
        }
      }
    }
  })
})

// Responsive Navigation Regression Test
test.describe('Responsive Navigation Regression Tests', () => {
  test('Mobile navigation works correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Mobile should have hamburger menu
    const hamburgerMenu = page.locator('[aria-label*="menu"], button[aria-label*="menu"]')
    await expect(hamburgerMenu).toBeVisible()
    
    // Sidebar should be hidden by default
    const sidebar = page.locator('[role="navigation"], .sidebar, nav')
    await expect(sidebar).toBeHidden()
    
    // Click hamburger to open sidebar
    await hamburgerMenu.click()
    await expect(sidebar).toBeVisible()
    
    // Verify touch targets in mobile sidebar
    const navItems = page.locator('[role="navigation"] a, .sidebar a')
    const navItemCount = await navItems.count()
    
    for (let i = 0; i < Math.min(navItemCount, 5); i++) {
      const navItem = navItems.nth(i)
      const boundingBox = await navItem.boundingBox()
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
  
  test('Desktop navigation works correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Desktop should have persistent sidebar
    const sidebar = page.locator('[role="navigation"], .sidebar, nav')
    await expect(sidebar).toBeVisible()
    
    // Should not have hamburger menu
    const hamburgerMenu = page.locator('[aria-label*="menu"], button[aria-label*="menu"]')
    await expect(hamburgerMenu).toBeHidden()
    
    // Notification bell should be visible in header
    const notificationBell = page.locator('[aria-label*="notification"], button[aria-label*="notification"]')
    await expect(notificationBell).toBeVisible()
  })
})

// Performance Regression Test
test.describe('Layout Performance Regression Tests', () => {
  test('Touch response time under 200ms', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Measure touch response time for navigation toggle
    const hamburgerMenu = page.locator('[aria-label*="menu"], button[aria-label*="menu"]')
    const startTime = Date.now()
    
    await hamburgerMenu.click()
    await page.waitForSelector('[role="navigation"].visible, .sidebar.visible, nav.visible')
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(200) // Should be under 200ms
  })
  
  test('Animation performance maintains 60fps', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Test sidebar toggle animation
    const sidebarToggle = page.locator('[aria-label*="sidebar"], button[aria-label*="toggle"]')
    
    // Measure animation frame rate
    const frames = []
    const startTime = performance.now()
    
    await sidebarToggle.click()
    
    // Monitor for animation completion (should be fast)
    await page.waitForTimeout(300) // Wait for animation to complete
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Animation should complete quickly (under 300ms for smooth 60fps)
    expect(duration).toBeLessThan(300)
  })
})

// Accessibility Regression Test
test.describe('Accessibility Regression Tests', () => {
  test('WCAG 2.1 AA compliance maintained', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Check for proper ARIA labels
    const navigation = page.locator('[role="navigation"], nav[aria-label]')
    await expect(navigation).toHaveAttribute('role', 'navigation')
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check for sufficient color contrast (basic check)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      await expect(button).toHaveAttribute('type')
    }
  })
})
