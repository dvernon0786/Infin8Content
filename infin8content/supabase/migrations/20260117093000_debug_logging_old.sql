-- Debug Logging Database Schema
-- Migration: Create tables for comprehensive debugging ecosystem
-- Created: 2026-01-17
-- Purpose: Store error logs, performance metrics, and debug sessions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Error logs table
-- Stores structured error information with context and metadata
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    stack_trace TEXT,
    component_path TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: performance_metrics table already exists from migration 20240116000000_create_performance_metrics.sql
-- We'll use the existing table with its current schema (metric_type, metric_value, no organization_id)
-- Add organization_id column for debug-specific metrics (safe approach)
DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'performance_metrics' 
        AND column_name = 'organization_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE performance_metrics ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Note: We'll handle debug metric types in the application layer since the original constraint is inline

-- Debug sessions table
-- Tracks debugging sessions for correlation and analysis
CREATE TABLE IF NOT EXISTS debug_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'production', 'test')),
    user_agent TEXT,
    ip_address INET,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Debug events table
-- Stores specific debugging events and checkpoints
CREATE TABLE IF NOT EXISTS debug_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES debug_sessions(session_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error aggregations table
-- Pre-computed error statistics for dashboard performance
CREATE TABLE IF NOT EXISTS error_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    component_path TEXT,
    error_count INTEGER NOT NULL DEFAULT 0,
    unique_users INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, level, component_path, organization_id)
);

-- Performance aggregations table
-- Pre-computed performance statistics for dashboard performance
CREATE TABLE IF NOT EXISTS performance_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    metric_type TEXT NOT NULL,
    avg_value DECIMAL(12,4) NOT NULL,
    min_value DECIMAL(12,4) NOT NULL,
    max_value DECIMAL(12,4) NOT NULL,
    p95_value DECIMAL(12,4) NOT NULL,
    sample_count INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_type, organization_id)
);

-- Indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_level_created ON error_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_created ON error_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_component_created ON error_logs(component_path, created_at DESC) WHERE component_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_session_created ON error_logs(session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_message_gin ON error_logs USING gin(to_tsvector('english', message));

-- Note: performance_metrics table already has indexes from the original migration
-- Adding additional indexes for debug-specific queries if needed
CREATE INDEX IF NOT EXISTS idx_performance_metrics_debug_created ON performance_metrics(created_at DESC) WHERE metric_type IN ('debug_error', 'debug_performance', 'debug_system');
CREATE INDEX IF NOT EXISTS idx_performance_metrics_org_created ON performance_metrics(organization_id, created_at DESC) WHERE organization_id IS NOT NULL;

-- Indexes for debug_sessions
CREATE INDEX IF NOT EXISTS idx_debug_sessions_user_started ON debug_sessions(user_id, started_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debug_sessions_org_started ON debug_sessions(organization_id, started_at DESC) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debug_sessions_environment_started ON debug_sessions(environment, started_at DESC);

-- Indexes for debug_events
CREATE INDEX IF NOT EXISTS idx_debug_events_session_timestamp ON debug_events(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_debug_events_type_timestamp ON debug_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_debug_events_name_timestamp ON debug_events(event_name, timestamp DESC);

-- Indexes for aggregations
CREATE INDEX IF NOT EXISTS idx_error_aggregations_date_level ON error_aggregations(date DESC, level);
CREATE INDEX IF NOT EXISTS idx_error_aggregations_org_date ON error_aggregations(organization_id, date DESC) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_performance_aggregations_date_metric ON performance_aggregations(date DESC, metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_aggregations_org_date ON performance_aggregations(organization_id, date DESC) WHERE organization_id IS NOT NULL;

-- Row Level Security (RLS) policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_aggregations ENABLE ROW LEVEL SECURITY;

-- RLS policies for error_logs
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all org error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE id = organization_id 
            AND user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);

-- RLS policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all org performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE id = organization_id 
            AND user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- RLS policies for debug_sessions
CREATE POLICY "Users can view their own debug sessions" ON debug_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all org debug sessions" ON debug_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE id = organization_id 
            AND user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "System can manage debug sessions" ON debug_sessions
    FOR ALL WITH CHECK (true);

-- RLS policies for debug_events
CREATE POLICY "Users can view events from their sessions" ON debug_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debug_sessions 
            WHERE session_id = debug_events.session_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all org debug events" ON debug_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM debug_sessions ds
            WHERE ds.session_id = debug_events.session_id 
            AND ds.organization_id = (
                SELECT id FROM organizations 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'super_admin')
                LIMIT 1
            )
        )
    );

CREATE POLICY "System can manage debug events" ON debug_events
    FOR ALL WITH CHECK (true);

-- RLS policies for aggregations (read-only for users)
CREATE POLICY "Users can view org error aggregations" ON error_aggregations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE id = organization_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view org performance aggregations" ON performance_aggregations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE id = organization_id 
            AND user_id = auth.uid()
        )
    );

-- Functions for data cleanup and maintenance

-- Function to clean up old debug data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_debug_data()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    error_retention_days INTEGER := COALESCE(NULLIF(current_setting('app.debug_log_retention_days', true), '')::INTEGER, 90);
    metrics_retention_days INTEGER := COALESCE(NULLIF(current_setting('app.debug_metrics_retention_days', true), '')::INTEGER, 30);
    sessions_retention_days INTEGER := COALESCE(NULLIF(current_setting('app.debug_sessions_retention_days', true), '')::INTEGER, 7);
BEGIN
    -- Clean up old error logs
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * error_retention_days;
    
    -- Clean up old performance metrics
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '1 day' * metrics_retention_days;
    
    -- Clean up old debug sessions and their events
    DELETE FROM debug_events 
    WHERE session_id IN (
        SELECT session_id FROM debug_sessions 
        WHERE started_at < NOW() - INTERVAL '1 day' * sessions_retention_days
    );
    
    DELETE FROM debug_sessions 
    WHERE started_at < NOW() - INTERVAL '1 day' * sessions_retention_days;
    
    -- Clean up old aggregations (keep 1 year)
    DELETE FROM error_aggregations 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
    
    DELETE FROM performance_aggregations 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
    
    RAISE NOTICE 'Debug data cleanup completed';
END;
$$;

-- Function to update error aggregations
CREATE OR REPLACE FUNCTION update_error_aggregations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO error_aggregations (date, level, component_path, error_count, unique_users, organization_id)
    SELECT 
        DATE(created_at) as date,
        level,
        component_path,
        COUNT(*) as error_count,
        COUNT(DISTINCT user_id) as unique_users,
        organization_id
    FROM error_logs 
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY DATE(created_at), level, component_path, organization_id
    ON CONFLICT (date, level, component_path, organization_id)
    DO UPDATE SET
        error_count = EXCLUDED.error_count,
        unique_users = EXCLUDED.unique_users,
        updated_at = NOW();
END;
$$;

-- Function to update performance aggregations
CREATE OR REPLACE FUNCTION update_performance_aggregations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO performance_aggregations (date, metric_type, avg_value, min_value, max_value, p95_value, sample_count, organization_id)
    SELECT 
        DATE(created_at) as date,
        metric_type,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_value,
        COUNT(*) as sample_count,
        organization_id
    FROM performance_metrics 
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY DATE(created_at), metric_type, organization_id
    ON CONFLICT (date, metric_type, organization_id)
    DO UPDATE SET
        avg_value = EXCLUDED.avg_value,
        min_value = EXCLUDED.min_value,
        max_value = EXCLUDED.max_value,
        p95_value = EXCLUDED.p95_value,
        sample_count = EXCLUDED.sample_count,
        updated_at = NOW();
END;
$$;

-- Create a scheduled job for daily cleanup and aggregation (requires pg_cron extension)
-- This would be enabled separately with: SELECT cron.schedule('debug-maintenance', '0 2 * * *', 'SELECT cleanup_debug_data(); SELECT update_error_aggregations(); SELECT update_performance_aggregations();');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON error_logs, performance_metrics, debug_sessions, debug_events TO authenticated;
GRANT SELECT ON error_aggregations, performance_aggregations TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE error_logs IS 'Stores structured error logs with context and metadata for debugging';
COMMENT ON TABLE performance_metrics IS 'Stores application performance metrics and system health data';
COMMENT ON TABLE debug_sessions IS 'Tracks debugging sessions for correlation and analysis';
COMMENT ON TABLE debug_events IS 'Stores specific debugging events and checkpoints';
COMMENT ON TABLE error_aggregations IS 'Pre-computed error statistics for dashboard performance';
COMMENT ON TABLE performance_aggregations IS 'Pre-computed performance statistics for dashboard performance';

COMMENT ON COLUMN error_logs.level IS 'Log level: debug, info, warn, error';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context data as JSON';
COMMENT ON COLUMN performance_metrics.tags IS 'Tags for categorizing and filtering metrics';
COMMENT ON COLUMN debug_sessions.environment IS 'Environment: development, production, test';
COMMENT ON COLUMN debug_sessions.metadata IS 'Session metadata like browser info, device info';
