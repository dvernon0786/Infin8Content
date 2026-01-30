# Development Guide - Infin8Content

## Overview
Infin8Content is a Next.js 16.1.1 application with TypeScript, providing AI-powered content creation capabilities. This guide covers setup, development workflow, and best practices.

## Prerequisites

### System Requirements
- **Node.js**: Version 20 or higher
- **npm**: Version 9 or higher (or yarn/pnpm)
- **Git**: Latest stable version
- **VS Code**: Recommended with extensions

### Required Accounts
- **Supabase**: Database and authentication
- **Stripe**: Payment processing (test mode)
- **OpenRouter**: AI services (API key)
- **Brevo**: Email service (API key)

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Infin8Content/infin8content
npm install
```

### 2. Environment Configuration
Create `.env.local` with required variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_key

# Brevo Configuration
BREVO_API_KEY=your_brevo_key

# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_key
INNGEST_SIGNING_KEY=your_signing_key
```

### 3. Database Setup
```bash
# If using local Supabase
supabase start

# Link to hosted project
supabase link --project-ref <project-ref>

# Apply migrations
supabase db reset

# Generate TypeScript types
npx tsx scripts/generate-types.ts
```

### 4. Start Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Testing Commands
```bash
npm run test                    # Run unit tests (Vitest)
npm run test:ui                 # Vitest UI
npm run test:run               # Run tests once
npm run test:contracts         # Contract tests
npm run test:integration       # Integration tests
npm run test:e2e               # E2E tests (Playwright)
npm run test:e2e:ui            # Playwright UI
npm run test:visual            # Visual regression tests
npm run test:responsive        # Responsive design tests
npm run test:accessibility     # Accessibility tests
npm run test:ts-001           # Core integration tests
```

### Storybook Commands
```bash
npm run storybook            # Start Storybook
npm run build-storybook      # Build Storybook
```

## Project Structure

### Key Directories
- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components
- `/lib` - Core business logic and services
- `/__tests__` - Unit and integration tests
- `/tests` - E2E tests
- `/public` - Static assets
- `/scripts` - Utility scripts

### Component Organization
```
components/
├── marketing/     # Landing page components
├── dashboard/    # Dashboard components
├── analytics/     # Analytics components
├── articles/      # Article management
├── ui/           # Base UI components
├── custom/       # Business-specific
└── mobile/       # Mobile-optimized
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
npm run dev

# Run tests
npm run test
npm run test:e2e

# Type check
npm run typecheck

# Lint
npm run lint
```

### 2. Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user journeys
- **Contract Tests**: Test external service integrations

### 3. Code Quality
```bash
# Before committing
npm run typecheck
npm run lint
npm run test

# Format code
npm run format  # if configured
```

## Database Development

### Migrations
```bash
# Create new migration
supabase migration new new_feature

# Apply migrations
supabase db push

# Reset database (development)
supabase db reset
```

### Type Generation
```bash
# Generate TypeScript types from database
npx tsx scripts/generate-types.ts

# Alternative with Supabase CLI
supabase gen types typescript --local > lib/supabase/database.types.ts
```

### Database Patterns
- Use Row Level Security (RLS) for multi-tenancy
- Include `organization_id` in all user-scoped tables
- Use UUID primary keys
- Add `created_at` and `updated_at` timestamps

## API Development

### Route Structure
```typescript
// app/api/articles/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  keyword: z.string().min(1),
  targetWordCount: z.number().min(500),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = schema.parse(body)
  
  // Business logic here
  
  return NextResponse.json({ success: true })
}
```

### Best Practices
- Use Zod for input validation
- Return consistent error responses
- Include proper TypeScript types
- Handle authentication middleware
- Use proper HTTP status codes

## Component Development

### Component Structure
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Guidelines
- Use TypeScript interfaces for props
- Implement proper forwardRef
- Use class-variance-authority for variants
- Include proper accessibility attributes
- Write tests for all components

## Service Development

### Service Pattern
```typescript
// lib/services/article-service.ts
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type Article = Database['public']['Tables']['articles']['Row']

export class ArticleService {
  private supabase = createClient()

  async getArticles(organizationId: string): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createArticle(article: Omit<Article, 'id' | 'created_at'>): Promise<Article> {
    const { data, error } = await this.supabase
      .from('articles')
      .insert(article)
      .single()

    if (error) throw error
    return data
  }
}
```

## Testing Guidelines

### Unit Tests
```typescript
// __tests__/lib/services/article-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ArticleService } from '@/lib/services/article-service'

describe('ArticleService', () => {
  let service: ArticleService

  beforeEach(() => {
    service = new ArticleService()
  })

  it('should get articles for organization', async () => {
    const articles = await service.getArticles('org-id')
    expect(Array.isArray(articles)).toBe(true)
  })
})
```

### Integration Tests
```typescript
// __tests__/integration/articles.test.ts
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/articles/route'

describe('Articles API', () => {
  it('should create article', async () => {
    const request = new Request('http://localhost:3000/api/articles', {
      method: 'POST',
      body: JSON.stringify({ keyword: 'test', targetWordCount: 1000 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### E2E Tests
```typescript
// tests/e2e/article-creation.spec.ts
import { test, expect } from '@playwright/test'

test('should create article', async ({ page }) => {
  await page.goto('/dashboard/articles')
  await page.fill('[data-testid=keyword-input]', 'test keyword')
  await page.click('[data-testid=generate-button]')
  
  await expect(page.locator('[data-testid=article-status]')).toBeVisible()
})
```

## Environment Management

### Development Environment
```bash
# .env.local (gitignored)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

### Production Environment
```bash
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
```

### Environment Variables
- Use `.env.local` for local development
- Use Vercel dashboard for production
- Keep secrets out of repository
- Validate environment variables on startup

## Performance Optimization

### Frontend Optimization
```typescript
// Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
})

// Image optimization
import Image from 'next/image'
<Image src="/image.jpg" alt="Description" width={500} height={300} />
```

### Backend Optimization
```typescript
// Database query optimization
const { data } = await supabase
  .from('articles')
  .select('id, title, created_at')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(20)

// Caching strategy
import { cache } from 'react'

export const getArticles = cache(async (orgId: string) => {
  // Cached function
})
```

## Debugging

### Frontend Debugging
- Use React DevTools
- Check Network tab in browser
- Use console.log for debugging
- Check Next.js dev server logs

### Backend Debugging
```typescript
// Logging
console.log('Debug info:', data)

// Error handling
try {
  const result = await someOperation()
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}
```

### Database Debugging
```bash
# Check database logs
supabase logs

# Run queries
supabase db shell
```

## Deployment

### Vercel Deployment
```bash
# Build and deploy
npm run build
vercel --prod

# Environment variables set in Vercel dashboard
```

### Database Deployment
```bash
# Apply migrations to production
supabase db push

# Backup before deployment
supabase db dump
```

## Common Issues

### 1. Environment Variables
```bash
# Error: Missing environment variables
# Solution: Check .env.local and Vercel settings
```

### 2. Database Connection
```bash
# Error: Database connection failed
# Solution: Check DATABASE_URL and Supabase status
```

### 3. Type Errors
```bash
# Error: TypeScript type errors
# Solution: Run npm run typecheck and fix issues
```

### 4. Test Failures
```bash
# Error: Tests failing
# Solution: Check test setup and mock external services
```

## Best Practices

### 1. Code Organization
- Keep components focused and small
- Use consistent naming conventions
- Separate business logic from UI
- Write tests for all features

### 2. Performance
- Use code splitting for large components
- Optimize images and assets
- Implement proper caching
- Monitor bundle size

### 3. Security
- Validate all inputs
- Use HTTPS in production
- Implement proper authentication
- Keep dependencies updated

### 4. Accessibility
- Use semantic HTML
- Include ARIA labels
- Test with screen readers
- Ensure keyboard navigation

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)

### Tools
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing
- [Storybook](https://storybook.js.org/) - Component development
- [ESLint](https://eslint.org/) - Code linting

### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Discord Communities](https://discord.gg/)

## Support

For project-specific issues:
1. Check existing documentation
2. Review test files for examples
3. Check GitHub issues
4. Contact development team

This development guide provides comprehensive information for working with the Infin8Content codebase, from initial setup to deployment and best practices.
