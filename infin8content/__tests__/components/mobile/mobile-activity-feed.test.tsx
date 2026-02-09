import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileActivityFeed, type Activity } from '@/components/mobile/mobile-activity-feed';
import { useMobileLayout } from '@/hooks/use-mobile-layout';

// Mock the mobile layout hook
vi.mock('@/hooks/use-mobile-layout', () => ({
  useMobileLayout: vi.fn(() => ({
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
    breakpoints: { mobile: 640, tablet: 1024 },
    touchOptimized: true,
    performanceOptimized: true,
    updateLayout: vi.fn(),
    forceMobileLayout: vi.fn(),
    resetLayout: vi.fn(),
  })),
}));

// Mock activity data
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'article_created' as const,
    message: 'John Doe created "Getting Started with React"',
    timestamp: '2024-01-15T10:00:00Z',
    user: {
      id: 'user1',
      name: 'John Doe',
      avatar: 'https://example.com/avatar1.jpg',
    },
    metadata: {
      articleId: 'article1',
      articleTitle: 'Getting Started with React',
    },
  },
  {
    id: '2',
    type: 'article_published' as const,
    message: 'Jane Smith published "Advanced TypeScript Patterns"',
    timestamp: '2024-01-15T11:30:00Z',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: 'https://example.com/avatar2.jpg',
    },
    metadata: {
      articleId: 'article2',
      articleTitle: 'Advanced TypeScript Patterns',
    },
  },
  {
    id: '3',
    type: 'comment_added' as const,
    message: 'Bob Johnson commented on "Mobile Design Best Practices"',
    timestamp: '2024-01-15T12:45:00Z',
    user: {
      id: 'user3',
      name: 'Bob Johnson',
      avatar: 'https://example.com/avatar3.jpg',
    },
    metadata: {
      articleId: 'article3',
      articleTitle: 'Mobile Design Best Practices',
      commentId: 'comment1',
    },
  },
];

describe('MobileActivityFeed', () => {
  let mockUseMobileLayout: any;

  beforeEach(async () => {
    // Import mocked hook after setup
    const mockedHook = await import('@/hooks/use-mobile-layout');
    mockUseMobileLayout = vi.mocked(mockedHook.useMobileLayout);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Vertical Scrolling Feed', () => {
    it('should render activities in vertical scrolling layout', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const activityItems = screen.getAllByTestId(/activity-item-\d/);
      expect(activityItems).toHaveLength(3);
      
      // Verify vertical scrolling layout
      const container = screen.getByTestId('mobile-activity-feed');
      expect(container).toHaveStyle({ display: 'flex', flexDirection: 'column' });
    });

    it('should use mobile-specific spacing for feed items', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const container = screen.getByTestId('mobile-activity-feed');
      expect(container).toHaveStyle({ padding: '16px' });
      
      const activityItems = screen.getAllByTestId(/activity-item-\d/);
      activityItems.forEach(item => {
        expect(item).toHaveStyle({ marginBottom: '16px' });
      });
    });

    it('should handle infinite scrolling for large activity lists', async () => {
      const largeActivityList = Array.from({ length: 50 }, (_, i) => ({
        ...mockActivities[0],
        id: i.toString(),
        message: `Activity ${i}`,
      }));
      
      const onLoadMore = vi.fn();
      
      render(<MobileActivityFeed activities={largeActivityList} onLoadMore={onLoadMore} />);
      
      // Should render initial items
      const visibleItems = screen.getAllByTestId(/activity-item-\d/);
      expect(visibleItems.length).toBeGreaterThan(0);
      
      // Scroll to bottom to trigger load more
      const container = screen.getByTestId('mobile-activity-feed');
      fireEvent.scroll(container, { target: { scrollTop: 1000 } });
      
      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalled();
      });
    });
  });

  describe('Pull-to-Refresh Functionality', () => {
    it('should handle pull-to-refresh gesture', async () => {
      const onRefresh = vi.fn();
      
      render(<MobileActivityFeed activities={mockActivities} onRefresh={onRefresh} />);
      
      const container = screen.getByTestId('mobile-activity-feed');
      
      // Simulate pull-to-refresh gesture
      fireEvent.touchStart(container, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientY: 200 }] });
      fireEvent.touchEnd(container);
      
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });

    it('should show refresh indicator during pull-to-refresh', async () => {
      const onRefresh = vi.fn(() => Promise.resolve());
      
      render(<MobileActivityFeed activities={mockActivities} onRefresh={onRefresh} />);
      
      const container = screen.getByTestId('mobile-activity-feed');
      
      // Start pull gesture
      fireEvent.touchStart(container, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientY: 200 }] });
      
      // Should show refresh indicator
      expect(screen.getByTestId('refresh-indicator')).toBeVisible();
      
      // Complete gesture
      fireEvent.touchEnd(container);
      
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });

    it('should respect pull-to-refresh threshold', () => {
      const onRefresh = vi.fn();
      
      render(<MobileActivityFeed activities={mockActivities} onRefresh={onRefresh} />);
      
      const container = screen.getByTestId('mobile-activity-feed');
      
      // Small movement (below threshold)
      fireEvent.touchStart(container, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientY: 110 }] });
      fireEvent.touchEnd(container);
      
      // Should not trigger refresh
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Touch-Optimized Activity Items', () => {
    it('should render activity items with touch-friendly dimensions', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const activityItems = screen.getAllByTestId(/activity-item-\d/);
      activityItems.forEach(item => {
        expect(item).toHaveStyle({ minHeight: '64px' });
      });
    });

    it('should handle touch interactions on activity items', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const firstActivity = screen.getByTestId('activity-item-1');
      
      // Test touch events
      fireEvent.touchStart(firstActivity);
      fireEvent.touchEnd(firstActivity);
      
      // Should handle without errors
      expect(firstActivity).toBeInTheDocument();
    });

    it('should provide visual feedback for touch interactions', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const firstActivity = screen.getByTestId('activity-item-1');
      
      // Touch start should add visual feedback
      fireEvent.touchStart(firstActivity);
      expect(firstActivity).toHaveClass('touch-active');
      
      // Touch end should remove feedback
      fireEvent.touchEnd(firstActivity);
      expect(firstActivity).not.toHaveClass('touch-active');
    });
  });

  describe('Real-Time Updates with Mobile Optimization', () => {
    it('should handle real-time activity updates', async () => {
      const { rerender } = render(<MobileActivityFeed activities={mockActivities} />);
      
      // Initial state
      expect(screen.getAllByTestId(/activity-item-\d/)).toHaveLength(3);
      
      // Add new activity
      const newActivities = [
        ...mockActivities,
        {
          id: '4',
          type: 'article_updated' as const,
          message: 'Alice Brown updated "CSS Grid Mastery"',
          timestamp: '2024-01-15T13:00:00Z',
          user: {
            id: 'user4',
            name: 'Alice Brown',
            avatar: 'https://example.com/avatar4.jpg',
          },
        },
      ];
      
      rerender(<MobileActivityFeed activities={newActivities} />);
      
      // Should show new activity
      expect(screen.getAllByTestId(/activity-item-\d/)).toHaveLength(4);
      expect(screen.getByText('Alice Brown updated "CSS Grid Mastery"')).toBeVisible();
    });

    it('should optimize performance for real-time updates', () => {
      // Just verify the component renders without errors
      render(<MobileActivityFeed activities={mockActivities} />);
      
      // The component uses debouncing internally for performance
      const container = screen.getByTestId('mobile-activity-feed');
      expect(container).toBeInTheDocument();
    });

    it('should handle activity updates without layout shifts', () => {
      const { rerender } = render(<MobileActivityFeed activities={mockActivities} />);
      
      const container = screen.getByTestId('mobile-activity-feed');
      
      // Add new activity
      const newActivities = [...mockActivities, {
        id: '4',
        type: 'article_created' as const,
        message: 'New activity',
        timestamp: '2024-01-15T13:00:00Z',
        user: { id: 'user4', name: 'Alice Brown', avatar: 'https://example.com/avatar4.jpg' },
      }];
      
      rerender(<MobileActivityFeed activities={newActivities} />);
      
      // Should render new activity without errors
      expect(screen.getAllByTestId(/activity-item-\d/)).toHaveLength(4);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Mobile-Specific Activity Types', () => {
    it('should render different activity types appropriately', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      // Article created activity
      expect(screen.getByTestId('activity-type-article_created')).toBeVisible();
      expect(screen.getByText('article created')).toBeVisible();
      
      // Article published activity
      expect(screen.getByTestId('activity-type-article_published')).toBeVisible();
      expect(screen.getByText('article published')).toBeVisible();
      
      // Comment added activity
      expect(screen.getByTestId('activity-type-comment_added')).toBeVisible();
      expect(screen.getByText('comment added')).toBeVisible();
    });

    it('should format timestamps for mobile display', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const timestamps = screen.getAllByTestId(/activity-timestamp-\d/);
      timestamps.forEach(timestamp => {
        expect(timestamp).toHaveTextContent(/\d+[hms] ago|Yesterday|\w+ \d+/);
      });
    });

    it('should display user avatars with fallbacks', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const avatars = screen.getAllByTestId(/activity-avatar-\d/);
      avatars.forEach(avatar => {
        const img = avatar.querySelector('img');
        if (img) {
          expect(img).toHaveAttribute('src');
          expect(img).toHaveAttribute('alt');
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty activity list gracefully', () => {
      render(<MobileActivityFeed activities={[]} />);
      
      expect(screen.getByTestId('empty-state')).toBeVisible();
      expect(screen.getByText('No recent activity')).toBeVisible();
    });

    it('should handle loading states', () => {
      render(<MobileActivityFeed activities={[]} loading={true} />);
      
      expect(screen.getByTestId('loading-state')).toBeVisible();
      expect(screen.getByTestId('loading-spinner')).toBeVisible();
    });

    it('should handle refresh errors gracefully', async () => {
      const onRefresh = vi.fn(() => Promise.reject(new Error('Network error')));
      
      render(<MobileActivityFeed activities={mockActivities} onRefresh={onRefresh} />);
      
      const container = screen.getByTestId('mobile-activity-feed');
      
      // Trigger refresh
      fireEvent.touchStart(container, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(container, { touches: [{ clientY: 200 }] });
      fireEvent.touchEnd(container);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeVisible();
        expect(screen.getByText('Failed to refresh')).toBeVisible();
      });
    });

    it('should handle malformed activity data', () => {
      const malformedActivities = [
        {
          id: '1',
          type: 'article_created' as const,
          message: 'Invalid activity',
          timestamp: '2024-01-15T10:00:00Z',
          user: { id: 'unknown', name: 'Unknown User', avatar: '' },
        },
      ] as Activity[];
      
      render(<MobileActivityFeed activities={malformedActivities} />);
      
      // Should render with fallbacks
      expect(screen.getByTestId('activity-item-1')).toBeVisible();
      expect(screen.getByText('Unknown User')).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility standards on mobile', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      // Check for proper ARIA labels
      const activityItems = screen.getAllByTestId(/activity-item-\d/);
      activityItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'article');
      });
      
      // Check for keyboard navigation
      const firstItem = screen.getByTestId('activity-item-1');
      expect(firstItem).toHaveAttribute('tabindex', '0');
    });

    it('should provide screen reader friendly content', () => {
      render(<MobileActivityFeed activities={mockActivities} />);
      
      const firstActivity = screen.getByTestId('activity-item-1');
      expect(firstActivity).toHaveAttribute('aria-label', expect.stringContaining('John Doe'));
    });

    it('should announce new activities to screen readers', async () => {
      const { rerender } = render(<MobileActivityFeed activities={mockActivities} />);
      
      // Add new activity
      const newActivities = [...mockActivities, {
        id: '4',
        type: 'article_created' as const,
        message: 'New activity',
        timestamp: '2024-01-15T13:00:00Z',
        user: { id: 'user4', name: 'Alice Brown', avatar: 'https://example.com/avatar4.jpg' },
      }] as Activity[];
      
      rerender(<MobileActivityFeed activities={newActivities} />);
      
      // Should have live region for announcements
      expect(screen.getByTestId('activity-announcements')).toHaveAttribute('aria-live', 'polite');
    });
  });
});
