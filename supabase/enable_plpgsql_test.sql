-- Test PL/pgSQL availability
SELECT lanname FROM pg_language WHERE lanname = 'plpgsql';

-- If no rows returned, run this:
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- Then test again
SELECT lanname FROM pg_language WHERE lanname = 'plpgsql';
