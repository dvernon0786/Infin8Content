# Data Models

**Project:** Infin8Content  
**Generated:** 2026-01-04  
**Database:** Supabase PostgreSQL

## Overview

The database schema implements a multi-tenant architecture with organizations, users, and OTP verification. All tables use UUID primary keys and include timestamps for audit trails.

## Tables

### organizations

Multi-tenant organization table with plan-based feature gating.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Organization identifier |
| `name` | TEXT | NOT NULL | Organization name |
| `plan` | TEXT | NOT NULL, CHECK IN ('starter', 'pro', 'agency') | Subscription plan tier |
| `white_label_settings` | JSONB | DEFAULT '{}'::jsonb | White-label branding configuration |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_organizations_id` - Primary key index

**Triggers:**
- `update_organizations_updated_at` - Automatically updates `updated_at` on row updates

**Migration:** `20260101124156_initial_schema.sql`

---

### users

User table linked to organizations with RBAC roles.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | User identifier |
| `email` | TEXT | NOT NULL, UNIQUE | User email address |
| `org_id` | UUID | NULLABLE, REFERENCES organizations(id) ON DELETE CASCADE | Organization foreign key (nullable until org created) |
| `auth_user_id` | UUID | NULLABLE, REFERENCES auth.users(id) ON DELETE CASCADE | Supabase Auth user link |
| `role` | TEXT | NOT NULL, CHECK IN ('owner', 'editor', 'viewer') | RBAC role |
| `otp_verified` | BOOLEAN | DEFAULT FALSE | OTP verification status |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_users_org_id` - Foreign key index for multi-tenant queries
- `idx_users_email` - Unique email lookup
- `idx_users_auth_user_id` - Supabase Auth user lookup
- `idx_users_otp_verified` - OTP verification status queries

**Relationships:**
- `org_id` → `organizations.id` (CASCADE delete)
- `auth_user_id` → `auth.users.id` (CASCADE delete)

**Migrations:**
- `20260101124156_initial_schema.sql` - Initial table creation
- `20260104095303_link_auth_users.sql` - Added `auth_user_id`, made `org_id` nullable
- `20260104100500_add_otp_verification.sql` - Added `otp_verified` column

---

### otp_codes

Temporary storage for OTP codes sent via Brevo email service.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | OTP record identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User foreign key |
| `email` | TEXT | NOT NULL | Email address OTP was sent to |
| `code` | TEXT | NOT NULL | 6-digit OTP code |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | OTP expiration timestamp (10 minutes) |
| `verified_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | OTP verification timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_otp_codes_user_id` - User lookup
- `idx_otp_codes_email` - Email lookup
- `idx_otp_codes_code` - Code verification lookup
- `idx_otp_codes_expires_at` - Cleanup queries

**Relationships:**
- `user_id` → `users.id` (CASCADE delete)

**Cleanup:**
- Function `cleanup_expired_otp_codes()` available for periodic cleanup
- OTP codes expire after 10 minutes

**Migration:** `20260104100500_add_otp_verification.sql`

---

## Database Functions

### update_updated_at_column()

Automatically updates `updated_at` timestamp on row updates.

**Usage:** Trigger function for `organizations.updated_at`

**Migration:** `20260101124156_initial_schema.sql`

---

### cleanup_expired_otp_codes()

Deletes expired OTP codes from `otp_codes` table.

**Usage:** Can be called periodically via cron job or scheduled task

**Migration:** `20260104100500_add_otp_verification.sql`

---

## TypeScript Types

Auto-generated TypeScript types are available in:
- `lib/supabase/database.types.ts`

**Generation Methods:**

### Method 1: Using Database Script (Recommended)
If you have `DATABASE_URL` configured in `.env.local`:
```bash
cd infin8content
npx tsx scripts/generate-types.ts
```

This script queries the database schema directly and generates types for all tables and functions.

### Method 2: Supabase CLI (Requires Project Access)
If you have Supabase CLI authenticated with project access:
```bash
supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
```

### Method 3: Supabase Dashboard (Manual)
1. Go to **Settings** > **API** in your Supabase project
2. Scroll to **Database types** section
3. Select **TypeScript** format
4. Copy and paste into `lib/supabase/database.types.ts`

**Note:** Types should be regenerated after any database schema changes (migrations).

## Migration History

1. **20260101124156_initial_schema.sql**
   - Creates `organizations` table
   - Creates `users` table
   - Creates indexes and triggers

2. **20260104095303_link_auth_users.sql**
   - Makes `users.org_id` nullable
   - Adds `users.auth_user_id` column
   - Links to Supabase Auth

3. **20260104100500_add_otp_verification.sql**
   - Creates `otp_codes` table
   - Adds `users.otp_verified` column
   - Creates cleanup function

## Schema Relationships

```
organizations (1) ──< (many) users
                         │
                         │ (1)
                         │
                         └──< (many) otp_codes

auth.users (1) ──< (1) users
```

## Row Level Security (RLS)

RLS policies are expected to be implemented in future migrations to enforce:
- Multi-tenant data isolation
- Role-based access control
- User data privacy

## Related Documentation

- [API Contracts](./api-contracts.md) - API endpoints using these models
- [Architecture](./architecture.md) - System architecture
- [Development Guide](./development-guide.md) - Database setup instructions

