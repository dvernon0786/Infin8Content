# Story 33.1: Create Intent Workflow with Organization Context

Status: review

## Story Classification

**Producer**: Organization Management System  
**Epic**: 33 - Workflow Foundation & Organization Setup  
**Tier**: 1 (Core Infrastructure)  
**Story Type**: Producer (Creates workflow records used by all downstream stories)

## Business Intent

Organization admins can create intent workflows with proper organizational context so that the intent engine has the required foundation for all downstream content planning steps.

## Contracts Required

- [x] **C1**: Database table creation (intent_workflows)
- [x] **C2/C4/C5**: API endpoint for workflow creation
- [x] **Terminal State**: Workflow record with status 'step_0_auth'
- [x] **UI Boundary**: No UI event emission (backend-only operation)
- [x] **Analytics**: Terminal state analytics only (workflow_created event)

## Contracts Modified

- None (new feature addition)

## Contracts Guaranteed

- [x] **No UI events**: This story emits no UI events, only creates database records
- [x] **No intermediate analytics**: Only terminal state analytics (workflow_created)
- [x] **No state mutation outside producer**: Only creates intent_workflows records
- [x] **Idempotency**: Duplicate workflow creation requests return existing workflow
- [x] **Retry rules**: Failed requests can be safely retried with same input

## Producer Dependency Check

**Epic 33 Status**: Not Completed (this is the first story in Epic 33)  
**Producer Dependencies**: None (this is a foundational story)

## Blocking Decision

**Allowed**: ✅ This story can proceed as it has no producer dependencies and establishes the foundation for Epic 33.

## Story

As an organization admin,
I want to create a new intent workflow and associate it with my organization,
So that I can begin the content planning process with proper organizational context.

## Acceptance Criteria

**Given** I am an authenticated user with admin role in an organization  
**When** I submit a request to create a new intent workflow with a name and organization_id  
**Then** the system creates a new workflow record with status 'step_0_auth'  
**And** the workflow is associated with my organization via organization_id  
**And** I receive a response with the workflow ID and creation timestamp  
**And** the workflow is only visible to members of my organization (RLS enforced)

## Tasks / Subtasks

- [x] Task 1: Create intent_workflows database table (AC: #1, #2)
  - [x] Subtask 1.1: Design table schema with proper RLS policies
  - [x] Subtask 1.2: Add migration script for table creation
  - [x] Subtask 1.3: Implement RLS policies for organization isolation
- [x] Task 2: Create API endpoint for workflow creation (AC: #1, #2, #3)
  - [x] Subtask 2.1: Implement POST /api/intent/workflows endpoint
  - [x] Subtask 2.2: Add authentication and authorization middleware
  - [x] Subtask 2.3: Add request validation for workflow name and organization_id
- [x] Task 3: Implement response formatting (AC: #3)
  - [x] Subtask 3.1: Return workflow ID and creation timestamp
  - [x] Subtask 3.2: Include workflow status in response
- [x] Task 4: Add organization isolation (AC: #4)
  - [x] Subtask 4.1: Verify RLS policies prevent cross-organization access
  - [x] Subtask 4.2: Test isolation with multiple organizations
- [x] Task 5: Add error handling and validation
  - [x] Subtask 5.1: Handle duplicate workflow names within organization
  - [x] Subtask 5.2: Validate organization membership for requesting user
  - [x] Subtask 5.3: Return appropriate error responses

## Dev Notes

### Architecture Compliance

This story must follow the established patterns from the existing article generation system:
- Use Supabase for database operations with RLS policies
- Follow Next.js API route patterns with proper TypeScript types
- Implement authentication using existing getCurrentUser() pattern
- Use Inngest for any async operations (though this is synchronous)
- Follow existing error handling patterns with proper HTTP status codes

### Database Schema Requirements

Based on the Primary Content Workflow document, the intent_workflows table should include:
- id (UUID, primary key)
- organization_id (UUID, foreign key to organizations)
- name (TEXT, workflow name)
- status (TEXT, default 'step_0_auth')
- created_at (TIMESTAMP, default NOW())
- created_by (UUID, foreign key to users)
- updated_at (TIMESTAMP, default NOW())
- Additional fields for workflow data (JSONB for flexibility)

### API Contract

The endpoint should follow RESTful conventions:
- POST /api/intent/workflows
- Request body: { name: string, organization_id?: string }
- Response: { id: string, name: string, organization_id: string, status: string, created_at: string }
- Authentication required (Bearer token)
- Admin role required for organization

### Security Requirements

- Row-Level Security (RLS) policies must enforce organization isolation
- Only users with admin role in the organization can create workflows
- All operations must be audited in the existing audit trail system
- Input validation to prevent SQL injection and XSS

### Testing Requirements

- Unit tests for API endpoint logic
- Integration tests for database operations with RLS
- Security tests for organization isolation
- Performance tests for concurrent workflow creation
- Error handling tests for edge cases

### File Structure Requirements

Following the existing project structure:
- API route: app/api/intent/workflows/route.ts
- Database migration: supabase/migrations/YYYYMMDDHHMMSS_create_intent_workflows.sql
- Types: lib/types/intent-workflow.ts
- Tests: tests/api/intent/workflows.test.ts

### Project Structure Notes

This story aligns with the unified project structure:
- API routes follow the app/api/ pattern
- Database migrations use timestamp-based naming
- TypeScript types are centralized in lib/types/
- Tests follow the tests/ directory structure
- No conflicts detected with existing patterns

### References

- [Source: accessible-artifacts/primary-content-workflow-epics.md#Epic-1]
- [Source: docs/project-documentation/ARCHITECTURE_PRIMARY_CONTENT_WORKFLOW.md]
- [Source: lib/supabase/server.ts] - For database client patterns
- [Source: lib/supabase/get-current-user.ts] - For authentication patterns
- [Source: app/api/articles/generate/route.ts] - For API route patterns

## Dev Agent Record

### Agent Model Used

Cascade SWE-1.5

### Debug Log References

### Completion Notes List

✅ **Task 1 Complete**: Created intent_workflows database table with comprehensive schema including:
- UUID primary key with auto-generation
- Organization foreign key with CASCADE delete
- Workflow name with unique constraint per organization
- Status field with enum validation (step_0_auth through completed/failed)
- Created/updated timestamps with auto-update trigger
- Created_by foreign key to users table
- JSONB workflow_data field for flexibility
- Full RLS policies for organization isolation
- Audit logging trigger for workflow creation events

✅ **Task 2 Complete**: Implemented POST /api/intent/workflows endpoint with:
- Authentication using getCurrentUser() pattern
- Authorization requiring admin/owner role
- Request validation with Zod schema
- Organization membership validation
- Duplicate workflow name checking
- Comprehensive error handling (400, 401, 403, 409, 500)
- Audit logging for all workflow creations

✅ **Task 3 Complete**: Response formatting includes:
- Workflow ID (UUID)
- Workflow name
- Organization ID
- Current status (defaults to step_0_auth)
- Creation timestamp (ISO format)

✅ **Task 4 Complete**: Organization isolation via:
- RLS policies preventing cross-organization access
- Service role bypass for admin operations
- User context validation in all policies
- Organization-based filtering in queries

✅ **Task 5 Complete**: Error handling covers:
- Authentication failures (401)
- Authorization failures (403)
- Validation errors with details (400)
- Duplicate workflow names (409)
- Database errors (500)
- Network/fetch errors (500)

### File List

- app/api/intent/workflows/route.ts
- supabase/migrations/20260131010000_create_intent_workflows.sql
- lib/types/intent-workflow.ts
- tests/api/intent/workflows-simple.test.ts
- tests/api/intent/workflows.test.ts
- types/audit.ts (updated with intent workflow actions)
