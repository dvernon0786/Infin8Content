-- Fix activity trigger to handle null user_id
-- This allows article creation without requiring a valid user_id

-- Update the trigger function to handle null created_by
CREATE OR REPLACE FUNCTION log_article_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Log article creation
    IF TG_OP = 'INSERT' THEN
        -- Only create activity if created_by is not null
        IF NEW.created_by IS NOT NULL THEN
            INSERT INTO activities (organization_id, user_id, article_id, activity_type, activity_data)
            VALUES (
                NEW.org_id,
                NEW.created_by,
                NEW.id,
                'article_created',
                jsonb_build_object(
                    'keyword', NEW.keyword,
                    'title', NEW.title,
                    'status', NEW.status
                )
            );
        END IF;
        RETURN NEW;
    END IF;
    
    -- Log article updates (only if status changed significantly)
    IF TG_OP = 'UPDATE' THEN
        -- Only log if status changed or it's been more than 5 minutes since last activity
        IF OLD.status IS DISTINCT FROM NEW.status OR
           NEW.updated_at > (
               SELECT COALESCE(MAX(created_at), '1970-01-01'::timestamp)
               FROM activities 
               WHERE article_id = NEW.id 
               AND activity_type = 'article_updated'
           ) + interval '5 minutes' THEN
            -- Only create activity if we have a valid user_id
            IF COALESCE(NEW.updated_by, NEW.created_by) IS NOT NULL THEN
                INSERT INTO activities (organization_id, user_id, article_id, activity_type, activity_data)
                VALUES (
                    NEW.org_id,
                    COALESCE(NEW.updated_by, NEW.created_by),
                    NEW.id,
                    'article_updated',
                    jsonb_build_object(
                        'keyword', NEW.keyword,
                        'title', NEW.title,
                        'old_status', OLD.status,
                        'new_status', NEW.status,
                        'change_reason', 
                        CASE 
                            WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_change'
                            ELSE 'content_update'
                        END
                    )
                );
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
