# Running Supabase Migrations on Hosted Project

## Current Status
- ✅ Supabase credentials configured and validated
- ⚠️  Supabase CLI needs authentication for hosted project access

## Option 1: Run Migrations via Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://supabase.com/dashboard/project/ybsgllsnaqkpxgdjdvcz
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `supabase/migrations/20260101124156_initial_schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify tables are created in **Table Editor**

## Option 2: Authenticate Supabase CLI (For Command Line)

### Step 1: Login to Supabase CLI
```bash
cd infin8content
supabase login
```
This will open a browser for authentication.

### Step 2: Link Your Project
```bash
supabase link --project-ref ybsgllsnaqkpxgdjdvcz
```

### Step 3: Run Migrations
```bash
supabase migration up
```

### Step 4: Generate Types

**Recommended:** Use the database script (works without project access):
```bash
cd infin8content
npx tsx scripts/generate-types.ts
```

**Alternative:** Use Supabase CLI (requires project access):
```bash
supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
```

## Option 3: Use Direct Database Connection (psql)

If you have `psql` installed and your `DATABASE_URL` is configured:

```bash
cd infin8content
psql "$DATABASE_URL" -f supabase/migrations/20260101124156_initial_schema.sql
```

## Verify Migration

After running the migration, verify in Supabase Dashboard:
1. Go to **Table Editor**
2. You should see:
   - `organizations` table
   - `users` table

## Generate TypeScript Types

After migration is applied, generate types:

### Method 1: Using Database Script (Recommended - Works Without CLI Access)
If you have `DATABASE_URL` configured in `.env.local`:
```bash
cd infin8content
npx tsx scripts/generate-types.ts
```

This script connects directly to your database and generates types for all tables and functions. It works even if Supabase CLI doesn't have project access.

### Method 2: Via Dashboard (Manual):
1. Go to **Settings** > **API**
2. Scroll to **Database types**
3. Select **TypeScript**
4. Copy the generated types
5. Paste into `lib/supabase/database.types.ts`

### Method 3: Via CLI (Requires Project Access):
```bash
supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
```

**Note:** The script method (Method 1) is recommended as it works reliably without requiring CLI project access privileges.

## Article Architecture Consolidation Migration (2026-02-26)

### 🚀 Purpose
Consolidate to a single FSM-driven article generation system and normalize the database schema to eliminate architectural drift.

### ⚠️ Critical Step: Schema Normalization
This migration is **destructive** for legacy tables that are no longer used. It removes:
- `article_generation_queue`
- `article_usage`
- `article_progress`

It also renames `organization_id` to `org_id` in the `articles` table to match the production FSM engine.

### How to Run
1. Go to **SQL Editor** in Supabase Dashboard.
2. Run the contents of `supabase/migrations/20260226090000_normalize_article_schema.sql`.
3. Force a schema cache refresh by running:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Verification
Run the verification query found in the `SCRATCHPAD.md` or as described in the console logs to ensure all 8 core columns are present and `LOADED`.

