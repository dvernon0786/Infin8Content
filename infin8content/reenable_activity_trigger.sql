-- Re-enable article activity trigger for production
-- This restores activity logging functionality that was disabled for testing

CREATE TRIGGER log_article_activity
    AFTER INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION log_article_activity_trigger();
