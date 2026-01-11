/**
 * Tests for SearchInput component
 * Story 15.4: Dashboard Search and Filtering
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchInput } from '@/components/dashboard/search-input';
import { SearchHistory } from '@/lib/utils/search-utils';

// Mock SearchHistory
vi.mock('@/lib/utils/search-utils', () => ({
  SearchHistory: {
    getHistory: vi.fn(() => []),
    addToHistory: vi.fn(),
    clearHistory: vi.fn(),
    removeFromHistory: vi.fn(),
  },
}));

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('renders search input with placeholder', () => {
      render(<SearchInput {...defaultProps} placeholder="Search articles..." />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-label', 'Search articles');
    });

    it('displays current value', () => {
      render(<SearchInput {...defaultProps} value="test query" />);
      
      const input = screen.getByDisplayValue('test query');
      expect(input).toBeInTheDocument();
    });

    it('calls onChange when user types', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<SearchInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.type(input, 'test');
      
      // Should be debounced, so wait for it
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('test');
      }, { timeout: 500 });
    });

    it('shows clear button when value is present', () => {
      render(<SearchInput {...defaultProps} value="test" />);
      
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('hides clear button when value is empty', () => {
      render(<SearchInput {...defaultProps} value="" />);
      
      const clearButton = screen.queryByLabelText('Clear search');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      
      render(<SearchInput {...defaultProps} value="test" onClear={onClear} />);
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      expect(onClear).toHaveBeenCalled();
    });

    it('shows loading indicator when isLoading is true', () => {
      render(<SearchInput {...defaultProps} isLoading={true} />);
      
      const loadingIndicator = screen.getByRole('button');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces input changes', () => {
      const onChange = vi.fn();
      render(<SearchInput {...defaultProps} onChange={onChange} debounceMs={300} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      
      // Should not have called onChange yet
      expect(onChange).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(300);
      
      expect(onChange).toHaveBeenCalledWith('abc');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('cancels previous timeout when new input is received', () => {
      const onChange = vi.fn();
      render(<SearchInput {...defaultProps} onChange={onChange} debounceMs={300} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      
      fireEvent.change(input, { target: { value: 'first' } });
      vi.advanceTimersByTime(200);
      
      fireEvent.change(input, { target: { value: 'second' } });
      vi.advanceTimersByTime(300);
      
      expect(onChange).toHaveBeenCalledWith('second');
      expect(onChange).not.toHaveBeenCalledWith('first');
    });
  });

  describe('Search history', () => {
    beforeEach(() => {
      (SearchHistory.getHistory as any).mockReturnValue(['recent search 1', 'recent search 2']);
    });

    it('shows search history when input is focused and empty', async () => {
      const user = userEvent.setup();
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('recent search 1')).toBeInTheDocument();
        expect(screen.getByText('recent search 2')).toBeInTheDocument();
      });
    });

    it('adds to search history when search is performed', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<SearchInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.type(input, 'new search');
      
      vi.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(SearchHistory.addToHistory).toHaveBeenCalledWith('new search');
      });
    });

    it('can remove individual history items', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as any).mockReturnValue(['item to remove']);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        const removeButton = screen.getByLabelText('Remove item to remove from history');
        expect(removeButton).toBeInTheDocument();
      });
      
      const removeButton = screen.getByLabelText('Remove item to remove from history');
      await user.click(removeButton);
      
      expect(SearchHistory.removeFromHistory).toHaveBeenCalledWith('item to remove');
    });

    it('can clear all history', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as jest.Mock).mockReturnValue(['item 1', 'item 2']);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        const clearButton = screen.getByText('Clear All');
        expect(clearButton).toBeInTheDocument();
      });
      
      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);
      
      expect(SearchHistory.clearHistory).toHaveBeenCalled();
    });
  });

  describe('Keyboard navigation', () => {
    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as jest.Mock).mockReturnValue(['item 1']);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
    });

    it('closes dropdown on Enter key', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as jest.Mock).mockReturnValue(['item 1']);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });
      
      await user.keyboard('{Enter}');
      
      expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
    });

    it('focuses first suggestion on ArrowDown', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as jest.Mock).mockReturnValue(['item 1']);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}');
      
      // Should focus first suggestion item
      const suggestion = screen.getByText('item 1');
      expect(suggestion.closest('button')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      expect(input).toHaveAttribute('aria-label', 'Search articles');
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('announces help text when dropdown is open', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as jest.Mock).mockReturnValue(['item 1']);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-describedby', 'search-help');
      });
    });

    it('provides keyboard shortcut hint', () => {
      render(<SearchInput {...defaultProps} />);
      
      const hint = screen.getByText('Press / to focus, ESC to close');
      expect(hint).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('disables input when disabled prop is true', () => {
      render(<SearchInput {...defaultProps} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      expect(input).toBeDisabled();
    });

    it('does not show clear button when disabled', () => {
      render(<SearchInput {...defaultProps} value="test" disabled={true} />);
      
      const clearButton = screen.queryByLabelText('Clear search');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles empty search history gracefully', async () => {
      const user = userEvent.setup();
      (SearchHistory.getHistory as jest.Mock).mockReturnValue([]);
      
      render(<SearchInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText('No recent searches')).toBeInTheDocument();
      });
    });

    it('handles whitespace-only search', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<SearchInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Search articles...');
      await user.type(input, '   ');
      
      vi.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('   ');
      });
      
      // Should not add to history for whitespace-only
      expect(SearchHistory.addToHistory).not.toHaveBeenCalled();
    });
  });
});
