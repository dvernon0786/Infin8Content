-- Fix the log_user_joined_trigger to handle NULL org_id during registration
-- The trigger was failing because new users don't have organizations yet

CREATE OR REPLACE FUNCTION log_user_joined_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create activity if user has an organization
    -- During registration, org_id is NULL, so we skip activity creation
    IF NEW.org_id IS NOT NULL THEN
        INSERT INTO activities (organization_id, user_id, article_id, activity_type, activity_data)
        VALUES (
            NEW.org_id,
            NEW.id,
            NULL,
            'user_joined',
            jsonb_build_object(
                'email', NEW.email,
                'role', NEW.role,
                'first_name', NEW.first_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the trigger function
SELECT proname, prosrc FROM pg_proc WHERE proname = 'log_user_joined_trigger';
