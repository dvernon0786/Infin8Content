/**
 * Enhanced Generation Progress Component
 * Story 22.1: Generation Progress Visualization
 * Task 1: Enhanced Progress Visualization Component
 * 
 * Provides real-time visualization of parallel section processing,
 * research phase, retry attempts, context management, and performance metrics.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Zap,
  Database,
  Activity,
  TrendingUp,
  Wifi,
  WifiOff,
  RotateCcw,
  Target,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParallelSectionProgress } from './parallel-section-progress';
import { PerformanceMetricsDisplay } from './performance-metrics-display';
import { ResearchPhaseVisualization } from './research-phase-visualization';
import { ContextManagementMetrics } from './context-management-metrics';

// Types based on story requirements
export interface ParallelSection {
  sectionId: string;
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress: number; // 0-100
  startTime: string;
  estimatedCompletion?: string;
  retryCount?: number;
  wordCount?: number;
}

export interface PerformanceMetrics {
  researchApiCalls: number;
  cacheHitRate: number;
  retryAttempts: number;
  totalApiCalls: number;
  estimatedTimeRemaining: number; // seconds
  costSavings: number; // percentage
  timeSavings: number; // percentage
}

export interface ResearchPhase {
  status: 'pending' | 'researching' | 'completed' | 'cached';
  apiCallsMade: number;
  estimatedTotalCalls: number;
  cacheHitRate: number;
  keywords: string[];
  sourcesFound: number;
}

export interface ContextManagement {
  tokensUsed: number;
  tokenLimit: number;
  cacheHits: number;
  sectionsSummarized: number;
  optimizationRate: number; // percentage
}

export interface GenerationProgressProps {
  articleId: string;
  orgId: string;
  status: 'queued' | 'researching' | 'generating' | 'completed' | 'failed';
  overallProgress: number; // 0-100
  parallelSections: ParallelSection[];
  performanceMetrics: PerformanceMetrics;
  researchPhase: ResearchPhase;
  contextManagement: ContextManagement;
  estimatedCompletion?: string;
  onProgressUpdate?: (progress: any) => void;
  showPerformanceMetrics?: boolean;
  mobileOptimized?: boolean;
  className?: string;
}

export function GenerationProgress({
  articleId,
  orgId,
  status,
  overallProgress,
  parallelSections,
  performanceMetrics,
  researchPhase,
  contextManagement,
  estimatedCompletion,
  onProgressUpdate,
  showPerformanceMetrics = true,
  mobileOptimized = false,
  className = '',
}: GenerationProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Touch handlers for mobile optimization
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (mobileOptimized) {
      setTouchStart(e.touches[0].clientY);
    }
  }, [mobileOptimized]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (mobileOptimized && touchStart !== null) {
      const touchEnd = e.changedTouches[0].clientY;
      const touchDistance = touchStart - touchEnd;
      
      // Swipe up to expand, swipe down to collapse (threshold: 50px)
      if (Math.abs(touchDistance) > 50) {
        setIsExpanded(touchDistance > 0);
      }
      setTouchStart(null);
    }
  }, [mobileOptimized, touchStart]);

  // Calculate derived metrics
  const activeSections = useMemo(() => 
    parallelSections.filter(section => section.status === 'processing' || section.status === 'retrying'),
    [parallelSections]
  );

  const completedSections = useMemo(() =>
    parallelSections.filter(section => section.status === 'completed'),
    [parallelSections]
  );

  const failedSections = useMemo(() =>
    parallelSections.filter(section => section.status === 'failed'),
    [parallelSections]
  );

  const overallStatusConfig = useMemo(() => {
    switch (status) {
      case 'queued':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Queued' };
      case 'researching':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Researching' };
      case 'generating':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Generating' };
      case 'completed':
        return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed' };
      case 'failed':
        return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Failed' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  }, [status]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return '< 1 min';
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  };

  // Format estimated completion
  const formatEstimatedCompletion = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Any moment';
    const diffMins = Math.ceil(diffMs / 60000);
    
    if (diffMins < 1) return 'Any moment';
    if (diffMins < 60) return `~${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `~${hours}h ${remainingMins}min`;
  };

  return (
    <div className={cn(
      'space-y-4',
      mobileOptimized && 'space-y-3',
      className
    )}>
      {/* Main Progress Card */}
      <Card 
        className={cn(
          'transition-all duration-300',
          status === 'generating' && 'border-blue-200 bg-blue-50/50',
          status === 'completed' && 'border-green-200 bg-green-50/50',
          status === 'failed' && 'border-red-200 bg-red-50/50'
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <CardHeader className={cn(
          'pb-3',
          mobileOptimized && 'pb-2'
        )}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              'text-lg font-semibold flex items-center gap-2',
              mobileOptimized && 'text-base'
            )}>
              <Activity className="h-5 w-5" />
              Generation Progress
              <Badge variant="outline" className={cn(
                'text-xs',
                overallStatusConfig.color,
                overallStatusConfig.bgColor
              )}>
                {overallStatusConfig.label}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className={cn(
                'flex items-center gap-1',
                connectionStatus === 'connected' ? 'text-green-600' : 
                connectionStatus === 'reconnecting' ? 'text-orange-600' : 'text-red-600'
              )}>
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span className="text-xs hidden sm:inline">
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
                </span>
              </div>
              
              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1"
              >
                <BarChart3 className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180'
                )} />
                <span className="hidden sm:inline">
                  {isExpanded ? 'Hide' : 'Show'} Details
                </span>
              </Button>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn('font-medium', overallStatusConfig.color)}>
                {status === 'generating' ? `${activeSections.length} sections processing` : 
                 status === 'researching' ? 'Research phase' :
                 status === 'completed' ? 'Generation complete' :
                 status === 'failed' ? 'Generation failed' :
                 'Waiting to start'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {overallProgress.toFixed(1)}%
                </span>
                {estimatedCompletion && status === 'generating' && (
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    ~{formatEstimatedCompletion(estimatedCompletion)}
                  </span>
                )}
              </div>
            </div>
            
            <Progress 
              value={overallProgress} 
              className={cn(
                'h-3',
                mobileOptimized && 'h-2'
              )}
            />
            
            {/* Quick Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {completedSections.length} of {parallelSections.length} sections
              </span>
              {failedSections.length > 0 && (
                <span className="text-red-600">
                  {failedSections.length} failed
                </span>
              )}
              {performanceMetrics.timeSavings > 0 && (
                <span className="text-green-600">
                  {performanceMetrics.timeSavings.toFixed(0)}% faster
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Expanded Details */}
        {isExpanded && (
          <CardContent className={cn(
            'pt-0 space-y-4',
            mobileOptimized && 'space-y-3'
          )}>
            {/* Parallel Section Progress */}
            <ParallelSectionProgress
              sections={parallelSections}
              maxConcurrent={4}
              showRetryAttempts={true}
              mobileOptimized={mobileOptimized}
            />
            
            {/* Research Phase Visualization */}
            <ResearchPhaseVisualization
              researchPhase={researchPhase}
              mobileOptimized={mobileOptimized}
            />
            
            {/* Context Management Metrics */}
            <ContextManagementMetrics
              contextManagement={contextManagement}
              mobileOptimized={mobileOptimized}
            />
            
            {/* Performance Metrics Display */}
            {showPerformanceMetrics && (
              <PerformanceMetricsDisplay
                metrics={performanceMetrics}
                mobileOptimized={mobileOptimized}
              />
            )}
            
            {/* Last Update */}
            <div className="text-xs text-gray-500 border-t pt-2">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default GenerationProgress;
