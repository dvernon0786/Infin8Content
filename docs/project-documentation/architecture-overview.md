# Infin8Content Architecture Overview

*Last Updated: 2026-02-20*  
*System Version: v2.1.0 - Zero-Legacy FSM Architecture*

## System Overview

Infin8Content is a production-ready content generation platform with zero-legacy FSM (Finite State Machine) architecture. The system combines AI-powered article creation with SEO optimization and competitive analysis, built on a modern web stack with emphasis on deterministic state management, scalability, and security.

## Architecture Principles

### Zero-Legacy FSM Design
- **Pure State Machine**: All workflow transitions use deterministic FSM states
- **No Legacy Fields**: Eliminated `status`, `current_step`, `step_*_completed_at` columns
- **Centralized Control**: All state changes through `WorkflowFSM.transition()`
- **Atomic Operations**: Database-level WHERE clause protection prevents race conditions

### Key Architectural Patterns
- **Organization Isolation**: RLS policies enforce multi-tenant security
- **Event-Driven Automation**: Inngest functions handle background processing
- **Real-time Updates**: Supabase subscriptions for live UI updates
- **Comprehensive Auditing**: WORM-compliant audit trails for all operations

## Core Components

### 1. Intent Engine (Workflow System)
The heart of Infin8Content - a 9-step deterministic workflow system that orchestrates the entire content creation pipeline.

**Workflow States:**
```
step_1_icp → step_2_competitors → step_3_seeds → step_4_longtails 
→ step_5_filtering → step_6_clustering → step_7_validation 
→ step_8_subtopics → step_9_articles → completed
```

**Key Epics:**
- **Epic 34**: ICP & Competitor Analysis ✅ COMPLETED
- **Epic 35**: Keyword Research & Expansion ✅ COMPLETED  
- **Epic 36**: Keyword Refinement & Topic Clustering ✅ COMPLETED
- **Epic 37**: Content Topic Generation & Approval ✅ COMPLETED
- **Epic 38**: Article Generation & Workflow Completion 🔄 ready-for-dev

### 2. Unified Workflow Engine
The ONLY way transitions happen - structurally couples FSM and automation.

**Key Files:**
- `/lib/fsm/unified-workflow-engine.ts` - Central transition engine
- `/lib/fsm/fsm.internal.ts` - Internal FSM implementation
- `/lib/fsm/workflow-events.ts` - Event and state definitions

**Automation Graph:**
```typescript
export const AUTOMATION_GRAPH = {
  // Human → Automation boundaries
  'SEEDS_APPROVED': 'intent.step4.longtails',
  'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles',
  
  // Worker → Worker chaining
  'LONGTAIL_SUCCESS': 'intent.step5.filtering',
  'FILTERING_SUCCESS': 'intent.step6.clustering',
  'CLUSTERING_SUCCESS': 'intent.step7.validation',
  'VALIDATION_SUCCESS': 'intent.step8.subtopics',
  'ARTICLES_SUCCESS': 'WORKFLOW_COMPLETED',
}

### 3. Article Generation Pipeline
Multi-step AI-powered content creation system that combines research, outlining, writing, and quality assurance.

**Components:**
- OpenRouter integration for AI model access (Gemini 2.5 Flash, Llama 3.3 70B)
- Tavily API for real-time web research
- DataForSEO for SERP analysis
- Section-by-section generation with quality scoring
- Article assembly service with TOC generation

**Key Services:**
- `/lib/services/article-generation/section-processor.ts`
- `/lib/services/article-generation/article-assembler.ts`
- `/lib/services/article-generation/outline-generator.ts`

### 4. Keyword Research Engine
Comprehensive keyword intelligence system using multiple data sources.

**Data Sources:**
- DataForSEO API (4 endpoints: related, suggestions, ideas, autocomplete)
- Semantic embedding analysis for clustering
- Hub-and-spoke topic modeling
- Competitor keyword extraction

**Key Services:**
- `/lib/services/intent-engine/longtail-keyword-expander.ts`
- `/lib/services/keyword-engine/subtopic-generator.ts`
- `/lib/services/intent-engine/keyword-clusterer.ts`

### 5. Database Architecture
PostgreSQL with Supabase, featuring zero-legacy schema design.

**Key Tables:**
- `intent_workflows` - Workflow state management (FSM states only)
- `keywords` - Keyword hierarchy with AI metadata
- `articles` - Generated content with section tracking
- `topic_clusters` - Hub-and-spoke keyword relationships
- `intent_audit_logs` - WORM-compliant audit trail
- `organization_competitors` - Competitor URL management

**Schema Features:**
- No legacy columns (status, current_step, step_*_completed_at)
- FSM state enum with constraints
- RLS policies for organization isolation
- Comprehensive indexing for performance

### 6. API Layer
Next.js API routes with comprehensive authentication and authorization.

**Endpoint Categories:**
- `/api/intent/workflows/*` - Workflow management (47 endpoints)
- `/api/keywords/*` - Keyword operations (13 endpoints)  
- `/api/articles/*` - Article generation and publishing (15 endpoints)
- `/api/admin/*` - System administration (8 endpoints)
- `/api/analytics/*` - Metrics and reporting (7 endpoints)

**Security Features:**
- JWT-based authentication
- Organization isolation via RLS
- Rate limiting and usage tracking
- Comprehensive audit logging

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: TailwindCSS with design tokens
- **UI Components**: Custom component library
- **State Management**: React hooks + Supabase realtime
- **Mobile**: Responsive design with touch optimization

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT
- **File Storage**: Supabase Storage
- **Real-time**: Supabase subscriptions

### External Services
- **AI Models**: OpenRouter (Gemini, Llama, Claude)
- **SEO Data**: DataForSEO API
- **Research**: Tavily API
- **Background Jobs**: Inngest
- **Payments**: Stripe
- **Publishing**: WordPress REST API

### Development Tools
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode
- **Documentation**: Markdown with Mermaid diagrams
- **Deployment**: Vercel with GitHub Actions

## Data Flow Architecture

### Workflow Execution Flow
```
User Input → FSM State Transition → Inngest Event → Background Worker 
→ Service Processing → Database Update → Real-time UI Update
```

### Article Generation Flow
```
Keyword Research → Subtopic Generation → Article Queuing 
→ Section Research → Content Generation → Quality Assurance 
→ Article Assembly → Publishing
```

### Human-in-the-Loop Gates
```
Step 3: Seed Keyword Approval (human gate)
Step 8: Subtopic Approval (human gate)
All other steps: Fully automated
```

## Performance & Scalability

### Optimizations
- Database connection pooling
- API response caching
- Real-time subscription optimization
- Background job queuing
- Mobile performance monitoring

### Monitoring
- Comprehensive error tracking
- Performance metrics collection
- Usage analytics and reporting
- System health monitoring
- Cost tracking for external APIs

## Security Architecture

### Multi-tenant Security
- Row Level Security (RLS) on all tables
- Organization-based data isolation
- JWT token validation
- API rate limiting per organization

### Data Protection
- WORM-compliant audit logging
- Encrypted data transmission
- Secure API key management
- GDPR compliance features

## Development Patterns

### Code Organization
- Feature-based directory structure
- Shared service layer
- Type-safe API contracts
- Comprehensive error handling
- Idempotent operations

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for mobile
- Security testing for authentication

This architecture represents a production-ready, enterprise-grade content generation platform with deterministic state management and comprehensive automation capabilities.

### 3. Keyword Research System
Comprehensive keyword intelligence platform that supports the entire content strategy workflow.

**Features:**
- Seed keyword extraction from competitor URLs
- Long-tail keyword expansion using multiple DataForSEO endpoints
- Semantic clustering into hub-and-spoke topic structures
- Subtopic generation for content planning

### 4. User Management & Authentication
Secure multi-tenant system with role-based access control and subscription management.

**Components:**
- Email/password and OAuth authentication
- Organization-based multi-tenancy
- Role-based permissions (Owner, Editor, Viewer)
- Stripe integration for subscription management

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Components**: Custom component library with shadcn/ui patterns
- **State Management**: React hooks with server state synchronization
- **Real-time**: Supabase realtime subscriptions

### Backend
- **Runtime**: Node.js with TypeScript
- **API**: Next.js API routes with RESTful patterns
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with custom middleware
- **File Storage**: Supabase Storage

### External Services
- **AI Models**: OpenRouter (Gemini, Llama variants)
- **Research**: Tavily AI for web research with citations
- **SEO Data**: DataForSEO for keyword intelligence
- **Payments**: Stripe for subscription management
- **Email**: Resend for transactional emails

### Infrastructure
- **Deployment**: Vercel (frontend) with edge functions
- **Database**: Supabase hosted PostgreSQL
- **Monitoring**: Sentry for error tracking
- **Background Jobs**: Inngest for workflow orchestration
- **Testing**: Vitest for unit tests, Playwright for E2E

## Data Flow Architecture

### 1. Content Creation Workflow
```
User Input → Intent Engine → Keyword Research → Topic Clustering → Article Generation → Publishing
```

### 2. Research Pipeline
```
Keyword → SERP Analysis → Web Research → Citation Collection → Content Planning
```

### 3. Quality Assurance
```
Generated Content → Quality Scoring → Citation Validation → User Review → Publication
```

## Security Architecture

### Multi-Tenancy
- Row Level Security (RLS) on all database tables
- Organization-based data isolation
- User-scoped access patterns

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Feature flagging for subscription tiers

### Data Protection
- GDPR/CCPA compliance features
- Data export and deletion capabilities
- Audit logging for all operations

## Performance Considerations

### Scalability
- Horizontal scaling with serverless functions
- Database connection pooling
- Caching strategies for frequently accessed data

### Optimization
- Lazy loading for large datasets
- Pagination and infinite scroll
- Background processing for heavy operations

### Monitoring
- Real-time error tracking with Sentry
- Performance metrics collection
- User experience monitoring

## Development Patterns

### Code Organization
- Feature-based directory structure
- Separation of concerns (UI, API, Services)
- Consistent naming conventions
- TypeScript for type safety

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Contract testing for external services

### Deployment Pipeline
- Automated testing on pull requests
- Staging environment for validation
- Feature flagging for gradual rollouts
- Rollback capabilities for quick recovery

## Key Architectural Decisions

### 1. Intent Engine Pattern
Chose a sophisticated workflow system over simple CRUD to handle the complexity of content creation with multiple approval gates and quality checks.

### 2. Multi-Provider AI Strategy
Implemented OpenRouter as an abstraction layer to avoid vendor lock-in and enable model fallbacks for reliability.

### 3. Row Level Security
Adopted RLS as the primary security mechanism for multi-tenancy rather than application-level filtering.

### 4. Event-Driven Architecture
Used Inngest for background job processing to ensure reliability and scalability of long-running operations.

## Future Architecture Considerations

### Scalability
- Microservices decomposition for specific domains
- Event sourcing for audit trails
- CQRS patterns for read/write optimization

### Performance
- GraphQL API for efficient data fetching
- Redis caching for frequently accessed data
- CDN optimization for static assets

### Reliability
- Circuit breakers for external services
- Retry policies with exponential backoff
- Health checks and monitoring dashboards
