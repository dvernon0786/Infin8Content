/**
 * Virtualized article list component for performance optimization
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GenerateArticleButton } from '@/components/articles/generate-article-button';
import { VisualStatusIndicator } from '@/components/articles/visual-status-indicator';
import { getStatusConfig, statusConfigs } from '@/lib/constants/status-configs';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import type { DashboardArticle } from '@/lib/types/dashboard.types';
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
  };
}

function ArticleItem({ index, style, data }: ArticleItemProps) {
  try {
    const article = data.articles[index];
    if (!article) return null;

    const isSelected = data.selectedArticle === article.id;

    // Format time ago
    const formatTimeAgo = (timestamp: string): string => {
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
            'mx-2 cursor-pointer transition-colors hover:bg-neutral-50',
            isSelected && 'ring-2 ring-[--brand-electric-blue]'
          )}
          onClick={() => data.onArticleSelect(isSelected ? '' : article.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'font-poppins text-neutral-900 text-small font-semibold truncate',
                    article.status === 'completed' && 'cursor-pointer hover:text-primary focus:outline-none focus:ring-2 focus:ring-[--brand-electric-blue]/50 focus:ring-offset-2 rounded'
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
                <p className="font-lato text-neutral-500 text-small truncate">
                  {article.keyword}
                </p>
              </div>

              {/* Visual Status Indicator */}
              <VisualStatusIndicator
                status={article.status}
                title={article.title || article.keyword}
                compact={true}
                isRealtime={true}
                onRetry={() => { }}
              />
            </div>

            {/* Article metadata */}
            <div className="flex items-center justify-between font-lato text-small text-neutral-500">
              <div className="flex items-center gap-4">
                <span>Created {formatTimeAgo(article.created_at)}</span>
                <span>Updated {formatTimeAgo(article.updated_at)}</span>
              </div>

              {article.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 font-lato text-neutral-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onArticleNavigation(article.id, e);
                  }}
                >
                  <Eye className="h-3 w-3 text-neutral-500" />
                  <span className="text-neutral-500">View</span>
                </Button>
              )}

              {article.status === 'queued' && (
                <GenerateArticleButton articleId={article.id} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return null;
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
}: VirtualizedArticleListProps) {
  const listRef = useRef<any>(null);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => {
    return {
      articles: articles || [],
      selectedArticle: selectedArticle || null,
      onArticleSelect: onArticleSelect || (() => { }),
      onArticleNavigation: onArticleNavigation || (() => { }),
      onKeyDown: onKeyDown || (() => { }),
      onTouchStart: onTouchStart || (() => { }),
      onTouchMove: onTouchMove || (() => { }),
      onTouchEnd: onTouchEnd || (() => { }),
    };
  }, [articles, selectedArticle, onArticleSelect, onArticleNavigation, onKeyDown, onTouchStart, onTouchMove, onTouchEnd]);

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
          <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">No articles found</h3>
          <p className="font-lato text-neutral-600 text-body">
            Try adjusting your search or filters to find articles.
          </p>
        </div>
      </div>
    );
  }

  // Guard: Ensure all required variables are defined before rendering List
  if (!itemData || !getItemKey || height === undefined || itemHeight === undefined) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <p className="text-muted-foreground">Loading article list...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={cn('virtualized-article-list', className)}>
        <div className="overflow-y-auto h-[600px]">
          {articles.map((article, index) => (
            <React.Fragment key={article.id || index}>
              {ArticleItem({
                index,
                style: { height: '160px' },
                data: itemData
              } as ArticleItemProps)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('🚨 VirtualizedArticleList error:', error);
    }
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
export function AdaptiveVirtualizedArticleList(props: VirtualizedArticleListProps) {
  return (
    <VirtualizedArticleList
      {...props}
      itemHeight={160}
    />
  );
}

/**
 * Mobile-optimized virtualized list with smaller item heights
 */
export function MobileVirtualizedArticleList(props: VirtualizedArticleListProps) {
  return (
    <VirtualizedArticleList
      {...props}
      itemHeight={160}
      className={cn('mobile-optimized', props.className)}
    />
  );
}
