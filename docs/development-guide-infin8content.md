# Development Guide - Infin8Content

**Generated**: 2026-01-21  
**Project**: Infin8Content  
**Part**: infin8content (Web Application)

---

## Getting Started

### Prerequisites
- **Node.js 20** or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **VS Code** (recommended) with extensions

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Infin8Content
```

2. **Install dependencies**
```bash
cd infin8content
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Set up Supabase**
```bash
# Create Supabase project at https://supabase.com
# Update .env.local with your Supabase credentials
supabase link --project-ref <your-project-ref>
supabase db reset
```

5. **Generate TypeScript types**
```bash
npx tsx scripts/generate-types.ts
```

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
OPENROUTER_API_KEY=your-openrouter-key
TAVILY_API_KEY=your-tavily-key
DATAFORSEO_API_KEY=your-dataforseo-key
BREVO_API_KEY=your-brevo-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## Development Commands

### Running the Application
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Production server
npm run start
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing
```bash
# Unit tests (Vitest)
npm run test

# Unit tests with UI
npm run test:ui

# Unit tests (single run)
npm run test:run

# Contract tests
npm run test:contracts

# Integration tests
npm run test:integration

# End-to-end tests (Playwright)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Visual regression tests
npm run test:visual

# Responsive design tests
npm run test:responsive

# Accessibility tests
npm run test:accessibility

# Layout regression tests
npm run test:layout-regression

# TS-001 governance tests
npm run test:ts-001
```

### Storybook
```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

---

## Project Structure

```
infin8content/
├── app/                    # Next.js 16 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Homepage
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── marketing/        # Landing page components
│   ├── dashboard/        # Dashboard components
│   ├── articles/         # Article components
│   ├── auth/             # Authentication components
│   └── mobile/           # Mobile-optimized components
├── lib/                   # Core business logic
│   ├── services/         # External API integrations
│   ├── article-generation/ # Content generation logic
│   ├── research/         # Research and data collection
│   ├── seo/              # SEO optimization
│   ├── mobile/           # Mobile optimization
│   ├── supabase/         # Database client and types
│   └── hooks/            # Custom React hooks
├── scripts/              # Utility scripts
├── public/               # Static assets
├── __tests__/            # Test files
├── .storybook/          # Storybook configuration
└── tools/               # Development tools
```

---

## Development Workflow

### 1. Feature Development
1. Create feature branch from `main`
2. Implement changes following component patterns
3. Add tests for new functionality
4. Run type checking and linting
5. Test manually and with automated tests
6. Submit pull request for review

### 2. Component Development
```typescript
// Component structure example
"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useMyHook } from '@/hooks/use-my-hook'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const { data, loading } = useMyHook()
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onAction} disabled={loading}>
        {loading ? 'Loading...' : 'Action'}
      </Button>
    </div>
  )
}
```

### 3. API Route Development
```typescript
// API route structure example
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4. Database Operations
```typescript
// Database operations with RLS
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

export async function createArticle(data: z.infer<typeof createArticleSchema>) {
  const supabase = createClient()
  const user = await supabase.auth.getUser()
  
  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      ...data,
      user_id: user.data.user?.id,
    })
    .select()
    .single()
  
  if (error) throw error
  return article
}
```

---

## Testing Guidelines

### Unit Testing
```typescript
// Example unit test
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test Title" onAction={vi.fn()} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })
  
  it('calls onAction when button is clicked', () => {
    const onAction = vi.fn()
    render(<MyComponent title="Test" onAction={onAction} />)
    screen.getByRole('button').click()
    expect(onAction).toHaveBeenCalled()
  })
})
```

### Integration Testing
```typescript
// Example integration test
import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

describe('Article Service', () => {
  let supabase: any
  
  beforeEach(() => {
    supabase = createClient()
  })
  
  it('creates article successfully', async () => {
    const articleData = {
      title: 'Test Article',
      content: 'Test content',
    }
    
    const result = await createArticle(articleData)
    expect(result).toHaveProperty('id')
    expect(result.title).toBe(articleData.title)
  })
})
```

### E2E Testing
```typescript
// Example E2E test
import { test, expect } from '@playwright/test'

test.describe('Article Creation', () => {
  test('user can create new article', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('[data-testid="create-article-button"]')
    await page.fill('[data-testid="article-title"]', 'Test Article')
    await page.fill('[data-testid="article-content"]', 'Test content')
    await page.click('[data-testid="save-button"]')
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

---

## Code Style and Standards

### TypeScript Configuration
- **Strict mode enabled** for type safety
- **Path aliases** configured for clean imports
- **ESLint rules** for code quality
- **Prettier** for consistent formatting

### Component Patterns
1. **Use interfaces** for props typing
2. **Default exports** for components
3. **Descriptive names** for components and functions
4. **Consistent file naming** (kebab-case for files, PascalCase for components)

### Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react'
import { NextResponse } from 'next/server'

// 2. Third-party libraries
import { z } from 'zod'
import { Button } from '@/components/ui/button'

// 3. Internal imports (absolute paths)
import { createClient } from '@/lib/supabase/server'
import { useMyHook } from '@/hooks/use-my-hook'

// 4. Relative imports (for co-located files)
import { styles } from './styles.module.css'
```

### Error Handling
```typescript
// Error handling pattern
try {
  const result = await someOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Failed to complete operation')
}
```

---

## Database Development

### Migrations
```bash
# Create new migration
supabase migration new new_feature

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### Row Level Security (RLS)
```sql
-- Example RLS policy
create policy "Users can view their own articles"
on articles for select
using (auth.uid() = user_id);

create policy "Users can insert their own articles"
on articles for insert
with check (auth.uid() = user_id);
```

### Type Generation
```bash
# Generate TypeScript types from database
npx tsx scripts/generate-types.ts

# Alternative with Supabase CLI
supabase gen types typescript --local > lib/supabase/database.types.ts
```

---

## Performance Guidelines

### Frontend Performance
1. **Use Next.js Image** for optimized images
2. **Implement code splitting** for large components
3. **Optimize bundle size** with dynamic imports
4. **Use React.memo** for expensive components
5. **Implement virtual scrolling** for long lists

### Backend Performance
1. **Use database indexes** for frequent queries
2. **Implement caching** for expensive operations
3. **Use connection pooling** for database access
4. **Optimize API responses** with pagination
5. **Monitor query performance** regularly

### Mobile Performance
1. **Optimize touch targets** (44px minimum)
2. **Implement lazy loading** for images
3. **Use responsive images** with proper sizing
4. **Minimize JavaScript bundle** for mobile
5. **Test on real devices** regularly

---

## Debugging

### Development Debugging
```typescript
// Debug logging
console.log('Debug info:', { data, state })

// Error logging with context
console.error('Operation failed:', {
  error,
  userId,
  operation: 'createArticle',
  timestamp: new Date().toISOString(),
})
```

### Production Debugging
1. **Sentry** for error tracking
2. **Structured logging** with Winston
3. **Performance monitoring** with traces
4. **User context** in error reports

### Database Debugging
```bash
# View database logs
supabase logs

# Query database directly
supabase db shell

# View table structure
supabase db describe articles
```

---

## Deployment

### Build Process
```bash
# Type check
npm run typecheck

# Build application
npm run build

# Start production server
npm run start
```

### Environment Variables
- **Development**: `.env.local`
- **Production**: Set in hosting platform
- **Testing**: `.env.test`

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# View deployment logs
vercel logs
```

---

## Common Development Tasks

### Adding New API Endpoint
1. Create route file in `app/api/`
2. Implement request/response handling
3. Add input validation with Zod
4. Implement error handling
5. Add tests for the endpoint

### Creating New Component
1. Create component file in `components/`
2. Define props interface
3. Implement component logic
4. Add Storybook stories
5. Write unit tests

### Database Schema Changes
1. Create migration file
2. Write SQL for schema changes
3. Update TypeScript types
4. Update RLS policies if needed
5. Test migration in development

### Adding External Service
1. Create service file in `lib/services/`
2. Implement API client
3. Add environment variables
4. Add error handling and retries
5. Write integration tests

---

## Troubleshooting

### Common Issues
1. **TypeScript errors**: Check imports and type definitions
2. **Build failures**: Verify environment variables
3. **Database errors**: Check RLS policies and connections
4. **Test failures**: Verify mocks and test setup

### Getting Help
1. Check **console logs** for error details
2. Review **GitHub Actions** for CI failures
3. Consult **Sentry** for production errors
4. Refer to **documentation** for guidance

---

**Development Guide Status**: ✅ Complete  
**Last Updated**: 2026-01-21  
**Next Review**: Quarterly or major feature updates
