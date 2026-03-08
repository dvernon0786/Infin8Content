# Migration Instructions & System State Management

This document provides a history of critical system migrations for Infin8Content and instructions for applying future state changes.

## 1. Database Migrations (Supabase)

The project uses SQL-based migrations located in `supabase/migrations/`. 

### How to Apply Migrations
#### Option A: Supabase Dashboard (Recommended for quick fixes)
1. Go to the [SQL Editor](https://supabase.com/dashboard/project/ybsgllsnaqkpxgdjdvcz).
2. Create a "New query" and paste the contents of the desired migration file.
3. Click "Run".

#### Option B: Supabase CLI (Recommended for development)
```bash
cd infin8content
supabase login
supabase link --project-ref ybsgllsnaqkpxgdjdvcz
supabase migration up
```

## 2. Critical Migration History

| Date | Migration | Impact |
| :--- | :--- | :--- |
| 2026-03-05 | `add_trial_plan_type.sql` | Introduces the `trial` enum value to subscription plans. |
| 2026-02-26 | `normalize_article_schema.sql` | **Destructive**. Removes legacy queue tables and renames columns to align with the FSM engine. |
| 2026-02-22 | `create_system_user.sql` | Establishes a system-level UUID for background automated actions. |
| 2026-01-31 | `create_intent_workflows.sql` | Adds the state tracking for the 9-step onboarding wizard. |

## 3. Data Integrity & State Purge

To completely reset a user's environment while preserving the organization structure, use `scripts/delete-test-users-final.sql`. This script handles the cascading deletion of:
- `activities`
- `articles` & `article_sections`
- `keyword_research`
- `intent_workflows`

## 4. TypeScript Type Generation

Whenever the database schema changes, you **must** synchronize the TypeScript definitions:

```bash
cd infin8content
npx tsx scripts/generate-types.ts
```
*Note: This script requires a valid `DATABASE_URL` in `.env.local`.*

## 5. Inngest Workflow Sync

When adding or modifying Inngest functions:
1. Ensure the function is exported in `lib/inngest/client.ts`.
2. Push the changes to the hosted environment (automatic for Vercel).
3. If using the Inngest Dev Server, refresh it to detect the new schema.

---
_Last Updated: 2026-03-08_
