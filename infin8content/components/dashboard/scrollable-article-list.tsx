/**
 * Scrollable article list component for dashboard
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React from 'react';
import { Eye, Send, MoreVertical } from 'lucide-react';
import type { DashboardArticle } from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';
import type { ScrollableArticleListProps } from '@/lib/types/dashboard.types';

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
          const isHighlighted = highlightArticleId === article.id

          return (
            <div
              key={article.id}
              role="button"
              tabIndex={0}
              aria-label={`Open article ${article.title || article.keyword}`}
              onClick={(e) => onArticleNavigation(article.id, e)}
              onKeyDown={(e) => onKeyDown(article.id, e)}
              onTouchStart={(e) => onTouchStart(article.id, e, e.currentTarget as HTMLElement)}
              onTouchMove={(e) => onTouchMove(article.id, e, e.currentTarget as HTMLElement)}
              onTouchEnd={(e) => onTouchEnd(article.id, e, e.currentTarget as HTMLElement)}
              className={cn('group', index % 2 === 1 && 'bg-neutral-50/40')}
              style={{
                borderBottom: '1px solid #f3f4f6',
                background: isHighlighted ? '#f0f7ff' : '#fff',
                transition: 'background 0.12s',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 200px 160px 120px auto', alignItems: 'center', padding: '12px 16px' }}>
                {/* Checkbox */}
                <div>
                  <input
                    type="checkbox"
                    style={{ width: 14, height: 14, accentColor: '#0066FF' }}
                    onClick={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Title */}
                <div style={{ paddingRight: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {article.title || article.keyword}
                  </div>
                </div>

                {/* Campaign / Keyword */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 13 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.keyword}</span>
                </div>

                {/* Date */}
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(article.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>

                {/* Language */}
                <div style={{ fontSize: 12, color: '#6b7280' }}>English (US)</div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifySelf: 'end' }} onClick={(e) => e.stopPropagation()}>
                  <button title="View" onClick={(e) => { e.stopPropagation(); onArticleNavigation(article.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa3b0', padding: 4 }}>
                    <Eye size={14} />
                  </button>
                  <button title="Publish" onClick={(e) => { e.stopPropagation(); /* implement publish action later */ }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa3b0', padding: 4 }}>
                    <Send size={14} />
                  </button>
                  <button title="More" onClick={(e) => { e.stopPropagation(); /* open menu later */ }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa3b0', padding: 4 }}>
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
