/**
 * Debug Analytics API Endpoint
 * Creates analytics endpoint for debugging insights and trends
 * Aggregates error patterns, performance bottlenecks, and system health trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

interface AnalyticsData {
  errorPatterns: ErrorPattern[];
  performanceTrends: PerformanceTrend[];
  systemHealth: SystemHealthMetrics;
  timeRange: string;
  generatedAt: string;
}

interface ErrorPattern {
  errorType: string;
  count: number;
  percentage: number;
  avgResolutionTime?: number;
  mostAffectedComponents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'degrading' | 'stable';
}

interface SystemHealthMetrics {
  overallScore: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
  activeUsers: number;
  systemLoad: number;
}

async function requireAdminAuth(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    return { user, profile };
  } catch (error) {
    logger.error('Auth check failed', { error: error.message }, { componentPath: 'api/admin/debug/analytics' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateErrorPatterns(errorLogs: any[]): ErrorPattern[] {
  // Group errors by error type/message patterns
  const errorGroups = new Map<string, any[]>();
  
  errorLogs.forEach(log => {
    const errorType = log.message.split(':')[0] || 'Unknown';
    if (!errorGroups.has(errorType)) {
      errorGroups.set(errorType, []);
    }
    errorGroups.get(errorType)!.push(log);
  });

  const totalErrors = errorLogs.length;
  const patterns: ErrorPattern[] = [];

  errorGroups.forEach((logs, errorType) => {
    const count = logs.length;
    const percentage = (count / totalErrors) * 100;
    
    // Determine severity based on error level
    const severityLevels = logs.map(log => log.level);
    const severityCounts = severityLevels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (severityCounts.error > 0) severity = 'critical';
    else if (severityCounts.warn > count * 0.5) severity = 'high';
    else if (severityCounts.warn > count * 0.2) severity = 'medium';

    // Get most affected components
    const componentCounts = logs.reduce((acc, log) => {
      const component = log.component_path || 'Unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostAffectedComponents = Object.entries(componentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([component]) => component);

    patterns.push({
      errorType,
      count,
      percentage: Math.round(percentage * 10) / 10,
      severity,
      mostAffectedComponents
    });
  });

  return patterns.sort((a, b) => b.count - a.count);
}

function calculatePerformanceTrends(metrics: any[]): PerformanceTrend[] {
  const metricGroups = new Map<string, any[]>();
  
  metrics.forEach(metric => {
    if (!metricGroups.has(metric.metric_type)) {
      metricGroups.set(metric.metric_type, []);
    }
    metricGroups.get(metric.metric_type)!.push(metric);
  });

  const trends: PerformanceTrend[] = [];

  metricGroups.forEach((values, metricType) => {
    if (values.length < 2) return;

    // Sort by timestamp
    values.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const currentValue = values[values.length - 1].metric_value;
    const previousValue = values[0].metric_value;
    const change = currentValue - previousValue;
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = changePercent > 0 ? 'degrading' : 'improving';
    }

    trends.push({
      metric: metricType,
      currentValue,
      previousValue,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      trend
    });
  });

  return trends;
}

function calculateSystemHealth(errorLogs: any[], metrics: any[]): SystemHealthMetrics {
  const totalErrors = errorLogs.length;
  const totalLogs = errorLogs.length; // Simplified - would include all log levels
  const errorRate = totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0;

  // Calculate average response time from metrics
  const responseTimeMetrics = metrics.filter(m => m.metric_type.includes('response_time'));
  const avgResponseTime = responseTimeMetrics.length > 0
    ? responseTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / responseTimeMetrics.length
    : 0;

  // Simplified calculations for demo
  const uptime = 99.9; // Would be calculated from actual uptime data
  const activeUsers = 42; // Would be calculated from user activity
  const systemLoad = 65; // Would be calculated from system metrics

  // Calculate overall health score
  let healthScore = 100;
  healthScore -= errorRate * 2; // Penalize errors heavily
  healthScore -= Math.max(0, (avgResponseTime - 1000) / 50); // Penalize slow response times
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    overallScore: Math.round(healthScore),
    errorRate: Math.round(errorRate * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime),
    uptime,
    activeUsers,
    systemLoad
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check authentication
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (timeRange === '24h') {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (startDate) {
      start = new Date(startDate);
      end = endDate ? new Date(endDate) : now;
    }

    const supabase = createClient();

    // Fetch error logs
    const { data: errorLogs, error: logsError } = await supabase
      .from('error_logs')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (logsError) {
      logger.error('Failed to fetch error logs for analytics', { error: logsError.message }, { componentPath: 'api/admin/debug/analytics' });
      return NextResponse.json({ error: 'Failed to fetch error logs' }, { status: 500 });
    }

    // Fetch performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (metricsError) {
      logger.error('Failed to fetch performance metrics for analytics', { error: metricsError.message }, { componentPath: 'api/admin/debug/analytics' });
      return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 500 });
    }

    // Calculate analytics
    const errorPatterns = calculateErrorPatterns(errorLogs || []);
    const performanceTrends = calculatePerformanceTrends(metrics || []);
    const systemHealth = calculateSystemHealth(errorLogs || [], metrics || []);

    const analyticsData: AnalyticsData = {
      errorPatterns,
      performanceTrends,
      systemHealth,
      timeRange,
      generatedAt: new Date().toISOString()
    };

    logger.info('Debug analytics generated', {
      timeRange,
      errorPatternsCount: errorPatterns.length,
      performanceTrendsCount: performanceTrends.length,
      systemHealthScore: systemHealth.overallScore
    }, { componentPath: 'api/admin/debug/analytics' });

    return NextResponse.json(analyticsData);

  } catch (error) {
    logger.error('Debug analytics API error', { error: error.message }, { componentPath: 'api/admin/debug/analytics' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const duration = Date.now() - startTime;
    logger.logApiCall('GET', '/api/admin/debug/analytics', 200, duration, { endpoint: 'debug-analytics' });
  }
}
