/**
 * Performance Metrics Display Component
 * Story 22.1: Generation Progress Visualization
 * Subtask 1.5: Show performance optimization metrics
 * 
 * Displays API cost savings, time improvements, retry attempts,
 * and overall performance gains from Epic 20 optimizations.
 */

'use client';

import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  RotateCcw,
  Zap,
  Target,
  BarChart3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PerformanceMetrics {
  researchApiCalls: number;
  cacheHitRate: number;
  retryAttempts: number;
  totalApiCalls: number;
  estimatedTimeRemaining: number; // seconds
  costSavings: number; // percentage
  timeSavings: number; // percentage
}

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics;
  mobileOptimized?: boolean;
  className?: string;
}

export function PerformanceMetricsDisplay({
  metrics,
  mobileOptimized = false,
  className = '',
}: PerformanceMetricsDisplayProps) {
  // Calculate performance indicators
  const hasExcellentSavings = metrics.costSavings > 60; // Epic 20 achieved 70% cost reduction
  const hasExcellentTimeSavings = metrics.timeSavings > 50; // Epic 20 achieved 60-70% faster
  const hasLowRetryRate = metrics.retryAttempts <= 1; // Epic 20 optimized to 1 retry
  const hasHighCacheHitRate = metrics.cacheHitRate > 80;

  // Performance rating calculation
  const performanceRating = useMemo(() => {
    let score = 0;
    if (metrics.costSavings > 50) score += 25;
    if (metrics.timeSavings > 40) score += 25;
    if (metrics.retryAttempts <= 1) score += 25;
    if (metrics.cacheHitRate > 70) score += 25;
    
    if (score >= 75) return { rating: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 50) return { rating: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 25) return { rating: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { rating: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  }, [metrics]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(4)}`;
  };

  return (
    <Card className={cn(
      'transition-all duration-300',
      hasExcellentSavings && hasExcellentTimeSavings && 'border-green-200 bg-green-50/30',
      className
    )}>
      <CardHeader className={cn(
        'pb-3',
        mobileOptimized && 'pb-2'
      )}>
        <CardTitle className={cn(
          'text-base font-semibold flex items-center gap-2',
          mobileOptimized && 'text-sm'
        )}>
          <BarChart3 className="h-4 w-4" />
          Performance Metrics
          <Badge variant="outline" className={cn(
            'text-xs',
            performanceRating.color,
            performanceRating.bgColor
          )}>
            {performanceRating.rating}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={cn(
        'pt-0 space-y-4',
        mobileOptimized && 'space-y-3 px-3 pb-3'
      )}>
        {/* Cost Savings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cost Savings</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.costSavings.toFixed(1)}%</span>
              {hasExcellentSavings && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.costSavings} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          <div className="text-xs text-gray-500">
            Target: 70% reduction (Epic 20 achieved)
          </div>
        </div>

        {/* Time Savings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Time Savings</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.timeSavings.toFixed(1)}%</span>
              {hasExcellentTimeSavings && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.timeSavings} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          <div className="text-xs text-gray-500">
            Target: 60-70% faster (8min → 3min)
          </div>
        </div>

        {/* Retry Attempts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Retry Attempts</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.retryAttempts}</span>
              {hasLowRetryRate && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Optimized
                </Badge>
              )}
              {metrics.retryAttempts > 2 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (metrics.retryAttempts * 25))} // Inverse: lower retries = better
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          <div className="text-xs text-gray-500">
            Target: 1 retry maximum (Epic 20 optimized)
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cache Hit Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
              {hasHighCacheHitRate && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Target className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.cacheHitRate} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
        </div>

        {/* API Calls Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-600">Research API Calls</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{metrics.researchApiCalls}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Total API Calls</div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{metrics.totalApiCalls}</span>
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        {metrics.estimatedTimeRemaining > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Est. Time Remaining</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{formatTime(metrics.estimatedTimeRemaining)}</span>
            </div>
          </div>
        )}

        {/* Epic 20 Success Notice */}
        {hasExcellentSavings && hasExcellentTimeSavings && hasLowRetryRate && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Epic 20 Performance Achievements Met</div>
                <div className="text-xs text-green-700 mt-1">
                  ✓ {metrics.costSavings.toFixed(0)}% cost reduction (target: 70%)
                  <br />
                  ✓ {metrics.timeSavings.toFixed(0)}% time reduction (target: 60-70%)
                  <br />
                  ✓ {metrics.retryAttempts} retry attempts (target: 1)
                  <br />
                  ✓ {metrics.cacheHitRate.toFixed(0)}% cache hit rate
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Improvement Suggestions */}
        {!hasExcellentSavings && (
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <div className="font-medium">Performance Optimization Available</div>
                <div className="text-xs text-orange-700 mt-1">
                  {metrics.costSavings < 60 && `• Cost savings could be improved (${metrics.costSavings.toFixed(0)}% vs 70% target)`}
                  {metrics.timeSavings < 50 && `• Time savings could be increased (${metrics.timeSavings.toFixed(0)}% vs 60% target)`}
                  {metrics.retryAttempts > 1 && `• Retry attempts could be optimized (${metrics.retryAttempts} vs 1 target)`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceMetricsDisplay;
