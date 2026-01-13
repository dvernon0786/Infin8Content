/**
 * Generation Metrics Card Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 2: Generation Performance Metrics
 * 
 * Displays generation time trends, API call reductions, parallel processing
 * metrics, and throughput measurements from Epic 20 optimizations.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  DollarSign, 
  Zap, 
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationMetrics {
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

interface GenerationMetricsCardProps {
  metrics: GenerationMetrics;
  className?: string;
}

export function GenerationMetricsCard({ metrics, className = '' }: GenerationMetricsCardProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const hasExcellentTimeReduction = metrics.epic20Comparison.timeReduction >= 60;
  const hasExcellentApiReduction = metrics.epic20Comparison.apiCallReduction >= 70;
  const hasLowRetryRate = metrics.retryRate <= 1;
  const hasHighThroughput = metrics.throughputPerHour >= 10;

  return (
    <Card className={cn(
      'transition-all duration-300',
      hasExcellentTimeReduction && hasExcellentApiReduction && 'border-green-200 bg-green-50/30',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          Generation Performance
          <Badge variant="outline" className="text-xs">
            Epic 20 Optimized
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Average Generation Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Avg Generation Time</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatTime(metrics.avgGenerationTime)}</span>
              {hasExcellentTimeReduction && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (metrics.avgGenerationTime / 480) * 100)} // 8 minutes = 480s baseline
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 3 minutes (Epic 20 achieved 60-70% faster)
          </div>
        </div>

        {/* API Call Reduction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">API Call Reduction</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.apiCallReduction.toFixed(1)}%</span>
              {hasExcellentApiReduction && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.apiCallReduction} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 70% reduction (Epic 20 achieved 85%)
          </div>
        </div>

        {/* Parallel Processing Efficiency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Parallel Processing</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.parallelProcessingEfficiency.toFixed(1)}x</span>
              <Badge variant="outline" className="text-xs text-blue-600">
                <Activity className="h-3 w-3 mr-1" />
                Concurrent
              </Badge>
            </div>
          </div>
          
          <Progress 
            value={Math.min(100, (metrics.parallelProcessingEfficiency / 4) * 100)} // 4x = 100%
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 4+ simultaneous sections
          </div>
        </div>

        {/* Throughput */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Throughput</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.throughputPerHour.toFixed(1)}/hr</span>
              {hasHighThroughput && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.min(100, (metrics.throughputPerHour / 20) * 100)} // 20/hr = 100%
            className="h-2"
          />
        </div>

        {/* Retry Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Retry Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.retryRate.toFixed(1)}</span>
              {hasLowRetryRate && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Optimized
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (metrics.retryRate * 25))} // Inverse: lower retries = better
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 1 retry maximum (Epic 20 optimized)
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
          <div className="space-y-1">
            <div className="text-gray-600">Currently Generating</div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{metrics.currentlyGenerating}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Completed Today</div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">{metrics.totalCompleted}</span>
            </div>
          </div>
        </div>

        {/* Epic 20 Success Notice */}
        {hasExcellentTimeReduction && hasExcellentApiReduction && hasLowRetryRate && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Epic 20 Performance Achievements Met</div>
                <div className="text-xs text-green-700 mt-1">
                  ✓ {metrics.epic20Comparison.timeReduction.toFixed(0)}% time reduction
                  <br />
                  ✓ {metrics.epic20Comparison.apiCallReduction.toFixed(0)}% API cost reduction
                  <br />
                  ✓ {metrics.epic20Comparison.retryReduction.toFixed(0)}% retry reduction
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GenerationMetricsCard;
