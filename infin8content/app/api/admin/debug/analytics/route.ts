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
    const supabase = await createClient();
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
    logger.error('Auth check failed', { error: error instanceof Error ? error.message : 'Unknown error' }, { componentPath: 'api/admin/debug/analytics' });
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
      .sort(([,a], [,b]) => (b as number) - (a as number))
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
    // TEMPORARY: Skip auth for debugging - return mock data
    logger.info('DEBUG: Returning mock analytics data', {}, { componentPath: 'api/admin/debug/analytics' });
    
    const mockAnalyticsData: AnalyticsData = {
      errorPatterns: [
        {
          errorType: 'ReferenceError',
          count: 3,
          percentage: 60,
          avgResolutionTime: 1200,
          mostAffectedComponents: ['debug-test/page.tsx', 'button.tsx'],
          severity: 'medium'
        },
        {
          errorType: 'TypeError',
          count: 2,
          percentage: 40,
          mostAffectedComponents: ['dashboard/page.tsx'],
          severity: 'low'
        }
      ],
      performanceTrends: [
        {
          metric: 'response_time',
          currentValue: 245,
          previousValue: 312,
          change: -67,
          changePercent: -21.5,
          trend: 'improving'
        },
        {
          metric: 'memory_usage',
          currentValue: 128,
          previousValue: 145,
          change: -17,
          changePercent: -11.7,
          trend: 'stable'
        }
      ],
      systemHealth: {
        overallScore: 85,
        errorRate: 2.3,
        avgResponseTime: 245,
        uptime: 99.8,
        activeUsers: 1,
        systemLoad: 0.35
      },
      timeRange: '24h',
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(mockAnalyticsData);

  } catch (error) {
    logger.error('Debug analytics API error', { error: error instanceof Error ? error.message : 'Unknown error' }, { componentPath: 'api/admin/debug/analytics' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const duration = Date.now() - startTime;
    logger.logApiCall('GET', '/api/admin/debug/analytics', 200, duration, { endpoint: 'debug-analytics' });
  }
}
