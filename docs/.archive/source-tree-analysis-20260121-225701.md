# Source Tree Analysis

Generated: 2026-01-20 (Updated)  
Project: Infin8Content  
Framework: Next.js 16.1.1 with TypeScript  
Structure: Monorepo with Main Web Application + Development Tools  
Scan Type: Deep Scan (Critical files analyzed)

---

## Project Structure Overview

```
infin8content/                              # Main application directory
├── app/                                    # Next.js App Router pages
│   ├── (auth)/                            # Authentication route group
│   │   ├── layout.tsx                     # Auth layout wrapper
│   │   ├── login/page.tsx                 # Login page
│   │   ├── register/page.tsx              # Registration page
│   │   └── verify-otp/page.tsx            # Email verification page
│   ├── accept-invitation/                 # Team invitation acceptance
│   │   └── page.tsx                       # Invitation handler
│   ├── api/                               # API routes (44 endpoints)
│   │   ├── articles/                      # Article management APIs
│   │   │   ├── [id]/cancel/route.ts       # Cancel article generation
│   │   │   ├── [id]/diagnostics/route.ts  # Generation diagnostics
│   │   │   ├── fix-stuck/route.ts         # Fix stuck generation
│   │   │   ├── generate/route.ts           # Generate AI content
│   │   │   ├── queue/route.ts             # Queue generation
│   │   │   ├── status/[id]/route.ts       # Get generation progress
│   │   │   ├── test-inngest/route.ts      # Test Inngest integration
│   │   │   └── usage/route.ts             # Usage statistics
│   │   ├── auth/                          # Authentication APIs
│   │   │   ├── login/route.ts             # User login
│   │   │   ├── logout/route.ts            # User logout
│   │   │   ├── register/route.ts          # User registration
│   │   │   ├── resend-otp/route.ts        # Resend verification OTP
│   │   │   └── verify-otp/route.ts        # Verify email OTP
│   │   ├── organizations/                 # Organization management
│   │   │   ├── create/route.ts            # Create organization
│   │   │   └── update/route.ts            # Update organization
│   │   ├── payment/                       # Payment processing
│   │   │   └── create-checkout-session/route.ts # Stripe checkout
│   │   ├── research/                      # Research functionality
│   │   │   └── keywords/route.ts          # Keyword research API
│   │   ├── team/                          # Team management
│   │   │   ├── accept-invitation/route.ts # Accept team invitation
│   │   │   ├── cancel-invitation/route.ts # Cancel invitation
│   │   │   ├── invite/route.ts            # Invite team member
│   │   │   ├── members/route.ts           # List team members
│   │   │   ├── remove-member/route.ts     # Remove team member
│   │   │   ├── resend-invitation/route.ts # Resend invitation
│   │   │   └── update-role/route.ts       # Update member role
│   │   ├── user/                          # User management
│   │   │   ├── delete/route.ts            # Delete user account
│   │   │   └── export/route.ts           # Export user data
│   │   ├── webhooks/                      # External webhook handlers
│   │   │   └── stripe/route.ts            # Stripe webhook processor
│   │   ├── debug/payment-status/route.ts  # Debug payment issues
│   │   └── inngest/route.ts              # Inngest webhook endpoint
│   ├── auth/                              # Auth callback routes
│   │   └── callback/route.ts              # OAuth callback handler
│   ├── components/                        # App-specific components
│   │   ├── payment-status-banner.tsx     # Payment status notification
│   │   └── suspension-message.tsx         # Account suspension UI
│   ├── create-organization/               # Organization creation flow
│   │   └── page.tsx                       # Organization setup page
│   ├── dashboard/                         # Main application dashboard
│   │   ├── articles/                      # Article management section
│   │   │   ├── page.tsx                   # Articles list view
│   │   │   └── [id]/page.tsx              # Article detail view
│   │   ├── research/                      # Research section
│   │   │   └── page.tsx                   # Research interface
│   │   ├── settings/                      # Settings section
│   │   │   ├── organization/page.tsx      # Organization settings
│   │   │   └── team/page.tsx              # Team management
│   │   └── page.tsx                       # Main dashboard page
│   ├── globals.css                        # Global CSS styles
│   ├── layout.tsx                         # Root layout component
│   ├── middleware.ts                      # Request middleware (auth/suspension)
│   ├── page.tsx                           # Landing page
│   ├── payment/                           # Payment flow
│   │   ├── cancel/page.tsx                # Payment cancellation
│   │   ├── success/page.tsx               # Payment success
│   │   └── return/page.tsx                # Payment return
│   └── settings/                         # Settings section
│       ├── billing/page.tsx               # Billing management
│       └── profile/page.tsx              # User profile
├── components/                            # Reusable UI components
│   ├── articles/                          # Article-specific components
│   │   ├── article-card.tsx              # Article display card
│   │   ├── article-editor.tsx            # Rich text editor
│   │   ├── article-generator.tsx          # AI generation interface
│   │   ├── article-list.tsx              # Article listing
│   │   ├── article-preview.tsx            # Content preview
│   │   └── article-status.tsx            # Generation status
│   ├── dashboard/                         # Dashboard components
│   │   ├── dashboard-header.tsx           # Main navigation header
│   │   ├── usage-stats.tsx                # Usage statistics display
│   │   └── quick-actions.tsx              # Quick action buttons
│   ├── guards/                            # Protection components
│   │   └── auth-guard.tsx                 # Authentication guard
│   ├── research/                          # Research components
│   │   ├── keyword-research.tsx           # Keyword research interface
│   │   └── research-results.tsx           # Results display
│   ├── settings/                          # Settings components
│   │   └── organization-settings.tsx      # Organization configuration
│   └── ui/                                # Base UI components (Radix UI)
│       ├── avatar.tsx                     # User avatar component
│       ├── button.tsx                     # Button component
│       ├── dialog.tsx                     # Modal dialog
│       ├── dropdown-menu.tsx              # Dropdown menu
│       ├── progress.tsx                   # Progress indicator
│       ├── separator.tsx                   # Visual separator
│       ├── slot.tsx                       # Component composition slot
│       └── tooltip.tsx                    # Tooltip component
├── hooks/                                 # Custom React hooks
│   ├── use-article-progress.ts            # Article generation progress
│   ├── use-mobile.ts                      # Mobile detection hook
│   └── use-realtime-articles.ts           # Real-time article updates
├── lib/                                   # Core business logic
│   ├── config/                            # Configuration management
│   ├── inngest/                           # Inngest workflow definitions
│   ├── services/                          # External API integrations
│   │   ├── article-generation/            # AI content generation pipeline
│   │   ├── openrouter/                    # AI model integration
│   │   ├── tavily/                        # Research API client
│   │   └── dataforseo/                    # SEO data services
│   ├── supabase/                          # Database client and types
│   ├── stripe/                            # Payment logic and webhooks
│   └── utils.ts                           # Utility functions
├── public/                                # Static assets
├── scripts/                               # Build and utility scripts
├── supabase/                              # Database configuration
│   ├── migrations/                        # Database schema migrations (17 files)
│   └── config.toml                        # Supabase project configuration
├── tests/                                 # Test suites
│   ├── components/                        # Component tests
│   ├── e2e/                               # End-to-end tests
│   └── unit/                              # Unit tests
├── types/                                 # TypeScript type definitions
├── .env.example                           # Environment variables template
├── .gitignore                             # Git ignore rules
├── components.json                        # shadcn/ui component configuration
├── eslint.config.mjs                      # ESLint configuration
├── next.config.ts                         # Next.js configuration
├── package.json                           # Dependencies and scripts
├── playwright.config.ts                   # Playwright E2E test config
├── postcss.config.mjs                     # PostCSS configuration
├── tsconfig.json                          # TypeScript configuration
├── vitest.config.ts                       # Vitest unit test config
└── vitest.setup.ts                        # Test environment setup
```

## Critical Directories Explained

### `/app` - Next.js App Router
The heart of the application using Next.js 13+ App Router pattern:
- **Route Groups**: `(auth)` for authentication flows without affecting URL structure
- **API Routes**: All backend endpoints in `/api` following RESTful conventions
- **Layouts**: Shared UI components and authentication middleware
- **Middleware**: Request interception for auth and suspension checks

### `/components` - UI Component Library
Modular component architecture with clear separation:
- **Base Components**: `/ui` contains reusable Radix UI primitives
- **Feature Components**: Organized by domain (articles, dashboard, research)
- **Guard Components**: Protection wrappers for authentication and authorization

### `/lib` - Business Logic Layer
Core application logic and external integrations:
- **Services**: External API clients (OpenRouter, Tavily, Stripe, etc.)
- **Database**: Supabase client with TypeScript types
- **Utils**: Shared utility functions and helpers
- **Config**: Environment-specific configuration management

### `/supabase` - Database Layer
Database schema and migration management:
- **Migrations**: 17 timestamped migration files for schema evolution
- **Config**: Local and hosted Supabase project configuration
- **Types**: Auto-generated TypeScript types from database schema

### `/tests` - Testing Infrastructure
Comprehensive testing strategy:
- **Unit Tests**: Component and function testing with Vitest
- **E2E Tests**: User workflow testing with Playwright
- **Integration Tests**: API and database integration testing

## Key Integration Points

### Authentication Flow
1. **Entry Point**: `/app/(auth)` routes for unauthenticated users
2. **Middleware**: `/app/middleware.ts` validates all requests
3. **API Layer**: `/app/api/auth/*` handles authentication logic
4. **Database**: Supabase auth.users table with custom user metadata

### Payment Integration
1. **API**: `/app/api/payment/*` handles Stripe checkout sessions
2. **Webhooks**: `/app/api/webhooks/stripe` processes payment events
3. **UI**: `/app/payment/*` routes for payment flow
4. **State**: Suspension system manages payment grace periods

### Content Generation Pipeline
1. **Frontend**: `/components/articles/article-generator.tsx` user interface
2. **API**: `/app/api/articles/generate` queues generation requests
3. **Backend**: `/lib/services/article-generation/` AI processing pipeline
4. **Progress**: Real-time updates via `/hooks/use-realtime-articles.ts`

### Team Management
1. **Invitations**: `/app/api/team/invite` creates invitation records
2. **Acceptance**: `/app/accept-invitation` handles invitation acceptance
3. **Management**: `/app/dashboard/settings/team` team administration UI
4. **Permissions**: Role-based access control throughout application

## Development Workflow Integration

### Environment Setup
- **Configuration**: `/lib/config/` manages environment-specific settings
- **Validation**: Startup validation ensures all required environment variables
- **Database**: Supabase migrations applied automatically on development start

### Build Process
- **Next.js**: Standard build with TypeScript compilation
- **Tailwind**: CSS optimization and purging
- **Asset Optimization**: Image and static asset optimization

### Testing Pipeline
- **Unit Tests**: `npm run test` runs Vitest suite
- **E2E Tests**: `npm run test:e2e` runs Playwright tests
- **CI/CD**: GitHub Actions for automated testing and deployment

## Security Architecture

### Multi-Tenant Isolation
- **Database Level**: Row Level Security (RLS) on all tables
- **API Level**: Organization-based query filtering
- **UI Level**: Role-based component access control

### Authentication & Authorization
- **JWT Tokens**: Supabase-based authentication with automatic refresh
- **Middleware Protection**: Route-level authentication validation
- **Role Guards**: Component-level permission checking

### Data Protection
- **Input Validation**: Zod schema validation on all API inputs
- **Audit Logging**: Comprehensive activity tracking in audit_logs table
- **Error Handling**: Secure error responses without sensitive data exposure

## Performance Considerations

### Database Optimization
- **Indexing Strategy**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **Caching**: Research result caching to reduce API costs

### Frontend Performance
- **Code Splitting**: Route-based component lazy loading
- **Static Optimization**: Next.js automatic static optimization
- **Bundle Analysis**: Regular bundle size monitoring

### Real-Time Features
- **Supabase Subscriptions**: Real-time database updates
- **Progress Tracking**: WebSocket-based generation progress
- **Optimistic Updates**: Enhanced user experience with instant feedback

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*
