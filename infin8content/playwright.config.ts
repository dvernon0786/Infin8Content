import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration
 * E2E tests for Infin8Content
 * Story 1.9: Account Suspension and Reactivation Workflow
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run for
  timeout: 60 * 1000,
  
  // Test execution timeout
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 15 * 1000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 15 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    // Visual Regression Testing Project
    {
      name: 'visual-regression',
      testMatch: '**/layout-regression.spec.ts',
      use: {
        // Disable animations for consistent screenshots
        launchOptions: {
          args: [
            '--disable-animations',
            '--disable-transitions',
            '--disable-gpu',
            '--disable-software-rasterizer'
          ]
        },
        // Ensure consistent viewport
        viewport: { width: 1280, height: 720 },
        // Longer timeout for visual comparisons
        actionTimeout: 10000,
      },
      dependencies: ['chromium']
    },
    // Responsive Testing Project
    {
      name: 'responsive-testing',
      testMatch: '**/responsive.spec.ts',
      use: {
        viewport: { width: 1280, height: 720 },
        actionTimeout: 10000,
      },
      dependencies: ['chromium', 'Mobile Chrome', 'iPad']
    },
    // Accessibility Testing Project
    {
      name: 'accessibility-testing',
      testMatch: '**/accessibility.spec.ts',
      use: {
        // Enable accessibility testing
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion', // Test with reduced motion
            '--force-color-profile=srgb' // Consistent color profile
          ]
        },
        actionTimeout: 10000,
      },
      dependencies: ['chromium']
    }
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})

