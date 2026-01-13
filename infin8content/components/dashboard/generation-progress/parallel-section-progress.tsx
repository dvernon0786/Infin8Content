/**
 * Parallel Section Progress Component
 * Story 22.1: Generation Progress Visualization
 * Subtask 1.1: Create parallel section progress bars
 * 
 * Displays real-time progress of multiple sections being processed simultaneously,
 * showing 4+ concurrent generation with individual progress bars and status indicators.
 */

'use client';

import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  RotateCcw,
  Clock,
  FileText,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParallelSection } from './generation-progress';

interface ParallelSectionProgressProps {
  sections: ParallelSection[];
  maxConcurrent?: number;
  showRetryAttempts?: boolean;
  mobileOptimized?: boolean;
  className?: string;
}

const SECTION_TYPE_CONFIG = {
  introduction: { label: 'Intro', icon: FileText, color: 'blue' },
  h2: { label: 'H2', icon: Target, color: 'green' },
  h3: { label: 'H3', icon: Target, color: 'purple' },
  conclusion: { label: 'Conclusion', icon: FileText, color: 'orange' },
  faq: { label: 'FAQ', icon: FileText, color: 'pink' },
} as const;

const STATUS_CONFIG = {
  pending: { 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-100', 
    icon: Clock,
    label: 'Pending',
    animate: false
  },
  processing: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100', 
    icon: Loader2,
    label: 'Processing',
    animate: true
  },
  completed: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-100', 
    icon: CheckCircle,
    label: 'Completed',
    animate: false
  },
  failed: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-100', 
    icon: AlertCircle,
    label: 'Failed',
    animate: false
  },
  retrying: { 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100', 
    icon: RotateCcw,
    label: 'Retrying',
    animate: true
  },
} as const;

export function ParallelSectionProgress({
  sections,
  maxConcurrent = 4,
  showRetryAttempts = true,
  mobileOptimized = false,
  className = '',
}: ParallelSectionProgressProps) {
  // Sort sections by start time and status priority
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      // Priority order: processing > retrying > pending > completed > failed
      const statusPriority = {
        processing: 0,
        retrying: 1,
        pending: 2,
        completed: 3,
        failed: 4,
      } as const;
      
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same status, sort by start time
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [sections]);

  // Calculate concurrent processing metrics
  const activeSections = useMemo(() => 
    sections.filter(section => section.status === 'processing' || section.status === 'retrying'),
    [sections]
  );

  const completedSections = useMemo(() =>
    sections.filter(section => section.status === 'completed'),
    [sections]
  );

  const processingRate = useMemo(() => {
    if (sections.length === 0) return 0;
    return (activeSections.length / maxConcurrent) * 100;
  }, [activeSections.length, maxConcurrent, sections.length]);

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) return '< 1s';
    if (durationMs < 60000) return `${Math.floor(durationMs / 1000)}s`;
    return `${Math.floor(durationMs / 60000)}m`;
  };

  const getSectionIcon = (sectionType: string) => {
    const config = SECTION_TYPE_CONFIG[sectionType as keyof typeof SECTION_TYPE_CONFIG];
    return config?.icon || FileText;
  };

  const getSectionLabel = (sectionType: string) => {
    const config = SECTION_TYPE_CONFIG[sectionType as keyof typeof SECTION_TYPE_CONFIG];
    return config?.label || sectionType;
  };

  const getStatusConfig = (status: keyof typeof STATUS_CONFIG) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  return (
    <Card className={cn(
      'transition-all duration-300',
      activeSections.length > 0 && 'border-blue-200 bg-blue-50/30',
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
          <Zap className="h-4 w-4" />
          Parallel Section Processing
          <Badge variant="outline" className="text-xs">
            {activeSections.length}/{maxConcurrent} active
          </Badge>
          {processingRate > 75 && (
            <Badge variant="outline" className="text-xs text-green-600">
              Max capacity
            </Badge>
          )}
        </CardTitle>
        
        {/* Processing Rate Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Processing Rate</span>
            <span className="font-medium">{processingRate.toFixed(0)}%</span>
          </div>
          <Progress 
            value={processingRate} 
            className={cn(
              'h-2',
              mobileOptimized && 'h-1'
            )}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{completedSections.length} completed</span>
            <span>{sections.length} total sections</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        'pt-0',
        mobileOptimized && 'px-3 pb-3'
      )}>
        <div className={cn(
          'space-y-3',
          mobileOptimized && 'space-y-2'
        )}>
          {sortedSections.map((section) => {
            const statusConfig = getStatusConfig(section.status);
            const SectionIcon = getSectionIcon(section.sectionType);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={section.sectionId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                  statusConfig.bgColor,
                  section.status === 'processing' && 'border-blue-200 bg-blue-50',
                  section.status === 'retrying' && 'border-orange-200 bg-orange-50',
                  section.status === 'completed' && 'border-green-200 bg-green-50',
                  section.status === 'failed' && 'border-red-200 bg-red-50',
                  mobileOptimized && 'p-2 gap-2'
                )}
              >
                {/* Section Type Icon */}
                <div className="flex-shrink-0">
                  <SectionIcon className={cn(
                    'h-4 w-4',
                    mobileOptimized && 'h-3 w-3'
                  )} />
                </div>
                
                {/* Section Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'font-medium text-sm',
                      mobileOptimized && 'text-xs'
                    )}>
                      {getSectionLabel(section.sectionType)}
                    </span>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs flex items-center gap-1',
                        statusConfig.color,
                        statusConfig.bgColor
                      )}
                    >
                      <StatusIcon className={cn(
                        'h-3 w-3',
                        statusConfig.animate && 'animate-spin'
                      )} />
                      {statusConfig.label}
                    </Badge>
                    
                    {/* Retry Attempts */}
                    {showRetryAttempts && section.retryCount && section.retryCount > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {section.retryCount}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {section.progress.toFixed(1)}% complete
                      </span>
                      {section.wordCount && (
                        <span className="text-gray-500">
                          {section.wordCount.toLocaleString()} words
                        </span>
                      )}
                    </div>
                    <Progress 
                      value={section.progress} 
                      className={cn(
                        'h-1.5',
                        mobileOptimized && 'h-1'
                      )}
                    />
                  </div>
                </div>
                
                {/* Time Info */}
                <div className="flex-shrink-0 text-xs text-gray-500">
                  <div className="text-right">
                    <div>{formatDuration(section.startTime)}</div>
                    {section.estimatedCompletion && (
                      <div className="text-gray-400">
                        ~{formatDuration(section.startTime, section.estimatedCompletion)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Capacity Indicator */}
        {activeSections.length >= maxConcurrent && (
          <div className="mt-3 p-2 bg-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Zap className="h-4 w-4" />
              <span>Running at maximum capacity ({maxConcurrent} concurrent sections)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ParallelSectionProgress;
