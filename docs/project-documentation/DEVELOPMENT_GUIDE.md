# Infin8Content Development Guide

**Generated:** 2026-02-06  
**Version:** v2.0  
**Target Audience:** Intermediate to Advanced Developers

## Getting Started

### Prerequisites

- **Node.js:** 18+ (recommended 20.x)
- **Package Manager:** npm 9+
- **Database:** PostgreSQL (via Supabase)
- **IDE:** VS Code with recommended extensions

### Environment Setup

1. **Clone Repository**
```bash
git clone https://github.com/dvernon0786/Infin8Content.git
cd Infin8Content
```

2. **Install Dependencies**
```bash
cd infin8content
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
# Configure Supabase, Stripe, and external API keys
```

4. **Database Setup**
```bash
# Apply migrations
npx supabase db push

# Seed development data
npm run db:seed
```

5. **Start Development Server**
```bash
npm run dev
```

## Project Structure

### Directory Layout

```
infin8content/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Main application UI
│   ├── onboarding/        # Onboarding flow
│   └── globals.css        # Global styles
├── lib/
│   ├── services/          # Business logic services
│   ├── supabase/          # Database clients
│   ├── utils/             # Utility functions
│   └── validations/       # Input validation
├── components/            # Reusable UI components
├── __tests__/            # Test suites
├── types/                # TypeScript definitions
└── public/               # Static assets
```

### Key Patterns

#### Service Layer Architecture

```typescript
// Service interface pattern
export interface ServiceInterface<Input, Output> {
  execute(input: Input): Promise<Output>;
  validate(input: Input): ValidationResult;
  rollback?(executionId: UUID): Promise<void>;
}

// Example implementation
export class KeywordExpanderService implements ServiceInterface<ExpandInput, ExpandOutput> {
  async execute(input: ExpandInput): Promise<ExpandOutput> {
    // Implementation logic
  }
  
  async validate(input: ExpandInput): Promise<ValidationResult> {
    // Input validation
  }
}
```

#### API Route Pattern

```typescript
// Standard API route structure
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input validation
    const body = await request.json();
    const validation = validateInput(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 3. Business logic
    const result = await service.execute(body);

    // 4. Response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 5. Error handling
    await logError(error, request);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Database Access Pattern

```typescript
// Supabase client usage
export async function getKeywordsByOrganization(organizationId: UUID) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('keywords')
    .select('*')
    .eq('organization_id', organizationId)
    .order('search_volume', { ascending: false });

  if (error) {
    throw new DatabaseError(error.message);
  }

  return data;
}
```

## Code Standards

### TypeScript Configuration

#### Strict Type Checking
```typescript
// Enable strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Type Definitions
```typescript
// Use interfaces for public APIs
export interface Keyword {
  id: UUID;
  organization_id: UUID;
  keyword: string;
  search_volume: number;
  competition_level: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// Use types for unions and computed values
export type KeywordStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';
export type SearchFilter = {
  query?: string;
  status?: KeywordStatus;
  competition?: CompetitionLevel;
};
```

### ESLint Configuration

#### Core Rules
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

### Naming Conventions

#### Files and Directories
- **Components:** PascalCase (`KeywordTable.tsx`)
- **Services:** kebab-case (`keyword-expander.ts`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Types:** camelCase (`keywordTypes.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

#### Variables and Functions
```typescript
// Variables: camelCase
const keywordCount = 10;
const isLoading = false;

// Functions: camelCase with descriptive names
function extractKeywordsFromCompetitors(competitorUrls: string[]) {
  // Implementation
}

// Constants: UPPER_SNAKE_CASE
const MAX_KEYWORDS_PER_COMPETITOR = 3;
const DEFAULT_TIMEOUT_MS = 5000;
```

## Testing Strategy

### Test Structure

#### Unit Tests
```typescript
// __tests__/services/keyword-expander.test.ts
import { describe, it, expect, vi } from 'vitest';
import { KeywordExpanderService } from '@/lib/services/keyword-expander';

describe('KeywordExpanderService', () => {
  it('should expand keywords successfully', async () => {
    // Arrange
    const service = new KeywordExpanderService();
    const input = { seedKeyword: 'content marketing', organizationId: 'org-123' };
    
    // Act
    const result = await service.execute(input);
    
    // Assert
    expect(result.keywords).toHaveLength(12);
    expect(result.keywords[0]).toMatchObject({
      keyword: expect.any(String),
      search_volume: expect.any(Number),
    });
  });

  it('should handle validation errors', async () => {
    // Test validation logic
  });
});
```

#### Integration Tests
```typescript
// __tests__/integration/keywords.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '@/lib/test-utils';

describe('Keywords API Integration', () => {
  let client: TestClient;

  beforeAll(async () => {
    client = await createTestClient();
  });

  it('should create and retrieve keywords', async () => {
    const keyword = await client.keywords.create({
      keyword: 'test keyword',
      organizationId: 'test-org',
    });

    const retrieved = await client.keywords.get(keyword.id);
    expect(retrieved.keyword).toBe('test keyword');
  });
});
```

#### E2E Tests
```typescript
// tests/e2e/keyword-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete keyword workflow', async ({ page }) => {
  await page.goto('/dashboard/keywords');
  
  // Create keyword
  await page.click('[data-testid="create-keyword-button"]');
  await page.fill('[data-testid="keyword-input"]', 'test keyword');
  await page.click('[data-testid="save-button"]');
  
  // Verify creation
  await expect(page.locator('[data-testid="keyword-list"]')).toContainText('test keyword');
});
```

### Test Utilities

#### Mock Services
```typescript
// __tests__/mocks/services.ts
export const mockKeywordService = {
  expand: vi.fn().mockResolvedValue({
    keywords: [
      { keyword: 'long-tail 1', search_volume: 100 },
      { keyword: 'long-tail 2', search_volume: 50 },
    ],
  }),
};

export const mockDataForSEOService = {
  getRelatedKeywords: vi.fn(),
  getKeywordSuggestions: vi.fn(),
};
```

#### Test Database
```typescript
// __tests__/utils/database.ts
export async function setupTestDatabase() {
  // Create isolated test schema
  // Run migrations
  // Seed test data
}

export async function cleanupTestDatabase() {
  // Drop test schema
  // Clean up connections
}
```

## Development Workflow

### Git Workflow

#### Branch Strategy
```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/feature-name # Feature development
├── hotfix/fix-name    # Production fixes
└── release/version    # Release preparation
```

#### Commit Convention
```bash
# Format: <type>(<scope>): <description>

feat(workflow): add keyword clustering step
fix(api): resolve authentication timeout issue
docs(readme): update installation instructions
test(services): add keyword expander unit tests
refactor(database): optimize keyword queries
```

### Code Review Process

#### Pull Request Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Database migrations included
```

#### Review Guidelines
1. **Functionality:** Does the code work as intended?
2. **Performance:** Are there performance implications?
3. **Security:** Are there security vulnerabilities?
4. **Testing:** Is test coverage adequate?
5. **Documentation:** Is documentation updated?

## Database Development

### Migration Management

#### Creating Migrations
```bash
# Generate new migration
npx supabase db new add_new_feature_table

# Edit migration file
# supabase/migrations/20260206120000_add_new_feature_table.sql
```

#### Migration Best Practices
```sql
-- Idempotent migrations
CREATE TABLE IF NOT EXISTS feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Columns
);

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS feature_table_policy ON feature_table;

-- Create new policy
CREATE POLICY feature_table_policy ON feature_table
  FOR ALL USING (organization_id = get_auth_user_org_id());
```

### Database Patterns

#### Query Optimization
```typescript
// Efficient queries with proper indexing
async function getKeywordsWithFilters(filters: KeywordFilters) {
  const supabase = createSupabaseClient();
  
  let query = supabase
    .from('keywords')
    .select(`
      id,
      keyword,
      search_volume,
      competition_level,
      organizations(name)
    `)
    .eq('organization_id', filters.organizationId);

  // Apply filters efficiently
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.competition) {
    query = query.eq('competition_level', filters.competition);
  }

  return await query.order('search_volume', { ascending: false });
}
```

#### Transaction Management
```typescript
// Atomic operations
async function createKeywordWithClusters(keyword: CreateKeywordInput) {
  const supabase = createSupabaseClient();
  
  return await supabase.rpc('create_keyword_with_clusters', {
    keyword_data: keyword,
    cluster_data: keyword.clusters,
  });
}
```

## External Service Integration

### Service Client Pattern

```typescript
// Base service client
export abstract class BaseServiceClient {
  protected apiKey: string;
  protected baseUrl: string;
  protected rateLimiter: RateLimiter;

  constructor(config: ServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }

  protected async makeRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    await this.rateLimiter.acquire();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new ServiceError(response.statusText, response.status);
      }

      return await response.json();
    } catch (error) {
      throw new ServiceError(`Request failed: ${error.message}`);
    }
  }
}
```

### DataForSEO Integration

```typescript
export class DataForSEOClient extends BaseServiceClient {
  async getRelatedKeywords(params: RelatedKeywordsParams): Promise<KeywordData[]> {
    return this.makeRequest<KeywordData[]>('/v3/dataforseo_labs/google/related_keywords/live', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getKeywordSuggestions(params: KeywordSuggestionsParams): Promise<KeywordData[]> {
    return this.makeRequest<KeywordData[]>('/v3/dataforseo_labs/google/keyword_suggestions/live', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
```

### Error Handling

```typescript
// Retry logic with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retry attempts exceeded');
}
```

## Performance Optimization

### Frontend Optimization

#### Code Splitting
```typescript
// Dynamic imports for route-based splitting
const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <div>Loading dashboard...</div>,
});

const KeywordManager = dynamic(() => import('@/components/KeywordManager'), {
  loading: () => <div>Loading keywords...</div>,
});
```

#### Image Optimization
```typescript
import Image from 'next/image';

// Optimized images
<Image
  src="/hero-image.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Backend Optimization

#### Caching Strategy
```typescript
// Redis caching for expensive operations
export class CacheService {
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

#### Database Optimization
```typescript
// Efficient batch operations
export async function bulkUpdateKeywords(updates: KeywordUpdate[]): Promise<void> {
  const supabase = createSupabaseClient();
  
  // Use RPC for complex operations
  await supabase.rpc('bulk_update_keywords', {
    updates: updates,
  });
}
```

## Security Best Practices

### Authentication & Authorization

```typescript
// Secure API route pattern
export async function secureApiRoute<T>(
  handler: (user: AuthUser, request: NextRequest) => Promise<T>
) {
  return async (request: NextRequest) => {
    // Authentication
    const user = await getCurrentUser();
    if (!user || !user.org_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization
    if (!await hasPermission(user, 'required_permission')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const result = await handler(user, request);
      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
```

### Input Validation

```typescript
// Zod validation schemas
export const CreateKeywordSchema = z.object({
  keyword: z.string().min(1).max(100),
  organizationId: z.uuid(),
  competitionLevel: z.enum(['low', 'medium', 'high']).optional(),
});

export type CreateKeywordInput = z.infer<typeof CreateKeywordSchema>;

// Validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return schema.parse(data);
  };
}
```

## Deployment

### Environment Configuration

```typescript
// Environment variable validation
const envSchema = z.object({
  DATABASE_URL: z.string(),
  NEXT_PUBLIC_SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  OPENROUTER_API_KEY: z.string(),
  DATAFORSEO_LOGIN: z.string(),
  DATAFORSEO_PASSWORD: z.string(),
});

export const env = envSchema.parse(process.env);
```

### Build Optimization

```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Monitoring

```typescript
// Error tracking with Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Performance monitoring
export function trackPerformance(metricName: string, value: number) {
  // Send to monitoring service
}
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```typescript
// Connection pool configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      connectionTimeout: 10000,
      queryTimeout: 30000,
    },
  }
);
```

#### Memory Leaks
```typescript
// Proper cleanup
export function useEffectCleanup() {
  useEffect(() => {
    const subscription = createSubscription();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

#### Performance Issues
```typescript
// Performance monitoring
export function performanceMonitor() {
  if (process.env.NODE_ENV === 'development') {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`);
      }
    });
    observer.observe({ entryTypes: ['measure'] });
  }
}
```

This development guide provides comprehensive patterns, standards, and best practices for contributing to the Infin8Content platform.

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Infin8Content
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment configuration**:
   ```bash
   cp infin8content/.env.example infin8content/.env.local
   ```

4. **Configure environment variables** (see Environment Setup section)

5. **Start development server**:
   ```bash
   cd infin8content
   npm run dev
   ```

## Environment Setup

### Required Environment Variables

Create `infin8content/.env.local` with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_starter_monthly
STRIPE_PRICE_STARTER_ANNUAL=price_starter_annual
STRIPE_PRICE_PRO_MONTHLY=price_pro_monthly
STRIPE_PRICE_PRO_ANNUAL=price_pro_annual
STRIPE_PRICE_AGENCY_MONTHLY=price_agency_monthly
STRIPE_PRICE_AGENCY_ANNUAL=price_agency_annual

# Optional: Additional services
INNGEST_EVENT_KEY=your_inngest_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Supabase Setup

#### Option 1: Local Development (Recommended)

1. **Start Supabase locally**:
   ```bash
   cd infin8content
   supabase start
   ```

2. **Link to project** (if exists):
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Run migrations**:
   ```bash
   supabase db reset
   ```

4. **Generate types**:
   ```bash
   npx tsx scripts/generate-types.ts
   ```

#### Option 2: Hosted Supabase

1. **Create project** at [supabase.com](https://supabase.com)

2. **Get credentials** from project settings

3. **Configure environment variables**

4. **Run migrations**:
   ```bash
   supabase migration up
   ```

### Stripe Setup

1. **Create Stripe account** at [stripe.com](https://stripe.com)

2. **Get API keys** from Dashboard → Developers → API keys

3. **Create products**:
   - Starter Plan (Monthly/Annual)
   - Pro Plan (Monthly/Annual)
   - Agency Plan (Monthly/Annual)

4. **Setup webhook**:
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`

## Development Workflow

### Branch Strategy

```
main                    # Production branch
├── develop            # Integration branch
├── feature/*          # Feature branches
├── bugfix/*           # Bug fix branches
└── hotfix/*           # Emergency fixes
```

### Git Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/article-editor
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add article editor component"
   ```

3. **Push and create PR**:
   ```bash
   git push origin feature/article-editor
   # Create Pull Request on GitHub/GitLab
   ```

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor existing code
test: add tests
chore: update dependencies
```

## Code Style & Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### ESLint Rules

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Component Patterns

#### 1. File Naming

```
components/
├── ui/
│   ├── button.tsx          # PascalCase, single export
│   ├── input.tsx
│   └── card.tsx
├── articles/
│   ├── article-list.tsx    # Feature-specific components
│   ├── article-card.tsx
│   └── article-editor.tsx
```

#### 2. Component Structure

```typescript
// button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium",
          buttonVariants({ variant, size }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

#### 3. Hook Patterns

```typescript
// hooks/use-articles.ts
import { useState, useEffect, useCallback } from "react"
import { getArticles, createArticle } from "@/lib/services/articles"

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getArticles()
      setArticles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  const createNewArticle = useCallback(async (articleData: CreateArticleData) => {
    setLoading(true)
    try {
      const newArticle = await createArticle(articleData)
      setArticles(prev => [newArticle, ...prev])
      return newArticle
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  return {
    articles,
    loading,
    error,
    fetchArticles,
    createNewArticle,
  }
}
```

## Testing Guide

### Unit Testing with Vitest

#### Test Structure

```
tests/
├── components/
│   ├── button.test.tsx
│   └── article-card.test.tsx
├── hooks/
│   └── use-articles.test.ts
└── utils/
    └── format-date.test.ts
```

#### Example Test

```typescript
// tests/components/button.test.tsx
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button")).toBeInTheDocument()
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("applies variant styles", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("border")
  })
})
```

#### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific file
npm run test button.test.tsx

# Watch mode
npm run test:ui
```

### E2E Testing with Playwright

#### Test Structure

```
tests/e2e/
├── auth.spec.ts
├── articles.spec.ts
└── dashboard.spec.ts
```

#### Example Test

```typescript
// tests/e2e/articles.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Articles", () => {
  test("should create and view article", async ({ page }) => {
    await page.goto("/dashboard/articles")
    
    await page.click('[data-testid="create-article-button"]')
    await page.fill('[data-testid="article-title"]', "Test Article")
    await page.fill('[data-testid="article-content"]', "Test content")
    await page.click('[data-testid="save-article-button"]')
    
    await expect(page.locator("h1")).toContainText("Test Article")
  })
})
```

#### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npm run test:e2e articles.spec.ts

# Run headed mode (shows browser)
npm run test:e2e:headed
```

## Database Development

### Migrations

#### Creating Migration

```bash
# Create new migration
supabase migration new add_articles_table
```

#### Migration File Structure

```sql
-- supabase/migrations/20240101000000_add_articles_table.sql
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX articles_author_id_idx ON articles(author_id);
CREATE INDEX articles_organization_id_idx ON articles(organization_id);
```

#### Running Migrations

```bash
# Apply migrations
supabase migration up

# Reset database (local)
supabase db reset
```

### Type Generation

```typescript
// scripts/generate-types.ts
import { createClient } from '@supabase/supabase-js'
import { generateTypes } from 'supabase-typegen'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

await generateTypes(supabase, {
  output: 'lib/supabase/database.types.ts',
  exclude: ['_temp']
})
```

## API Development

### API Routes

#### Structure

```
app/api/
├── articles/
│   ├── route.ts           # GET /api/articles
│   └── [id]/
│       └── route.ts       # GET/PUT/DELETE /api/articles/[id]
├── auth/
│   └── route.ts           # POST /api/auth
└── payments/
    └── webhook/
        └── route.ts       # POST /api/payments/webhook
```

#### Example API Route

```typescript
// app/api/articles/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getArticles, createArticle } from "@/lib/services/articles"
import { withAuth } from "@/lib/guards/auth"

export async function GET(request: NextRequest) {
  try {
    const articles = await getArticles()
    return NextResponse.json(articles)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const article = await createArticle(body)
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 400 }
    )
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
const ChartComponent = dynamic(() => import('./ChartComponent'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
```

### Image Optimization

```typescript
import Image from 'next/image'

export function ArticleImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={400}
      className="rounded-lg"
      priority={false}
    />
  )
}
```

### Database Optimization

```typescript
// Efficient queries with specific fields
const articles = await supabase
  .from('articles')
  .select('id, title, created_at')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(10)
```

## Debugging

### Client-Side Debugging

```typescript
// Debug component
export function DebugInfo({ data }: { data: any }) {
  if (process.env.NODE_ENV === 'development') {
    return (
      <pre className="text-xs bg-gray-100 p-2 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }
  return null
}
```

### Server-Side Debugging

```typescript
// API route debugging
export async function GET(request: NextRequest) {
  console.log('API call received:', request.url)
  
  try {
    const result = await someOperation()
    console.log('Operation result:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## Deployment

### Build Process

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Ensure all required environment variables are set in production:

```bash
# Required for production
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
DATABASE_URL
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Realtime & Polling Development Rules

**These rules are enforceable policy and must be followed by all developers.**

### Realtime Usage Rules

- **Realtime subscriptions must never mutate application state directly.**
- **Realtime handlers may only trigger reconciliation fetches.**
- **Realtime payloads must never be used as data sources.**
- **All realtime events must result in database API calls.**

```typescript
// ✅ CORRECT: Realtime triggers reconciliation
supabase.channel('articles')
  .on('postgres_changes', (event) => {
    // Only signal - never use payload
    refreshArticles() // Triggers API fetch
  })

// ❌ FORBIDDEN: Direct state mutation
supabase.channel('articles')
  .on('postgres_changes', (event) => {
    // Never mutate state from realtime
    setArticles(prev => [...prev, event.payload]) // VIOLATION
  })
```

### Polling Usage Rules

- **Polling must be controlled by connectivity, not data presence.**
- **Polling intervals must not depend on article count, status, or content.**
- **Polling is a fallback transport only, not a primary data source.**
- **Polling must be idempotent and safe to call repeatedly.**

```typescript
// ✅ CORRECT: Connectivity-based polling
useEffect(() => {
  const polling = setInterval(() => {
    if (!navigator.onLine) {
      refreshArticles() // Fallback only when offline
    }
  }, 120000) // 2-minute interval

  return () => clearInterval(polling)
}, []) // No data dependencies

// ❌ FORBIDDEN: Data-aware polling
useEffect(() => {
  const polling = setInterval(() => {
    if (articles.length === 0) { // Never gate on data state
      fetchArticles()
    }
  }, 5000)
  return () => clearInterval(polling)
}, [articles.length]) // VIOLATION: Data dependency
```

### Hook Responsibilities

- **Stateful hooks must live under stable layout components.**
- **Hooks must not depend on volatile component state.**
- **Custom hooks must document their lifecycle requirements.**
- **Diagnostic components must not contain stateful hooks.**

```typescript
// ✅ CORRECT: Stable hook placement
function ArticlesPage() {
  // Hook lives under stable layout
  const { articles, loading, error, refresh } = useArticlesRealtime()
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return <ArticleList articles={articles} />
}

// ✅ CORRECT: Safe diagnostic hook
function useDebugDisplay() {
  // Pure display logic - no side effects
  const metrics = useSelector(state => state.debug.metrics)
  return { metrics }
}

// ❌ FORBIDDEN: Stateful diagnostic hook
function useDebugRealtime() {
  // Never in diagnostic components
  const [debug, setDebug] = useState({})
  
  useEffect(() => {
    // VIOLATION: Stateful logic in diagnostic context
    const subscription = supabase.channel('debug')
      .on('postgres_changes', (payload) => {
        setDebug(payload) // Direct mutation
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])
  
  return debug
}
```

### Reconciliation Pattern Requirements

- **All state updates must come from API responses.**
- **Reconciliation endpoints must be idempotent.**
- **Local state must be replaced, not merged.**
- **Optimistic updates are forbidden.**

```typescript
// ✅ CORRECT: Full reconciliation
async function refreshArticles() {
  try {
    const response = await fetch('/api/articles/queue') // Reconciliation endpoint
    const articles = await response.json()
    
    // Replace entire state - never merge
    setArticles(articles)
  } catch (error) {
    console.error('Reconciliation failed:', error)
  }
}

// ❌ FORBIDDEN: Incremental updates
function handleRealtimeEvent(event) {
  // VIOLATION: Never patch from realtime
  setArticles(prev => {
    if (event.type === 'INSERT') {
      return [...prev, event.payload] // Incremental patch
    }
    return prev
  })
}
```

### Enforcement and Violations

**Automatic Violations (CI will catch):**
- Direct state mutation from realtime payloads
- Polling dependencies on data state
- Stateful hooks in diagnostic components
- Missing reconciliation calls after realtime events

**Manual Review Required:**
- Hook placement in component tree
- Reconciliation endpoint usage
- Polling interval justification
- Custom hook lifecycle documentation

### Architectural Review Process

**Any deviation from these rules requires:**

1. **Architecture Review**: Must be approved by senior architect
2. **Impact Assessment**: Document why deviation is necessary
3. **Mitigation Strategy**: How regressions will be prevented
4. **Test Coverage**: Comprehensive tests for the deviation
5. **Documentation**: Updated documentation with rationale

### Code Review Checklist

**Reviewers must verify:**

- [ ] Realtime handlers only call reconciliation functions
- [ ] Polling logic is connectivity-based only
- [ ] No data dependencies in polling effects
- [ ] Stateful hooks are under stable layouts
- [ ] Diagnostic components are pure display
- [ ] Reconciliation endpoints are used correctly
- [ ] No optimistic updates or incremental patches
- [ ] All state updates come from API responses

---

*This development guide provides comprehensive instructions for contributing to the Infin8Content project. The Realtime & Polling Development Rules section is enforceable policy and must be followed to prevent architectural regressions.*
