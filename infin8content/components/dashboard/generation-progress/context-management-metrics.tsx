/**
 * Context Management Metrics Component
 * Story 22.1: Generation Progress Visualization
 * Subtask 1.4: Display context management metrics
 * 
 * Shows incremental caching, token usage optimization, and context building
 * metrics from Epic 20's context management improvements.
 */

'use client';

import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  TrendingUp, 
  Cpu, 
  Zap,
  HardDrive,
  FileText,
  BarChart3,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContextManagement {
  tokensUsed: number;
  tokenLimit: number;
  cacheHits: number;
  sectionsSummarized: number;
  optimizationRate: number; // percentage
}

interface ContextManagementMetricsProps {
  contextManagement: ContextManagement;
  mobileOptimized?: boolean;
  className?: string;
}

export function ContextManagementMetrics({
  contextManagement,
  mobileOptimized = false,
  className = '',
}: ContextManagementMetricsProps) {
  // Calculate derived metrics
  const tokenUsagePercentage = useMemo(() => {
    if (contextManagement.tokenLimit === 0) return 0;
    return (contextManagement.tokensUsed / contextManagement.tokenLimit) * 100;
  }, [contextManagement.tokensUsed, contextManagement.tokenLimit]);

  const cacheHitRate = useMemo(() => {
    const totalOperations = contextManagement.cacheHits + contextManagement.sectionsSummarized;
    if (totalOperations === 0) return 0;
    return (contextManagement.cacheHits / totalOperations) * 100;
  }, [contextManagement.cacheHits, contextManagement.sectionsSummarized]);

  const isHighlyOptimized = contextManagement.optimizationRate > 40; // Epic 20 achieved 40-50% reduction
  const isNearTokenLimit = tokenUsagePercentage > 80;
  const hasGoodCacheHitRate = cacheHitRate > 70;

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  return (
    <Card className={cn(
      'transition-all duration-300',
      isHighlyOptimized && 'border-green-200 bg-green-50/30',
      isNearTokenLimit && 'border-orange-200 bg-orange-50/30',
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
          <Cpu className="h-4 w-4" />
          Context Management
          {isHighlyOptimized && (
            <Badge variant="outline" className="text-xs text-green-600">
              <Zap className="h-3 w-3 mr-1" />
              Optimized
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className={cn(
        'pt-0 space-y-4',
        mobileOptimized && 'space-y-3 px-3 pb-3'
      )}>
        {/* Token Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Token Usage</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatTokenCount(contextManagement.tokensUsed)} / {formatTokenCount(contextManagement.tokenLimit)}
              </span>
              {isNearTokenLimit && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <HardDrive className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={tokenUsagePercentage} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          {/* Token Usage Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{tokenUsagePercentage.toFixed(1)}% of limit</span>
            <span>2000 token limit (Epic 20)</span>
          </div>
        </div>

        {/* Cache Performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cache Performance</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{cacheHitRate.toFixed(1)}%</span>
              {hasGoodCacheHitRate && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Database className="h-3 w-3 mr-1" />
                  Good
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={cacheHitRate} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{contextManagement.cacheHits} cache hits</span>
            <span>{contextManagement.sectionsSummarized} summarized</span>
          </div>
        </div>

        {/* Optimization Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Optimization Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{contextManagement.optimizationRate.toFixed(1)}%</span>
              {isHighlyOptimized && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={contextManagement.optimizationRate} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
        </div>

        {/* Context Management Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-600">Sections Summarized</div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{contextManagement.sectionsSummarized}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Cache Hits</div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="font-medium">{contextManagement.cacheHits}</span>
            </div>
          </div>
        </div>

        {/* Epic 20 Optimization Notice */}
        {isHighlyOptimized && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Epic 20 Context Optimization Active</div>
                <div className="text-xs text-green-700 mt-1">
                  Incremental caching reduces token usage by {contextManagement.optimizationRate.toFixed(0)}%
                  <br />
                  • {contextManagement.sectionsSummarized} sections summarized instead of fully loaded
                  <br />
                  • {contextManagement.cacheHits} cache hits improve performance
                </div>
              </div>
            </div>
          </div>
        )}

        {/* High Token Usage Warning */}
        {isNearTokenLimit && (
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <HardDrive className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <div className="font-medium">Approaching Token Limit</div>
                <div className="text-xs text-orange-700 mt-1">
                  {tokenUsagePercentage.toFixed(1)}% of 2000 token limit used
                  <br />
                  Context management will optimize remaining sections
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Context Strategy Info */}
        <div className="text-xs text-gray-600 border-t pt-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-3 w-3" />
            <span className="font-medium">Context Strategy (Epic 20)</span>
          </div>
          <ul className="space-y-1 ml-5">
            <li>• Incremental caching with 2000 token limit</li>
            <li>• Previous sections summarized vs fully loaded</li>
            <li>• Cache hits reduce API calls and improve speed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContextManagementMetrics;
