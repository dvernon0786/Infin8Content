/**
 * Performance Metrics Dashboard Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 1: Performance Metrics Dashboard Infrastructure
 * 
 * Comprehensive admin dashboard for monitoring system performance,
 * Epic 20 optimization effectiveness, and real-time system health.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// Import dashboard components
import { GenerationMetricsCard } from './generation-metrics-card';
import { ResearchMetricsCard } from './research-metrics-card';
import { ContextMetricsCard } from './context-metrics-card';
import { SystemHealthCard } from './system-health-card';
import { PerformanceAlerts } from './performance-alerts';
import { HistoricalTrendsChart } from './historical-trends-chart';

export interface PerformanceMetricsResponse {
  generationMetrics: GenerationMetrics;
  researchMetrics: ResearchMetrics;
  contextMetrics: ContextMetrics;
  systemHealth: SystemHealth;
  historicalTrends: HistoricalTrends;
  alerts?: PerformanceAlert[];
  timeRange: string;
  lastUpdated: string;
}

export interface GenerationMetrics {
  avgGenerationTime: number;
  apiCallReduction: number; // percentage
  parallelProcessingEfficiency: number;
  throughputPerHour: number;
  retryRate: number;
  totalCompleted: number;
  currentlyGenerating: number;
  epic20Comparison: {
    timeReduction: number;
    apiCallReduction: number;
    retryReduction: number;
  };
}

export interface ResearchMetrics {
  tavilyApiCallsPerArticle: number;
  researchCacheHitRate: number;
  costSavingsPerArticle: number;
  researchTimeReduction: number;
}

export interface ContextMetrics {
  tokenUsagePerArticle: number;
  contextBuildingTime: number;
  memoryUsagePerGeneration: number;
  contextOptimizationEfficiency: number;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  activeGenerations: number;
  queueLength: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface HistoricalTrends {
  generationTime: Array<{ timestamp: string; value: number }>;
  apiCalls: Array<{ timestamp: string; value: number }>;
  throughput: Array<{ timestamp: string; value: number }>;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: string;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
}

interface PerformanceDashboardProps {
  orgId: string;
  refreshInterval?: number; // default 30 seconds
  showAlerts?: boolean;
  className?: string;
}

export function PerformanceDashboard({
  orgId,
  refreshInterval = 30000,
  showAlerts = true,
  className = '',
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  // Initialize Supabase client
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
  }, []);

  // Real-time subscription handler
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Real-time update received:', payload);
    // Refresh metrics when database changes occur
    fetchMetrics();
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!supabase || !orgId) return;

    const channel = supabase
      .channel('performance-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
          filter: `org_id=eq.${orgId}`
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_progress',
        },
        handleRealtimeUpdate
      )
      .subscribe((status: any) => {
        console.log('Real-time subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [supabase, orgId, handleRealtimeUpdate]);

  // Fetch performance metrics
  const fetchMetrics = async (selectedTimeRange?: string) => {
    try {
      setError(null);
      const range = selectedTimeRange || timeRange;
      const response = await fetch(
        `/api/admin/performance/metrics?orgId=${orgId}&timeRange=${range}&includeAlerts=${showAlerts}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Performance metrics fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchMetrics();
    
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchMetrics();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [orgId, refreshInterval]);

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
    setLoading(true);
    fetchMetrics(newTimeRange);
  };

  // Manual refresh
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
  };

  // Get system status color
  const getSystemStatusColor = (status: SystemHealth['systemStatus']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Performance Metrics Dashboard</h1>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="font-medium">Failed to load performance metrics</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
          <Button 
            onClick={() => fetchMetrics()} 
            variant="outline" 
            className="mt-4 font-lato text-neutral-600 hover:text-[--color-primary-blue]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Performance Metrics Dashboard</h1>
            <p className="text-sm text-gray-600">
              Real-time monitoring of Epic 20 optimization effectiveness
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time Connection Status */}
          <Badge className={cn(
            'text-xs',
            realtimeConnected 
              ? 'text-green-600 bg-green-100' 
              : 'text-gray-600 bg-gray-100'
          )}>
            {realtimeConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Polling
              </>
            )}
          </Badge>

          {/* System Status Badge */}
          <Badge className={cn('text-xs', getSystemStatusColor(metrics.systemHealth.systemStatus))}>
            {metrics.systemHealth.systemStatus === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
            {metrics.systemHealth.systemStatus === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {metrics.systemHealth.systemStatus === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {metrics.systemHealth.systemStatus}
          </Badge>
          
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Manual Refresh */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="font-lato text-neutral-600 hover:text-[--color-primary-blue]"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Alerts */}
      {showAlerts && metrics.alerts && metrics.alerts.length > 0 && (
        <PerformanceAlerts alerts={metrics.alerts} />
      )}

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Epic 20 Achievement Summary */}
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Epic 20 Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Time Reduction</span>
                <span className="font-medium text-green-600">
                  {metrics.generationMetrics.epic20Comparison.timeReduction.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Cost Reduction</span>
                <span className="font-medium text-green-600">
                  {metrics.generationMetrics.epic20Comparison.apiCallReduction.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Retry Reduction</span>
                <span className="font-medium text-green-600">
                  {metrics.generationMetrics.epic20Comparison.retryReduction.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Current Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Generating</span>
                <span className="font-medium">{metrics.generationMetrics.currentlyGenerating}</span>
              </div>
              <div className="flex justify-between">
                <span>Queue Length</span>
                <span className="font-medium">{metrics.systemHealth.queueLength}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Today</span>
                <span className="font-medium">{metrics.generationMetrics.totalCompleted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>API Efficiency</span>
                <span className="font-medium">
                  {metrics.generationMetrics.apiCallReduction.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Parallel Processing</span>
                <span className="font-medium">
                  {metrics.generationMetrics.parallelProcessingEfficiency.toFixed(1)}x
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit Rate</span>
                <span className="font-medium">
                  {metrics.researchMetrics.researchCacheHitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <SystemHealthCard systemHealth={metrics.systemHealth} compact={true} />
      </div>

      {/* Detailed Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenerationMetricsCard metrics={metrics.generationMetrics} />
        <ResearchMetricsCard metrics={metrics.researchMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContextMetricsCard metrics={metrics.contextMetrics} />
        <HistoricalTrendsChart trends={metrics.historicalTrends} timeRange={timeRange} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <div>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-4">
          <div>Auto-refresh: {refreshInterval / 1000}s</div>
          <div>Time range: {timeRange}</div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;
