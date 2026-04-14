-- 🛠️ RESTORE ARTICLE METADATA COLUMNS
-- Re-adding word_count and reading_time_minutes to articles table as top-level metadata.
-- These were previously dropped but are required for the read-optimized snapshot projection.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 0;

-- 🏃 REFRESH PostgREST
NOTIFY pgrst, 'reload schema';
