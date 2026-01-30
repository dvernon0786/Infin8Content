# Source Tree Analysis - Infin8Content

Generated: 2026-01-23 (Deep Scan Update)  
Repository Type: Monorepo (3 parts)  
Architecture: Multi-tenant SaaS platform

## Project Structure Overview

```
project-root/
├── infin8content/          # Next.js 16.1.1 web application (Part: infin8content)
│   ├── app/               # Next.js App Router (primary entry point)
│   │   ├── api/           # API routes (71 endpoints)
│   │   ├── dashboard/     # Main application dashboard
│   │   ├── (auth)/        # Authentication pages
│   │   ├── payment/       # Stripe payment pages
│   │   └── globals.css    # Global styles with design tokens
│   ├── components/        # React components (22 directories)
│   │   ├── ui/           # Reusable UI components (Radix-based)
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── marketing/    # Landing page components
│   │   ├── articles/     # Article management components
│   │   └── mobile/       # Mobile-optimized components
│   ├── lib/              # Utility libraries and services
│   │   ├── supabase/    # Database client and queries
│   │   ├── services/    # External API integrations
│   │   └── utils/       # Shared utility functions
│   ├── supabase/        # Database configuration and migrations
│   │   ├── migrations/  # Schema migrations (31 files)
│   │   └── config.toml  # Supabase project configuration
│   ├── __tests__/       # Comprehensive test suite
│   └── public/         # Static assets
├── tools/               # Development utilities (Part: tools)
│   └── eslint-plugin-design-system/  # Design system compliance
├── _bmad/              # BMad Method framework (Part: _bmad)
│   ├── bmm/            # Project management workflows
│   ├── bmb/            # Business management workflows
│   └── core/           # Core framework components
├── docs/               # Project documentation
├── accessible-artifacts/  # Generated project artifacts
└── components/         # Shared components (UI utilities)
```

## Critical Directories Analysis

### infin8content/app/ - Application Entry Points

**Primary Entry Points:**
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Landing page
- `app/dashboard/page.tsx` - Main dashboard
- `app/middleware.ts` - Authentication and routing middleware

**API Routes Structure:**
```
app/api/
├── admin/           # Admin management (7 endpoints)
├── analytics/       # Analytics and metrics (7 endpoints)
├── articles/        # Article management (13 endpoints)
│   └── publish/     # WordPress publishing (Story 5-1)
├── auth/           # Authentication (10 endpoints)
├── organizations/  # Organization management (4 endpoints)
├── payment/        # Stripe integration (2 endpoints)
├── research/       # Keyword research (1 endpoint)
├── seo/           # SEO optimization (5 endpoints)
├── team/          # Team collaboration (14 endpoints)
├── user/          # User management (2 endpoints)
└── webhooks/      # External service webhooks (2 endpoints)
```

### infin8content/components/ - Component Architecture

**UI Component System:**
- `components/ui/` - Base UI components (button, input, etc.)
- `components/shared/` - Cross-feature shared components
- `components/custom/` - Custom business logic components

**Feature-Specific Components:**
- `components/dashboard/` - Dashboard interface (38 components)
- `components/marketing/` - Landing page elements (21 components)
- `components/articles/` - Article management (14 components)
- `components/mobile/` - Mobile-optimized components (8 components)

### infin8content/lib/ - Core Services

**Database Layer:**
- `lib/supabase/` - Supabase client and RLS queries
- `lib/supabase/server.ts` - Server-side database client
- `lib/supabase/client.ts` - Client-side database client

**External Service Integrations:**
- `lib/services/wordpress-adapter.ts` - WordPress publishing (NEW)
- `lib/services/openrouter.ts` - AI content generation
- `lib/services/tavily.ts` - Research and keyword analysis
- `lib/services/brevo.ts` - Email and OTP services
- `lib/services/stripe.ts` - Payment processing

**Utility Libraries:**
- `lib/utils/` - Shared utility functions
- `lib/hooks/` - Custom React hooks
- `lib/types/` - TypeScript type definitions

### infin8content/supabase/ - Database Layer

**Migration Files:**
- `20260101124156_initial_schema.sql` - Core schema
- `20260104095303_link_auth_users.sql` - Auth integration
- `20260104100500_add_otp_verification.sql` - OTP system
- `20260105003507_add_stripe_payment_fields.sql` - Payment integration
- Additional migrations for features and fixes

**Configuration:**
- `config.toml` - Supabase project configuration
- Database functions and triggers
- RLS policies for security

## Integration Points

### Multi-Part Architecture

**Part 1 (infin8content) → Part 2 (tools):**
- ESLint plugin enforces design system compliance
- Shared TypeScript definitions

**Part 1 (infin8content) → Part 3 (_bmad):**
- Workflow configuration files
- Project management integration

### External Service Integrations

**API Integrations:**
- OpenRouter: AI content generation via `/lib/services/openrouter.ts`
- Tavily: Research via `/lib/services/tavily.ts`
- DataForSEO: SEO analysis via `/lib/services/dataforseo.ts`
- Brevo: Email/OTP via `/lib/services/brevo.ts`
- Stripe: Payments via `/lib/services/stripe.ts`
- WordPress: Publishing via `/lib/services/wordpress-adapter.ts`

**Database Integrations:**
- Supabase: Primary database with real-time subscriptions
- PostgreSQL: Underlying database with RLS policies

## Development Workflow

### Entry Points for Development

**Frontend Development:**
- `npm run dev` - Start development server (localhost:3000)
- `npm run storybook` - Component development (localhost:6006)

**Backend Development:**
- API routes in `app/api/` - Auto-deployed with Next.js
- Database migrations via Supabase CLI
- Background jobs via Inngest

### Testing Infrastructure

**Test Types:**
- Unit tests: `npm run test` (Vitest)
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e` (Playwright)
- Visual regression: `npm run test:visual`
- Accessibility: `npm run test:accessibility`

**Test Organization:**
- `__tests__/api/` - API endpoint tests
- `__tests__/components/` - Component tests
- `__tests__/lib/` - Library and service tests
- `__tests__/contracts/` - External API contract tests

### Build and Deployment

**Build Process:**
- `npm run build` - Production build
- `npm run typecheck` - TypeScript validation
- `npm run lint` - Code quality checks

**Deployment Configuration:**
- Next.js automatic deployment
- Supabase database migrations
- Environment-specific configurations

## Key Architectural Patterns

### Multi-Tenant Data Isolation
- RLS policies on all tables
- org_id foreign keys for data scoping
- User role-based permissions

### Component Architecture
- Atomic design principles
- Shared component library
- Feature-specific component organization

### API Design
- RESTful endpoints with consistent patterns
- TypeScript request/response schemas
- Comprehensive error handling

### Real-Time Features
- Supabase real-time subscriptions
- Graceful degradation to polling
- Non-blocking UI updates

## Security Architecture

### Authentication Flow
- Supabase Auth with OTP verification
- Session management via middleware
- Role-based access control

### Data Security
- Row Level Security (RLS) policies
- Multi-tenant data isolation
- Audit logging for compliance

### API Security
- Request validation with Zod schemas
- Rate limiting implementation
- Webhook signature verification

## Performance Optimizations

### Frontend Performance
- Code splitting with Next.js
- Component lazy loading
- Mobile-optimized components

### Database Performance
- Optimized queries with proper indexing
- Connection pooling via Supabase
- Efficient pagination strategies

### API Performance
- Background job processing with Inngest
- Caching strategies for frequently accessed data
- Optimistic UI updates

## Development Tools

### Code Quality
- ESLint with custom design system rules
- TypeScript strict mode
- Prettier code formatting

### Testing Tools
- Vitest for unit testing
- Playwright for E2E testing
- Storybook for component development

### Documentation
- Auto-generated API documentation
- Component documentation via Storybook
- Comprehensive project documentation
