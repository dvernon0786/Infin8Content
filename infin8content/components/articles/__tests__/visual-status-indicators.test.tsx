/**
 * Tests for visual status indicators component
 * Story 15.2: Visual Status Indicators
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VisualStatusIndicator, ResponsiveStatusIndicator } from '../visual-status-indicator';

// Mock the real-time hook
vi.mock('@/hooks/use-realtime-articles', () => ({
  useRealtimeArticles: () => ({
    articles: [],
    isConnected: true,
    connectionStatus: 'connected',
    isPollingMode: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn(),
    reconnect: vi.fn(),
  }),
}));

describe('VisualStatusIndicator', () => {
  const mockProps = {
    status: 'queued',
    progress: { progress_percentage: 0 },
    title: 'Test Article',
    className: '',
  };

  describe('Status Color Coding', () => {
    it('should display blue color for queued status', () => {
      render(<VisualStatusIndicator {...mockProps} status="queued" />);
      const statusBadge = screen.getByTestId('article-status-badge');
      expect(statusBadge).toHaveClass('text-blue-600');
    });

    it('should display orange color for generating status', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const statusBadge = screen.getByTestId('article-status-badge');
      expect(statusBadge).toHaveClass('text-orange-600');
    });

    it('should display green color for completed status', () => {
      render(<VisualStatusIndicator {...mockProps} status="completed" />);
      const statusBadge = screen.getByTestId('article-status-badge');
      expect(statusBadge).toHaveClass('text-green-600');
    });

    it('should display red color for failed status', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" />);
      const statusBadge = screen.getByTestId('article-status-badge');
      expect(statusBadge).toHaveClass('text-red-600');
    });

    it('should display gray color for cancelled status', () => {
      render(<VisualStatusIndicator {...mockProps} status="cancelled" />);
      const statusBadge = screen.getByTestId('article-status-badge');
      expect(statusBadge).toHaveClass('text-gray-600');
    });
  });

  describe('Progress Bar Display', () => {
    it('should show progress bar for generating articles', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" progress={{ progress_percentage: 45 }} />);
      const progressBar = screen.getByTestId('article-progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    });

    it('should not show progress bar for completed articles', () => {
      render(<VisualStatusIndicator {...mockProps} status="completed" />);
      const progressBar = screen.queryByTestId('article-progress-bar');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should display percentage text', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" progress={{ progress_percentage: 75.5 }} />);
      expect(screen.getByText('75.5%')).toBeInTheDocument();
    });
  });

  describe('Completion Animation', () => {
    it('should show celebration animation when completed', () => {
      render(<VisualStatusIndicator {...mockProps} status="completed" />);
      const celebrationElement = screen.getByTestId('completion-celebration').firstChild;
      expect(celebrationElement).toHaveClass('animate-celebration');
    });
  });

  describe('Error State', () => {
    it('should display error message for failed articles', () => {
      const errorMessage = 'Generation failed due to API error';
      render(
        <VisualStatusIndicator 
          {...mockProps} 
          status="failed" 
          progress={{ error_message: errorMessage }} 
        />
      );
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show retry button for failed articles', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" onRetry={vi.fn()} />);
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const statusBadge = screen.getByTestId('article-status-badge');
      expect(statusBadge).toHaveAttribute('aria-label', 'Article status: generating');
    });

    it('should announce status changes to screen readers', () => {
      const { rerender } = render(<VisualStatusIndicator {...mockProps} status="queued" />);
      const statusRegion = screen.getByRole('status');
      
      rerender(<VisualStatusIndicator {...mockProps} status="generating" />);
      expect(statusRegion).toHaveTextContent('Generating');
    });

    it('should have enhanced ARIA labels for retry button', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" onRetry={vi.fn()} title="Test Article" />);
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveAttribute('aria-label', 'Retry failed article: Test Article');
    });

    it('should have progress bar accessibility labels', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" progress={{ progress_percentage: 45 }} />);
      const progressBar = screen.getByTestId('article-progress-bar');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 45.0% complete');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should announce detailed progress information', () => {
      render(<VisualStatusIndicator 
        {...mockProps} 
        status="generating" 
        progress={{ 
          progress_percentage: 75, 
          current_stage: 'Writing content',
          estimated_time_remaining: 300 
        }} 
      />);
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent('75.0% complete');
      expect(statusRegion).toHaveTextContent('Currently Writing content');
      expect(statusRegion).toHaveTextContent('Estimated 5 mins remaining');
    });

    it('should have focus indicators for keyboard navigation', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('focus-within:ring-2', 'focus-within:ring-offset-2');
    });
  });

  describe('Real-time Integration', () => {
    it('should show live connection indicator when connected', () => {
      render(
        <VisualStatusIndicator 
          {...mockProps} 
          status="generating" 
          isRealtime={true}
          connectionStatus="connected"
        />
      );
      const liveIndicator = screen.getByTitle('Live updates');
      expect(liveIndicator).toBeInTheDocument();
      expect(liveIndicator).toHaveClass('bg-green-500', 'animate-pulse');
    });

    it('should show reconnecting indicator when reconnecting', () => {
      render(
        <VisualStatusIndicator 
          {...mockProps} 
          status="generating" 
          isRealtime={true}
          connectionStatus="reconnecting"
        />
      );
      const reconnectingIndicator = screen.getByTitle('Reconnecting...');
      expect(reconnectingIndicator).toBeInTheDocument();
      expect(reconnectingIndicator).toHaveClass('bg-orange-500', 'animate-pulse');
    });

    it('should show disconnected indicator when disconnected', () => {
      render(
        <VisualStatusIndicator 
          {...mockProps} 
          status="generating" 
          isRealtime={true}
          connectionStatus="disconnected"
        />
      );
      const disconnectedIndicator = screen.getByTitle('Disconnected');
      expect(disconnectedIndicator).toBeInTheDocument();
      expect(disconnectedIndicator).toHaveClass('bg-gray-400');
    });

    it('should show live indicator in progress when real-time', () => {
      render(
        <VisualStatusIndicator 
          {...mockProps} 
          status="generating" 
          progress={{ progress_percentage: 45 }}
          isRealtime={true}
          lastUpdated="2024-01-10T12:00:00Z"
        />
      );
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should not show real-time indicators when isRealtime is false', () => {
      render(
        <VisualStatusIndicator 
          {...mockProps} 
          status="generating" 
          isRealtime={false}
        />
      );
      expect(screen.queryByTitle('Live updates')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Reconnecting...')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Disconnected')).not.toBeInTheDocument();
    });
  });

  describe('Colorblind Accessibility', () => {
    it('should apply pattern classes for colorblind accessibility', () => {
      render(<VisualStatusIndicator {...mockProps} status="queued" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('bg-stripes-blue');
    });

    it('should apply dotted pattern for generating status', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('bg-dots-orange');
    });

    it('should apply solid pattern for completed status', () => {
      render(<VisualStatusIndicator {...mockProps} status="completed" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('bg-solid-green');
    });

    it('should apply crossed pattern for failed status', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('bg-crossed-red');
    });

    it('should apply dashed pattern for cancelled status', () => {
      render(<VisualStatusIndicator {...mockProps} status="cancelled" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('bg-dashed-gray');
    });
  });

  describe('Extra Small Screen Support', () => {
    it('should have extra small screen classes', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('xs:p-2', 'xs:text-xs');
    });

    it('should have extra small button classes', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" onRetry={vi.fn()} />);
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveClass('xs:px-2', 'xs:min-h-6');
    });
  });
  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      render(<ResponsiveStatusIndicator {...mockProps} status="generating" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container.parentElement).toHaveClass('responsive-status');
    });

    it('should have responsive padding classes', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('p-3', 'sm:p-4');
    });

    it('should have responsive text sizing', () => {
      render(<VisualStatusIndicator {...mockProps} status="generating" />);
      const container = screen.getByTestId('status-indicator-container');
      expect(container).toHaveClass('text-sm', 'sm:text-base');
    });

    it('should show appropriate button text on mobile vs desktop', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" onRetry={vi.fn()} />);
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveTextContent('Retry');
      expect(retryButton).toHaveTextContent('↻');
      // Check that responsive classes are applied to the button
      expect(retryButton).toHaveClass('text-xs', 'sm:text-sm');
    });

    it('should have minimum touch target sizes', () => {
      render(<VisualStatusIndicator {...mockProps} status="failed" onRetry={vi.fn()} />);
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveClass('min-h-6', 'sm:min-h-7');
    });
  });
});
