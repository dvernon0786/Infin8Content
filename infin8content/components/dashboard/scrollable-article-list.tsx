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
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ScrollableArticleListProps } from '@/lib/types/dashboard.types';

function ArticleAction({ article, plan }: { article: DashboardArticle; plan?: string }) {
  const [pending, setPending] = useState(false)

  // Clear pending state if article status actually changes (e.g. from realtime update)
  useEffect(() => {
    if (article.status !== 'failed') {
      setPending(false)
    }
  }, [article.status])

  if (article.status === 'completed') {
    return (
      <Button
        size="sm"
        className="bg-[--brand-electric-blue] text-white hover:opacity-90 font-semibold h-7 text-xs px-3"
      >
        View →
      </Button>
    )
  }

  if (article.status === 'failed') {
    return (
      <Button
        size="sm"
        disabled={pending}
        className="bg-red-600 text-white hover:bg-red-700 font-semibold h-7 text-xs px-3"
        onClick={async (e) => {
          e.stopPropagation();
          setPending(true);
          try {
            await fetch('/api/articles/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ articleId: article.id }),
            });
          } catch (error) {
            console.error('Retry failed:', error);
          }
        }}
      >
        {pending ? 'Starting...' : 'Retry'}
      </Button>
    )
  }

  if (article.status === 'draft' && plan === 'trial') {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <GenerateArticleButton articleId={article.id} />
      </div>
    )
  }

  if (article.status === 'queued') {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <GenerateArticleButton articleId={article.id} />
      </div>
    )
  }

  return (
    <span className="text-neutral-400 font-semibold text-xs">
      Processing…
    </span>
  )
}

export function ScrollableArticleList({
  articles,
  plan,
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
        {articles.map((article, index) => {
          const statusColor =
            article.status === 'completed'
              ? '#22C55E' // success green
              : article.status === 'failed'
                ? '#EF4444' // error red
                : article.status === 'queued'
                  ? '#8B5CF6' // purple
                  : '#217CEB'; // info blue

          return (
            <div
              key={article.id}
              className="mb-4 relative"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: '120px',
                transform: 'translateZ(0)',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg z-10"
                style={{ background: statusColor }}
              />
              <Card
                className={cn(
                  'cursor-pointer border border-neutral-200 transition-all sm:hover:-translate-y-[1px] pl-4',
                  'hover:border-[--brand-electric-blue]/40 hover:shadow-sm bg-white',
                  index % 2 === 1 && 'bg-neutral-50/40',
                  highlightArticleId === article.id && 'animate-[i8c-pulse_1.5s_ease-out] border-[--color-warning]'
                )}
                role="button"
                tabIndex={0}
                aria-label={`Open article ${article.title || article.keyword}`}
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
                      <p className="font-lato text-neutral-500 text-sm truncate">
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

                  <div className="flex items-center justify-between font-lato text-xs text-neutral-400">
                    <div className="flex items-center gap-4">
                      <span>Created {formatTimeAgo(article.created_at)}</span>
                      <span>Updated {formatTimeAgo(article.updated_at)}</span>
                    </div>

                    <ArticleAction article={article} plan={plan} />
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
