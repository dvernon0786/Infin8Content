# Story 1.10: Team Member Invites and Role Assignments - Context

**Status:** ready-for-dev  
**Priority:** P1 (Post-MVP)  
**Epic:** Epic 1 - Foundation & Authentication

---

## Quick Summary

**User Story:**
As an organization owner, I want to invite team members and assign them roles, so that my team can collaborate on content with appropriate permissions.

**Core Functionality:**
- Owners invite team members via email (Editor/Viewer roles only)
- Invitations expire in 7 days
- Invited users accept via token link
- Owners can change roles and remove members
- Email notifications at key points

---

## Acceptance Criteria (Condensed)

1. **Team Settings Page:** Owners see team list, pending invitations, "Invite" button
2. **Invitation Creation:** Email + role → invitation record created, email sent, token expires in 7 days
3. **Invitation Acceptance:** Token link → user added to org with role, owner notified
4. **Expiration Handling:** Expired invitations show error, owner can resend
5. **Role Management:** Owners can change roles (Editor ↔ Viewer) and remove members

---

## Critical Technical Requirements

### Database Schema

**New Table: `team_invitations`**
```sql
- id (UUID, PK)
- email (TEXT, NOT NULL)
- org_id (UUID, FK → organizations.id, CASCADE)
- role (TEXT, CHECK: 'editor' or 'viewer' ONLY - not 'owner')
- token (TEXT, UNIQUE, NOT NULL) - Use crypto.randomUUID()
- status (TEXT, CHECK: 'pending', 'accepted', 'expired', DEFAULT 'pending')
- expires_at (TIMESTAMPTZ, NOT NULL) - 7 days from creation
- accepted_at (TIMESTAMPTZ, NULLABLE)
- created_by (UUID, FK → users.id, CASCADE) - inviter
- created_at, updated_at (TIMESTAMPTZ)
```

**Indexes Required:**
- `token` (for acceptance lookup)
- `(email, org_id)` (for duplicate checks)
- `org_id` (for team list queries)
- `expires_at` (for cleanup)

### API Endpoints

**All endpoints require owner authorization:**
```typescript
const currentUser = await getCurrentUser()
if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
}
```

1. **POST `/api/team/invite`** - Create invitation
   - Validate: email format, role (editor/viewer only), no duplicate pending, user not already in org
   - Generate token: `crypto.randomUUID()`
   - Set expires_at: 7 days from now
   - Send email (non-blocking)
   - Return: `{ success: true, invitationId: string }`

2. **POST `/api/team/accept-invitation`** - Accept invitation
   - Validate: token exists, not expired, status = 'pending'
   - Edge case: User already has org_id → return error
   - If user doesn't exist: Return redirect to registration with token
   - If user exists: Update `users.org_id` and `users.role`, update invitation status
   - Send owner notification (non-blocking)
   - Return: `{ success: true, redirectUrl: '/dashboard' }`

3. **POST `/api/team/resend-invitation`** - Resend invitation
   - Generate new token, extend expiration
   - Send email (non-blocking)

4. **GET `/api/team/members`** - List team members
   - Returns: `{ members: [...], pendingInvitations: [...] }`
   - Combines active users + pending invitations

5. **POST `/api/team/update-role`** - Change member role
   - Cannot change owner role
   - Cannot change own role
   - Send role change email (non-blocking)

6. **POST `/api/team/remove-member`** - Remove member
   - Cannot remove owner
   - Cannot remove self
   - Set `users.org_id = NULL`
   - Send removal email (non-blocking)

### Email Service

**File:** `lib/services/team-notifications.ts`

**Follow pattern from:** `lib/services/payment-notifications.ts`

**Functions Required:**
- `sendTeamInvitationEmail()` - Invitation email with acceptance link
- `sendTeamInvitationAcceptedEmail()` - Owner notification when accepted
- `sendRoleChangeEmail()` - Member notification when role changes
- `sendMemberRemovedEmail()` - Member notification when removed

**Pattern:**
- Use Brevo singleton from `lib/services/brevo.ts`
- HTML + plain text templates
- Non-blocking (wrap in try-catch, log errors)
- Subject lines: Clear, descriptive
- Invitation link: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`

### UI Components

1. **`app/settings/team/page.tsx`** (Server Component)
   - Authorization: Redirect non-owners
   - Fetch team members via API
   - Pass data to client components

2. **`app/settings/team/team-members-list.tsx`** (Client Component)
   - Display members table: Email, Role, Status, Actions
   - Display pending invitations with expiration
   - Handle role changes, member removal
   - Toast notifications for success/error

3. **`app/settings/team/invite-team-member-form.tsx`** (Client Component)
   - Email input (validation), Role dropdown (Editor/Viewer)
   - Submit to `/api/team/invite`
   - Success/error handling

4. **`app/accept-invitation/page.tsx`** (Server Component)
   - Public route (no middleware protection)
   - Validate token, check expiration
   - If authenticated: Auto-accept
   - If not authenticated: Show invitation details + "Create Account" / "Log In" buttons

5. **`app/accept-invitation/accept-invitation-client.tsx`** (Client Component)
   - Display invitation details
   - Handle acceptance flow
   - Redirect to dashboard on success

---

## Key Patterns to Follow

### Authorization Pattern
```typescript
const currentUser = await getCurrentUser()
if (!currentUser || !currentUser.org_id || currentUser.role !== 'owner') {
  return NextResponse.json(
    { error: 'You don\'t have permission to perform this action' },
    { status: 403 }
  )
}
```

### Validation Pattern
```typescript
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be editor or viewer' })
  }),
})

const body = inviteSchema.parse(await request.json())
```

### Email Service Pattern
```typescript
// Follow lib/services/payment-notifications.ts pattern
import * as brevo from '@getbrevo/brevo'

function getBrevoClient(): brevo.TransactionalEmailsApi {
  // Singleton pattern
}

// Non-blocking email sending
try {
  await sendEmail(...)
} catch (error) {
  console.error('Email sending failed:', error)
  // Don't fail the request
}
```

### Token Generation
```typescript
// Use crypto.randomUUID() - built-in, no dependencies
import { randomUUID } from 'crypto'
const token = randomUUID()
```

---

## Existing Infrastructure to Reuse

### From Story 1.9 (Account Suspension)
- ✅ `lib/services/payment-notifications.ts` - Email service pattern
- ✅ `lib/services/brevo.ts` - Brevo API client singleton
- ✅ `getCurrentUser()` helper - Returns `CurrentUser | null` with org_id, role

### From Story 1.6 (Organization Creation)
- ✅ `organizations` table exists
- ✅ `users` table exists with `org_id`, `role` columns
- ✅ Settings page structure pattern
- ✅ Form validation patterns

### From Story 1.3 (User Registration)
- ✅ Email service infrastructure
- ✅ Registration flow exists (needs invitation token integration)

---

## File Structure

**New Files:**
```
supabase/migrations/YYYYMMDDHHMMSS_add_team_invitations.sql
app/api/team/invite/route.ts
app/api/team/accept-invitation/route.ts
app/api/team/resend-invitation/route.ts
app/api/team/members/route.ts
app/api/team/update-role/route.ts
app/api/team/remove-member/route.ts
app/api/team/cancel-invitation/route.ts (optional)
lib/services/team-notifications.ts
app/settings/team/page.tsx
app/settings/team/team-members-list.tsx
app/settings/team/invite-team-member-form.tsx
app/accept-invitation/page.tsx
app/accept-invitation/accept-invitation-client.tsx
```

**Files to Modify:**
```
app/(auth)/register/page.tsx - Handle invitation_token query param
app/api/auth/login/route.ts - Handle invitation_token query param
app/settings/organization/page.tsx - Add Team Settings navigation link
```

---

## Critical Implementation Notes

### Invitation Flow
1. Owner creates invitation → `POST /api/team/invite`
2. System creates record with 7-day expiration
3. System sends email with acceptance link
4. User clicks link → `/accept-invitation?token=...`
5. If not authenticated: Redirect to register/login with token
6. If authenticated: Auto-accept, add to org, update status
7. Owner receives notification

### Edge Cases
- **User already in org:** Return error, don't create invitation
- **Pending invitation exists:** Return error, suggest resending
- **User already has org_id:** Return error on acceptance
- **Expired invitation:** Show error, allow resend
- **Owner tries to change own role:** Return error
- **Owner tries to remove self:** Return error

### Security Considerations
- Only owners can invite/manage team
- Tokens are unique UUIDs (crypto.randomUUID())
- Expiration enforced (7 days)
- Email validation (Zod schema)
- Duplicate prevention (database + API checks)

### Testing Requirements
- Unit tests: Email functions, API routes (mock Supabase, Brevo)
- Integration tests: Team Settings page, invitation acceptance flow
- E2E tests: Complete invitation flow (create → email → accept → member added)

---

## Dependencies

**Previous Stories:**
- Story 1.6: Organization creation (organizations table, users.org_id)
- Story 1.9: Email service patterns (payment-notifications.ts)

**Next Stories:**
- Story 1.11: RLS policies (will use team member org assignments)
- Story 1.12: Dashboard access (team members need dashboard access)
- Story 2.1+: Dashboard features (role-based access control)

---

## Quick Reference

**Roles:** Owner (can manage team), Editor (can edit content), Viewer (read-only)

**Invitation Expiration:** 7 days from creation

**Token Format:** UUID (crypto.randomUUID())

**Authorization:** Owner-only for all team management actions

**Email Service:** Brevo (follow payment-notifications.ts pattern)

**Database:** Supabase PostgreSQL (use existing patterns)

**Framework:** Next.js 16.1.1 App Router (server + client components)

---

*This context file provides essential information for implementing Story 1.10. For complete details, see the full story file: `1-10-team-member-invites-and-role-assignments.md`*

