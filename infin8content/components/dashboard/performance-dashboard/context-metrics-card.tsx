/**
 * Context Management Metrics Card Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 4: Context Management Metrics
 * 
 * Displays token usage trends, context building efficiency,
 * memory utilization monitoring, and context optimization impact.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Cpu, 
  MemoryStick, 
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextMetrics {
  tokenUsagePerArticle: number;
  contextBuildingTime: number;
  memoryUsagePerGeneration: number;
  contextOptimizationEfficiency: number;
}

interface ContextMetricsCardProps {
  metrics: ContextMetrics;
  className?: string;
}

export function ContextMetricsCard({ metrics, className = '' }: ContextMetricsCardProps) {
  const hasLowTokenUsage = metrics.tokenUsagePerArticle <= 2000; // Epic 20 target
  const hasFastContextBuilding = metrics.contextBuildingTime <= 5; // 5 seconds
  const hasLowMemoryUsage = metrics.memoryUsagePerGeneration <= 50; // 50MB
  const hasHighOptimizationEfficiency = metrics.contextOptimizationEfficiency >= 40; // Epic 20 target: 40-50%

  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${mb.toFixed(1)}MB`;
    return `${(mb / 1024).toFixed(1)}GB`;
  };

  return (
    <Card className={cn(
      'transition-all duration-300',
      hasLowTokenUsage && hasHighOptimizationEfficiency && 'border-green-200 bg-green-50/30',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-orange-600" />
          Context Management
          <Badge variant="outline" className="text-xs">
            Token Optimization
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Token Usage Per Article */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Token Usage Per Article</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.tokenUsagePerArticle.toLocaleString()}</span>
              {hasLowTokenUsage && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Optimized
                </Badge>
              )}
              {metrics.tokenUsagePerArticle > 3000 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (metrics.tokenUsagePerArticle / 4000) * 100)} // Inverse: lower tokens = better
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: ≤2,000 tokens (Epic 20 achieved 40-50% reduction)
          </div>
        </div>

        {/* Context Building Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Context Building Time</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.contextBuildingTime.toFixed(1)}s</span>
              {hasFastContextBuilding && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.max(0, 100 - (metrics.contextBuildingTime * 10))} // Inverse: faster = better
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: ≤5 seconds for context preparation
          </div>
        </div>

        {/* Memory Usage Per Generation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Memory Usage</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatMemory(metrics.memoryUsagePerGeneration)}</span>
              {hasLowMemoryUsage && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <MemoryStick className="h-3 w-3 mr-1" />
                  Efficient
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={Math.min(100, (metrics.memoryUsagePerGeneration / 100) * 100)} // 100MB = 100%
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Memory consumption per generation cycle
          </div>
        </div>

        {/* Context Optimization Efficiency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Optimization Efficiency</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{metrics.contextOptimizationEfficiency.toFixed(1)}%</span>
              {hasHighOptimizationEfficiency && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Target className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={metrics.contextOptimizationEfficiency} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            Target: 40-50% reduction (Epic 20 achieved)
          </div>
        </div>

        {/* Context Management Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
          <div className="space-y-1">
            <div className="text-gray-600">Context Efficiency</div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-orange-600" />
              <span className="font-medium">
                {hasLowTokenUsage && hasHighOptimizationEfficiency ? 'Excellent' : 
                 hasLowTokenUsage || hasHighOptimizationEfficiency ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Resource Usage</div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {hasLowMemoryUsage && hasFastContextBuilding ? 'Optimized' : 'Improving'}
              </span>
            </div>
          </div>
        </div>

        {/* Epic 20 Context Success Notice */}
        {hasLowTokenUsage && hasHighOptimizationEfficiency && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Epic 20 Context Optimization Achieved</div>
                <div className="text-xs text-green-700 mt-1">
                  ✓ {metrics.tokenUsagePerArticle.toLocaleString()} tokens per article (target: ≤2,000)
                  <br />
                  ✓ {metrics.contextOptimizationEfficiency.toFixed(0)}% optimization efficiency (target: 40-50%)
                  <br />
                  ✓ {formatMemory(metrics.memoryUsagePerGeneration)} memory usage per generation
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Context Optimization Suggestions */}
        {!hasLowTokenUsage && (
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <div className="font-medium">Context Optimization Available</div>
                <div className="text-xs text-orange-700 mt-1">
                  {metrics.tokenUsagePerArticle > 2000 && `• Token usage could be reduced (${metrics.tokenUsagePerArticle.toLocaleString()} vs 2,000 target)`}
                  {metrics.contextOptimizationEfficiency < 40 && `• Optimization efficiency could be improved (${metrics.contextOptimizationEfficiency.toFixed(0)}% vs 40% target)`}
                  {metrics.memoryUsagePerGeneration > 50 && `• Memory usage could be optimized (${formatMemory(metrics.memoryUsagePerGeneration)} vs 50MB target)`}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContextMetricsCard;
