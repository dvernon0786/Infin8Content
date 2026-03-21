# Infin8Content Workflow System Documentation

**Generated:** 2026-02-22  
**Version:** Production-Ready FSM Architecture  
**Total Steps:** 9 deterministic workflow steps

## Workflow Architecture

### Finite State Machine (FSM) Design
The Infin8Content workflow system is built on a zero-legacy FSM architecture that provides:
- **Deterministic State Transitions:** All state changes are atomic and validated
- **Centralized Control:** Single source of truth through `WorkflowFSM.transition()`
- **Type Safety:** Strongly typed state transitions with runtime validation
- **Event-Driven Automation:** Inngest functions for background processing

### State Flow
```
step_1_icp → step_2_competitors → step_3_seeds → 
step_4_longtails → step_5_filtering → step_6_clustering → 
step_7_validation → step_8_subtopics → step_9_articles → completed
```

## Epic Structure

### Epic 34: ICP & Competitor Analysis ✅
**Objective:** Establish foundation with ideal customer profile and competitor intelligence.

#### Step 1: Generate ICP
- **State:** `step_1_icp`
- **Process:** AI-powered ideal customer profile generation
- **Input:** Business description, target audience
- **Output:** Structured ICP data (JSONB)
- **Transition:** `ICP_COMPLETED` → `step_2_competitors`

#### Step 2: Analyze Competitors
- **State:** `step_2_competitors`
- **Process:** Competitor URL analysis and seed keyword extraction
- **Input:** Competitor URLs (max 3)
- **Output:** Seed keywords in normalized table
- **Transition:** `COMPETITORS_COMPLETED` → `step_3_seeds`

#### Step 3: Seed Approval (Human Gate)
- **State:** `step_3_seeds`
- **Process:** Human review and approval of extracted seed keywords
- **Input:** Seed keyword list for review
- **Output:** Approval/rejection decisions
- **Transition:** `SEEDS_APPROVED` → `step_4_longtails`

### Epic 35: Keyword Research & Expansion ✅
**Objective:** Expand seed keywords into comprehensive long-tail keyword sets.

#### Step 4: Longtail Expansion
- **State:** `step_4_longtails`
- **Process:** 4-source DataForSEO expansion (related, suggestions, ideas, autocomplete)
- **Input:** Approved seed keywords
- **Output:** 12 longtail keywords per seed (normalized)
- **Transition:** `LONGTAILS_COMPLETED` → `step_5_filtering`

#### Step 5: Keyword Filtering
- **State:** `step_5_filtering`
- **Process:** Business criteria filtering and quality scoring
- **Input:** Expanded longtail keywords
- **Output:** Filtered, approved keyword set
- **Transition:** `FILTERING_COMPLETED` → `step_6_clustering`

### Epic 36: Keyword Refinement & Topic Clustering ✅
**Objective:** Organize keywords into structured hub-and-spoke topic clusters.

#### Step 6: Topic Clustering
- **State:** `step_6_clustering`
- **Process:** Semantic clustering into hub-and-spoke structures
- **Input:** Filtered keywords
- **Output:** Topic clusters with hub/spoke relationships
- **Transition:** `CLUSTERING_COMPLETED` → `step_7_validation`

#### Step 7: Cluster Validation
- **State:** `step_7_validation`
- **Process:** Structural and semantic validation of clusters
- **Input:** Generated topic clusters
- **Output:** Valid/invalid cluster assessments
- **Transition:** `VALIDATION_COMPLETED` → `step_8_subtopics`

### Epic 37: Content Topic Generation & Approval ✅
**Objective:** Generate subtopic ideas for content planning and approval.

#### Step 8: Subtopic Generation
- **State:** `step_8_subtopics`
- **Process:** DataForSEO subtopic generation for each longtail keyword
- **Input:** Validated clusters and keywords
- **Output:** 3 subtopics per longtail keyword
- **Transition:** `SUBTOPICS_COMPLETED` → `step_9_articles`

### Epic 38: Article Generation & Workflow Completion 🔄
**Objective:** Generate articles and complete the content creation workflow.

#### Step 9: Article Generation
- **State:** `step_9_articles`
- **Process:** AI-powered article generation with research and quality checks
- **Input:** Approved subtopics
- **Output:** Publish-ready articles
- **Transition:** `ARTICLES_COMPLETED` → `completed`

## Workflow State Management

### FSM State Engine
**Location:** `/lib/fsm/workflow-fsm.ts`

#### Core Functions
```typescript
// Atomic state transition
await WorkflowFSM.transition(workflowId, 'COMPETITORS_COMPLETED', {
  userId: currentUser.id,
  metadata: { competitorCount: 3 }
})

// State validation
const canTransition = WorkflowFSM.canTransition(currentState, 'COMPETITORS_COMPLETED')

// Current state lookup
const currentState = await WorkflowFSM.getCurrentState(workflowId)
```

#### State Transitions Rules
- **Atomicity:** Database-level WHERE clause protection
- **Validation:** State transition rules enforced at runtime
- **Audit Trail:** All transitions logged with user attribution
- **Idempotency:** Concurrent requests handled gracefully

### Human-in-the-Loop Gates

#### Seed Approval (Step 3)
- **Trigger:** Human review in dashboard
- **API:** `POST /api/intent/workflows/[id]/steps/human-approval`
- **Validation:** Organization isolation + approval authority
- **Event:** Emits `intent.step4.longtails` for automation

#### Subtopic Approval (Step 8)
- **Trigger:** Keyword-level approval in dashboard
- **API:** `POST /api/keywords/[id]/approve-subtopics`
- **Validation:** All keywords must be approved for workflow progression
- **Event:** Emits `intent.step9.articles` for automation

## Automation Integration

### Inngest Functions
**Location:** `/lib/inngest/functions/`

#### Event-Driven Workers
```typescript
// Step 4 Automation
export const step4Longtails = inngest.createFunction(
  { id: 'step-4-longtails' },
  { event: 'intent.step4.longtails' },
  async ({ event, step }) => {
    // Longtail expansion logic
    await WorkflowFSM.transition(workflowId, 'LONGTAILS_COMPLETED')
  }
)

// Step 9 Automation
export const step9Articles = inngest.createFunction(
  { id: 'step-9-articles' },
  { event: 'intent.step9.articles' },
  async ({ event, step }) => {
    // Article generation logic
    await WorkflowFSM.transition(workflowId, 'ARTICLES_COMPLETED')
  }
)
```

### Automation Graph
**Location:** `/lib/services/intent-engine/unified-workflow-engine.ts`

#### Event Flow Mapping
```
SEEDS_APPROVED → intent.step4.longtails → step4Longtails → LONGTAILS_COMPLETED
HUMAN_SUBTOPICS_APPROVED → intent.step9.articles → step9Articles → ARTICLES_COMPLETED
```

## Service Layer Architecture

### Intent Engine Services
**Location:** `/lib/services/intent-engine/`

#### Gate Validators
- **Purpose:** FSM state-based access control
- **Pattern:** Validate current state before allowing operations
- **Examples:** `seed-approval-gate-validator.ts`, `icp-gate-validator.ts`

#### Processors
- **Purpose:** Business logic execution for workflow steps
- **Pattern:** Execute side effects, then transition state
- **Examples:** `competitor-seed-extractor.ts`, `longtail-keyword-expander.ts`

#### Extractors
- **Purpose:** External API integration with deterministic patterns
- **Pattern:** Pure functions with dependency injection
- **Examples:** `deterministic-fake-extractor.ts`, DataForSEO clients

### Article Generation Services
**Location:** `/lib/services/article-generation/`

#### Content Pipeline
- **Research Agent:** Citation and fact-checking
- **Content Writer:** AI-powered article creation
- **Section Processor:** Parallel section generation
- **Quality Checker:** Content validation and optimization

## Progress Tracking

### Real-time Status
- **Workflow State:** Current FSM state
- **Step Progress:** Individual step completion status
- **Article Progress:** Section-by-section generation tracking
- **Error States:** Detailed error reporting and recovery

### Dashboard Integration
- **Progress Pages:** Real-time workflow status
- **Blocking Conditions:** Clear indication of next steps
- **Human Gates:** Prompts for required approvals
- **Completion Metrics:** Time tracking and success rates

## Quality Assurance

### State Consistency
- **Atomic Transitions:** Database-level locking
- **Concurrent Safety:** Multiple request handling
- **Rollback Protection:** No partial state updates
- **Audit Trail:** Complete state change history

### Error Handling
- **Graceful Degradation:** Non-blocking error reporting
- **Retry Logic:** Exponential backoff for transient failures
- **User Feedback:** Clear error messages and next steps
- **Recovery Mechanisms:** Automatic and manual recovery options

## Performance Optimization

### Database Efficiency
- **Explicit Field Selection:** No wildcard queries
- **Strategic Indexing:** Optimized for common query patterns
- **Connection Pooling:** Efficient resource usage
- **Query Optimization:** Performance-tuned SQL patterns

### Application Performance
- **Background Processing:** Asynchronous job execution
- **Caching Strategy:** Intelligent result caching
- **Resource Management:** Memory and CPU optimization
- **Monitoring:** Real-time performance metrics

## Testing Strategy

### Workflow Testing
- **Unit Tests:** Individual service and validator testing
- **Integration Tests:** API endpoint and database integration
- **E2E Tests:** Complete workflow execution validation
- **Concurrency Tests:** Multi-user scenario testing

### State Machine Testing
- **Transition Validation:** All legal transitions tested
- **Illegal State Prevention:** Runtime error validation
- **Concurrent Access:** Race condition prevention
- **Recovery Testing:** Error state recovery validation

## Monitoring & Observability

### Workflow Metrics
- **Completion Rates:** Success/failure ratios per step
- **Timing Analysis:** Average duration per workflow step
- **Error Tracking:** Error frequency and categorization
- **User Behavior:** Approval patterns and interaction metrics

### System Health
- **State Consistency:** FSM state validation
- **Database Performance:** Query execution metrics
- **External API Status:** DataForSEO and AI service health
- **Background Job Health:** Inngest function monitoring

---

**Workflow System Status:** Production-Ready with Zero-Legacy FSM  
**State Management:** Deterministic with atomic transitions  
**Automation:** Event-driven with human-in-the-loop gates  
**Quality Grade:** A (Enterprise-grade workflow engine)
