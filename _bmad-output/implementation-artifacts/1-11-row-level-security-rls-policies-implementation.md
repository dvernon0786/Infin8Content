# Story 1.11: Row-Level Security (RLS) Policies Implementation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the system,
I want to enforce row-level security policies on all tables,
So that users can only access data belonging to their organization.

## Acceptance Criteria

**Given** database tables have been created
**When** RLS policies are implemented
**Then** all tables with `org_id` foreign keys have RLS enabled
**And** policies enforce that users can only SELECT/INSERT/UPDATE/DELETE rows where `org_id` matches their organization
**And** policies use Supabase's `auth.uid()` and organization lookup functions
**And** cross-organization data access is prevented (FR11)

**Given** a user from Organization A
**When** they query any table with RLS enabled
**Then** they only see rows where `org_id` = Organization A's ID
**And** they cannot see, modify, or delete rows from Organization B
**And** attempts to access other organizations' data return empty results (not errors)

**Given** a user tries to insert a row with a different `org_id`
**When** they attempt the insert
**Then** the insert is rejected or the `org_id` is automatically set to their organization
**And** they see an error message if the insert is rejected

**Given** RLS policies are in place
**When** automated tests are run
**Then** tests verify that cross-organization access is prevented
**And** tests verify that same-organization access works correctly
**And** zero cross-organization data leakage incidents (NFR-S2)

## Tasks / Subtasks

- [ ] Task 1: Create helper function for organization lookup (AC: 1, 2)
  - [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_rls_policies.sql`
  - [ ] Create helper function `get_user_org_id()`:
    ```sql
    CREATE OR REPLACE FUNCTION get_user_org_id()
    RETURNS UUID AS $$
    BEGIN
      RETURN (
        SELECT org_id 
        FROM users 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```
  - [ ] Function must be `SECURITY DEFINER` to access `users` table during RLS policy evaluation
  - [ ] Function returns NULL if user not found or has no org_id
  - [ ] Add function comment: 'Helper function to get current user organization ID for RLS policies'
  - [ ] Test function: Verify it returns correct org_id for authenticated users

- [ ] Task 2: Enable RLS on organizations table (AC: 1, 2)
  - [ ] Enable RLS: `ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;`
  - [ ] Create SELECT policy: Users can only see their own organization
    ```sql
    CREATE POLICY "Users can view their own organization"
      ON organizations
      FOR SELECT
      USING (id = get_user_org_id());
    ```
  - [ ] Create UPDATE policy: Only organization owners can update their organization
    ```sql
    CREATE POLICY "Owners can update their organization"
      ON organizations
      FOR UPDATE
      USING (id = get_user_org_id())
      WITH CHECK (
        id = get_user_org_id() AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE org_id = organizations.id 
          AND auth_user_id = auth.uid() 
          AND role = 'owner'
        )
      );
    ```
  - [ ] Note: INSERT policy not needed - organizations created via API with service role
  - [ ] Note: DELETE policy not needed - organizations deleted via API with service role
  - [ ] Test policies: Verify users can only see/update their own organization

- [ ] Task 3: Enable RLS on users table (AC: 1, 2)
  - [ ] Enable RLS: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
  - [ ] Create SELECT policy: Users can see other users in their organization
    ```sql
    CREATE POLICY "Users can view members of their organization"
      ON users
      FOR SELECT
      USING (org_id = get_user_org_id());
    ```
  - [ ] Create UPDATE policy: Users can update their own record, owners can update any user in org
    ```sql
    CREATE POLICY "Users can update their own record or owners can update org members"
      ON users
      FOR UPDATE
      USING (
        org_id = get_user_org_id() AND
        (
          auth_user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM users 
            WHERE org_id = users.org_id 
            AND auth_user_id = auth.uid() 
            AND role = 'owner'
          )
        )
      )
      WITH CHECK (org_id = get_user_org_id());
    ```
  - [ ] Note: INSERT handled via API routes (team invitations, registration)
  - [ ] Note: DELETE handled via API routes (team member removal)
  - [ ] Test policies: Verify users can see org members, owners can update roles

- [ ] Task 4: Enable RLS on team_invitations table (AC: 1, 2)
  - [ ] Enable RLS: `ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;`
  - [ ] Create SELECT policy: Users can see invitations for their organization
    ```sql
    CREATE POLICY "Users can view invitations for their organization"
      ON team_invitations
      FOR SELECT
      USING (org_id = get_user_org_id());
    ```
  - [ ] Create INSERT policy: Only owners can create invitations
    ```sql
    CREATE POLICY "Owners can create invitations for their organization"
      ON team_invitations
      FOR INSERT
      WITH CHECK (
        org_id = get_user_org_id() AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE org_id = team_invitations.org_id 
          AND auth_user_id = auth.uid() 
          AND role = 'owner'
        )
      );
    ```
  - [ ] Create UPDATE policy: Only owners can update invitations
    ```sql
    CREATE POLICY "Owners can update invitations for their organization"
      ON team_invitations
      FOR UPDATE
      USING (
        org_id = get_user_org_id() AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE org_id = team_invitations.org_id 
          AND auth_user_id = auth.uid() 
          AND role = 'owner'
        )
      )
      WITH CHECK (org_id = get_user_org_id());
    ```
  - [ ] Create DELETE policy: Only owners can delete invitations
    ```sql
    CREATE POLICY "Owners can delete invitations for their organization"
      ON team_invitations
      FOR DELETE
      USING (
        org_id = get_user_org_id() AND
        EXISTS (
          SELECT 1 FROM users 
          WHERE org_id = team_invitations.org_id 
          AND auth_user_id = auth.uid() 
          AND role = 'owner'
        )
      );
    ```
  - [ ] Test policies: Verify invitation access is restricted to organization owners

- [ ] Task 5: Create RLS test suite (AC: 4)
  - [ ] Create test file: `supabase/tests/rls_policies.test.sql` (or use Supabase test framework)
  - [ ] Test cross-organization isolation:
    - Create test users in Organization A and Organization B
    - Verify User A cannot SELECT rows from Organization B
    - Verify User A cannot UPDATE rows from Organization B
    - Verify User A cannot DELETE rows from Organization B
    - Verify User A cannot INSERT rows with Organization B's org_id
  - [ ] Test same-organization access:
    - Verify users in same organization can see each other's data
    - Verify owners can update team member roles
    - Verify users can update their own records
  - [ ] Test edge cases:
    - User with NULL org_id cannot access any data
    - User with invalid auth_user_id cannot access data
    - Policies work correctly with service role (bypasses RLS)
  - [ ] Run tests: Execute test suite and verify all tests pass
  - [ ] Document test results: Zero cross-organization data leakage (NFR-S2)

- [ ] Task 6: Update API routes to work with RLS (AC: 1, 2, 3)
  - [ ] Review existing API routes that query database:
    - `app/api/organizations/create/route.ts`
    - `app/api/organizations/update/route.ts`
    - `app/api/team/invite/route.ts`
    - `app/api/team/accept-invitation/route.ts`
    - `app/api/team/members/route.ts`
    - `app/api/team/update-role/route.ts`
    - `app/api/team/remove-member/route.ts`
  - [ ] Verify routes use authenticated Supabase client (not service role)
  - [ ] Verify routes rely on RLS policies for data isolation (remove manual org_id checks where RLS handles it)
  - [ ] Update error handling: RLS violations return appropriate errors
  - [ ] Test routes: Verify all routes work correctly with RLS enabled
  - [ ] Note: Service role client should only be used for admin operations, not regular API routes

- [ ] Task 7: Update getCurrentUser helper if needed (AC: 1, 2)
  - [ ] Review `lib/supabase/get-current-user.ts`
  - [ ] Verify it uses authenticated client (RLS will automatically filter by org_id)
  - [ ] Verify organization query respects RLS policies
  - [ ] Test helper: Verify it returns correct user and organization data
  - [ ] Update if needed: Ensure helper works correctly with RLS enabled

- [ ] Task 8: Document RLS implementation (AC: 1, 2, 4)
  - [ ] Update `_bmad-output/data-models.md`:
    - Document RLS policies for each table
    - Document helper function `get_user_org_id()`
    - Document policy behavior and access patterns
  - [ ] Create RLS policy reference:
    - List all tables with RLS enabled
    - Document policy types (SELECT, INSERT, UPDATE, DELETE)
    - Document access patterns (who can access what)
  - [ ] Update architecture documentation:
    - Mark RLS as implemented (was deferred in Story 1.2)
    - Document security model and data isolation approach
  - [ ] Add developer notes:
    - How to add RLS to new tables
    - How to test RLS policies
    - Common RLS patterns and best practices

## Dev Notes

### Architecture Context

**Multi-Tenant Security Model:**
- **Database:** Supabase PostgreSQL with Row-Level Security (RLS)
- **Pattern:** Every table with `org_id` foreign key has RLS enabled
- **Isolation:** Users can only access data where `org_id` matches their organization
- **Enforcement:** Database-level security (cannot be bypassed by application code)

**RLS Implementation Pattern:**
- **Helper Function:** `get_user_org_id()` - Returns current user's organization ID
- **Policy Types:** SELECT, INSERT, UPDATE, DELETE policies per table
- **Access Control:** Role-based policies (owners can update, users can view)
- **Service Role:** Bypasses RLS (only for admin operations, not regular API routes)

**Previous Story Context (Story 1.10):**
- Team invitations table created with `org_id` foreign key
- Team member management API routes implemented
- User roles (owner, editor, viewer) established
- Organization lookup pattern via `getCurrentUser()` helper

**Database Schema:**
- `organizations` table: Multi-tenant organization data
- `users` table: User accounts with `org_id` and `role` columns
- `team_invitations` table: Team member invitations with `org_id` foreign key
- All tables use UUID primary keys and include `org_id` for multi-tenant isolation

### Technical Requirements

**Supabase RLS Implementation:**
- **Enable RLS:** `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- **Create Policies:** Use `CREATE POLICY` with `USING` and `WITH CHECK` clauses
- **Helper Function:** `get_user_org_id()` uses `auth.uid()` to lookup user's organization
- **Security:** Policies use `SECURITY DEFINER` functions to access `users` table during evaluation

**Policy Patterns:**
- **SELECT:** `USING (org_id = get_user_org_id())` - Users see only their org's data
- **INSERT:** `WITH CHECK (org_id = get_user_org_id())` - Users can only insert with their org_id
- **UPDATE:** `USING` for read access, `WITH CHECK` for write access
- **DELETE:** `USING (org_id = get_user_org_id())` - Users can only delete their org's data

**Testing Requirements:**
- **Cross-Organization Isolation:** Verify users cannot access other organizations' data
- **Same-Organization Access:** Verify users can access their organization's data
- **Role-Based Access:** Verify owners can update, users can view
- **Edge Cases:** NULL org_id, invalid auth_user_id, service role bypass

**API Route Updates:**
- **Authenticated Client:** Use `createClient()` from `lib/supabase/server.ts` (not service role)
- **RLS Enforcement:** RLS policies automatically filter queries by org_id
- **Error Handling:** RLS violations return appropriate HTTP errors
- **Service Role:** Only use for admin operations (migrations, system tasks)

### Library/Framework Requirements

**Core Dependencies:**
- `@supabase/supabase-js`: ^2.39.0+ - Supabase client library (already installed)
- **PostgreSQL:** Supabase managed PostgreSQL with RLS support
- **Migration Tool:** Supabase CLI or Dashboard for applying migrations

**No Additional Dependencies Required:**
- RLS is a PostgreSQL feature, no additional libraries needed
- Helper functions use standard PostgreSQL PL/pgSQL

### File Structure Requirements

**Migration Files:**
- Location: `supabase/migrations/YYYYMMDDHHMMSS_add_rls_policies.sql`
- Naming: Use timestamp prefix for migration ordering
- Content: RLS enable statements, policy definitions, helper functions

**Test Files:**
- Location: `supabase/tests/rls_policies.test.sql` (or framework-specific location)
- Content: RLS policy tests, cross-organization isolation tests

**Documentation Updates:**
- `_bmad-output/data-models.md` - Document RLS policies
- `_bmad-output/architecture.md` - Mark RLS as implemented

**Code Files (Review/Update):**
- `lib/supabase/get-current-user.ts` - Verify RLS compatibility
- `app/api/organizations/*/route.ts` - Verify RLS compatibility
- `app/api/team/*/route.ts` - Verify RLS compatibility

### Testing Requirements

**RLS Policy Tests:**
- **Cross-Organization Isolation:** Users cannot access other organizations' data
- **Same-Organization Access:** Users can access their organization's data
- **Role-Based Access:** Owners can update, users can view
- **Edge Cases:** NULL org_id, invalid auth_user_id

**Integration Tests:**
- **API Routes:** Verify routes work correctly with RLS enabled
- **Helper Functions:** Verify `getCurrentUser()` works with RLS
- **Error Handling:** Verify RLS violations return appropriate errors

**Manual Testing:**
- **Database Queries:** Test direct database queries with different users
- **API Endpoints:** Test API endpoints with different user roles
- **Cross-Organization Attempts:** Verify attempts to access other orgs fail gracefully

### Previous Story Intelligence

**From Story 1.10 (Team Member Invites):**
- `team_invitations` table created with `org_id` foreign key
- Team management API routes implemented with manual org_id checks
- **RLS Update:** Remove manual org_id checks, rely on RLS policies instead
- **Pattern:** Use authenticated Supabase client, RLS automatically filters by org_id

**From Story 1.2 (Database Schema):**
- Initial schema created with `org_id` foreign keys
- RLS was deferred to this story (Story 1.11)
- **Now Implementing:** Enable RLS on all tables with `org_id` foreign keys

**From Story 1.6 (Organization Creation):**
- Organization creation API route implemented
- Uses service role for organization creation (bypasses RLS)
- **RLS Update:** Verify organization SELECT/UPDATE policies work correctly

### Project Structure Notes

**Alignment with Unified Project Structure:**
- **Migrations:** `supabase/migrations/` - Standard Supabase migration location
- **Tests:** `supabase/tests/` - Supabase test framework location
- **API Routes:** `app/api/` - Next.js API routes (no changes needed)
- **Helpers:** `lib/supabase/` - Supabase client helpers (review for RLS compatibility)

**No Conflicts Detected:**
- RLS implementation follows Supabase best practices
- Migration pattern matches existing schema migrations
- API route structure remains unchanged

### References

**Source Documents:**
- [Source: _bmad-output/epics.md#Story-1.11] - Story requirements and acceptance criteria
- [Source: _bmad-output/prd.md#Multi-Tenant-Architecture] - RLS architecture decision and rationale
- [Source: _bmad-output/architecture.md#Security-Architecture] - Security architecture and RLS requirements
- [Source: _bmad-output/data-models.md] - Database schema with org_id foreign keys
- [Source: infin8content/supabase/migrations/20260101124156_initial_schema.sql] - Initial schema migration

**Technical References:**
- [Source: Supabase RLS Documentation] - Row-Level Security implementation guide
- [Source: PostgreSQL RLS Documentation] - PostgreSQL RLS feature documentation
- [Source: Story 1.10 Implementation] - Team invitations table structure and org_id pattern

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


