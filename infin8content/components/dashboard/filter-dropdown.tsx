/**
 * Filter dropdown component for multi-select filtering
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Filter,
  Calendar,
  Hash,
  FileText,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import { DATE_RANGE_PRESETS, WORD_COUNT_PRESETS } from '@/lib/utils/filter-utils';
import type { FilterDropdownProps, FilterState, ArticleStatus } from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FilterSection({ title, icon, children }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

export function FilterDropdown({
  value,
  onChange,
  availableStatuses,
  disabled = false,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync temp filters with prop value
  useEffect(() => {
    setTempFilters(value);
  }, [value]);

  // Count active filters
  const activeFilterCount = getActiveFilterCount(value);

  // Handle status filter change
  const handleStatusChange = (status: ArticleStatus, checked: boolean) => {
    const newStatuses = checked
      ? [...tempFilters.status, status]
      : tempFilters.status.filter(s => s !== status);
    
    setTempFilters({ ...tempFilters, status: newStatuses });
  };

  // Handle date range preset selection
  const handleDateRangePreset = (preset: keyof typeof DATE_RANGE_PRESETS) => {
    const range = DATE_RANGE_PRESETS[preset].getRange();
    setTempFilters({
      ...tempFilters,
      dateRange: range,
    });
  };

  // Handle custom date range
  const handleCustomDateRange = (start?: Date, end?: Date) => {
    setTempFilters({
      ...tempFilters,
      dateRange: { start, end },
    });
  };

  // Handle word count preset selection
  const handleWordCountPreset = (preset: keyof typeof WORD_COUNT_PRESETS) => {
    const range = WORD_COUNT_PRESETS[preset].range;
    setTempFilters({
      ...tempFilters,
      wordCountRange: range,
    });
  };

  // Handle keyword addition
  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !tempFilters.keywords.includes(keyword.trim())) {
      setTempFilters({
        ...tempFilters,
        keywords: [...tempFilters.keywords, keyword.trim()],
      });
    }
  };

  // Handle keyword removal
  const handleKeywordRemove = (keyword: string) => {
    setTempFilters({
      ...tempFilters,
      keywords: tempFilters.keywords.filter(k => k !== keyword),
    });
  };

  // Apply filters
  const handleApply = () => {
    onChange(tempFilters);
    setIsOpen(false);
  };

  // Reset filters
  const handleReset = () => {
    const emptyFilters: FilterState = {
      status: [],
      dateRange: {},
      keywords: [],
      wordCountRange: {},
      sortBy: undefined,
    };
    setTempFilters(emptyFilters);
    onChange(emptyFilters);
    setIsOpen(false);
  };

  // Clear specific filter type
  const handleClearFilterType = (filterType: keyof FilterState) => {
    const clearedFilters = { ...tempFilters };
    
    switch (filterType) {
      case 'status':
        clearedFilters.status = [];
        break;
      case 'dateRange':
        clearedFilters.dateRange = {};
        break;
      case 'keywords':
        clearedFilters.keywords = [];
        break;
      case 'wordCountRange':
        clearedFilters.wordCountRange = {};
        break;
      case 'sortBy':
        clearedFilters.sortBy = undefined;
        break;
    }
    
    setTempFilters(clearedFilters);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              'flex items-center gap-2',
              activeFilterCount > 0 && 'border-blue-500 bg-blue-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="start">
          {/* Header with actions */}
          <div className="flex items-center justify-between p-3 border-b">
            <DropdownMenuLabel className="text-sm font-medium">
              Filter Articles
            </DropdownMenuLabel>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs h-6 px-2"
              >
                Reset All
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                className="text-xs h-6 px-2"
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Status Filter */}
          <FilterSection title="Status" icon={<FileText className="h-4 w-4" />}>
            <div className="px-3 space-y-2">
              {availableStatuses.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={tempFilters.status.includes(status as ArticleStatus)}
                    onCheckedChange={(checked: boolean) => 
                      handleStatusChange(status as ArticleStatus, checked)
                    }
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>

          <DropdownMenuSeparator />

          {/* Date Range Filter */}
          <FilterSection title="Date Range" icon={<Calendar className="h-4 w-4" />}>
            <div className="px-3 space-y-2">
              {/* Date range presets */}
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(DATE_RANGE_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateRangePreset(key as keyof typeof DATE_RANGE_PRESETS)}
                    className="text-xs justify-start h-7"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              
              {/* Custom date range */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Custom:</span>
                <input
                  type="date"
                  value={tempFilters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleCustomDateRange(date, tempFilters.dateRange.end);
                  }}
                  className="border rounded px-1 py-0.5 text-xs"
                />
                <span>to</span>
                <input
                  type="date"
                  value={tempFilters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleCustomDateRange(tempFilters.dateRange.start, date);
                  }}
                  className="border rounded px-1 py-0.5 text-xs"
                />
              </div>
            </div>
          </FilterSection>

          <DropdownMenuSeparator />

          {/* Word Count Filter */}
          <FilterSection title="Word Count" icon={<Hash className="h-4 w-4" />}>
            <div className="px-3 space-y-2">
              {/* Word count presets */}
              <div className="space-y-1">
                {Object.entries(WORD_COUNT_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWordCountPreset(key as keyof typeof WORD_COUNT_PRESETS)}
                    className="text-xs justify-start h-7 w-full"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              
              {/* Custom word count range */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Custom:</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={tempFilters.wordCountRange.min || ''}
                  onChange={(e) => {
                    const min = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    handleWordCountPreset('custom' as any);
                    setTempFilters({
                      ...tempFilters,
                      wordCountRange: { ...tempFilters.wordCountRange, min },
                    });
                  }}
                  className="border rounded px-1 py-0.5 w-16 text-xs"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempFilters.wordCountRange.max || ''}
                  onChange={(e) => {
                    const max = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    handleWordCountPreset('custom' as any);
                    setTempFilters({
                      ...tempFilters,
                      wordCountRange: { ...tempFilters.wordCountRange, max },
                    });
                  }}
                  className="border rounded px-1 py-0.5 w-16 text-xs"
                />
              </div>
            </div>
          </FilterSection>

          <DropdownMenuSeparator />

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="p-3 border-t">
              <div className="text-xs font-medium text-gray-700 mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-1">
                {/* Status badges */}
                {tempFilters.status.map((status) => (
                  <Badge
                    key={status}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {status}
                    <button
                      onClick={() => handleStatusChange(status, false)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                
                {/* Date range badge */}
                {(tempFilters.dateRange.start || tempFilters.dateRange.end) && (
                  <Badge
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    Date Range
                    <button
                      onClick={() => handleClearFilterType('dateRange')}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {/* Word count badge */}
                {(tempFilters.wordCountRange.min !== undefined || tempFilters.wordCountRange.max !== undefined) && (
                  <Badge
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    Word Count
                    <button
                      onClick={() => handleClearFilterType('wordCountRange')}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Get the count of active filters
 */
function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  
  if (filters.status.length > 0) count++;
  if (filters.dateRange.start || filters.dateRange.end) count++;
  if (filters.keywords.length > 0) count++;
  if (filters.wordCountRange.min !== undefined || filters.wordCountRange.max !== undefined) count++;
  if (filters.sortBy) count++;
  
  return count;
}

/**
 * Quick filter buttons for common filter combinations
 */
export function QuickFilters({
  onFilterChange,
  disabled = false,
}: {
  onFilterChange: (filters: Partial<FilterState>) => void;
  disabled?: boolean;
}) {
  const quickFilters = [
    {
      label: 'Completed',
      filters: { status: ['completed' as ArticleStatus] },
      color: 'bg-green-100 text-green-800',
    },
    {
      label: 'In Progress',
      filters: { status: ['queued' as ArticleStatus, 'generating' as ArticleStatus] },
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Failed',
      filters: { status: ['failed' as ArticleStatus] },
      color: 'bg-red-100 text-red-800',
    },
    {
      label: 'This Week',
      filters: { dateRange: DATE_RANGE_PRESETS.thisWeek.getRange() },
      color: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500">Quick filters:</span>
      {quickFilters.map((filter, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onFilterChange(filter.filters)}
          disabled={disabled}
          className={cn('text-xs', filter.color, 'border-current')}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
