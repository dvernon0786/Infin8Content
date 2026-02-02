## Story Context: 38-1-queue-approved-subtopics-for-article-generation

**Status**: done

**Epic**: 38 – Article Generation & Workflow Completion

**User Story**: As a system, I want to automatically queue approved subtopics for article generation, so that validated intent seamlessly transitions into structured content production.

**Story Classification**:
- Type: Producer (article generation initialization processor)
- Tier: Tier 1 (foundational production handoff)

**Business Intent**: Initialize the article generation pipeline for all approved subtopics by creating article records, preserving full intent and approval context, triggering deterministic downstream agents (Planner → Research → Writer), and advancing the workflow into production mode. This story does not generate content—it initializes and orchestrates production.

**Contracts Required**:
- C1: POST /api/intent/workflows/{workflow_id}/steps/queue-articles endpoint
- C2/C4/C5: keywords table (read approved subtopics), articles table (write new records), intent_workflows table (update status)
- Terminal State: intent_workflows.status = 'step_9_articles', articles created and queued for generation
- UI Boundary: Backend only, no UI events emitted
- Analytics: workflow.article_queuing.started/completed audit events

**Contracts Modified**: None (new endpoint only)

**Contracts Guaranteed**:
- ✅ No UI events emitted
- ✅ No intermediate analytics (only terminal state)
- ✅ No state mutation outside producer boundary
- ✅ Idempotent (re-runs skip existing articles, no duplicates)
- ✅ Retry-safe (3 attempts with exponential backoff: 2s, 4s, 8s)

**Producer Dependency Check**:
- Epic 34 (ICP & Competitor Analysis): COMPLETED ✅
- Epic 35 (Keyword Research & Expansion): COMPLETED ✅
- Epic 36 (Keyword Refinement & Topic Clustering): COMPLETED ✅
- Epic 37 (Content Topic Generation & Approval): COMPLETED ✅
- Approved keywords exist with article_status = 'ready' ✅
- Workflow status is step_8_approval ✅
- Organization context available ✅

**Blocking Decision**: ALLOWED

**Acceptance Criteria**:

1. Given subtopics are approved with article_status = 'ready'
   When the workflow proceeds to article generation
   Then article records are created for each approved subtopic

2. And each article:
   - Is linked to intent_workflow_id
   - Is created with status = 'queued'
   - Contains full intent context (subtopic_data, cluster_info, icp_context, competitor_context)
   - Has article_structure field ready for Planner output

3. And the Planner Agent is triggered for each article via Inngest event (article.generate.planner)

4. And Planner output is persisted to articles.article_structure (JSONB)

5. And the workflow status updates to step_9_articles

6. And article queuing completes within 5 minutes

7. And failed articles remain retryable without blocking other articles

**Technical Requirements**:

**API Endpoint**:
```
POST /api/intent/workflows/{workflow_id}/steps/queue-articles
```
- Authentication required
- Workflow must be at step_8_approval
- Approved keywords must exist (article_status = 'ready')

**Database Operations**:

*Read*:
- keywords table where:
  - article_status = 'ready'
  - organization_id matches workflow
  - subtopics_status = 'complete'

*Write*:
- articles table:
  - One record per approved subtopic
  - status = 'queued'
  - intent_workflow_id linked
  - All context fields populated

*Update*:
- intent_workflows.status = 'step_9_articles'

**Article Record Structure**:
Each article record must include:
- intent_workflow_id (UUID, foreign key to intent_workflows)
- keyword_id (UUID, foreign key to keywords)
- subtopic_data (JSONB: keyword, subtopics array)
- cluster_info (JSONB: hub_keyword_id, spoke_keywords)
- icp_context (JSONB: target_audience, pain_points, goals)
- competitor_context (JSONB: competitor_urls, seed_keywords)
- article_structure (JSONB: Planner output, null initially)
- status = 'queued'
- created_at, updated_at timestamps

**Planner Agent Integration**:

*Execution*:
- Emit article.generate.planner Inngest event per article
- Planner executes asynchronously (non-blocking)

*Responsibility*:
- Generate deterministic article_structure JSON
- Define section hierarchy (H1, H2, H3)
- Enforce content depth and section planning
- Provide research questions per section
- Return structure suitable for Research Agent

*Persistence*:
- Store output in articles.article_structure
- Update articles.updated_at on completion

**Error Handling**:
- Partial failures do not block other articles
- Failed article creation is retried (3 attempts)
- Failed Planner executions are retried via Inngest
- Failed articles remain retryable without workflow rollback
- Successful articles are never rolled back

**Performance Constraints**:
- Up to 50 articles per workflow
- Article creation <5 seconds per item
- Planner execution async via Inngest (non-blocking)
- No blocking on downstream agents (Research, Writer)
- Total step execution <5 minutes

**Database Schema Changes**:

```sql
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS intent_workflow_id UUID REFERENCES intent_workflows(id),
ADD COLUMN IF NOT EXISTS keyword_id UUID REFERENCES keywords(id),
ADD COLUMN IF NOT EXISTS subtopic_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cluster_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS icp_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS article_structure JSONB;

CREATE INDEX IF NOT EXISTS idx_articles_intent_workflow_id ON articles(intent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_articles_intent_workflow_status ON articles(intent_workflow_id, status);
CREATE INDEX IF NOT EXISTS idx_articles_keyword_id ON articles(keyword_id);
```

**Dependencies**:
- Epic 34 (ICP & Competitor Analysis) - COMPLETED ✅
- Epic 35 (Keyword Research & Expansion) - COMPLETED ✅
- Epic 36 (Keyword Refinement & Topic Clustering) - COMPLETED ✅
- Epic 37 (Content Topic Generation & Approval) - COMPLETED ✅
- Inngest event infrastructure (article.generate.planner)
- Planner Agent service (separate story, Epic 39)
- Organization context and RLS policies

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Follows same producer pattern as previous Intent Engine stories (34.2, 35.1, 36.1, 36.2, 37.1, 37.2)
- Uses existing Inngest infrastructure for async Planner execution
- Maintains normalized data model (no JSON storage in workflow)
- Implements proper error handling with partial success support
- Idempotent: re-running skips existing articles, no duplicates
- Preserves full audit trail via intent_workflows and articles tables
- Planner is mandatory first-stage agent (enforced by Inngest)

**Files to be Created**:
- `lib/services/intent-engine/article-queuing-processor.ts`
- `app/api/intent/workflows/[workflow_id]/steps/queue-articles/route.ts`
- `__tests__/services/intent-engine/article-queuing-processor.test.ts`
- `__tests__/api/intent/workflows/queue-articles.test.ts`

**Files to be Modified**:
- `types/audit.ts` (add article queuing audit actions)
- `docs/api-contracts.md` (add endpoint documentation)
- `docs/development-guide.md` (add workflow state transitions)
- `accessible-artifacts/sprint-status.yaml` (update story status)

**Out of Scope**:
- Research execution (Story 39.1)
- Content writing (Story 39.2)
- Publishing (Epic 5)
- UI dashboards
- Quality scoring
- Planner Agent implementation (separate story)

**Architecture Guardrails**:
- Follow Intent Engine producer pattern (established by Stories 34.2, 35.1, 36.1, 36.2, 37.1, 37.2)
- Respect organization isolation (RLS)
- No UI events emitted (backend governance only)
- No editorial logic introduced
- Planner is first-class mandatory agent (not optional)
- Preserve auditability (full context in article records)

**Explicit Architecture Decisions (Locked)**:
- ✅ Article generation is multi-stage (Planner → Research → Writer)
- ✅ Planner Agent executes first and is mandatory
- ✅ Planner output is persisted in articles.article_structure
- ✅ Inngest orchestrates agent execution
- ❌ No content generation occurs in this story
- ❌ No UI events are emitted

**Testing Strategy**:
- Unit tests for article-queuing-processor service
- Integration tests for API endpoint
- Approved/queued article scenarios
- Idempotency tests (re-running skips existing)
- Error handling tests (partial failures)
- Planner event emission tests
- Security tests (auth, organization isolation)
- Performance tests (bulk article creation)

**Blocking Decision**: ALLOWED

All dependencies met, contracts verified, story ready for development.

**Next Steps**: Story is ready-for-dev and can be picked up by development team.
