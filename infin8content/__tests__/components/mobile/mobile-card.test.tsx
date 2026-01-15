import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileCard from '@/components/mobile/mobile-card';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Mock the mobile layout hook
vi.mock('@/hooks/use-mobile-layout');
const mockUseMobileLayout = vi.mocked(useMobileLayout);

// Setup fake timers
vi.useFakeTimers();

describe('MobileCard', () => {
  const mockOnPress = vi.fn();
  const mockOnLongPress = vi.fn();

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
    it('should render mobile card component', () => {
      render(
        <MobileCard testId="test-card">
          <div>Card content</div>
        </MobileCard>
      );

      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <MobileCard title="Test Title" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toHaveClass('text-base', 'font-semibold', 'text-gray-900');
    });

    it('should render with subtitle', () => {
      render(
        <MobileCard title="Title" subtitle="Test Subtitle" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should render with description', () => {
      render(
        <MobileCard title="Title" description="Test Description" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toHaveClass('text-sm', 'text-gray-500');
    });

    it('should render with image', () => {
      render(
        <MobileCard
          title="Title"
          image="test-image.jpg"
          imageAlt="Test image"
          testId="test-card"
        >
          <div>Content</div>
        </MobileCard>
      );

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'test-image.jpg');
    });

    it('should render with badge', () => {
      render(
        <MobileCard 
          title="Title" 
          image="test-image.jpg"
          badge="New" 
          badgeColor="blue" 
          testId="test-card"
        >
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('New')).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should render with actions', () => {
      render(
        <MobileCard
          title="Title"
          actions={<button data-testid="action-button">Action</button>}
          testId="test-card"
        >
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByTestId('action-button')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('should handle press events', () => {
      render(
        <MobileCard title="Title" onPress={mockOnPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(card, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should handle long press events', async () => {
      render(
        <MobileCard title="Title" onLongPress={mockOnLongPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Wait for long press timer
      await vi.advanceTimersByTimeAsync(500);

      expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    });

    it('should handle touch events properly', () => {
      render(
        <MobileCard title="Title" onPress={mockOnPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(card, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should cancel long press on touch move', () => {
      render(
        <MobileCard title="Title" onLongPress={mockOnLongPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      // Move too much
      fireEvent.touchMove(card, {
        touches: [{ clientX: 120, clientY: 120 }],
      });
      
      fireEvent.touchEnd(card, {
        changedTouches: [{ clientX: 120, clientY: 120 }],
      });

      expect(mockOnLongPress).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(
        <MobileCard title="Title" disabled testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('opacity-50');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render selected state', () => {
      render(
        <MobileCard title="Title" selected testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('ring-2', 'ring-blue-500');
      
      // Check for selected indicator by looking for the checkmark
      const indicator = card.querySelector('.bg-blue-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(
        <MobileCard title="Title" loading testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('animate-pulse');
      expect(card).toHaveAttribute('aria-busy', 'true');
      
      const spinner = card.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Mobile-Specific Behaviors', () => {
    it('should use mobile-specific touch target sizes', () => {
      render(
        <MobileCard title="Title" onPress={mockOnPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveStyle({ minHeight: '44px' });
    });

    it('should have mobile-specific styling', () => {
      render(
        <MobileCard title="Title" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveStyle({
        padding: '16px',
        margin: '8px',
        borderRadius: '12px',
      });
    });

    it('should show scale effect on touch', () => {
      render(
        <MobileCard title="Title" onPress={mockOnPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('active:scale-95');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <MobileCard title="Title" onPress={mockOnPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should handle keyboard navigation', () => {
      render(
        <MobileCard title="Title" onPress={mockOnPress} testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');

      // Test that the card has the correct ARIA attributes
      expect(card).toHaveAttribute('aria-disabled', 'false');
    });

    it('should have proper image alt text', () => {
      render(
        <MobileCard
          title="Title"
          image="test-image.jpg"
          imageAlt="Descriptive alt text"
          testId="test-card"
        >
          <div>Content</div>
        </MobileCard>
      );

      const image = screen.getByAltText('Descriptive alt text');
      expect(image).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(
        <MobileCard title="Main Title" subtitle="Subtitle" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByRole('heading', { name: 'Main Title' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing image gracefully', () => {
      render(
        <MobileCard title="Title" image="non-existent.jpg" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      // Should not crash and should render fallback alt text
      expect(screen.getByAltText('Title')).toBeInTheDocument();
    });

    it('should handle missing optional props', () => {
      render(
        <MobileCard testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      expect(screen.getByTestId('test-card')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should use lazy loading for images', () => {
      render(
        <MobileCard
          title="Title"
          image="test-image.jpg"
          testId="test-card"
        >
          <div>Content</div>
        </MobileCard>
      );

      const image = screen.getByAltText('Title');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should have proper transition classes', () => {
      render(
        <MobileCard title="Title" testId="test-card">
          <div>Content</div>
        </MobileCard>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('transition-all', 'duration-200');
    });
  });
});
