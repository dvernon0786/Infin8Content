---
description: Run the complete test suite
---

# Test Workflow

This workflow runs all tests for the Infin8Content project.

## Steps

1. **Navigate to project directory**
   // turbo
   ```bash
   cd /home/dghost/Infin8Content-1/infin8content
   ```

2. **Install dependencies** (if needed)
   ```bash
   npm install
   ```

3. **Run unit tests**
   // turbo
   ```bash
   npm test
   ```

4. **Run integration tests** (if applicable)
   ```bash
   npm run test:integration
   ```

5. **Run E2E tests** (if applicable)
   ```bash
   npm run test:e2e
   ```

6. **Check test coverage**
   ```bash
   npm run test:coverage
   ```

7. **Review results**
   - All tests should pass
   - Coverage should meet project standards
   - Fix any failing tests before proceeding

## Success Criteria

- ✅ All unit tests pass
- ✅ Integration tests pass (if applicable)
- ✅ E2E tests pass (if applicable)
- ✅ Test coverage meets standards
