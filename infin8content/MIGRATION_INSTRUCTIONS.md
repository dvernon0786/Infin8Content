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

### Via Dashboard (Manual):
1. Go to **Settings** > **API**
2. Scroll to **Database types**
3. Select **TypeScript**
4. Copy the generated types
5. Paste into `lib/supabase/database.types.ts`

### Via CLI (After authentication):
```bash
supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
```

## Current Migration File
Location: `supabase/migrations/20260101124156_initial_schema.sql`

This migration creates:
- `organizations` table (multi-tenant organization data)
- `users` table (user data with org_id foreign key)
- Indexes and constraints
- Trigger for `updated_at` timestamp

