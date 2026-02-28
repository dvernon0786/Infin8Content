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

export function ScrollableArticleList({
  articles,
  className,
  selectedArticle,
  onArticleSelect,
  onArticleNavigation,
  onKeyDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: ScrollableArticleListProps) {
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
      <div className="overflow-y-auto h-[600px]">
        {articles.map((article) => {
          const isSelected = selectedArticle === article.id;
          return (
            <div key={article.id} className="mb-4">
              <Card
                className={cn(
                  'mx-2 cursor-pointer transition-colors hover:bg-neutral-50',
                  isSelected && 'ring-2 ring-[--brand-electric-blue]'
                )}
                onClick={() => onArticleSelect(isSelected ? '' : article.id)}
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
                            onArticleNavigation(article.id, e);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (article.status === 'completed') {
                            onKeyDown(article.id, e);
                          }
                        }}
                        onTouchStart={(e) => {
                          if (article.status === 'completed') {
                            onTouchStart(article.id, e, e.currentTarget);
                          }
                        }}
                        onTouchMove={(e) => {
                          if (article.status === 'completed') {
                            onTouchMove(article.id, e, e.currentTarget);
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (article.status === 'completed') {
                            onTouchEnd(article.id, e, e.currentTarget);
                          }
                        }}
                      >
                        {article.title || article.keyword}
                      </h3>
                      <p className="font-lato text-neutral-500 text-small truncate">
                        {article.keyword}
                      </p>
                    </div>

                    <VisualStatusIndicator
                      status={article.status}
                      compact={true}
                    />
                  </div>

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
                          onArticleNavigation(article.id, e);
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
        })}
      </div>
    </div>
  );
}
