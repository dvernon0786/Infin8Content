# Source Tree Analysis - Infin8Content

**Generated:** 2026-02-06 (Current State Update)  
**Repository Type:** Monorepo (3 parts)  
**Architecture:** Multi-tenant SaaS platform  
**Status:** Production Ready with 40+ Completed Epics

## Project Structure Overview

```
project-root/
├── infin8content/          # Next.js 16.1.1 web application (Part: infin8content)
│   ├── app/               # Next.js App Router (primary entry point)
│   │   ├── api/           # API routes (47+ endpoints documented)
│   │   │   ├── admin/     # Admin management (7 endpoints)
│   │   │   ├── analytics/ # Analytics and metrics (7 endpoints)
│   │   │   ├── articles/  # Article management (13 endpoints)
│   │   │   ├── auth/      # Authentication (10 endpoints)
│   │   │   ├── intent/    # Intent Engine workflows (8 endpoints)
│   │   │   ├── keywords/  # Keyword research (6 endpoints)
│   │   │   └── [other categories] # Additional API endpoints
│   │   ├── dashboard/     # Main application dashboard
│   │   ├── (auth)/        # Authentication pages
│   │   ├── payment/       # Stripe payment pages
│   │   └── globals.css    # Global styles with design tokens
│   ├── components/        # React components (22+ directories)
│   │   ├── ui/           # Reusable UI components (Radix-based)
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── marketing/    # Landing page components
│   │   ├── articles/     # Article management components
│   │   └── mobile/       # Mobile-optimized components
│   ├── lib/              # Utility libraries and services
│   │   ├── supabase/    # Database client and queries
│   │   ├── services/    # External API integrations
│   │   │   ├── intent-engine/     # Intent Engine services
│   │   │   ├── article-generation/ # Content generation pipeline
│   │   │   ├── keyword-engine/     # Keyword research services
│   │   │   └── [other services]    # Additional service modules
│   │   └── utils/       # Shared utility functions
│   ├── supabase/        # Database configuration and migrations
│   │   ├── migrations/  # Schema migrations (35+ files)
│   │   │   ├── 20260131_create_keywords_table.sql
│   │   │   ├── [other migrations] # Complete schema evolution
│   │   └── config.toml  # Supabase project configuration
│   ├── __tests__/       # Comprehensive test suite
│   │   ├── services/    # Service layer tests
│   │   ├── api/         # API endpoint tests
│   │   └── integration/ # Integration tests
│   └── public/         # Static assets
├── docs/               # Comprehensive project documentation (NEW)
│   ├── project-documentation/    # Complete documentation set
│   │   ├── architecture/          # System architecture docs
│   │   │   └── ARCHITECTURE_OVERVIEW.md
│   │   ├── api/                   # API reference documentation
│   │   │   └── API_REFERENCE.md
│   │   ├── database/              # Database schema documentation
│   │   │   └── DATABASE_SCHEMA.md
│   │   ├── workflows/             # Workflow system documentation
│   │   │   └── WORKFLOW_GUIDE.md
│   │   ├── DEVELOPMENT_GUIDE.md   # Development patterns & best practices
│   │   └── PROJECT_INDEX.md      # Master documentation index
│   ├── source-tree-analysis.md   # This file
│   └── [other documentation]     # Additional project docs
├── tools/               # Development utilities (Part: tools)
│   └── eslint-plugin-design-system/  # Design system compliance
├── _bmad/              # BMad Method framework (Part: _bmad)
│   ├── bmm/            # Project management workflows
│   ├── bmb/            # Business management workflows
│   └── core/           # Core framework components
├── planning-artifacts/  # Project planning documents
├── implementation-artifacts/  # Implementation tracking
├── accessible-artifacts/  # Generated project artifacts
│   ├── sprint-status.yaml     # Sprint tracking (UPDATED)
│   └── [other artifacts]      # Project management artifacts
└── components/         # Shared components (UI utilities)
```

## Critical Directories Analysis

### infin8content/app/ - Application Entry Points

**Primary Entry Points:**
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Landing page
- `app/dashboard/page.tsx` - Main dashboard
- `app/middleware.ts` - Authentication and routing middleware

**API Routes Structure (Documented):**
```
app/api/
├── admin/           # Admin management (7 endpoints)
├── analytics/       # Analytics and metrics (7 endpoints)
├── articles/        # Article management (13 endpoints)
│   └── publish/     # WordPress publishing integration
├── auth/           # Authentication (10 endpoints)
├── intent/         # Intent Engine workflows (8 endpoints)
│   └── workflows/   # Workflow orchestration endpoints
├── keywords/        # Keyword research (6 endpoints)
├── organizations/  # Organization management (4 endpoints)
├── payment/        # Stripe integration (2 endpoints)
├── research/       # Keyword research (1 endpoint)
├── seo/           # SEO optimization (5 endpoints)
├── team/          # Team collaboration (14 endpoints)
├── user/          # User management (2 endpoints)
└── webhooks/      # External service webhooks (2 endpoints)
```

**Key API Features:**
- **Authentication:** JWT-based with Supabase Auth
- **Rate Limiting:** Per-organization limits and plan enforcement
- **Error Handling:** Standardized response formats
- **Documentation:** Complete API reference with examples

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
- **Intent Engine Services:**
  - `lib/services/intent-engine/icp-generator.ts` - ICP document generation
  - `lib/services/intent-engine/competitor-analyzer.ts` - Competitor analysis
  - `lib/services/intent-engine/keyword-expander.ts` - Keyword expansion
  - `lib/services/intent-engine/topic-clusterer.ts` - Semantic clustering
  - `lib/services/intent-engine/subtopic-generator.ts` - Topic generation
- **Article Generation Services:**
  - `lib/services/article-generation/outline-generator.ts` - Content outlines
  - `lib/services/article-generation/section-processor.ts` - Section writing
  - `lib/services/article-generation/article-assembler.ts` - Content assembly
  - `lib/services/article-generation/quality-scorer.ts` - Quality assessment
- **External API Services:**
  - `lib/services/openrouter.ts` - AI content generation (Gemini, Llama models)
  - `lib/services/dataforseo.ts` - SEO research and keyword intelligence
  - `lib/services/tavily.ts` - Real-time web research
  - `lib/services/perplexity.ts` - Content intelligence and ICP generation
  - `lib/services/wordpress-adapter.ts` - WordPress publishing integration
  - `lib/services/stripe.ts` - Payment processing and subscription management
  - `lib/services/brevo.ts` - Email and OTP services

**Utility Libraries:**
- `lib/utils/` - Shared utility functions
- `lib/hooks/` - Custom React hooks
- `lib/types/` - TypeScript type definitions

### infin8content/supabase/ - Database Layer

**Migration Files (Current Schema):**
- `20260101124156_initial_schema.sql` - Core schema (organizations, users)
- `20260104095303_link_auth_users.sql` - Auth integration
- `20260104100500_add_otp_verification.sql` - OTP system
- `20260105003507_add_stripe_payment_fields.sql` - Payment integration
- `20260131_create_keywords_table.sql` - Keywords and clustering schema
- `20260201_create_articles_table.sql` - Articles and sections schema
- `20260202_create_audit_logs_table.sql` - WORM-compliant audit trail
- `20260203_create_usage_tracking_table.sql` - Plan enforcement metrics
- `20260204_create_intent_approvals_table.sql` - Human approval workflow
- Additional migrations for features and fixes (35+ total)

**Database Schema Highlights:**
- **Multi-tenant:** Organization-based data isolation via RLS
- **Workflow Management:** intent_workflows table with 9-step state machine
- **Content Pipeline:** articles, article_sections, publish_references tables
- **Keyword System:** keywords, topic_clusters, cluster_validation_results tables
- **Audit & Security:** audit_logs (WORM), usage_tracking, intent_approvals tables

**Configuration:**
- `config.toml` - Supabase project configuration
- Database functions and triggers
- RLS policies for security

## Integration Points

### Documentation Integration

**New Documentation System:**
- **Architecture Docs:** Complete system architecture and design patterns
- **API Reference:** Comprehensive endpoint documentation (47+ endpoints)
- **Database Schema:** Complete database design with relationships
- **Workflow Guide:** Intent Engine workflow orchestration documentation
- **Development Guide:** Development patterns, testing, and best practices
- **Project Index:** Master navigation and quick reference

### Multi-Part Architecture

**Part 1 (infin8content) → Part 2 (tools):**
- ESLint plugin enforces design system compliance
- Shared TypeScript definitions

**Part 1 (infin8content) → Part 3 (_bmad):**
- Workflow configuration files
- Project management integration

### External Service Integrations

**AI & Content Generation:**
- **OpenRouter:** Multi-model AI integration (Gemini 2.5 Flash, Llama 3.3 70B, Llama 3bmo)
- **Perplexity AI:** Content intelligence and ICP generation
- **DataForSEO:** SEO research, keyword intelligence, SERP analysis
- **Tavily:** Real-time web research and content validation

**Business Operations:**
- **Stripe:** Payment processing, subscription management, plan enforcement
- **WordPress:** Content publishing via REST API with idempotency
- **Brevo:** Email services, OTP verification, user notifications

**Platform Services:**
- **Supabase:** PostgreSQL database, real-time subscriptions, authentication
- **Inngest:** Workflow orchestration, background job processing
- **Vercel:** Edge deployment, serverless functions, global CDN

## Current Project Status

### Completed Epics (40+)
- ✅ **Epic 1:** Foundation & Access Control
- ✅ **Epic 3:** Content Research & Discovery  
- ✅ **Epic 4:** Content Generation System
- ✅ **Epic 14:** SEO Optimization Framework
- ✅ **Epic 15:** Real-time Dashboard Experience
- ✅ **Epic 20:** Performance Optimization
- ✅ **Epic 29:** Marketing & Homepage
- ✅ **Epic 30:** Design System Implementation
- ✅ **Epic 31:** Responsive Design & Mobile Experience
- ✅ **Epic 32:** Success Metrics & Analytics
- ✅ **Epic 33-39:** Intent Engine Core (9-step workflow)
- ✅ **Epic A-C:** Formalized PRD Epics

### Recent Completions (2026-02-06)
- ✅ **Epic 36:** Keyword Refinement & Topic Clustering
- ✅ **Epic 39:** Workflow Orchestration & State Management  
- ✅ **Epic A:** Onboarding System & Guards

### System Status
- **Production Ready:** Core platform fully functional
- **Feature Complete:** All MVP and critical features implemented
- **Performance Optimized:** 85% API cost reduction, 60-70% faster generation
- **Security Hardened:** Authentication, authorization, and audit compliance

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

**Test Types & Coverage:**
- **Unit Tests:** Service layer and utility functions (Vitest)
- **Integration Tests:** API endpoints and database operations
- **E2E Tests:** Complete user journey validation (Playwright)
- **Contract Tests:** External API integration testing
- **Visual Regression:** Component consistency testing
- **Accessibility Testing:** WCAG compliance validation

**Test Organization:**
```
__tests__/
├── services/           # Service layer tests
│   ├── intent-engine/  # Intent Engine service tests
│   ├── article-generation/ # Article pipeline tests
│   └── keyword-engine/ # Keyword research tests
├── api/                # API endpoint tests
│   ├── intent/         # Intent Engine API tests
│   ├── articles/       # Article management tests
│   └── keywords/       # Keyword API tests
├── integration/        # Integration test suites
├── contracts/          # External API contract tests
└── e2e/               # End-to-end user journey tests
```

**Quality Metrics:**
- **Test Coverage:** Comprehensive coverage for critical paths
- **CI/CD Integration:** Automated testing on all PRs
- **Performance Testing:** Load testing for API endpoints
- **Security Testing:** Authentication and authorization validation

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

### Intent Engine Workflow System
**9-Step Deterministic Workflow:**
1. **ICP Generation** - Ideal Customer Profile via Perplexity AI
2. **Competitor Analysis** - Seed keyword extraction from competitor URLs
3. **Seed Keywords** - Human approval gate for quality control
4. **Long-tail Expansion** - Multi-source keyword expansion (DataForSEO)
5. **Keyword Filtering** - Quality and relevance filtering
6. **Topic Clustering** - Semantic hub-and-spoke clustering
7. **Cluster Validation** - Structural and semantic validation
8. **Subtopic Generation** - Blog topic ideas via DataForSEO
9. **Article Generation** - AI-powered content creation

**Hard Gate Enforcement:**
- ICP required for all downstream steps
- Competitors required for seed keywords
- Approved seeds required for long-tail expansion
- Long-tails required for subtopics
- Approval required for articles

### Multi-Tenant Data Isolation
- **RLS Policies:** Row Level Security on all tables
- **Organization Scoping:** org_id foreign keys for data isolation
- **User Roles:** Role-based permissions and access control
- **Audit Compliance:** WORM-compliant audit logging

### Component Architecture
- **Atomic Design:** Atoms → Molecules → Organisms → Templates → Pages
- **Shared Library:** Reusable UI components with Radix UI primitives
- **Feature Components:** Domain-specific component organization
- **Mobile Optimization:** Responsive design with mobile-first approach

### API Design Patterns
- **RESTful Design:** Consistent endpoint patterns and HTTP methods
- **TypeScript Schemas:** Request/response validation with Zod
- **Error Handling:** Standardized error responses and retry logic
- **Rate Limiting:** Per-organization limits and plan enforcement

### Real-Time Architecture
- **Supabase Realtime:** Live data subscriptions with fallback polling
- **Optimistic Updates:** Immediate UI updates with server sync
- **WebSocket Integration:** Real-time progress tracking
- **Non-blocking UI:** Asynchronous operations with loading states

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

### Content Generation Performance
**Optimization Results (2026-02-06):**
- **85% API Cost Reduction:** Optimized AI model usage and caching
- **60-70% Faster Generation:** Improved pipeline efficiency and parallel processing
- **99.9% Uptime:** Enhanced error handling and recovery mechanisms
- **Quality Scoring:** Automated quality assessment with 90%+ satisfaction

### Frontend Performance
- **Code Splitting:** Next.js automatic code splitting with route-based chunks
- **Component Lazy Loading:** Dynamic imports for optimal bundle size
- **Mobile Optimization:** Responsive design with performance-first components
- **Image Optimization:** Next.js Image component with WebP support

### Database Performance
- **Strategic Indexing:** Organization-based and status-based indexes
- **Query Optimization:** Efficient joins and pagination strategies
- **Connection Pooling:** Supabase managed connection pooling
- **Read Replicas:** Planned for scaling read operations

### API Performance
- **Background Processing:** Inngest for long-running operations
- **Caching Strategy:** Multi-layer caching (Redis, application, database)
- **Rate Limiting:** Per-organization limits with fair usage policies
- **Optimistic Updates:** Immediate UI feedback with server sync

### Monitoring & Observability
- **Error Tracking:** Sentry integration for error monitoring
- **Performance Metrics:** Custom dashboard for KPI tracking
- **Health Checks:** External service monitoring and alerting
- **Real-time Analytics:** Live performance metrics and usage patterns

## Development Tools

### Code Quality
- ESLint with custom design system rules
- TypeScript strict mode
- Prettier code formatting

### Testing Tools
- Vitest for unit testing
- Playwright for E2E testing
- Storybook for component development

## Documentation & Knowledge Management

### Comprehensive Documentation System
**New Documentation Structure (2026-02-06):**
- **[Architecture Overview](docs/project-documentation/architecture/ARCHITECTURE_OVERVIEW.md)** - Complete system architecture and design patterns
- **[API Reference](docs/project-documentation/api/API_REFERENCE.md)** - Comprehensive API endpoint documentation (47+ endpoints)
- **[Database Schema](docs/project-documentation/database/DATABASE_SCHEMA.md)** - Complete database design with relationships
- **[Workflow Guide](docs/project-documentation/workflows/WORKFLOW_GUIDE.md)** - Intent Engine workflow orchestration
- **[Development Guide](docs/project-documentation/DEVELOPMENT_GUIDE.md)** - Development patterns, testing, and best practices
- **[Project Index](docs/project-documentation/PROJECT_INDEX.md)** - Master navigation and quick reference

### Documentation Features
- **Cross-Referenced:** Interlinked documentation with easy navigation
- **Code Examples:** Practical TypeScript examples throughout
- **Current State:** Reflects production system with latest features
- **Developer-Friendly:** Quick start paths for different roles
- **Version Controlled:** All documentation tracked in git repository

### Knowledge Integration
- **Source Tree Analysis:** This document provides structural foundation
- **API Documentation:** Complete endpoint reference with examples
- **Architecture Documentation:** System design and component interactions
- **Development Patterns:** Best practices and coding standards
- **Workflow Documentation:** Business process and user journey mapping

## Summary

The Infin8Content platform represents a **production-ready, enterprise-grade SaaS application** with:

- **40+ Completed Epics** spanning foundation, content generation, and optimization
- **9-Step Intent Engine** workflow with deterministic state management
- **Comprehensive Documentation** system for development and maintenance
- **Multi-Tenant Architecture** with enterprise-grade security and compliance
- **Optimized Performance** with 85% cost reduction and 60-70% speed improvements
- **Modern Technology Stack** with Next.js, Supabase, and AI integrations

The platform is **fully functional** with all critical features implemented and documented, ready for production deployment and scaling.

---

**Last Updated:** 2026-02-06  
**Analysis Version:** v2.0  
**Platform Status:** Production Ready
