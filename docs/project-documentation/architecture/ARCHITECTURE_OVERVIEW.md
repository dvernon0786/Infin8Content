# Infin8Content Architecture Overview

**Generated:** 2026-02-06  
**Version:** v2.0  
**Status:** Production-Ready

## System Overview

Infin8Content is a comprehensive content generation platform that combines AI-powered article creation with SEO optimization, workflow orchestration, and publishing automation. The system is built on a modern tech stack with strong emphasis on scalability, reliability, and user experience.

## Technology Stack

### Frontend
- **Framework:** Next.js 16.1.1 with React 19.2.3
- **Styling:** Tailwind CSS 4.0 with design tokens
- **UI Components:** Radix UI primitives with custom component library
- **State Management:** React hooks with real-time Supabase subscriptions
- **Development:** TypeScript 5, Vitest for testing, Storybook for components

### Backend
- **Runtime:** Next.js API routes with Edge Runtime support
- **Database:** PostgreSQL via Supabase with Row Level Security (RLS)
- **Orchestration:** Inngest for workflow management and background jobs
- **Authentication:** Supabase Auth with email/password and OAuth options
- **File Storage:** Supabase Storage for media and assets

### External Services
- **AI/LLM:** OpenRouter (Gemini 2.5 Flash, Llama 3.3 70B)
- **SEO Research:** DataForSEO (keyword research, SERP analysis)
- **Web Research:** Tavily (real-time research per article section)
- **Content Intelligence:** Perplexity AI (ICP generation, subtopic ideas)
- **Publishing:** WordPress REST API
- **Payments:** Stripe (subscriptions, usage tracking)
- **Email:** Brevo (transactional and marketing)

## Core Architecture Patterns

### 1. Intent Engine Workflow System

The Intent Engine is the core workflow orchestration system that guides users through a structured content creation process:

```
ICP Generation → Competitor Analysis → Keyword Research → 
Topic Clustering → Subtopic Generation → Article Generation → Publishing
```

**Key Components:**
- **Epic-based Development:** 40+ epics with granular story breakdown
- **State Machine:** Deterministic workflow states with hard gates
- **Audit Trail:** Complete decision logging for compliance
- **Real-time Progress:** Live status updates via Supabase subscriptions

### 2. Deterministic Article Pipeline

A sequential, fault-tolerant article generation system:

```
Article Queued → Research → Outline Generation → 
Batch Research → Section Processing → Assembly → Publishing
```

**Features:**
- **Idempotent Operations:** Safe retries and re-runs
- **Progress Tracking:** Section-by-section progress monitoring
- **Quality Gates:** Automated quality scoring and retry logic
- **Error Recovery:** Smart retry with exponential backoff

### 3. Multi-Source Keyword Engine

Comprehensive keyword research and expansion system:

```
Competitor URLs → Seed Keywords → Long-tail Expansion → 
Topic Clustering → Subtopic Generation → Article Ideas
```

**Data Sources:**
- **DataForSEO:** 4-endpoint keyword intelligence (Related, Suggestions, Ideas, Autocomplete)
- **Semantic Clustering:** Embedding-based hub-and-spoke topic modeling
- **Quality Filtering:** Search volume, competition, and relevance scoring

## Service Architecture

### Core Services

#### Intent Engine Services (`lib/services/intent-engine/`)
- **ICP Generator:** Ideal Customer Profile generation via Perplexity
- **Competitor Analyzer:** Seed keyword extraction from competitor URLs
- **Keyword Expander:** Long-tail keyword generation via DataForSEO
- **Keyword Clusterer:** Semantic topic clustering with embeddings
- **Cluster Validator:** Structural and semantic validation
- **Subtopic Generator:** Blog topic ideas via DataForSEO
- **Article Progress Tracker:** Real-time progress monitoring

#### Article Generation Services (`lib/services/article-generation/`)
- **Section Processor:** AI-powered content generation per section
- **Research Agent:** Tavily integration for real-time research
- **Content Writer:** OpenRouter integration for LLM content
- **Article Assembler:** Section combination with ToC generation
- **Quality Scorer:** Content quality assessment and optimization

#### Publishing Services (`lib/services/publishing/`)
- **WordPress Adapter:** WordPress REST API integration
- **Publish Reference Manager:** Idempotent publishing tracking

### API Layer Structure

#### Intent Engine APIs (`app/api/intent/`)
- **Workflows:** `/api/intent/workflows/[workflow_id]/steps/*`
- **ICP:** `/api/intent/icp/*`
- **Competitors:** `/api/intent/competitors/*`
- **Keywords:** `/api/keywords/*`

#### Article Generation APIs (`app/api/articles/`)
- **Generation:** `/api/articles/generate`
- **Publishing:** `/api/articles/publish`
- **Status:** `/api/articles/[id]/status`

#### User Management APIs (`app/api/auth/`, `app/api/organizations/`)
- **Authentication:** `/api/auth/*`
- **Organizations:** `/api/organizations/*`
- **Teams:** `/api/team/*`

## Database Architecture

### Core Tables

#### Workflow Tables
- **intent_workflows:** Master workflow records with state tracking
- **keywords:** Hierarchical keyword structure (seed → longtail → subtopics)
- **topic_clusters:** Hub-and-spoke topic relationships
- **cluster_validation_results:** Validation outcomes and metrics

#### Content Tables
- **articles:** Generated content with metadata and status
- **article_sections:** Section-by-section content storage
- **publish_references:** Idempotent publishing tracking

#### System Tables
- **organizations:** Multi-tenant organization management
- **audit_logs:** WORM-compliant audit trail
- **usage_tracking:** Plan limits and usage metrics
- **intent_approvals:** Human approval workflow records

### Database Patterns

#### Multi-Tenancy
- **Organization Isolation:** All data scoped by `organization_id`
- **RLS Policies:** Database-level access control
- **Row Security:** Automatic tenant filtering

#### Audit & Compliance
- **Immutable Logs:** WORM-compliant audit trail
- **Activity Tracking:** User actions and system events
- **Usage Metrics:** Plan enforcement and billing

#### Performance & Scalability
- **Normalized Schema:** Avoid JSON blobs for query performance
- **Strategic Indexing:** Optimized for common query patterns
- **Migration Strategy:** Incremental schema evolution

## Security Architecture

### Authentication & Authorization
- **Supabase Auth:** JWT-based authentication
- **RLS Policies:** Database-level authorization
- **Organization Scoping:** Automatic tenant isolation
- **Role-Based Access:** Admin, member, and custom roles

### Data Protection
- **Encryption:** TLS 1.3 for all communications
- **API Keys:** Secure external service integration
- **Environment Variables:** Sensitive configuration protection
- **Audit Logging:** Complete access and modification tracking

### Rate Limiting & Abuse Prevention
- **API Rate Limits:** Per-organization throttling
- **Usage Enforcement:** Plan-based limits
- **Abuse Detection:** Automated monitoring and alerts

## Real-time Architecture

### Supabase Real-time
- **Live Updates:** Article generation progress
- **Dashboard Sync:** Real-time status indicators
- **Collaboration:** Multi-user updates
- **Notifications:** System event broadcasting

### Fallback Mechanisms
- **Polling Backup:** Graceful degradation for real-time failures
- **Error Boundaries:** Component-level error isolation
- **Retry Logic:** Exponential backoff with jitter

## Deployment Architecture

### Hosting & Infrastructure
- **Frontend:** Vercel Edge Network
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **CDN:** Vercel Edge + Supabase Storage

### Monitoring & Observability
- **Sentry:** Error tracking and performance monitoring
- **Custom Metrics:** Business KPI tracking
- **Health Checks:** System status monitoring
- **Performance Analytics:** User experience metrics

## Development Workflow

### Code Organization
```
infin8content/
├── app/                 # Next.js app router
│   ├── api/            # API endpoints
│   ├── dashboard/      # Main application UI
│   └── (auth)/         # Authentication flows
├── lib/
│   ├── services/       # Business logic services
│   ├── supabase/       # Database clients
│   └── utils/          # Shared utilities
├── components/         # Reusable UI components
├── __tests__/          # Test suites
└── types/             # TypeScript definitions
```

### Testing Strategy
- **Unit Tests:** Vitest for service and utility testing
- **Integration Tests:** API endpoint and database testing
- **E2E Tests:** Playwright for user journey testing
- **Contract Tests:** External service integration testing

### Quality Gates
- **TypeScript:** Strict type checking
- **ESLint:** Code quality and consistency
- **Pre-commit:** Husky hooks for quality enforcement
- **CI/CD:** Automated testing and deployment

## Performance Optimizations

### Article Generation
- **Parallel Processing:** Concurrent section generation
- **Smart Caching:** Research result caching
- **Batch Operations:** Optimized database operations
- **Resource Management:** Memory and connection pooling

### Database Performance
- **Query Optimization:** Strategic indexing
- **Connection Pooling:** Supabase connection management
- **Caching Strategy:** Application-level result caching
- **Monitoring:** Query performance tracking

### Frontend Performance
- **Code Splitting:** Route-based chunking
- **Image Optimization:** Next.js Image component
- **Bundle Analysis:** Size monitoring and optimization
- **Loading States:** Progressive enhancement

## Integration Patterns

### External Service Integration
- **Retry Logic:** Exponential backoff with circuit breakers
- **Error Handling:** Graceful degradation and fallbacks
- **Rate Limiting:** Per-service throttling
- **Monitoring:** Integration health tracking

### Data Flow Patterns
- **Event-Driven:** Inngest workflow orchestration
- **Streaming:** Real-time data synchronization
- **Batch Processing:** Bulk operations optimization
- **Caching:** Multi-layer caching strategy

## Future Architecture Considerations

### Scalability
- **Microservices:** Service decomposition for scale
- **Event Sourcing:** Audit trail optimization
- **CQRS:** Read/write separation for performance
- **Horizontal Scaling:** Multi-instance deployment

### Extensibility
- **Plugin Architecture:** Third-party integration support
- **Workflow Engine:** Custom workflow definitions
- **Template System:** Customizable content templates
- **API Versioning:** Backward-compatible evolution

This architecture documentation serves as the foundation for understanding the Infin8Content platform's design patterns, implementation decisions, and operational considerations.
