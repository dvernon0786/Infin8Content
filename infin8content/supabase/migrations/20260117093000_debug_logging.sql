-- Simple Debug Logging Database Schema
-- Migration: Add organization_id to existing performance_metrics table
-- Created: 2026-01-17
-- Purpose: Add organization_id column for debug functionality

-- Add organization_id column to existing performance_metrics table
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

-- Create basic debug tables (without organization_id references for now)
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

CREATE TABLE IF NOT EXISTS debug_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'production', 'test')),
    user_agent TEXT,
    ip_address INET,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS debug_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES debug_sessions(session_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_level_created ON error_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_created ON error_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_component_created ON error_logs(component_path, created_at DESC) WHERE component_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_session_created ON error_logs(session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_message_gin ON error_logs USING gin(to_tsvector('english', message));

CREATE INDEX IF NOT EXISTS idx_debug_sessions_user_started ON debug_sessions(user_id, started_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_debug_sessions_environment_started ON debug_sessions(environment, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_debug_events_session_timestamp ON debug_events(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_debug_events_type_timestamp ON debug_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_debug_events_name_timestamp ON debug_events(event_name, timestamp DESC);

-- Row Level Security (RLS) policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for error_logs
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);

-- RLS policies for debug_sessions
CREATE POLICY "Users can view their own debug sessions" ON debug_sessions
    FOR SELECT USING (auth.uid() = user_id);

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

CREATE POLICY "System can manage debug events" ON debug_events
    FOR ALL WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON error_logs, debug_sessions, debug_events TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE error_logs IS 'Stores structured error logs with context and metadata for debugging';
COMMENT ON TABLE debug_sessions IS 'Tracks debugging sessions for correlation and analysis';
COMMENT ON TABLE debug_events IS 'Stores specific debugging events and checkpoints';

COMMENT ON COLUMN error_logs.level IS 'Log level: debug, info, warn, error';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context data as JSON';
COMMENT ON COLUMN debug_sessions.environment IS 'Environment: development, production, test';
COMMENT ON COLUMN debug_sessions.metadata IS 'Session metadata like browser info, device info';
