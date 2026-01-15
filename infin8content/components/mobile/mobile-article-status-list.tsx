/**
 * Mobile Article Status List Component
 * 
 * Mobile-optimized article list with single-column layout, touch-friendly actions,
 * swipe gestures, and condensed information display.
 */

"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';
import { debounce, throttle } from '@/lib/utils/mobile-layout-utils';

export interface Article {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'under_review' | 'archived';
  lastModified: string;
  author: string;
  wordCount: number;
  excerpt?: string;
  tags?: string[];
}

export interface MobileArticleStatusListProps {
  articles: Article[];
  loading?: boolean;
  error?: string;
  onArticleSelect?: (article: Article) => void;
  onArticleEdit?: (articleId: string) => void;
  onArticleDelete?: (articleId: string) => void;
  onArticleStatusChange?: (articleId: string, status: Article['status']) => void;
  className?: string;
}

interface SwipeState {
  articleId: string | null;
  direction: 'left' | 'right' | null;
  startX: number;
  currentX: number;
  isDragging: boolean;
}

export function MobileArticleStatusList({
  articles,
  loading = false,
  error,
  onArticleSelect,
  onArticleEdit,
  onArticleDelete,
  onArticleStatusChange,
  className = '',
}: MobileArticleStatusListProps) {
  const {
    spacing,
    typography,
    touchOptimization,
    isTouchDevice,
    containerWidth,
    touchOptimized,
  } = useMobileLayout();

  const [swipeState, setSwipeState] = useState<SwipeState>({
    articleId: null,
    direction: null,
    startX: 0,
    currentX: 0,
    isDragging: false,
  });

  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Virtual scrolling for performance
  const handleScroll = useCallback(
    throttle(() => {
      if (!listRef.current) return;

      const { scrollTop, clientHeight } = listRef.current;
      const newVisibleItems = new Set<string>();

      articles.forEach((article) => {
        const element = itemRefs.current.get(article.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (offsetTop <= scrollTop + clientHeight && offsetTop + offsetHeight >= scrollTop) {
            newVisibleItems.add(article.id);
          }
        }
      });

      setVisibleItems(newVisibleItems);
    }, 50),
    [articles]
  );

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, articleId: string) => {
    if (!isTouchDevice || !e.touches || e.touches.length === 0) return;

    const touch = e.touches[0];
    setSwipeState({
      articleId,
      direction: null,
      startX: touch.clientX,
      currentX: touch.clientX,
      isDragging: true,
    });
  }, [isTouchDevice]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isDragging || !isTouchDevice || !e.touches || e.touches.length === 0) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const direction = deltaX > 0 ? 'right' : 'left';

    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      direction,
    }));
  }, [swipeState.isDragging, swipeState.startX, isTouchDevice]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging || !swipeState.articleId) return;

    const deltaX = Math.abs(swipeState.currentX - swipeState.startX);
    const swipeThreshold = touchOptimization.gestures.swipeThreshold;

    if (deltaX > swipeThreshold && swipeState.direction) {
      const articleId = swipeState.articleId;
      
      if (swipeState.direction === 'right' && onArticleEdit) {
        onArticleEdit(articleId);
      } else if (swipeState.direction === 'left' && onArticleDelete) {
        onArticleDelete(articleId);
      }
    }

    // Reset swipe state
    setSwipeState({
      articleId: null,
      direction: null,
      startX: 0,
      currentX: 0,
      isDragging: false,
    });
  }, [swipeState, touchOptimization.gestures.swipeThreshold, onArticleEdit, onArticleDelete]);

  // Format date for mobile display
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  // Get status color classes
  const getStatusColor = useCallback((status: Article['status']) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'under_review':
        return 'text-yellow-600 bg-yellow-100';
      case 'archived':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Render article item
  const renderArticleItem = useCallback((article: Article) => {
    const isSwiped = swipeState.articleId === article.id && swipeState.direction;
    const swipeOffset = isSwiped ? swipeState.currentX - swipeState.startX : 0;
    const isVisible = visibleItems.size === 0 || visibleItems.has(article.id);
    const shouldRender = articles.length <= 20 || isVisible;

    if (!shouldRender) {
      return null; // Virtual scrolling optimization
    }

    return (
      <div
        key={article.id}
        ref={(el) => {
          if (el) itemRefs.current.set(article.id, el);
        }}
        data-testid={`article-item-${article.id}`}
        role="article"
        aria-label={`${article.title} by ${article.author}, ${article.status.replace('_', ' ')}`}
        className="relative overflow-hidden"
        style={{
          marginBottom: spacing.card.marginBottom,
          minHeight: spacing.card.minHeight,
          padding: spacing.card.padding,
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeState.isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={(e) => handleTouchStart(e, article.id)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onArticleSelect?.(article)}
      >
        {/* Swipe actions overlay */}
        {isSwiped && (
          <div
            data-testid={`swipe-actions-${article.id}`}
            className="absolute inset-y-0 flex items-center px-4 pointer-events-none"
            style={{
              [swipeState.direction === 'right' ? 'left' : 'right']: 0,
              backgroundColor: swipeState.direction === 'right' ? '#3b82f6' : '#ef4444',
            }}
          >
            {swipeState.direction === 'right' ? (
              <span data-testid={`edit-action-${article.id}`} className="text-white font-medium">
                Edit
              </span>
            ) : (
              <span data-testid={`delete-action-${article.id}`} className="text-white font-medium">
                Delete
              </span>
            )}
          </div>
        )}

        {/* Article content */}
        <div className="relative z-10">
          {/* Title */}
          <h3
            data-testid="article-title"
            className="font-semibold text-gray-900 truncate mb-1"
            style={{
              fontSize: typography.heading.fontSize,
              fontWeight: typography.heading.fontWeight,
              lineHeight: typography.heading.lineHeight,
            }}
          >
            {article.title}
          </h3>

          {/* Meta information */}
          <div
            data-testid="article-meta"
            className="flex items-center justify-between text-sm text-gray-600 mb-2"
            style={{
              fontSize: typography.caption.fontSize,
              fontWeight: typography.caption.fontWeight,
              lineHeight: typography.caption.lineHeight,
            }}
          >
            <span>{article.author}</span>
            <span>{formatDate(article.lastModified)}</span>
          </div>

          {/* Status and word count */}
          <div className="flex items-center justify-between">
            <span
              data-testid={`status-${article.status}`}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}
              style={{
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              {article.status.replace('_', ' ')}
            </span>
            
            <span className="text-xs text-gray-500">
              {article.wordCount} words
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              role="button"
              tabIndex={0}
              aria-label={`Edit ${article.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onArticleEdit?.(article.id);
              }}
              className="flex-1 text-center py-2 px-3 bg-blue-500 text-white rounded-md font-medium"
              style={{
                minHeight: touchOptimization.minTouchTarget.size,
                margin: touchOptimization.spacing.small,
              }}
            >
              Edit
            </button>
            
            <button
              role="button"
              tabIndex={0}
              aria-label={`View ${article.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onArticleSelect?.(article);
              }}
              className="flex-1 text-center py-2 px-3 bg-gray-100 text-gray-700 rounded-md font-medium"
              style={{
                minHeight: touchOptimization.minTouchTarget.size,
                margin: touchOptimization.spacing.small,
              }}
            >
              View
            </button>
          </div>
        </div>
      </div>
    );
  }, [
    spacing,
    typography,
    touchOptimization,
    swipeState,
    visibleItems,
    articles.length,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    onArticleSelect,
    onArticleEdit,
    formatDate,
    getStatusColor,
  ]);

  // Loading state
  if (loading) {
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
          Loading articles...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        data-testid="error-state"
        className="flex flex-col items-center justify-center py-12"
        style={{ padding: spacing.container.padding }}
      >
        <div className="text-red-500 text-lg mb-2">⚠️</div>
        <p className="text-red-600 text-center" style={{ fontSize: typography.body.fontSize }}>
          {error}
        </p>
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div
        data-testid="empty-state"
        className="flex flex-col items-center justify-center py-12"
        style={{ padding: spacing.container.padding }}
      >
        <div className="text-gray-400 text-lg mb-2">📄</div>
        <p className="text-gray-600 text-center" style={{ fontSize: typography.body.fontSize }}>
          No articles found
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      data-testid="mobile-article-list"
      data-touch-optimized={touchOptimized ? 'true' : 'false'}
      className={`mobile-article-list ${className}`}
      onScroll={handleScroll}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: spacing.container.padding,
        maxWidth: spacing.container.maxWidth,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
    >
      {/* List header */}
      <div className="mb-4">
        <h2
          className="font-bold text-gray-900"
          style={{
            fontSize: typography.heading.fontSize,
            fontWeight: typography.heading.fontWeight,
            lineHeight: typography.heading.lineHeight,
            marginBottom: typography.heading.marginBottom,
          }}
        >
          Articles ({articles.length})
        </h2>
      </div>

      {/* Article list */}
      <div className="flex-1">
        {articles.map(renderArticleItem)}
      </div>
    </div>
  );
}
