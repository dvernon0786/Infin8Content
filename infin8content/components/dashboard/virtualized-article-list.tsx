/**
 * Virtualized article list component for performance optimization
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React, { useMemo, useCallback, useRef } from 'react';
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
  if (process.env.NODE_ENV !== 'production') {
    console.log('📄 ArticleItem rendering:', { index, articlesCount: data.articles?.length || 0 });
  }
  
  try {
    const article = data.articles[index];
    if (process.env.NODE_ENV !== 'production') {
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
    }
    if (!article) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('🚨 ArticleItem: No article at index', index);
      }
      return (
        <div style={style} className="p-4 border border-yellow-200 bg-yellow-50">
          <p className="text-yellow-600">No article data at index {index}</p>
        </div>
      );
    }
    
    // Since we're using articles, all properties should be defined
    // but we still add defensive checks for extra safety
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
                  article.status === 'completed' && 'cursor-pointer hover:text-[--brand-electric-blue] focus:outline-none focus:ring-2 focus:ring-[--brand-electric-blue]/50 focus:ring-offset-2 rounded'
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
          <div className="flex items-center justify-between font-lato text-small text-neutral-500">
            <div className="flex items-center gap-4">
              <span>Created {formatTimeAgo(article.created_at || '')}</span>
              <span>Updated {formatTimeAgo(article.updated_at || '')}</span>
            </div>
            
            {article.status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 font-lato text-neutral-500"
                onClick={(e) => {
                  e.stopPropagation();
                  // View functionality would be implemented here
                }}
              >
                <Eye className="h-3 w-3 text-neutral-500" />
                <span className="text-neutral-500">View</span>
              </Button>
            )}
          </div>
          
          {/* Error display */}
          {article.status === 'failed' && article.progress?.error_message && (
            <Card className="border-neutral-200 bg-neutral-50 mt-3">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-neutral-600 mt-0.5" />
                  <div className="font-lato text-neutral-600 text-small">
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('🚨 ArticleItem error:', error, { index, data });
    }
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
  if (process.env.NODE_ENV !== 'production') {
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
  }
  // Validate articles data
  if (articles && Array.isArray(articles)) {
    const firstArticle = articles[0];
    if (process.env.NODE_ENV !== 'production') {
      console.log('📋 Articles validation:', {
        isArray: Array.isArray(articles),
        length: articles.length,
        firstArticle: firstArticle ? {
          id: firstArticle.id,
          title: firstArticle.title,
          keyword: firstArticle.keyword,
        status: firstArticle.status,
        hasNullKeyword: firstArticle.keyword === null,
        hasUndefinedKeyword: firstArticle.keyword === undefined,
        keywordType: typeof firstArticle.keyword,
        // Check for nested objects that might be undefined
        progress: firstArticle.progress,
        progressType: typeof firstArticle.progress,
        hasNullProgress: firstArticle.progress === null,
        hasUndefinedProgress: firstArticle.progress === undefined
      } : 'No first article'
      });
    }
  }

  // Create safe articles array with all properties guaranteed to be defined
  const safeArticles = useMemo(() => {
    if (!articles || !Array.isArray(articles)) return [];
    
    return articles.map((article, index) => {
      try {
        // Ensure all properties have safe defaults - NEVER null or undefined
        return {
          id: article?.id || `unknown-${index}`,
          title: article?.title || 'Untitled Article',
          keyword: article?.keyword || '',
          status: article?.status || 'unknown',
          created_at: article?.created_at || new Date().toISOString(),
          updated_at: article?.updated_at || article?.created_at || new Date().toISOString(),
          progress: article?.progress || {} // Never null - use empty object
        };
      } catch (error) {
        console.error(`🚨 Error processing article at index ${index}:`, error);
        return {
          id: `error-${index}`,
          title: 'Error Loading Article',
          keyword: '',
          status: 'error',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          progress: {} // Never null - use empty object
        };
      }
    });
  }, [articles]);

  if (process.env.NODE_ENV !== 'production') {
    console.log('📋 Safe articles created:', { 
      originalCount: articles?.length || 0, 
      safeCount: safeArticles.length,
      firstSafeArticle: safeArticles[0],
      // Add detailed article inspection
      allArticlesStructure: safeArticles.map((article, index) => ({
        index,
        id: article?.id,
        title: article?.title,
        keyword: article?.keyword,
        status: article?.status,
        created_at: article?.created_at,
      updated_at: article?.updated_at,
      progress: article?.progress,
      progressType: typeof article?.progress,
      progressKeys: article?.progress ? Object.keys(article.progress) : 'null',
      hasNullProperties: Object.keys(article).filter(key => (article as any)[key] === null),
      hasUndefinedProperties: Object.keys(article).filter(key => (article as any)[key] === undefined)
    }))
    });
  }

  const listRef = useRef<any>(null);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('📋 Creating itemData:', {
        articlesCount: safeArticles?.length || 0,
        articles: safeArticles?.map(a => ({ id: a.id, title: a.title, keyword: a.keyword, status: a.status })),
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
    }

    // Create completely safe itemData - no undefined values allowed
    const safeItemData = {
      articles: safeArticles || [],
      selectedArticle: selectedArticle || null,
      onArticleSelect: onArticleSelect || (() => {}),
      onArticleNavigation: onArticleNavigation || (() => {}),
      onKeyDown: onKeyDown || (() => {}),
      onTouchStart: onTouchStart || (() => {}),
      onTouchMove: onTouchMove || (() => {}),
      onTouchEnd: onTouchEnd || (() => {}),
      showProgress: showProgress ?? true
    };

    // Keep all properties including functions - JSON.stringify removes functions!
const cleanedItemData = safeItemData;

    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Cleaned itemData:', {
        articlesCount: cleanedItemData.articles?.length || 0,
        hasArticles: cleanedItemData.articles?.length > 0,
        selectedArticle: cleanedItemData.selectedArticle,
        showProgress: cleanedItemData.showProgress,
        // Log all properties to see what's actually there
        allKeys: Object.keys(cleanedItemData),
        hasArticlesArray: !!cleanedItemData.articles,
        articlesArrayLength: cleanedItemData.articles?.length || 0,
        hasOnArticleSelect: typeof cleanedItemData.onArticleSelect === 'function',
        hasOnArticleNavigation: typeof cleanedItemData.onArticleNavigation === 'function',
      hasOnKeyDown: typeof cleanedItemData.onKeyDown === 'function',
      hasOnTouchStart: typeof cleanedItemData.onTouchStart === 'function',
      hasOnTouchMove: typeof cleanedItemData.onTouchMove === 'function',
      hasOnTouchEnd: typeof cleanedItemData.onTouchEnd === 'function',
      // Show the actual itemData structure
      fullItemData: cleanedItemData
      });
    }

    return cleanedItemData;
  }, [safeArticles, selectedArticle, onArticleSelect, onArticleNavigation, onKeyDown, onTouchStart, onTouchMove, onTouchEnd, showProgress]);

  // Scroll to selected article
  const scrollToItem = useCallback((index: number) => {
    if (listRef.current) {
      listRef.current.scrollToItem(index);
    }
  }, []);

  // Get item key for stable rendering
  const getItemKey = useCallback((index: number): string => {
    return safeArticles[index]?.id || index.toString();
  }, [safeArticles]);

  if (safeArticles.length === 0) {
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
    console.warn('⚠️ VirtualizedArticleList: Missing required props', {
      hasItemData: !!itemData,
      hasGetItemKey: !!getItemKey,
      height,
      itemHeight
    });
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
      {safeArticles.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">No articles found</h3>
            <p className="font-lato text-neutral-600 text-body">Try adjusting your search or filters to find articles.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto h-[600px]">
          {safeArticles.map((article, index) => (
            <React.Fragment key={article.id || index}>
              {ArticleItem({
                index,
                style: { height: '160px' },
                data: itemData
              } as ArticleItemProps)}
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* Performance info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs font-lato text-neutral-500 mt-2 text-center">
          Rendered {safeArticles.length} articles • {itemHeight}px height
        </div>
      )}
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
