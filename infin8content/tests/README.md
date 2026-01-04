# E2E Tests with Playwright

This directory contains end-to-end tests for Infin8Content using Playwright.

## Setup

1. **Install dependencies** (already done if you ran `npm install`):
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install chromium
   ```

   Or install all browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Run tests in UI mode:
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

### Run tests in debug mode:
```bash
npm run test:e2e:debug
```

### Run specific test file:
```bash
npx playwright test tests/e2e/suspension-flow.spec.ts
```

## Test Structure

- `tests/e2e/` - E2E test files
- `tests/support/fixtures.ts` - Custom Playwright fixtures
- `tests/support/helpers/` - Helper functions for common operations
  - `auth.ts` - Authentication helpers
  - `payment.ts` - Payment flow helpers

## Test Coverage

### Story 1.9: Account Suspension and Reactivation Workflow

- ✅ Suspended user login redirect
- ✅ Suspension page display
- ✅ Payment retry from suspension page
- ✅ Reactivation after payment (requires Stripe test mode)
- ✅ Grace period banner display and countdown

## Test Data

**Note:** E2E tests are structured to handle authentication requirements gracefully. Tests will:
- Skip when authentication is required but not available
- Document expected behavior for different user states
- Pass when test data is properly set up

For full execution, you'll need to:

1. **Set up test users** with different payment statuses:
   - Suspended user (payment_status: 'suspended', suspended_at set)
   - Grace period user (payment_status: 'past_due', grace_period_started_at set)
   - Active user (payment_status: 'active')

2. **Configure authentication** in test fixtures:
   - Set up authenticated sessions for test users
   - Use test database with seeded data

3. **Configure Stripe test mode** for payment flows:
   - Use Stripe test API keys
   - Mock or use test webhooks

4. **Set up test database** with appropriate test data:
   - Organizations with different payment statuses
   - Users linked to organizations
   - Test payment records

## Environment Variables

Set these in `.env.local` for E2E tests:

```env
BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
STRIPE_SECRET_KEY=your_stripe_test_key
```

## Writing New Tests

Follow the Given-When-Then format:

```typescript
test('should do something', async ({ page }) => {
  // Given: Initial state
  await page.goto('/some-page')
  
  // When: Action is performed
  await page.click('button')
  
  // Then: Expected outcome
  await expect(page.locator('text=Success')).toBeVisible()
})
```

## Test Priority Tags

Tests are tagged with priority levels:
- `[P0]` - Critical path, must pass
- `[P1]` - Important, should pass
- `[P2]` - Nice to have
- `[P3]` - Low priority

## Debugging

1. Use `test:e2e:debug` to step through tests
2. Use `test:e2e:headed` to see browser actions
3. Check `test-results/` for screenshots and videos on failure
4. View HTML report: `npx playwright show-report`

