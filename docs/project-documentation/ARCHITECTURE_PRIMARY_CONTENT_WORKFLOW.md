# Architecture Document
## Primary Content Workflow (Intent Engine)

**Project:** Infin8Content  
**Workflow:** Primary Content Workflow (Intent Engine)  
**Date:** 2026-01-30  
**Status:** ARCHITECTURE DESIGN  
**Architect:** Winston (System Architect)  

---

## Executive Summary

This document provides the technical architecture for the Primary Content Workflow (Intent Engine), a gated, intent-driven content generation system that validates articles against organizational ICP, competitive positioning, and editorial approval before generation.

The architecture preserves the existing monolithic article generation pipeline while introducing a parallel, modular workflow that enforces strict data dependencies and human oversight gates. Feature flags enable gradual rollout with zero-risk rollback.

**Key Design Principles:**
- **Separation of Concerns** - Intent validation separate from article generation
- **Explicit Gates** - Hard blocking conditions prevent invalid state transitions
- **Auditability** - Complete traceability of decisions and approvals
- **Brownfield Safety** - Zero impact on existing systems
- **Async-First** - Long-running steps use event-driven orchestration

---

## 1. System Context

### 1.1 Current State (Legacy System)

```
User Request → Article Created → Inngest Event → 6-Step Pipeline → Article Published
```

**Problems:**
- No intent validation before generation
- No competitive awareness
- No topic hierarchy
- No human approval gate
- No audit trail

### 1.2 Desired State (New Workflow)

```
User Request
    ↓
[STEP 0] Auth + Org Validation
    ↓
[STEP 1] ICP Generation (Perplexity)
    ↓
[STEP 2] Competitor Analysis (DataForSEO)
    ↓
[STEP 3] Seed Keywords (3 per competitor)
    ↓
[STEP 4] Longtail Expansion (4 methods)
    ↓
[STEP 5] Automated Filtering
    ↓
[STEP 6] Topic Clustering (hub-spoke)
    ↓
[STEP 7] Subtopic Generation (Perplexity)
    ↓
[STEP 8] Human Approval GATE ⚠️
    ↓
[STEP 9] Article Generation (agents)
```

### 1.3 Coexistence Model

Both workflows run simultaneously:
- **Legacy Path**: Feature flag `ENABLE_INTENT_ENGINE=false` → existing behavior
- **New Path**: Feature flag `ENABLE_INTENT_ENGINE=true` → new workflow
- **User Choice**: Organization admin selects which workflow to use
- **Rollback**: Disable flag → instant revert to legacy system

---

## 2. Data Model

### 2.1 New Tables (Additive Only)

All new tables are created in Supabase with RLS policies enforcing org isolation.

#### `intent_workflows`
```sql
CREATE TABLE intent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'step_0_auth',
  -- step_0_auth, step_1_icp, step_2_competitors, step_3_seeds,
  -- step_4_longtails, step_5_filtering, step_6_clustering,
  -- step_7_subtopics, step_8_approval, step_9_articles, completed, failed
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Step outputs (JSON for flexibility)
  icp_data JSONB,
  competitor_data JSONB,
  seed_keywords JSONB,
  longtail_keywords JSONB,
  filtered_keywords JSONB,
  clustered_topics JSONB,
  subtopics JSONB,
  
  -- Approval tracking
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_feedback TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  CONSTRAINT org_isolation CHECK (organization_id IS NOT NULL)
);

CREATE INDEX idx_intent_workflows_org_status ON intent_workflows(organization_id, status);
CREATE INDEX idx_intent_workflows_created_by ON intent_workflows(created_by);
```

#### `intent_workflow_steps`
```sql
CREATE TABLE intent_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending, running, completed, failed, blocked
  
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INT,
  
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  CONSTRAINT valid_step_number CHECK (step_number >= 0 AND step_number <= 9)
);

CREATE INDEX idx_workflow_steps_workflow_status ON intent_workflow_steps(workflow_id, status);
```

#### `intent_approvals`
```sql
CREATE TABLE intent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  
  approval_type TEXT NOT NULL,
  -- 'seed_keywords', 'longtails', 'subtopics'
  
  decision TEXT NOT NULL,
  -- 'approved', 'rejected', 'pending_revision'
  
  feedback TEXT,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_approval_per_type_per_workflow UNIQUE(workflow_id, approval_type)
);

CREATE INDEX idx_approvals_workflow_approver ON intent_approvals(workflow_id, approver_id);
```

#### `intent_audit_log`
```sql
CREATE TABLE intent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  
  action TEXT NOT NULL,
  -- 'workflow_created', 'step_started', 'step_completed', 'step_failed',
  -- 'approval_requested', 'approval_granted', 'approval_rejected',
  -- 'workflow_completed', 'workflow_rolled_back'
  
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_workflow_actor ON intent_audit_log(workflow_id, actor_id);
```

### 2.2 RLS Policies

All tables enforce organization isolation:

```sql
-- Example for intent_workflows
ALTER TABLE intent_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_select ON intent_workflows
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY org_isolation_insert ON intent_workflows
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY org_isolation_update ON intent_workflows
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_memberships
      WHERE user_id = auth.uid()
    )
  );
```

### 2.3 Data Contracts Between Steps

Each step has explicit input/output contracts:

| Step | Input | Output | Blocks |
|------|-------|--------|--------|
| 0 | Auth token, org_id | Validated session | All downstream |
| 1 | Org profile, goals | ICP document | Steps 2-9 |
| 2 | ICP, competitor URLs | Competitor profiles | Steps 3-9 |
| 3 | Competitor data, ICP | 3 seeds per competitor | Steps 4-9 |
| 4 | Approved seeds | Expanded keywords | Steps 5-9 |
| 5 | Full keyword list | Filtered keywords | Steps 6-9 |
| 6 | Filtered keywords | Hub-spoke clusters | Steps 7-9 |
| 7 | Clustered topics | Subtopic definitions | Step 8-9 |
| 8 | Subtopic list | Approval decision | Step 9 |
| 9 | Approved subtopics | Article IDs | Complete |

---

## 3. API Design

### 3.1 Workflow Endpoints

#### `POST /api/intent-workflows`
**Create a new intent workflow**

```typescript
Request {
  name: string
  organization_id: UUID
}

Response {
  id: UUID
  status: 'step_0_auth'
  created_at: ISO8601
}
```

**Gate Check:** User must be authenticated and member of organization.

#### `GET /api/intent-workflows/:id`
**Fetch workflow status and current step**

```typescript
Response {
  id: UUID
  status: 'step_X_name'
  steps: [
    {
      step_number: 0
      status: 'completed'
      output_data: {...}
      completed_at: ISO8601
    },
    ...
  ]
  current_step: {
    step_number: 1
    status: 'running'
    started_at: ISO8601
  }
  approval_status: 'pending' | 'approved' | 'rejected'
}
```

#### `POST /api/intent-workflows/:id/execute-step/:step_number`
**Manually trigger step execution**

```typescript
Request {
  input_data?: JSONB
  force_retry?: boolean
}

Response {
  step_id: UUID
  status: 'running' | 'completed' | 'blocked'
  blocked_reason?: string
  output_data?: JSONB
}
```

**Gate Check:** Verify all prerequisite steps are complete.

#### `POST /api/intent-workflows/:id/approve`
**Approve subtopics and proceed to article generation**

```typescript
Request {
  approval_type: 'subtopics'
  approved_items: UUID[]
  rejected_items: UUID[]
  feedback?: string
}

Response {
  workflow_id: UUID
  status: 'step_9_articles'
  articles_queued: number
}
```

**Gate Check:** Workflow must be at step 8 (approval). Only content managers can approve.

#### `POST /api/intent-workflows/:id/reject`
**Reject workflow and request revisions**

```typescript
Request {
  reason: string
  revision_step: number  // Which step to restart from
}

Response {
  workflow_id: UUID
  status: 'step_X_name'
  reset_reason: string
}
```

#### `GET /api/intent-workflows`
**List workflows for organization**

```typescript
Query {
  organization_id: UUID
  status?: string
  created_by?: UUID
  limit?: number
  offset?: number
}

Response {
  workflows: [...]
  total: number
  has_more: boolean
}
```

### 3.2 Gate Enforcement

Every endpoint that advances the workflow checks gates:

```typescript
// Pseudo-code for gate enforcement
function checkGates(workflowId: UUID, targetStep: number) {
  const workflow = await getWorkflow(workflowId)
  
  // Gate 1: ICP required for all downstream
  if (targetStep >= 2 && !workflow.icp_data) {
    throw new Error('ICP generation required before competitor analysis')
  }
  
  // Gate 2: Competitors required for seeds
  if (targetStep >= 3 && !workflow.competitor_data) {
    throw new Error('Competitor analysis required before seed keywords')
  }
  
  // Gate 3: Approved seeds required for longtails
  if (targetStep >= 4 && !workflow.seed_keywords_approved) {
    throw new Error('Seed keywords must be approved before longtail expansion')
  }
  
  // Gate 4: Longtails required for subtopics
  if (targetStep >= 7 && !workflow.longtail_keywords) {
    throw new Error('Longtail expansion required before subtopic generation')
  }
  
  // Gate 5: Approval required for articles
  if (targetStep >= 9 && !workflow.subtopics_approved) {
    throw new Error('Subtopics must be approved before article generation')
  }
  
  return true
}
```

---

## 4. Workflow Orchestration

### 4.1 Inngest Event Flow

The workflow uses Inngest for async orchestration:

```typescript
// Workflow definition
export const intentWorkflow = inngest.createFunction(
  { id: 'intent-workflow-orchestrator' },
  { event: 'intent.workflow.created' },
  async ({ event, step }) => {
    const workflowId = event.data.workflow_id
    
    // Step 0: Auth (synchronous)
    await step.run('step-0-auth', async () => {
      return validateAuth(workflowId)
    })
    
    // Step 1: ICP Generation
    await step.run('step-1-icp', async () => {
      return generateICP(workflowId)
    })
    
    // Step 2: Competitor Analysis
    await step.run('step-2-competitors', async () => {
      return analyzeCompetitors(workflowId)
    })
    
    // Step 3: Seed Keywords
    await step.run('step-3-seeds', async () => {
      return extractSeedKeywords(workflowId)
    })
    
    // Step 4: Longtail Expansion
    await step.run('step-4-longtails', async () => {
      return expandLongtails(workflowId)
    })
    
    // Step 5: Filtering
    await step.run('step-5-filtering', async () => {
      return filterKeywords(workflowId)
    })
    
    // Step 6: Clustering
    await step.run('step-6-clustering', async () => {
      return clusterTopics(workflowId)
    })
    
    // Step 7: Subtopic Generation
    await step.run('step-7-subtopics', async () => {
      return generateSubtopics(workflowId)
    })
    
    // Step 8: Wait for Approval (blocking)
    await step.waitForEvent('approval-decision', {
      timeout: '7d',
      match: `data.workflow_id == '${workflowId}'`
    })
    
    // Step 9: Article Generation
    await step.run('step-9-articles', async () => {
      return queueArticleGeneration(workflowId)
    })
    
    return { workflow_id: workflowId, status: 'completed' }
  }
)

// Approval event handler
export const approvalHandler = inngest.createFunction(
  { id: 'intent-approval-handler' },
  { event: 'intent.approval.submitted' },
  async ({ event }) => {
    const { workflow_id, decision, approved_items } = event.data
    
    if (decision === 'approved') {
      await inngest.send({
        name: 'approval-decision',
        data: { workflow_id, approved: true, items: approved_items }
      })
    } else {
      // Reject and reset workflow
      await resetWorkflow(workflow_id, event.data.revision_step)
    }
  }
)
```

### 4.2 Error Handling and Retries

```typescript
// Retry strategy per step
const retryConfig = {
  'step-1-icp': { max_retries: 2, backoff: 'exponential' },
  'step-2-competitors': { max_retries: 3, backoff: 'exponential' },
  'step-3-seeds': { max_retries: 1, backoff: 'linear' },
  'step-4-longtails': { max_retries: 3, backoff: 'exponential' },
  'step-5-filtering': { max_retries: 1, backoff: 'none' },
  'step-6-clustering': { max_retries: 2, backoff: 'exponential' },
  'step-7-subtopics': { max_retries: 2, backoff: 'exponential' },
}

// On failure
async function handleStepFailure(workflowId: UUID, stepNumber: number, error: Error) {
  const step = await getWorkflowStep(workflowId, stepNumber)
  
  if (step.retry_count < step.max_retries) {
    // Retry
    await updateStep(step.id, { 
      status: 'pending',
      retry_count: step.retry_count + 1
    })
    await logAudit(workflowId, 'step_retry', { step_number: stepNumber })
  } else {
    // Fail workflow
    await updateWorkflow(workflowId, { status: 'failed' })
    await logAudit(workflowId, 'workflow_failed', { 
      step_number: stepNumber,
      error: error.message 
    })
    // Notify content manager
    await notifyFailure(workflowId)
  }
}
```

---

## 5. External Service Integration

### 5.1 Perplexity API (ICP + Subtopics)

**Step 1: ICP Generation**
```typescript
async function generateICP(workflowId: UUID) {
  const org = await getOrganization(workflowId)
  
  const prompt = `
    Generate an Ideal Customer Profile (ICP) for:
    Company: ${org.name}
    Industry: ${org.industry}
    Goals: ${org.goals}
    
    Include:
    - Target industries
    - Buyer roles
    - Pain points
    - Value proposition
    - Buying signals
  `
  
  const response = await perplexity.chat.completions.create({
    model: 'sonar',
    messages: [{ role: 'user', content: prompt }]
  })
  
  return parseICPResponse(response.choices[0].message.content)
}
```

**Step 7: Subtopic Generation**
```typescript
async function generateSubtopics(workflowId: UUID) {
  const workflow = await getWorkflow(workflowId)
  const clusters = workflow.clustered_topics
  
  const subtopics = []
  for (const cluster of clusters) {
    const prompt = `
      For this hub topic: "${cluster.hub_keyword}"
      And these spoke keywords: ${cluster.spokes.join(', ')}
      
      Generate 3-5 distinct subtopic definitions that:
      - Each can be a standalone article
      - Cover different angles of the hub topic
      - Are distinct from each other
      - Align with this ICP: ${JSON.stringify(workflow.icp_data)}
    `
    
    const response = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }]
    })
    
    subtopics.push(...parseSubtopicResponse(response.choices[0].message.content))
  }
  
  return subtopics
}
```

### 5.2 DataForSEO API (Competitors + Keywords)

**Step 2: Competitor Analysis**
```typescript
async function analyzeCompetitors(workflowId: UUID) {
  const workflow = await getWorkflow(workflowId)
  const competitorUrls = workflow.competitor_urls
  
  const competitors = []
  for (const url of competitorUrls) {
    const response = await dataForSEO.domainAnalytics.getDomainKeywords({
      domain: extractDomain(url),
      limit: 100
    })
    
    competitors.push({
      url,
      keywords: response.keywords,
      traffic_volume: response.traffic_volume,
      top_pages: response.top_pages
    })
  }
  
  return competitors
}
```

**Step 3: Seed Keywords**
```typescript
async function extractSeedKeywords(workflowId: UUID) {
  const workflow = await getWorkflow(workflowId)
  const competitors = workflow.competitor_data
  
  const seeds = []
  for (const competitor of competitors) {
    // Get top 3 keywords by volume
    const topKeywords = competitor.keywords
      .sort((a, b) => b.search_volume - a.search_volume)
      .slice(0, 3)
    
    for (const kw of topKeywords) {
      // Validate against ICP
      if (isAlignedWithICP(kw.keyword, workflow.icp_data)) {
        seeds.push({
          keyword: kw.keyword,
          volume: kw.search_volume,
          difficulty: kw.keyword_difficulty,
          source_competitor: competitor.url
        })
      }
    }
  }
  
  return seeds
}
```

**Step 4: Longtail Expansion**
```typescript
async function expandLongtails(workflowId: UUID) {
  const workflow = await getWorkflow(workflowId)
  const seeds = workflow.seed_keywords
  
  const longtails = []
  
  for (const seed of seeds) {
    // Method 1: Related keywords
    const related = await dataForSEO.keywordResearch.getRelatedKeywords({
      keyword: seed.keyword
    })
    
    // Method 2: Keyword variations
    const variations = await dataForSEO.keywordResearch.getKeywordVariations({
      keyword: seed.keyword
    })
    
    // Method 3: Long-form variations
    const longForm = await dataForSEO.keywordResearch.getLongFormVariations({
      keyword: seed.keyword
    })
    
    // Method 4: Question keywords
    const questions = await dataForSEO.keywordResearch.getQuestionKeywords({
      keyword: seed.keyword
    })
    
    longtails.push(...related, ...variations, ...longForm, ...questions)
  }
  
  return deduplicateKeywords(longtails)
}
```

### 5.3 Existing Article Generation (Step 9)

```typescript
async function queueArticleGeneration(workflowId: UUID) {
  const workflow = await getWorkflow(workflowId)
  const approvedSubtopics = workflow.subtopics.filter(s => s.approved)
  
  const articleIds = []
  for (const subtopic of approvedSubtopics) {
    // Create article record
    const article = await createArticle({
      organization_id: workflow.organization_id,
      keyword: subtopic.keyword,
      intent_workflow_id: workflowId,
      status: 'queued'
    })
    
    // Queue Inngest event (reuse existing article generation pipeline)
    await inngest.send({
      name: 'article.generation.requested',
      data: {
        article_id: article.id,
        keyword: subtopic.keyword,
        intent_workflow_id: workflowId
      }
    })
    
    articleIds.push(article.id)
  }
  
  return { articles_queued: articleIds.length, article_ids: articleIds }
}
```

---

## 6. Feature Flag Implementation

### 6.1 Flag Definition

```typescript
// lib/features/intent-engine.ts
export const intentEngineFlag = {
  name: 'ENABLE_INTENT_ENGINE',
  description: 'Enable Primary Content Workflow (Intent Engine)',
  default: false,
  rollout: {
    type: 'gradual',
    initial_percentage: 0,
    increment_percentage: 10,
    increment_interval: '1 day'
  }
}
```

### 6.2 Usage in API Routes

```typescript
// app/api/articles/generate/route.ts
export async function POST(request: Request) {
  const { keyword, organization_id } = await request.json()
  
  const intentEngineEnabled = await isFeatureFlagEnabled(
    'ENABLE_INTENT_ENGINE',
    organization_id
  )
  
  if (intentEngineEnabled) {
    // New workflow
    return handleIntentWorkflow(keyword, organization_id)
  } else {
    // Legacy workflow
    return handleLegacyWorkflow(keyword, organization_id)
  }
}
```

### 6.3 Rollback Procedure

```
1. Set ENABLE_INTENT_ENGINE=false for all organizations
2. Wait 5 minutes for in-flight requests to complete
3. Monitor error rates (should return to baseline)
4. If issues: Investigate and fix
5. If stable: Keep flag disabled until root cause resolved
```

---

## 7. Deployment Strategy

### 7.1 Phase 1: Foundation (Week 1)
- Deploy database schema (new tables + RLS)
- Deploy API endpoints (all steps)
- Deploy Inngest workflow orchestration
- Deploy feature flag infrastructure
- **Flag Status:** DISABLED

### 7.2 Phase 2: Internal Testing (Week 2)
- Enable flag for internal team only
- Test all 9 steps end-to-end
- Verify gate enforcement
- Test error handling and retries
- **Flag Status:** ENABLED for internal org

### 7.3 Phase 3: Beta Rollout (Week 3)
- Enable flag for 10% of organizations
- Monitor error rates and performance
- Gather user feedback
- **Flag Status:** ENABLED for 10% (gradual rollout)

### 7.4 Phase 4: General Availability (Week 4)
- Enable flag for 100% of organizations
- Maintain legacy workflow as fallback
- Monitor production metrics
- **Flag Status:** ENABLED for all

---

## 8. Monitoring and Observability

### 8.1 Key Metrics

```typescript
// Workflow completion rate
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_workflows,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM intent_workflows
GROUP BY day
ORDER BY day DESC

// Step performance
SELECT 
  step_name,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failures
FROM intent_workflow_steps
GROUP BY step_name

// Approval rate
SELECT 
  approval_type,
  COUNT(CASE WHEN decision = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN decision = 'rejected' THEN 1 END) as rejected,
  ROUND(100.0 * COUNT(CASE WHEN decision = 'approved' THEN 1 END) / COUNT(*), 2) as approval_rate
FROM intent_approvals
GROUP BY approval_type
```

### 8.2 Alerting Rules

- **Workflow Failure Rate > 5%**: Alert engineering
- **Step Timeout (> 2x expected)**: Alert engineering
- **Approval Backlog > 10 workflows**: Alert content manager
- **Gate Violation Attempts > 100/hour**: Alert security

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

- All endpoints require valid JWT token
- Organization membership verified via RLS
- Approval actions restricted to content managers
- Audit log tracks all state changes

### 9.2 Data Isolation

- RLS policies enforce org-level isolation
- No cross-org data leakage possible
- Sensitive data (ICP, competitor analysis) encrypted at rest
- API responses filtered by organization

### 9.3 Audit Trail

Every action logged to `intent_audit_log`:
- Who performed the action
- What action was performed
- When it happened
- IP address and user agent
- Full context (workflow_id, step_number, etc.)

---

## 10. Scalability and Performance

### 10.1 Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_workflows_org_status ON intent_workflows(organization_id, status);
CREATE INDEX idx_workflows_created_by ON intent_workflows(created_by);
CREATE INDEX idx_steps_workflow_status ON intent_workflow_steps(workflow_id, status);
CREATE INDEX idx_approvals_workflow ON intent_approvals(workflow_id);
CREATE INDEX idx_audit_org_actor ON intent_audit_log(organization_id, actor_id);
```

### 10.2 Async Processing

- Long-running steps (ICP, competitors, subtopics) use Inngest
- No blocking HTTP requests
- Clients poll `/api/intent-workflows/:id` for status
- WebSocket support for real-time updates (future)

### 10.3 Rate Limiting

```typescript
// Per organization
- 10 concurrent workflows
- 100 workflows per day
- 1000 keywords per workflow
- 100 articles per workflow
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

- Gate enforcement logic
- Data validation
- Approval decision logic
- Error handling

### 11.2 Integration Tests

- Full workflow end-to-end
- External API mocking (Perplexity, DataForSEO)
- Database operations
- Inngest event flow

### 11.3 E2E Tests

- User journey: Create workflow → Approve → Generate articles
- Error scenarios: API failures, timeouts, invalid data
- Gate violations: Attempt to skip steps
- Rollback: Disable feature flag, verify legacy workflow

---

## 12. Rollback Plan

### 12.1 Immediate Rollback (< 5 minutes)

```bash
# Disable feature flag
UPDATE feature_flags SET enabled = false WHERE name = 'ENABLE_INTENT_ENGINE'

# Monitor error rates
# If errors return to baseline → rollback successful
# If errors persist → investigate root cause
```

### 12.2 Data Cleanup (if needed)

```sql
-- No cleanup required
-- New tables are isolated
-- Legacy tables untouched
-- Can re-enable flag at any time
```

### 12.3 Communication

- Notify all users of rollback
- Explain reason and ETA for fix
- Provide workaround (use legacy workflow)

---

## 13. Future Enhancements

### 13.1 Phase 2 (Post-Launch)

- WebSocket support for real-time workflow updates
- Batch workflow creation (multiple topics at once)
- Workflow templates (pre-configured ICP + competitors)
- Advanced analytics dashboard
- A/B testing framework for keyword strategies

### 13.2 Phase 3 (Long-term)

- Machine learning for keyword clustering
- Automated approval based on confidence scores
- Multi-language support
- Integration with external content calendars
- API for third-party tools

---

## 14. Architecture Decisions (ADRs)

### ADR-001: Separate Tables vs. Polymorphic

**Decision:** Create separate tables for each workflow component

**Rationale:**
- Clearer data model
- Easier to query and index
- Simpler RLS policies
- Better performance for large datasets

### ADR-002: Inngest for Orchestration

**Decision:** Use Inngest for workflow orchestration instead of custom state machine

**Rationale:**
- Built-in retry logic
- Event-driven architecture
- Scales horizontally
- Proven in production (existing article generation)

### ADR-003: Feature Flags for Rollout

**Decision:** Use feature flags instead of database migrations

**Rationale:**
- Zero-downtime deployment
- Instant rollback capability
- Gradual rollout to users
- No data migration risk

### ADR-004: Approval as Blocking Event

**Decision:** Use Inngest `waitForEvent` for approval gate

**Rationale:**
- Workflow pauses until approval
- No polling required
- Timeout handling built-in
- Clean separation of concerns

---

## 15. Success Criteria

### 15.1 Technical

- ✅ All 9 steps execute without errors
- ✅ Gates block illegal transitions
- ✅ Approval workflow functions correctly
- ✅ 99.9% uptime for workflow dashboard
- ✅ All steps retryable without data loss
- ✅ Rollback time < 5 minutes

### 15.2 Operational

- ✅ Zero impact on legacy article generation
- ✅ Feature flag enables gradual rollout
- ✅ Audit trail complete and accessible
- ✅ Error handling and monitoring in place

### 15.3 User Experience

- ✅ Status dashboard shows real-time progress
- ✅ Approval/rejection takes < 2 minutes
- ✅ Users understand why steps are blocked
- ✅ Clear error messages on failures

---

## Appendix A: API Request/Response Examples

### Example 1: Create Workflow

```bash
curl -X POST https://api.infin8content.com/api/intent-workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2026 Content Initiative",
    "organization_id": "org_123"
  }'

# Response
{
  "id": "workflow_abc123",
  "status": "step_0_auth",
  "created_at": "2026-01-30T12:00:00Z"
}
```

### Example 2: Check Workflow Status

```bash
curl https://api.infin8content.com/api/intent-workflows/workflow_abc123 \
  -H "Authorization: Bearer $TOKEN"

# Response
{
  "id": "workflow_abc123",
  "status": "step_7_subtopics",
  "steps": [
    {
      "step_number": 0,
      "status": "completed",
      "completed_at": "2026-01-30T12:00:30Z"
    },
    {
      "step_number": 1,
      "status": "completed",
      "output_data": { "icp": "..." },
      "completed_at": "2026-01-30T12:05:00Z"
    },
    ...
    {
      "step_number": 7,
      "status": "running",
      "started_at": "2026-01-30T12:45:00Z"
    }
  ],
  "approval_status": "pending"
}
```

### Example 3: Approve Subtopics

```bash
curl -X POST https://api.infin8content.com/api/intent-workflows/workflow_abc123/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approval_type": "subtopics",
    "approved_items": ["subtopic_1", "subtopic_2", "subtopic_3"],
    "rejected_items": ["subtopic_4"],
    "feedback": "Great work! These align perfectly with our Q1 strategy."
  }'

# Response
{
  "workflow_id": "workflow_abc123",
  "status": "step_9_articles",
  "articles_queued": 3
}
```

---

**Document Status:** READY FOR IMPLEMENTATION  
**Next Steps:** Implementation Readiness Review, Sprint Planning, Engineering Execution
