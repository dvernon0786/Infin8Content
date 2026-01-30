# Story 33.2: Configure Organization ICP Settings

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story Classification

**Producer Story** - Creates foundational data for downstream workflow steps  
**Epic:** 33 - Workflow Foundation & Organization Setup  
**Tier:** 0 - Critical infrastructure for Intent Engine  

## Business Intent

Organization admins can configure ICP settings to establish target audience validation for all downstream content workflow steps.

## Contracts Required

- [x] **C1 Contract:** Database schema for ICP settings storage
- [x] **C2/C4/C5 Contract:** API endpoint for ICP configuration
- [x] **Terminal State Contract:** ICP configuration stored and available
- [x] **UI Boundary Contract:** No UI event emissions (backend-only)
- [x] **Analytics Contract:** Terminal state analytics only

## Contracts Modified

- None - This is a foundational Producer story

## Contracts Guaranteed

- [x] **No UI Events:** Pure backend API implementation
- [x] **No Intermediate Analytics:** Only terminal state logging
- [x] **No State Mutation Outside Producer:** Database operations only
- [x] **Idempotency:** Multiple calls with same data produce same result
- [x] **Retry Rules:** API failures handled gracefully

## Producer Dependency Check

**Epic 33 Status:** in-progress  
**Story 33.1 Status:** done - Intent workflow table created and API endpoint functional  
**Producer Dependencies:** ✅ MET - Story 33.1 completed intent_workflows table and organization context

## Blocking Decision

**ALLOWED** - All producer dependencies completed, contracts clear, ready for development

## Story

As an organization admin,
I want to configure my organization's Ideal Customer Profile (ICP) settings,
So that all downstream workflow steps can validate content against our target audience.

## Acceptance Criteria

**Given** I have created an intent workflow  
**When** I submit ICP configuration data (target industries, buyer roles, pain points, value proposition)  
**Then** the system stores this configuration in the organization settings  
**And** the configuration is encrypted at rest  
**And** only organization members can view this configuration  
**And** the ICP settings are available for all future workflows in this organization

## Tasks / Subtasks

- [ ] Task 1: Create ICP settings database schema (AC: Given, When, Then)
  - [ ] Subtask 1.1: Add icp_settings JSONB column to organizations table
  - [ ] Subtask 1.2: Create encryption/decryption functions for ICP data
  - [ ] Subtask 1.3: Add RLS policies for ICP settings access control
- [ ] Task 2: Create ICP configuration API endpoint (AC: When, Then, And)
  - [ ] Subtask 2.1: Implement PUT /api/organizations/{orgId}/icp-settings endpoint
  - [ ] Subtask 2.2: Add input validation for ICP data structure
  - [ ] Subtask 2.3: Implement encryption before database storage
- [ ] Task 3: Implement ICP settings retrieval (AC: And, And)
  - [ ] Subtask 3.1: Implement GET /api/organizations/{orgId}/icp-settings endpoint
  - [ ] Subtask 3.2: Add decryption for data retrieval
  - [ ] Subtask 3.3: Validate organization membership for access control
- [ ] Task 4: Add audit logging and error handling
  - [ ] Subtask 4.1: Log ICP configuration changes to audit_logs
  - [ ] Subtask 4.2: Implement graceful error handling for invalid data
  - [ ] Subtask 4.3: Add comprehensive API error responses

## Dev Notes

### Database Schema Requirements

- **Table:** organizations (existing)
- **Column:** icp_settings JSONB - Encrypted ICP configuration
- **Encryption:** Use pgcrypto extension for data encryption
- **Structure:** ICP data should include target_industries, buyer_roles, pain_points, value_proposition

### API Architecture Patterns

- **Endpoint Pattern:** Follow existing organization management patterns
- **Authentication:** Use getCurrentUser() pattern from existing codebase
- **Authorization:** Enforce organization admin role requirements
- **Error Handling:** Consistent with existing API error patterns

### Security Requirements

- **Encryption at Rest:** Mandatory for all ICP data
- **Organization Isolation:** RLS policies must prevent cross-org access
- **Admin Only:** Only organization admins can configure ICP settings
- **Audit Trail:** All configuration changes must be logged

### Integration Points

- **Intent Workflows:** ICP settings referenced by workflow steps
- **Organization Context:** Leverage existing organization management
- **Feature Flags:** Consider ENABLE_INTENT_ENGINE flag for future rollout

## Project Structure Notes

### File Locations

- **Database Migration:** `infin8content/supabase/migrations/20260131020000_add_icp_settings.sql`
- **API Route:** `infin8content/app/api/organizations/[orgId]/icp-settings/route.ts`
- **Types:** `infin8content/types/icp.ts`
- **Validation:** `infin8content/lib/validations/icp.ts`

### Naming Conventions

- **Database:** snake_case for columns (icp_settings)
- **API:** kebab-case for routes (icp-settings)
- **Types:** PascalCase for TypeScript interfaces (ICPSettings)
- **Functions:** camelCase for utility functions (encryptICPData)

### Alignment with Existing Patterns

- **Authentication:** Follow getCurrentUser() pattern from auth system
- **Database:** Use existing organizations table structure
- **API:** Consistent with existing organization management endpoints
- **Error Handling:** Match existing API error response patterns

## References

- **Database Schema:** [Source: infin8content/supabase/migrations/20260131010000_create_intent_workflows.sql] - Intent workflows table structure and RLS patterns
- **Organization Management:** [Source: 1-6-organization-creation-and-management.md] - Existing organization CRUD patterns
- **Authentication Patterns:** [Source: 1-3-user-registration-with-email-and-password.md] - getCurrentUser() implementation
- **API Architecture:** [Source: 4a-1-article-generation-initiation-and-queue-setup.md] - API route structure and validation
- **Security Patterns:** [Source: 1-13-audit-logging-for-compliance.md] - Audit logging implementation
- **RLS Policies:** [Source: 1-11-row-level-security-rls-policies-implementation.md] - Row Level Security patterns

## Previous Story Intelligence

**Story 33.1 Learnings:**
- Intent workflows table successfully created with proper RLS policies
- Organization isolation patterns established and working
- Audit logging for workflow creation implemented successfully
- Service role bypass pattern for admin operations validated

**Key Patterns to Reuse:**
- Database migration idempotency patterns (DROP IF EXISTS)
- RLS policy structure with organization-based access control
- Audit logging with error handling that doesn't block main operations
- Service role policies for admin bypass scenarios

## Git Intelligence

**Recent Relevant Commits:**
- Intent workflows table creation with comprehensive RLS policies
- Organization management patterns established
- Authentication and authorization patterns validated

**Code Patterns Established:**
- Multi-tenant database design with organization isolation
- Comprehensive audit logging for sensitive operations
- Graceful error handling in database functions

## Latest Technical Information

**PostgreSQL pgcrypto Extension:**
- Use pgp_sym_encrypt() for data encryption
- Use pgp_sym_decrypt() for data decryption
- Encryption keys should be managed via environment variables
- Consider performance implications of encrypted JSONB queries

**Supabase RLS Best Practices:**
- Subquery pattern for organization validation: `organization_id = (SELECT org_id FROM users WHERE auth_user_id = auth.uid())`
- Service role bypass for admin operations
- Comprehensive audit logging with non-blocking error handling

## Project Context Reference

**No project-context.md found** - This story establishes foundational patterns for the Intent Engine epic that should be referenced in future project context documentation.

## Story Completion Status

**Status:** validation - Awaiting SM canonical template validation and contract compliance check

**SM Validation Required:**
- Canonical template compliance verified
- Contract compliance validated  
- Producer dependency confirmed complete
- Ready-for-dev approval pending

**Next Steps:**
1. SM agent must validate canonical template compliance
2. SM agent must verify contract compliance
3. Only after SM approval can story become ready-for-dev
4. No development until SM explicitly approves

## Dev Agent Record

### Agent Model Used

GPT-4 with BMAD workflow execution context

### Debug Log References

- Story extraction from epics.md completed successfully
- Database schema analysis from migration 20260131010000 completed
- Previous story intelligence gathered (no 33-1 story file found)
- Git intelligence analysis completed

### Completion Notes List

- Epic 33 context extracted from lines 12456-12533 of epics.md
- Database patterns analyzed from intent_workflows migration
- Organization isolation patterns identified for reuse
- Security requirements established based on existing patterns

### File List

**Files to Create:**
- `infin8content/supabase/migrations/20260131020000_add_icp_settings.sql`
- `infin8content/app/api/organizations/[orgId]/icp-settings/route.ts`
- `infin8content/types/icp.ts`
- `infin8content/lib/validations/icp.ts`

**Files to Reference:**
- `infin8content/supabase/migrations/20260131010000_create_intent_workflows.sql`
- `1-6-organization-creation-and-management.md`
- `1-13-audit-logging-for-compliance.md`
