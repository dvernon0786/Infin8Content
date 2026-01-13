/**
 * Research Phase Visualization Component
 * Story 22.1: Generation Progress Visualization
 * Subtask 1.2: Implement research phase visualization
 * 
 * Shows research phase progress with API call tracking, cache hit rate,
 * and optimization metrics from Epic 20's batch research improvements.
 */

'use client';

import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Database, 
  CheckCircle, 
  Loader2, 
  Clock,
  TrendingUp,
  Target,
  BookOpen,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResearchPhase {
  status: 'pending' | 'researching' | 'completed' | 'cached';
  apiCallsMade: number;
  estimatedTotalCalls: number;
  cacheHitRate: number;
  keywords: string[];
  sourcesFound: number;
}

interface ResearchPhaseVisualizationProps {
  researchPhase: ResearchPhase;
  mobileOptimized?: boolean;
  className?: string;
}

const RESEARCH_STATUS_CONFIG = {
  pending: { 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-100', 
    icon: Clock,
    label: 'Waiting to start',
    animate: false
  },
  researching: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100', 
    icon: Search,
    label: 'Researching keywords...',
    animate: true
  },
  completed: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-100', 
    icon: CheckCircle,
    label: 'Research complete',
    animate: false
  },
  cached: { 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100', 
    icon: Database,
    label: 'Using cached research',
    animate: false
  },
} as const;

export function ResearchPhaseVisualization({
  researchPhase,
  mobileOptimized = false,
  className = '',
}: ResearchPhaseVisualizationProps) {
  const statusConfig = RESEARCH_STATUS_CONFIG[researchPhase.status];
  const StatusIcon = statusConfig.icon;

  // Calculate optimization metrics
  const apiCallReduction = useMemo(() => {
    if (researchPhase.estimatedTotalCalls === 0) return 0;
    const reduction = researchPhase.estimatedTotalCalls - researchPhase.apiCallsMade;
    return (reduction / researchPhase.estimatedTotalCalls) * 100;
  }, [researchPhase.apiCallsMade, researchPhase.estimatedTotalCalls]);

  const isOptimized = apiCallReduction > 50; // Epic 20 achieved 85% reduction
  const isHighCacheHitRate = researchPhase.cacheHitRate > 80;

  // Format keyword display
  const displayKeywords = useMemo(() => {
    const maxDisplay = mobileOptimized ? 2 : 3;
    return researchPhase.keywords.slice(0, maxDisplay);
  }, [researchPhase.keywords, mobileOptimized]);

  const hasMoreKeywords = researchPhase.keywords.length > displayKeywords.length;

  return (
    <Card className={cn(
      'transition-all duration-300',
      researchPhase.status === 'researching' && 'border-blue-200 bg-blue-50/30',
      researchPhase.status === 'cached' && 'border-purple-200 bg-purple-50/30',
      researchPhase.status === 'completed' && 'border-green-200 bg-green-50/30',
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
          <StatusIcon className={cn(
            'h-4 w-4',
            statusConfig.animate && 'animate-pulse'
          )} />
          Research Phase
          <Badge variant="outline" className={cn(
            'text-xs',
            statusConfig.color,
            statusConfig.bgColor
          )}>
            {statusConfig.label}
          </Badge>
          {isOptimized && (
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
        {/* API Calls Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">API Calls</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {researchPhase.apiCallsMade} / {researchPhase.estimatedTotalCalls}
              </span>
              {apiCallReduction > 0 && (
                <span className="text-xs text-green-600">
                  -{apiCallReduction.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          
          <Progress 
            value={(researchPhase.apiCallsMade / researchPhase.estimatedTotalCalls) * 100} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          {/* Optimization Badge */}
          {isOptimized && (
            <div className="flex items-center gap-2 text-xs text-green-700">
              <TrendingUp className="h-3 w-3" />
              <span>Epic 20 optimization: {apiCallReduction.toFixed(0)}% fewer API calls</span>
            </div>
          )}
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cache Hit Rate</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{researchPhase.cacheHitRate.toFixed(1)}%</span>
              {isHighCacheHitRate && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <Database className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={researchPhase.cacheHitRate} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          
          {isHighCacheHitRate && (
            <div className="text-xs text-green-700">
              Excellent cache utilization (&gt;80% hit rate)
            </div>
          )}
        </div>

        {/* Research Sources */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Sources Found</span>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{researchPhase.sourcesFound}</span>
          </div>
        </div>

        {/* Keywords Being Researched */}
        {researchPhase.keywords.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Keywords</div>
            <div className="flex flex-wrap gap-1">
              {displayKeywords.map((keyword, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className={cn(
                    'text-xs',
                    researchPhase.status === 'researching' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
                  )}
                >
                  <Target className="h-3 w-3 mr-1" />
                  {keyword}
                </Badge>
              ))}
              {hasMoreKeywords && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{researchPhase.keywords.length - displayKeywords.length} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Epic 20 Optimization Notice */}
        {researchPhase.status === 'completed' && apiCallReduction > 70 && (
          <div className="p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Epic 20 Optimization Active</div>
                <div className="text-xs text-green-700 mt-1">
                  Batch research reduced API calls by {apiCallReduction.toFixed(0)}% 
                  ({researchPhase.estimatedTotalCalls - researchPhase.apiCallsMade} fewer calls)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cached Research Notice */}
        {researchPhase.status === 'cached' && (
          <div className="p-3 bg-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <div className="font-medium">Using Cached Research</div>
                <div className="text-xs text-purple-700 mt-1">
                  Research data retrieved from cache with {researchPhase.cacheHitRate.toFixed(1)}% hit rate
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResearchPhaseVisualization;
