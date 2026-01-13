# Development Guide

Generated: 2026-01-13 (Updated)  
Project: Infin8Content  
Framework: Next.js 16.1.1 with TypeScript  
Environment: Development

---

## Prerequisites

### Required Software
- **Node.js**: 18.x or higher (recommended: latest LTS)
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: For version control
- **Docker**: Required for local Supabase development

### Development Tools (Recommended)
- **VS Code**: With official extensions for TypeScript, Tailwind CSS, and ESLint
- **Postman**: For API testing
- **Supabase CLI**: For database management
- **Playwright Browser**: For E2E testing

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd infin8content
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### 4. Required Environment Variables

#### Database Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

#### Payment Configuration
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...
```

#### External API Keys
```bash
OPENROUTER_API_KEY=your-openrouter-api-key
TAVILY_API_KEY=your-tavily-api-key
DATAFORSEO_API_KEY=your-dataforseo-api-key
BREVO_API_KEY=your-brevo-api-key
```

#### Inngest Configuration
```bash
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

### 5. Database Setup

#### Option A: Local Development (Recommended)
```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# Generate TypeScript types
npx tsx scripts/generate-types.ts
```

#### Option B: Hosted Supabase
```bash
# Link to hosted project
supabase link --project-ref <project-ref>

# Apply migrations to hosted project
supabase migration up

# Generate types from hosted schema
supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
```

## Development Commands

### Running the Application
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- -p 3001

# Start with Turbopack (experimental)
npm run dev -- --turbo
```

### Building and Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Build and analyze bundle size
npm run build && npx @next/bundle-analyzer
```

### Testing Commands
```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests headed (with browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Type checking
npx tsc --noEmit
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development server
npm run dev

# Make changes and test
npm run test

# Run E2E tests for critical features
npm run test:e2e

# Commit changes
git add .
git commit -m "feat: add new feature"
```

### 2. Database Changes
```bash
# Create new migration
supabase db diff --schema public --use-migra -f new_migration.sql

# Edit migration file
nano supabase/migrations/new_migration.sql

# Apply migration
supabase db reset

# Regenerate types
npx tsx scripts/generate-types.ts
```

### 3. API Development
```bash
# Create new API route
mkdir -p app/api/new-endpoint
touch app/api/new-endpoint/route.ts

# Write API handler
# Follow existing patterns in app/api/

# Add tests
touch tests/api/new-endpoint.test.ts

# Run tests
npm run test
```

### 4. Component Development
```bash
# Create new component
touch components/ui/new-component.tsx
touch components/ui/new-component.test.tsx

# Follow existing component patterns
# Use TypeScript interfaces for props
# Add proper accessibility attributes

# Test component
npm run test -- components/ui/new-component.test.tsx
```

## Database Development

### Migration Management
```bash
# Create new migration
supabase migration new new_feature_table

# Apply all migrations
supabase db reset

# Check migration status
supabase migration list

# Generate types after schema changes
npx tsx scripts/generate-types.ts
```

### Local Database Management
```bash
# Start local Supabase
supabase start

# View logs
supabase logs

# Access database directly
supabase db shell

# Reset to clean state
supabase db reset

# Stop local instance
supabase stop
```

### Database Seeding
```bash
# Run seed script (if available)
npx tsx scripts/seed.ts

# Or manually insert test data
supabase db shell
```

## Testing Strategy

### Unit Testing (Vitest)
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- components/ui/button.test.tsx

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

### E2E Testing (Playwright)
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests with UI
npm run test:e2e:ui

# Run tests headed
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

### Test File Organization
```
tests/
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   ├── lib/                 # Library function tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   └── database/            # Database operation tests
└── e2e/                     # End-to-end tests
    ├── auth.spec.ts         # Authentication flows
    ├── dashboard.spec.ts    # Dashboard functionality
    └── articles.spec.ts     # Article generation
```

## Code Style and Standards

### ESLint Configuration
- **Base**: Next.js ESLint configuration
- **TypeScript**: Strict type checking enabled
- **React**: React hooks rules enforced
- **Accessibility**: A11y rules enabled

### TypeScript Configuration
- **Strict Mode**: All strict checks enabled
- **Target**: ES2017 for modern browser support
- **Module**: ESNext with bundler resolution
- **JSX**: React-jsx transform for better performance

### Component Standards
```typescript
// Component interface example
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### API Route Standards
```typescript
// API route example
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);
    
    // Process request
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

## Debugging and Troubleshooting

### Common Development Issues

#### Environment Variable Errors
```bash
# Check environment variables
npm run dev

# If missing variables error appears:
# 1. Check .env.local exists
# 2. Verify all required variables are set
# 3. Restart development server
```

#### Database Connection Issues
```bash
# Check Supabase status
supabase status

# Reset database if needed
supabase db reset

# Regenerate types
npx tsx scripts/generate-types.ts
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Clear TypeScript cache
rm -rf .next/types

# Restart development server
npm run dev
```

### Debug Tools

#### Next.js Debug Mode
```bash
# Start with debug logging
DEBUG=* npm run dev

# Or specific module debug
DEBUG=next:* npm run dev
```

#### Database Debugging
```bash
# View database logs
supabase logs

# Access database directly
supabase db shell

# Run specific query
supabase db shell --command "SELECT * FROM users LIMIT 10;"
```

#### API Debugging
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Or use Postman for complex requests
```

## Performance Optimization

### Development Performance
```bash
# Use Turbopack for faster builds (experimental)
npm run dev -- --turbo

# Enable fast refresh
# Automatic in Next.js development

# Optimize imports
# Use barrel exports for cleaner imports
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for large dependencies
npm ls --depth=0
```

### Database Performance
```bash
# Check query performance
supabase db shell --command "EXPLAIN ANALYZE SELECT * FROM articles;"

# Add indexes if needed
# Create migration for new indexes
```

## Deployment Preparation

### Pre-Deployment Checklist
```bash
# 1. Run all tests
npm run test
npm run test:e2e

# 2. Type checking
npx tsc --noEmit

# 3. Linting
npm run lint

# 4. Build test
npm run build

# 5. Environment validation
# Ensure all production variables are set
```

### Environment-Specific Builds
```bash
# Development build
npm run build

# Production build
NODE_ENV=production npm run build

# Build with specific environment
NODE_ENV=staging npm run build
```

## Contributing Guidelines

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes with proper commits
git add .
git commit -m "feat: add new feature description"

# 3. Run tests
npm run test
npm run test:e2e

# 4. Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format
```
feat: add new feature
fix: fix bug description
docs: update documentation
style: code formatting changes
refactor: code refactoring
test: add or update tests
chore: build process or dependency changes
```

### Code Review Process
1. Ensure all tests pass
2. Check TypeScript types
3. Verify ESLint passes
4. Test functionality manually
5. Request review from team member

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*
