-- Fix the problematic log_user_joined_trigger
-- The trigger was trying to access NEW.first_name which doesn't exist

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS log_user_joined ON users;
DROP FUNCTION IF EXISTS log_user_joined_trigger();

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION log_user_joined_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activities (organization_id, user_id, article_id, activity_type, activity_data)
    VALUES (
        NEW.org_id,
        NEW.id,
        NULL,
        'user_joined',
        jsonb_build_object(
            'email', NEW.email,
            'role', NEW.role
            -- Removed first_name - column doesn't exist in users table
        )
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the user creation if activity logging fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER log_user_joined
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_joined_trigger();
