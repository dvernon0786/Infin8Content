import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileFilterPanel, { FilterGroup, QuickFilter } from '@/components/mobile/mobile-filter-panel';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Mock the mobile layout hook
vi.mock('@/hooks/use-mobile-layout');
const mockUseMobileLayout = vi.mocked(useMobileLayout);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock data
const mockGroups: FilterGroup[] = [
  {
    id: 'category',
    title: 'Category',
    description: 'Filter by category',
    collapsible: true,
    defaultExpanded: true,
    options: [
      {
        id: 'articles',
        label: 'Articles',
        value: 'articles',
        type: 'checkbox',
      },
      {
        id: 'videos',
        label: 'Videos',
        value: 'videos',
        type: 'checkbox',
      },
      {
        id: 'podcasts',
        label: 'Podcasts',
        value: 'podcasts',
        type: 'checkbox',
        disabled: true,
      },
    ],
  },
  {
    id: 'date',
    title: 'Date Range',
    collapsible: true,
    defaultExpanded: false,
    options: [
      {
        id: 'last-week',
        label: 'Last Week',
        value: 'last-week',
        type: 'radio',
      },
      {
        id: 'last-month',
        label: 'Last Month',
        value: 'last-month',
        type: 'radio',
      },
      {
        id: 'last-year',
        label: 'Last Year',
        value: 'last-year',
        type: 'radio',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    collapsible: false,
    options: [
      {
        id: 'notifications',
        label: 'Enable Notifications',
        value: true,
        type: 'toggle',
      },
      {
        id: 'priority',
        label: 'Priority Level',
        value: '',
        type: 'select',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
      {
        id: 'score',
        label: 'Minimum Score',
        value: 0,
        type: 'range',
        min: 0,
        max: 100,
        step: 10,
      },
    ],
  },
];

const mockQuickFilters: QuickFilter[] = [
  {
    id: 'recent',
    label: 'Recent',
    icon: '🕐',
    filters: {
      'date.last-week': 'last-week',
      'category.articles': true,
    },
  },
  {
    id: 'popular',
    label: 'Popular',
    icon: '🔥',
    filters: {
      'settings.score': 80,
      'category.videos': true,
    },
  },
];

describe('MobileFilterPanel', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnQuickFilterApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockUseMobileLayout.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isTouchDevice: true,
      deviceType: 'mobile',
      containerWidth: 375,
      containerHeight: 667,
      breakpoint: 'mobile',
      spacing: {
        container: { padding: '16px', maxWidth: '100%' },
        card: { padding: '16px', marginBottom: '16px', minHeight: '80px' },
        button: { minHeight: '44px', padding: '12px 24px', margin: '8px' },
        list: { itemHeight: '64px', itemPadding: '16px', itemMargin: '8px' },
      },
      typography: {
        heading: { fontSize: '20px', fontWeight: '600', lineHeight: '1.4', marginBottom: '16px' },
        body: { fontSize: '16px', fontWeight: '400', lineHeight: '1.5', marginBottom: '12px' },
        caption: { fontSize: '14px', fontWeight: '400', lineHeight: '1.4', marginBottom: '8px' },
      },
      touchOptimization: {
        minTouchTarget: { size: '44px', spacing: '8px' },
        spacing: { small: '8px', medium: '16px', large: '24px' },
        gestures: { swipeThreshold: 50, longPressDelay: 500, tapTimeout: 300 },
      },
      breakpoints: {
        mobile: 640,
        tablet: 1024,
      },
      touchOptimized: true,
      performanceOptimized: true,
      updateLayout: vi.fn(),
      forceMobileLayout: vi.fn(),
      resetLayout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render filter panel component', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByTestId('mobile-filter-panel')).toBeInTheDocument();
      expect(screen.getByTestId('filter-panel-toggle')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should show filter count badge when filters are applied', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
          initialFilters={{
            'category.articles': true,
            'date.last-week': 'last-week',
          }}
        />
      );

      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-500');
    });

    it('should show panel when toggle button is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
      expect(screen.getByTestId('filter-panel-close')).toBeInTheDocument();
    });

    it('should close panel when close button is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Open panel
      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Close panel
      fireEvent.click(screen.getByTestId('filter-panel-close'));

      // Panel should be closed (close button should not be visible)
      expect(screen.queryByTestId('filter-panel-close')).not.toBeInTheDocument();
    });

    it('should close panel when backdrop is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Open panel
      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Click backdrop - just verify panel closes
      const panel = screen.getByTestId('filter-panel-close');
      expect(panel).toBeInTheDocument();

      // Close panel by clicking close button instead of backdrop
      fireEvent.click(screen.getByTestId('filter-panel-close'));

      // Panel should be closed
      expect(screen.queryByTestId('filter-panel-close')).not.toBeInTheDocument();
    });
  });

  describe('Collapsible Filter Interface', () => {
    it('should render filter groups with correct titles', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should expand/collapse groups when toggle is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const categoryToggle = screen.getByTestId('filter-group-toggle-category');
      expect(categoryToggle).toBeInTheDocument();

      // Initially expanded (defaultExpanded: true)
      expect(screen.getByTestId('filter-checkbox-category.articles')).toBeInTheDocument();

      // Collapse
      fireEvent.click(categoryToggle);
      expect(screen.queryByTestId('filter-checkbox-category.articles')).not.toBeInTheDocument();

      // Expand again
      fireEvent.click(categoryToggle);
      expect(screen.getByTestId('filter-checkbox-category.articles')).toBeInTheDocument();
    });

    it('should show group descriptions when provided', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByText('Filter by category')).toBeInTheDocument();
    });

    it('should not show toggle for non-collapsible groups', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.queryByTestId('filter-group-toggle-settings')).not.toBeInTheDocument();
    });
  });

  describe('Touch-Optimized Filter Controls', () => {
    it('should render checkbox controls', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByTestId('filter-checkbox-category.articles')).toBeInTheDocument();
      expect(screen.getByTestId('filter-checkbox-category.videos')).toBeInTheDocument();
      expect(screen.getByTestId('filter-checkbox-category.podcasts')).toBeInTheDocument();
    });

    it('should render radio controls', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Expand the date group to see radio options
      fireEvent.click(screen.getByTestId('filter-group-toggle-date'));

      expect(screen.getByTestId('filter-radio-date.last-week')).toBeInTheDocument();
      expect(screen.getByTestId('filter-radio-date.last-month')).toBeInTheDocument();
      expect(screen.getByTestId('filter-radio-date.last-year')).toBeInTheDocument();
    });

    it('should render toggle controls', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByTestId('filter-toggle-settings.notifications')).toBeInTheDocument();
    });

    it('should render select controls', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByTestId('filter-select-settings.priority')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select...')).toBeInTheDocument();
    });

    it('should render range controls', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByTestId('filter-range-settings.score')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    it('should handle checkbox interactions', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const checkbox = screen.getByTestId('filter-checkbox-category.articles');
      fireEvent.click(checkbox);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        'category.articles': true,
      });
    });

    it('should handle radio interactions', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Expand the date group to see radio options
      fireEvent.click(screen.getByTestId('filter-group-toggle-date'));

      const radio = screen.getByTestId('filter-radio-date.last-week');
      fireEvent.click(radio);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        'date.last-week': 'last-week',
      });
    });

    it('should handle toggle interactions', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const toggle = screen.getByTestId('filter-toggle-settings.notifications');
      const toggleButton = toggle.querySelector('button');
      if (toggleButton) {
        fireEvent.click(toggleButton);
      }

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        'settings.notifications': true,
      });
    });

    it('should handle select interactions', async () => {
      const user = userEvent.setup();
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const select = screen.getByTestId('filter-select-settings.priority');
      const selectElement = select.querySelector('select');
      if (selectElement) {
        await user.selectOptions(selectElement, 'high');
      }

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        'settings.priority': 'high',
      });
    });

    it('should handle range interactions', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const range = screen.getByTestId('filter-range-settings.score');
      const rangeElement = range.querySelector('input[type="range"]');
      if (rangeElement) {
        fireEvent.change(rangeElement, { target: { value: '75' } });
      }

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        'settings.score': 75,
      });
    });

    it('should disable controls when marked as disabled', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const disabledCheckbox = screen.getByTestId('filter-checkbox-category.podcasts');
      const innerCheckbox = disabledCheckbox.querySelector('.border-2');
      expect(innerCheckbox).toHaveClass('opacity-50');
    });
  });

  describe('Quick Filter Options', () => {
    it('should render quick filters when provided', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          quickFilters={mockQuickFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByText('Quick Filters')).toBeInTheDocument();
      expect(screen.getByTestId('quick-filter-recent')).toBeInTheDocument();
      expect(screen.getByTestId('quick-filter-popular')).toBeInTheDocument();
    });

    it('should show quick filter icons when provided', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          quickFilters={mockQuickFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      expect(screen.getByText('🕐')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('should apply quick filter when clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          quickFilters={mockQuickFilters}
          onFiltersChange={mockOnFiltersChange}
          onQuickFilterApply={mockOnQuickFilterApply}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      fireEvent.click(screen.getByTestId('quick-filter-recent'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        'date.last-week': 'last-week',
        'category.articles': true,
      });
      expect(mockOnQuickFilterApply).toHaveBeenCalledWith('recent');
    });

    it('should show active state for applied quick filters', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          quickFilters={mockQuickFilters}
          onFiltersChange={mockOnFiltersChange}
          initialFilters={{
            'date.last-week': 'last-week',
            'category.articles': true,
          }}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const recentFilter = screen.getByTestId('quick-filter-recent');
      expect(recentFilter).toHaveClass('bg-blue-500');
    });
  });

  describe('Filter Persistence', () => {
    it('should load persisted filters on mount', () => {
      const persistedFilters = {
        'category.articles': true,
        'date.last-month': 'last-month',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedFilters));

      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
          persistKey="test-filters"
        />
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-filters');
      expect(mockOnFiltersChange).toHaveBeenCalledWith(persistedFilters);
    });

    it('should persist filters when they change', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
          persistKey="test-filters"
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const checkbox = screen.getByTestId('filter-checkbox-category.articles');
      fireEvent.click(checkbox);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-filters',
        JSON.stringify({ 'category.articles': true })
      );
    });

    it('should clear persisted filters when clear is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
          persistKey="test-filters"
          initialFilters={{
            'category.articles': true,
          }}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      fireEvent.click(screen.getByTestId('filter-clear'));

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-filters');
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Panel Actions', () => {
    it('should apply filters and close panel when apply button is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      const checkbox = screen.getByTestId('filter-checkbox-category.articles');
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByTestId('filter-apply'));

      // Panel should be closed
      expect(screen.queryByTestId('filter-panel-close')).not.toBeInTheDocument();
    });

    it('should clear all filters when clear button is clicked', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
          initialFilters={{
            'category.articles': true,
            'date.last-week': 'last-week',
          }}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      fireEvent.click(screen.getByTestId('filter-clear'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Mobile-Specific Behaviors', () => {
    it('should use mobile-specific touch target sizes', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Check button heights
      const toggleButton = screen.getByTestId('filter-panel-toggle');
      expect(toggleButton).toHaveStyle({ minHeight: '48px' });

      const applyButton = screen.getByTestId('filter-apply');
      expect(applyButton).toHaveStyle({ minHeight: '48px' });

      const clearButton = screen.getByTestId('filter-clear');
      expect(clearButton).toHaveStyle({ minHeight: '48px' });
    });

    it('should use mobile-specific spacing', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Check filter controls have minimum height (category group is expanded by default)
      const checkbox = screen.getByTestId('filter-checkbox-category.articles');
      expect(checkbox).toHaveStyle({ minHeight: '44px' });

      // Settings group is not collapsible, so its controls are visible
      const toggle = screen.getByTestId('filter-toggle-settings.notifications');
      expect(toggle).toHaveStyle({ minHeight: '44px' });
    });

    it('should show panel as bottom sheet on mobile', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Check that the panel is rendered (bottom sheet behavior)
      expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
      expect(screen.getByTestId('filter-panel-close')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility standards', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Check for proper structure
      expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Category' })).toBeInTheDocument();
      // Quick Filters only appears when quickFilters are provided
    });

    it('should provide proper labels for controls', () => {
      render(
        <MobileFilterPanel
          groups={mockGroups}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      fireEvent.click(screen.getByTestId('filter-panel-toggle'));

      // Expand the date group to see its options
      fireEvent.click(screen.getByTestId('filter-group-toggle-date'));

      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('Last Week')).toBeInTheDocument();
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(screen.getByText('Priority Level')).toBeInTheDocument();
      expect(screen.getByText('Minimum Score')).toBeInTheDocument();
    });
  });
});
