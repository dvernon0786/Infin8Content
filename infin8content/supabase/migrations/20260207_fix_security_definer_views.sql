-- Fix Security Definer Views - Follow-up Migration
-- Created: 2026-02-07
-- Purpose: Explicitly remove SECURITY DEFINER from views that still have it

-- Drop and recreate views without SECURITY DEFINER
-- These views were recreated but may still have SECURITY DEFINER property

DROP VIEW IF EXISTS daily_performance_metrics CASCADE;
CREATE VIEW daily_performance_metrics WITH (security_invoker) AS
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

DROP VIEW IF EXISTS efficiency_summary CASCADE;
CREATE VIEW efficiency_summary WITH (security_invoker) AS
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

DROP VIEW IF EXISTS enhanced_article_progress CASCADE;
CREATE VIEW enhanced_article_progress WITH (security_invoker) AS
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

-- Grant permissions to authenticated users
GRANT SELECT ON daily_performance_metrics TO authenticated;
GRANT SELECT ON efficiency_summary TO authenticated;
GRANT SELECT ON enhanced_article_progress TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW daily_performance_metrics IS 'Daily performance metrics by type (security_invoker)';
COMMENT ON VIEW efficiency_summary IS 'Organization efficiency summary (security_invoker)';
COMMENT ON VIEW enhanced_article_progress IS 'Enhanced article progress with section details (security_invoker)';
