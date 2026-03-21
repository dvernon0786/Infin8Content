-- Test sequence for database setup

-- 1. Check if PL/pgSQL is available
SELECT lanname FROM pg_language WHERE lanname = 'plpgsql';

-- 2. If not, enable it (run this separately if above returns no rows)
-- CREATE EXTENSION IF NOT EXISTS plpgsql;

-- 3. Test atomic increment function (after running migrations)
SELECT increment_workflow_cost('00000000-0000-0000-0000-000000000000', 0.05);
