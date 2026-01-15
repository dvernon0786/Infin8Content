import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TouchTarget from '@/components/mobile/touch-target';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Mock the mobile layout hook
vi.mock('@/hooks/use-mobile-layout');
const mockUseMobileLayout = vi.mocked(useMobileLayout);

describe('TouchTarget', () => {
  const mockOnPress = vi.fn();
  const mockOnLongPress = vi.fn();
  const mockOnTouchStart = vi.fn();
  const mockOnTouchEnd = vi.fn();

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
    it('should render touch target component', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Target Content</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toBeInTheDocument();
      expect(screen.getByText('Target Content')).toBeInTheDocument();
    });

    it('should render with different sizes', () => {
      const { rerender } = render(
        <TouchTarget size="small" testId="test-target">
          <span>Small</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveStyle({ minWidth: '40px', minHeight: '40px' });

      rerender(
        <TouchTarget size="medium" testId="test-target">
          <span>Medium</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveStyle({ minWidth: '44px', minHeight: '44px' });

      rerender(
        <TouchTarget size="large" testId="test-target">
          <span>Large</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveStyle({ minWidth: '48px', minHeight: '48px' });
    });

    it('should render with different variants', () => {
      const { rerender } = render(
        <TouchTarget variant="primary" testId="test-target">
          <span>Primary</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveClass('bg-blue-500', 'text-white');

      rerender(
        <TouchTarget variant="secondary" testId="test-target">
          <span>Secondary</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveClass('bg-gray-500', 'text-white');

      rerender(
        <TouchTarget variant="outline" testId="test-target">
          <span>Outline</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveClass('border', 'border-gray-300', 'text-gray-700');

      rerender(
        <TouchTarget variant="ghost" testId="test-target">
          <span>Ghost</span>
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toHaveClass('text-gray-700');
    });
  });

  describe('Touch Interactions', () => {
    it('should handle press events', () => {
      render(
        <TouchTarget onPress={mockOnPress} testId="test-target">
          <span>Press Me</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.click(target);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should handle long press events', async () => {
      render(
        <TouchTarget onLongPress={mockOnLongPress} testId="test-target">
          <span>Long Press Me</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.touchStart(target, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Wait for long press timer
      await vi.advanceTimersByTimeAsync(500);

      expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    });

    it('should handle custom touch events', () => {
      render(
        <TouchTarget
          onTouchStart={mockOnTouchStart}
          onTouchEnd={mockOnTouchEnd}
          testId="test-target"
        >
          <span>Touch Events</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.touchStart(target);
      fireEvent.touchEnd(target);

      expect(mockOnTouchStart).toHaveBeenCalledTimes(1);
      expect(mockOnTouchEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle touch events properly', () => {
      render(
        <TouchTarget onPress={mockOnPress} testId="test-target">
          <span>Touch Me</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.touchStart(target, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(target, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should cancel long press on touch move', () => {
      render(
        <TouchTarget onLongPress={mockOnLongPress} testId="test-target">
          <span>Move Me</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.touchStart(target, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      // Move too much
      fireEvent.touchMove(target, {
        touches: [{ clientX: 120, clientY: 120 }],
      });
      
      fireEvent.touchEnd(target, {
        changedTouches: [{ clientX: 120, clientY: 120 }],
      });

      expect(mockOnLongPress).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(
        <TouchTarget disabled testId="test-target">
          <span>Disabled</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(target).toHaveAttribute('aria-disabled', 'true');
      expect(target).toHaveAttribute('tabIndex', '-1');
    });

    it('should render loading state', () => {
      render(
        <TouchTarget loading testId="test-target">
          <span>Loading</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('animate-pulse');
      expect(target).toHaveAttribute('aria-busy', 'true');
      
      const spinner = target.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not handle interactions when disabled', () => {
      render(
        <TouchTarget disabled onPress={mockOnPress} testId="test-target">
          <span>Disabled</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.click(target);

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not handle interactions when loading', () => {
      render(
        <TouchTarget loading onPress={mockOnPress} testId="test-target">
          <span>Loading</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      fireEvent.click(target);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Mobile-Specific Behaviors', () => {
    it('should use mobile-specific touch target sizes', () => {
      render(
        <TouchTarget size="medium" testId="test-target">
          <span>Medium Size</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });

    it('should show scale effect on touch', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Scale Effect</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('active:scale-95');
    });

    it('should show touch feedback overlay', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Touch Feedback</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      const overlay = target.querySelector('.bg-white');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('opacity-0', 'active:opacity-10');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TouchTarget testId="test-target" ariaLabel="Test Target">
          <span>Content</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveAttribute('role', 'button');
      expect(target).toHaveAttribute('tabIndex', '0');
      expect(target).toHaveAttribute('aria-label', 'Test Target');
    });

    it('should handle keyboard navigation', () => {
      render(
        <TouchTarget onPress={mockOnPress} testId="test-target">
          <span>Keyboard</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      target.focus();
      expect(target).toHaveFocus();

      fireEvent.keyDown(target, { key: 'Enter' });
      expect(mockOnPress).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(target, { key: ' ' });
      expect(mockOnPress).toHaveBeenCalledTimes(2);
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <span id="description">Target description</span>
          <TouchTarget testId="test-target" ariaDescribedBy="description">
            <span>Content</span>
          </TouchTarget>
        </>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveAttribute('aria-describedby', 'description');
    });

    it('should have proper semantic structure', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Semantic</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveAttribute('role', 'button');
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      render(
        <TouchTarget className="custom-class" testId="test-target">
          <span>Custom</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('custom-class');
    });

    it('should apply custom styles', () => {
      render(
        <TouchTarget style={{ margin: '10px' }} testId="test-target">
          <span>Custom Style</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveStyle({ margin: '10px' });
    });

    it('should have proper base classes', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Base Classes</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded-lg', 'font-medium');
    });

    it('should have transition classes', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Transitions</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing children gracefully', () => {
      render(
        <TouchTarget testId="test-target">
          {null}
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toBeInTheDocument();
    });

    it('should handle empty children gracefully', () => {
      render(
        <TouchTarget testId="test-target">
          {''}
        </TouchTarget>
      );

      expect(screen.getByTestId('test-target')).toBeInTheDocument();
    });

    it('should handle complex children', () => {
      render(
        <TouchTarget testId="test-target">
          <div>
            <span>Complex</span>
            <button>Button</button>
          </div>
        </TouchTarget>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should have proper loading spinner', () => {
      render(
        <TouchTarget loading testId="test-target">
          <span>Loading</span>
        </TouchTarget>
      );

      const spinner = screen.getByTestId('test-target').querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('should have proper touch feedback', () => {
      render(
        <TouchTarget testId="test-target">
          <span>Feedback</span>
        </TouchTarget>
      );

      const target = screen.getByTestId('test-target');
      expect(target).toHaveClass('cursor-pointer');
    });
  });
});
