---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/epics.md'
workflowType: 'architecture'
lastStep: 8
project_name: 'Infin8Content'
user_name: 'Dghost'
date: '2026-01-10'
status: 'complete-implementation-ready'
lastUpdated: '2026-01-10'
completionSummary: 'SEO Optimization Framework architecture fully integrated and validated. All Epic 14 stories mapped to implementation components. MVP blocker requirements addressed with modular, scalable design.'
---

# Architecture Documentation

**Project:** Infin8Content  
**Generated:** 2026-01-04  
**Updated:** 2026-01-10 (SEO Optimization Framework Added)
**Architecture Pattern:** Component-based with API Routes + SEO Optimization Layer

## Executive Summary

Infin8Content is a Next.js 16.1.1 full-stack web application implementing a multi-tenant SaaS platform. The architecture follows Next.js App Router conventions with server-side rendering, API routes for backend functionality, and Supabase for database and authentication.

## Technology Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Validation:** Zod 4.3.4

### Backend
- **Runtime:** Next.js API Routes (serverless functions)
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Email Service:** Brevo (transactional emails)

### Infrastructure
- **Deployment:** Vercel (recommended)
- **Database Hosting:** Supabase (managed PostgreSQL)
- **CDN:** Vercel Edge Network

## Architecture Pattern

**Type:** Component-based architecture with API routes

The application follows a layered architecture:

1. **Presentation Layer:** React Server Components and Client Components
2. **API Layer:** Next.js API Routes (RESTful endpoints)
3. **Service Layer:** External service clients (Brevo, Supabase)
4. **Data Layer:** Supabase PostgreSQL database

## System Components

### Frontend Components

**Pages:**
- `app/page.tsx` - Home page
- `app/(auth)/register/page.tsx` - User registration
- `app/(auth)/verify-email/page.tsx` - OTP verification

**Layout:**
- `app/layout.tsx` - Root layout with global styles

**Middleware:**
- `app/middleware.ts` - Route protection and session management

### Backend Components

**API Routes:**
- `app/api/auth/register/route.ts` - User registration endpoint
- `app/api/auth/verify-otp/route.ts` - OTP verification endpoint
- `app/api/auth/resend-otp/route.ts` - OTP resend endpoint
- `app/auth/callback/route.ts` - Supabase Auth callback handler

**Services:**
- `lib/services/brevo.ts` - Email service client
- `lib/services/otp.ts` - OTP generation and validation

**Supabase Clients:**
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client (with cookies)
- `lib/supabase/middleware.ts` - Session refresh middleware
- `lib/supabase/env.ts` - Environment validation

### Data Architecture

**Database:** Supabase PostgreSQL

**Tables:**
- `organizations` - Multi-tenant organization data
- `users` - User accounts with RBAC roles
- `otp_codes` - Temporary OTP storage

**Relationships:**
- `users.org_id` → `organizations.id` (CASCADE delete)
- `users.auth_user_id` → `auth.users.id` (Supabase Auth)
- `otp_codes.user_id` → `users.id` (CASCADE delete)

**See:** [Data Models](./data-models.md) for detailed schema

## API Design

**Pattern:** RESTful API using Next.js API Routes

**Base Path:** `/api`

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - OTP resend

**Authentication:** Supabase Auth sessions (cookies)

**Validation:** Zod schema validation on all requests

**See:** [API Contracts](./api-contracts.md) for detailed API documentation

## Component Overview

### Authentication Flow

1. **Registration:**
   ```
   User → Register Page → POST /api/auth/register
   → Supabase Auth (create user)
   → Database (create user record)
   → Brevo (send OTP email)
   → User receives email
   ```

2. **Verification:**
   ```
   User → Verify Page → POST /api/auth/verify-otp
   → Database (validate OTP)
   → Database (mark user verified)
   → Redirect to dashboard
   ```

3. **Session Management:**
   ```
   Request → Middleware → Check Supabase session
   → Check otp_verified status
   → Allow/deny access
   ```

### Multi-Tenant Architecture

- **Organizations:** Top-level tenant entity
- **Users:** Belong to organizations (nullable until org created)
- **RBAC:** Role-based access control (owner, editor, viewer)
- **Data Isolation:** Future RLS policies will enforce tenant isolation

## Source Tree

**See:** [Source Tree Analysis](./source-tree-analysis.md) for detailed directory structure

**Key Directories:**
- `app/` - Application routes and pages
- `app/api/` - API route handlers
- `lib/` - Shared utilities and services
- `supabase/` - Database migrations

## Development Workflow

1. **Local Development:**
   - `npm run dev` - Start development server
   - Hot module replacement enabled
   - TypeScript type checking

2. **Database Changes:**
   - Create migration in `supabase/migrations/`
   - Apply via Supabase Dashboard or CLI
   - Regenerate TypeScript types

3. **Testing:**
   - Unit tests: `npm test`
   - Linting: `npm run lint`

**See:** [Development Guide](./development-guide.md) for detailed instructions

## Deployment Architecture

**Platform:** Vercel (recommended)

**Build Process:**
- Next.js production build
- Static page generation
- Serverless function optimization

**Environment Variables:**
- Configured in Vercel project settings
- Validated on app startup

**Database:**
- Supabase hosted PostgreSQL
- Connection pooler for IPv4 networks
- Automatic backups

## Security Architecture

### Authentication
- Supabase Auth for user authentication
- Session-based authentication (cookies)
- OTP verification for email confirmation

### Authorization
- Middleware-based route protection
- OTP verification requirement for protected routes
- Future: Row Level Security (RLS) for data isolation

### Data Protection
- Environment variables for secrets
- Service role key server-side only
- HTTPS enforced in production

## Integration Points

### Supabase Integration
- **Auth:** User authentication and session management
- **Database:** PostgreSQL with migrations
- **Real-time:** Future websocket support

### Brevo Integration
- **Email Service:** Transactional emails for OTP delivery
- **API Key:** Stored in environment variables

### Next.js Integration
- **App Router:** File-based routing
- **API Routes:** Serverless functions
- **Middleware:** Request interception

## Testing Strategy

**Current:**
- Unit tests for API routes (`route.test.ts`)
- ESLint for code quality

**Future:**
- Integration tests
- E2E tests
- Database migration tests

## Performance Considerations

- **Server Components:** Default for better performance
- **Static Generation:** Where possible
- **Database Indexes:** Optimized for common queries
- **CDN:** Vercel Edge Network for static assets

## Scalability

- **Serverless Functions:** Auto-scaling API routes
- **Database:** Supabase managed scaling
- **Multi-tenant:** Organization-based data partitioning

## Future Enhancements

- Row Level Security (RLS) policies
- Real-time subscriptions
- Caching strategy
- Rate limiting
- Monitoring and logging

## Related Documentation

- [Project Overview](./project-overview.md) - High-level overview
- [Source Tree Analysis](./source-tree-analysis.md) - Directory structure
- [API Contracts](./api-contracts.md) - API endpoints
- [Data Models](./data-models.md) - Database schema
- [Development Guide](./development-guide.md) - Setup and development
