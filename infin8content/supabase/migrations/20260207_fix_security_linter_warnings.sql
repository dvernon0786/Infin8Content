-- Fix Database Security Linter Warnings
-- Created: 2026-02-07
-- Purpose: Fix RLS policies and function search paths identified by database linter

-- 0. CRITICAL: Fix RLS disabled tables (ERROR level)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rate_limits
CREATE POLICY "Users can view their own rate limits" ON rate_limits
    FOR SELECT USING (organization_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Service role can manage rate limits" ON rate_limits
    FOR ALL WITH CHECK (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Create RLS policies for topic_clusters
CREATE POLICY "Users can view their own topic clusters" ON topic_clusters
    FOR SELECT USING (workflow_id IN (
        SELECT id FROM intent_workflows WHERE organization_id IN (
            SELECT org_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Service role can manage topic clusters" ON topic_clusters
    FOR ALL WITH CHECK (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- 1. Fix RLS policies for debug tables to be more restrictive
-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own error logs" ON error_logs;
DROP POLICY IF EXISTS "Service role can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Users can view their own debug sessions" ON debug_sessions;
DROP POLICY IF EXISTS "Service role can manage debug sessions" ON debug_sessions;
DROP POLICY IF EXISTS "Users can view events from their sessions" ON debug_events;
DROP POLICY IF EXISTS "Service role can manage debug events" ON debug_events;

-- Create more restrictive RLS policies for error_logs
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (
        -- Allow service role to insert without user context
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR 
        -- Allow authenticated users to insert their own logs
        auth.uid() = user_id
    );

-- Create more restrictive RLS policies for debug_sessions
CREATE POLICY "Users can view their own debug sessions" ON debug_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage debug sessions" ON debug_sessions
    FOR ALL WITH CHECK (
        -- Allow service role full access
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR 
        -- Allow users to manage their own sessions
        auth.uid() = user_id
    );

-- Create more restrictive RLS policies for debug_events
CREATE POLICY "Users can view events from their sessions" ON debug_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debug_sessions 
            WHERE session_id = debug_events.session_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage debug events" ON debug_events
    FOR ALL WITH CHECK (
        -- Allow service role full access
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR 
        -- Allow users to manage events in their own sessions
        EXISTS (
            SELECT 1 FROM debug_sessions 
            WHERE session_id = debug_events.session_id 
            AND user_id = auth.uid()
        )
    );

-- 2. Fix function search_path issues
-- Update functions to set search_path explicitly
-- Using CREATE OR REPLACE to handle existing functions

-- Fix prevent_intent_audit_modification
CREATE OR REPLACE FUNCTION public.prevent_intent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent direct modifications to intent audit logs
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        RAISE EXCEPTION 'Direct modification of intent audit logs is not allowed';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_intent_workflow_creation
CREATE OR REPLACE FUNCTION public.log_intent_workflow_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (org_id, user_id, action, details)
    VALUES (
        NEW.organization_id,
        NEW.created_by,
        'workflow.intent.created',
        json_build_object(
            'workflow_id', NEW.id,
            'workflow_type', NEW.workflow_type,
            'title', NEW.title
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix cleanup_old_activities
CREATE OR REPLACE FUNCTION public.cleanup_old_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM usage_tracking 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND action NOT IN ('user.created', 'organization.created');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_article_activity_trigger
CREATE OR REPLACE FUNCTION public.log_article_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (org_id, user_id, action, details)
        VALUES (
            NEW.organization_id,
            NEW.created_by,
            'article.created',
            json_build_object('article_id', NEW.id, 'keyword', NEW.keyword)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (org_id, user_id, action, details)
        VALUES (
            NEW.organization_id,
            NEW.updated_by,
            'article.updated',
            json_build_object(
                'article_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_icp_settings_creation
CREATE OR REPLACE FUNCTION public.log_icp_settings_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (org_id, user_id, action, details)
    VALUES (
        NEW.organization_id,
        NEW.created_by,
        'icp.settings.created',
        json_build_object('icp_id', NEW.id, 'settings', NEW.settings)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_icp_settings_update
CREATE OR REPLACE FUNCTION public.log_icp_settings_update()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (org_id, user_id, action, details)
    VALUES (
        NEW.organization_id,
        NEW.updated_by,
        'icp.settings.updated',
        json_build_object(
            'icp_id', NEW.id,
            'old_settings', OLD.settings,
            'new_settings', NEW.settings
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix archive_old_intent_audit_logs
DROP FUNCTION IF EXISTS public.archive_old_intent_audit_logs();
CREATE FUNCTION public.archive_old_intent_audit_logs()
RETURNS void AS $$
BEGIN
    -- Archive intent audit logs older than 1 year to a separate table
    INSERT INTO intent_audit_logs_archive 
    SELECT * FROM intent_audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete archived records from main table
    DELETE FROM intent_audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_feature_flags_updated_at
CREATE OR REPLACE FUNCTION public.update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_feature_flag_change
CREATE OR REPLACE FUNCTION public.log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (org_id, user_id, action, details)
    VALUES (
        NEW.organization_id,
        NEW.updated_by,
        'feature_flag.updated',
        json_build_object(
            'flag_key', NEW.flag_key,
            'old_enabled', OLD.enabled,
            'new_enabled', NEW.enabled
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_user_joined_trigger
CREATE OR REPLACE FUNCTION public.log_user_joined_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (org_id, user_id, action, details)
    VALUES (
        NEW.organization_id,
        NEW.id,
        'user.joined_organization',
        json_build_object('user_id', NEW.id, 'role', NEW.role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comments for documentation
COMMENT ON COLUMN error_logs.user_id IS 'User who triggered the error (null for system errors)';
COMMENT ON COLUMN debug_sessions.user_id IS 'User who owns the debug session';
COMMENT ON COLUMN debug_events.session_id IS 'Session this event belongs to';

-- Grant necessary permissions for service role operations
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. CRITICAL: Fix Security Definer Views (ERROR level)
-- Drop and recreate views without SECURITY DEFINER

-- Fix daily_performance_metrics view
DROP VIEW IF EXISTS daily_performance_metrics;
CREATE VIEW daily_performance_metrics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    metric_type,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(*) as total_operations,
    AVG(target_value) as avg_target_value
FROM performance_metrics 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), metric_type
ORDER BY date DESC, metric_type;

-- Fix efficiency_summary view
DROP VIEW IF EXISTS efficiency_summary;
CREATE VIEW efficiency_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT a.id) as total_articles,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_articles,
    ROUND(
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT a.id), 0), 2
    ) as completion_rate
FROM organizations o
LEFT JOIN articles a ON o.id = a.org_id
GROUP BY o.id, o.name;

-- Fix enhanced_article_progress view
DROP VIEW IF EXISTS enhanced_article_progress;
CREATE VIEW enhanced_article_progress AS
SELECT 
    a.id,
    a.keyword,
    a.status,
    a.created_at,
    a.updated_at,
    a.org_id as organization_id,
    COUNT(DISTINCT s.id) as total_sections,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sections,
    ROUND(
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT s.id), 0), 2
    ) as section_completion_rate
FROM articles a
LEFT JOIN article_sections s ON a.id = s.article_id
GROUP BY a.id, a.keyword, a.status, a.created_at, a.updated_at, a.org_id;

-- Add comments for documentation
COMMENT ON VIEW daily_performance_metrics IS 'Daily performance metrics by organization (non-security-definer)';
COMMENT ON VIEW efficiency_summary IS 'Organization efficiency summary (non-security-definer)';
COMMENT ON VIEW enhanced_article_progress IS 'Enhanced article progress with section details (non-security-definer)';
