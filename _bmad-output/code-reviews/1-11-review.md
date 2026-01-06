# Code Review: Story 1.11 - Row Level Security (RLS) Policies

**Reviewer**: Senior Developer Agent
**Date**: 2026-01-06
**Story**: 1-11-row-level-security-rls-policies-implementation
**Status**: 🔴 FAILED (Changes Requested)

## Summary
The implementation of RLS policies contains a **CRITICAL SECURITY VULNERABILITY** that exposes sensitive data. Additionally, the required tests are missing, and the implementation deviates from the story requirements regarding recursion safety and helper functions. The story lifecycle status was not updated, and tasks in the story file remain unchecked.

## 🚨 Critical Issues (Must Fix)

### 1. Data Leak in `team_invitations`
- **File**: `supabase/migrations/20260105180000_enable_rls_and_fix_security.sql`
- **Issue**:
```sql
CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations
FOR SELECT
USING (true); -- Token provides authorization, not RLS
```
- **Impact**: `USING (true)` means **anyone** (authenticated or potentially public, depending on table permissions) can `SELECT * FROM team_invitations`. This leaks all invitation tokens, email addresses, and roles.
- **Requirement Violation**: AC states "users CANNOT see invitations from other organizations".
- **Fix**: The policy must restrict access. If token-based access is needed, use a `security definer` function to validate the token and return the specific row, OR restrict `USING` to `token = current_setting('request.jwt.claim.invitation_token', true)` (if applicable), OR strictly `org_id` based checks for members. For public access to validate a token, specific RPC functions should be used instead of opening the table.

### 2. Missing Tests
- **Issue**: The story explicitly required creating `supabase/tests/rls_tests.sql` or updating integration tests. The `supabase/tests` directory does not exist.
- **Requirement Violation**: Task "Create test migration `supabase/tests/rls_tests.sql`" is incomplete.
- **Impact**: No verification that policies actually enforce security or allow legitimate access. High risk of breaking the app.

### 3. Recursion Risk in `users` Policy
- **File**: `supabase/migrations/20260105180000_enable_rls_and_fix_security.sql`
- **Issue**:
```sql
-- Policy: Users can view organization members
...
USING (
  org_id IN (
    SELECT org_id FROM public.users -- Recurses to same table
    WHERE auth_user_id = auth.uid()
  )
);
```
- **Impact**: This structure is a known infinite recursion trap in Supabase RLS. While Supabase tries to mitigate simple cases, this is fragile.
- **Requirement Violation**: The Story "Dev Notes" explicitly warned about this and suggested using `auth.jwt() -> 'app_metadata'` or `security definer` functions.
- **Fix**: Implement the `get_auth_user_org_id()` security definer function as requested in Task 2 to break the recursion loop.

## ⚠️ Major Issues

### 4. Incomplete Tasks & Documentation
- **Issue**: The story file `1-11-row-level-security-rls-policies-implementation.md` has all tasks unchecked `[ ]`.
- **Impact**: Impossible to track progress or know what was intended to be "done".
- **Action**: Update the story file to reflect work done.

### 5. Missing Helper Functions
- **Issue**: Task 2 required creating `get_auth_user_org_id()`, `is_org_member()`, etc. These were not created. Logic was inlined, contributing to the recursion risk.

## Recommendations
1.  **Immediate**: Revert or fix the `team_invitations` policy. Do not allow `USING (true)`.
2.  **Implementation**: Create the `security definer` helper functions to safely retrieve the current user's `org_id` without triggering RLS recursion.
3.  **Testing**: Create the `supabase/tests/rls_tests.sql` using pgTAP or write specific API integration tests that verify "User A cannot see User B's data".
4.  **Process**: Update the story file and set status to `review` in `sprint-status.yaml` only when *actually* ready.

**Outcome**: REJECTED. Do not merge.
