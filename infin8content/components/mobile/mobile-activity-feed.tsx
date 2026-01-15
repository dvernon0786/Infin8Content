/**
 * Mobile Activity Feed Component
 * 
 * Mobile-optimized activity feed with vertical scrolling, pull-to-refresh,
 * touch-optimized activity items, and real-time updates with mobile performance optimizations.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';
import { debounce, throttle } from '@/lib/utils/mobile-layout-utils';

export interface ActivityUser {
  id: string;
  name: string;
  avatar: string;
}

export interface ActivityMetadata {
  articleId?: string;
  articleTitle?: string;
  commentId?: string;
  [key: string]: any;
}

export interface Activity {
  id: string;
  type: 'article_created' | 'article_published' | 'article_updated' | 'comment_added' | 'user_joined' | 'organization_created';
  message: string;
  timestamp: string;
  user: ActivityUser;
  metadata?: ActivityMetadata;
}

export interface MobileActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  onActivityClick?: (activity: Activity) => void;
  className?: string;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

interface TouchState {
  startY: number;
  currentY: number;
  isDragging: boolean;
}

export function MobileActivityFeed({
  activities,
  loading = false,
  error,
  onRefresh,
  onLoadMore,
  onActivityClick,
  className = '',
}: MobileActivityFeedProps) {
  const {
    spacing,
    typography,
    touchOptimization,
    isTouchDevice,
    containerHeight,
  } = useMobileLayout();

  const [pullToRefresh, setPullToRefresh] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  });

  const [touchState, setTouchState] = useState<TouchState>({
    startY: 0,
    currentY: 0,
    isDragging: false,
  });

  const [visibleActivities, setVisibleActivities] = useState<Set<string>>(new Set());
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);
  const activityRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Format timestamp for mobile display
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  // Get activity type icon and color
  const getActivityTypeInfo = useCallback((type: Activity['type']) => {
    switch (type) {
      case 'article_created':
        return { icon: '📝', color: '#3b82f6', bgColor: '#dbeafe' };
      case 'article_published':
        return { icon: '🚀', color: '#10b981', bgColor: '#d1fae5' };
      case 'article_updated':
        return { icon: '✏️', color: '#f59e0b', bgColor: '#fef3c7' };
      case 'comment_added':
        return { icon: '💬', color: '#8b5cf6', bgColor: '#ede9fe' };
      case 'user_joined':
        return { icon: '👋', color: '#06b6d4', bgColor: '#cffafe' };
      case 'organization_created':
        return { icon: '🏢', color: '#ef4444', bgColor: '#fee2e2' };
      default:
        return { icon: '📌', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  }, []);

  // Handle pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice || !onRefresh || !e.touches || e.touches.length === 0) return;

    const touch = e.touches[0];
    setTouchState({
      startY: touch.clientY,
      currentY: touch.clientY,
      isDragging: true,
    });
  }, [isTouchDevice, onRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging || !isTouchDevice || !e.touches || e.touches.length === 0) return;

    const touch = e.touches[0];
    const pullDistance = touch.clientY - touchState.startY;
    
    // Only allow pulling down (positive distance)
    if (pullDistance < 0) return;

    setTouchState(prev => ({ ...prev, currentY: touch.clientY }));
    setPullToRefresh(prev => ({
      ...prev,
      isPulling: true,
      pullDistance: Math.min(pullDistance, 120), // Max pull distance
    }));
  }, [touchState.isDragging, touchState.startY, isTouchDevice]);

  const handleTouchEnd = useCallback(async () => {
    if (!touchState.isDragging || !onRefresh) return;

    const pullThreshold = 60; // Minimum pull distance to trigger refresh
    
    if (pullToRefresh.pullDistance >= pullThreshold) {
      setPullToRefresh(prev => ({ ...prev, isRefreshing: true }));
      
      try {
        await onRefresh();
        setRefreshError(null);
      } catch (err) {
        setRefreshError('Failed to refresh');
      } finally {
        setPullToRefresh(prev => ({ ...prev, isRefreshing: false }));
      }
    }

    // Reset states
    setTouchState({ startY: 0, currentY: 0, isDragging: false });
    setPullToRefresh({ isPulling: false, pullDistance: 0, isRefreshing: false });
  }, [touchState.isDragging, pullToRefresh.pullDistance, onRefresh]);

  // Handle infinite scroll
  const handleScroll = useCallback(
    throttle(() => {
      if (!feedRef.current || !onLoadMore) return;

      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      
      // Trigger load more when near bottom (100px from bottom)
      if (scrollHeight - scrollTop - clientHeight < 100) {
        onLoadMore();
      }

      // Update visible activities for performance
      const newVisibleActivities = new Set<string>();
      
      activities.forEach((activity) => {
        const element = activityRefs.current.get(activity.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (offsetTop <= scrollTop + clientHeight && offsetTop + offsetHeight >= scrollTop) {
            newVisibleActivities.add(activity.id);
          }
        }
      });

      setVisibleActivities(newVisibleActivities);
    }, 50),
    [activities, onLoadMore]
  );

  // Render activity item
  const renderActivityItem = useCallback((activity: Activity) => {
    const typeInfo = getActivityTypeInfo(activity.type);
    const isVisible = visibleActivities.size === 0 || visibleActivities.has(activity.id);

    // Only apply virtual scrolling for large lists
    if (!isVisible && activities.length > 20) {
      return null;
    }

    return (
      <div
        key={activity.id}
        ref={(el) => {
          if (el) activityRefs.current.set(activity.id, el);
        }}
        data-testid={`activity-item-${activity.id}`}
        role="article"
        tabIndex={0}
        aria-label={`${activity.user?.name || 'Unknown User'} ${activity.message}`}
        className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md"
        style={{
          marginBottom: spacing.card.marginBottom,
          minHeight: spacing.list.itemHeight,
          padding: spacing.card.padding,
        }}
        onClick={() => onActivityClick?.(activity)}
        onTouchStart={(e) => {
          // Add touch feedback
          e.currentTarget.classList.add('touch-active');
        }}
        onTouchEnd={(e) => {
          // Remove touch feedback
          e.currentTarget.classList.remove('touch-active');
        }}
      >
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
            data-testid={`activity-avatar-${activity.id}`}
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
            }}
          >
            {activity.user?.avatar ? (
              <img
                src={activity.user.avatar}
                alt={activity.user.name || 'Unknown User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.textContent = (activity.user?.name || 'U').charAt(0).toUpperCase();
                }}
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {(activity.user?.name || 'Unknown User').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            {/* Activity Header */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-medium text-gray-900 truncate"
                style={{
                  fontSize: typography.body.fontSize,
                  fontWeight: typography.body.fontWeight,
                }}
              >
                {activity.user?.name || 'Unknown User'}
              </span>
              <span
                className="text-xs text-gray-500"
                data-testid={`activity-timestamp-${activity.id}`}
                style={{
                  fontSize: typography.caption.fontSize,
                  fontWeight: typography.caption.fontWeight,
                }}
              >
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>

            {/* Activity Message */}
            <p
              className="text-gray-700 text-sm leading-relaxed"
              style={{
                fontSize: typography.body.fontSize,
                fontWeight: typography.body.fontWeight,
                lineHeight: typography.body.lineHeight,
                marginBottom: typography.body.marginBottom,
              }}
            >
              {activity.message}
            </p>

            {/* Activity Type Badge */}
            <div className="flex items-center mt-2">
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                data-testid={`activity-type-${activity.type}`}
                style={{
                  backgroundColor: typeInfo.bgColor,
                  color: typeInfo.color,
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                <span className="mr-1">{typeInfo.icon}</span>
                {activity.type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    spacing,
    typography,
    visibleActivities,
    activities.length,
    formatTimestamp,
    getActivityTypeInfo,
    onActivityClick,
  ]);

  // Loading state
  if (loading && activities.length === 0) {
    return (
      <div
        data-testid="loading-state"
        className="flex flex-col items-center justify-center py-12"
        style={{ padding: spacing.container.padding }}
      >
        <div
          data-testid="loading-spinner"
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
        />
        <p className="mt-4 text-gray-600" style={{ fontSize: typography.body.fontSize }}>
          Loading activities...
        </p>
      </div>
    );
  }

  // Empty state
  if (activities.length === 0 && !loading) {
    return (
      <div
        data-testid="empty-state"
        className="flex flex-col items-center justify-center py-12"
        style={{ padding: spacing.container.padding }}
      >
        <div className="text-gray-400 text-lg mb-2">📭</div>
        <p className="text-gray-600 text-center" style={{ fontSize: typography.body.fontSize }}>
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      data-testid="mobile-activity-feed"
      className={`mobile-activity-feed ${className}`}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: spacing.container.padding,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        position: 'relative',
      }}
    >
      {/* Pull-to-refresh indicator */}
      {pullToRefresh.isPulling && (
        <div
          data-testid="refresh-indicator"
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white border-b border-gray-200 z-10"
          style={{
            height: `${Math.max(40, pullToRefresh.pullDistance)}px`,
            transform: `translateY(-${Math.max(0, pullToRefresh.pullDistance - 40)}px)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          {pullToRefresh.isRefreshing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Refreshing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="text-blue-500">↓</div>
              <span className="text-sm text-gray-600">Pull to refresh</span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {refreshError && (
        <div
          data-testid="error-message"
          className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
        >
          <p className="text-red-600 text-sm">{refreshError}</p>
        </div>
      )}

      {/* Activity announcements for screen readers */}
      <div
        data-testid="activity-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {activities.map(activity => (
          <div key={activity.id}>
            {activity.user?.name || 'Unknown User'} {activity.message}
          </div>
        ))}
      </div>

      {/* Activity list */}
      <div className="flex-1">
        {activities.map(renderActivityItem)}
      </div>

      {/* Load more indicator */}
      {onLoadMore && (
        <div className="py-4 text-center">
          <div className="text-gray-500 text-sm">Loading more activities...</div>
        </div>
      )}
    </div>
  );
}
