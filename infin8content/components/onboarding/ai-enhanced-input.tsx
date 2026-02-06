"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { AutocompleteDropdown } from "@/components/ui/autocomplete-dropdown"
import type { AutocompleteSuggestion } from "@/types/autocomplete"

interface AIEnhancedInputProps {
  value: string
  onChange: (value: string) => void
  context: 'competitors' | 'business' | 'blog'
  placeholder?: string
  disabled?: boolean
  error?: string
  'aria-label'?: string
}

export function AIEnhancedInput({
  value,
  onChange,
  context,
  placeholder = "Type to search...",
  disabled = false,
  error,
  'aria-label': ariaLabel
}: AIEnhancedInputProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | undefined>()

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string, ctx: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    setFetchError(undefined)

    try {
      const response = await fetch('/api/ai/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          context: ctx,
          limit: 5
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load suggestions'
      setFetchError(message)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.text)
    setIsOpen(false)
    setSuggestions([])
  }, [onChange])

  return (
    <div className="space-y-2">
      <AutocompleteDropdown
        value={value}
        onChange={onChange}
        onSuggestionSelect={handleSuggestionSelect}
        context={context}
        placeholder={placeholder}
        disabled={disabled}
        suggestions={suggestions}
        isOpen={isOpen}
        isLoading={isLoading}
        error={fetchError}
        onOpenChange={setIsOpen}
        onFetchSuggestions={fetchSuggestions}
        aria-label={ariaLabel}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
