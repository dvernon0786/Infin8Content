---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/ux-design-specification.md'
  - '_bmad-output/ux-design-validation-report.md'
  - '_bmad-output/analysis/research/market-infin8content-comprehensive-research-2025-12-20.md'
workflowType: 'architecture'
lastStep: 8
project_name: 'Infin8Content'
user_name: 'Dghost'
date: '2025-12-21'
status: 'complete'
completedAt: '2025-12-21'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The project includes 160 functional requirements organized into 13 major categories:

- **User Management & Access Control (12 FRs):** Paywall-first model requiring payment before dashboard access, role-based access control (RBAC), multi-tenant data isolation with row-level security, account suspension/activation workflows, and audit logging for compliance.

- **Content Research & Discovery (8 FRs):** Keyword research with search volume and difficulty metrics, keyword clustering for pillar content strategies, real-time web research via Tavily API with automatic citations, SERP analysis for competitor intelligence, and batch operations for efficiency.

- **Content Generation (24 FRs):** Section-by-section architecture enabling 3,000+ word articles, automatic citation inclusion for EEAT compliance, SEO optimization (keyword density, heading structure, meta tags), FAQ generation, internal linking suggestions, schema markup generation, image integration with alt text, version control and revision tracking, bulk editing capabilities.

- **Content Publishing & Distribution (12 FRs):** One-click publishing to 8+ CMS platforms (WordPress, Shopify, Webflow, Ghost, Wix, Squarespace, Blogger, webhooks), automatic Google Search Console indexing, social media post generation, bulk publishing operations, scheduled publishing with timezone support, OAuth token refresh automation.

- **E-Commerce Integration & Attribution (9 FRs):** Shopify/WooCommerce store connections, product catalog synchronization, product description generation, automatic product linking in blog content, UTM parameter generation for tracking, order matching via UTM tracking, revenue attribution reports, multi-store management.

- **White-Label & Multi-Tenancy (7 FRs):** Custom branding configuration (logo, colors, fonts), custom domain setup with SSL provisioning, client portal access with read-only permissions, multi-tenant data isolation, project management and assignment, client stakeholder invitations.

- **Analytics & Performance Tracking (14 FRs):** Persona-specific success metrics dashboards (time saved, content output, ROI), article performance tracking (views, rankings, conversions), keyword ranking data over time, content quality metrics (readability, SEO score, citations), feature adoption analytics, shareable attribution reports, ROI calculations per organization.

- **Billing & Usage Management (13 FRs):** Real-time usage credit tracking, usage limit enforcement per plan tier, overage fee calculation and billing, Stripe subscription management, plan upgrades/downgrades with prorated billing, invoice generation, API cost tracking and monitoring, upgrade suggestions based on usage patterns.

- **API & Integrations (5 FRs):** REST API endpoints for core operations, API key generation and management, rate limiting per API key, webhook support for custom integrations, webhook endpoint configuration.

- **Error Handling & Recovery (7 FRs):** Clear error messages with actionable next steps, one-click retry for failed operations, queue-based async processing, exponential backoff retry logic, concurrent request handling, graceful integration failure handling.

- **Collaboration & Workflow (6 FRs):** Team member commenting on articles, approval workflows before publishing, article assignment to team members, ownership and permission management, article status tracking (draft, in-review, approved, published), status change notifications.

- **Onboarding & Discovery (3 FRs):** Post-payment guided tours and tutorials, feature discovery mechanisms, help documentation and support resources.

- **Dashboard UI/UX (23 FRs):** Persona-specific dashboard widgets, real-time progress updates, customizable widget layouts, activity feeds, quick actions, revenue attribution visualization, queue status indicators, client switcher (one-click), search functionality, keyboard shortcuts, responsive design patterns.

**Non-Functional Requirements:**

The project includes 42 non-functional requirements across 9 critical quality attribute categories:

- **Performance (6 NFRs):** North Star Metric of < 5 minutes for 3,000-word article generation (99th percentile), < 2 seconds dashboard load time (95th percentile), < 1 second real-time progress update latency, < 30 seconds queue processing time, < 2 seconds API response times, support for 50+ concurrent article generations.

- **Security (8 NFRs):** AES-256 encryption at rest and TLS 1.3 in transit, multi-tenant data isolation with zero cross-organization leakage, OAuth 2.0 and JWT authentication with 24-hour session timeout, bcrypt-hashed API keys, PCI DSS compliance via Stripe, encrypted credential storage, RBAC enforcement, comprehensive audit logging.

- **Reliability & Availability (5 NFRs):** 99.9% uptime SLA for Agency plan (99.5% Pro, 99% Starter), < 1% combined API failure rate (Tavily + DataForSEO + OpenRouter), automatic retry with exponential backoff (3 attempts, > 80% success rate), daily backups with 30-day retention, graceful degradation for non-critical service failures.

- **Scalability (5 NFRs):** Support for 1,000 paying customers by Month 12, handle 10,000+ article generations/month, support 100,000+ articles in database, 1TB+ image storage capacity, auto-scaling infrastructure with < 5 minutes scale-up time.

- **Integration (5 NFRs):** 99%+ CMS publishing success rate, graceful rate limit handling for external APIs, automatic OAuth token refresh (1 hour before expiration), 99%+ webhook processing success rate, integration health monitoring with < 5 minutes alert time.

- **Accessibility (4 NFRs):** WCAG 2.1 Level AA compliance, 100% keyboard navigation support, screen reader compatibility (NVDA, JAWS, VoiceOver), WCAG contrast ratio requirements (4.5:1 normal text, 3:1 large text).

- **Data Quality (4 NFRs):** 70%+ articles score > 60 on Flesch-Kincaid readability, 80%+ articles include 3+ citations, 90%+ articles pass plagiarism check (> 95% original), 4.0+ average user quality rating.

- **Cost Efficiency (4 NFRs):** < $0.80/article API costs (Tavily + DataForSEO + LLM), < $1.50/article total COGS, < 15% support cost ratio, real-time cost monitoring with alerts when > 20% of revenue.

- **Compliance (4 NFRs):** GDPR compliance (data export, deletion, portability), CCPA compliance, data residency support (US default, EU optional), privacy policy and terms of service.

**Scale & Complexity:**

- **Primary domain:** Full-stack SaaS B2B platform (web application)
- **Complexity level:** Medium-High
- **Estimated architectural components:** 18+ feature modules
- **Technical stack:** Next.js App Router (frontend), Serverless APIs (Next.js API routes), Supabase Postgres with row-level security, Inngest workers (queue processing), Vercel Edge Network (CDN), Supabase websockets (real-time), Cloudflare R2 or Supabase Storage (images)
- **Integration complexity:** High (8+ CMS platforms with custom adapters, multiple external APIs, OAuth flows)
- **Multi-tenancy complexity:** High (row-level security, white-label architecture, custom domains, client portals)

### Technical Constraints & Dependencies

**Infrastructure Constraints:**

- **Serverless architecture:** Vercel for frontend deployment, Supabase for database and auth, Inngest for queue workers
- **Database:** Supabase Postgres with row-level security (RLS) for multi-tenant isolation
- **Queue system:** Inngest for async processing of article generation, publishing, and other long-running operations
- **Real-time:** Supabase websockets for progress updates, notifications, and live dashboard data
- **Storage:** Cloudflare R2 or Supabase Storage for image assets and file uploads
- **CDN:** Vercel Edge Network for static assets and global distribution

**External API Dependencies:**

- **Tavily API:** Real-time web search with citations ($0.08/query, ~5 queries per article)
- **DataForSEO API:** SERP analysis, keyword research, competitor intelligence ($0.0006-0.002/SERP, ~$0.01-0.1 per keyword research)
- **OpenRouter API:** LLM routing for GPT-4, Claude, and other models ($0.25-0.50/article)
- **Google Search Console API:** URL indexing and status tracking (OAuth, free)
- **Stripe API:** Payment processing, subscription management, invoice generation
- **CMS Platform APIs:** WordPress (REST API), Shopify (Admin API, OAuth), Webflow (CMS API), Ghost (Admin API), Wix (Partner API, OAuth), Squarespace (API), Blogger (Google OAuth), Custom webhooks (HMAC signature)
- **Image APIs:** Unsplash (free tier), DALL·E ($0.04/image)

**Performance Constraints:**

- **North Star Metric:** < 5 minutes for 3,000-word article generation (99th percentile) - critical business requirement
- **Dashboard load time:** < 2 seconds (95th percentile) for initial load, < 0.5 seconds for subsequent navigations
- **Real-time updates:** < 1 second latency between backend state change and frontend update, < 500ms for websocket message delivery
- **Concurrent processing:** Support 50+ concurrent article generations without > 20% performance degradation
- **Queue processing:** < 30 seconds from request submission to worker pickup, < 10 seconds average queue time

**Compliance Requirements:**

- **GDPR:** Data export API, account deletion flow (soft delete → 30-day grace → permanent), data portability, DPA for EU customers, cookie consent banner, optional EU data residency
- **CCPA:** Similar rights to GDPR (access, deletion, portability), privacy policy and terms
- **PCI DSS:** Handled by Stripe (we never touch credit card data)
- **Data residency:** US default (Supabase us-east-1), optional EU region for GDPR compliance

### Cross-Cutting Concerns Identified

**1. Multi-Tenant Data Isolation**
- Row-level security (RLS) policies on all tables with `org_id` foreign keys
- White-label configuration stored per organization (logo, colors, custom domain, branding)
- Usage tracking and billing isolation per organization
- Zero cross-organization data leakage requirement (security NFR)

**2. Real-Time Progress Updates**
- Websocket infrastructure for live progress tracking during article generation
- Queue visibility showing position and estimated time remaining
- Section-by-section progress granularity (keyword research → clustering → outline → writing → publishing)
- Graceful degradation when websocket connection drops

**3. Payment-First Access Control**
- Paywall model: no free trials, payment required before dashboard access
- Account suspension workflow after payment failure (7-day grace period)
- Account activation upon successful payment
- Payment status visibility in UI

**4. API Cost Management**
- Real-time cost tracking per organization (Tavily + DataForSEO + LLM costs)
- Usage limit enforcement per plan tier
- Overage billing calculation and invoicing
- Cost alerts when API costs exceed 20% of revenue per organization
- Cost efficiency target: < $0.80/article API costs, < $1.50/article total COGS

**5. Error Handling & Retry Logic**
- Exponential backoff retry strategy (3 attempts) for transient failures
- Graceful degradation when non-critical services fail (core features remain available)
- Clear error messages with actionable next steps
- One-click retry for failed operations
- Partial failure handling (e.g., "Tavily research complete, DataForSEO in progress")

**6. OAuth Token Management**
- Automatic token refresh before expiration (1 hour before expiry)
- Encrypted credential storage (AES-256) at rest, decrypted only in worker memory
- Secure token transmission and storage
- Token refresh success rate monitoring

**7. Revenue Attribution System**
- UTM parameter generation for content links
- E-commerce order matching via UTM tracking (Shopify/WooCommerce webhooks)
- Revenue attribution reports with shareable visualizations
- Time-aware attribution (attribution window configuration)
- Privacy compliance for order data

**8. White-Label Architecture**
- Custom domain setup with CNAME configuration and SSL auto-provisioning
- Subdomain per client (client1.agency.com, client2.agency.com)
- Runtime themeable components (data-driven branding from database)
- Client portal with read-only access, never showing "Infin8Content" branding
- Branding configuration stored in `organizations.white_label_settings` JSONB column

**9. Section-by-Section Content Generation**
- Token management for long-form articles (3,000+ words)
- Coherence maintenance across sections
- Fresh API calls per section (Tavily research + DataForSEO SERP analysis per section)
- Progress tracking at section granularity
- Error recovery at section level (retry individual sections without regenerating entire article)

**10. Queue-Based Async Processing**
- Inngest workers for async article generation, publishing, and other long-running operations
- State management for multi-step workflows
- Concurrent processing support (50+ concurrent article generations)
- Queue depth monitoring and alerting
- Real-time progress updates via websockets

**11. UX Architectural Implications**
- Real-time progress visualization requiring websocket infrastructure
- Multi-tenant white-label UI with runtime themeable components
- Information density balance with progressive disclosure and persona-specific views
- Responsive design with mobile, tablet, and desktop breakpoints
- Accessibility requirements (WCAG 2.1 AA) affecting component design and interaction patterns
- Performance expectations (fast load times, smooth interactions) driving caching and optimization strategies

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack Next.js web application (SaaS B2B platform)** based on project requirements analysis.

The PRD explicitly specifies the technical stack:
- **Frontend:** Next.js App Router (server-side rendering, deployed on Vercel Edge Network)
- **Backend:** Serverless APIs (Next.js API routes, Supabase Postgres database)
- **Queue Workers:** Inngest (async processing, auto-scaling)
- **Database:** Supabase Postgres with row-level security (RLS)
- **Storage:** Cloudflare R2 or Supabase Storage (images, files)
- **CDN:** Vercel Edge Network (static assets, global distribution)
- **Real-time:** Supabase websockets (progress updates, notifications)

### Starter Options Considered

**Option 1: create-next-app (Official Next.js CLI)**

The official Next.js starter via `create-next-app` provides:
- Next.js 15+ with App Router
- TypeScript support
- Tailwind CSS option
- ESLint configuration
- Basic project structure

**Limitations:**
- No Supabase integration pre-configured
- No authentication setup
- No database schema or RLS policies
- No queue worker setup (Inngest)
- Minimal SaaS patterns (multi-tenancy, billing, etc.)

**Option 2: T3 Stack (create-t3-app)**

The T3 stack (Next.js, TypeScript, tRPC, Prisma, NextAuth) provides:
- Production-ready patterns
- TypeScript-first approach
- Authentication setup (NextAuth)
- Database ORM (Prisma)
- tRPC for type-safe APIs

**Limitations:**
- Uses Prisma ORM (PRD specifies Supabase Postgres with RLS, not Prisma)
- Uses NextAuth (PRD specifies Supabase Auth, not NextAuth)
- No Inngest integration
- Different database approach than specified in PRD
- Would require significant refactoring to match PRD requirements

**Option 3: Custom Next.js + Supabase Setup**

Start with `create-next-app` and manually integrate Supabase:
- Full control over configuration
- Can integrate Supabase Auth and Postgres exactly as specified
- Can add Inngest workers per PRD requirements
- Can configure RLS policies from the start
- Matches PRD technical stack exactly

### Selected Starter: create-next-app with Manual Supabase Integration

**Rationale for Selection:**

1. **PRD Alignment:** The PRD explicitly specifies Next.js App Router, Supabase Postgres with RLS, and Inngest workers. Starting with `create-next-app` allows us to add these integrations exactly as specified without fighting against a different stack.

2. **Flexibility:** We can configure Supabase Auth, Postgres with RLS, and Inngest workers according to the PRD requirements without removing or refactoring existing patterns.

3. **Minimal Assumptions:** Starting with the official Next.js starter gives us a clean foundation without making architectural decisions that conflict with the PRD.

4. **Control:** We can configure multi-tenancy, row-level security, white-label architecture, and queue workers exactly as specified in the PRD from the beginning.

**Initialization Command:**

```bash
npx create-next-app@latest infin8content --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript configured with strict mode
- Next.js 15+ App Router architecture
- Node.js runtime (serverless on Vercel)
- ES modules support

**Styling Solution:**
- Tailwind CSS configured and ready
- CSS modules available as alternative
- Responsive design utilities included
- PostCSS configuration

**Build Tooling:**
- Next.js built-in bundler (Turbopack in development)
- Production optimizations (code splitting, image optimization, tree shaking)
- Vercel deployment configuration ready
- Environment variable support

**Testing Framework:**
- No testing framework included by default (can add Vitest/Jest later)
- ESLint configured for code quality
- TypeScript compiler for type checking

**Code Organization:**
- App Router structure (`app/` directory)
- Route-based file system routing
- Server Components and Client Components support
- API routes in `app/api/` directory
- Layout and template patterns
- Loading and error boundaries

**Development Experience:**
- Hot module reloading (HMR)
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Fast refresh for React components
- Development server with optimized builds

**Next Steps After Initialization:**

1. **Install Supabase dependencies:**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

2. **Configure Supabase client libraries** for Auth and Postgres access

3. **Set up Supabase Auth integration** for user authentication and session management

4. **Configure Supabase Postgres** with row-level security (RLS) policies for multi-tenant isolation

5. **Install and configure Inngest** for queue workers:
   ```bash
   npm install inngest
   ```

6. **Set up environment variables** for all services (Supabase, Inngest, external APIs)

7. **Configure Vercel deployment settings** for serverless functions and edge runtime

8. **Set up database schema** with `org_id` foreign keys and RLS policies

9. **Configure storage** (Cloudflare R2 or Supabase Storage) for image assets

10. **Set up real-time subscriptions** using Supabase websockets for progress updates

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Storage solution: **Supabase Storage** (selected)
- Database migration approach: **Supabase migrations**
- Data validation strategy: **Database constraints + Zod application validation**
- Authentication: **Supabase Auth** (from PRD)
- Authorization: **RBAC with plan-based feature gating** (from PRD)
- API design: **REST API with Next.js API routes** (from PRD)
- Queue system: **Inngest workers** (from PRD)
- Real-time: **Supabase websockets** (from PRD)

**Important Decisions (Shape Architecture):**
- Frontend state management: **Server Components primary, React Context for global state**
- Form management: **React Hook Form**
- Error tracking: **Sentry**
- CI/CD: **Vercel native deployment**
- Caching strategy: **SERP data 7 days, API responses 24 hours, no caching for real-time**

**Deferred Decisions (Post-MVP):**
- Advanced monitoring tools (beyond Sentry)
- Custom analytics platform
- Advanced caching layers (Redis, etc.)

### Data Architecture

**Storage Solution:**
- **Decision:** Supabase Storage
- **Rationale:** Unified platform with database and auth, simpler credential management, integrated with Supabase Postgres, built-in CDN and image optimization, row-level security for storage buckets
- **Affects:** Image uploads, file storage, CDN delivery

**Database Migration Approach:**
- **Decision:** Supabase migrations (SQL files in `supabase/migrations/`)
- **Rationale:** Version-controlled migrations, Supabase-native approach, automatic RLS policy management, aligns with PRD requirement for Supabase Postgres
- **Version:** Latest Supabase CLI
- **Affects:** Database schema changes, RLS policy management, deployment workflow

**Data Validation Strategy:**
- **Decision:** Both database constraints + Zod application validation
- **Rationale:** Defense in depth approach - database constraints ensure data integrity at database level, Zod provides type-safe API validation with better error messages
- **Version:** Zod (latest stable)
- **Affects:** API request validation, type safety, error handling

**Caching Strategy:**
- **Decision:**
  - SERP data: 7 days cache (PRD requirement)
  - API responses (Tavily/DataForSEO): 24 hours cache
  - Real-time dashboard data: No caching (must be live)
- **Rationale:** SERP data changes slowly (7 days acceptable), API responses cached to reduce costs while maintaining acceptable freshness, real-time data needs immediate updates
- **Affects:** API cost management, dashboard performance, data freshness

**Database Schema Pattern:**
- **Decision:** Multi-tenant with `org_id` foreign keys + RLS policies
- **Rationale:** PRD requirement, cost-efficient single database, standard SaaS pattern, row-level security enforces isolation
- **Affects:** All database tables, RLS policy implementation, data isolation

### Authentication & Security

**Authentication Method:**
- **Decision:** Supabase Auth
- **Rationale:** PRD requirement, integrated with Supabase Postgres, supports email/password and OAuth, JWT-based sessions
- **Version:** Latest Supabase Auth helpers
- **Affects:** User authentication, session management, OAuth flows

**Authorization Patterns:**
- **Decision:** RBAC (Owner/Editor/Viewer) + Plan-based feature gating
- **Rationale:** PRD requirement, matches pricing tiers (Starter/Pro/Agency), simpler than granular permissions
- **Implementation:** Role check + plan check in middleware
- **Affects:** Access control, feature gating, team management

**Security Middleware:**
- **Decision:** Request validation (Zod), rate limiting per organization, audit logging
- **Rationale:** Defense in depth, prevents abuse, compliance requirement (audit logs)
- **Affects:** API security, rate limiting, compliance

**Data Encryption:**
- **Decision:** AES-256 at rest (Supabase default), TLS 1.3 in transit
- **Rationale:** PRD security requirement, Supabase handles encryption at rest, TLS 1.3 for secure transmission
- **Affects:** Data security, credential storage

**API Key Management:**
- **Decision:** Bcrypt-hashed API keys, stored in database, never exposed client-side
- **Rationale:** PRD security requirement, secure key storage, prevents key exposure
- **Affects:** Public API access, key generation, security

### API & Communication Patterns

**API Design Pattern:**
- **Decision:** REST API with Next.js API routes
- **Rationale:** PRD requirement, standard HTTP methods, easy to understand and document
- **Structure:** `/app/api/[resource]/route.ts` pattern
- **Affects:** API endpoints, request/response handling, documentation

**Error Response Format:**
- **Decision:** Standardized error response with error code, message, and actionable next steps
- **Rationale:** PRD requirement for clear error messages with actionable steps, consistent error handling
- **Format:**
  ```typescript
  {
    error: {
      code: string,
      message: string,
      actionableSteps: string[],
      retryable: boolean
    }
  }
  ```
- **Affects:** Error handling, user experience, debugging

**API Versioning:**
- **Decision:** URL-based versioning (`/api/v1/...`) for future compatibility
- **Rationale:** Allows breaking changes without affecting existing clients
- **Affects:** API evolution, backward compatibility

**Rate Limiting Strategy:**
- **Decision:** Per-organization rate limits based on plan tier
- **Rationale:** PRD requirement, prevents abuse, plan-based differentiation
- **Limits:** Starter (100 req/min), Pro (500 req/min), Agency (unlimited)
- **Affects:** API usage, plan enforcement

**Webhook Handling:**
- **Decision:** HMAC signature verification for security, retry logic with exponential backoff
- **Rationale:** PRD requirement, secure webhook processing, reliable delivery
- **Affects:** E-commerce integrations, external system communication

**External API Integration Pattern:**
- **Decision:** Platform-specific adapters with unified interface, retry logic (3 attempts, exponential backoff)
- **Rationale:** PRD requirement, handles different CMS APIs consistently, resilient to transient failures
- **Affects:** CMS publishing, external API calls, error recovery

### Frontend Architecture

**State Management:**
- **Decision:** Server Components primary, React Context for global state (auth, theme), local state for component-specific data
- **Rationale:** Next.js App Router best practice, reduces client bundle size, Server Components for data fetching
- **Affects:** Component architecture, data fetching, bundle size

**Component Architecture:**
- **Decision:** Feature-based organization with shared components, Server/Client Component separation
- **Structure:**
  ```
  app/
    (dashboard)/
      articles/
      keywords/
    components/
      ui/          # Shared UI components
      features/    # Feature-specific components
  ```
- **Affects:** Code organization, component reusability, maintainability

**Form Management:**
- **Decision:** React Hook Form for form state and validation
- **Rationale:** Performance (uncontrolled components), good TypeScript support, integrates with Zod
- **Version:** Latest React Hook Form
- **Affects:** Form handling, validation, user input

**White-Label Theming:**
- **Decision:** Runtime themeable components with CSS variables, branding from database (`organizations.white_label_settings`)
- **Rationale:** PRD requirement, data-driven branding, supports custom domains and client portals
- **Affects:** White-label implementation, component styling, branding

**Real-Time Update Patterns:**
- **Decision:** Supabase websockets for progress updates, React hooks for subscription management
- **Rationale:** PRD requirement, real-time progress tracking, < 1 second latency requirement
- **Affects:** Article generation progress, dashboard updates, notifications

### Infrastructure & Deployment

**Hosting Strategy:**
- **Decision:** Vercel Edge Network for frontend and API routes
- **Rationale:** PRD requirement, serverless auto-scaling, global CDN, optimized for Next.js
- **Affects:** Deployment, performance, scaling

**CI/CD Pipeline:**
- **Decision:** Vercel native deployment with GitHub integration
- **Rationale:** Seamless integration with Vercel, automatic deployments on push, preview deployments for PRs
- **Affects:** Deployment workflow, testing, preview environments

**Environment Configuration:**
- **Decision:** Environment variables in Vercel dashboard, `.env.local` for local development
- **Rationale:** Secure credential management, separate configs for dev/staging/production
- **Affects:** Configuration management, security, deployment

**Monitoring & Logging:**
- **Decision:** Sentry for error tracking, Vercel Analytics for performance monitoring
- **Rationale:** PRD requirement (error tracking), performance monitoring for NFR compliance
- **Version:** Latest Sentry SDK
- **Affects:** Error tracking, performance monitoring, debugging

**Cost Monitoring:**
- **Decision:** Real-time API cost tracking per organization, alerts when > 20% of revenue
- **Rationale:** PRD requirement, cost efficiency NFR, prevents cost overruns
- **Affects:** Cost management, billing, alerts

**Scaling Strategy:**
- **Decision:** Auto-scaling serverless infrastructure (Vercel + Supabase + Inngest)
- **Rationale:** PRD requirement, handles 1,000 customers and 10,000+ articles/month, < 5 minutes scale-up time
- **Affects:** Performance, capacity planning, infrastructure costs

### Decision Impact Analysis

**Implementation Sequence:**

1. **Foundation Setup:**
   - Initialize Next.js project with `create-next-app`
   - Install Supabase dependencies
   - Configure Supabase Auth
   - Set up database schema with RLS policies
   - Install Inngest for queue workers

2. **Core Infrastructure:**
   - Set up Supabase Storage buckets
   - Configure environment variables
   - Set up Sentry for error tracking
   - Configure Vercel deployment

3. **Authentication & Authorization:**
   - Implement Supabase Auth integration
   - Set up RBAC middleware
   - Implement plan-based feature gating
   - Set up API key management

4. **Data Layer:**
   - Create database migrations with RLS policies
   - Set up Zod validation schemas
   - Implement caching layer (SERP data, API responses)
   - Configure data validation (database + application)

5. **API Layer:**
   - Create REST API routes structure
   - Implement error handling middleware
   - Set up rate limiting
   - Configure webhook handling

6. **Frontend Architecture:**
   - Set up component structure
   - Configure React Hook Form
   - Implement white-label theming system
   - Set up real-time subscriptions

**Cross-Component Dependencies:**

- **Authentication → Authorization:** Auth must be implemented before RBAC and feature gating
- **Database Schema → RLS Policies:** Schema must exist before RLS policies can be applied
- **Storage → Image Uploads:** Supabase Storage must be configured before image uploads work
- **Queue Workers → Real-Time Updates:** Inngest workers must emit events for websocket subscriptions
- **API Validation → Error Handling:** Zod schemas must be defined before error responses can be standardized
- **White-Label → Component Theming:** Branding configuration must be available before theming can be applied
- **Cost Tracking → Billing:** API cost tracking must be implemented before overage billing can work

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
15+ areas where AI agents could make different choices that would cause implementation conflicts.

### Naming Patterns

**Database Naming Conventions:**

- **Table naming:** Use `snake_case`, plural nouns (e.g., `organizations`, `articles`, `users`)
- **Column naming:** Use `snake_case` (e.g., `org_id`, `user_id`, `created_at`)
- **Foreign key format:** Use `{referenced_table}_id` (e.g., `org_id`, `user_id`, `article_id`)
- **Index naming:** Use `idx_{table}_{columns}` (e.g., `idx_articles_org_id`, `idx_users_email`)
- **Constraint naming:** Use descriptive names (e.g., `fk_articles_org_id`, `unique_users_email`)
- **RLS policy naming:** Use `{table}_{purpose}` (e.g., `articles_org_isolation`, `users_org_access`)

**Examples:**
```sql
-- ✅ Good
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_articles_org_id ON articles(org_id);
CREATE POLICY articles_org_isolation ON articles USING (org_id = current_user_org_id());

-- ❌ Bad
CREATE TABLE Articles (  -- PascalCase
  Id UUID,  -- PascalCase
  orgId UUID,  -- camelCase
  Title TEXT
);
```

**API Naming Conventions:**

- **REST endpoint naming:** Use plural nouns, lowercase with hyphens (e.g., `/api/articles`, `/api/keyword-research`)
- **Route parameter format:** Use `[id]` in Next.js App Router (e.g., `/api/articles/[id]/route.ts`)
- **Query parameter naming:** Use `snake_case` (e.g., `?org_id=123&status=draft`)
- **Header naming:** Use `X-` prefix for custom headers (e.g., `X-API-Key`, `X-Request-ID`)
- **HTTP methods:** Use standard REST verbs (GET, POST, PUT, PATCH, DELETE)

**Examples:**
```typescript
// ✅ Good
GET /api/articles?org_id=123&status=draft
POST /api/articles
GET /api/articles/[id]
PATCH /api/articles/[id]

// ❌ Bad
GET /api/article  // singular
GET /api/Articles  // PascalCase
GET /api/articles?orgId=123  // camelCase query param
```

**Code Naming Conventions:**

- **Component naming:** Use PascalCase (e.g., `UserCard`, `ArticleList`, `DashboardWidget`)
- **File naming:** Use kebab-case for files (e.g., `user-card.tsx`, `article-list.tsx`, `dashboard-widget.tsx`)
- **Function naming:** Use camelCase (e.g., `getUserData`, `createArticle`, `validateInput`)
- **Variable naming:** Use camelCase (e.g., `userId`, `articleData`, `isLoading`)
- **Constant naming:** Use UPPER_SNAKE_CASE (e.g., `MAX_ARTICLES_PER_MONTH`, `API_BASE_URL`)
- **Type/Interface naming:** Use PascalCase (e.g., `User`, `Article`, `ApiResponse`)

**Examples:**
```typescript
// ✅ Good
// File: user-card.tsx
export function UserCard({ userId }: { userId: string }) {
  const userData = getUserData(userId);
  return <div>{userData.name}</div>;
}

const MAX_RETRIES = 3;
type Article = { id: string; title: string };

// ❌ Bad
export function userCard() {}  // lowercase
export function user_card() {}  // snake_case
const maxRetries = 3;  // should be constant
```

### Structure Patterns

**Project Organization:**

- **Tests:** Co-located with source files using `.test.ts` or `.spec.ts` suffix (e.g., `user-card.test.tsx`)
- **Components:** Organized by feature in `app/components/features/`, shared components in `app/components/ui/`
- **Utilities:** Shared utilities in `lib/utils/`, feature-specific utilities co-located with features
- **Services:** API service functions in `lib/services/`, organized by domain (e.g., `lib/services/articles.ts`)
- **Types:** Shared types in `lib/types/`, feature-specific types co-located with features
- **Hooks:** Custom React hooks in `lib/hooks/`, feature-specific hooks co-located with features

**File Structure:**
```
app/
  (dashboard)/
    articles/
      page.tsx
      [id]/
        page.tsx
        edit/
          page.tsx
    components/
      features/
        articles/
          article-list.tsx
          article-card.tsx
          article-list.test.tsx
      ui/
        button.tsx
        card.tsx
  api/
    articles/
      route.ts
      [id]/
        route.ts
lib/
  services/
    articles.ts
    keywords.ts
  hooks/
    use-articles.ts
    use-auth.ts
  types/
    article.ts
    user.ts
  utils/
    validation.ts
    formatting.ts
supabase/
  migrations/
    20250101000000_initial_schema.sql
```

**Configuration Files:**
- Environment variables: `.env.local` (gitignored), `.env.example` (committed)
- Supabase config: `supabase/config.toml`
- TypeScript config: `tsconfig.json`
- Tailwind config: `tailwind.config.ts`
- Next.js config: `next.config.ts`

### Format Patterns

**API Response Formats:**

- **Success response:** Direct data (no wrapper) for single resources, `{ data: T[], meta?: {...} }` for lists
- **Error response:** Standardized error object with code, message, and actionable steps
- **Date format:** ISO 8601 strings in JSON (e.g., `"2025-12-21T10:30:00Z"`)
- **HTTP status codes:** 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

**Examples:**
```typescript
// ✅ Good - Success response
// GET /api/articles/123
{
  "id": "123",
  "title": "Article Title",
  "content": "...",
  "created_at": "2025-12-21T10:30:00Z"
}

// GET /api/articles
{
  "data": [
    { "id": "123", "title": "..." },
    { "id": "456", "title": "..." }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "per_page": 20
  }
}

// ✅ Good - Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "actionableSteps": [
      "Check that all required fields are provided",
      "Verify email format is correct"
    ],
    "retryable": false
  }
}

// ❌ Bad
{
  "success": true,  // unnecessary wrapper
  "result": {...}  // inconsistent naming
}
```

**Data Exchange Formats:**

- **JSON field naming:** Use `snake_case` for API responses (matches database), convert to `camelCase` in TypeScript types
- **Boolean values:** Use `true`/`false` (not `1`/`0` or `"true"`/`"false"`)
- **Null handling:** Use `null` for missing values (not empty strings or `undefined`)
- **Arrays:** Use arrays for lists, objects for single items (not arrays with single items)

**Examples:**
```typescript
// ✅ Good
{
  "org_id": "123",
  "user_id": "456",
  "is_active": true,
  "created_at": "2025-12-21T10:30:00Z",
  "tags": ["seo", "content"]
}

// TypeScript type (camelCase)
type Article = {
  orgId: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  tags: string[];
};

// ❌ Bad
{
  "orgId": "123",  // camelCase in API
  "is_active": 1,  // number instead of boolean
  "tags": null  // null instead of empty array
}
```

### Communication Patterns

**Event System Patterns (Inngest):**

- **Event naming:** Use `snake_case` with domain prefix (e.g., `article.generation.started`, `article.published`)
- **Event payload structure:** Include `org_id`, `user_id`, and relevant data
- **Event versioning:** Include version in event name for breaking changes (e.g., `article.generated.v2`)

**Examples:**
```typescript
// ✅ Good
await inngest.send({
  name: "article.generation.started",
  data: {
    org_id: "123",
    user_id: "456",
    article_id: "789",
    keyword: "seo tips"
  }
});

// ❌ Bad
await inngest.send({
  name: "ArticleGenerationStarted",  // PascalCase
  data: {
    orgId: "123",  // camelCase
    articleId: "789"
    // missing org_id
  }
});
```

**State Management Patterns:**

- **State updates:** Always use immutable updates (create new objects/arrays)
- **Action naming:** Use verb-noun pattern (e.g., `setArticles`, `updateArticle`, `deleteArticle`)
- **Loading states:** Use `isLoading`, `isError`, `error` pattern
- **State organization:** Group related state together (e.g., `articles`, `keywords`, `user`)

**Examples:**
```typescript
// ✅ Good
const [articles, setArticles] = useState<Article[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Immutable update
setArticles([...articles, newArticle]);
setArticles(articles.map(a => a.id === id ? updated : a));

// ❌ Bad
articles.push(newArticle);  // mutation
setArticles(articles);  // same reference
```

### Process Patterns

**Error Handling Patterns:**

- **Global error handling:** Use Next.js error boundaries for component errors, API route try-catch for API errors
- **Error boundary pattern:** Create error boundaries at route level, not component level
- **User-facing errors:** Show actionable error messages from API error response
- **Logging:** Log all errors to Sentry with context (org_id, user_id, request_id)

**Examples:**
```typescript
// ✅ Good - API route error handling
export async function GET(request: Request) {
  try {
    const articles = await getArticles();
    return Response.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    Sentry.captureException(error, {
      tags: { org_id: orgId, endpoint: "/api/articles" }
    });
    return Response.json(
      {
        error: {
          code: "FETCH_ERROR",
          message: "Failed to fetch articles",
          actionableSteps: ["Please try again in a moment"],
          retryable: true
        }
      },
      { status: 500 }
    );
  }
}

// ✅ Good - Component error handling
"use client";
export function ArticleList() {
  const { data, error, isLoading } = useArticles();
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return <div>{/* articles */}</div>;
}
```

**Loading State Patterns:**

- **Loading state naming:** Use `isLoading`, `isFetching`, `isSubmitting` (not `loading`, `fetching`)
- **Global vs local:** Use local loading states for component-specific operations, global for navigation
- **Loading UI:** Show loading spinners or skeletons, not blank screens
- **Loading persistence:** Don't clear loading state on error, show error state instead

**Examples:**
```typescript
// ✅ Good
const [isLoading, setIsLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

if (isLoading) {
  return <ArticleListSkeleton />;
}

// ❌ Bad
const [loading, setLoading] = useState(false);  // inconsistent naming
if (loading) {
  return null;  // blank screen
}
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. **Follow naming conventions:** Use snake_case for database/API, camelCase for TypeScript, PascalCase for components
2. **Use standardized error format:** All API errors must use the error object structure with code, message, and actionableSteps
3. **Include org_id in all database queries:** All queries must filter by org_id for multi-tenant isolation
4. **Use immutable state updates:** Never mutate state directly, always create new objects/arrays
5. **Include RLS policies:** All database tables must have RLS policies for org_id isolation
6. **Use TypeScript types:** All functions must have proper TypeScript types, no `any` types
7. **Handle errors gracefully:** All API calls must have try-catch blocks and error handling
8. **Use Zod for validation:** All API inputs must be validated with Zod schemas
9. **Include loading states:** All async operations must have loading state management
10. **Follow file structure:** All files must be placed according to the project structure patterns

**Pattern Enforcement:**

- **Code review:** All code must be reviewed for pattern compliance
- **Linting:** ESLint rules enforce naming conventions and code style
- **Type checking:** TypeScript compiler enforces type safety
- **Database migrations:** All migrations must follow naming conventions and include RLS policies
- **Documentation:** Pattern violations should be documented and fixed

**Process for Updating Patterns:**

1. Identify pattern conflict or improvement need
2. Discuss with team/architect
3. Update architecture document with new pattern
4. Update all existing code to follow new pattern
5. Document pattern change in changelog

### Pattern Examples

**Good Examples:**

```typescript
// ✅ Database query with RLS
const { data: articles } = await supabase
  .from('articles')
  .select('*')
  .eq('org_id', orgId)  // RLS enforces this
  .order('created_at', { ascending: false });

// ✅ API route with validation
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1),
  keyword: z.string().min(1),
  org_id: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createArticleSchema.parse(body);
    const article = await createArticle(validated);
    return Response.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          actionableSteps: error.errors.map(e => e.message),
          retryable: false
        }
      }, { status: 400 });
    }
    // ... other error handling
  }
}

// ✅ Component with proper types and loading states
type ArticleCardProps = {
  article: Article;
  onEdit: (id: string) => void;
};

export function ArticleCard({ article, onEdit }: ArticleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteArticle(article.id);
    } catch (error) {
      // error handling
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div>
      <h3>{article.title}</h3>
      <button onClick={() => onEdit(article.id)} disabled={isDeleting}>
        Edit
      </button>
    </div>
  );
}
```

**Anti-Patterns:**

```typescript
// ❌ Missing org_id filter (security issue)
const { data } = await supabase.from('articles').select('*');

// ❌ No validation
export async function POST(request: Request) {
  const body = await request.json();
  await createArticle(body);  // no validation!
}

// ❌ Mutating state
const [articles, setArticles] = useState([]);
articles.push(newArticle);  // mutation!
setArticles(articles);

// ❌ No error handling
const data = await fetch('/api/articles').then(r => r.json());  // no try-catch

// ❌ No TypeScript types
function getArticle(id) {  // no types!
  return fetch(`/api/articles/${id}`);
}

// ❌ Inconsistent naming
const userId = '123';
const org_id = '456';  // mixing camelCase and snake_case
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
infin8content/
├── README.md
├── package.json
├── package-lock.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                    # Local environment variables (gitignored)
├── .env.example                  # Example environment variables (committed)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI/CD
├── app/                          # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page (pre-payment)
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── page.tsx          # OAuth callback
│   ├── (payment)/                # Payment route group
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   └── success/
│   │       └── page.tsx
│   ├── (dashboard)/              # Dashboard route group (requires payment)
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Main dashboard
│   │   ├── articles/
│   │   │   ├── page.tsx          # Article list
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create article
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Article detail
│   │   │       ├── edit/
│   │   │       │   └── page.tsx  # Edit article
│   │   │       └── publish/
│   │   │           └── page.tsx # Publish article
│   │   ├── keywords/
│   │   │   ├── page.tsx          # Keyword research
│   │   │   └── [keyword]/
│   │   │       └── page.tsx      # Keyword detail
│   │   ├── analytics/
│   │   │   ├── page.tsx          # Analytics dashboard
│   │   │   └── revenue/
│   │   │       └── page.tsx      # Revenue attribution
│   │   ├── publishing/
│   │   │   ├── page.tsx          # Publishing queue
│   │   │   └── history/
│   │   │       └── page.tsx      # Publishing history
│   │   ├── settings/
│   │   │   ├── page.tsx          # Settings overview
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── organization/
│   │   │   │   └── page.tsx
│   │   │   ├── billing/
│   │   │   │   └── page.tsx
│   │   │   ├── white-label/
│   │   │   │   └── page.tsx      # Agency only
│   │   │   └── integrations/
│   │   │       └── page.tsx      # CMS connections
│   │   └── onboarding/
│   │       └── page.tsx          # Post-payment onboarding
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── articles/
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │       ├── generate/
│   │   │       │   └── route.ts  # Start article generation
│   │   │       └── publish/
│   │   │           └── route.ts  # Publish article
│   │   ├── keywords/
│   │   │   ├── route.ts          # Keyword research
│   │   │   ├── cluster/
│   │   │   │   └── route.ts      # Keyword clustering
│   │   │   └── [keyword]/
│   │   │       └── route.ts      # Keyword detail
│   │   ├── analytics/
│   │   │   ├── route.ts          # Analytics data
│   │   │   └── revenue/
│   │   │       └── route.ts      # Revenue attribution
│   │   ├── publishing/
│   │   │   ├── route.ts          # Publishing queue
│   │   │   └── [id]/
│   │   │       └── route.ts      # Publishing status
│   │   ├── integrations/
│   │   │   ├── cms/
│   │   │   │   ├── route.ts      # List CMS connections
│   │   │   │   ├── connect/
│   │   │   │   │   └── route.ts  # Connect CMS
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # CMS connection detail
│   │   │   ├── ecommerce/
│   │   │   │   ├── route.ts      # E-commerce connections
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   │       └── route.ts      # Webhook endpoints
│   │   ├── billing/
│   │   │   ├── route.ts          # Billing info
│   │   │   ├── usage/
│   │   │   │   └── route.ts      # Usage tracking
│   │   │   └── webhook/
│   │   │       └── route.ts      # Stripe webhook
│   │   ├── organizations/
│   │   │   ├── route.ts          # Organization management
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── team/
│   │   │   ├── route.ts          # Team members
│   │   │   ├── invite/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── white-label/
│   │   │   ├── route.ts          # White-label config
│   │   │   └── domains/
│   │   │       └── route.ts      # Custom domains
│   │   ├── api-keys/
│   │   │   ├── route.ts          # API key management
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── user/
│   │       ├── export/
│   │       │   └── route.ts      # GDPR data export
│   │       └── delete/
│   │           └── route.ts      # Account deletion
│   ├── components/                # React components
│   │   ├── ui/                   # Shared UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── error-state.tsx
│   │   ├── features/             # Feature-specific components
│   │   │   ├── articles/
│   │   │   │   ├── article-list.tsx
│   │   │   │   ├── article-card.tsx
│   │   │   │   ├── article-editor.tsx
│   │   │   │   ├── article-generator.tsx
│   │   │   │   └── article-progress.tsx
│   │   │   ├── keywords/
│   │   │   │   ├── keyword-research.tsx
│   │   │   │   ├── keyword-cluster.tsx
│   │   │   │   └── keyword-list.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── dashboard-widgets.tsx
│   │   │   │   ├── revenue-attribution.tsx
│   │   │   │   ├── metric-card.tsx
│   │   │   │   └── chart-components.tsx
│   │   │   ├── publishing/
│   │   │   │   ├── publishing-queue.tsx
│   │   │   │   ├── cms-selector.tsx
│   │   │   │   └── publishing-status.tsx
│   │   │   ├── integrations/
│   │   │   │   ├── cms-connection.tsx
│   │   │   │   ├── ecommerce-connection.tsx
│   │   │   │   └── integration-list.tsx
│   │   │   ├── billing/
│   │   │   │   ├── usage-dashboard.tsx
│   │   │   │   ├── plan-selector.tsx
│   │   │   │   └── billing-history.tsx
│   │   │   ├── white-label/
│   │   │   │   ├── branding-config.tsx
│   │   │   │   ├── custom-domain.tsx
│   │   │   │   └── client-portal.tsx
│   │   │   └── team/
│   │   │       ├── team-list.tsx
│   │   │       ├── team-invite.tsx
│   │   │       └── role-selector.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-bar.tsx
│   │   │   ├── client-switcher.tsx
│   │   │   └── navigation.tsx
│   │   └── auth/                 # Auth components
│   │       ├── login-form.tsx
│   │       ├── signup-form.tsx
│   │       └── auth-guard.tsx
│   └── middleware.ts              # Next.js middleware (auth, RLS)
├── lib/                          # Shared libraries and utilities
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   ├── server.ts              # Server-side Supabase client
│   │   ├── auth.ts                # Auth helpers
│   │   └── rls.ts                 # RLS helper functions
│   ├── services/                 # Business logic services
│   │   ├── articles/
│   │   │   ├── article-service.ts
│   │   │   ├── article-generator.ts
│   │   │   └── article-publisher.ts
│   │   ├── keywords/
│   │   │   ├── keyword-service.ts
│   │   │   └── keyword-cluster.ts
│   │   ├── analytics/
│   │   │   ├── analytics-service.ts
│   │   │   └── revenue-attribution.ts
│   │   ├── integrations/
│   │   │   ├── cms/
│   │   │   │   ├── wordpress-adapter.ts
│   │   │   │   ├── shopify-adapter.ts
│   │   │   │   ├── webflow-adapter.ts
│   │   │   │   └── cms-adapter-base.ts
│   │   │   └── ecommerce/
│   │   │       ├── shopify-integration.ts
│   │   │       └── woocommerce-integration.ts
│   │   ├── external-apis/
│   │   │   ├── tavily.ts
│   │   │   ├── dataforseo.ts
│   │   │   ├── openrouter.ts
│   │   │   └── google-search-console.ts
│   │   ├── billing/
│   │   │   ├── stripe-service.ts
│   │   │   ├── usage-tracking.ts
│   │   │   └── cost-monitoring.ts
│   │   └── white-label/
│   │       ├── branding-service.ts
│   │       └── domain-service.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-articles.ts
│   │   ├── use-keywords.ts
│   │   ├── use-auth.ts
│   │   ├── use-organization.ts
│   │   ├── use-realtime.ts       # Supabase real-time subscriptions
│   │   └── use-queue-status.ts   # Inngest queue status
│   ├── types/                     # TypeScript types
│   │   ├── article.ts
│   │   ├── user.ts
│   │   ├── organization.ts
│   │   ├── keyword.ts
│   │   ├── billing.ts
│   │   ├── integration.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── validation.ts         # Zod schemas
│   │   ├── formatting.ts
│   │   ├── date.ts
│   │   ├── error-handling.ts
│   │   └── constants.ts
│   └── inngest/                  # Inngest functions
│       ├── functions/
│       │   ├── article-generation.ts
│       │   ├── article-publishing.ts
│       │   ├── keyword-research.ts
│       │   └── webhook-processing.ts
│       └── client.ts
├── supabase/                     # Supabase configuration
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250102000000_add_rls_policies.sql
│   │   └── ...
│   └── seed.sql                  # Seed data (optional)
├── tests/                        # Test files (co-located with source)
│   ├── __mocks__/
│   ├── app/
│   │   └── api/
│   │       └── articles/
│   │           └── route.test.ts
│   ├── lib/
│   │   └── services/
│   │       └── articles/
│   │           └── article-service.test.ts
│   └── e2e/
│       └── article-creation.spec.ts
├── public/                       # Static assets
│   ├── images/
│   └── favicon.ico
└── docs/                         # Documentation
    ├── architecture.md
    ├── api.md
    └── deployment.md
```

### Architectural Boundaries

**API Boundaries:**

- **External API Endpoints:** `/app/api/*` - All API routes are in the `app/api/` directory
- **Authentication Boundary:** `app/middleware.ts` - Handles auth checks before route access
- **Authorization Boundary:** `lib/supabase/rls.ts` - RLS policies enforce data access
- **Service Layer Boundary:** `lib/services/*` - Business logic separated from API routes
- **External Service Integration:** `lib/services/external-apis/*` - All external API calls isolated

**Component Boundaries:**

- **UI Components:** `app/components/ui/*` - Shared, reusable UI components
- **Feature Components:** `app/components/features/*` - Feature-specific components
- **Layout Components:** `app/components/layout/*` - Layout and navigation components
- **Server vs Client:** Server Components by default, `"use client"` directive for Client Components
- **State Management:** React Context for global state, local state for component-specific data

**Service Boundaries:**

- **Business Logic:** `lib/services/*` - All business logic in service layer
- **Data Access:** Supabase client in `lib/supabase/*` - All database access through Supabase
- **External APIs:** `lib/services/external-apis/*` - External API calls isolated
- **Queue Processing:** `lib/inngest/functions/*` - All async processing in Inngest functions
- **Integration Adapters:** `lib/services/integrations/*` - CMS and e-commerce adapters

**Data Boundaries:**

- **Database Schema:** `supabase/migrations/*` - All schema changes in migrations
- **RLS Policies:** Defined in migrations, enforced by Supabase
- **Data Validation:** `lib/utils/validation.ts` - Zod schemas for API validation
- **Caching:** Application-level caching in services, database-level caching via Supabase
- **Storage:** Supabase Storage buckets for images and files

### Requirements to Structure Mapping

**FR Category: User Management & Access Control (12 FRs)**
- **Components:** `app/components/features/team/*`, `app/components/auth/*`
- **API Routes:** `app/api/auth/*`, `app/api/team/*`, `app/api/organizations/*`
- **Services:** `lib/services/auth.ts` (via Supabase Auth)
- **Database:** `supabase/migrations/*_users.sql`, `*_organizations.sql`
- **Middleware:** `app/middleware.ts` - Auth and payment checks
- **Tests:** `tests/app/api/auth/*`, `tests/lib/services/auth/*`

**FR Category: Content Research & Discovery (8 FRs)**
- **Components:** `app/components/features/keywords/*`
- **API Routes:** `app/api/keywords/*`
- **Services:** `lib/services/keywords/*`, `lib/services/external-apis/dataforseo.ts`
- **Database:** `supabase/migrations/*_keywords.sql`
- **Queue:** `lib/inngest/functions/keyword-research.ts`
- **Tests:** `tests/lib/services/keywords/*`

**FR Category: Content Generation (24 FRs)**
- **Components:** `app/components/features/articles/*`
- **API Routes:** `app/api/articles/*`
- **Services:** `lib/services/articles/*`, `lib/services/external-apis/tavily.ts`, `lib/services/external-apis/openrouter.ts`
- **Database:** `supabase/migrations/*_articles.sql`
- **Queue:** `lib/inngest/functions/article-generation.ts`
- **Tests:** `tests/lib/services/articles/*`

**FR Category: Content Publishing & Distribution (12 FRs)**
- **Components:** `app/components/features/publishing/*`
- **API Routes:** `app/api/publishing/*`
- **Services:** `lib/services/articles/article-publisher.ts`, `lib/services/integrations/cms/*`
- **Database:** `supabase/migrations/*_publishing.sql`
- **Queue:** `lib/inngest/functions/article-publishing.ts`
- **Tests:** `tests/lib/services/integrations/cms/*`

**FR Category: E-Commerce Integration & Attribution (9 FRs)**
- **Components:** `app/components/features/integrations/*`
- **API Routes:** `app/api/integrations/ecommerce/*`
- **Services:** `lib/services/integrations/ecommerce/*`, `lib/services/analytics/revenue-attribution.ts`
- **Database:** `supabase/migrations/*_ecommerce.sql`, `*_attribution.sql`
- **Webhooks:** `app/api/integrations/webhooks/route.ts`
- **Tests:** `tests/lib/services/integrations/ecommerce/*`

**FR Category: White-Label & Multi-Tenancy (7 FRs)**
- **Components:** `app/components/features/white-label/*`
- **API Routes:** `app/api/white-label/*`
- **Services:** `lib/services/white-label/*`
- **Database:** `supabase/migrations/*_white_label.sql` (in organizations table)
- **Middleware:** Custom domain handling in `app/middleware.ts`
- **Tests:** `tests/lib/services/white-label/*`

**FR Category: Analytics & Performance Tracking (14 FRs)**
- **Components:** `app/components/features/analytics/*`
- **API Routes:** `app/api/analytics/*`
- **Services:** `lib/services/analytics/*`
- **Database:** `supabase/migrations/*_analytics.sql`
- **Tests:** `tests/lib/services/analytics/*`

**FR Category: Billing & Usage Management (13 FRs)**
- **Components:** `app/components/features/billing/*`
- **API Routes:** `app/api/billing/*`
- **Services:** `lib/services/billing/*`
- **Database:** `supabase/migrations/*_billing.sql`, `*_usage.sql`
- **Webhooks:** `app/api/billing/webhook/route.ts` (Stripe)
- **Tests:** `tests/lib/services/billing/*`

**FR Category: API & Integrations (5 FRs)**
- **API Routes:** `app/api/api-keys/*`
- **Services:** API key management in services
- **Database:** `supabase/migrations/*_api_keys.sql`
- **Middleware:** Rate limiting in `app/middleware.ts`
- **Tests:** `tests/app/api/api-keys/*`

**FR Category: Error Handling & Recovery (7 FRs)**
- **Utilities:** `lib/utils/error-handling.ts`
- **Components:** `app/components/ui/error-state.tsx`
- **Middleware:** Error handling in API routes and middleware
- **Queue:** Retry logic in Inngest functions
- **Tests:** Error handling tests in all test files

**FR Category: Collaboration & Workflow (6 FRs)**
- **Components:** `app/components/features/articles/*` (comments, approvals)
- **API Routes:** `app/api/articles/[id]/comments/route.ts`
- **Database:** `supabase/migrations/*_comments.sql`, `*_workflows.sql`
- **Real-time:** Supabase real-time subscriptions for status updates
- **Tests:** `tests/lib/services/articles/*`

**FR Category: Onboarding & Discovery (3 FRs)**
- **Components:** `app/(dashboard)/onboarding/page.tsx`
- **Services:** Onboarding flow logic
- **Database:** Track onboarding progress in user/organization tables
- **Tests:** `tests/app/onboarding/*`

**FR Category: Dashboard UI/UX (23 FRs)**
- **Components:** `app/components/features/analytics/dashboard-widgets.tsx`
- **Layout:** `app/(dashboard)/layout.tsx`
- **Pages:** `app/(dashboard)/page.tsx` (main dashboard)
- **Real-time:** `lib/hooks/use-realtime.ts` for live updates
- **Tests:** `tests/app/components/features/analytics/*`

### Integration Points

**Internal Communication:**

- **API Routes → Services:** API routes call service functions for business logic
- **Components → Hooks:** Components use custom hooks for data fetching
- **Hooks → Services:** Hooks call service functions
- **Services → Supabase:** Services use Supabase client for database access
- **Queue → Services:** Inngest functions call service functions
- **Real-time → Components:** Supabase real-time subscriptions update component state via hooks

**External Integrations:**

- **CMS Platforms:** `lib/services/integrations/cms/*` - Adapter pattern for each CMS
- **E-Commerce:** `lib/services/integrations/ecommerce/*` - Shopify/WooCommerce integrations
- **External APIs:** `lib/services/external-apis/*` - Tavily, DataForSEO, OpenRouter, Google Search Console
- **Payment:** `lib/services/billing/stripe-service.ts` - Stripe integration
- **Storage:** Supabase Storage for images and files
- **Webhooks:** `app/api/integrations/webhooks/route.ts` - Incoming webhooks

**Data Flow:**

1. **User Request → API Route:** User makes HTTP request to `/app/api/*`
2. **API Route → Validation:** Request validated with Zod schemas
3. **API Route → Service:** Service function called for business logic
4. **Service → Database:** Supabase client queries database (RLS enforced)
5. **Service → External APIs:** External APIs called for data/research
6. **Service → Queue:** Long-running tasks sent to Inngest
7. **Queue → Real-time:** Inngest emits events, Supabase real-time updates UI
8. **Response → User:** API returns response, components update via hooks

### File Organization Patterns

**Configuration Files:**
- Root level: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Environment: `.env.local` (gitignored), `.env.example` (committed)
- Supabase: `supabase/config.toml`
- CI/CD: `.github/workflows/ci.yml`

**Source Organization:**
- Feature-based: Components and services organized by feature
- Shared utilities: Common code in `lib/utils/`
- Type definitions: Types in `lib/types/`
- Hooks: Custom hooks in `lib/hooks/`

**Test Organization:**
- Co-located: Test files next to source files with `.test.ts` suffix
- E2E tests: `tests/e2e/` directory
- Mocks: `tests/__mocks__/` for shared mocks

**Asset Organization:**
- Static assets: `public/images/`, `public/favicon.ico`
- Dynamic assets: Supabase Storage buckets
- Documentation: `docs/` directory

### Development Workflow Integration

**Development Server Structure:**
- Next.js dev server: `npm run dev` - Runs on `localhost:3000`
- Supabase local: `supabase start` - Local Supabase instance
- Inngest dev: `npx inngest-cli dev` - Local Inngest development server

**Build Process Structure:**
- Build: `npm run build` - Next.js production build
- Type check: `npm run type-check` - TypeScript validation
- Lint: `npm run lint` - ESLint validation
- Test: `npm run test` - Run tests

**Deployment Structure:**
- Vercel: Automatic deployment from GitHub
- Supabase: Migrations run automatically on deployment
- Inngest: Functions deployed via Inngest dashboard
- Environment variables: Configured in Vercel dashboard

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All architectural decisions are compatible and work together seamlessly:

- **Technology Stack:** Next.js App Router, Supabase (Auth, Postgres, Storage), Inngest, and Vercel are fully compatible and commonly used together in production SaaS applications
- **Database & Auth:** Supabase Auth integrates natively with Supabase Postgres RLS, enabling seamless multi-tenant isolation
- **Queue System:** Inngest integrates with Next.js API routes and Supabase, supporting async processing for article generation
- **Storage:** Supabase Storage integrates with Supabase Postgres for metadata and RLS policies
- **Real-time:** Supabase websockets work seamlessly with Next.js Server Components and React hooks
- **Deployment:** Vercel natively supports Next.js, serverless functions, and environment variables for all services

**Pattern Consistency:**

Implementation patterns consistently support all architectural decisions:

- **Naming Conventions:** snake_case for database/API, camelCase for TypeScript, PascalCase for components - all patterns align with technology stack conventions
- **Structure Patterns:** Feature-based organization supports Next.js App Router structure and component boundaries
- **Communication Patterns:** REST API patterns align with Next.js API routes, event patterns align with Inngest
- **Process Patterns:** Error handling, loading states, and validation patterns support all architectural decisions

**Structure Alignment:**

Project structure fully supports all architectural decisions:

- **Next.js App Router:** Complete `app/` directory structure with route groups, API routes, and layouts
- **Supabase Integration:** Dedicated `lib/supabase/` directory for client configuration and RLS helpers
- **Service Layer:** `lib/services/` structure supports business logic separation and external API integration
- **Queue Processing:** `lib/inngest/functions/` structure supports async processing patterns
- **Multi-tenancy:** Database migrations structure supports RLS policy management
- **Component Architecture:** Feature-based component organization supports white-label theming and persona-specific views

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

All 160 functional requirements across 13 categories are architecturally supported:

- **User Management & Access Control (12 FRs):** ✅ Supabase Auth, RBAC middleware, payment-first access control, RLS policies
- **Content Research & Discovery (8 FRs):** ✅ Keyword research services, DataForSEO integration, Tavily integration, clustering logic
- **Content Generation (24 FRs):** ✅ Section-by-section architecture, OpenRouter integration, citation generation, version control
- **Content Publishing & Distribution (12 FRs):** ✅ CMS adapter pattern, Inngest queue processing, Google Search Console integration
- **E-Commerce Integration & Attribution (9 FRs):** ✅ E-commerce adapters, UTM tracking, order matching, revenue attribution services
- **White-Label & Multi-Tenancy (7 FRs):** ✅ White-label services, custom domain handling, client portal components, RLS isolation
- **Analytics & Performance Tracking (14 FRs):** ✅ Analytics services, dashboard widgets, revenue attribution components
- **Billing & Usage Management (13 FRs):** ✅ Stripe integration, usage tracking services, cost monitoring
- **API & Integrations (5 FRs):** ✅ API key management, rate limiting middleware, webhook handling
- **Error Handling & Recovery (7 FRs):** ✅ Error handling utilities, retry logic in services and Inngest functions
- **Collaboration & Workflow (6 FRs):** ✅ Comment system, approval workflows, real-time status updates
- **Onboarding & Discovery (3 FRs):** ✅ Onboarding pages, feature discovery components
- **Dashboard UI/UX (23 FRs):** ✅ Dashboard layout, persona-specific widgets, real-time updates, responsive design

**Non-Functional Requirements Coverage:**

All 42 non-functional requirements are architecturally addressed:

- **Performance (6 NFRs):** ✅ Serverless auto-scaling, queue-based processing, caching strategy, CDN distribution
- **Security (8 NFRs):** ✅ Supabase encryption, RLS policies, JWT authentication, bcrypt API keys, audit logging
- **Reliability & Availability (5 NFRs):** ✅ Vercel uptime SLA, retry logic, backup strategy, graceful degradation
- **Scalability (5 NFRs):** ✅ Serverless architecture, auto-scaling, database indexing, storage scalability
- **Integration (5 NFRs):** ✅ Adapter pattern for CMS, OAuth token management, webhook reliability, health monitoring
- **Accessibility (4 NFRs):** ✅ WCAG compliance via component design, keyboard navigation, screen reader support
- **Data Quality (4 NFRs):** ✅ Validation schemas, citation requirements, quality metrics tracking
- **Cost Efficiency (4 NFRs):** ✅ Cost tracking services, usage monitoring, API cost optimization
- **Compliance (4 NFRs):** ✅ GDPR/CCPA data export/deletion, data residency options, privacy policies

### Implementation Readiness Validation ✅

**Decision Completeness:**

All critical architectural decisions are documented with versions and rationale:

- ✅ Technology stack fully specified (Next.js, Supabase, Inngest, Vercel)
- ✅ Database approach documented (Supabase Postgres with RLS)
- ✅ Authentication method specified (Supabase Auth)
- ✅ Storage solution decided (Supabase Storage)
- ✅ Queue system specified (Inngest)
- ✅ API design pattern defined (REST with Next.js API routes)
- ✅ State management approach documented (Server Components + React Context)
- ✅ Error handling strategy defined
- ✅ Caching strategy specified
- ✅ Deployment approach documented (Vercel)

**Structure Completeness:**

Project structure is complete and specific:

- ✅ Complete directory tree with all files and directories defined
- ✅ All 13 FR categories mapped to specific locations
- ✅ Integration points clearly specified
- ✅ Component boundaries well-defined
- ✅ Test organization structure defined
- ✅ Configuration file locations specified

**Pattern Completeness:**

Implementation patterns comprehensively address all potential conflict points:

- ✅ Naming conventions defined for database, API, and code
- ✅ Structure patterns specified for components, services, and utilities
- ✅ Format patterns defined for API responses and data exchange
- ✅ Communication patterns specified for events and state management
- ✅ Process patterns documented for error handling and loading states
- ✅ Concrete examples provided for all major patterns
- ✅ Anti-patterns documented to prevent common mistakes

### Gap Analysis Results

**Critical Gaps:** None identified

All critical architectural decisions are complete and documented. No blocking issues found.

**Important Gaps:** Minor areas for future enhancement

1. **Testing Strategy:** While test organization is defined, specific testing frameworks and strategies could be more detailed (Vitest vs Jest, E2E testing approach)
2. **Monitoring & Observability:** While Sentry is specified, additional monitoring tools (APM, logging aggregation) could be documented
3. **Development Workflow:** While structure is defined, specific development workflows (local Supabase setup, Inngest dev server) could be more detailed

**Nice-to-Have Gaps:** Optional enhancements

1. **Documentation:** Additional API documentation tools (OpenAPI/Swagger) could be specified
2. **Code Generation:** Tools for generating types from database schema could be recommended
3. **Performance Optimization:** Additional performance optimization strategies could be documented

### Validation Issues Addressed

No critical or important validation issues were found. The architecture is coherent, complete, and ready for implementation.

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped (11 major concerns identified)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (Next.js, Supabase, Inngest, Vercel)
- [x] Integration patterns defined (CMS adapters, external APIs, webhooks)
- [x] Performance considerations addressed (caching, queue processing, CDN)

**✅ Implementation Patterns**

- [x] Naming conventions established (database, API, code)
- [x] Structure patterns defined (feature-based organization)
- [x] Communication patterns specified (REST API, events, real-time)
- [x] Process patterns documented (error handling, loading states, validation)

**✅ Project Structure**

- [x] Complete directory structure defined (200+ files/directories)
- [x] Component boundaries established (UI, features, layout, auth)
- [x] Integration points mapped (internal, external, data flow)
- [x] Requirements to structure mapping complete (all 13 FR categories mapped)

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH** - All requirements are architecturally supported, all decisions are coherent and compatible, and implementation patterns are comprehensive enough to guide AI agents consistently.

**Key Strengths:**

1. **Complete Requirements Coverage:** All 160 functional requirements and 42 non-functional requirements are architecturally supported
2. **Coherent Technology Stack:** All technology choices work together seamlessly and are production-proven
3. **Comprehensive Patterns:** Implementation patterns address all potential AI agent conflict points
4. **Detailed Structure:** Complete project structure with specific file locations for all requirements
5. **Clear Boundaries:** Well-defined architectural boundaries for components, services, and data access
6. **Multi-Tenancy Support:** Complete RLS-based multi-tenant architecture with white-label capabilities
7. **Real-Time Capabilities:** Full real-time support via Supabase websockets for progress updates
8. **Scalability:** Serverless architecture supports auto-scaling to meet growth requirements

**Areas for Future Enhancement:**

1. **Testing Strategy:** Expand testing framework recommendations and E2E testing approach
2. **Monitoring:** Add APM and logging aggregation tools for production observability
3. **Documentation:** Consider API documentation tools (OpenAPI/Swagger) for developer experience
4. **Performance:** Add advanced performance optimization strategies as the application scales

### Implementation Handoff

**AI Agent Guidelines:**

- **Follow all architectural decisions exactly as documented** - Do not deviate from technology stack, patterns, or structure
- **Use implementation patterns consistently** - Apply naming conventions, structure patterns, and communication patterns across all components
- **Respect project structure and boundaries** - Place files in specified locations, respect component boundaries, use service layer for business logic
- **Refer to this document for all architectural questions** - This document is the single source of truth for architectural decisions
- **Maintain multi-tenant isolation** - Always include `org_id` in database queries, enforce RLS policies, never expose cross-organization data
- **Follow error handling patterns** - Use standardized error format, implement retry logic, log errors to Sentry
- **Implement real-time updates** - Use Supabase websockets for progress tracking, queue status, and live dashboard data
- **Validate all inputs** - Use Zod schemas for API validation, enforce database constraints
- **Use TypeScript types** - Define types for all functions, avoid `any` types, maintain type safety

**First Implementation Priority:**

1. **Initialize Project:**
   ```bash
   npx create-next-app@latest infin8content --typescript --tailwind --app --no-src-dir --import-alias "@/*"
   ```

2. **Install Core Dependencies:**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs inngest zod react-hook-form
   ```

3. **Set Up Supabase:**
   - Create Supabase project
   - Configure environment variables
   - Set up initial database schema with RLS policies
   - Configure Supabase Storage buckets

4. **Configure Inngest:**
   - Set up Inngest account
   - Configure Inngest client
   - Create first Inngest function (article generation)

5. **Implement Authentication:**
   - Set up Supabase Auth
   - Create auth middleware
   - Implement payment-first access control

6. **Create First Feature Module:**
   - Start with article generation (core feature)
   - Implement keyword research
   - Set up article generation queue

**Architecture Document Status:** ✅ **COMPLETE**

This architecture document provides comprehensive guidance for implementing Infin8Content with consistent, coherent architectural decisions that support all project requirements and enable AI agents to implement the system successfully.

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-21
**Document Location:** `_bmad-output/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping (all 13 FR categories, all 42 NFRs)
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- **15+ architectural decisions** made with versions and rationale
- **5 pattern categories** defined (naming, structure, format, communication, process)
- **18+ architectural components** specified (services, integrations, queue workers)
- **202 requirements fully supported** (160 FRs + 42 NFRs)

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions (Next.js, Supabase, Inngest, Vercel)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries (200+ files/directories defined)
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing Infin8Content. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**

1. **Initialize Project:**
   ```bash
   npx create-next-app@latest infin8content --typescript --tailwind --app --no-src-dir --import-alias "@/*"
   ```

2. **Install Core Dependencies:**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs inngest zod react-hook-form
   ```

3. **Set Up Supabase:**
   - Create Supabase project
   - Configure environment variables
   - Set up initial database schema with RLS policies
   - Configure Supabase Storage buckets

4. **Configure Inngest:**
   - Set up Inngest account
   - Configure Inngest client
   - Create first Inngest function (article generation)

5. **Implement Authentication:**
   - Set up Supabase Auth
   - Create auth middleware
   - Implement payment-first access control

**Development Sequence:**

1. Initialize project using documented starter template
2. Set up development environment per architecture (Supabase, Inngest, Vercel)
3. Implement core architectural foundations (auth, RLS, queue workers)
4. Build features following established patterns (articles, keywords, publishing)
5. Maintain consistency with documented rules (naming, structure, communication)

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible (Next.js + Supabase + Inngest + Vercel)
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices (App Router, feature-based organization)

**✅ Requirements Coverage**

- [x] All 160 functional requirements are supported
- [x] All 42 non-functional requirements are addressed
- [x] 11 cross-cutting concerns are handled
- [x] Integration points are defined (CMS, e-commerce, external APIs)

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable (with versions and rationale)
- [x] Patterns prevent agent conflicts (comprehensive naming, structure, communication rules)
- [x] Structure is complete and unambiguous (200+ files/directories specified)
- [x] Examples are provided for clarity (good examples and anti-patterns)

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction. All decisions align with PRD requirements and support the business goals.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly. Naming conventions, structure patterns, and communication standards prevent conflicts.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs (13 FR categories) to technical implementation (specific files and directories).

**🏗️ Solid Foundation**
The chosen starter template (create-next-app) and architectural patterns provide a production-ready foundation following current best practices. The technology stack is proven, scalable, and maintainable.

**🔒 Security & Compliance**
Multi-tenant architecture with RLS ensures data isolation. Security patterns (encryption, authentication, authorization) are comprehensively addressed. GDPR/CCPA compliance requirements are architecturally supported.

**⚡ Performance & Scalability**
Serverless architecture supports auto-scaling. Queue-based processing enables concurrent article generation. Caching strategy optimizes API costs. All performance NFRs are architecturally addressed.

---

**Architecture Status:** ✅ **READY FOR IMPLEMENTATION**

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation. This document serves as the single source of truth for all architectural decisions.

---

**Workflow Complete** 🎉

The architecture for Infin8Content is comprehensive, validated, and ready to guide consistent AI agent implementation. All 202 requirements are architecturally supported, and the implementation patterns ensure code consistency across the entire development lifecycle.

