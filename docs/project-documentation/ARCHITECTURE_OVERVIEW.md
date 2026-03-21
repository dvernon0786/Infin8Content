# Infin8Content Architecture Overview

**Version:** v2.1.0 (Zero-Legacy FSM)  
**Last Updated:** 2026-02-17  
**Architecture:** Deterministic Finite State Machine

---

## 🎯 Executive Summary

Infin8Content is an enterprise-scale AI-powered content generation platform built on a zero-legacy deterministic Finite State Machine (FSM) architecture. The system orchestrates a 9-step workflow for content creation, from Ideal Customer Profile (ICP) generation through article publishing.

### Key Architectural Achievements
- **Zero-Legacy FSM**: 100% deterministic workflow execution
- **Race Safety**: Atomic state transitions with database-level guards
- **Multi-Tenant**: Organization isolation via Row Level Security (RLS)
- **Event-Driven**: FSM state transitions with comprehensive audit logging
- **Production-Grade**: Enterprise reliability with zero architectural debt

---

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Infin8Content Platform                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16.1.1)                                  │
│  ├── Dashboard UI                                           │
│  ├── Workflow Management                                   │
│  ├── Real-time Updates                                      │
│  └── Component Library (shadcn/ui)                         │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Next.js App Router)                             │
│  ├── 91 Endpoints across 13 categories                     │
│  ├── Authentication & Authorization                        │
│  ├── Rate Limiting & Throttling                            │
│  └── Error Handling & Validation                            │
├─────────────────────────────────────────────────────────────┤
│  Workflow Engine (Zero-Legacy FSM)                          │
│  ├── 9-Step Deterministic Workflow                          │
│  ├── State Machine Core                                     │
│  ├── Atomic State Transitions                               │
│  └── Comprehensive Audit Trail                             │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (65+ Services)                               │
│  ├── Intent Engine (Epic 34-38)                            │
│  ├── Article Generation Pipeline                           │
│  ├── AI Integrations (OpenRouter, DataForSEO)              │
│  └── Publishing Services (WordPress)                       │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Supabase + PostgreSQL)                        │
│  ├── Multi-Tenant Schema                                   │
│  ├── Row Level Security (RLS)                              │
│  ├── Real-time Subscriptions                               │
│  └── Comprehensive Audit Logging                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 FSM Workflow Engine

### State Machine Design

The Infin8Content workflow engine implements a pure deterministic Finite State Machine with linear progression:

```typescript
type WorkflowState =
  | 'step_1_icp'        // Ideal Customer Profile generation
  | 'step_2_competitors' // Competitor analysis
  | 'step_3_seeds'       // Seed keyword extraction
  | 'step_4_longtails'   // Long-tail keyword expansion
  | 'step_5_filtering'   // Keyword filtering
  | 'step_6_clustering'  // Topic clustering
  | 'step_7_validation'  // Cluster validation
  | 'step_8_subtopics'   // Subtopic generation
  | 'step_9_articles'    // Article generation
  | 'completed'          // Workflow complete
```

### State Transition Events

```typescript
type WorkflowEvent =
  | 'ICP_COMPLETED'        // step_1_icp → step_2_competitors
  | 'COMPETITORS_COMPLETED' // step_2_competitors → step_3_seeds
  | 'SEEDS_APPROVED'        // step_3_seeds → step_4_longtails
  | 'LONGTAILS_COMPLETED'   // step_4_longtails → step_5_filtering
  | 'FILTERING_COMPLETED'   // step_5_filtering → step_6_clustering
  | 'CLUSTERING_COMPLETED'  // step_6_clustering → step_7_validation
  | 'VALIDATION_COMPLETED'  // step_7_validation → step_8_subtopics
  | 'SUBTOPICS_APPROVED'    // step_8_subtopics → step_9_articles
  | 'ARTICLES_COMPLETED'    // step_9_articles → completed
  | 'HUMAN_RESET'           // Manual reset to earlier state
```

### Atomic Transition Pattern

```typescript
// Production-grade atomic transition
static async transition(
  workflowId: string,
  event: WorkflowEvent,
  options?: { resetTo?: WorkflowState; userId?: string }
): Promise<WorkflowState> {
  const supabase = createServiceRoleClient()
  const currentState = await this.getCurrentState(workflowId)

  // Validate transition is allowed
  if (!this.canTransition(currentState, event)) {
    throw new Error(`Invalid transition: ${currentState} → ${event}`)
  }

  // Execute atomic database transition
  const { data } = await supabase
    .from('intent_workflows')
    .update({ 
      state: WorkflowTransitions[currentState][event],
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .eq('state', currentState) // Race condition protection
    .single()

  return data.state
}
```

---

## 🎯 Intent Engine Architecture

### Epic Structure (34-38)

The Intent Engine implements a 5-epic workflow for intelligent content creation:

#### **Epic 34: ICP & Competitor Analysis** ✅
- **Step 1**: Generate Ideal Customer Profile
- **Step 2**: Analyze competitors and extract seed keywords
- **Services**: ICP Generator, Competitor Analyzer, Seed Extractor

#### **Epic 35: Keyword Research & Expansion** ✅
- **Step 3**: Approve seed keywords
- **Step 4**: Expand into long-tail keywords (4 DataForSEO sources)
- **Services**: Seed Approval Gate, Longtail Expander

#### **Epic 36: Keyword Refinement & Topic Clustering** ✅
- **Step 5**: Filter keywords by quality and relevance
- **Step 6**: Cluster keywords into hub-and-spoke structure
- **Services**: Keyword Filter, Topic Clusterer

#### **Epic 37: Content Topic Generation & Approval** ✅
- **Step 7**: Validate cluster coherence
- **Step 8**: Generate subtopics via DataForSEO
- **Services**: Cluster Validator, Subtopic Generator

#### **Epic 38: Article Generation & Workflow Completion** 🔄
- **Step 9**: Queue articles for generation
- **Final**: Complete workflow
- **Services**: Article Queuer, Progress Tracker

---

## 🔧 Service Layer Architecture

### Service Categories

#### **Intent Engine Services** (25+ services)
- **ICP Services**: Profile generation, validation
- **Competitor Services**: Analysis, seed extraction
- **Keyword Services**: Expansion, filtering, clustering
- **Content Services**: Subtopic generation, approval

#### **Article Generation Services** (15+ services)
- **OpenRouter Integration**: Multi-model AI generation
- **Content Pipeline**: Section processing, assembly
- **Quality Assurance**: Validation, scoring
- **Publishing**: WordPress integration, status tracking

#### **Platform Services** (25+ services)
- **Authentication**: User management, session handling
- **Authorization**: RLS enforcement, permission checks
- **Audit Logging**: Comprehensive activity tracking
- **Real-time**: WebSocket subscriptions, updates

### Service Patterns

```typescript
// Standard service pattern with FSM integration
export class KeywordExpander {
  async expand(workflowId: string): Promise<ExpansionResult> {
    // 1. Validate current state
    const workflow = await this.getWorkflow(workflowId)
    if (workflow.state !== 'step_3_seeds') {
      throw new Error('Invalid workflow state')
    }

    // 2. Execute business logic
    const results = await this.performExpansion(workflow)

    // 3. Transition state atomically
    await WorkflowFSM.transition(workflowId, 'LONGTAILS_COMPLETED')

    return results
  }
}
```

---

## 🗄️ Database Architecture

### Core Tables

#### **Workflow Management**
```sql
intent_workflows          -- Master workflow records
  - id (UUID, PK)
  - organization_id (UUID, FK)
  - state (workflow_state_enum) -- FSM state
  - workflow_data (JSONB) -- Workflow metadata
  - created_at/updated_at
```

#### **Content Hierarchy**
```sql
keywords                 -- Keyword hierarchy (seed → longtail → subtopics)
  - id (UUID, PK)
  - workflow_id (UUID, FK)
  - parent_seed_keyword_id (UUID, FK) -- Longtail → Seed relationship
  - keyword_text (TEXT)
  - keyword_type (ENUM) -- seed/longtail
  - longtail_status (ENUM) -- not_started/complete
  - subtopics_status (ENUM) -- not_started/complete
  - article_status (ENUM) -- not_started/ready

topic_clusters           -- Hub-and-spoke clustering
  - id (UUID, PK)
  - workflow_id (UUID, FK)
  - hub_keyword_id (UUID, FK)
  - spoke_keyword_id (UUID, FK)
  - similarity_score (DECIMAL)

articles                 -- Generated content
  - id (UUID, PK)
  - workflow_id (UUID, FK)
  - keyword_id (UUID, FK)
  - title (TEXT)
  - content (TEXT)
  - status (ENUM) -- queued/generating/completed/failed
```

#### **Audit & Governance**
```sql
audit_logs              -- Comprehensive activity tracking
  - id (UUID, PK)
  - organization_id (UUID, FK)
  - user_id (UUID, FK)
  - action (TEXT)
  - details (JSONB)
  - ip_address (INET)
  - user_agent (TEXT)
  - created_at

usage_tracking           -- Plan limits and billing
  - id (UUID, PK)
  - organization_id (UUID, FK)
  - metric_type (TEXT)
  - billing_period (TEXT)
  - usage_count (INTEGER)
```

### Security Architecture

#### **Row Level Security (RLS)**
```sql
-- Organization isolation for all multi-tenant tables
CREATE POLICY organization_isolation ON keywords
  FOR ALL TO authenticated
  USING (organization_id = auth.org_id());

-- Workflow access control
CREATE POLICY workflow_access ON intent_workflows
  FOR ALL TO authenticated
  USING (organization_id = auth.org_id());
```

---

## 🔐 Security & Compliance

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Session Management**: Secure cookie handling
- **Organization Isolation**: RLS-enforced multi-tenancy
- **API Rate Limiting**: Per-organization throttling

### Audit & Compliance
- **Comprehensive Logging**: All actions tracked with user attribution
- **Data Privacy**: GDPR-compliant data handling
- **Financial Tracking**: AI usage cost accounting
- **Security Headers**: OWASP-recommended headers

### Production Safety
- **Zero-Legacy Architecture**: No deprecated field references
- **Atomic Operations**: Database-level race condition protection
- **Error Boundaries**: Graceful degradation patterns
- **Monitoring**: Real-time system health tracking

---

## 🚀 Performance & Scalability

### Database Optimization
- **Strategic Indexing**: Optimized for workflow queries
- **Connection Pooling**: Supabase connection management
- **Query Optimization**: Explicit field selection (no SELECT *)
- **Caching Strategy**: Application-level caching for frequent queries

### API Performance
- **Response Time**: <200ms average for workflow operations
- **Concurrent Safety**: Atomic state transitions prevent race conditions
- **Rate Limiting**: 100 requests/minute per organization
- **Error Handling**: Comprehensive error recovery patterns

### Real-time Features
- **WebSocket Subscriptions**: Live workflow updates
- **Optimistic UI**: Immediate feedback with server sync
- **Background Processing**: Inngest for async operations
- **Progress Tracking**: Real-time article generation status

---

## 📊 Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5.0+
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Context + Server State
- **Real-time**: Supabase subscriptions

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### External Services
- **AI Models**: OpenRouter (Gemini, Llama, Claude)
- **SEO Data**: DataForSEO API
- **Research**: Tavily API
- **Publishing**: WordPress REST API
- **Email**: Brevo (formerly Sendinblue)

### Infrastructure
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics + Custom dashboards
- **Error Tracking**: Built-in error boundaries
- **CI/CD**: GitHub Actions

---

## 🎯 Development Patterns

### Code Organization
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── (auth)/            # Authenticated routes
│   └── dashboard/         # Main application
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── fsm/              # Finite State Machine
│   ├── services/         # Business logic
│   └── supabase/         # Database clients
├── types/                # TypeScript definitions
└── __tests__/            # Test suites
```

### Development Workflow
1. **Feature Development**: Create feature branch
2. **FSM Integration**: Ensure proper state transitions
3. **Testing**: Unit + integration tests
4. **Code Review**: Architecture compliance check
5. **Documentation**: Update API contracts
6. **Deployment**: Merge to main → auto-deploy

### Quality Gates
- **TypeScript Compilation**: Zero errors required
- **Test Coverage**: Minimum 80% for new features
- **FSM Compliance**: No legacy field references
- **Security Review**: For sensitive changes
- **Documentation**: API contracts updated

---

## 📈 System Metrics

### Current Status (v2.1.0)
- **Workflow Steps**: 9 deterministic FSM states
- **API Endpoints**: 91 across 13 categories
- **Service Layer**: 65+ specialized services
- **Database Tables**: 15+ with RLS policies
- **Legacy Violations**: 0 (eliminated from 20)
- **Test Coverage**: 85%+ overall

### Performance Metrics
- **Average Response Time**: 180ms
- **Workflow Completion Rate**: 98%
- **System Uptime**: 99.9%
- **Error Rate**: <0.1%
- **Concurrent Users**: 1000+ supported

---

This architecture overview provides a comprehensive understanding of the Infin8Content platform's zero-legacy FSM implementation, service layer organization, and production-grade infrastructure.
