# Infin8Content Development Guide

**Generated:** 2026-02-22  
**Version:** Production-Ready Development Standards  
**Target Audience:** Intermediate to Advanced Developers

## Development Environment Setup

### Prerequisites
- **Node.js:** v20.20.0+ (LTS)
- **npm:** v10.8.2+
- **Database:** Supabase (PostgreSQL)
- **IDE:** VS Code with recommended extensions

### Quick Start
```bash
# Clone repository
git clone https://github.com/dvernon0786/Infin8Content.git
cd Infin8Content

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Configure Supabase and API keys

# Start development server
npm run dev
```

### Environment Configuration
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INNGEST_EVENT_KEY=your_inngest_key
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password
```

## Code Architecture Patterns

### 1. FSM State Management Pattern
**Required:** All workflow state changes must use FSM

```typescript
// ✅ Correct: Use FSM transition
const transitionResult = await WorkflowFSM.transition(workflowId, 'COMPETITORS_COMPLETED', {
  userId: currentUser.id,
  metadata: { competitorCount: 3 }
})

// ❌ Forbidden: Direct state mutation
await supabase
  .from('intent_workflows')
  .update({ state: 'step_3_seeds' })
  .eq('id', workflowId)
```

### 2. API Route Pattern
**Required:** Consistent API structure across all endpoints

```typescript
// ✅ Correct API route pattern
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Validation
    const body = await request.json()
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 3. Business Logic
    const result = await processRequest(body, currentUser)

    // 4. Response
    return NextResponse.json({ data: result, status: 'success' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 3. Database Query Pattern
**Required:** Explicit field selection, organization isolation

```typescript
// ✅ Correct: Explicit fields + organization isolation
const { data: workflow } = await supabase
  .from('intent_workflows')
  .select('id, state, organization_id, name')
  .eq('organization_id', organizationId)
  .eq('id', workflowId)
  .single()

// ❌ Forbidden: Wildcard selection
const { data: workflow } = await supabase
  .from('intent_workflows')
  .select('*') // Never use wildcard
  .eq('id', workflowId)
```

### 4. Service Layer Pattern
**Required:** Dependency injection with pure functions

```typescript
// ✅ Correct: Service with dependency injection
export class KeywordExpander {
  constructor(
    private readonly dataforseoClient: DataForSEOClient,
    private readonly logger: Logger
  ) {}

  async expandSeeds(seeds: SeedKeyword[]): Promise<LongtailKeyword[]> {
    // Pure business logic
    const results = await Promise.all(
      seeds.map(seed => this.dataforseoClient.getRelatedKeywords(seed))
    )
    return this.deduplicateAndSort(results)
  }
}

// Factory function for dependency injection
export function createKeywordExpander(): KeywordExpander {
  return new KeywordExpander(
    new DataForSEOClient(),
    new WinstonLogger()
  )
}
```

### 5. Component Pattern
**Required:** TypeScript interfaces, proper prop typing

```typescript
// ✅ Correct: Component with proper typing
interface WorkflowStepProps {
  workflow: Workflow
  currentStep: WorkflowStep
  onStepComplete: (stepId: string) => void
  className?: string
}

export function WorkflowStep({ 
  workflow, 
  currentStep, 
  onStepComplete,
  className 
}: WorkflowStepProps) {
  // Component logic with proper typing
  return (
    <div className={cn('workflow-step', className)}>
      {/* Component content */}
    </div>
  )
}
```

## Testing Standards

### 1. Unit Test Pattern
**Required:** Comprehensive coverage with proper mocking

```typescript
// ✅ Correct: Unit test with dependency injection
describe('KeywordExpander', () => {
  let expander: KeywordExpander
  let mockDataForSEO: jest.Mocked<DataForSEOClient>
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    mockDataForSEO = createMockDataForSEOClient()
    mockLogger = createMockLogger()
    expander = new KeywordExpander(mockDataForSEO, mockLogger)
  })

  it('should expand seeds into longtails', async () => {
    // Arrange
    const seeds = [{ keyword: 'seo tools', search_volume: 1000 }]
    mockDataForSEO.getRelatedKeywords.mockResolvedValue(mockKeywords)

    // Act
    const result = await expander.expandSeeds(seeds)

    // Assert
    expect(result).toHaveLength(12) // 3 per seed
    expect(mockDataForSEO.getRelatedKeywords).toHaveBeenCalledTimes(1)
    expect(result[0].parent_seed_keyword_id).toBeDefined()
  })
})
```

### 2. Integration Test Pattern
**Required:** API endpoint testing with real database

```typescript
// ✅ Correct: Integration test
describe('POST /api/intent/workflows/[id]/steps/competitor-analyze', () => {
  let testWorkflow: Workflow
  let testUser: User

  beforeEach(async () => {
    testUser = await createTestUser()
    testWorkflow = await createTestWorkflow(testUser.organization_id)
  })

  it('should analyze competitors and extract keywords', async () => {
    const response = await fetch(`${API_URL}/intent/workflows/${testWorkflow.id}/steps/competitor-analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.auth_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        competitors: ['competitor1.com', 'competitor2.com']
      })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.data.keywords_extracted).toBeGreaterThan(0)
    
    // Verify database state
    const keywords = await getKeywordsForWorkflow(testWorkflow.id)
    expect(keywords).toHaveLength(6) // 3 per competitor
  })
})
```

### 3. E2E Test Pattern
**Required:** Complete workflow execution testing

```typescript
// ✅ Correct: E2E test
describe('Complete Workflow Execution', () => {
  it('should execute full workflow from ICP to articles', async () => {
    // Create test organization and user
    const org = await createTestOrganization()
    const user = await createTestUser(org.id)

    // Step 1: Generate ICP
    const workflow = await createWorkflow(org.id, {
      name: 'Test Workflow',
      icp_data: { business_description: 'SEO tools company' }
    })

    // Step 2: Analyze competitors
    await stepCompetitorAnalyze(workflow.id, ['moz.com', 'ahrefs.com'])
    
    // Step 3: Approve seeds
    await approveSeeds(workflow.id, user.id)
    
    // Continue through all steps...
    
    // Verify final state
    const finalState = await getWorkflowState(workflow.id)
    expect(finalState).toBe('completed')
  })
})
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Development with hot reload
npm run dev

# Run tests
npm run test
npm run test:integration
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### 2. Code Quality Gates
**Required:** All checks must pass before merge

```bash
# Pre-commit hooks (automatic)
npm run pre-commit-check

# Manual quality checks
npm run test:coverage    # Must maintain >90% coverage
npm run type-check       # Zero TypeScript errors
npm run lint            # Zero ESLint errors
npm run audit           # Zero security vulnerabilities
```

### 3. Database Changes
**Required:** Migration-first development

```bash
# Create new migration
npm run migration:create add_new_feature_table

# Write migration SQL in supabase/migrations/
# Test migration locally
npm run migration:test

# Apply migration
npm run migration:up

# Verify schema
npm run schema:verify
```

## Security Standards

### 1. Authentication & Authorization
**Required:** Proper user validation and organization isolation

```typescript
// ✅ Required pattern for all API routes
export async function secureApiHandler(request: NextRequest) {
  // 1. Authentication
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 2. Organization isolation
  const organizationId = currentUser.org_id
  // All queries must include organization_id filter

  // 3. Authorization (if needed)
  if (requiresAdmin && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Continue with business logic...
}
```

### 2. Input Validation
**Required:** Comprehensive validation with Zod schemas

```typescript
// ✅ Required validation pattern
const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  search_volume: z.number().min(0).optional(),
  competition_level: z.enum(['low', 'medium', 'high']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = requestSchema.parse(body)
    // Use validated data...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 })
    }
    throw error
  }
}
```

### 3. Audit Logging
**Required:** Complete action tracking

```typescript
// ✅ Required audit pattern
await logActionAsync({
  orgId: organizationId,
  userId: currentUser.id,
  action: 'workflow.step.completed',
  entityType: 'workflow',
  entityId: workflowId,
  details: { step: 'competitor-analysis', keywordCount: 6 },
  ipAddress: extractIpAddress(request.headers),
  userAgent: extractUserAgent(request.headers)
})
```

## Performance Standards

### 1. Database Optimization
**Required:** Efficient query patterns

```typescript
// ✅ Correct: Optimized query
const keywords = await supabase
  .from('keywords')
  .select('id, keyword, search_volume, competition_level')
  .eq('organization_id', organizationId)
  .eq('workflow_id', workflowId)
  .eq('longtail_status', 'completed')
  .order('search_volume', { ascending: false })
  .limit(50)

// ❌ Forbidden: Inefficient patterns
.select('*')  // Wildcard selection
.limit(1000) // Excessive data loading
```

### 2. Caching Strategy
**Required:** Intelligent result caching

```typescript
// ✅ Required caching pattern
export async function getWorkflowWithCache(workflowId: string) {
  const cacheKey = `workflow:${workflowId}`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch from database
  const workflow = await fetchWorkflow(workflowId)
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(workflow))
  
  return workflow
}
```

### 3. Error Handling
**Required:** Graceful degradation with proper logging

```typescript
// ✅ Required error handling pattern
export async function robustApiCall(request: NextRequest) {
  try {
    const result = await businessLogic(request)
    return NextResponse.json({ data: result, status: 'success' })
  } catch (error) {
    // Log full error for debugging
    console.error('API Error:', {
      error: error.message,
      stack: error.stack,
      userId: getCurrentUserId(),
      requestPath: request.url
    })
    
    // Return user-friendly error
    return NextResponse.json({ 
      error: 'Operation failed', 
      code: 'INTERNAL_ERROR' 
    }, { status: 500 })
  }
}
```

## Deployment Standards

### 1. Build Process
**Required:** Production-ready build

```bash
# Production build
npm run build

# Verify build
npm run build:verify

# Run production tests
npm run test:production
```

### 2. Environment Management
**Required:** Environment-specific configuration

```typescript
// ✅ Required environment pattern
const config = {
  databaseUrl: process.env.DATABASE_URL,
  dataforseoLogin: process.env.DATAFORSEO_LOGIN,
  isDevelopment: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
}

// Validate required environment
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required')
}
```

### 3. Monitoring Setup
**Required:** Comprehensive observability

```typescript
// ✅ Required monitoring pattern
export function setupMonitoring() {
  // Error tracking
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error)
    process.exit(1)
  })
  
  // Performance monitoring
  setupMetricsCollection()
  
  // Health checks
  setupHealthEndpoints()
}
```

## Code Review Standards

### 1. Review Checklist
**Required:** All items must be checked

- [ ] Code follows established patterns
- [ ] TypeScript compilation passes
- [ ] Tests have adequate coverage
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Migration scripts included (if needed)
- [ ] Error handling implemented
- [ ] Audit logging added
- [ ] Breaking changes documented

### 2. Review Process
```bash
# Create pull request
git push origin feature/new-feature-name
# Create PR on GitHub

# Automated checks run:
# - TypeScript compilation
# - Test suite execution
# - Code coverage analysis
# - Security vulnerability scan
# - Linting and formatting

# Manual review:
# - Architecture compliance
# - Business logic validation
# - Performance implications
# - Security assessment
```

## Troubleshooting Guide

### Common Issues

#### 1. FSM State Errors
```bash
# Check current workflow state
SELECT id, state FROM intent_workflows WHERE id = 'workflow-uuid';

# Verify state transition validity
SELECT * FROM workflow_state_transitions 
WHERE from_state = 'current_state' AND to_state = 'target_state';
```

#### 2. Database Connection Issues
```bash
# Check database connectivity
npm run db:check

# Verify RLS policies
npm run db:verify-rls

# Test query performance
npm run db:explain-query
```

#### 3. Test Failures
```bash
# Run specific test file
npm run test -- path/to/test.test.ts

# Run tests with coverage
npm run test:coverage

# Debug test failures
npm run test:debug
```

---

**Development Standards Status:** Production-Ready  
**Code Quality Grade:** A (Enterprise standards)  
**Testing Coverage:** 90%+ required  
**Security Compliance:** Full audit trail and isolation  
**Performance Grade:** A (Optimized patterns)
