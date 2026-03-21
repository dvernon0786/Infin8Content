# Infin8Content - Complete Development Guide

**Generated:** February 13, 2026  
**Version:** v2.2  
**Scope:** Complete development setup, patterns, and best practices

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** 18+ (recommended 20+)
- **PostgreSQL:** 14+ (via Supabase)
- **Git:** Latest version
- **IDE:** VS Code (recommended) with extensions

### Environment Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Infin8Content
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install application dependencies
cd infin8content
npm install

# Install development dependencies
npm install --save-dev @types/node @types/react @types/react-dom
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp infin8content/.env.example infin8content/.env.local

# Edit environment variables
nano infin8content/.env.local
```

#### 4. Required Environment Variables
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# External APIs
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password
OPENROUTER_API_KEY=your_openrouter_key
TAVILY_API_KEY=your_tavily_key
PERPLEXITY_API_KEY=your_perplexity_key

# Email Service
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME="Infin8Content"

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Payment
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### 5. Database Setup
```bash
# Link to Supabase project (if using hosted)
cd infin8content
supabase link --project-ref <project-ref>

# Run migrations
supabase db reset

# Generate TypeScript types
npx tsx scripts/generate-types.ts
```

#### 6. Start Development Server
```bash
cd infin8content
npm run dev
```

**Access:** http://localhost:3000

---

## 🏗️ Project Structure

### Directory Layout
```
Infin8Content/
├── infin8content/                    # Main application
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Auth routes
│   │   ├── (dashboard)/             # Dashboard routes
│   │   ├── api/                     # API routes
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Home page
│   ├── components/                  # React components
│   │   ├── ui/                      # UI components
│   │   ├── dashboard/               # Dashboard components
│   │   ├── auth/                    # Auth components
│   │   └── forms/                   # Form components
│   ├── lib/                         # Library code
│   │   ├── services/                # Business logic services
│   │   ├── utils/                   # Utility functions
│   │   ├── hooks/                   # React hooks
│   │   ├── supabase/                # Database client
│   │   └── types/                   # TypeScript types
│   ├── __tests__/                   # Test files
│   ├── public/                      # Static assets
│   ├── styles/                      # Style files
│   └── scripts/                     # Build scripts
├── supabase/                        # Database schema
│   ├── migrations/                  # Database migrations
│   ├── functions/                   # Edge functions
│   └── seed.sql                     # Seed data
├── docs/                            # Documentation
├── tests/                           # Integration tests
└── scripts/                         # Utility scripts
```

### Key Files Overview

#### Configuration Files
- **`next.config.ts`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`vitest.config.ts`** - Test configuration
- **`playwright.config.ts`** - E2E test configuration
- **`tsconfig.json`** - TypeScript configuration

#### Core Application Files
- **`app/layout.tsx`** - Root layout component
- **`app/middleware.ts`** - Request middleware
- **`lib/supabase/server.ts`** - Database client
- **`lib/services/`** - Business logic services
- **`components/ui/`** - Reusable UI components

---

## 🔧 Development Patterns

### Service Pattern

#### Service Structure
```typescript
// lib/services/example-service.ts
export interface ExampleService {
  methodName(params: ServiceParams): Promise<ServiceResult>
}

export class ExampleServiceImpl implements ExampleService {
  async methodName(params: ServiceParams): Promise<ServiceResult> {
    // 1. Validate input
    const validatedParams = this.validateParams(params)
    
    // 2. Execute business logic
    const result = await this.executeLogic(validatedParams)
    
    // 3. Return result
    return result
  }
  
  private validateParams(params: any): ServiceParams {
    // Input validation logic
  }
  
  private async executeLogic(params: ServiceParams): Promise<ServiceResult> {
    // Core business logic
  }
}

// Singleton export
export const exampleService = new ExampleServiceImpl()
```

#### Service Usage Pattern
```typescript
// In API routes or other services
import { exampleService } from '@/lib/services/example-service'

export async function POST(request: Request) {
  const result = await exampleService.methodName(params)
  return NextResponse.json(result)
}
```

### API Route Pattern

#### Standard API Route
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/server'
import { exampleService } from '@/lib/services/example-service'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const validatedBody = validateRequest(body)

    // 3. Execute business logic
    const result = await exampleService.methodName({
      ...validatedBody,
      organizationId: currentUser.org_id,
      userId: currentUser.id
    })

    // 4. Return response
    return NextResponse.json({
      data: result,
      message: 'Operation successful'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function validateRequest(body: any): RequestType {
  // Zod schema validation
  return requestSchema.parse(body)
}
```

### Component Pattern

#### UI Component Structure
```typescript
// components/ui/example-component.tsx
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ExampleComponentProps {
  className?: string
  data: ComponentData
  onDataChange?: (data: ComponentData) => void
}

export function ExampleComponent({
  className,
  data,
  onDataChange
}: ExampleComponentProps) {
  const [localData, setLocalData] = useState(data)

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const handleChange = (newData: ComponentData) => {
    setLocalData(newData)
    onDataChange?.(newData)
  }

  return (
    <div className={cn('example-component', className)}>
      {/* Component content */}
    </div>
  )
}
```

#### Feature Component Pattern
```typescript
// components/dashboard/workflow-card.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Workflow } from '@/types/workflow'

interface WorkflowCardProps {
  workflow: Workflow
  onStart: (workflowId: string) => void
  onEdit: (workflowId: string) => void
}

export function WorkflowCard({ workflow, onStart, onEdit }: WorkflowCardProps) {
  return (
    <Card className="workflow-card">
      <CardHeader>
        <CardTitle>{workflow.title}</CardTitle>
        <Badge variant={getStatusVariant(workflow.state)}>
          {workflow.state}
        </Badge>
      </CardHeader>
      <CardContent>
        <p>{workflow.description}</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onStart(workflow.id)}>
            Start
          </Button>
          <Button variant="outline" onClick={() => onEdit(workflow.id)}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(state: string): 'default' | 'secondary' | 'destructive' {
  switch (state) {
    case 'completed': return 'default'
    case 'failed': return 'destructive'
    default: return 'secondary'
  }
}
```

### Database Pattern

#### Database Client Usage
```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export function createClientClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    }
  )
}
```

#### Database Query Pattern
```typescript
// lib/services/database-service.ts
import { createServiceRoleClient } from '@/lib/supabase/server'

export class DatabaseService {
  private supabase = createServiceRoleClient()

  async getWorkflowById(
    workflowId: string,
    organizationId: string
  ): Promise<Workflow | null> {
    const { data, error } = await this.supabase
      .from('intent_workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return null
    }

    return data
  }

  async createWorkflow(
    workflow: CreateWorkflowRequest,
    organizationId: string
  ): Promise<Workflow> {
    const { data, error } = await this.supabase
      .from('intent_workflows')
      .insert({
        ...workflow,
        organization_id: organizationId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`)
    }

    return data
  }

  async updateWorkflow(
    workflowId: string,
    organizationId: string,
    updates: Partial<Workflow>
  ): Promise<Workflow> {
    const { data, error } = await this.supabase
      .from('intent_workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`)
    }

    return data
  }
}
```

---

## 🧪 Testing Strategy

### Test Structure
```
__tests__/
├── unit/                    # Unit tests
│   ├── services/            # Service tests
│   ├── utils/               # Utility tests
│   └── components/          # Component tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   ├── database/            # Database tests
│   └── external/            # External service tests
├── e2e/                     # End-to-end tests
│   ├── workflows/           # Workflow tests
│   ├── auth/                # Authentication tests
│   └── publishing/          # Publishing tests
└── contracts/               # Contract tests
    ├── openrouter/          # OpenRouter API tests
    ├── dataforseo/          # DataForSEO API tests
    └── tavily/              # Tavily API tests
```

### Unit Testing Pattern

#### Service Test
```typescript
// __tests__/services/example-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exampleService } from '@/lib/services/example-service'

describe('ExampleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('methodName', () => {
    it('should return valid result for valid input', async () => {
      // Arrange
      const input = { param1: 'value1', param2: 'value2' }
      
      // Act
      const result = await exampleService.methodName(input)
      
      // Assert
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('expectedField')
    })

    it('should throw error for invalid input', async () => {
      // Arrange
      const input = { param1: '', param2: 'value2' }
      
      // Act & Assert
      await expect(exampleService.methodName(input))
        .rejects.toThrow('Invalid input')
    })
  })
})
```

#### Component Test
```typescript
// __tests__/components/example-component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ExampleComponent } from '@/components/ui/example-component'

describe('ExampleComponent', () => {
  it('should render component with props', () => {
    const mockData = { field1: 'value1', field2: 'value2' }
    
    render(<ExampleComponent data={mockData} />)
    
    expect(screen.getByText('value1')).toBeInTheDocument()
    expect(screen.getByText('value2')).toBeInTheDocument()
  })

  it('should call onDataChange when data changes', () => {
    const mockOnChange = vi.fn()
    const mockData = { field1: 'value1', field2: 'value2' }
    
    render(
      <ExampleComponent 
        data={mockData} 
        onDataChange={mockOnChange} 
      />
    )
    
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'new value' }
    })
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ field1: 'new value' })
    )
  })
})
```

### Integration Testing Pattern

#### API Integration Test
```typescript
// __tests__/integration/api/example-api.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

describe('Example API Integration', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string
  let testUserId: string

  beforeEach(async () => {
    // Setup test data
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org' })
      .select('id')
      .single()
    testOrgId = org!.id

    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456'
    })
    testUserId = user.user!.id
  })

  it('should create workflow via API', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        title: 'Test Workflow',
        description: 'Test Description'
      })
    })

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.data).toHaveProperty('id')
    expect(data.data.title).toBe('Test Workflow')
  })
})
```

### E2E Testing Pattern

#### Playwright E2E Test
```typescript
// tests/e2e/workflow-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Workflow Creation', () => {
  test('should create and complete workflow', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'test@example.com')
    await page.fill('[data-testid=password]', 'test123456')
    await page.click('[data-testid=login-button]')
    
    // Navigate to workflows
    await page.click('[data-testid=workflows-nav]')
    await page.click('[data-testid=create-workflow-button]')
    
    // Fill workflow form
    await page.fill('[data-testid=workflow-title]', 'Test Workflow')
    await page.fill('[data-testid=workflow-description]', 'Test Description')
    await page.click('[data-testid=create-button]')
    
    // Verify workflow created
    await expect(page.locator('[data-testid=workflow-card]')).toContainText('Test Workflow')
    
    // Start workflow
    await page.click('[data-testid=start-workflow-button]')
    
    // Verify workflow started
    await expect(page.locator('[data-testid=workflow-status]')).toContainText('ICP_PENDING')
  })
})
```

### Test Commands

#### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test example-service.test.ts

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

---

## 🔒 Security Patterns

### Authentication Pattern
```typescript
// lib/supabase/get-current-user.ts
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set(name, value, options)
        },
        remove(name, options) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### Authorization Pattern
```typescript
// lib/guards/organization-guard.ts
export async function requireOrganizationAccess(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('user_organizations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()
  
  return !error && !!data
}

// Usage in API route
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasAccess = await requireOrganizationAccess(
    organizationId,
    currentUser.id
  )
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with request
}
```

### Input Validation Pattern
```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const createWorkflowSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  organization_id: z.string().uuid()
})

export type CreateWorkflowRequest = z.infer<typeof createWorkflowSchema>

// Usage in API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedBody = createWorkflowSchema.parse(body)
    
    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}
```

---

## 📊 Error Handling Patterns

### Service Error Handling
```typescript
// lib/services/base-service.ts
export abstract class BaseService {
  protected handleError(error: any, context: string): never {
    console.error(`${context}:`, error)
    
    if (error.code === 'PGRST116') {
      throw new Error('Resource not found')
    }
    
    if (error.code === '23505') {
      throw new Error('Resource already exists')
    }
    
    if (error.code === '23503') {
      throw new Error('Referenced resource not found')
    }
    
    throw new Error(`${context} failed: ${error.message}`)
  }

  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.handleError(error, context)
    }
  }
}
```

### API Error Handling
```typescript
// app/api/example/route.ts
export async function POST(request: NextRequest) {
  try {
    const result = await exampleService.methodName(params)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('API Error:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.details },
        { status: 400 }
      )
    }
    
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Client-Side Error Handling
```typescript
// components/ui/error-boundary.tsx
'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 🚀 Performance Patterns

### Database Optimization
```typescript
// Optimized query with indexes
async getWorkflowsByOrganization(
  organizationId: string,
  options: {
    page?: number
    limit?: number
    state?: string
  } = {}
): Promise<Workflow[]> {
  const { page = 1, limit = 20, state } = options
  
  let query = supabase
    .from('intent_workflows')
    .select(`
      id,
      title,
      state,
      created_at,
      updated_at,
      keywords (
        id,
        keyword,
        keyword_type
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (state) {
    query = query.eq('state', state)
  }

  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch workflows: ${error.message}`)
  }

  return data || []
}
```

### Caching Pattern
```typescript
// lib/cache/cache-service.ts
export class CacheService {
  private cache = new Map<string, CacheEntry>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value as T
  }

  async set<T>(
    key: string,
    value: T,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    })
  }

  async invalidate(pattern: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

interface CacheEntry {
  value: any
  expiresAt: number
}

export const cacheService = new CacheService()
```

### Lazy Loading Pattern
```typescript
// components/ui/lazy-component.tsx
'use client'

import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./heavy-component'))

export function LazyWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}
```

---

## 📝 Code Quality

### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./lib/*"],
      "@/components/*": ["./components/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## 🔄 Deployment Patterns

### Environment Configuration
```typescript
// lib/config/environment.ts
export const config = {
  database: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  },
  external: {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseUrl: 'https://openrouter.ai/api/v1'
    },
    dataforseo: {
      login: process.env.DATAFORSEO_LOGIN!,
      password: process.env.DATAFORSEO_PASSWORD!,
      baseUrl: 'https://api.dataforseo.com'
    },
    tavily: {
      apiKey: process.env.TAVILY_API_KEY!,
      baseUrl: 'https://api.tavily.com'
    }
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
    nodeEnv: process.env.NODE_ENV || 'development'
  }
}

// Environment validation
function validateConfig() {
  const required = [
    'database.url',
    'database.serviceKey',
    'external.openrouter.apiKey',
    'external.dataforseo.login',
    'external.dataforseo.password',
    'external.tavily.apiKey'
  ]

  for (const path of required) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config)
    if (!value) {
      throw new Error(`Missing required environment variable: ${path}`)
    }
  }
}

validateConfig()
```

### Build Optimization
```typescript
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif']
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    }
    return config
  }
}

module.exports = nextConfig
```

---

## 📚 Development Resources

### Useful Commands
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                # Run all tests
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run E2E tests
npm run test:watch      # Run tests in watch mode

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript check
npm run format          # Format code with Prettier

# Database
npm run db:migrate      # Run database migrations
npm run db:reset        # Reset database
npm run db:seed         # Seed database

# Documentation
npm run docs:build      # Build documentation
npm run docs:dev        # Start documentation server
```

### Debugging Tips

#### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/infin8content",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

#### Database Debugging
```sql
-- Check table structure
\d table_name

-- Check indexes
\d table_name

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 🎯 Best Practices

### Code Organization
- **One file per service** - Keep services focused and single-purpose
- **Clear naming** - Use descriptive names for files, functions, and variables
- **Consistent patterns** - Follow established patterns throughout the codebase
- **Type safety** - Use TypeScript strictly with proper type definitions

### Performance
- **Database optimization** - Use indexes wisely and avoid N+1 queries
- **Caching strategy** - Cache expensive operations and API responses
- **Lazy loading** - Load components and data only when needed
- **Bundle optimization** - Optimize JavaScript bundle size

### Security
- **Input validation** - Validate all inputs using Zod schemas
- **Authentication** - Use proper JWT token handling
- **Authorization** - Check user permissions for all operations
- **SQL injection prevention** - Use parameterized queries

### Testing
- **Test coverage** - Maintain high test coverage for critical paths
- **Test organization** - Organize tests by type (unit, integration, E2E)
- **Mock external services** - Use deterministic mocks for external APIs
- **Test data management** - Clean up test data and use isolated test databases

---

**Development Guide Complete:** This document provides comprehensive coverage of the Infin8Content development process, from setup to deployment. The patterns and practices demonstrated ensure high-quality, maintainable, and scalable code.

**Last Updated:** February 13, 2026  
**Guide Version:** v2.2  
**Development Status:** Production-Ready
