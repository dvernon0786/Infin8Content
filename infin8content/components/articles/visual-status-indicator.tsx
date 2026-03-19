/**
 * Visual Status Indicator component for articles
 * Story 15.2: Visual Status Indicators
 * Provides distinct visual styling for each article state
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ArticleStatus } from '@/types/article';
import { statusConfigs } from '@/lib/constants/status-configs';
import './visual-status-indicator.css';

interface VisualStatusIndicatorProps {
  status: ArticleStatus;
  compact?: boolean;
  hideStatuses?: string[];
}

export function VisualStatusIndicator({
  status,
  compact = false,
  hideStatuses,
}: VisualStatusIndicatorProps) {
  const normalizedStatus = status?.toLowerCase() as ArticleStatus;

  if (hideStatuses?.includes(normalizedStatus)) return null;

  // Fallback map to prevent crashes on unknown statuses
  const statusConfig = statusConfigs[normalizedStatus] || {
    ...statusConfigs.draft,
    label: status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown',
    variant: 'secondary' as const
  };

  if (!statusConfigs[normalizedStatus]) {
    console.warn(`[UI] Missing status configuration for: "${status}". Falling back to draft style.`);
  }

  return (
    <div
      data-testid="status-indicator-container"
      className={cn(
        'visual-status-indicator',
        statusConfig.bgColor,
        statusConfig.borderColor,
        'border rounded-lg transition-all duration-300',
        compact ? 'p-2' : 'p-3 sm:p-4',
        statusConfig.patternClass
      )}
    >
      <div className="flex items-center gap-2">
        <Badge
          data-testid="article-status-badge"
          variant={statusConfig.variant}
          className={cn(
            'flex items-center gap-1 font-medium',
            compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1',
            statusConfig.color
          )}
          aria-label={statusConfig.ariaLabel}
        >
          {statusConfig.icon}
          {!compact && <span className="hidden sm:inline">{statusConfig.label}</span>}
          {compact && <span>{statusConfig.label}</span>}
        </Badge>
      </div>
    </div>
  );
}

export default VisualStatusIndicator;
