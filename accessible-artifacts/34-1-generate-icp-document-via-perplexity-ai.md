# Story 34.1: Generate ICP Document via Perplexity AI

**Status**: done

## Story Classification

- **Type**: Producer
- **Epic**: Epic 34 - Intent Validation - ICP & Competitive Analysis
- **Tier**: 1

## Business Intent

Generate an ICP document using AI based on organization profile to establish clear target audience definition before content planning.

## Story

As a content manager,
I want to generate an ICP document using AI based on my organization's profile,
So that I have a clear definition of my target audience before planning content.

## Contracts Required

- **Domain Contract (C1)**: ICPData structure with industries, buyerRoles, painPoints, valueProposition fields
- **System Contract (C2/C4/C5)**: Workflow state machine (intent_workflows table), OpenRouter API integration
- **Terminal State Semantics**: Workflow status transitions to 'step_1_icp' with step_1_icp_completed_at timestamp
- **Analytics Emission**: Terminal state only (workflow_step_completed event on success)

## Contracts Modified

- None (foundational story, no existing contracts modified)

## Contracts Guaranteed

- ✅ No UI event emission (backend-only workflow step)
- ✅ No intermediate analytics (terminal state only)
- ✅ No state mutation outside producer boundary (workflow state isolated)
- ✅ Idempotency: Workflow lookup before generation prevents duplicates
- ✅ Retry rules: Exponential backoff with max 2 attempts on failure

## Producer Dependency Check

- **Producer Epic(s)**: Epic 33 - Workflow Foundation & Organization Setup
- **Status**: Completed ✅
  - Story 33.1: Create Intent Workflow with Organization Context
  - Story 33.2: Configure Organization ICP Settings
- **Blocking Decision**: ALLOWED (all producer dependencies met)

## Acceptance Criteria

**Given** I have created an intent workflow and configured organization settings  
**When** I trigger ICP generation (Step 1)  
**Then** the system calls Perplexity API with organization profile data  
**And** the ICP generation completes within 5 minutes  
**And** the generated ICP includes industries, buyer roles, pain points, and value proposition  
**And** the ICP is stored in the workflow's icp_data field  
**And** the workflow status updates to 'step_1_icp'  
**And** the step is marked as completed with timestamp

## Tasks / Subtasks

- [x] Task 1: Set up OpenRouter Perplexity integration (AC: 1, 2)
  - [x] Subtask 1.1: Verify OpenRouter API credentials in environment variables
  - [x] Subtask 1.2: Create ICP generator service using existing OpenRouter client
  - [x] Subtask 1.3: Implement API call timeout and retry logic with exponential backoff
- [x] Task 2: Create ICP generation workflow step (AC: 1, 3, 4, 5)
  - [x] Subtask 2.1: Design ICP data structure and database schema
  - [x] Subtask 2.2: Implement ICP generation API endpoint
  - [x] Subtask 2.3: Create workflow state management for step transitions
- [x] Task 3: Implement organization profile data preparation (AC: 1, 4)
  - [x] Subtask 3.1: Extract organization settings from database
  - [x] Subtask 3.2: Format profile data for Perplexity API consumption
  - [x] Subtask 3.3: Add data validation and sanitization
- [x] Task 4: Add comprehensive error handling and monitoring (AC: 2, 6, 7)
  - [x] Subtask 4.1: Implement failure detection and user notifications
  - [x] Subtask 4.2: Add performance monitoring and timeout tracking
  - [x] Subtask 4.3: Create audit logging for ICP generation attempts

## Dev Notes

### Project Structure Notes

This story follows the established Intent Engine workflow pattern from Epic 33 and integrates with the existing workflow orchestration system.

- **Database Schema**: Uses existing `intent_workflows` table with new `icp_data` JSONB field
- **API Pattern**: Follows existing workflow step API patterns from `/api/intent/workflows/*`
- **Error Handling**: Consistent with existing workflow error handling patterns
- **State Management**: Integrates with existing workflow state machine

### Architecture Compliance

**Technical Stack Requirements:**
- Next.js 16 API routes for workflow endpoints
- Supabase for workflow state and data storage
- TypeScript strict mode compliance
- Existing authentication patterns (`getCurrentUser()`)

**Code Structure Requirements:**
- Services in `lib/services/intent-engine/` directory
- API routes in `app/api/intent/` directory  
- Database migrations in `supabase/migrations/`
- Following established naming conventions

**API Patterns:**
- POST `/api/intent/workflows/{workflow_id}/steps/icp-generate`
- Response format consistent with existing workflow step responses
- Error handling follows existing API error patterns

### Database Schema Requirements

**New Field Addition:**
```sql
ALTER TABLE intent_workflows 
ADD COLUMN icp_data JSONB,
ADD COLUMN step_1_icp_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN step_1_icp_error_message TEXT;
```

**ICP Data Structure:**
```typescript
interface ICPData {
  industries: string[];
  buyerRoles: string[];
  painPoints: string[];
  valueProposition: string;
  generatedAt: string;
  apiVersion: string;
}
```

### External API Integration

**OpenRouter Perplexity Integration:**
- API endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Authentication: Bearer token (OpenRouter API key) from environment variables
- Model: `perplexity/llama-3.1-sonar-small-128k-online` via OpenRouter
- Timeout: 5 minutes maximum
- Retry logic: 2 attempts with exponential backoff
- Cost tracking: Integrated with existing OpenRouter cost tracking system

**Request Structure:**
```typescript
interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}
```

**System Prompt:**
```
## Role
You are an expert Business Intelligence Analyst specializing in creating comprehensive Ideal Customer Profile (ICP) analyses.
Your purpose is to research and analyze companies to develop detailed customer personas, pain points, and market positioning insights for strategic business development.

## Constraints
- Must research all three provided inputs (company name, URL, LinkedIn URL) thoroughly
- Generate specific, actionable ICP insights rather than generic business descriptions
- Focus on B2B customer characteristics and pain points
- Ensure all sections are completed with detailed, research-backed information
- Maintain professional business analysis tone throughout
- Base conclusions on actual company data found through research
- If insufficient data is found, clearly indicate limitations and provide best estimates
- Do not make assumptions about company operations without supporting evidence
```

**User Prompt Template:**
```
## Inputs
- **Company Name** (required): {{organization_name}}
- **Company URL** (required): {{organization_url}}
- **Company LinkedIn URL** (required): {{organization_linkedin_url}}

## Instructions

### Research Phase:
1. Search for comprehensive company information using the company name and URL
2. Analyze the company's website to understand their products, services, and target market
3. Research the company's LinkedIn presence for additional business insights
4. Gather information about company size, industry, and business model
5. Identify key stakeholders and decision-makers from available sources

### Analysis Phase:
1. Synthesize research findings to create detailed ICP components
2. Develop specific product/service descriptions based on actual offerings
3. Identify target customer segments based on company positioning
4. Analyze market challenges the company's customers likely face
5. Determine customer objectives and current solution approaches

### Output Generation:
Generate a comprehensive ICP analysis with the following five sections:

1. **Product Description**
   - Detailed explanation of the company's core product or service offering
   - Key features and benefits that differentiate the solution
   - Implementation approach and delivery method
   - Target use cases and applications

2. **Who are the ICP?**
   - Specific business characteristics (size, revenue, industry)
   - Geographic and operational details
   - Key decision-maker roles and demographics
   - Organizational structure and team composition

3. **Pain Points / Challenges**
   - Primary operational challenges faced by target customers
   - Technical or process limitations in current state
   - Resource constraints and capability gaps
   - Market or competitive pressures affecting the business

4. **Key Goals / Objectives**
   - Strategic business objectives driving purchasing decisions
   - Operational improvements sought by target customers
   - Performance metrics and success criteria
   - Growth and scaling aspirations

5. **How do they currently solve their problems?**
   - Existing tools, systems, and processes in use
   - Workarounds and manual solutions currently employed
   - Current solution limitations and gaps

## Error Handling
- If company information is limited or unclear, indicate data limitations and provide analysis based on available information
- If the company URL is inaccessible, focus research on company name and LinkedIn data
- If LinkedIn URL provides minimal information, supplement with additional web searches
- If the company operates in an unfamiliar industry, research industry standards and common practices
- If conflicting information is found across sources, prioritize the most recent and authoritative data
- If the company appears to serve multiple market segments, identify the primary ICP and note secondary segments
```

**Integration Notes:**
- Reuse existing OpenRouter client from `lib/services/openrouter/openrouter-client.ts`
- Follow established patterns from article generation system (Story 4-5)
- API costs tracked in existing cost management system
- Error handling consistent with existing OpenRouter integration
- Organization data variables populated from `intent_workflows` table configuration

### File Structure Requirements

**New Files to Create:**
- `lib/services/intent-engine/icp-generator.ts` - Business logic for ICP generation
- `app/api/intent/workflows/[workflow_id]/steps/icp-generate/route.ts` - API endpoint
- `supabase/migrations/20260131_add_icp_fields.sql` - Database migration

**Existing Files to Modify:**
- `types/intent-workflow.ts` - Add ICP data types
- `lib/services/intent-engine/workflow-manager.ts` - Add ICP step handling
- `lib/services/openrouter/openrouter-client.ts` - Already exists, reuse for ICP generation

### Testing Requirements

**Unit Tests:**
- Perplexity client service with mocked API responses
- ICP generator business logic
- Database schema validation
- Error handling scenarios

**Integration Tests:**
- End-to-end workflow step execution
- API endpoint with authentication
- Database state transitions
- Performance timeout handling

**Test Coverage:**
- Minimum 95% coverage for new code
- All error paths tested
- Performance benchmarks for 5-minute timeout

### Security Requirements

**Data Protection:**
- Organization profile data sanitization before API call
- No PII sent to external APIs
- Audit logging for all ICP generation attempts
- Rate limiting per organization

**API Security:**
- OpenRouter API key stored in environment variables (OPENROUTER_API_KEY)
- Request validation and sanitization before sending to OpenRouter
- Response validation and error handling
- Cost tracking integration with existing system

### Performance Requirements

**Response Time:**
- ICP generation must complete within 5 minutes
- API response time under 30 seconds for workflow status
- Database query optimization for workflow state

**Scalability:**
- Support concurrent ICP generation for multiple organizations
- Efficient database connection pooling
- Memory management for large organization profiles

### References

- [Source: Epic 33 workflow foundation](../accessible-artifacts/epics.md#Epic-33)
- [Source: Existing intent workflow API](app/api/intent/workflows/route.ts)
- [Source: OpenRouter client implementation](lib/services/openrouter/openrouter-client.ts)
- [Source: Article generation with OpenRouter](app/api/articles/generate/route.ts)
- [Source: Database schema patterns](supabase/migrations/20260114000000_add_activities_table.sql)
- [Source: Authentication patterns](lib/supabase/get-current-user.ts)

## Dev Agent Record

### Agent Model Used

Cascade SWE-1.5 (January 2026)

### Debug Log References

- ICP generator service created with full OpenRouter Perplexity integration
- API endpoint implemented with authentication and workflow state validation
- Database migration created for ICP data fields
- Comprehensive unit and integration tests written
- Error handling and monitoring implemented throughout

### Completion Notes List

- ✅ Task 1: OpenRouter Perplexity integration complete
  - ICP generator service created in `lib/services/intent-engine/icp-generator.ts`
  - Reuses existing OpenRouter client with Perplexity model
  - Implements 5-minute timeout and 2-attempt retry logic with exponential backoff
  - Full validation of ICP data structure (industries, buyerRoles, painPoints, valueProposition)

- ✅ Task 2: ICP generation workflow step complete
  - API endpoint created at `app/api/intent/workflows/[workflow_id]/steps/icp-generate/route.ts`
  - Workflow state management implemented (step_0_auth → step_1_icp)
  - Database schema extended with icp_data JSONB field and completion timestamp
  - Proper error handling with step_1_icp_error_message field

- ✅ Task 3: Organization profile data preparation complete
  - Request validation for organization_name, organization_url, organization_linkedin_url
  - Data sanitization in system and user prompts
  - No PII sent to external APIs
  - Profile data formatted for Perplexity API consumption

- ✅ Task 4: Error handling and monitoring complete
  - Failure detection with handleICPGenerationFailure function
  - Performance monitoring with timing logs
  - Audit logging for all ICP generation attempts
  - Graceful error responses with detailed error messages
  - Workflow status updates to 'failed' on error with error message storage

### File List

- `accessible-artifacts/34-1-generate-icp-document-via-perplexity-ai.md` (this file - updated)
- `supabase/migrations/20260131_add_icp_fields.sql` (created)
- `infin8content/lib/services/intent-engine/icp-generator.ts` (created)
- `infin8content/app/api/intent/workflows/[workflow_id]/steps/icp-generate/route.ts` (created)
- `infin8content/__tests__/services/icp-generator.test.ts` (created)
- `infin8content/__tests__/api/intent/icp-generate.test.ts` (created)
- `infin8content/lib/services/openrouter/openrouter-client.ts` (existing, reused)
- `infin8content/lib/types/intent-workflow.ts` (existing, compatible)

## Change Log

### 2026-01-31 - Code Review Complete & All Issues Fixed
- **Status**: Ready for deployment
- **Code Review**: Adversarial review completed - 5 CRITICAL + 4 MEDIUM issues identified and fixed
- **Critical Fixes Applied**:
  - ✅ Issue 1: Database migration verified (20260131_add_icp_fields.sql)
  - ✅ Issue 2: 5-minute timeout enforcement implemented with Promise.race()
  - ✅ Issue 3: Exponential backoff delegated to OpenRouter client with 2 retries
  - ✅ Issue 4: Idempotency check added - returns cached ICP if already generated
  - ✅ Issue 5: Analytics event emission added for workflow_step_completed
- **Medium Fixes Applied**:
  - ✅ Issue 6: URL format validation added using URL constructor
  - ✅ Issue 7: Rate limiting implemented (10 requests/hour per organization)
  - ✅ Issue 8: Removed redundant getCurrentUser() call in error handler
  - ✅ Issue 9: Test mocks improved for Supabase chain verification
- **Test Coverage**: 
  - Unit tests: 10 tests for ICP generator service (including timeout, URL validation)
  - Integration tests: 9 tests for API endpoint (including rate limiting, idempotency, caching)
  - Total: 19 comprehensive tests covering all code paths
- **Acceptance Criteria**: All 7 ACs fully satisfied
  - AC1: Perplexity API integration ✅
  - AC2: 5-minute timeout ✅ (enforced with Promise.race)
  - AC3: ICP includes all required fields ✅ (validated)
  - AC4: ICP stored in workflow ✅ (with idempotency)
  - AC5: Workflow status updates to 'step_1_icp' ✅
  - AC6: Step completion timestamp ✅
  - AC7: Analytics emission on success ✅ (workflow_step_completed event)

### 2026-01-31 - Implementation Complete
- **Status**: Code review passed
- **Implementation**: Full ICP generation feature via Perplexity AI
- **Key Changes**:
  - Created ICP generator service with OpenRouter Perplexity integration
  - Implemented API endpoint for workflow step execution
  - Added database migration for ICP data fields
  - Comprehensive unit and integration tests
  - Full error handling and monitoring
