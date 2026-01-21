/**
 * Search input component with debouncing and accessibility
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  Loader2,
  Keyboard
} from 'lucide-react';
import { SearchHistory } from '@/lib/utils/search-utils';
import type { SearchInputProps } from '@/lib/types/dashboard.types';
import { cn } from '@/lib/utils';

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search articles...',
  disabled = false,
  isLoading = false,
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Load search history on mount
  useEffect(() => {
    setHistory(SearchHistory.getHistory());
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
        
        // Add to history if not empty
        if (localValue.trim()) {
          SearchHistory.addToHistory(localValue.trim());
          setHistory(SearchHistory.getHistory());
        }
      }
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localValue, onChange, value, debounceMs]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Show suggestions if value is not empty
    if (newValue.trim()) {
      setShowSuggestions(true);
      setShowHistory(false);
    } else {
      setShowSuggestions(false);
      setShowHistory(true);
    }
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onClear();
    setShowSuggestions(false);
    setShowHistory(false);
    inputRef.current?.focus();
  }, [onChange, onClear]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setLocalValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setShowHistory(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle history item click
  const handleHistoryClick = useCallback((historyItem: string) => {
    setLocalValue(historyItem);
    onChange(historyItem);
    setShowHistory(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle history item removal
  const handleHistoryRemove = useCallback((e: React.MouseEvent, historyItem: string) => {
    e.stopPropagation();
    SearchHistory.removeFromHistory(historyItem);
    setHistory(SearchHistory.getHistory());
  }, []);

  // Clear all history
  const handleClearHistory = useCallback(() => {
    SearchHistory.clearHistory();
    setHistory([]);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowHistory(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      setShowSuggestions(false);
      setShowHistory(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus first suggestion or history item
      const firstItem = suggestionsRef.current?.querySelector('[data-suggestion-item="true"]') as HTMLElement;
      if (firstItem) {
        firstItem.focus();
      }
    }
  }, [suggestions]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (!localValue.trim()) {
      setShowHistory(true);
    } else {
      setShowSuggestions(true);
    }
  }, [localValue]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
    }, 150);
  }, []);

  const hasValue = localValue.trim().length > 0;
  const showDropdown = showSuggestions || showHistory;

  return (
    <div className={cn('relative', className)} ref={suggestionsRef}>
      {/* Search input with icon and clear button */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 hover:text-[--color-primary-blue]" />
        
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-20 font-lato text-neutral-600 placeholder:text-neutral-500',
            'border-neutral-200',
            isFocused && 'ring-2 ring-[--brand-electric-blue]/50 ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Search articles"
          aria-describedby={showDropdown ? 'search-help' : undefined}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          role="combobox"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-600 animate-spin" />
        )}
        
        {/* Clear button */}
        {hasValue && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-neutral-100 font-lato text-neutral-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dropdown for suggestions and history */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Search suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-lato text-neutral-500">
                <TrendingUp className="h-3 w-3" />
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  data-suggestion-item="true"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm font-lato text-neutral-600 hover:bg-neutral-100 rounded-md flex items-center gap-2 transition-colors"
                  role="option"
                  aria-selected={false}
                >
                  <Search className="h-3 w-3 text-neutral-500" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search history */}
          {showHistory && history.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-lato text-neutral-500">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-6 px-2 text-xs font-lato text-neutral-500 hover:text-[--color-primary-blue]"
                >
                  Clear All
                </Button>
              </div>
              {history.map((historyItem, index) => (
                <div
                  key={index}
                  className="flex items-center group hover:bg-neutral-100 rounded-md transition-colors"
                >
                  <button
                    data-suggestion-item="true"
                    onClick={() => handleHistoryClick(historyItem)}
                    className="flex-1 text-left px-3 py-2 text-sm font-lato text-neutral-600 flex items-center gap-2"
                    role="option"
                    aria-selected={false}
                  >
                    <Clock className="h-3 w-3 text-neutral-500" />
                    <span className="truncate">{historyItem}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleHistoryRemove(e, historyItem)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                    aria-label={`Remove ${historyItem} from history`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {showSuggestions && suggestions.length === 0 && hasValue && (
            <div className="p-4 text-center text-sm font-lato text-neutral-500">
              No suggestions found
            </div>
          )}

          {/* Empty history */}
          {showHistory && history.length === 0 && (
            <div className="p-4 text-center text-sm font-lato text-neutral-500">
              No recent searches
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <div id="search-help" className="sr-only">
        Search articles by title, keyword, or content. Use arrow keys to navigate suggestions.
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute -bottom-6 left-0 text-xs font-lato text-neutral-500 flex items-center gap-1">
        <Keyboard className="h-3 w-3" />
        Press / to focus, ESC to close
      </div>
    </div>
  );
}

/**
 * Search input with advanced features
 */
export function AdvancedSearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search articles...',
  disabled = false,
  isLoading = false,
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced'>('basic');

  return (
    <div className="space-y-2">
      <SearchInput
        value={value}
        onChange={onChange}
        onClear={onClear}
        placeholder={placeholder}
        disabled={disabled}
        isLoading={isLoading}
        className={className}
        debounceMs={debounceMs}
      />
      
      {/* Advanced search toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-lato text-neutral-500 hover:text-[--color-primary-blue]"
        >
          Advanced Search
        </Button>
        
        {searchMode === 'advanced' && (
          <Badge variant="outline" className="text-xs">
            Use + for required, - for excluded terms
          </Badge>
        )}
      </div>

      {/* Advanced search help */}
      {showAdvanced && (
        <div className="p-3 bg-neutral-50 rounded-md text-sm font-lato text-neutral-600 space-y-1">
          <p className="font-lato text-small font-medium text-neutral-900">Advanced Search Tips:</p>
          <ul className="space-y-1 text-xs">
            <li>• Use + before a word to require it (e.g., +marketing)</li>
            <li>• Use - before a word to exclude it (e.g., -draft)</li>
            <li>• Use quotes for exact phrases (e.g., "content strategy")</li>
            <li>• Combine operators: +marketing -draft "content strategy"</li>
          </ul>
        </div>
      )}
    </div>
  );
}
