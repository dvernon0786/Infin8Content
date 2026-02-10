-- Add competitors for Flowtic organization
-- First find a valid user ID, then add competitors

-- Find any user (use the first one found)
DO $$
DECLARE
    valid_user_id UUID;
    flowtic_org_id UUID := '345a53c9-6ba0-4b22-aa34-33b6c5da4aef';
BEGIN
    -- Try to find a user from auth.users
    SELECT id INTO valid_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF valid_user_id IS NOT NULL THEN
        -- Delete existing competitors
        DELETE FROM organization_competitors 
        WHERE organization_id = flowtic_org_id;
        
        -- Insert new competitors
        INSERT INTO organization_competitors (
            organization_id, 
            name, 
            url, 
            domain, 
            is_active, 
            created_at,
            created_by
        ) VALUES
            (flowtic_org_id, 'WordPress', 'https://wordpress.org', 'wordpress.org', true, NOW(), valid_user_id),
            (flowtic_org_id, 'Medium', 'https://medium.com', 'medium.com', true, NOW(), valid_user_id),
            (flowtic_org_id, 'Substack', 'https://substack.com', 'substack.com', true, NOW(), valid_user_id);
            
        RAISE NOTICE 'Added 3 competitors for Flowtic organization using user ID: %', valid_user_id;
    ELSE
        RAISE NOTICE 'No users found in the system. Cannot add competitors.';
    END IF;
END $$;

-- Verify the competitors were added
SELECT 
    id,
    name, 
    url, 
    domain, 
    is_active,
    created_at
FROM organization_competitors 
WHERE organization_id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef'
ORDER BY created_at;
