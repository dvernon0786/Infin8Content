# Story 33.4: Enable Intent Engine Feature Flag

Status: review

## Story Classification

**Producer**: Feature Flag Management System  
**Epic**: 33 - Workflow Foundation & Organization Setup  
**Tier**: 1 (Core Infrastructure)  
**Story Type**: Producer (Enables/disables intent engine for organizations)

## Business Intent

Product managers can enable the intent engine feature flag for specific organizations to gradually roll out the new workflow without affecting existing users.

## Contracts Required

- [x] **C1**: Feature flags table with organization-level flag state
- [x] **C2/C4/C5**: API endpoint for feature flag management
- [x] **Terminal State**: Flag state persisted in database
- [x] **UI Boundary**: No UI event emission (backend-only operation)
- [x] **Analytics**: Terminal state analytics only (FEATURE_FLAG_TOGGLED event)

## Contracts Modified

- None (new feature addition, no modifications to existing contracts)

## Contracts Guaranteed

- [x] **No UI events**: This story emits no UI events, only manages database flag state
- [x] **No intermediate analytics**: Only terminal state analytics (FEATURE_FLAG_TOGGLED)
- [x] **No state mutation outside producer**: Only creates/updates feature_flags records
- [x] **Idempotency**: Toggling flag multiple times with same state is safe
- [x] **Retry rules**: Failed flag toggle requests can be safely retried

## Producer Dependency Check

**Epic 33 Status**: In Progress (Stories 33.1, 33.2, 33.3 completed)  
**Producer Dependencies**: Story 33.1 (Create Intent Workflow) - COMPLETED ✅

## Blocking Decision

**Allowed**: ✅ This story can proceed. Story 33.1 is completed, providing the foundation for workflow creation that this feature flag will control.

## Story

As a product manager,
I want to enable the intent engine feature flag for specific organizations,
So that I can gradually roll out the new workflow without affecting existing users.

## Acceptance Criteria

**Given** I have access to feature flag management  
**When** I enable the ENABLE_INTENT_ENGINE flag for an organization  
**Then** the system stores this flag state in the feature_flags table  
**And** the flag is checked on every workflow creation request  
**And** I can enable/disable the flag without redeploying code  
**And** the flag change takes effect immediately for new requests

## Tasks / Subtasks

- [x] Task 1: Create feature_flags database table (AC: #1)
  - [x] Subtask 1.1: Design table schema with organization_id and flag_key columns
  - [x] Subtask 1.2: Add migration script: supabase/migrations/20260131HHMMSS_create_feature_flags.sql
  - [x] Subtask 1.3: Implement RLS policies for organization isolation
  - [x] Subtask 1.4: Add unique constraint on (organization_id, flag_key)
- [x] Task 2: Create API endpoint for feature flag management (AC: #1, #2, #3)
  - [x] Subtask 2.1: Implement POST /api/feature-flags endpoint
  - [x] Subtask 2.2: Add authentication and authorization (admin role required)
  - [x] Subtask 2.3: Add request validation for organization_id and flag_key
  - [x] Subtask 2.4: Implement flag toggle logic (enable/disable)
- [x] Task 3: Implement flag checking on workflow creation (AC: #2)
  - [x] Subtask 3.1: Add flag check in POST /api/intent/workflows endpoint
  - [x] Subtask 3.2: Return 403 Forbidden if flag is disabled for organization
  - [x] Subtask 3.3: Log flag check results for debugging
- [x] Task 4: Implement immediate flag effect (AC: #4)
  - [x] Subtask 4.1: Ensure flag changes take effect without cache delay
  - [x] Subtask 4.2: Add cache invalidation mechanism if caching is used
  - [x] Subtask 4.3: Test flag toggle with concurrent requests

## Dev Notes

### Architecture Compliance

This story must follow the established patterns from the existing article generation system:
- Use Supabase for database operations with RLS policies
- Follow Next.js API route patterns with proper TypeScript types
- Implement authentication using existing getCurrentUser() pattern
- Follow existing error handling patterns with proper HTTP status codes
- Implement feature flag checking in workflow creation endpoint (Story 33.1)

### Database Schema Requirements

The feature_flags table should include:
- id (UUID, primary key)
- organization_id (UUID, foreign key to organizations)
- flag_key (TEXT, e.g., 'ENABLE_INTENT_ENGINE')
- enabled (BOOLEAN, default false)
- created_at (TIMESTAMP, default NOW())
- updated_at (TIMESTAMP, default NOW())
- updated_by (UUID, foreign key to users)
- Unique constraint on (organization_id, flag_key)

### API Contract

The endpoint should follow RESTful conventions:
- POST /api/feature-flags
- Request body: { organization_id: string, flag_key: string, enabled: boolean }
- Response: { id: string, organization_id: string, flag_key: string, enabled: boolean, updated_at: string }
- Authentication required (Bearer token)
- Admin role required for organization

Error Responses:
- 400: { error: "Validation failed", details: [...] }
- 401: { error: "Authentication required" }
- 403: { error: "Insufficient permissions. Admin role required." }
- 404: { error: "Organization not found" }
- 500: { error: "Internal server error" }

### Feature Flag Integration Points

1. **Workflow Creation Endpoint** (Story 33.1):
   - Check ENABLE_INTENT_ENGINE flag before allowing workflow creation
   - If disabled, return 403 Forbidden with message "Intent engine not enabled for this organization"
   - Log flag check for audit trail

2. **Flag Implementation Pattern**:
   - Use database-driven flags (not environment variables like WORDPRESS_PUBLISH_ENABLED)
   - Query feature_flags table directly for real-time flag state
   - No caching by default (ensure immediate effect)

3. **Fallback Behavior**:
   - If flag check fails (database error), default to disabled (fail-safe)
   - Log errors for monitoring

### Security Requirements

- Row-Level Security (RLS) policies must enforce organization isolation
- Only users with admin/owner role can toggle feature flags
- All flag changes must be audited in the existing audit trail system using FEATURE_FLAG_TOGGLED action
- Input validation to prevent SQL injection
- Rate limiting on flag toggle endpoint to prevent abuse

### Performance Requirements

- Feature flag database queries must complete within 50ms (p95)
- Flag lookup should not add measurable latency to workflow creation
- Monitor flag lookup performance in production metrics

### Testing Requirements

- Unit tests for API endpoint logic
- Integration tests for database operations with RLS
- Security tests for organization isolation and admin-only access
- Tests for flag checking in workflow creation endpoint
- Tests for immediate flag effect (no caching delays)
- Performance tests for flag lookup performance (<50ms p95)
- Error handling tests for edge cases (invalid org, invalid flag, etc.)

### File Structure Requirements

Following the existing project structure:
- API route: app/api/feature-flags/route.ts
- Database migration: supabase/migrations/20260131HHMMSS_create_feature_flags.sql
- Types: lib/types/feature-flag.ts
- Feature flag utilities: lib/utils/feature-flags.ts
- Tests: tests/api/feature-flags.test.ts
- Integration: Update app/api/intent/workflows/route.ts to check flag
- Audit types: Update types/audit.ts with FEATURE_FLAG_TOGGLED action

### Rollout Strategy

This feature flag enables gradual rollout:
1. Initially disabled for all organizations
2. Product manager enables for pilot organizations
3. Monitor health metrics and error rates
4. Gradually enable for more organizations
5. Full rollout when stable
6. Can be instantly disabled if issues arise (rollback capability)

### Project Structure Notes

This story aligns with the unified project structure:
- API routes follow the app/api/ pattern
- Database migrations use timestamp-based naming
- TypeScript types are centralized in lib/types/
- Tests follow the tests/ directory structure
- Feature flag utilities follow lib/utils/ pattern
- No conflicts detected with existing patterns

### Feature Flag Utility Functions

Create `lib/utils/feature-flags.ts` with these functions:

```typescript
// Check if feature flag is enabled for organization
export async function isFeatureFlagEnabled(
  organizationId: string, 
  flagKey: string
): Promise<boolean>

// Get feature flag state with metadata
export async function getFeatureFlag(
  organizationId: string, 
  flagKey: string
): Promise<FeatureFlag | null>

// Toggle feature flag (admin only)
export async function toggleFeatureFlag(
  organizationId: string,
  flagKey: string,
  enabled: boolean,
  userId: string
): Promise<FeatureFlag>
```

### References

- [Source: accessible-artifacts/epics.md#Epic-33-Story-33.4]
- [Source: accessible-artifacts/primary-content-workflow-epics.md#Story-1.4]
- [Source: _bmad/bmm/testarch/knowledge/feature-flags.md] - Feature flag governance patterns
- [Source: infin8content/app/api/articles/publish/route.ts] - Example of environment variable flag usage (contrast with database flags)
- [Source: lib/supabase/server.ts] - For database client patterns
- [Source: lib/supabase/get-current-user.ts] - For authentication patterns
- [Source: app/api/intent/workflows/route.ts] - For API route patterns and workflow creation

## Dev Agent Record

### Agent Model Used

Cascade SWE-1.5

### Debug Log References

### Completion Notes List

✅ **Task 1 Complete**: Created feature_flags database table with proper schema, RLS policies, and audit logging
✅ **Task 2 Complete**: Implemented POST /api/feature-flags endpoint with authentication, authorization, and validation
✅ **Task 3 Complete**: Added feature flag checking to POST /api/intent/workflows endpoint with proper error handling
✅ **Task 4 Complete**: Implemented immediate flag effect with database-driven flags (no caching delays)

### File List

- infin8content/migrations/20260131120000_create_feature_flags.sql
- infin8content/lib/types/feature-flag.ts
- infin8content/lib/utils/feature-flags.ts
- infin8content/app/api/feature-flags/route.ts
- infin8content/app/api/intent/workflows/route.ts (updated with flag check)
- infin8content/__tests__/api/feature-flags.test.ts
- infin8content/__tests__/api/intent/workflows-feature-flag.test.ts
