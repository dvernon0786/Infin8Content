-- Create Performance Metrics Table
-- Story 32.2: Efficiency & Performance Metrics
-- Task 1.3: Create performance data storage schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('article_time', 'dashboard_load', 'comment_latency', 'progress_update')),
  metric_value DECIMAL(10,3) NOT NULL CHECK (metric_value >= 0),
  target_value DECIMAL(10,3) CHECK (target_value >= 0),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT performance_metrics_check_value_positive CHECK (metric_value > 0),
  CONSTRAINT performance_metrics_check_target_positive CHECK (target_value IS NULL OR target_value > 0),
  CONSTRAINT performance_metrics_check_metadata_size CHECK (octet_length(metadata::text) <= 1024)
);

-- Create indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_created 
  ON performance_metrics(metric_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_created 
  ON performance_metrics(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_article_created 
  ON performance_metrics(article_id, created_at DESC) 
  WHERE article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_created 
  ON performance_metrics(session_id, created_at DESC) 
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at 
  ON performance_metrics(created_at DESC);

-- Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_article_time 
  ON performance_metrics(created_at DESC, metric_value) 
  WHERE metric_type = 'article_time';

CREATE INDEX IF NOT EXISTS idx_performance_metrics_dashboard_load 
  ON performance_metrics(created_at DESC, metric_value) 
  WHERE metric_type = 'dashboard_load';

-- Add RLS (Row Level Security) policies
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can read all metrics
CREATE POLICY "Admin users can view all performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Service role can insert metrics (for backend services)
CREATE POLICY "Service role can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
  );

-- Policy: Users can view their own metrics
CREATE POLICY "Users can view own performance metrics" ON performance_metrics
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Create a view for aggregated daily metrics
CREATE OR REPLACE VIEW daily_performance_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  metric_type,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as count,
  AVG(target_value) as avg_target_value,
  -- Calculate achievement rate (percentage of metrics meeting target)
  ROUND(
    COUNT(CASE WHEN metric_value <= COALESCE(target_value, metric_value) THEN 1 END) * 100.0 / 
    NULLIF(COUNT(*), 0), 2
  ) as achievement_rate_percent
FROM performance_metrics
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days' -- Only include recent data
GROUP BY DATE_TRUNC('day', created_at), metric_type
ORDER BY date DESC, metric_type;

-- Create a view for efficiency summary
CREATE OR REPLACE VIEW efficiency_summary AS
WITH recent_metrics AS (
  SELECT 
    metric_type,
    AVG(metric_value) as avg_value,
    COUNT(*) as sample_count,
    created_at
  FROM performance_metrics
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY metric_type, created_at
),
historical_metrics AS (
  SELECT 
    metric_type,
    AVG(metric_value) as avg_value
  FROM performance_metrics
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND created_at < CURRENT_DATE - INTERVAL '7 days'
  GROUP BY metric_type
)
SELECT 
  rm.metric_type,
  rm.avg_value as current_avg,
  hm.avg_value as historical_avg,
  CASE 
    WHEN hm.avg_value IS NULL THEN 'stable'
    WHEN rm.avg_value < hm.avg_value * 0.95 THEN 'improving'
    WHEN rm.avg_value > hm.avg_value * 1.05 THEN 'declining'
    ELSE 'stable'
  END as trend,
  rm.sample_count
FROM recent_metrics rm
LEFT JOIN historical_metrics hm ON rm.metric_type = hm.metric_type;

-- Grant permissions to authenticated users for views
GRANT SELECT ON daily_performance_metrics TO authenticated;
GRANT SELECT ON efficiency_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Stores performance metrics for efficiency tracking and analytics';
COMMENT ON COLUMN performance_metrics.metric_type IS 'Type of metric: article_time, dashboard_load, comment_latency, progress_update';
COMMENT ON COLUMN performance_metrics.metric_value IS 'Actual measured value (e.g., time in seconds)';
COMMENT ON COLUMN performance_metrics.target_value IS 'Target/goal value for this metric type';
COMMENT ON COLUMN performance_metrics.metadata IS 'Additional context (max 1KB)';
COMMENT ON VIEW daily_performance_metrics IS 'Daily aggregated performance metrics for dashboard analytics';
COMMENT ON VIEW efficiency_summary IS 'Efficiency summary with trends and comparisons';
