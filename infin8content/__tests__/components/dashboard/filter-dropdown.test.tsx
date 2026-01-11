/**
 * Tests for FilterDropdown component
 * Story 15.4: Dashboard Search and Filtering
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterDropdown } from '@/components/dashboard/filter-dropdown';
import { DATE_RANGE_PRESETS, WORD_COUNT_PRESETS } from '@/lib/utils/filter-utils';
import type { FilterState, ArticleStatus } from '@/lib/types/dashboard.types';

describe('FilterDropdown', () => {
  const defaultProps = {
    value: {
      status: [],
      dateRange: {},
      keywords: [],
      wordCountRange: {},
      sortBy: undefined,
    } as FilterState,
    onChange: vi.fn(),
    availableStatuses: ['queued', 'generating', 'completed', 'failed'] as ArticleStatus[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('renders filter dropdown button', () => {
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('shows active filter count when filters are applied', () => {
      const propsWithFilters = {
        ...defaultProps,
        value: {
          ...defaultProps.value,
          status: ['completed' as ArticleStatus],
        },
      };
      
      render(<FilterDropdown {...propsWithFilters} />);
      
      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
    });

    it('opens dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Filter Articles')).toBeInTheDocument();
    });
  });

  describe('Status filtering', () => {
    it('displays available status options', async () => {
      const user = userEvent.setup();
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('queued')).toBeInTheDocument();
      expect(screen.getByText('generating')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });

    it('allows selecting multiple statuses', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterDropdown {...defaultProps} onChange={onChange} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const completedCheckbox = screen.getByLabelText('completed');
      const failedCheckbox = screen.getByLabelText('failed');
      
      await user.click(completedCheckbox);
      await user.click(failedCheckbox);
      
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['completed', 'failed'],
        })
      );
    });
  });

  describe('Date range filtering', () => {
    it('displays date range presets', async () => {
      const user = userEvent.setup();
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('applies date range preset when clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterDropdown {...defaultProps} onChange={onChange} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const todayButton = screen.getByText('Today');
      await user.click(todayButton);
      
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Word count filtering', () => {
    it('displays word count presets', async () => {
      const user = userEvent.setup();
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Word Count')).toBeInTheDocument();
      expect(screen.getByText('Short (< 500 words)')).toBeInTheDocument();
      expect(screen.getByText('Medium (500-1500 words)')).toBeInTheDocument();
      expect(screen.getByText('Long (1500+ words)')).toBeInTheDocument();
    });

    it('allows custom word count range', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterDropdown {...defaultProps} onChange={onChange} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const minInput = screen.getByPlaceholderText('Min');
      const maxInput = screen.getByPlaceholderText('Max');
      
      await user.type(minInput, '500');
      await user.type(maxInput, '1500');
      
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          wordCountRange: {
            min: 500,
            max: 1500,
          },
        })
      );
    });
  });

  describe('Filter actions', () => {
    it('resets all filters when reset is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const propsWithFilters = {
        ...defaultProps,
        value: {
          ...defaultProps.value,
          status: ['completed' as ArticleStatus],
          keywords: ['test'],
        },
        onChange,
      };
      
      render(<FilterDropdown {...propsWithFilters} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const resetButton = screen.getByText('Reset All');
      await user.click(resetButton);
      
      expect(onChange).toHaveBeenCalledWith({
        status: [],
        dateRange: {},
        keywords: [],
        wordCountRange: {},
        sortBy: undefined,
      });
    });

    it('closes dropdown after applying filters', async () => {
      const user = userEvent.setup();
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Filter Articles')).toBeInTheDocument();
      
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);
      
      // Dropdown should be closed
      expect(screen.queryByText('Filter Articles')).not.toBeInTheDocument();
    });
  });

  describe('Active filters display', () => {
    it('shows active filter badges when filters are applied', async () => {
      const user = userEvent.setup();
      const propsWithFilters = {
        ...defaultProps,
        value: {
          ...defaultProps.value,
          status: ['completed' as ArticleStatus],
          keywords: ['test'],
        },
      };
      
      render(<FilterDropdown {...propsWithFilters} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      expect(screen.getByText('Active Filters:')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('Keywords')).toBeInTheDocument();
    });

    it('allows removing individual filters', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const propsWithFilters = {
        ...defaultProps,
        value: {
          ...defaultProps.value,
          status: ['completed' as ArticleStatus],
        },
        onChange,
      };
      
      render(<FilterDropdown {...propsWithFilters} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const removeButton = screen.getByLabelText('Remove completed filter');
      await user.click(removeButton);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: [],
        })
      );
    });
  });

  describe('Disabled state', () => {
    it('disables filter button when disabled prop is true', () => {
      render(<FilterDropdown {...defaultProps} disabled={true} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<FilterDropdown {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('announces filter count for screen readers', () => {
      const propsWithFilters = {
        ...defaultProps,
        value: {
          ...defaultProps.value,
          status: ['completed' as ArticleStatus],
          keywords: ['test'],
        },
      };
      
      render(<FilterDropdown {...propsWithFilters} />);
      
      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });
  });
});
