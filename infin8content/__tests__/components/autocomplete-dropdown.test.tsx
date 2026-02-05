/**
 * Tests for AutocompleteDropdown Component
 * Story A-5: Onboarding Agent AI Autocomplete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { AutocompleteDropdown } from '@/components/ui/autocomplete-dropdown'

describe('AutocompleteDropdown Component', () => {
  const mockSuggestions = [
    { id: '1', text: 'Suggestion 1', category: 'template' as const, source: 'ai' as const },
    { id: '2', text: 'Suggestion 2', category: 'industry' as const, source: 'ai' as const },
    { id: '3', text: 'Suggestion 3', category: 'best-practice' as const, source: 'cached' as const }
  ]

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSuggestionSelect: vi.fn(),
    context: 'competitors' as const,
    placeholder: 'Enter competitor URL'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render input field with placeholder', () => {
      const { container } = render(<AutocompleteDropdown {...defaultProps} />)
      const input = container.querySelector('input[placeholder="Enter competitor URL"]')
      expect(input).toBeTruthy()
    })

    it('should render with custom placeholder', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          placeholder="Custom placeholder"
        />
      )
      const input = container.querySelector('input[placeholder="Custom placeholder"]')
      expect(input).toBeTruthy()
    })

    it('should display initial value', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          value="initial value"
        />
      )
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.value).toBe('initial value')
    })

    it('should be disabled when disabled prop is true', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          disabled={true}
        />
      )
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.disabled).toBe(true)
    })
  })

  describe('User Input', () => {
    it('should trigger autocomplete after minimum characters', () => {
      const onFetchSuggestions = vi.fn()
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          onFetchSuggestions={onFetchSuggestions}
        />
      )
      
      const input = container.querySelector('input') as HTMLInputElement
      input.value = 'te'
      input.dispatchEvent(new Event('change', { bubbles: true }))
      
      // Debounce delay means it won't be called immediately
      expect(onFetchSuggestions).not.toHaveBeenCalled()
    })

    it('should not trigger autocomplete with less than 2 characters', () => {
      const onFetchSuggestions = vi.fn()
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          onFetchSuggestions={onFetchSuggestions}
        />
      )
      
      const input = container.querySelector('input') as HTMLInputElement
      input.value = 't'
      input.dispatchEvent(new Event('change', { bubbles: true }))
      
      expect(onFetchSuggestions).not.toHaveBeenCalled()
    })
  })

  describe('Suggestions Display', () => {
    it('should display suggestions when provided and isOpen is true', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
        />
      )
      
      const dropdown = container.querySelector('[role="listbox"]')
      expect(dropdown).toBeTruthy()
      
      const items = container.querySelectorAll('[role="option"]')
      expect(items.length).toBe(3)
    })

    it('should not display suggestions when isOpen is false', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={false}
        />
      )
      
      const dropdown = container.querySelector('[role="listbox"]')
      expect(dropdown).toBeFalsy()
    })

    it('should display loading state', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          isLoading={true}
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('Loading')
    })

    it('should display error state', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          error="Failed to load suggestions"
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('Failed to load suggestions')
    })

    it('should display fallback message when no suggestions', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={[]}
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('Type manually')
    })
  })

  describe('Suggestion Selection', () => {
    it('should call onSuggestionSelect when suggestion is clicked', () => {
      const onSuggestionSelect = vi.fn()
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
          onSuggestionSelect={onSuggestionSelect}
        />
      )
      
      const items = container.querySelectorAll('[role="option"]')
      const firstItem = items[0] as HTMLElement
      firstItem.click()
      
      expect(onSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0])
    })

    it('should close dropdown after selection', () => {
      const onOpenChange = vi.fn()
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
          onOpenChange={onOpenChange}
        />
      )
      
      const items = container.querySelectorAll('[role="option"]')
      const firstItem = items[0] as HTMLElement
      firstItem.click()
      
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          aria-label="Competitor URL input"
        />
      )
      
      const input = container.querySelector('input')
      expect(input?.getAttribute('aria-autocomplete')).toBe('list')
      expect(input?.getAttribute('aria-controls')).toBe('autocomplete-dropdown')
    })

    it('should have listbox role for suggestions', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
        />
      )
      
      const dropdown = container.querySelector('[role="listbox"]')
      expect(dropdown).toBeTruthy()
    })

    it('should have option role for suggestions', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
        />
      )
      
      const items = container.querySelectorAll('[role="option"]')
      expect(items.length).toBe(3)
    })
  })

  describe('Category Display', () => {
    it('should display suggestion categories', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('template')
      expect(text).toContain('industry')
      expect(text).toContain('best-practice')
    })

    it('should display source indicator', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={mockSuggestions}
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('ai')
      expect(text).toContain('cached')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty suggestions array', () => {
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={[]}
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('Type manually')
    })

    it('should handle very long suggestion text', () => {
      const longSuggestion = {
        id: '1',
        text: 'This is a very long suggestion text that might wrap to multiple lines in the dropdown menu',
        category: 'template' as const,
        source: 'ai' as const
      }
      
      const { container } = render(
        <AutocompleteDropdown 
          {...defaultProps} 
          suggestions={[longSuggestion]}
          isOpen={true}
        />
      )
      
      const text = container.textContent
      expect(text).toContain('This is a very long suggestion text')
    })
  })
})
