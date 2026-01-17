# Infin8Content Development Guide

## Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Docker**: For local Supabase development
- **Git**: For version control

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
