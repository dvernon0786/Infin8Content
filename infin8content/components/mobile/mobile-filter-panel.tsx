import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Types
export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  type: 'checkbox' | 'radio' | 'select' | 'range' | 'toggle';
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export interface FilterGroup {
  id: string;
  title: string;
  description?: string;
  options: FilterOption[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon?: string;
  filters: Record<string, any>;
  active?: boolean;
}

interface MobileFilterPanelProps {
  groups: FilterGroup[];
  quickFilters?: QuickFilter[];
  onFiltersChange: (filters: Record<string, any>) => void;
  onQuickFilterApply?: (quickFilterId: string) => void;
  initialFilters?: Record<string, any>;
  persistKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Mobile-specific constants
const MOBILE_TOUCH_TARGET_SIZE = 44; // iOS HIG minimum
const MOBILE_SPACING = {
  panel: {
    padding: 16,
    margin: 8,
  },
  group: {
    padding: 12,
    margin: 8,
    borderRadius: 8,
  },
  control: {
    minHeight: 44,
    padding: 12,
    margin: 4,
  },
  button: {
    height: 48,
    padding: 12,
    margin: 8,
  },
};

export const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  groups,
  quickFilters = [],
  onFiltersChange,
  onQuickFilterApply,
  initialFilters = {},
  persistKey = 'mobile-filters',
  className = '',
  style = {},
}) => {
  const { isMobile } = useMobileLayout();
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load persisted filters on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && persistKey) {
      try {
        const persisted = localStorage.getItem(persistKey);
        if (persisted) {
          const parsedFilters = JSON.parse(persisted);
          setFilters(parsedFilters);
          onFiltersChange(parsedFilters);
        }
      } catch (error) {
        console.warn('Failed to load persisted filters:', error);
      }
    }
  }, [persistKey, onFiltersChange]);

  // Persist filters when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && persistKey) {
      try {
        localStorage.setItem(persistKey, JSON.stringify(filters));
      } catch (error) {
        console.warn('Failed to persist filters:', error);
      }
    }
  }, [filters, persistKey]);

  // Initialize expanded groups
  useEffect(() => {
    const initialExpanded = new Set<string>();
    groups.forEach(group => {
      if (group.defaultExpanded || !group.collapsible) {
        initialExpanded.add(group.id);
      }
    });
    setExpandedGroups(initialExpanded);
  }, [groups]);

  // Handle filter value changes
  const handleFilterChange = useCallback((groupId: string, optionId: string, value: any) => {
    const newFilters = {
      ...filters,
      [`${groupId}.${optionId}`]: value,
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Toggle group expansion
  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return newExpanded;
    });
  }, []);

  // Apply quick filter
  const applyQuickFilter = useCallback((quickFilterId: string) => {
    const quickFilter = quickFilters.find(qf => qf.id === quickFilterId);
    if (quickFilter) {
      const newFilters = { ...quickFilter.filters };
      setFilters(newFilters);
      onFiltersChange(newFilters);
      onQuickFilterApply?.(quickFilterId);
    }
  }, [quickFilters, onFiltersChange, onQuickFilterApply]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters: Record<string, any> = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    
    // Clear persisted filters
    if (typeof window !== 'undefined' && persistKey) {
      localStorage.removeItem(persistKey);
    }
  }, [onFiltersChange, persistKey]);

  // Get filter value
  const getFilterValue = useCallback((groupId: string, optionId: string) => {
    return filters[`${groupId}.${optionId}`];
  }, [filters]);

  // Render filter control based on type
  const renderFilterControl = useCallback((group: FilterGroup, option: FilterOption) => {
    const value = getFilterValue(group.id, option.id);
    const filterKey = `${group.id}.${option.id}`;

    switch (option.type) {
      case 'checkbox':
        return (
          <div
            data-testid={`filter-checkbox-${filterKey}`}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            style={{
              minHeight: MOBILE_SPACING.control.minHeight,
            }}
            onClick={() => handleFilterChange(group.id, option.id, !value)}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                value
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              } ${option.disabled ? 'opacity-50' : ''}`}
            >
              {value && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">{option.label}</span>
          </div>
        );

      case 'radio':
        return (
          <div
            data-testid={`filter-radio-${filterKey}`}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            style={{
              minHeight: MOBILE_SPACING.control.minHeight,
            }}
            onClick={() => handleFilterChange(group.id, option.id, option.value)}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                value === option.value
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              } ${option.disabled ? 'opacity-50' : ''}`}
            >
              {value === option.value && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">{option.label}</span>
          </div>
        );

      case 'toggle':
        return (
          <div
            data-testid={`filter-toggle-${filterKey}`}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            style={{
              minHeight: MOBILE_SPACING.control.minHeight,
            }}
          >
            <span className="text-sm font-medium text-gray-700">{option.label}</span>
            <button
              className={`w-12 h-6 rounded-full transition-colors relative ${
                value ? 'bg-blue-500' : 'bg-gray-300'
              } ${option.disabled ? 'opacity-50' : ''}`}
              onClick={() => handleFilterChange(group.id, option.id, !value)}
              disabled={option.disabled}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );

      case 'select':
        return (
          <div
            data-testid={`filter-select-${filterKey}`}
            className="p-3"
            style={{
              minHeight: MOBILE_SPACING.control.minHeight,
            }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {option.label}
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={value || ''}
              onChange={(e) => handleFilterChange(group.id, option.id, e.target.value)}
              disabled={option.disabled}
            >
              <option value="">Select...</option>
              {option.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'range':
        return (
          <div
            data-testid={`filter-range-${filterKey}`}
            className="p-3"
            style={{
              minHeight: MOBILE_SPACING.control.minHeight,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {option.label}
              </label>
              <span className="text-sm text-gray-500">
                {value || option.min || 0}
              </span>
            </div>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              min={option.min || 0}
              max={option.max || 100}
              step={option.step || 1}
              value={value || option.min || 0}
              onChange={(e) => handleFilterChange(group.id, option.id, Number(e.target.value))}
              disabled={option.disabled}
            />
          </div>
        );

      default:
        return null;
    }
  }, [getFilterValue, handleFilterChange]);

  // Render filter group
  const renderFilterGroup = useCallback((group: FilterGroup) => {
    const isExpanded = expandedGroups.has(group.id);

    return (
      <div
        key={group.id}
        data-testid={`filter-group-${group.id}`}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        style={{
          margin: MOBILE_SPACING.group.margin,
        }}
      >
        {/* Group Header */}
        <div
          className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200"
          onClick={() => group.collapsible && toggleGroupExpansion(group.id)}
        >
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {group.title}
            </h3>
            {group.description && (
              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            )}
          </div>
          {group.collapsible && (
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              data-testid={`filter-group-toggle-${group.id}`}
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Group Content */}
        {isExpanded && (
          <div className="p-4 space-y-2">
            {group.options.map(option => renderFilterControl(group, option))}
          </div>
        )}
      </div>
    );
  }, [expandedGroups, toggleGroupExpansion, renderFilterControl]);

  // Render quick filter
  const renderQuickFilter = useCallback((quickFilter: QuickFilter) => {
    const isActive = Object.entries(quickFilter.filters).every(
      ([key, value]) => filters[key] === value
    );

    return (
      <button
        key={quickFilter.id}
        data-testid={`quick-filter-${quickFilter.id}`}
        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        style={{
          minHeight: MOBILE_SPACING.button.height,
        }}
        onClick={() => applyQuickFilter(quickFilter.id)}
      >
        {quickFilter.icon && <span className="text-base">{quickFilter.icon}</span>}
        <span>{quickFilter.label}</span>
      </button>
    );
  }, [filters, applyQuickFilter]);

  // Render panel content
  const renderPanelContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          data-testid="filter-panel-close"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => setIsPanelOpen(false)}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick Filters */}
      {quickFilters.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h3>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map(renderQuickFilter)}
          </div>
        </div>
      )}

      {/* Filter Groups */}
      <div className="flex-1 overflow-y-auto p-4">
        {groups.map(renderFilterGroup)}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-3">
          <button
            data-testid="filter-apply"
            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            style={{
              minHeight: MOBILE_SPACING.button.height,
            }}
            onClick={() => setIsPanelOpen(false)}
          >
            Apply Filters
          </button>
          <button
            data-testid="filter-clear"
            className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            style={{
              minHeight: MOBILE_SPACING.button.height,
            }}
            onClick={clearAllFilters}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={panelRef}
      data-testid="mobile-filter-panel"
      className={`relative ${className}`}
      style={style}
    >
      {/* Toggle Button */}
      <button
        data-testid="filter-panel-toggle"
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        style={{
          minHeight: MOBILE_SPACING.button.height,
        }}
        onClick={() => setIsPanelOpen(true)}
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {Object.keys(filters).length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsPanelOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
            {renderPanelContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFilterPanel;
