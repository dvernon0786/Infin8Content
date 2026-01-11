/**
 * Virtualized article list component for performance optimization
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
    console.log('📄 Article data:', { index, articleId: article?.id, title: article?.title, keyword: article?.keyword });
    
    if (!article) {
      console.error('🚨 ArticleItem: No article at index', index);
      return null;
    }
    
    const isSelected = data.selectedArticle === article.id;
  const statusConfig = getStatusConfig(article.status);

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
        onClick={() => data.onArticleSelect(isSelected ? '' : article.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 
                className={cn(
                  'font-medium text-gray-900 truncate',
                  article.status === 'completed' && 'cursor-pointer hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
                )}
                title={article.status === 'completed' ? 'Click to view completed article' : undefined}
                role={article.status === 'completed' ? 'button' : undefined}
                tabIndex={article.status === 'completed' ? 0 : undefined}
                aria-label={article.status === 'completed' 
                  ? `completed article: ${article.title || article.keyword}, click to view` 
                  : undefined
                }
                onClick={(e) => {
                  if (article.status === 'completed') {
                    data.onArticleNavigation(article.id, e);
                  }
                }}
                onKeyDown={(e) => {
                  if (article.status === 'completed') {
                    data.onKeyDown(article.id, e);
                  }
                }}
                onTouchStart={(e) => {
                  if (article.status === 'completed') {
                    data.onTouchStart(article.id, e, e.currentTarget);
                  }
                }}
                onTouchMove={(e) => {
                  if (article.status === 'completed') {
                    data.onTouchMove(article.id, e, e.currentTarget);
                  }
                }}
                onTouchEnd={(e) => {
                  if (article.status === 'completed') {
                    data.onTouchEnd(article.id, e, e.currentTarget);
                  }
                }}
              >
                {article.title || article.keyword}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {article.keyword}
              </p>
            </div>
            
            {/* Visual Status Indicator */}
            <VisualStatusIndicator
              status={article.status}
              progress={article.progress}
              title={article.title || article.keyword}
              compact={true}
              isRealtime={true}
              onRetry={() => {
                // Retry functionality would be implemented here
              }}
            />
          </div>
          
          {/* Progress bar for active articles */}
          {data.showProgress && article.status === 'generating' && article.progress && (
            <div className="mb-3">
              <VisualStatusIndicator
                status={article.status}
                progress={article.progress}
                title={article.title || article.keyword}
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
              <span>Created {formatTimeAgo(article.created_at || '')}</span>
              <span>Updated {formatTimeAgo(article.updated_at || '')}</span>
            </div>
            
            {article.status === 'completed' && (
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
          {article.status === 'failed' && article.progress?.error_message && (
            <Card className="border-red-200 bg-red-50 mt-3">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    {article.progress.error_message}
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
        <p className="text-red-600">Error rendering article</p>
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

  // Scroll to selected article
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
    <div className={cn('virtualized-article-list', className)}>
      {React.createElement(List, {
        height,
        itemCount: articles.length,
        itemSize: itemHeight,
        itemData,
        overscanCount,
        getItemKey,
        className: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        children: ArticleItem
      } as any)}
      
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
        <p className="text-muted-foreground">Error loading article list. Please refresh the page.</p>
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
      const article = articles[i];
      let itemHeight = 120; // Base height
      
      // Add height for progress indicator
      if (article.status === 'generating' && article.progress) {
        itemHeight += 60;
      }
      
      // Add height for error message
      if (article.status === 'failed' && article.progress?.error_message) {
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
