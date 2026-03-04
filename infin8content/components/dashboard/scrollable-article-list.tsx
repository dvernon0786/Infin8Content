/**
 * Scrollable article list component for dashboard
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GenerateArticleButton } from '@/components/articles/generate-article-button';
import { VisualStatusIndicator } from '@/components/articles/visual-status-indicator';
import { Eye, FileText } from 'lucide-react';
import type { DashboardArticle } from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';
import type { ScrollableArticleListProps } from '@/lib/types/dashboard.types';

function ArticleAction({ article }: { article: DashboardArticle }) {
  switch (true) {
    case article.status === 'completed':
      return (
        <Button
          size="sm"
          className="bg-[--brand-electric-blue] text-white hover:opacity-90 font-semibold h-7 text-xs px-3"
        >
          View →
        </Button>
      )

    case article.status === 'failed':
      return (
        <Button
          size="sm"
          className="bg-red-600 text-white hover:bg-red-700 font-semibold h-7 text-xs px-3"
          onClick={(e) => { e.stopPropagation(); }}
        >
          Retry
        </Button>
      )

    case article.status === 'queued':
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <GenerateArticleButton articleId={article.id} />
        </div>
      )

    default:
      return (
        <span className="text-neutral-400 font-semibold text-xs">
          Processing…
        </span>
      )
  }
}

export function ScrollableArticleList({
  articles,
  className,
  onArticleNavigation,
  onKeyDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  highlightArticleId,
}: ScrollableArticleListProps) {
  if (articles.length === 0) {
    return null;
  }

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
    <div className={cn('scrollable-article-list', className)}>
      <div className="overflow-y-auto flex-1 min-h-0">
        {articles.map((article) => {
          return (
            <div key={article.id} className="mb-4">
              <Card
                className={cn(
                  'mx-2 cursor-pointer border border-neutral-200 hover:border-[--brand-electric-blue]/40 hover:shadow-sm transition-all',
                  highlightArticleId === article.id && 'animate-[i8c-pulse_1.5s_ease-out] border-[--color-warning]'
                )}
                role="button"
                tabIndex={0}
                onClick={(e) => onArticleNavigation(article.id, e)}
                onKeyDown={(e) => onKeyDown(article.id, e)}
                onTouchStart={(e) => onTouchStart(article.id, e, e.currentTarget)}
                onTouchMove={(e) => onTouchMove(article.id, e, e.currentTarget)}
                onTouchEnd={(e) => onTouchEnd(article.id, e, e.currentTarget)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-poppins text-neutral-900 text-small font-semibold truncate"
                      >
                        {article.title || article.keyword}
                      </h3>
                      <p className="font-lato text-neutral-500 text-small truncate">
                        {article.keyword}
                      </p>
                    </div>

                    <div className="opacity-90">
                      <VisualStatusIndicator
                        status={article.status}
                        compact={true}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-lato text-small text-neutral-500">
                    <div className="flex items-center gap-4">
                      <span>Created {formatTimeAgo(article.created_at)}</span>
                      <span>Updated {formatTimeAgo(article.updated_at)}</span>
                    </div>

                    <ArticleAction article={article} />
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
