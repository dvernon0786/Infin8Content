/**
 * Progress tracker component for real-time article generation progress
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useArticleProgress } from '@/hooks/use-article-progress';
import { ProgressErrorBoundary } from './progress-error-boundary';
import type { ArticleProgress } from '@/types/article';

interface ProgressTrackerProps {
  articleId: string;
  className?: string;
}

export function ProgressTracker({ articleId, className }: ProgressTrackerProps) {
  return (
    <ProgressErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ProgressTracker error:', error, errorInfo);
      }}
    >
      <ProgressTrackerInner articleId={articleId} className={className} />
    </ProgressErrorBoundary>
  );
}

function ProgressTrackerInner({ articleId, className }: ProgressTrackerProps) {
  const [startTime] = useState(() => Date.now());
  const { progress, isConnected, connectionStatus, error, reconnect } = useArticleProgress({
    articleId,
  });

  const getStatusColor = (status: ArticleProgress['status']) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-500';
      case 'researching':
        return 'bg-blue-500';
      case 'writing':
      case 'generating':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ArticleProgress['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'researching':
      case 'writing':
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return 'Calculating...';
    
    if (seconds < 60) return `~${seconds} seconds remaining`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)} minutes remaining`;
    return `~${Math.ceil(seconds / 3600)} hours remaining`;
  };

  const formatElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'reconnecting':
        return <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!progress) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Initializing progress tracking...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Article Generation Progress</CardTitle>
          <div className="flex items-center space-x-2">
            {getConnectionStatusIcon()}
            {connectionStatus === 'disconnected' && (
              <button
                onClick={reconnect}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor(progress.status)} text-white`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(progress.status)}
              <span className="capitalize">{progress.status}</span>
            </div>
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatElapsedTime()} elapsed
          </span>
        </div>

        {/* Current Stage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Current Stage:</span>
            <span className="text-muted-foreground">{progress.current_stage}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{Math.round(progress.progress_percentage)}%</span>
            </div>
            <Progress value={progress.progress_percentage} className="h-2" />
          </div>

          {/* Section Progress */}
          <div className="flex items-center justify-between text-sm">
            <span>Section Progress</span>
            <span className="text-muted-foreground">
              Section {progress.current_section} of {progress.total_sections}
            </span>
          </div>
          <Progress 
            value={(progress.current_section / progress.total_sections) * 100} 
            className="h-1" 
          />
        </div>

        {/* Time Remaining */}
        {progress.estimated_time_remaining && (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Estimated Time:</span>
            <span className="text-muted-foreground">
              {formatTimeRemaining(progress.estimated_time_remaining)}
            </span>
          </div>
        )}

        {/* Statistics */}
        {(progress.word_count > 0 || progress.citations_count > 0 || progress.api_cost > 0) && (
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{progress.word_count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Words</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{progress.citations_count}</div>
              <div className="text-xs text-muted-foreground">Citations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">${progress.api_cost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">API Cost</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Connection Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{error.message}</p>
          </div>
        )}

        {/* Generation Error */}
        {progress.error_message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Generation Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{progress.error_message}</p>
          </div>
        )}

        {/* Completion Message */}
        {progress.status === 'completed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Article generation complete!</span>
            </div>
            <div className="mt-2 text-sm text-green-700">
              <div>Total time: {formatElapsedTime()}</div>
              <div>Word count: {progress.word_count.toLocaleString()} words</div>
              <div>Citations: {progress.citations_count}</div>
              <div>API costs: ${progress.api_cost.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
