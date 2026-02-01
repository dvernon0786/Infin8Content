## Story Context: 37-2-review-and-approve-subtopics-before-article-generation

**Status**: review

**Epic**: 37 – Content Topic Generation & Approval

**User Story**: As a content manager, I want to review generated subtopics for a longtail keyword and approve or reject them, so that only approved topics are eligible for article generation.

**Story Classification**:
- Type: Governance / Control (Human-in-the-loop approval gate)
- Tier: Tier 1 (critical quality control gate)

**Business Intent**: Introduce a mandatory human approval gate at the keyword level, ensuring that subtopics generated for longtail keywords are reviewed before article generation, maintaining editorial control without modifying workflow state.

**Contracts Required**:
- C1: POST /api/keywords/{keyword_id}/approve-subtopics endpoint
- C2/C4/C5: keywords table (read subtopics, write article_status), intent_approvals table (approval persistence)
- Terminal State: None (authorization gate, not workflow-advancing step)
- UI Boundary: No UI events (backend only)
- Analytics: keyword.subtopics.approved/rejected audit events

**Contracts Modified**: None (new endpoint only, uses existing intent_approvals table)

**Contracts Guaranteed**:
- ✅ Idempotent approval (one record per keyword + approval_type)
- ✅ Partial approval supported (approve/reject entire subtopic batch)
- ✅ Complete audit trail with user + timestamp
- ✅ No workflow state mutation (keyword-level only)
- ✅ Retry rules: Not applicable (synchronous operation)
- ✅ No UI events emitted (backend governance only)

**Producer Dependency Check**:
- Story 37.1 (Subtopic Generation): COMPLETED ✅
- keywords.subtopics_status = 'complete' ✅
- longtail_keyword IS NOT NULL ✅
- Subtopics exist in keywords.subtopics JSONB field ✅
- Organization isolation available ✅
- Blocking Decision: ALLOWED

**Acceptance Criteria**:
1. Given a keyword with generated subtopics (subtopics_status = 'complete')
   When I submit an approval decision via POST /api/keywords/{keyword_id}/approve-subtopics
   Then an approval record is created in intent_approvals table

2. And if approved
   Then keywords.article_status = 'ready'
   And the keyword becomes eligible for article generation

3. And if rejected
   Then keywords.article_status = 'not_started'
   And the keyword remains blocked from article generation

4. And the decision is auditable with user ID, timestamp, and optional feedback

5. And no workflow state is changed (keyword-level approval only)

6. And the approval is idempotent (re-approval overwrites prior decision)

**Technical Requirements**:
- API Endpoint: POST /api/keywords/{keyword_id}/approve-subtopics
- Authentication: Required (admin access only)
- Request Body: { decision: 'approved' | 'rejected', feedback?: string }
- Database: Uses existing intent_approvals table with entity_type='keyword'
- Validation: Keyword must belong to same organization, subtopics_status must be 'complete'
- Audit Logging: Full audit trail with user, timestamp, decision, and feedback
- Error Handling: Proper validation and error responses for invalid requests

**Data Model Interaction**:
- Read: keywords table (id, organization_id, longtail_keyword, subtopics, subtopics_status, article_status)
- Write: intent_approvals table (approval record), keywords.article_status field, keywords.updated_at
- No other tables are mutated

**Dependencies**:
- Story 37.1 (Subtopic Generation) - COMPLETED ✅
- Existing intent_approvals table structure
- Authentication and authorization infrastructure
- Keywords table with subtopics JSONB field
- Audit logging infrastructure

**Priority**: High
**Story Points**: 8
**Target Sprint**: Current sprint

**Implementation Notes**:
- Follows same governance pattern as Story 35.3 (Seed Approval)
- Keyword-level approval (not workflow-level)
- Uses existing intent_approvals table with entity_type='keyword'
- Updates keywords.article_status (not workflow state)
- No partial subtopic approval (MVP: approve/reject entire batch)
- Comprehensive audit logging for compliance
- Full test coverage for all approval scenarios

**Files to be Created**:
- `lib/services/keyword-engine/subtopic-approval-processor.ts`
- `app/api/keywords/[keyword_id]/approve-subtopics/route.ts`
- `__tests__/services/keyword-engine/subtopic-approval-processor.test.ts`
- `__tests__/api/keywords/approve-subtopics.test.ts`

**Files to be Modified**:
- `types/audit.ts` (add subtopic approval audit actions)

**Out of Scope**:
- Workflow state changes
- Partial subtopic approval (per-item approval)
- Article generation (this is approval only)
- Research or planning workflows
- Perplexity usage
- UI events or dashboard updates
- Subtopic editing or modification

**Architecture Guardrails**:
- Follow keyword engine pattern (separate from workflow engine)
- Respect organization isolation (RLS)
- No workflow state mutation
- No UI events emitted (backend governance only)
- Use existing approval infrastructure (intent_approvals table)
- Maintain audit trail compliance

**Testing Strategy**:
- Unit tests for approval processor service
- Integration tests for API endpoint
- Approval scenarios (approved → ready status)
- Rejection scenarios (rejected → not_started status)
- Idempotency tests (re-approval overwrites)
- Security tests (auth, org isolation, validation)
- Error handling tests (invalid requests, missing data)

## Tasks / Subtasks

- [x] Task 1: Create subtopic approval processor service (AC: #1, #2, #3, #4)
  - [x] Subtask 1.1: Implement SubtopicApprovalRequest interface
  - [x] Subtask 1.2: Implement processSubtopicApproval function
  - [x] Subtask 1.3: Implement areSubtopicsApproved check function
  - [x] Subtask 1.4: Implement getApprovedKeywordIds function
- [x] Task 2: Create API endpoint for subtopic approval (AC: #1, #2, #3, #4)
  - [x] Subtask 2.1: Create route.ts file at /api/keywords/[keyword_id]/approve-subtopics
  - [x] Subtask 2.2: Implement request validation and error handling
  - [x] Subtask 2.3: Integrate with approval processor service
- [x] Task 3: Add audit logging for subtopic approvals (AC: #4)
  - [x] Subtask 3.1: Add new audit actions to types/audit.ts
  - [x] Subtask 3.2: Integrate audit logging in approval processor
- [x] Task 4: Create comprehensive test coverage (All ACs)
  - [x] Subtask 4.1: Unit tests for approval processor service
  - [x] Subtask 4.2: Integration tests for API endpoint
  - [x] Subtask 4.3: Test approval scenarios
  - [x] Subtask 4.4: Test rejection scenarios

## Dev Notes

### Story Classification

* **Type**: Governance / Control (Human-in-the-loop approval gate)
* **Pattern**: Keyword-level approval (not workflow-level)
* **Scope**: One longtail keyword per approval action
* **Tier**: Tier 1 (critical quality control gate)

### Business Intent

Introduce a **mandatory human approval gate at the keyword level**, ensuring that:
* Subtopics generated for a **longtail keyword** are reviewed
* Only approved keywords can proceed to article generation
* Editorial control is enforced without modifying workflow state

This story **does not generate content** and **does not advance workflows**.

### Explicit Architecture Decision (Locked)

* ✅ **Approval scope**: `keywords` table (longtail keyword rows)
* ✅ **Subtopics source**: `keywords.subtopics` (JSONB)
* ❌ **No workflow.subtopics**
* ❌ **No subtopic IDs (MVP)**

Approval is **keyword-scoped**, not workflow-scoped.

### Producer Dependency Check

* Story 37.1 (Subtopic Generation): COMPLETED ✅
* `keywords.subtopics_status = 'complete'` ✅
* `longtail_keyword IS NOT NULL` ✅
* Subtopics exist in `keywords.subtopics` ✅

**Blocking Decision**: **ALLOWED**

### API Contract

#### Endpoint

```
POST /api/keywords/{keyword_id}/approve-subtopics
```

#### Request Body (MVP)

```ts
{
  decision: 'approved' | 'rejected',
  feedback?: string
}
```

### Data Model Interaction

#### Read

* `keywords` 
  * `id` 
  * `organization_id` 
  * `longtail_keyword` 
  * `subtopics` 
  * `subtopics_status` 
  * `article_status` 

#### Write

* `intent_approvals` 
* `keywords.article_status` 
* `keywords.updated_at` 

### Approval Effects (Authoritative)

#### If **approved**

```sql
keywords.article_status = 'ready'
```

Meaning:
* Keyword is now eligible for article generation
* Subtopics are implicitly approved

#### If **rejected**

```sql
keywords.article_status = 'not_started'
```

Optional (future toggle):

```sql
keywords.subtopics_status = 'not_started'
```

Meaning:
* Keyword is blocked from article generation
* Subtopics must be regenerated or edited

### Audit Logging

Create record in `intent_approvals`:

```json
{
  "approval_type": "subtopics",
  "entity_type": "keyword",
  "entity_id": "<keyword_id>",
  "decision": "approved | rejected",
  "feedback": "...",
  "approved_by": "<user_id>",
  "approved_at": "<timestamp>"
}
```

### Idempotency Rules

* One approval record per: `keyword_id + approval_type`
* Re-approval overwrites prior decision
* No duplicate approvals allowed

### Architecture Compliance

**Follow existing patterns from Story 35.3 (Seed Approval)**:
- Use same intent_approvals table structure
- Follow same governance gate pattern (no workflow state change)
- Use same authentication/authorization patterns
- Follow same audit logging patterns

**Key differences from seed approval**:
- Approval type: 'subtopics' instead of 'seed_keywords'
- Data source: keywords.subtopics field instead of keywords table rows
- Approval scope: Individual keyword instead of workflow
- Entity type: 'keyword' instead of 'workflow'

### Technical Requirements

**API Endpoint**: POST /api/keywords/{keyword_id}/approve-subtopics
**Authentication**: Required (admin access only)
**Request Body**:
```typescript
{
  decision: 'approved' | 'rejected',
  feedback?: string
}
```

**Database Schema**: Uses existing intent_approvals table with new entity_type
```sql
-- approval_type values: 'seed_keywords', 'longtails', 'subtopics'
-- entity_type values: 'workflow', 'keyword'
-- entity_id: workflow_id or keyword_id
```

**Keyword State**: Updates keywords.article_status (not workflow state)

### Integration Points

**With Story 37.1**: Reads subtopics from keywords.subtopics field
**With Article Generation**: Keywords with article_status='ready' are eligible
**With intent_approvals table**: Uses same table with entity_type='keyword'
**With audit logging**: Uses same audit infrastructure

### Security & Validation

* Authentication required
* Admin access required
* Keyword must belong to same organization
* `subtopics_status` must be `complete` 

### File Structure

```
lib/services/keyword-engine/
├── subtopic-approval-processor.ts

app/api/keywords/[keyword_id]/approve-subtopics/
└── route.ts

__tests__/
├── services/keyword-engine/subtopic-approval-processor.test.ts
└── api/keywords/approve-subtopics.test.ts
```

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Follows keyword engine pattern (separate from workflow engine)
- Uses existing intent_approvals table with entity_type='keyword'
- Maintains keyword-level isolation (no workflow coupling)

### References

- [Source: infin8content/lib/services/intent-engine/seed-approval-processor.ts] - Seed approval pattern
- [Source: infin8content/supabase/migrations/20260201_add_intent_approvals_table.sql] - Approval table schema
- [Source: infin8content/types/keyword.ts] - Keyword type definitions
- [Source: _bmad-output/implementation-artifacts/tech-spec-37-2-review-and-approve-subtopics-before-article-generation.md] - Technical specification

## Dev Agent Record

### Agent Model Used

Cascade (Penguin Alpha) - Advanced reasoning and code generation

### Debug Log References

None - Implementation phase

### Completion Notes List

- ✅ Task 1: Created subtopic approval processor service with full governance logic
- ✅ Task 2: Implemented POST /api/keywords/[keyword_id]/approve-subtopics endpoint
- ✅ Task 3: Added KEYWORD_SUBTOPICS_APPROVED/REJECTED audit actions
- ✅ Task 4: Created comprehensive test coverage (27 tests passing)
- ✅ Implementation follows Story 35.3 seed approval governance pattern
- ✅ Uses existing intent_approvals table with entity_type='keyword'
- ✅ Updates keywords.article_status (not workflow state)
- ✅ Full audit logging with IP, user agent, and feedback
- ✅ All acceptance criteria implemented and tested

### File List

**New Files (4)**:
- `lib/services/keyword-engine/subtopic-approval-processor.ts`
- `app/api/keywords/[keyword_id]/approve-subtopics/route.ts`
- `__tests__/services/keyword-engine/subtopic-approval-processor.test.ts`
- `__tests__/api/keywords/approve-subtopics.test.ts`

**Modified Files (1)**:
- `types/audit.ts` (add subtopic approval audit actions)
