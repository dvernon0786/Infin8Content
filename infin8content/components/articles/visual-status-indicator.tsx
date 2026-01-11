/**
 * Visual Status Indicator component for articles
 * Story 15.2: Visual Status Indicators
 * Provides distinct visual styling for each article state with progress bars and completion animations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Sparkles,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArticleProgress, ArticleProgressStatus } from '@/types/article';
import { statusConfigs, type StatusConfig } from '@/lib/constants/status-configs';
import './visual-status-indicator.css';

interface VisualStatusIndicatorProps {
  status: ArticleProgressStatus | 'cancelled' | string;
  progress?: Partial<ArticleProgress> | null;
  title?: string;
  className?: string;
  onAnimationComplete?: () => void;
  onRetry?: () => void;
  compact?: boolean;
  // Real-time integration props
  isRealtime?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdated?: string | null;
}


export function VisualStatusIndicator({
  status,
  progress,
  title,
  className = '',
  onAnimationComplete,
  onRetry,
  compact = false,
  isRealtime = false,
  connectionStatus = 'disconnected',
  lastUpdated = null,
}: VisualStatusIndicatorProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [isHighContrast, setIsHighContrast] = useState(false);

  const statusConfig = statusConfigs[status] || statusConfigs.queued;

  // Detect high contrast mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle completion celebration animation
  useEffect(() => {
    if (status === 'completed' && previousStatus !== 'completed') {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
        onAnimationComplete?.();
      }, 2000); // 2-second celebration
      return () => clearTimeout(timer);
    }
    setPreviousStatus(status);
  }, [status, previousStatus, onAnimationComplete]);

  // Format estimated time remaining
  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.ceil(seconds / 60);
    return minutes <= 1 ? '1 min' : `${minutes} mins`;
  };

  // Get accessible color class
  const getColorClass = () => {
    if (isHighContrast) {
      return statusConfig.highContrastColor;
    }
    return statusConfig.color;
  };

  return (
    <div 
      data-testid="status-indicator-container"
      className={cn(
        'visual-status-indicator',
        statusConfig.bgColor,
        statusConfig.borderColor,
        'border rounded-lg transition-all duration-300',
        // Responsive design
        'p-3 sm:p-4', // More padding on larger screens
        'text-sm sm:text-base', // Larger text on bigger screens
        'max-w-full', // Prevent overflow on small screens
        compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4',
        // Mobile optimizations
        'touch-friendly', // Larger touch targets on mobile
        // Extra small screen optimization (320px+)
        'xs:p-2 xs:text-xs', // Extra small screens
        // Accessibility
        'focus-within:ring-2 focus-within:ring-offset-2', // Focus indicators
        isHighContrast ? 'border-2' : 'border', // Thicker borders in high contrast
        // Colorblind accessibility patterns
        statusConfig.patternClass,
        className
      )}
    >
      {/* Status announcement for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Article status: {statusConfig.label}
        {progress?.progress_percentage && ` - ${progress.progress_percentage.toFixed(1)}% complete`}
        {progress?.current_stage && ` - Currently ${progress.current_stage}`}
        {progress?.estimated_time_remaining && ` - Estimated ${formatTimeRemaining(progress.estimated_time_remaining)} remaining`}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Real-time connection indicator */}
          {isRealtime && (
            <div className="flex items-center gap-1">
              {connectionStatus === 'connected' ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates" />
              ) : connectionStatus === 'reconnecting' ? (
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Reconnecting..." />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" title="Disconnected" />
              )}
            </div>
          )}
          
          {/* Status Badge */}
          <Badge 
            data-testid="article-status-badge"
            variant={statusConfig.variant}
            className={cn(
              'flex items-center gap-1',
              getColorClass(),
              'font-medium',
              // Responsive sizing with extra small screen support
              'text-xs xs:text-xs sm:text-sm', // Smaller text on mobile
              'px-2 xs:px-2 sm:px-3 py-1', // Adjust padding for different screen sizes
              'min-h-6 xs:min-h-6 sm:min-h-7', // Minimum height for touch targets
              // Accessibility
              'focus:outline-none focus:ring-2 focus:ring-offset-2', // Focus styles
              isHighContrast && 'ring-2 ring-offset-1' // Enhanced focus in high contrast
            )}
            aria-label={statusConfig.ariaLabel}
          >
            {statusConfig.icon}
            {!compact && (
              <span className="hidden sm:inline">{statusConfig.label}</span>
            )}
            {compact && statusConfig.label}
          </Badge>

          {/* Title in compact mode */}
          {compact && title && (
            <span className="text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-32">
              {title}
            </span>
          )}
        </div>

        {/* Retry button for failed status */}
        {status === 'failed' && onRetry && (
          <Button
            data-testid="retry-button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className={cn(
              'flex items-center gap-1',
              // Responsive sizing with extra small screen support
              'text-xs xs:text-xs sm:text-sm',
              'px-2 xs:px-2 sm:px-3 py-1',
              'min-h-6 xs:min-h-6 sm:min-h-7', // Minimum touch target size
              // Accessibility
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isHighContrast && 'ring-2 ring-offset-1'
            )}
            aria-label={`Retry failed article: ${title || 'Untitled'}`}
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Retry</span>
            <span className="sm:hidden">↻</span>
          </Button>
        )}
      </div>

      {/* Progress Bar for Generating Articles */}
      {status === 'generating' && progress && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <span className={cn('font-medium', getColorClass())}>
              {progress.current_stage || 'Processing...'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                {(progress.progress_percentage || 0).toFixed(1)}%
              </span>
              {progress.estimated_time_remaining && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  ~{formatTimeRemaining(progress.estimated_time_remaining)}
                </span>
              )}
              {/* Real-time indicator */}
              {isRealtime && lastUpdated && (
                <span className="text-xs text-green-600 hidden xs:inline">
                  Live
                </span>
              )}
            </div>
          </div>
          
          <Progress 
            data-testid="article-progress-bar"
            value={progress.progress_percentage || 0} 
            className={cn(
              'h-2 sm:h-3', // Larger on desktop
              // Accessibility
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isHighContrast && 'ring-1 ring-offset-1'
            )}
            aria-valuenow={progress.progress_percentage || 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${(progress.progress_percentage || 0).toFixed(1)}% complete`}
          />
          
          {/* Additional progress details */}
          {!compact && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-gray-500">
              <span>
                Section {progress.current_section || 1} of {progress.total_sections || '?'}
              </span>
              {progress.word_count && (
                <span>{progress.word_count.toLocaleString()} words</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message for Failed Articles */}
      {status === 'failed' && progress?.error_message && (
        <div className="mt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{progress.error_message}</p>
          </div>
        </div>
      )}

      {/* Completion Celebration Animation */}
      {showCelebration && (
        <div 
          data-testid="completion-celebration"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="animate-celebration flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-green-500 animate-pulse" />
            <span className="text-green-600 font-bold animate-bounce">
              Complete!
            </span>
            <Sparkles className="h-6 w-6 text-green-500 animate-pulse" />
          </div>
        </div>
      )}

    </div>
  );
}

// Helper component for responsive status indicator
export function ResponsiveStatusIndicator(props: VisualStatusIndicatorProps) {
  return (
    <div className="responsive-status @container">
      <VisualStatusIndicator {...props} />
    </div>
  );
}

// Mobile-optimized status indicator
export function MobileStatusIndicator(props: VisualStatusIndicatorProps) {
  return (
    <div className="mobile-status-indicator">
      <VisualStatusIndicator {...props} compact={true} />
    </div>
  );
}

export default VisualStatusIndicator;
