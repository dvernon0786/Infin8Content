/**
 * Time estimation component for article generation
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ArticleProgress } from '@/types/article';

interface TimeEstimationProps {
  progress: ArticleProgress;
  className?: string;
}

export function TimeEstimation({ progress, className }: TimeEstimationProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const calculateTimePerSection = () => {
    if (progress.actual_time_spent > 0 && progress.current_section > 1) {
      return Math.round(progress.actual_time_spent / (progress.current_section - 1));
    }
    return null;
  };

  const estimateRemainingTime = () => {
    const timePerSection = calculateTimePerSection();
    if (timePerSection && progress.current_section < progress.total_sections) {
      const remainingSections = progress.total_sections - progress.current_section;
      return timePerSection * remainingSections;
    }
    return progress.estimated_time_remaining;
  };

  const getEfficiencyIndicator = () => {
    const timePerSection = calculateTimePerSection();
    if (!timePerSection) return null;
    
    // Estimate expected time per section (2-3 minutes per section)
    const expectedTimePerSection = 150; // 2.5 minutes in seconds
    const efficiency = expectedTimePerSection / timePerSection;
    
    if (efficiency > 1.2) return 'fast';
    if (efficiency < 0.8) return 'slow';
    return 'normal';
  };

  const timePerSection = calculateTimePerSection();
  const estimatedRemaining = estimateRemainingTime();
  const efficiency = getEfficiencyIndicator();

  const getEfficiencyColor = () => {
    switch (efficiency) {
      case 'fast':
        return 'text-green-600';
      case 'slow':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getEfficiencyText = () => {
    switch (efficiency) {
      case 'fast':
        return 'Ahead of schedule';
      case 'slow':
        return 'Taking longer than expected';
      default:
        return 'On track';
    }
  };

  const getEfficiencyIcon = () => {
    switch (efficiency) {
      case 'fast':
        return <TrendingUp className="h-4 w-4" />;
      case 'slow':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (progress.status === 'completed') {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Generation Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(progress.actual_time_spent)}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {timePerSection ? formatTime(timePerSection) : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Avg. per Section</div>
            </div>
          </div>
          
          {timePerSection && (
            <div className="flex items-center justify-center space-x-2">
              {getEfficiencyIcon()}
              <span className={`text-sm font-medium ${getEfficiencyColor()}`}>
                {getEfficiencyText()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Time Estimation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Progress Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(progress.actual_time_spent)}
            </div>
            <div className="text-sm text-muted-foreground">Time Spent</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {estimatedRemaining ? formatTime(estimatedRemaining) : 'Calculating...'}
            </div>
            <div className="text-sm text-muted-foreground">Est. Remaining</div>
          </div>
        </div>

        {/* Average Time per Section */}
        {timePerSection && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average per Section:</span>
              <span className="text-lg font-bold">{formatTime(timePerSection)}</span>
            </div>
          </div>
        )}

        {/* Efficiency Indicator */}
        {efficiency && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {getEfficiencyIcon()}
              <span className="text-sm font-medium">Pace:</span>
            </div>
            <Badge 
              variant="outline" 
              className={`${getEfficiencyColor()} border-current`}
            >
              {getEfficiencyText()}
            </Badge>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Timeline Progress:</div>
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: `${(progress.current_section / progress.total_sections) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                Section {progress.current_section} of {progress.total_sections}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round((progress.current_section / progress.total_sections) * 100)}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Projected Completion Time */}
        {estimatedRemaining && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Projected Completion:</span>
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              In approximately {formatTime(estimatedRemaining)}
            </div>
          </div>
        )}

        {/* Warning for slow progress */}
        {efficiency === 'slow' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Note:</span>
            </div>
            <div className="text-sm text-red-700 mt-1">
              Generation is taking longer than expected. This may be due to complex research or API delays.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
