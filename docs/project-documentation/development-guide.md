# Infin8Content Development Guide

*Last Updated: 2026-02-20*  
*System Version: v2.1.0 - Zero-Legacy FSM Architecture*

## Overview

This guide covers development patterns, setup instructions, and best practices for contributing to the Infin8Content platform. It's designed for developers of all skill levels to get started quickly and maintain high code quality in a production-ready, zero-legacy FSM architecture.

## Prerequisites

### Required Software
- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **PostgreSQL**: 15.x (via Supabase)
- **Git**: 2.x or later

### Development Tools
- **VS Code**: Recommended IDE with extensions
- **Supabase CLI**: For database management
- **Vercel CLI**: For deployment

## Project Setup

### 1. Clone Repository
```bash
git clone https://github.com/dvernon0786/Infin8Content.git
cd Infin8Content
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
# - Supabase URL and anon key
# - OpenRouter API key
# - DataForSEO credentials
# - Inngest event key
```

### 4. Database Setup
```bash
# Start Supabase local development
supabase start

# Apply migrations
supabase db push

# Seed test data (optional)
supabase db seed
```

### 5. Start Development Server
```bash
npm run dev
```

## Architecture Overview

### Zero-Legacy FSM Design
The Infin8Content platform uses a deterministic Finite State Machine (FSM) architecture with zero legacy patterns:

- **Single State Enum**: No `status`, `current_step`, or `step_*_completed_at` columns
- **Atomic Transitions**: Database-level WHERE clause protection
- **Centralized Control**: All state changes through `WorkflowFSM.transition()`
- **Event-Driven**: Inngest functions handle background automation

### Core Directory Structure
```
infin8content/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── intent/workflows/     # Workflow endpoints
│   │   ├── keywords/             # Keyword management
│   │   └── articles/             # Article generation
│   ├── workflows/                # Workflow UI pages
│   └── (auth)/                   # Authentication pages
├── lib/                          # Shared libraries
│   ├── fsm/                      # FSM implementation
│   ├── services/                 # Business logic services
│   ├── inngest/                  # Background jobs
│   └── guards/                   # Access control
├── components/                   # React components
│   ├── workflows/                # Workflow components
│   ├── ui/                       # Design system
│   └── forms/                    # Form components
├── types/                        # TypeScript definitions
├── __tests__/                    # Test suites
└── supabase/migrations/          # Database migrations
```

## Development Patterns

### 1. FSM State Management

#### State Transitions
```typescript
// ✅ Correct pattern
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'

// Validate current state
if (workflow.state !== 'step_3_seeds') {
  return NextResponse.json({ error: 'Invalid state' }, { status: 409 })
}

// Execute side effects
const result = await service.process(request)

// Transition state ONLY after success
const transitionResult = await transitionWithAutomation(workflowId, 'SEEDS_APPROVED', userId)

// Handle concurrent requests
if (!transitionResult) {
  return NextResponse.json({ message: 'Already processed' }, { status: 200 })
}
```

#### ❌ Forbidden Patterns
```typescript
// ❌ NEVER use direct FSM
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'

// ❌ NEVER use legacy fields
workflow.status
workflow.current_step
workflow.step_*_completed_at

// ❌ NEVER direct database updates
await supabase.from('intent_workflows').update({ state: 'step_4_longtails' })
```

### 2. Service Layer Pattern

#### Service Structure
```typescript
// lib/services/example/service-processor.ts
export class ServiceProcessor {
  constructor(
    private supabase: SupabaseClient,
    private logger: Logger
  ) {}

  async process(workflowId: string): Promise<ProcessResult> {
    try {
      // 1. Validate workflow state
      const workflow = await this.validateWorkflow(workflowId)
      
      // 2. Execute business logic
      const result = await this.executeLogic(workflow)
      
      // 3. Update database
      await this.updateDatabase(workflowId, result)
      
      // 4. Log success
      this.logger.info('Service completed', { workflowId, result })
      
      return result
    } catch (error) {
      this.logger.error('Service failed', { workflowId, error })
      throw error
    }
  }

  private async validateWorkflow(workflowId: string) {
    const { data, error } = await this.supabase
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', workflowId)
      .single()
    
    if (error || !data) {
      throw new Error('Workflow not found')
    }
    
    return data
  }
}
```

### 3. API Route Pattern

#### Route Structure
```typescript
// app/api/example/[id]/route.ts
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceProcessor } from '@/lib/services/example'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Parse request
    const body = await request.json()
    const { workflowId } = body

    // 3. Validate workflow state
    const workflow = await getWorkflow(workflowId)
    if (workflow.state !== 'expected_state') {
      return NextResponse.json({ error: 'Invalid workflow state' }, { status: 409 })
    }

    // 4. Execute service
    const processor = createServiceProcessor()
    const result = await processor.process(workflowId)

    // 5. Return response
    return NextResponse.json({ data: result, success: true })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4. Database Query Patterns

#### Safe Query Pattern
```typescript
// ✅ Explicit field selection
const { data, error } = await supabase
  .from('keywords')
  .select('id, keyword, search_volume, longtail_status')
  .eq('organization_id', orgId)
  .eq('longtail_status', 'not_started')

// ✅ Organization isolation
const { data, error } = await supabase
  .from('intent_workflows')
  .select('id, state, name')
  .eq('organization_id', orgId)
  .eq('state', 'step_3_seeds')
```

#### ❌ Unsafe Patterns
```typescript
// ❌ Wildcard selects
.select('*')

// ❌ No organization filter
.eq('workflow_id', workflowId)

// ❌ Legacy field references
.select('status, current_step')
```

### 5. Component Patterns

#### Workflow Component Structure
```typescript
// components/workflows/example/ExampleComponent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useWorkflowState } from '@/hooks/use-workflow-state'

interface ExampleComponentProps {
  workflowId: string
}

export function ExampleComponent({ workflowId }: ExampleComponentProps) {
  const { workflow, isLoading } = useWorkflowState(workflowId)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'example' })
      })
      
      if (!response.ok) {
        throw new Error('Action failed')
      }
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Example Component</h3>
      <p>Current state: {workflow?.state}</p>
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isProcessing ? 'Processing...' : 'Execute Action'}
      </button>
    </div>
  )
}
```

## Testing Strategy

### 1. Unit Tests

#### Service Testing
```typescript
// __tests__/services/example/service-processor.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceProcessor } from '@/lib/services/example/service-processor'

describe('ServiceProcessor', () => {
  let processor: ServiceProcessor
  let mockSupabase: any
  let mockLogger: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: '123', state: 'step_1_icp' }, error: null }))
          }))
        }))
      }))
    }
    
    mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    }

    processor = new ServiceProcessor(mockSupabase, mockLogger)
  })

  it('should process workflow successfully', async () => {
    const result = await processor.process('workflow-123')
    
    expect(result).toBeDefined()
    expect(mockLogger.info).toHaveBeenCalledWith('Service completed', expect.any(Object))
  })
})
```

### 2. Integration Tests

#### API Testing
```typescript
// __tests__/api/workflows/workflow-step.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from '@/app/test-helpers'

describe('Workflow Step API', () => {
  let app: any

  beforeEach(() => {
    app = createApp()
  })

  it('should execute workflow step', async () => {
    const response = await app.request('/api/workflows/123/step', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ action: 'execute' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

### 3. E2E Tests

#### Workflow Testing
```typescript
// tests/e2e/workflow-execution.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Workflow Execution', () => {
  test('should complete full workflow', async ({ page }) => {
    await page.goto('/workflows')
    
    // Create new workflow
    await page.click('[data-testid="create-workflow"]')
    await page.fill('[data-testid="workflow-name"]', 'Test Workflow')
    await page.click('[data-testid="create-button"]')
    
    // Execute steps
    await expect(page.locator('[data-testid="workflow-state"]')).toContainText('step_1_icp')
    
    // Continue through workflow...
  })
})
```

## Code Quality Standards

### 1. TypeScript Configuration

#### Strict Type Safety
```typescript
// ✅ Explicit types
interface WorkflowState {
  id: string
  state: WorkflowStateEnum
  organization_id: string
  name: string
}

// ✅ Type guards
function isValidWorkflowState(state: string): state is WorkflowStateEnum {
  return ['step_1_icp', 'step_2_competitors', ...].includes(state)
}
```

### 2. Error Handling

#### Structured Error Handling
```typescript
// ✅ Proper error handling
try {
  const result = await service.process()
  return result
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.details },
      { status: 400 }
    )
  }
  
  logger.error('Unexpected error', { error, context })
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### 3. Logging Standards

#### Structured Logging
```typescript
// ✅ Structured logging
logger.info('Workflow step completed', {
  workflowId,
  step: 'step_3_seeds',
  duration: 1500,
  keywordsGenerated: 25
})

// ❌ Unstructured logging
console.log('Workflow completed')
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs
OPENROUTER_API_KEY=your-openrouter-key
DATAFORSEO_LOGIN=your-dataforseo-login
DATAFORSEO_PASSWORD=your-dataforseo-password
TAVILY_API_KEY=your-tavily-key

# Background Jobs
INNGEST_EVENT_KEY=your-inngest-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Development
NODE_ENV=development
```

## Deployment

### 1. Local Development
```bash
# Start development server
npm run dev

# Start Inngest dev server
npm run inngest:dev
```

### 2. Production Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Apply database migrations
supabase db push
```

## Troubleshooting

### Common Issues

#### FSM State Errors
```bash
# Check current workflow state
SELECT id, state FROM intent_workflows WHERE id = 'workflow-id';

# Verify state constraints
SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'intent_workflows';
```

#### Database Connection Issues
```bash
# Check Supabase status
supabase status

# Reset local database
supabase db reset
```

#### External API Failures
```bash
# Test DataForSEO connection
curl -X POST https://api.dataforseo.com/v3/... \
  -H "Authorization: Basic base64(login:password)"

# Check OpenRouter API key
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer your-api-key"
```

## Contributing Guidelines

### 1. Code Review Process
- All PRs require code review
- Automated tests must pass
- Documentation updates required for API changes
- FSM patterns must be followed

### 2. Commit Message Format
```
type(scope): description

feat(workflows): add new workflow step
fix(api): resolve authentication issue
docs(readme): update setup instructions
```

### 3. Branch Naming
```
feature/description
bugfix/description
hotfix/description
```

This development guide provides comprehensive patterns and practices for contributing to the Infin8Content platform while maintaining its zero-legacy FSM architecture and production-grade quality standards.
```

### 3. Environment Setup
```bash
cp infin8content/.env.example infin8content/.env.local
```

Configure the following environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External Services
OPENROUTER_API_KEY=your_openrouter_key
TAVILY_API_KEY=your_tavily_key
DATAFORSEO_API_KEY=your_dataforseo_key
STRIPE_SECRET_KEY=your_stripe_key

# Development
NODE_ENV=development
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Start local development database
supabase start

# Run migrations
supabase db push
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Code Organization

### Directory Structure
```
infin8content/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── forms/            # Form components
│   └── charts/           # Chart components
├── lib/                   # Utility libraries
│   ├── services/         # Business logic services
│   ├── utils/            # Helper functions
│   └── hooks/            # Custom React hooks
├── types/                # TypeScript type definitions
├── __tests__/            # Test files
├── supabase/             # Database migrations and functions
└── docs/                 # Documentation
```

### Feature-Based Organization
Code is organized by feature/domain:
- **Intent Engine**: `lib/services/intent-engine/`
- **Article Generation**: `lib/services/article-generation/`
- **Keyword Research**: `lib/services/keyword-engine/`
- **User Management**: `lib/services/user-management/`

## Development Patterns

### 1. Service Layer Pattern
Business logic is encapsulated in service classes:

```typescript
// lib/services/intent-engine/keyword-expander.ts
export class KeywordExpander {
  async expandSeeds(workflowId: string): Promise<ExpansionResult> {
    // Business logic implementation
  }
}
```

### 2. API Route Pattern
API routes follow consistent patterns:

```typescript
// app/api/intent/workflows/[workflow_id]/steps/expand/route.ts
export async function POST(
  request: Request,
  { params }: { params: { workflow_id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    const service = new KeywordExpander()
    const result = await service.expandSeeds(params.workflow_id)
    
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 3. Database Access Pattern
Database operations use the Supabase client with RLS:

```typescript
import { supabaseAdmin } from '@/lib/supabase/server'

async function getWorkflow(workflowId: string) {
  const { data, error } = await supabaseAdmin
    .from('intent_workflows')
    .select('*')
    .eq('id', workflowId)
    .single()
    
  if (error) throw new DatabaseError(error)
  return data
}
```

### 4. Error Handling Pattern
Consistent error handling across the application:

```typescript
// lib/utils/errors.ts
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 }
    )
  }
  // ... other error types
}
```

## Testing Strategy

### 1. Unit Tests
Test business logic in isolation:

```typescript
// __tests__/services/intent-engine/keyword-expander.test.ts
describe('KeywordExpander', () => {
  it('should expand seed keywords successfully', async () => {
    const service = new KeywordExpander()
    const result = await service.expandSeeds('workflow-id')
    
    expect(result.seedsProcessed).toBe(3)
    expect(result.longtailsCreated).toBe(9)
  })
})
```

### 2. Integration Tests
Test API endpoints with database:

```typescript
// __tests__/api/intent/workflows/expand.test.ts
describe('POST /api/intent/workflows/[id]/steps/expand', () => {
  it('should expand keywords for valid workflow', async () => {
    const response = await request(app)
      .post('/api/intent/workflows/test-id/steps/expand')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      
    expect(response.body.status).toBe('completed')
  })
})
```

### 3. E2E Tests
Test complete user journeys:

```typescript
// tests/e2e/workflow-completion.spec.ts
test('complete workflow from start to finish', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('[data-testid="create-workflow"]')
  // ... complete workflow steps
})
```

## Code Quality Standards

### 1. TypeScript Usage
- Strict TypeScript configuration
- Proper type definitions for all functions
- Interface definitions for data structures
- Generic types for reusable components

### 2. ESLint Configuration
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### 3. Code Formatting
- Prettier for consistent formatting
- 2-space indentation
- Single quotes for strings
- Trailing commas for multi-line structures

### 4. Naming Conventions
- **Files**: kebab-case (`keyword-expander.ts`)
- **Components**: PascalCase (`KeywordExpander`)
- **Functions**: camelCase (`expandSeeds`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Database**: snake_case (`intent_workflows`)

## Database Development

### 1. Migration Pattern
All schema changes use migrations:

```sql
-- supabase/migrations/20260201_add_new_table.sql
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... columns
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

### 2. RLS Policy Pattern
Consistent Row Level Security policies:

```sql
CREATE POLICY table_name_org_access ON table_name
  FOR ALL
  USING (organization_id = public.get_auth_user_org_id())
  WITH CHECK (organization_id = public.get_auth_user_org_id());
```

### 3. Database Functions
Reusable database functions:

```sql
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_org_id UUID;
BEGIN
  -- Implementation
  RETURN user_org_id;
END;
$$;
```

## API Development

### 1. Route Structure
API routes follow RESTful patterns:

```
GET    /api/intent/workflows           # List workflows
POST   /api/intent/workflows           # Create workflow
GET    /api/intent/workflows/[id]      # Get workflow
PUT    /api/intent/workflows/[id]      # Update workflow
DELETE /api/intent/workflows/[id]      # Delete workflow
```

### 2. Request Validation
Input validation using schemas:

```typescript
import { z } from 'zod'

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = CreateWorkflowSchema.parse(body)
  // ... process validated data
}
```

### 3. Response Formatting
Consistent response structure:

```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-01T10:00:00Z",
    "version": "v1"
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

## External Service Integration

### 1. Client Pattern
Consistent client implementation:

```typescript
// lib/services/external/openrouter-client.ts
export class OpenRouterClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://openrouter.ai/api/v1'
  }

  async generateContent(prompt: string): Promise<GenerationResult> {
    // Implementation with retry logic
  }
}
```

### 2. Error Handling
Robust error handling for external services:

```typescript
async function callExternalService() {
  try {
    const response = await client.request()
    return response.data
  } catch (error) {
    if (error.status === 429) {
      throw new RateLimitError('Service rate limit exceeded')
    }
    throw new ExternalServiceError('Service unavailable')
  }
}
```

### 3. Retry Logic
Exponential backoff for transient failures:

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxAttempts) throw error
      
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

## Performance Optimization

### 1. Database Optimization
- Proper indexing for frequent queries
- Connection pooling
- Query optimization with EXPLAIN ANALYZE

### 2. Caching Strategy
- Redis for session storage
- Application-level caching for API responses
- CDN for static assets

### 3. Bundle Optimization
- Code splitting with Next.js
- Tree shaking for unused code
- Image optimization with next/image

## Security Best Practices

### 1. Authentication
- JWT tokens with proper expiration
- Secure cookie handling
- Multi-factor authentication support

### 2. Authorization
- Role-based access control (RBAC)
- Feature flagging for subscription tiers
- Organization-based data isolation

### 3. Data Protection
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection with proper escaping

### 4. API Security
- Rate limiting per organization
- CORS configuration
- HTTPS enforcement

## Deployment Process

### 1. Development Deployment
```bash
# Run tests
npm run test

# Build application
npm run build

# Deploy to Vercel
vercel --preview
```

### 2. Production Deployment
```bash
# Create pull request
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Merge after review and automated tests pass
# Automatic deployment to production
```

### 3. Environment Management
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Live environment with monitoring

## Monitoring and Observability

### 1. Error Tracking
- Sentry for error monitoring
- Custom error logging
- Performance metrics collection

### 2. Performance Monitoring
- Core Web Vitals tracking
- API response time monitoring
- Database query performance

### 3. User Analytics
- Feature usage tracking
- User journey analysis
- Conversion funnel monitoring

## Contributing Guidelines

### 1. Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description
5. Code review and approval
6. Merge to main

### 2. Code Review Checklist
- [ ] Tests pass for new functionality
- [ ] Code follows project patterns
- [ ] Documentation is updated
- [ ] No breaking changes without version bump
- [ ] Security considerations addressed

### 3. Release Process
1. Update version numbers
2. Create release notes
3. Tag release in Git
4. Deploy to production
5. Monitor for issues

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check Supabase status
supabase status

# Reset local database
supabase db reset
```

#### External Service Failures
```bash
# Check API keys in environment
echo $OPENROUTER_API_KEY

# Test service connectivity
curl -X POST https://openrouter.ai/api/v1/chat/completions
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Debugging Tools
- **VS Code Debugger**: Built-in debugging
- **Browser DevTools**: Client-side debugging
- **Supabase Dashboard**: Database debugging
- **Sentry Dashboard**: Error monitoring

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools and Libraries
- [Zod](https://zod.dev/) - Schema validation
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Playwright](https://playwright.dev/) - E2E testing

### Community
- [GitHub Discussions](https://github.com/your-org/infin8content/discussions)
- [Discord Community](https://discord.gg/infin8content)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/infin8content)
