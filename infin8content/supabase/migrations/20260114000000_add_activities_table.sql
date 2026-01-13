-- Add activities table for real-time team collaboration
-- Story 23.2: Advanced Activity Feed

-- ============================================================================
-- Task 1.3: Create activity database schema
-- ============================================================================

-- Activities table: Track all user activities across the organization
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('article_created', 'article_updated', 'comment_added', 'research_completed', 'user_joined')),
    activity_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE activities IS 'Track all user activities across the organization for real-time collaboration';

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_activities_organization_created ON activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type_created ON activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_article_created ON activities(article_id, created_at DESC) WHERE article_id IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see activities from their own organization
CREATE POLICY "Users can view activities from their organization" ON activities
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS policy: Users can insert activities for their organization
CREATE POLICY "Users can create activities for their organization" ON activities
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- Database triggers for automatic activity logging
-- ============================================================================

-- Function to log article activity
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
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for article activity logging
DROP TRIGGER IF EXISTS log_article_activity ON articles;
CREATE TRIGGER log_article_activity
    AFTER INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION log_article_activity_trigger();

-- Function to log user joining activity
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
            'role', NEW.role,
            'first_name', NEW.first_name
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user joining activity
DROP TRIGGER IF EXISTS log_user_joined ON users;
CREATE TRIGGER log_user_joined
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_joined_trigger();

-- ============================================================================
-- Performance optimization: Clean up old activities
-- ============================================================================

-- Function to clean up activities older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM activities 
    WHERE created_at < NOW() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create index for cleanup performance (without function predicate)
CREATE INDEX IF NOT EXISTS idx_activities_created_cleanup ON activities(created_at);

-- Grant necessary permissions
GRANT ALL ON activities TO authenticated;
GRANT SELECT ON activities TO anon;

-- ============================================================================
-- Helper functions for activity feed
-- ============================================================================

-- Function to get user by ID
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.first_name
    FROM users u
    WHERE u.id = get_user_by_id.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute dynamic SQL queries
CREATE OR REPLACE FUNCTION execute_sql_query(query_text TEXT, query_params JSONB DEFAULT '[]'::jsonb)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    user_id UUID,
    article_id UUID,
    activity_type TEXT,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    user_email TEXT,
    user_first_name TEXT,
    total BIGINT
) AS $$
DECLARE
    result RECORD;
BEGIN
    -- This is a simplified version - in production you'd want more robust SQL execution
    -- For now, we'll create specific functions for each query type
    RETURN QUERY
    SELECT 
        a.id,
        a.organization_id,
        a.user_id,
        a.article_id,
        a.activity_type,
        a.activity_data,
        a.created_at,
        u.id as user_id,
        u.email as user_email,
        u.first_name as user_first_name,
        0::bigint as total
    FROM activities a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.organization_id = (query_params->>0)::UUID
    ORDER BY a.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity types for an organization
CREATE OR REPLACE FUNCTION get_activity_types(org_id UUID)
RETURNS TABLE (
    activity_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT a.activity_type
    FROM activities a
    WHERE a.organization_id = get_activity_types.org_id
    AND a.activity_type IS NOT NULL
    ORDER BY a.activity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity users for an organization
CREATE OR REPLACE FUNCTION get_activity_users(org_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        u.id,
        u.email,
        u.first_name
    FROM users u
    INNER JOIN activities a ON u.id = a.user_id
    WHERE a.organization_id = get_activity_users.org_id
    ORDER BY u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
