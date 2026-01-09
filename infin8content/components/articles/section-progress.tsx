/**
 * Section-by-section progress display component
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Loader2, Clock, AlertCircle } from 'lucide-react';
import { ProgressErrorBoundary } from './progress-error-boundary';
import type { ArticleProgress } from '@/types/article';

interface SectionProgressProps {
  progress: ArticleProgress;
  className?: string;
}

interface SectionItem {
  index: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  wordCount?: number;
  citations?: number;
}

export function SectionProgress({ progress, className }: SectionProgressProps) {
  return (
    <ProgressErrorBoundary
      onError={(error, errorInfo) => {
        console.error('SectionProgress error:', error, errorInfo);
      }}
    >
      <SectionProgressInner progress={progress} className={className} />
    </ProgressErrorBoundary>
  );
}

function SectionProgressInner({ progress, className }: SectionProgressProps) {
  // Generate section items based on progress
  const sections: SectionItem[] = Array.from({ length: progress.total_sections }, (_, index) => {
    const sectionNumber = index + 1;
    let status: SectionItem['status'] = 'pending';
    
    if (sectionNumber < progress.current_section) {
      status = 'completed';
    } else if (sectionNumber === progress.current_section) {
      if (progress.status === 'failed') {
        status = 'failed';
      } else if (progress.status === 'completed' && sectionNumber === progress.total_sections) {
        status = 'completed';
      } else {
        status = 'in-progress';
      }
    }
    
    return {
      index: sectionNumber,
      title: `Section ${sectionNumber}`,
      status,
    };
  });

  const getSectionIcon = (status: SectionItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: SectionItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Writing...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const completedSections = sections.filter(s => s.status === 'completed').length;
  const overallProgress = (completedSections / progress.total_sections) * 100;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Section Progress</CardTitle>
          <Badge variant="outline">
            {completedSections} of {progress.total_sections} sections
          </Badge>
        </div>
        
        {/* Overall section progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.index}
            className={`p-3 rounded-lg border transition-colors ${
              section.status === 'in-progress'
                ? 'border-blue-200 bg-blue-50'
                : section.status === 'completed'
                ? 'border-green-200 bg-green-50'
                : section.status === 'failed'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getSectionIcon(section.status)}
                <div>
                  <div className="font-medium">{section.title}</div>
                  {section.status === 'in-progress' && (
                    <div className="text-sm text-muted-foreground">
                      {progress.current_stage}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(section.status)}
            </div>
            
            {/* Section-specific progress for current section */}
            {section.status === 'in-progress' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Section Progress</span>
                  <span className="font-medium">
                    {Math.round(progress.progress_percentage)}%
                  </span>
                </div>
                <Progress value={progress.progress_percentage} className="h-1" />
                
                {progress.estimated_time_remaining && (
                  <div className="text-xs text-muted-foreground">
                    Estimated time remaining: ~{Math.ceil(progress.estimated_time_remaining / 60)} minutes
                  </div>
                )}
              </div>
            )}
            
            {/* Show completion info for completed sections */}
            {section.status === 'completed' && (
              <div className="mt-2 text-xs text-green-700">
                Completed successfully
              </div>
            )}
            
            {/* Show error for failed sections */}
            {section.status === 'failed' && progress.error_message && (
              <div className="mt-2 text-xs text-red-700">
                {progress.error_message}
              </div>
            )}
          </div>
        ))}
        
        {/* Summary statistics */}
        {progress.status === 'completed' && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {progress.word_count.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Words</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {progress.citations_count}
                </div>
                <div className="text-xs text-muted-foreground">Citations</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  ${progress.api_cost.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">API Cost</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
