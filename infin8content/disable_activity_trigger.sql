-- Temporarily disable article activity trigger for testing
-- This will be re-enabled after testing is complete

DROP TRIGGER IF EXISTS log_article_activity ON articles;
