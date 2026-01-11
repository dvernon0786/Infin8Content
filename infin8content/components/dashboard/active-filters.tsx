/**
 * Active filters component with clear functionality
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X,
  Search,
  Filter,
  Calendar,
  Hash,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { hasActiveFilters, isFilterActive } from '@/lib/utils/filter-utils';
import { getSortOption } from '@/lib/utils/sort-utils';
import type { 
  ActiveFiltersProps, 
  FilterState, 
  SearchState, 
  ActiveFilterBadge,
  ArticleStatus 
} from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';

export function ActiveFilters({
  filters,
  search,
  onClearFilter,
  onClearAll,
  disabled = false,
  className,
}: ActiveFiltersProps) {
  const activeFilters = generateActiveFilters(filters, search);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className="text-sm text-gray-500">Active filters:</span>
      
      {activeFilters.map((filter) => (
        <ActiveFilterBadge
          key={filter.id}
          filter={filter}
          onClear={() => onClearFilter(filter.id)}
          disabled={disabled}
        />
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        disabled={disabled}
        className="text-xs h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Clear All
      </Button>
    </div>
  );
}

/**
 * Individual active filter badge
 */
function ActiveFilterBadge({
  filter,
  onClear,
  disabled = false,
}: {
  filter: ActiveFilterBadge;
  onClear: () => void;
  disabled?: boolean;
}) {
  const getFilterIcon = (type: ActiveFilterBadge['type']) => {
    switch (type) {
      case 'search':
        return <Search className="h-3 w-3" />;
      case 'status':
        return <FileText className="h-3 w-3" />;
      case 'dateRange':
        return <Calendar className="h-3 w-3" />;
      case 'keyword':
        return <Hash className="h-3 w-3" />;
      case 'wordCount':
        return <Hash className="h-3 w-3" />;
      case 'sort':
        return <ArrowUpDown className="h-3 w-3" />;
      default:
        return <Filter className="h-3 w-3" />;
    }
  };

  const getFilterColor = (type: ActiveFilterBadge['type']) => {
    switch (type) {
      case 'search':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'status':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dateRange':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'keyword':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'wordCount':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sort':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 text-xs border',
        getFilterColor(filter.type),
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {getFilterIcon(filter.type)}
      <span className="truncate max-w-32">{filter.label}</span>
      <span className="text-xs opacity-75">: {filter.value}</span>
      {filter.removable && !disabled && (
        <button
          onClick={onClear}
          className="ml-1 hover:text-red-500 transition-colors"
          aria-label={`Remove ${filter.label} filter`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

/**
 * Generate active filter badges from filter state
 */
export function generateActiveFilters(
  filters: FilterState,
  search: SearchState
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];

  // Search filter
  if (search.query.trim()) {
    badges.push({
      id: 'search',
      type: 'search',
      label: 'Search',
      value: search.query.trim(),
      removable: true,
    });
  }

  // Status filters
  if (filters.status.length > 0) {
    if (filters.status.length === 1) {
      badges.push({
        id: `status-${filters.status[0]}`,
        type: 'status',
        label: 'Status',
        value: filters.status[0],
        removable: true,
      });
    } else {
      badges.push({
        id: 'status-multiple',
        type: 'status',
        label: 'Status',
        value: `${filters.status.length} selected`,
        removable: true,
      });
    }
  }

  // Date range filter
  if (filters.dateRange.start || filters.dateRange.end) {
    const start = filters.dateRange.start?.toLocaleDateString();
    const end = filters.dateRange.end?.toLocaleDateString();
    
    let value = '';
    if (start && end) {
      value = `${start} - ${end}`;
    } else if (start) {
      value = `From ${start}`;
    } else if (end) {
      value = `Until ${end}`;
    }

    badges.push({
      id: 'dateRange',
      type: 'dateRange',
      label: 'Date Range',
      value,
      removable: true,
    });
  }

  // Keyword filters
  if (filters.keywords.length > 0) {
    if (filters.keywords.length === 1) {
      badges.push({
        id: `keyword-${filters.keywords[0]}`,
        type: 'keyword',
        label: 'Keyword',
        value: filters.keywords[0],
        removable: true,
      });
    } else {
      badges.push({
        id: 'keywords-multiple',
        type: 'keyword',
        label: 'Keywords',
        value: `${filters.keywords.length} selected`,
        removable: true,
      });
    }
  }

  // Word count filter
  if (filters.wordCountRange.min !== undefined || filters.wordCountRange.max !== undefined) {
    const min = filters.wordCountRange.min;
    const max = filters.wordCountRange.max;
    
    let value = '';
    if (min !== undefined && max !== undefined) {
      value = `${min} - ${max} words`;
    } else if (min !== undefined) {
      value = `${min}+ words`;
    } else if (max !== undefined) {
      value = `≤ ${max} words`;
    }

    badges.push({
      id: 'wordCount',
      type: 'wordCount',
      label: 'Word Count',
      value,
      removable: true,
    });
  }

  // Sort filter
  if (filters.sortBy) {
    const option = getSortOption(filters.sortBy);
    badges.push({
      id: 'sort',
      type: 'sort',
      label: 'Sort',
      value: option?.label || filters.sortBy,
      removable: true,
    });
  }

  return badges;
}

/**
 * Compact active filters display for mobile
 */
export function CompactActiveFilters({
  filters,
  search,
  onClearAll,
  disabled = false,
  className,
}: {
  filters: FilterState;
  search: SearchState;
  onClearAll: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const activeFilters = generateActiveFilters(filters, search);
  const filterCount = activeFilters.length;

  if (filterCount === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="secondary" className="text-xs">
        {filterCount} filter{filterCount !== 1 ? 's' : ''} active
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        disabled={disabled}
        className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
      >
        Clear
      </Button>
    </div>
  );
}

/**
 * Active filters summary with expandable details
 */
export function ExpandableActiveFilters({
  filters,
  search,
  onClearFilter,
  onClearAll,
  disabled = false,
  className,
}: ActiveFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const activeFilters = generateActiveFilters(filters, search);

  if (activeFilters.length === 0) {
    return null;
  }

  const displayFilters = isExpanded ? activeFilters : activeFilters.slice(0, 3);
  const hasMore = activeFilters.length > 3;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Filters:</span>
        
        {displayFilters.map((filter) => (
          <ActiveFilterBadge
            key={filter.id}
            filter={filter}
            onClear={() => onClearFilter(filter.id)}
            disabled={disabled}
          />
        ))}
        
        {hasMore && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-xs h-6 px-2"
          >
            +{activeFilters.length - 3} more
          </Button>
        )}
        
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-xs h-6 px-2"
          >
            Show less
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          disabled={disabled}
          className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}

/**
 * Filter count indicator
 */
export function FilterCount({
  filters,
  search,
  className,
}: {
  filters: FilterState;
  search: SearchState;
  className?: string;
}) {
  const activeFilters = generateActiveFilters(filters, search);
  const count = activeFilters.length;

  if (count === 0) {
    return null;
  }

  return (
    <Badge variant="secondary" className={cn('text-xs', className)}>
      {count}
    </Badge>
  );
}

/**
 * Filter summary text
 */
export function FilterSummary({
  filters,
  search,
  totalArticles,
  filteredArticles,
  className,
}: {
  filters: FilterState;
  search: SearchState;
  totalArticles: number;
  filteredArticles: number;
  className?: string;
}) {
  const activeFilters = generateActiveFilters(filters, search);
  const hasFilters = activeFilters.length > 0;

  return (
    <div className={cn('text-sm text-gray-600', className)}>
      {hasFilters ? (
        <span>
          Showing {filteredArticles} of {totalArticles} articles
          <span className="text-xs text-gray-500 ml-1">
            ({filteredArticles === totalArticles ? 'no filters applied' : `${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''} active`})
          </span>
        </span>
      ) : (
        <span>
          {totalArticles} articles total
        </span>
      )}
    </div>
  );
}
