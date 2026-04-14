# Infin8Content Architecture Overview

**Generated:** 2026-02-22  
**Version:** Production-Ready Zero-Legacy FSM Architecture  
**Status:** Operational

## System Summary

Infin8Content is an enterprise-grade content generation platform built on a zero-legacy Finite State Machine (FSM) architecture. The system transforms SEO research into publish-ready blog content through a deterministic 9-step workflow.

## Core Architecture

### Zero-Legacy FSM Design
- **States:** 10 deterministic states (step_1_icp → step_9_articles → completed)
- **Transitions:** Atomic database-level state transitions with WHERE clause protection
- **Centralized Control:** All state changes through `WorkflowFSM.transition()`
- **Event-Driven:** Inngest functions for background automation
- **Type Safety:** Strongly typed state transitions with runtime validation

### Multi-Tenant Security
- **Organization Isolation:** Row Level Security (RLS) policies enforced at all levels
- **Authentication:** Supabase Auth with session management
- **Authorization:** Role-based access control with audit trails
- **Data Privacy:** Complete tenant separation with zero data leakage

### Technology Stack

#### Frontend
- **Framework:** Next.js 16.1.1 with App Router
- **UI Library:** React 19.2.3 with Radix UI components
- **Styling:** TailwindCSS 4 with design system tokens
- **State Management:** React hooks with server state synchronization
- **Real-time:** Supabase realtime subscriptions (best-effort)

#### Backend
- **Runtime:** Node.js 20.20.0 with TypeScript 5
- **Database:** Supabase (PostgreSQL) with 43+ migrations
- **API Layer:** 91 endpoints across 13 categories
- **Background Jobs:** Inngest with deterministic execution
- **External APIs:** DataForSEO, OpenRouter, WordPress

#### Infrastructure
- **Deployment:** Production-ready with CI/CD pipelines
- **Monitoring:** Comprehensive audit trails and error tracking
- **Performance:** Database indexing and query optimization
- **Scalability:** Stateless services with horizontal scaling

## Intent Engine Architecture

### Epic Structure
The Intent Engine is organized into 5 major epics, each representing a complete workflow phase:

#### Epic 34: ICP & Competitor Analysis ✅
- **Step 1:** Generate Ideal Customer Profile (ICP)
- **Step 2:** Analyze competitor content and extract seed keywords
- **Step 3:** Human approval of seed keywords

#### Epic 35: Keyword Research & Expansion ✅
- **Step 4:** Expand seeds into long-tail keywords using 4 DataForSEO sources
- **Step 5:** Filter keywords based on business criteria

#### Epic 36: Keyword Refinement & Topic Clustering ✅
- **Step 6:** Cluster keywords into hub-and-spoke topic structures
- **Step 7:** Validate cluster coherence and structure

#### Epic 37: Content Topic Generation & Approval ✅
- **Step 8:** Generate subtopic definitions for each longtail keyword
- **Human Gate:** Approval of subtopics for article generation

#### Epic 38: Article Generation & Workflow Completion 🔄
- **Step 9:** Generate articles and complete workflow

### Service Layer Organization

#### Intent Engine Services (`/lib/services/intent-engine/`)
- **Gate Validators:** FSM state-based access control
- **Processors:** Business logic for each workflow step
- **Extractors:** Data extraction from external APIs
- **Validators:** Data quality and structure validation

#### Article Generation Services (`/lib/services/article-generation/`)
- **Content Writing Agent:** AI-powered article creation
- **Research Agent:** Citation and fact-checking
- **Section Processor:** Parallel section generation
- **Quality Checker:** Content validation and optimization

#### External API Services (`/lib/services/`)
- **DataForSEO Client:** SEO intelligence integration
- **OpenRouter Integration:** AI model abstraction
- **WordPress Publisher:** Content publishing automation

## Data Flow Architecture

### Workflow Progression
```
User Input → ICP Generation → Competitor Analysis → Seed Extraction → 
Human Approval → Longtail Expansion → Keyword Filtering → Topic Clustering → 
Cluster Validation → Subtopic Generation → Human Approval → Article Generation → Publishing
```

### Data Persistence Model
- **Normalized Schema:** No JSON storage in workflow tables
- **Referential Integrity:** Foreign key constraints enforced
- **Audit Trail:** WORM-compliant audit logging
- **State Immutability:** Deterministic state progression

### External Integration Points
- **DataForSEO:** Keyword research and competitor analysis
- **OpenRouter:** AI model access for content generation
- **WordPress:** Content publishing and management
- **Brevo:** Email notifications and user communication

## Quality Assurance Architecture

### Testing Strategy
- **Unit Tests:** Service-level logic validation
- **Integration Tests:** API endpoint and database integration
- **E2E Tests:** Complete workflow execution validation
- **Performance Tests:** Load testing and optimization validation

### Code Quality Gates
- **TypeScript Compilation:** Strict type checking enforced
- **ESLint Rules:** Code style and pattern consistency
- **Code Review:** Required for all changes
- **Documentation:** Comprehensive API and service documentation

## Security Architecture

### Multi-Tenant Isolation
- **RLS Policies:** Database-level tenant separation
- **Organization Context:** All queries scoped to organization
- **User Authorization:** Role-based access control
- **API Security:** Authentication and rate limiting

### Data Protection
- **Audit Logging:** Complete action tracking with user attribution
- **Error Handling:** Non-blocking error reporting
- **Input Validation:** Comprehensive request validation
- **Secrets Management:** Environment-based configuration

## Performance Architecture

### Database Optimization
- **Indexing Strategy:** Query performance optimization
- **Connection Pooling:** Efficient database resource usage
- **Query Patterns:** Explicit field selection (no wildcards)
- **Migration Safety:** Zero-downtime schema changes

### Application Performance
- **Caching Strategy:** Intelligent result caching
- **Background Processing:** Asynchronous job execution
- **Real-time Updates:** Best-effort realtime subscriptions
- **Resource Monitoring:** Performance metrics and alerting

## Deployment Architecture

### Environment Strategy
- **Development:** Local development with hot reload
- **Staging:** Production-like environment for testing
- **Production:** High-availability deployment with monitoring

### CI/CD Pipeline
- **Automated Testing:** Comprehensive test suite execution
- **Code Quality:** Automated quality gate validation
- **Security Scanning:** Dependency vulnerability assessment
- **Deployment:** Automated deployment with rollback capability

## Monitoring & Observability

### Application Monitoring
- **Error Tracking:** Comprehensive error logging and alerting
- **Performance Metrics:** Response time and throughput monitoring
- **Business Metrics:** Workflow completion and user engagement
- **System Health:** Database and external service monitoring

### Audit Trail
- **User Actions:** Complete user activity tracking
- **System Events:** Workflow state transitions and automation
- **Data Changes:** Database mutation tracking
- **Security Events:** Authentication and authorization logging

## Future Architecture Considerations

### Scalability
- **Horizontal Scaling:** Stateless service design
- **Database Scaling:** Read replicas and connection pooling
- **Caching Layers:** Multi-level caching strategy
- **Load Balancing:** Traffic distribution optimization

### Extensibility
- **Plugin Architecture:** Modular service design
- **API Versioning:** Backward-compatible API evolution
- **Feature Flags:** Controlled feature rollout
- **Configuration Management:** Dynamic configuration updates

---

**Architecture Status:** Production-Ready with zero-legacy FSM design  
**Quality Grade:** A- (Excellent)  
**Scalability:** Enterprise-grade with horizontal scaling capability  
**Maintainability:** Comprehensive documentation and testing coverage
