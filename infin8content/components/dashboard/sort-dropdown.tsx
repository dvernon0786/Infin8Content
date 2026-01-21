/**
 * Sort dropdown component with directional indicators
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ArrowDownNarrowWide,
  ArrowUpWideNarrow,
  SortAsc,
  SortDesc,
  Check
} from 'lucide-react';
import { SORT_OPTIONS, getSortOption, getSortDirection } from '@/lib/utils/sort-utils';
import type { SortDropdownProps, SortOption } from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';

export function SortDropdown({
  value,
  onChange,
  disabled = false,
  className,
}: SortDropdownProps) {
  const selectedOption = value ? getSortOption(value) : null;

  // Get the appropriate icon for the sort direction
  const getSortIcon = (option: typeof SORT_OPTIONS[0]) => {
    switch (option.value) {
      case 'mostRecent':
        return <ArrowDown className="h-4 w-4" />;
      case 'oldest':
        return <ArrowUp className="h-4 w-4" />;
      case 'titleAZ':
        return <SortAsc className="h-4 w-4" />;
      case 'titleZA':
        return <SortDesc className="h-4 w-4" />;
      default:
        return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  // Get the directional indicator
  const getDirectionIndicator = (sortBy: SortOption) => {
    const direction = getSortDirection(sortBy);
    return direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-neutral-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-neutral-600" />
    );
  };

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 font-lato text-neutral-600 hover:text-[--color-primary-blue]',
              value && 'border-neutral-200 bg-neutral-100'
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort
            {selectedOption && (
              <Badge variant="secondary" className="text-xs">
                {selectedOption.label}
              </Badge>
            )}
            {value && getDirectionIndicator(value)}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-sm font-lato text-neutral-900">
            Sort Articles
          </DropdownMenuLabel>

          {SORT_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  'flex items-center justify-between cursor-pointer',
                  isSelected && 'bg-neutral-100 text-neutral-700'
                )}
              >
                <div className="flex items-center gap-2">
                  {getSortIcon(option)}
                  <div className="flex flex-col">
                    <span className="text-sm font-lato text-neutral-900">{option.label}</span>
                    <span className="text-xs font-lato text-neutral-500">{option.description}</span>
                  </div>
                </div>
                
                {isSelected && (
                  <Check className="h-4 w-4 text-neutral-600" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Advanced sort dropdown with multi-field sorting options
 */
export function AdvancedSortDropdown({
  value,
  onChange,
  disabled = false,
  className,
}: SortDropdownProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className={cn('relative', className)}>
      <SortDropdown
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
      />
      
      {/* Advanced sort options */}
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Sort
        </Button>
        
        {showAdvanced && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
            <p className="font-medium mb-2">Advanced Sort Options:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Multi-field sorting coming soon</p>
              <p>• Custom sort orders</p>
              <p>• Sort by completion time, word count, etc.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sort toggle buttons for quick switching between common sort options
 */
export function SortToggleButtons({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value?: SortOption;
  onChange: (sortBy: SortOption) => void;
  disabled?: boolean;
  className?: string;
}) {
  const quickSortOptions = [
    { value: 'mostRecent' as SortOption, label: 'Newest', icon: <ArrowDown className="h-3 w-3" /> },
    { value: 'oldest' as SortOption, label: 'Oldest', icon: <ArrowUp className="h-3 w-3" /> },
    { value: 'titleAZ' as SortOption, label: 'A-Z', icon: <SortAsc className="h-3 w-3" /> },
  ];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-xs text-gray-500 mr-2">Sort:</span>
      {quickSortOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            'text-xs h-7 px-2',
            value === option.value && 'bg-blue-500 text-white hover:bg-blue-600'
          )}
        >
          <span className="flex items-center gap-1">
            {option.icon}
            {option.label}
          </span>
        </Button>
      ))}
    </div>
  );
}

/**
 * Sort indicator showing current sort state
 */
export function SortIndicator({
  value,
  onClear,
  className,
}: {
  value?: SortOption;
  onClear?: () => void;
  className?: string;
}) {
  if (!value) return null;

  const option = getSortOption(value);
  const direction = getSortDirection(value);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        {direction === 'asc' ? (
          <ArrowUp className="h-3 w-3 text-green-600" />
        ) : (
          <ArrowDown className="h-3 w-3 text-blue-600" />
        )}
        {option?.label || 'Sort'}
        {onClear && (
          <button
            onClick={onClear}
            className="ml-1 hover:text-red-500"
            aria-label="Clear sort"
          >
            ×
          </button>
        )}
      </Badge>
    </div>
  );
}

/**
 * Sort statistics showing sort performance and info
 */
export function SortStats({
  articleCount,
  sortTime,
  sortBy,
  className,
}: {
  articleCount: number;
  sortTime: number;
  sortBy?: SortOption;
  className?: string;
}) {
  const option = sortBy ? getSortOption(sortBy) : null;

  return (
    <div className={cn('text-xs text-gray-500', className)}>
      <span>
        {articleCount} articles sorted
        {option && ` by ${option.label.toLowerCase()}`}
      </span>
      {sortTime > 0 && (
        <span className="ml-2">
          ({sortTime.toFixed(1)}ms)
          {sortTime > 100 && (
            <span className="text-orange-500 ml-1">⚠️ Slow</span>
          )}
        </span>
      )}
    </div>
  );
}
