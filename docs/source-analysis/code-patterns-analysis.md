# Code Patterns and Best Practices Analysis

## Overview

This document catalogs the architectural patterns, code conventions, and best practices used throughout the Infin8Content codebase. Understanding these patterns is essential for consistent development and maintaining code quality.

## Service Layer Pattern

### Service Class Structure

All business logic is encapsulated in service classes following a consistent pattern:

```typescript
// lib/services/intent-engine/keyword-expander.ts
export class KeywordExpander {
  private supabaseAdmin = supabaseAdmin
  private logger = logger
  
  async expandSeeds(
    workflowId: string,
    organizationId: string
  ): Promise<ExpansionResult> {
    try {
      // Validation
      this.validateInput(workflowId, organizationId)
      
      // Business logic
      const seeds = await this.loadSeeds(workflowId)
      const expanded = await this.expandWithRetry(seeds)
      
      // Persistence
      await this.storeResults(expanded, workflowId)
      
      // Logging
      this.logger.info('Expansion completed', { workflowId, count: expanded.length })
      
      return { success: true, count: expanded.length }
    } catch (error) {
      this.logger.error('Expansion failed', { workflowId, error })
      throw new ServiceError('Expansion failed', error)
    }
  }
  
  private validateInput(workflowId: string, organizationId: string): void {
    if (!workflowId || !organizationId) {
      throw new ValidationError('Missing required parameters')
    }
  }
  
  private async loadSeeds(workflowId: string): Promise<Keyword[]> {
    const { data, error } = await this.supabaseAdmin
      .from('keywords')
      .select('*')
      .eq('workflow_id', workflowId)
      .is('parent_seed_keyword_id', null)
    
    if (error) throw new DatabaseError(error.message)
    return data || []
  }
  
  private async expandWithRetry(seeds: Keyword[]): Promise<Keyword[]> {
    return retryWithBackoff(
      () => this.callDataForSEO(seeds),
      { maxAttempts: 3 }
    )
  }
  
  private async storeResults(
    keywords: Keyword[],
    workflowId: string
  ): Promise<void> {
    const { error } = await this.supabaseAdmin
      .from('keywords')
      .upsert(keywords.map(k => ({ ...k, workflow_id: workflowId })))
    
    if (error) throw new DatabaseError(error.message)
  }
}
```

### Key Characteristics
- **Single Responsibility**: Each service handles one domain
- **Dependency Injection**: Services receive dependencies
- **Error Handling**: Comprehensive try-catch with specific error types
- **Logging**: All operations logged for debugging
- **Type Safety**: Full TypeScript with strict mode
- **Testability**: Methods designed for unit testing

## API Route Pattern

### Consistent Route Structure

All API routes follow a standardized pattern:

```typescript
// app/api/intent/workflows/[workflow_id]/steps/expand/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { KeywordExpander } from '@/lib/services/intent-engine/keyword-expander'
import { logActionAsync } from '@/lib/services/intent-engine/intent-audit-logger'

export async function POST(
  request: Request,
  { params }: { params: { workflow_id: string } }
) {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Validation
    const { workflow_id } = params
    if (!workflow_id) {
      return NextResponse.json(
        { error: 'Missing workflow_id' },
        { status: 400 }
      )
    }

    // 3. Request parsing
    const body = await request.json()
    const validated = RequestSchema.parse(body)

    // 4. Service invocation
    const service = new KeywordExpander()
    const result = await service.expandSeeds(workflow_id, currentUser.org_id)

    // 5. Audit logging
    logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'workflow.longtail_expansion.started',
      details: { workflow_id, result },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers)
    })

    // 6. Response
    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Route Pattern Characteristics
- **Authentication First**: Check auth before processing
- **Parameter Validation**: Validate all inputs
- **Request Parsing**: Parse and validate request body
- **Service Delegation**: Delegate to service layer
- **Audit Logging**: Log all operations asynchronously
- **Error Handling**: Consistent error response format
- **Response Formatting**: Standardized response structure

## Error Handling Pattern

### Error Type Hierarchy

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, 500, details)
  }
}

export class ServiceError extends AppError {
  constructor(message: string, cause?: Error) {
    super('SERVICE_ERROR', message, 500, { cause: cause?.message })
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT_ERROR', message, 429)
  }
}
```

### Error Handling in Services

```typescript
async function processKeywords(keywords: Keyword[]): Promise<void> {
  try {
    // Main logic
    for (const keyword of keywords) {
      await processKeyword(keyword)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      logger.warn('Validation error', { error: error.message })
      throw error // Re-throw for caller to handle
    } else if (error instanceof DatabaseError) {
      // Handle database errors
      logger.error('Database error', { error: error.message })
      throw new ServiceError('Failed to process keywords', error)
    } else if (isTransientError(error)) {
      // Retry transient errors
      return retryWithBackoff(() => processKeywords(keywords))
    } else {
      // Unexpected errors
      logger.error('Unexpected error', { error })
      throw new ServiceError('Unexpected error', error)
    }
  }
}
```

### Error Response Formatting

```typescript
// lib/utils/api-error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 401 }
    )
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: 429 }
    )
  }

  // Log unexpected errors
  logger.error('Unexpected error', { error })

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    },
    { status: 500 }
  )
}
```

## Database Access Pattern

### Supabase Client Usage

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false }
  }
)
```

### RLS-Enforced Queries

```typescript
// All queries respect RLS policies
async function getKeywords(organizationId: string): Promise<Keyword[]> {
  const { data, error } = await supabaseAdmin
    .from('keywords')
    .select('*')
    .eq('organization_id', organizationId) // RLS enforces this
  
  if (error) throw new DatabaseError(error.message)
  return data || []
}
```

### Transaction Pattern

```typescript
async function updateWorkflowState(
  workflowId: string,
  newStatus: string
): Promise<void> {
  try {
    // Update workflow
    const { error: workflowError } = await supabaseAdmin
      .from('intent_workflows')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', workflowId)
    
    if (workflowError) throw workflowError

    // Log audit event
    const { error: auditError } = await supabaseAdmin
      .from('intent_audit_logs')
      .insert({
        workflow_id: workflowId,
        action: 'workflow.status_updated',
        details: { newStatus }
      })
    
    if (auditError) throw auditError
  } catch (error) {
    throw new DatabaseError('Failed to update workflow', error)
  }
}
```

## Retry Logic Pattern

### Exponential Backoff Implementation

```typescript
// lib/services/intent-engine/retry-utils.ts
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 2000,
    backoffMultiplier = 2,
    maxDelay = 32000,
    timeout = 300000 // 5 minutes
  } = options

  const startTime = Date.now()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new TimeoutError('Operation timeout exceeded')
      }

      return await operation()
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts
      const isTransient = isTransientError(error)

      if (isLastAttempt || !isTransient) {
        throw error
      }

      // Calculate backoff delay
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      )

      logger.info('Retrying operation', {
        attempt,
        nextAttempt: attempt + 1,
        delay,
        error: error.message
      })

      await sleep(delay)
    }
  }
}

function isTransientError(error: any): boolean {
  // Transient errors that should be retried
  return (
    error.status === 429 || // Rate limit
    error.status === 503 || // Service unavailable
    error.status === 504 || // Gateway timeout
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  )
}
```

## Testing Pattern

### Unit Test Structure

```typescript
// __tests__/services/intent-engine/keyword-expander.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KeywordExpander } from '@/lib/services/intent-engine/keyword-expander'

describe('KeywordExpander', () => {
  let service: KeywordExpander

  beforeEach(() => {
    service = new KeywordExpander()
    // Mock dependencies
    vi.mock('@/lib/supabase/server')
  })

  it('should expand seed keywords successfully', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const organizationId = 'test-org-id'
    const mockSeeds = [
      { id: '1', keyword: 'content marketing', search_volume: 1000 }
    ]

    // Act
    const result = await service.expandSeeds(workflowId, organizationId)

    // Assert
    expect(result.success).toBe(true)
    expect(result.count).toBeGreaterThan(0)
  })

  it('should handle validation errors', async () => {
    // Arrange
    const invalidWorkflowId = ''

    // Act & Assert
    expect(() => service.expandSeeds(invalidWorkflowId, 'org-id'))
      .toThrow(ValidationError)
  })

  it('should retry on transient errors', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    let attemptCount = 0

    // Mock operation that fails twice then succeeds
    const operation = vi.fn().mockImplementation(() => {
      attemptCount++
      if (attemptCount < 3) {
        const error = new Error('Service unavailable')
        error.status = 503
        throw error
      }
      return Promise.resolve({ success: true })
    })

    // Act
    const result = await retryWithBackoff(operation)

    // Assert
    expect(result.success).toBe(true)
    expect(operation).toHaveBeenCalledTimes(3)
  })
})
```

### Integration Test Structure

```typescript
// __tests__/api/intent/workflows/expand.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app'

describe('POST /api/intent/workflows/[id]/steps/expand', () => {
  let token: string
  let workflowId: string

  beforeEach(async () => {
    // Setup: Create test user and workflow
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
    
    token = authResponse.body.token
    
    const workflowResponse = await request(app)
      .post('/api/intent/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Workflow' })
    
    workflowId = workflowResponse.body.data.id
  })

  it('should expand keywords for valid workflow', async () => {
    const response = await request(app)
      .post(`/api/intent/workflows/${workflowId}/steps/expand`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.data.success).toBe(true)
    expect(response.body.data.count).toBeGreaterThan(0)
  })

  it('should return 401 for unauthenticated request', async () => {
    await request(app)
      .post(`/api/intent/workflows/${workflowId}/steps/expand`)
      .expect(401)
  })

  it('should return 404 for non-existent workflow', async () => {
    await request(app)
      .post('/api/intent/workflows/non-existent/steps/expand')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })
})
```

## Type Definition Pattern

### Interface Organization

```typescript
// types/keyword.ts
export interface Keyword {
  id: UUID
  organization_id: UUID
  competitor_url_id?: UUID
  parent_seed_keyword_id?: UUID
  
  keyword: string
  seed_keyword?: string
  
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: decimal
  
  longtail_status: WorkflowStatus
  subtopics_status: WorkflowStatus
  article_status: WorkflowStatus
  
  subtopics?: Subtopic[]
  embedding?: Vector
  
  created_at: timestamp
  updated_at: timestamp
}

export type WorkflowStatus = 'not_started' | 'in_progress' | 'completed' | 'failed'

export interface Subtopic {
  title: string
  type: SubtopicType
  keywords: string[]
  search_volume?: number
  difficulty?: number
  intent?: SearchIntent
}

export type SubtopicType = 'how-to' | 'comparison' | 'guide' | 'faq' | 'news'
export type SearchIntent = 'informational' | 'commercial' | 'transactional'
```

## Logging Pattern

### Structured Logging

```typescript
// lib/utils/logger.ts
export class Logger {
  info(message: string, context?: Record<string, any>): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...context
    }))
  }

  error(message: string, context?: Record<string, any>): void {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      ...context
    }))
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...context
    }))
  }
}

// Usage
logger.info('Operation completed', {
  workflowId,
  duration: endTime - startTime,
  itemsProcessed: count
})
```

## Async Processing Pattern

### Inngest Job Pattern

```typescript
// lib/inngest/functions/generate-article.ts
export const generateArticle = inngest.createFunction(
  { id: 'generate-article' },
  { event: 'article/generate.requested' },
  async ({ event, step }) => {
    const { articleId, workflowId } = event.data

    // Step 1: Load article
    const article = await step.run('load-article', async () => {
      return await loadArticle(articleId)
    })

    // Step 2: Generate content
    const content = await step.run('generate-content', async () => {
      return await generateContent(article)
    })

    // Step 3: Validate quality
    const quality = await step.run('validate-quality', async () => {
      return await validateQuality(content)
    })

    // Step 4: Store result
    await step.run('store-result', async () => {
      return await storeArticle(articleId, content, quality)
    })

    return { success: true, articleId }
  }
)
```

## Configuration Pattern

### Environment Variables

```typescript
// lib/config/index.ts
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.API_TIMEOUT || '30000')
  },

  // Database Configuration
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  // External Services
  services: {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1'
    },
    dataforseo: {
      username: process.env.DATAFORSEO_USERNAME,
      password: process.env.DATAFORSEO_PASSWORD
    },
    tavily: {
      apiKey: process.env.TAVILY_API_KEY
    }
  },

  // Feature Flags
  features: {
    enableIntentEngine: process.env.ENABLE_INTENT_ENGINE === 'true',
    enableAdvancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true'
  }
}
```

## Naming Conventions

### File Naming
- **Services**: kebab-case with -service suffix
  - `keyword-expander.ts`
  - `article-generator.ts`
  - `quality-checker.ts`

- **Components**: PascalCase with .tsx extension
  - `KeywordList.tsx`
  - `WorkflowDashboard.tsx`

- **Types**: PascalCase with .ts extension
  - `Keyword.ts`
  - `Workflow.ts`

- **Tests**: Same as source with .test.ts suffix
  - `keyword-expander.test.ts`
  - `KeywordList.test.tsx`

### Variable Naming
- **Constants**: UPPER_SNAKE_CASE
  - `MAX_RETRY_ATTEMPTS = 3`
  - `DEFAULT_PAGE_SIZE = 50`

- **Functions**: camelCase
  - `expandKeywords()`
  - `validateInput()`

- **Classes**: PascalCase
  - `KeywordExpander`
  - `ArticleGenerator`

- **Database**: snake_case
  - `intent_workflows`
  - `article_progress`

## Code Organization

### Directory Structure
```
lib/
├── services/
│   ├── intent-engine/      # Workflow orchestration
│   ├── article-generation/ # Content creation
│   ├── keyword-engine/     # SEO intelligence
│   └── external/           # Third-party integrations
├── supabase/               # Database utilities
├── utils/                  # Helper functions
└── config/                 # Configuration

app/
├── api/                    # API routes
├── dashboard/              # Dashboard pages
└── auth/                   # Authentication pages

components/
├── ui/                     # Reusable UI components
├── forms/                  # Form components
└── charts/                 # Chart components

__tests__/
├── services/               # Service tests
├── api/                    # API tests
└── components/             # Component tests
```

## Performance Patterns

### Caching Pattern
```typescript
const cache = new Map<string, CacheEntry>()

async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600000 // 1 hour
): Promise<T> {
  const cached = cache.get(key)
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }
  
  const data = await fetcher()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

### Batch Processing Pattern
```typescript
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    )
    results.push(...batchResults)
  }
  
  return results
}
```

## Summary

The Infin8Content codebase follows consistent patterns across all layers:
- **Service Layer**: Encapsulated business logic with error handling
- **API Routes**: Standardized authentication, validation, and response formatting
- **Error Handling**: Type-safe error hierarchy with appropriate HTTP status codes
- **Database**: RLS-enforced queries with transaction support
- **Testing**: Comprehensive unit and integration tests
- **Logging**: Structured logging for debugging and monitoring
- **Configuration**: Environment-based configuration management
- **Naming**: Consistent conventions across all code types

These patterns ensure maintainability, testability, and consistency throughout the codebase.
