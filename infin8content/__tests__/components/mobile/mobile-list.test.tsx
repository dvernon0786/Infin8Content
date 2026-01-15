import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileList, { MobileListItem } from '@/components/mobile/mobile-list';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Mock the mobile layout hook
vi.mock('@/hooks/use-mobile-layout');
const mockUseMobileLayout = vi.mocked(useMobileLayout);

// Setup fake timers
vi.useFakeTimers();

// Mock data
const mockItems: MobileListItem[] = [
  {
    id: '1',
    title: 'Item 1',
    subtitle: 'Subtitle 1',
    description: 'Description 1',
    image: 'image1.jpg',
    badge: 'New',
    badgeColor: 'blue',
  },
  {
    id: '2',
    title: 'Item 2',
    subtitle: 'Subtitle 2',
    description: 'Description 2',
    badge: 'Updated',
    badgeColor: 'green',
  },
  {
    id: '3',
    title: 'Item 3',
    disabled: true,
  },
];

describe('MobileList', () => {
  const mockOnItemPress = vi.fn();
  const mockOnItemLongPress = vi.fn();
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
    it('should render mobile list component', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      expect(screen.getByTestId('test-list')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should render list items with correct structure', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      expect(screen.getByTestId('list-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-3')).toBeInTheDocument();
    });

    it('should render item titles', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      expect(screen.getByText('Item 1')).toHaveClass('text-base', 'font-medium', 'text-gray-900');
      expect(screen.getByText('Item 2')).toHaveClass('text-base', 'font-medium', 'text-gray-900');
    });

    it('should render item subtitles', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      expect(screen.getByText('Subtitle 1')).toHaveClass('text-sm', 'text-gray-600');
      expect(screen.getByText('Subtitle 2')).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should render item descriptions', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      expect(screen.getByText('Description 1')).toHaveClass('text-sm', 'text-gray-500');
      expect(screen.getByText('Description 2')).toHaveClass('text-sm', 'text-gray-500');
    });

    it('should render item images', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Item 1');
    });

    it('should render item badges', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      expect(screen.getByText('New')).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(screen.getByText('Updated')).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Touch Interactions', () => {
    it('should handle item press events', () => {
      render(
        <MobileList items={mockItems} onItemPress={mockOnItemPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      fireEvent.click(item);

      expect(mockOnItemPress).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should handle item long press events', async () => {
      render(
        <MobileList items={mockItems} onItemLongPress={mockOnItemLongPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      fireEvent.touchStart(item, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Wait for long press timer
      await vi.advanceTimersByTimeAsync(500);

      expect(mockOnItemLongPress).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should handle touch events properly', () => {
      render(
        <MobileList items={mockItems} onItemPress={mockOnItemPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      fireEvent.touchStart(item, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(item, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      expect(mockOnItemPress).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should cancel long press on touch move', () => {
      render(
        <MobileList items={mockItems} onItemLongPress={mockOnItemLongPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      fireEvent.touchStart(item, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      // Move too much
      fireEvent.touchMove(item, {
        touches: [{ clientX: 120, clientY: 120 }],
      });
      
      fireEvent.touchEnd(item, {
        changedTouches: [{ clientX: 120, clientY: 120 }],
      });

      expect(mockOnItemLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    it('should handle single selection', () => {
      render(
        <MobileList items={mockItems} onItemPress={mockOnItemPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      fireEvent.click(item);

      expect(mockOnItemPress).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should handle multi-selection', () => {
      render(
        <MobileList
          items={mockItems}
          multiSelect={true}
          onSelectionChange={mockOnSelectionChange}
          testId="test-list"
        />
      );

      const item1 = screen.getByTestId('list-item-1');
      const item2 = screen.getByTestId('list-item-2');

      fireEvent.click(item1);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set(['1']));

      fireEvent.click(item2);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set(['1', '2']));

      fireEvent.click(item1);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set(['2']));
    });

    it('should show selected state', () => {
      render(
        <MobileList
          items={mockItems}
          multiSelect={true}
          testId="test-list"
        />
      );

      const item = screen.getByTestId('list-item-1');
      fireEvent.click(item);

      expect(item).toHaveClass('border-blue-500', 'shadow-md');
      expect(item).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('States', () => {
    it('should render disabled items', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const disabledItem = screen.getByTestId('list-item-3');
      expect(disabledItem).toHaveClass('opacity-50');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render loading items', () => {
      const loadingItems: MobileListItem[] = [
        { ...mockItems[0], loading: true },
        { ...mockItems[1] },
      ];

      render(
        <MobileList items={loadingItems} testId="test-list" />
      );

      const loadingItem = screen.getByTestId('list-item-1');
      expect(loadingItem).toHaveAttribute('aria-busy', 'true');
      
      const spinner = loadingItem.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should render empty state when no items', () => {
      render(
        <MobileList items={[]} emptyMessage="No items available" testId="test-list" />
      );

      expect(screen.getByTestId('test-list-empty')).toBeInTheDocument();
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <MobileList items={[]} loading testId="test-list" />
      );

      expect(screen.getByTestId('test-list-loading')).toBeInTheDocument();
      
      const spinner = screen.getByTestId('test-list-loading').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render custom empty icon', () => {
      render(
        <MobileList items={[]} emptyIcon="📚" testId="test-list" />
      );

      expect(screen.getByText('📚')).toBeInTheDocument();
    });
  });

  describe('Mobile-Specific Behaviors', () => {
    it('should use mobile-specific touch target sizes', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      expect(item).toHaveStyle({ minHeight: '64px' });
    });

    it('should have mobile-specific styling', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      expect(item).toHaveStyle({
        padding: '12px',
        margin: '4px',
        borderRadius: '8px',
      });
    });

    it('should show scale effect on touch', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      expect(item).toHaveClass('active:scale-95');
    });
  });

  describe('Custom Rendering', () => {
    it('should use custom renderItem', () => {
      const customRenderItem = (item: MobileListItem) => (
        <div data-testid={`custom-item-${item.id}`}>
          Custom: {item.title}
        </div>
      );

      render(
        <MobileList items={mockItems} renderItem={customRenderItem} testId="test-list" />
      );

      expect(screen.getByTestId('custom-item-1')).toBeInTheDocument();
      expect(screen.getByText('Custom: Item 1')).toBeInTheDocument();
    });

    it('should use custom keyExtractor', () => {
      const customKeyExtractor = (item: MobileListItem) => `custom-${item.id}`;

      render(
        <MobileList items={mockItems} keyExtractor={customKeyExtractor} testId="test-list" />
      );

      const items = screen.getAllByTestId(/^list-item-/);
      expect(items).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <MobileList items={mockItems} onItemPress={mockOnItemPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      expect(item).toHaveAttribute('role', 'button');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('should handle keyboard navigation', () => {
      render(
        <MobileList items={mockItems} onItemPress={mockOnItemPress} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      expect(item).toHaveAttribute('role', 'button');
      expect(item).toHaveAttribute('tabIndex', '0');
      expect(item).toHaveAttribute('aria-disabled', 'false');
    });

    it('should have proper image alt text', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const image = screen.getByAltText('Item 1');
      expect(image).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      // Check that items have proper ARIA attributes
      const items = screen.getAllByTestId(/^list-item-/);
      expect(items).toHaveLength(3);
      
      items.forEach(item => {
        expect(item).toHaveAttribute('role', 'button');
      });
    });
  });

  describe('Performance', () => {
    it('should use lazy loading for images', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const images = screen.getAllByRole('img');
      images.forEach(image => {
        expect(image).toHaveAttribute('loading', 'lazy');
      });
    });

    it('should have proper transition classes', () => {
      render(
        <MobileList items={mockItems} testId="test-list" />
      );

      const item = screen.getByTestId('list-item-1');
      expect(item).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing image gracefully', () => {
      const itemsWithBadImage: MobileListItem[] = [
        { ...mockItems[0], image: 'non-existent.jpg' },
      ];

      render(
        <MobileList items={itemsWithBadImage} testId="test-list" />
      );

      // Should not crash and should render fallback alt text
      expect(screen.getByAltText('Item 1')).toBeInTheDocument();
    });

    it('should handle empty items array', () => {
      render(
        <MobileList items={[]} testId="test-list" />
      );

      expect(screen.getByTestId('test-list-empty')).toBeInTheDocument();
    });

    it('should handle missing optional props', () => {
      const minimalItems: MobileListItem[] = [
        { id: '1', title: 'Minimal Item' },
      ];

      render(
        <MobileList items={minimalItems} testId="test-list" />
      );

      expect(screen.getByText('Minimal Item')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-1')).toBeInTheDocument();
    });
  });
});
