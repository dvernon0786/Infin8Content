# API Contracts

**Project:** Infin8Content  
**Generated:** 2026-01-04  
**Base URL:** `/api`

## Overview

The API follows RESTful conventions using Next.js API Routes. All authentication endpoints are located under `/api/auth/`.

## Authentication Endpoints

### POST /api/auth/register

Register a new user with email and password.

**Request Body:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // Password (min length enforced by Supabase)
}
```

**Response:**
- **200 OK**: Registration successful, OTP sent to email
- **400 Bad Request**: Validation error (Zod schema validation)
- **500 Internal Server Error**: Server error (database, email service, etc.)

**Notes:**
- Creates user in Supabase Auth
- Creates user record in `users` table
- Sends 6-digit OTP via Brevo email service
- OTP expires in 10 minutes

**Related Files:**
- `app/api/auth/register/route.ts`
- `app/api/auth/register/route.test.ts`

---

### POST /api/auth/verify-otp

Verify OTP code sent to user's email.

**Request Body:**
```typescript
{
  email: string;      // User's email address
  code: string;       // 6-digit OTP code
}
```

**Response:**
- **200 OK**: OTP verified successfully, user marked as verified
- **400 Bad Request**: Invalid OTP code or expired
- **404 Not Found**: OTP code not found for email
- **500 Internal Server Error**: Server error

**Notes:**
- Validates OTP code against `otp_codes` table
- Checks expiration (10 minutes)
- Marks OTP as verified
- Updates `users.otp_verified` to `true`

**Related Files:**
- `app/api/auth/verify-otp/route.ts`

---

### POST /api/auth/resend-otp

Resend OTP code to user's email.

**Request Body:**
```typescript
{
  email: string;      // User's email address
}
```

**Response:**
- **200 OK**: New OTP sent successfully
- **400 Bad Request**: Invalid email or user not found
- **500 Internal Server Error**: Server error (email service failure)

**Notes:**
- Generates new 6-digit OTP code
- Invalidates previous OTP codes for the user
- Sends new OTP via Brevo email service
- New OTP expires in 10 minutes

**Related Files:**
- `app/api/auth/resend-otp/route.ts`

---

### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```typescript
{
  email: string;      // Valid email address
  password: string;   // User's password
}
```

**Response:**
- **200 OK**: Login successful
  ```typescript
  {
    success: true;
    user: {
      id: string;
      email: string;
      role: string;
    };
    redirectTo: '/dashboard' | '/payment' | '/create-organization';
  }
  ```
- **400 Bad Request**: Validation error (Zod schema validation)
- **401 Unauthorized**: Invalid email or password (generic error message)
- **403 Forbidden**: Email not verified (OTP verification required)
  ```typescript
  {
    error: 'Email not verified';
    redirectTo: '/verify-email?email={email}';
  }
  ```
- **500 Internal Server Error**: Server error

**Notes:**
- Authenticates user via Supabase Auth (`signInWithPassword`)
- Verifies OTP verification status (`users.otp_verified = true`)
- Checks organization membership (`users.org_id`)
- Determines redirect destination based on:
  - No organization → `/create-organization` (Story 1.6)
  - Organization exists → `/dashboard` (assumes payment confirmed, Story 1.7 will add payment check)
  - Payment not confirmed → `/payment` (Story 1.7)
- Session is automatically stored in cookies by Supabase SSR
- JWT token expiration: 24 hours (configured in Supabase)

**Error Handling:**
- Invalid credentials return generic "Invalid email or password" (prevents user enumeration)
- OTP not verified returns error with redirect to verification page
- Rate limiting handled by Supabase (no custom implementation)

**Related Files:**
- `app/api/auth/login/route.ts`
- `app/(auth)/login/page.tsx`

---

## Organization Endpoints

### POST /api/organizations/create

Create a new organization for the authenticated user.

**Request Body:**
```typescript
{
  name: string;      // Organization name (2-100 characters)
}
```

**Response:**
- **200 OK**: Organization created successfully
  ```typescript
  {
    success: true;
    organization: {
      id: string;
      name: string;
      plan: 'starter' | 'pro' | 'agency';
      created_at: string;
    };
    redirectTo: '/dashboard';
  }
  ```
- **400 Bad Request**: 
  - Validation error (Zod schema validation)
  - User already has an organization
  - Organization name already exists
- **401 Unauthorized**: Authentication required
- **404 Not Found**: User record not found
- **500 Internal Server Error**: Server error (database, etc.)

**Notes:**
- Creates organization record in `organizations` table
- Sets default plan to `'starter'`
- Links user to organization (`users.org_id = organization.id`)
- Ensures user role is set to `'owner'`
- Prevents duplicate organizations (one per user initially)
- Prevents duplicate organization names (application-level check)
- Rolls back organization creation if user update fails

**Authorization:**
- Requires authenticated user (Supabase session)
- User must not already have an organization

**Related Files:**
- `app/api/organizations/create/route.ts`
- `app/api/organizations/create/route.test.ts`
- `app/create-organization/page.tsx`
- `app/create-organization/create-organization-form.tsx`

---

### POST /api/organizations/update

Update organization name (organization owner only).

**Request Body:**
```typescript
{
  name: string;      // Organization name (2-100 characters)
}
```

**Response:**
- **200 OK**: Organization updated successfully
  ```typescript
  {
    success: true;
    organization: {
      id: string;
      name: string;
      plan: 'starter' | 'pro' | 'agency';
      created_at: string;
      updated_at: string;
    };
  }
  ```
- **400 Bad Request**: 
  - Validation error (Zod schema validation)
  - Organization name already exists
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: User is not organization owner
- **404 Not Found**: Organization not found
- **500 Internal Server Error**: Server error

**Notes:**
- Updates organization name in database
- Prevents duplicate organization names (application-level check)
- Only organization owners can update organization settings

**Authorization:**
- Requires authenticated user (Supabase session)
- User must be organization owner (`users.role = 'owner'`)
- User must belong to the organization being updated

**Related Files:**
- `app/api/organizations/update/route.ts`
- `app/api/organizations/update/route.test.ts`
- `app/settings/organization/page.tsx`
- `app/settings/organization/organization-settings-form.tsx`

---

## Authentication Flow

1. **Registration:**
   - User submits email/password → `POST /api/auth/register`
   - System creates Supabase Auth user
   - System creates user record in database
   - System generates and sends OTP via email

2. **Verification:**
   - User receives email with 6-digit OTP
   - User submits OTP → `POST /api/auth/verify-otp`
   - System validates OTP and marks user as verified

3. **Resend (if needed):**
   - User requests new OTP → `POST /api/auth/resend-otp`
   - System generates and sends new OTP

4. **Login:**
   - User submits email/password → `POST /api/auth/login`
   - System authenticates via Supabase Auth
   - System verifies OTP verification status
   - System checks organization and payment status
   - System redirects based on user state:
     - OTP not verified → `/verify-email`
     - No organization → `/create-organization`
     - Organization exists → `/dashboard` (or `/payment` if not paid)

## Middleware Protection

**File:** `app/middleware.ts`

Protected routes require:
- Valid Supabase session (authenticated)
- `otp_verified = true` in users table

Unprotected routes:
- `/register` - Registration page
- `/login` - Login page
- `/verify-email` - OTP verification page
- `/api/auth/*` - Authentication endpoints

Protected routes (require authentication + OTP verification):
- `/create-organization` - Organization creation page
- `/settings/organization` - Organization settings page
- `/api/organizations/*` - Organization endpoints

## Error Handling

All endpoints use Zod for request validation and return structured error responses:

```typescript
{
  error: string;           // Error message
  details?: any;            // Additional error details (validation errors, etc.)
}
```

## Environment Variables

Required for API functionality:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `BREVO_API_KEY` - Brevo email service API key
- `NEXT_PUBLIC_APP_URL` - Application base URL (for email links)

## Related Documentation

- [Data Models](./data-models.md) - Database schema
- [Development Guide](./development-guide.md) - Local development setup
- [Architecture](./architecture.md) - System architecture

