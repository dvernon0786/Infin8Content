#!/bin/bash
# Run Supabase migration using DATABASE_URL
# This script runs the migration directly via psql

set -e

cd "$(dirname "$0")/.."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  # Try to load from .env.local
  if [ -f .env.local ]; then
    export $(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | xargs)
    DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | head -1)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in environment or .env.local"
  echo "   Please set DATABASE_URL or ensure .env.local has it configured"
  exit 1
fi

MIGRATION_FILE="supabase/migrations/20260101124156_initial_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "🔧 Running Supabase Migration..."
echo "📁 Migration file: $MIGRATION_FILE"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ psql is not installed"
  echo ""
  echo "Alternative: Run migration via Supabase Dashboard:"
  echo "1. Go to: https://supabase.com/dashboard/project/ybsgllsnaqkpxgdjdvcz"
  echo "2. Click 'SQL Editor' in left sidebar"
  echo "3. Click 'New query'"
  echo "4. Copy contents of $MIGRATION_FILE"
  echo "5. Paste and click 'Run'"
  exit 1
fi

# Run migration
echo "Running migration..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Verify tables in Supabase Dashboard > Table Editor"
  echo "2. Generate TypeScript types:"
  echo "   supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts"
else
  echo ""
  echo "❌ Migration failed"
  echo "Check the error message above"
  exit 1
fi

