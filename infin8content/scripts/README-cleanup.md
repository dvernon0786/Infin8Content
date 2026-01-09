# Database Cleanup Scripts for Testing

## Purpose
Delete all user data from the database to allow email reuse during testing.

## Files

### 1. `cleanup-test-data.sql`
**Main cleanup script for application data**

**What it deletes:**
- `article_progress` - All progress tracking records
- `articles` - All article records  
- `organizations` - All organization records

**How to use:**
```sql
-- Copy and paste into Supabase SQL Editor
-- Or run via psql: psql -f cleanup-test-data.sql
```

### 2. `cleanup-auth-users.sql`
**Auth users cleanup guide**

**Important Notes:**
- Auth users (`auth.users`) cannot be deleted via SQL due to security restrictions
- Must use Supabase Dashboard or Admin API
- Script provides user list for manual deletion

**Recommended Steps:**
1. Run `cleanup-test-data.sql` first
2. Go to Supabase Dashboard > Authentication > Users
3. Select all users and click "Delete"
4. Confirm deletion

## Complete Cleanup Process

### Step 1: Application Data (SQL)
```sql
-- Run cleanup-test-data.sql in Supabase SQL Editor
-- This deletes all articles, organizations, and progress data
```

### Step 2: Auth Users (Dashboard)
1. Open Supabase Dashboard
2. Go to Authentication → Users
3. Select all users (Ctrl+A or Cmd+A)
4. Click "Delete" button
5. Confirm deletion

### Step 3: Verification
```sql
-- Check remaining data
SELECT 'articles' as table_name, COUNT(*) as record_count FROM public.articles
UNION ALL
SELECT 'organizations' as table_name, COUNT(*) as record_count FROM public.organizations
UNION ALL
SELECT 'article_progress' as table_name, COUNT(*) as record_count FROM public.article_progress;
```

## Alternative Methods

### Method A: TypeScript Script
```bash
cd infin8content
npx tsx scripts/cleanup-test-data.ts
```

### Method B: Supabase Dashboard
1. **Tables**: Go to Table Editor → Select table → Delete all rows
2. **Auth Users**: Authentication → Users → Select all → Delete

### Method C: API
```bash
# Requires service_role key
curl -X DELETE "https://your-project.supabase.co/auth/v1/admin/users/{user_id}" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Safety Notes

⚠️ **WARNING**: This will permanently delete all data!

- **Backup first**: Export any important data before cleanup
- **Test environment only**: Use only in development/testing
- **Confirm email**: Verify the email you want to reuse
- **Check subscriptions**: Cancel any active subscriptions first

## After Cleanup

✅ **Email is available for reuse**
✅ **Database is clean for testing**
✅ **No leftover data conflicts**

## Troubleshooting

### RLS Issues
If you get permission errors:
```sql
-- Temporarily disable RLS
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
-- Run cleanup
-- Re-enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
```

### Auth User Deletion
If SQL deletion fails:
- Use Supabase Dashboard (recommended)
- Use Admin API with service_role key
- Contact Supabase support for bulk deletion

## Verification

After cleanup, verify with:
```bash
cd infin8content
npx tsx scripts/verify-cleanup.ts
```

This should show 0 records for all tables.
