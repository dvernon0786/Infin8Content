/**
 * Virtualized safeArticle list component for performance optimization
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import { List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VisualStatusIndicator } from '@/components/articles/visual-status-indicator';
import { getStatusConfig, statusConfigs } from '@/lib/constants/status-configs';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  FileText
} from 'lucide-react';
import type { DashboardArticle } from '@/lib/supabase/realtime';
import type { VirtualizedArticleListProps } from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';

interface ArticleItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    articles: DashboardArticle[];
    selectedArticle: string | null;
    onArticleSelect: (id: string) => void;
    onArticleNavigation: (id: string, e?: React.MouseEvent) => void;
    onKeyDown: (id: string, e: React.KeyboardEvent) => void;
    onTouchStart: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
    onTouchMove: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
    onTouchEnd: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
    showProgress: boolean;
  };
}

function ArticleItem({ index, style, data }: ArticleItemProps) {
  console.log('📄 ArticleItem rendering:', { index, articlesCount: data.articles?.length || 0 });
  
  try {
    const article = data.articles[index];
    console.log('📄 Article data:', { 
      index, 
      articleId: article?.id, 
      title: article?.title, 
      keyword: article?.keyword,
      status: article?.status,
      created_at: article?.created_at,
      updated_at: article?.updated_at,
      progress: article?.progress
    });
    
    if (!article) {
      console.error('🚨 ArticleItem: No article at index', index);
      return (
        <div style={style} className="p-4 border border-yellow-200 bg-yellow-50">
          <p className="text-yellow-600">No article data at index {index}</p>
        </div>
      );
    }
    
    // Defensive checks for all required properties
    const safeArticle = {
      id: article.id || `unknown-${index}`,
      title: article.title || 'Untitled Article',
      keyword: article.keyword || '',
      status: article.status || 'unknown',
      created_at: article.created_at || new Date().toISOString(),
      updated_at: article.updated_at || article.created_at || new Date().toISOString(),
      progress: article.progress || null
    };
    
    console.log('📄 Safe article data:', { 
      index, 
      safeId: safeArticle.id, 
      safeTitle: safeArticle.title, 
      safeKeyword: safeArticle.keyword,
      safeStatus: safeArticle.status
    });
    
    const isSelected = data.selectedArticle === safeArticle.id;
  const statusConfig = getStatusConfig(safeArticle.status);

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div style={style}>
      <Card 
        className={cn(
          'mx-2 transition-all duration-200 hover:shadow-md cursor-pointer',
          isSelected && 'ring-2 ring-blue-500'
        )}
        onClick={() => data.onArticleSelect(isSelected ? '' : safeArticle.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 
                className={cn(
                  'font-medium text-gray-900 truncate',
                  safeArticle.status === 'completed' && 'cursor-pointer hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
                )}
                title={safeArticle.status === 'completed' ? 'Click to view completed safeArticle' : undefined}
                role={safeArticle.status === 'completed' ? 'button' : undefined}
                tabIndex={safeArticle.status === 'completed' ? 0 : undefined}
                aria-label={safeArticle.status === 'completed' 
                  ? `completed safeArticle: ${safeArticle.title || safeArticle.keyword}, click to view` 
                  : undefined
                }
                onClick={(e) => {
                  if (safeArticle.status === 'completed') {
                    data.onArticleNavigation(safeArticle.id, e);
                  }
                }}
                onKeyDown={(e) => {
                  if (safeArticle.status === 'completed') {
                    data.onKeyDown(safeArticle.id, e);
                  }
                }}
                onTouchStart={(e) => {
                  if (safeArticle.status === 'completed') {
                    data.onTouchStart(safeArticle.id, e, e.currentTarget);
                  }
                }}
                onTouchMove={(e) => {
                  if (safeArticle.status === 'completed') {
                    data.onTouchMove(safeArticle.id, e, e.currentTarget);
                  }
                }}
                onTouchEnd={(e) => {
                  if (safeArticle.status === 'completed') {
                    data.onTouchEnd(safeArticle.id, e, e.currentTarget);
                  }
                }}
              >
                {safeArticle.title || safeArticle.keyword}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {safeArticle.keyword}
              </p>
            </div>
            
            {/* Visual Status Indicator */}
            <VisualStatusIndicator
              status={safeArticle.status}
              progress={safeArticle.progress}
              title={safeArticle.title || safeArticle.keyword}
              compact={true}
              isRealtime={true}
              onRetry={() => {
                // Retry functionality would be implemented here
              }}
            />
          </div>
          
          {/* Progress bar for active articles */}
          {data.showProgress && safeArticle.status === 'generating' && safeArticle.progress && (
            <div className="mb-3">
              <VisualStatusIndicator
                status={safeArticle.status}
                progress={safeArticle.progress}
                title={safeArticle.title || safeArticle.keyword}
                compact={false}
                isRealtime={true}
                onAnimationComplete={() => {
                  // Article completion notification would be handled here
                }}
              />
            </div>
          )}
          
          {/* Article metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Created {formatTimeAgo(safeArticle.created_at || '')}</span>
              <span>Updated {formatTimeAgo(safeArticle.updated_at || '')}</span>
            </div>
            
            {safeArticle.status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  // View functionality would be implemented here
                }}
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
            )}
          </div>
          
          {/* Error display */}
          {safeArticle.status === 'failed' && safeArticle.progress?.error_message && (
            <Card className="border-red-200 bg-red-50 mt-3">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    {safeArticle.progress.error_message}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
  } catch (error) {
    console.error('🚨 ArticleItem error:', error, { index, data });
    return (
      <div style={style} className="p-4 border border-red-200 bg-red-50">
        <p className="text-red-600">Error rendering safeArticle</p>
      </div>
    );
  }
}

export function VirtualizedArticleList({
  articles,
  itemHeight,
  height,
  overscanCount = 5,
  className,
  selectedArticle,
  onArticleSelect,
  onArticleNavigation,
  onKeyDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  showProgress = true,
}: VirtualizedArticleListProps & {
  selectedArticle?: string | null;
  onArticleSelect?: (id: string) => void;
  onArticleNavigation?: (id: string, e?: React.MouseEvent) => void;
  onKeyDown?: (id: string, e: React.KeyboardEvent) => void;
  onTouchStart?: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
  onTouchMove?: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
  onTouchEnd?: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
  showProgress?: boolean;
}) {
  console.log('📋 VirtualizedArticleList initializing:', {
    articlesCount: articles?.length || 0,
    itemHeight,
    height,
    selectedArticle,
    hasCallbacks: {
      onArticleSelect: !!onArticleSelect,
      onArticleNavigation: !!onArticleNavigation,
      onKeyDown: !!onKeyDown,
      onTouchStart: !!onTouchStart,
      onTouchMove: !!onTouchMove,
      onTouchEnd: !!onTouchEnd
    }
  });

  // Validate articles data
  if (articles && Array.isArray(articles)) {
    console.log('📋 Articles validation:', {
      isArray: Array.isArray(articles),
      length: articles.length,
      firstArticle: articles[0] ? {
        id: articles[0].id,
        title: articles[0].title,
        keyword: articles[0].keyword,
        status: articles[0].status,
        hasNullKeyword: articles[0].keyword === null,
        hasUndefinedKeyword: articles[0].keyword === undefined,
        keywordType: typeof articles[0].keyword
      } : 'No first safeArticle'
    });
  }

  try {
  const listRef = useRef<any>(null);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => {
    console.log('📋 Creating itemData:', {
      articlesCount: articles?.length || 0,
      articles: articles?.map(a => ({ id: a.id, title: a.title, keyword: a.keyword, status: a.status })),
      selectedArticle,
      hasCallbacks: {
        onArticleSelect: !!onArticleSelect,
        onArticleNavigation: !!onArticleNavigation,
        onKeyDown: !!onKeyDown,
        onTouchStart: !!onTouchStart,
        onTouchMove: !!onTouchMove,
        onTouchEnd: !!onTouchEnd
      },
      showProgress
    });

    return {
      articles,
      selectedArticle: selectedArticle || null,
      onArticleSelect: onArticleSelect || (() => {}),
      onArticleNavigation: onArticleNavigation || (() => {}),
      onKeyDown: onKeyDown || (() => {}),
      onTouchStart: onTouchStart || (() => {}),
      onTouchMove: onTouchMove || (() => {}),
      onTouchEnd: onTouchEnd || (() => {}),
      showProgress,
    };
  }, [articles, selectedArticle, onArticleSelect, onArticleNavigation, onKeyDown, onTouchStart, onTouchMove, onTouchEnd, showProgress]);

  // Scroll to selected safeArticle
  const scrollToItem = useCallback((index: number) => {
    if (listRef.current) {
      listRef.current.scrollToItem(index);
    }
  }, []);

  // Get item key for stable rendering
  const getItemKey = useCallback((index: number): string => {
    return articles[index]?.id || index.toString();
  }, [articles]);

  if (articles.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filters to find articles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('virtualized-safeArticle-list', className)}>
      {(() => {
        console.log('🎯 About to create React List element:', {
          height,
          itemCount: articles.length,
          itemSize: itemHeight,
          itemDataKeys: Object.keys(itemData),
          hasChildren: !!ArticleItem
        });
        
        try {
          return React.createElement(List, {
            height,
            itemCount: articles.length,
            itemSize: itemHeight,
            itemData,
            overscanCount,
            getItemKey,
            className: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
            children: ArticleItem
          } as any);
        } catch (error) {
          console.error('🚨 React.createElement error:', error);
          throw error;
        }
      })()}
      
      {/* Performance info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Virtualized {articles.length} articles • {itemHeight}px height • {overscanCount} overscan
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('🚨 VirtualizedArticleList error:', error);
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Error loading safeArticle list. Please refresh the page.</p>
      </div>
    );
  }
}

/**
 * Adaptive virtualized list that adjusts item height based on content
 */
export function AdaptiveVirtualizedArticleList({
  articles,
  height = 600,
  overscanCount = 5,
  className,
  selectedArticle,
  onArticleSelect,
  onArticleNavigation,
  onKeyDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  showProgress = true,
}: VirtualizedArticleListProps & {
  height?: number;
  overscanCount?: number;
  selectedArticle?: string | null;
  onArticleSelect?: (id: string) => void;
  onArticleNavigation?: (id: string, e?: React.MouseEvent) => void;
  onKeyDown?: (id: string, e: React.KeyboardEvent) => void;
  onTouchStart?: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
  onTouchMove?: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
  onTouchEnd?: (id: string, e: React.TouchEvent, element: HTMLElement) => void;
  showProgress?: boolean;
}) {
  // Estimate item height based on content
  const estimatedItemHeight = useMemo(() => {
    if (articles.length === 0) return 200;
    
    // Base height + variable height for progress/error content
    let totalHeight = 0;
    const sampleSize = Math.min(articles.length, 10);
    
    for (let i = 0; i < sampleSize; i++) {
      const safeArticle = articles[i];
      let itemHeight = 120; // Base height
      
      // Add height for progress indicator
      if (safeArticle.status === 'generating' && safeArticle.progress) {
        itemHeight += 60;
      }
      
      // Add height for error message
      if (safeArticle.status === 'failed' && safeArticle.progress?.error_message) {
        itemHeight += 80;
      }
      
      totalHeight += itemHeight;
    }
    
    return Math.round(totalHeight / sampleSize);
  }, [articles]);

  return (
    <VirtualizedArticleList
      articles={articles}
      itemHeight={estimatedItemHeight}
      height={height}
      overscanCount={overscanCount}
      className={className}
      selectedArticle={selectedArticle}
      onArticleSelect={onArticleSelect}
      onArticleNavigation={onArticleNavigation}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      showProgress={showProgress}
    />
  );
}

/**
 * Mobile-optimized virtualized list with smaller item heights
 */
export function MobileVirtualizedArticleList({
  articles,
  height = 400,
  className,
  selectedArticle,
  onArticleSelect,
  onArticleNavigation,
  onKeyDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  showProgress = true,
}: VirtualizedArticleListProps) {
  return (
    <VirtualizedArticleList
      articles={articles}
      itemHeight={160} // Smaller height for mobile
      height={height}
      overscanCount={3} // Fewer overscan items for mobile performance
      className={cn('mobile-optimized', className)}
      selectedArticle={selectedArticle}
      onArticleSelect={onArticleSelect}
      onArticleNavigation={onArticleNavigation}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      showProgress={showProgress}
    />
  );
}
