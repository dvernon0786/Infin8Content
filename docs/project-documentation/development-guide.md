# Infin8Content Development Guide

## Overview

This guide covers development patterns, setup instructions, and best practices for contributing to the Infin8Content platform. It's designed for developers of all skill levels to get started quickly and maintain high code quality.

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
git clone https://github.com/your-org/infin8content.git
cd infin8content
```

### 2. Install Dependencies
```bash
npm install
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
