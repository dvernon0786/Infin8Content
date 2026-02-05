"use client"

import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { AutocompleteSuggestion } from "@/types/autocomplete"

interface AutocompleteDropdownProps {
  value: string
  onChange: (value: string) => void
  onSuggestionSelect: (suggestion: AutocompleteSuggestion) => void
  context: 'competitors' | 'business' | 'blog'
  placeholder?: string
  disabled?: boolean
  suggestions?: AutocompleteSuggestion[]
  isOpen?: boolean
  isLoading?: boolean
  error?: string
  onOpenChange?: (open: boolean) => void
  onFetchSuggestions?: (query: string, context: string) => void
  'aria-label'?: string
}

export function AutocompleteDropdown({
  value,
  onChange,
  onSuggestionSelect,
  context,
  placeholder = "Type to search...",
  disabled = false,
  suggestions = [],
  isOpen = false,
  isLoading = false,
  error,
  onOpenChange,
  onFetchSuggestions,
  'aria-label': ariaLabel
}: AutocompleteDropdownProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Trigger autocomplete after minimum 2 characters with debounce
    if (newValue.length >= 2) {
      const timer = setTimeout(() => {
        onFetchSuggestions?.(newValue, context)
        onOpenChange?.(true)
      }, 300)
      setDebounceTimer(timer)
    } else {
      onOpenChange?.(false)
    }
  }, [onChange, onFetchSuggestions, context, onOpenChange, debounceTimer])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && value.length >= 2) {
        onOpenChange?.(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break

      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightedIndex])
        }
        break

      case 'Escape':
        e.preventDefault()
        onOpenChange?.(false)
        setHighlightedIndex(-1)
        break

      default:
        break
    }
  }, [isOpen, suggestions, highlightedIndex, onOpenChange])

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: AutocompleteSuggestion) => {
    onSuggestionSelect(suggestion)
    onChange(suggestion.text)
    onOpenChange?.(false)
    setHighlightedIndex(-1)
  }, [onSuggestionSelect, onChange, onOpenChange])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onOpenChange?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onOpenChange])

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [suggestions])

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && onOpenChange?.(true)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="autocomplete-dropdown"
        className={cn(
          "w-full px-4 py-2 border border-gray-300 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "transition-colors"
        )}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id="autocomplete-dropdown"
          role="listbox"
          className={cn(
            "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg",
            "shadow-lg z-50 max-h-64 overflow-y-auto"
          )}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Loading suggestions...
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50">
              {error}
            </div>
          )}

          {/* Suggestions List */}
          {!isLoading && !error && suggestions.length > 0 && (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "px-4 py-2 cursor-pointer transition-colors",
                    index === highlightedIndex
                      ? "bg-blue-50 highlighted"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{suggestion.text}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                        {suggestion.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestion.source}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Empty State */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No suggestions found. Type manually or try a different search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
