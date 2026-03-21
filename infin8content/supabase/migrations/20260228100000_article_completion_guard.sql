-- 🛡️ DB GUARD: Article Completion Integrity Logic
-- Ensures no article can transition to 'completed' status if any linked sections are not 'completed' or 'failed'.
-- This provides mathematical closure for the Article Generation architecture.

CREATE OR REPLACE FUNCTION ensure_all_sections_completed()
RETURNS TRIGGER AS $$
BEGIN
    -- Only intercept transitions to 'completed' status
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        IF EXISTS (
            SELECT 1 
            FROM article_sections 
            WHERE article_id = NEW.id 
            AND status <> 'completed'
        ) THEN
            RAISE EXCEPTION 'Architectural violation: Cannot mark article % completed while sections are still in progress or failed.', NEW.id;
        END IF;

        -- Ensure sections JSONB snapshot is not empty
        IF NEW.sections IS NULL OR jsonb_array_length(NEW.sections) = 0 THEN
             RAISE EXCEPTION 'Architectural violation: Cannot mark article % completed with an empty sections snapshot.', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DROP IF EXISTS to ensure idempotency
DROP TRIGGER IF EXISTS article_completion_guard ON articles;

CREATE TRIGGER article_completion_guard
BEFORE UPDATE ON articles
FOR EACH ROW 
EXECUTE FUNCTION ensure_all_sections_completed();

-- 🏃 REFRESH PostgREST
NOTIFY pgrst, 'reload schema';
