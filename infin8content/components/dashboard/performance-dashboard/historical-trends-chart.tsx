/**
 * Historical Trends Chart Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 2: Generation Performance Metrics
 * 
 * Displays historical performance trends for generation time,
 * API calls, and throughput with interactive time range selection.
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Zap, 
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HistoricalTrends {
  generationTime: Array<{ timestamp: string; value: number }>;
  apiCalls: Array<{ timestamp: string; value: number }>;
  throughput: Array<{ timestamp: string; value: number }>;
}

interface HistoricalTrendsChartProps {
  trends: HistoricalTrends;
  timeRange: string;
  className?: string;
}

export function HistoricalTrendsChart({ trends, timeRange, className = '' }: HistoricalTrendsChartProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const genTimes = trends.generationTime.map(p => p.value).filter(v => v > 0);
    const apiCalls = trends.apiCalls.map(p => p.value).filter(v => v > 0);
    const throughput = trends.throughput.map(p => p.value).filter(v => v > 0);
    
    return {
      avgGenerationTime: genTimes.length > 0 ? genTimes.reduce((a, b) => a + b, 0) / genTimes.length : 0,
      avgApiCalls: apiCalls.length > 0 ? apiCalls.reduce((a, b) => a + b, 0) / apiCalls.length : 0,
      avgThroughput: throughput.length > 0 ? throughput.reduce((a, b) => a + b, 0) / throughput.length : 0,
      trendDirection: {
        generationTime: getTrendDirection(genTimes),
        apiCalls: getTrendDirection(apiCalls),
        throughput: getTrendDirection(throughput)
      },
      latestValues: {
        generationTime: genTimes.length > 0 ? genTimes[genTimes.length - 1] : 0,
        apiCalls: apiCalls.length > 0 ? apiCalls[apiCalls.length - 1] : 0,
        throughput: throughput.length > 0 ? throughput[throughput.length - 1] : 0
      }
    };
  }, [trends]);

  const getTrendDirection = (values: number[]): 'up' | 'down' | 'stable' => {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return <ArrowUp className="h-3 w-3 text-red-500" />;
      case 'down': return <ArrowDown className="h-3 w-3 text-green-500" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable', inverse = false) => {
    if (inverse) {
      switch (direction) {
        case 'up': return 'text-red-600';
        case 'down': return 'text-green-600';
        default: return 'text-gray-600';
      }
    }
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressValue = (current: number, target: number, inverse = false): number => {
    if (inverse) {
      return Math.max(0, Math.min(100, ((target - current) / target) * 100));
    }
    return Math.max(0, Math.min(100, (current / target) * 100));
  };

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          Historical Performance Trends
          <Badge variant="outline" className="text-xs">
            {timeRange}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-600">Avg Generation Time</div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{formatTime(Math.round(stats.avgGenerationTime))}</span>
              {getTrendIcon(stats.trendDirection.generationTime)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Avg API Calls</div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{stats.avgApiCalls.toFixed(1)}</span>
              {getTrendIcon(stats.trendDirection.apiCalls)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Avg Throughput</div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="font-medium">{stats.avgThroughput.toFixed(1)}/hr</span>
              {getTrendIcon(stats.trendDirection.throughput)}
            </div>
          </div>
        </div>

        {/* Generation Time Trend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4 text-blue-600" />
              Generation Time
              <span className={cn('text-xs', getTrendColor(stats.trendDirection.generationTime, true))}>
                {stats.trendDirection.generationTime === 'down' ? 'Improving' :
                 stats.trendDirection.generationTime === 'up' ? 'Slowing' : 'Stable'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Current: {formatTime(Math.round(stats.latestValues.generationTime))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Performance vs Target (3 min)</span>
              <span>{Math.round(getProgressValue(stats.latestValues.generationTime, 180, true))}%</span>
            </div>
            <Progress 
              value={getProgressValue(stats.latestValues.generationTime, 180, true)} 
              className="h-2"
            />
          </div>
        </div>

        {/* API Calls Trend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Zap className="h-4 w-4 text-purple-600" />
              API Calls
              <span className={cn('text-xs', getTrendColor(stats.trendDirection.apiCalls, true))}>
                {stats.trendDirection.apiCalls === 'down' ? 'Optimizing' :
                 stats.trendDirection.apiCalls === 'up' ? 'Increasing' : 'Stable'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Current: {stats.latestValues.apiCalls.toFixed(1)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Efficiency vs Target (2 calls)</span>
              <span>{Math.round(getProgressValue(stats.latestValues.apiCalls, 2, true))}%</span>
            </div>
            <Progress 
              value={getProgressValue(stats.latestValues.apiCalls, 2, true)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Throughput Trend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Activity className="h-4 w-4 text-green-600" />
              Throughput
              <span className={cn('text-xs', getTrendColor(stats.trendDirection.throughput))}>
                {stats.trendDirection.throughput === 'up' ? 'Increasing' :
                 stats.trendDirection.throughput === 'down' ? 'Decreasing' : 'Stable'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Current: {stats.latestValues.throughput.toFixed(1)}/hr
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Performance vs Target (15/hr)</span>
              <span>{Math.round(getProgressValue(stats.latestValues.throughput, 15))}%</span>
            </div>
            <Progress 
              value={getProgressValue(stats.latestValues.throughput, 15)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Trend Summary */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span>Performance trends over {timeRange}</span>
            <div className="flex items-center gap-4">
              {stats.trendDirection.generationTime === 'down' && (
                <span className="text-green-600">⬇ Faster generation</span>
              )}
              {stats.trendDirection.apiCalls === 'down' && (
                <span className="text-green-600">⬇ Fewer API calls</span>
              )}
              {stats.trendDirection.throughput === 'up' && (
                <span className="text-green-600">⬆ Higher throughput</span>
              )}
            </div>
          </div>
        </div>

        {/* Data Points Summary */}
        <div className="text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>Data points: {trends.generationTime.length} time periods</span>
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HistoricalTrendsChart;
