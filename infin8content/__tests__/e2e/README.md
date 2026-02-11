# Real E2E Behavioral Validation Tests

This directory contains **true end-to-end tests** that validate the actual behavior of the canonical state machine.

## 🎯 What These Tests Validate

Unlike mocked tests, these tests validate:

- ✅ Real HTTP requests to live API endpoints
- ✅ Real database mutations via Supabase
- ✅ Real service layer execution
- ✅ Real guard enforcement behavior
- ✅ Real state transitions
- ✅ Real error responses

## 🚀 Prerequisites

### 1. Start Supabase
```bash
# From project root
supabase start
```

### 2. Start Next.js Dev Server
```bash
# From project root
cd infin8content
npm run dev
```

### 3. Verify Services
```bash
# Check Supabase
curl http://localhost:54321/rest/v1/

# Check Next.js
curl http://localhost:3000/api/health
```

## 🧪 Running the Tests

### Option 1: Automated Script
```bash
# From project root
./infin8content/scripts/run-real-e2e.sh
```

### Option 2: Manual Execution
```bash
# From infin8content directory
export TEST_API_BASE_URL="http://localhost:3000"
export NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"

npm run test __tests__/e2e/real-step-1-to-2.test.ts
```

## 📋 Test Coverage

### Phase 1: Step 1 → Step 2 Canonical Progression
- ✅ Fresh workflow starts at `current_step = 1`
- ✅ Step 1 endpoint executes successfully
- ✅ Step 1 re-execution rejected (`INVALID_STEP_ORDER`)
- ✅ Step 2 premature execution rejected
- ✅ State transitions verified via real database

### Future Phases (Planned)
- Phase 2: Step 8 human approval regression
- Phase 3: Step 9 → terminal completion
- Phase 4: Failure recovery testing
- Phase 5: Concurrency & idempotency

## 🔍 What Makes These Tests "Real"

### No Mocking
- ❌ No `vi.mock()` calls
- ❌ No fake service responses
- ❌ No simulated database

### Real Execution
- ✅ Actual `fetch()` calls to API endpoints
- ✅ Real Supabase REST API calls
- ✅ Real HTTP status codes
- ✅ Real JSON responses

### Real State
- ✅ Database mutations persist
- ✅ State transitions are atomic
- ✅ Guard enforcement is behavioral
- ✅ Error responses are authentic

## 🚨 Important Notes

### Authentication
These tests may encounter 401 authentication errors in local development. This is expected and acceptable:

- 401 errors indicate auth layer is working
- Guard logic should still reject with `INVALID_STEP_ORDER`
- Focus is on step order enforcement, not authentication

### Test Isolation
- Each test creates its own organization and workflow
- Tests cleanup after execution
- No test data pollution between runs

### CI/CD Considerations
For automated CI/CD:
1. Use test database schema
2. Spin up services in Docker
3. Configure environment variables
4. Run tests in isolated containers

## 🐛 Troubleshooting

### "Dev server not running"
```bash
cd infin8content
npm run dev
```

### "Supabase not running"
```bash
supabase start
```

### "Connection refused"
- Check if services are on correct ports
- Verify firewall settings
- Ensure no conflicting processes

### "Test fails with 401"
- This is expected without proper auth setup
- Guard logic should still reject step order violations
- Focus on `INVALID_STEP_ORDER` responses, not auth

## 📊 Test Results Interpretation

### ✅ Passing Tests
- Guards are working correctly
- State transitions are atomic
- API endpoints are responding
- Database operations succeed

### ❌ Failing Tests
- Check service status first
- Verify environment variables
- Review error logs for specific issues
- Ensure test isolation is working

## 🎯 Success Criteria

A test suite pass proves:

1. **Canonical guards enforce step order**
2. **State transitions are atomic and correct**
3. **API endpoints respond with proper errors**
4. **Database mutations persist correctly**
5. **The machine behaves as designed**

This is **real behavioral validation**, not structural simulation.
