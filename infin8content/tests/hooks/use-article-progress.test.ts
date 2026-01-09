/**
 * Tests for useArticleProgress hook
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useArticleProgress } from '@/hooks/use-article-progress';
import { articleProgressRealtime } from '@/lib/supabase/realtime';
import type { ArticleProgress } from '@/types/article';

// Mock the realtime service
vi.mock('@/lib/supabase/realtime', () => ({
  articleProgressRealtime: {
    subscribeToArticleProgress: vi.fn(),
    unsubscribe: vi.fn(),
    isConnectionActive: vi.fn(),
    getConnectionStatus: vi.fn(),
  },
}));

describe('useArticleProgress', () => {
  const mockArticleId = 'article-123';
  const mockProgress: ArticleProgress = {
    id: 'progress-123',
    article_id: mockArticleId,
    org_id: 'org-123',
    status: 'writing',
    current_section: 3,
    total_sections: 8,
    progress_percentage: 37.5,
    current_stage: 'Writing Section 3',
    estimated_time_remaining: 120,
    actual_time_spent: 180,
    word_count: 1250,
    citations_count: 5,
    api_cost: 0.15,
    error_message: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should subscribe to progress updates on mount', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    
    renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    expect(mockSubscribe).toHaveBeenCalledWith(
      mockArticleId,
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should not subscribe without article ID', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    
    renderHook(() => useArticleProgress({ articleId: '' }));

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should update progress when receiving updates', async () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    let onProgressUpdate: (progress: ArticleProgress) => void;
    
    mockSubscribe.mockImplementation((articleId, onProgress) => {
      onProgressUpdate = onProgress;
      return vi.fn(); // Return unsubscribe function
    });

    const { result } = renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    // Initially should have no progress
    expect(result.current.progress).toBeNull();

    // Simulate receiving progress update
    act(() => {
      onProgressUpdate!(mockProgress);
    });

    expect(result.current.progress).toEqual(mockProgress);
  });

  it('should handle connection status changes', async () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    let onConnectionChange: (connected: boolean) => void;
    
    mockSubscribe.mockImplementation((articleId, onProgress, onErr, onConnChange) => {
      onConnectionChange = onConnChange || (() => {});
      return vi.fn();
    });

    const { result } = renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    // Initially should be disconnected
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionStatus).toBe('disconnected');

    // Simulate connection established
    act(() => {
      onConnectionChange!(true);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');

    // Simulate connection lost
    act(() => {
      onConnectionChange!(false);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionStatus).toBe('reconnecting');

    // Advance time to trigger disconnected status
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should handle errors', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    let onError: (error: Error) => void;
    const mockError = new Error('Connection failed');
    
    mockSubscribe.mockImplementation((articleId, onProgress, onErr, onConnChange) => {
      onError = onErr || (() => {});
      return vi.fn();
    });

    const { result } = renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    // Initially should have no error
    expect(result.current.error).toBeNull();

    // Simulate error
    act(() => {
      onError!(mockError);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should call custom callbacks', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    const onProgressUpdate = vi.fn();
    const onError = vi.fn();
    const onConnectionChange = vi.fn();
    
    let progressCallback: (progress: ArticleProgress) => void;
    let errorCallback: (error: Error) => void;
    let connectionCallback: (connected: boolean) => void;
    
    mockSubscribe.mockImplementation((articleId, onProgress, onErr, onConnChange) => {
      progressCallback = onProgress;
      errorCallback = onErr || (() => {});
      connectionCallback = onConnChange || (() => {});
      return vi.fn();
    });

    renderHook(() => useArticleProgress({
      articleId: mockArticleId,
      onProgressUpdate,
      onError,
      onConnectionChange,
    }));

    // Test progress callback
    act(() => {
      progressCallback!(mockProgress);
    });

    expect(onProgressUpdate).toHaveBeenCalledWith(mockProgress);

    // Test error callback
    const mockError = new Error('Test error');
    act(() => {
      errorCallback!(mockError);
    });

    expect(onError).toHaveBeenCalledWith(mockError);

    // Test connection callback
    act(() => {
      connectionCallback!(true);
    });

    expect(onConnectionChange).toHaveBeenCalledWith(true);
  });

  it('should unsubscribe on unmount', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    const mockUnsubscribe = vi.mocked(articleProgressRealtime.unsubscribe);
    const unsubscribeFn = vi.fn();
    
    mockSubscribe.mockReturnValue(unsubscribeFn);

    const { unmount } = renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle reconnection', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    const mockUnsubscribe = vi.mocked(articleProgressRealtime.unsubscribe);
    
    mockSubscribe.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    // Clear previous calls
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();

    // Trigger reconnection
    act(() => {
      result.current.reconnect();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalledWith(
      mockArticleId,
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('should clear reconnect timeout on connection restored', () => {
    const mockSubscribe = vi.mocked(articleProgressRealtime.subscribeToArticleProgress);
    let onConnectionChange: (connected: boolean) => void;
    
    mockSubscribe.mockImplementation((articleId, onProgress, onError, onConnChange) => {
      onConnectionChange = onConnChange || (() => {});
      return vi.fn();
    });

    const { result } = renderHook(() => useArticleProgress({ articleId: mockArticleId }));

    // Lose connection
    act(() => {
      onConnectionChange!(false);
    });

    expect(result.current.connectionStatus).toBe('reconnecting');

    // Restore connection before timeout
    act(() => {
      onConnectionChange!(true);
    });

    expect(result.current.connectionStatus).toBe('connected');

    // Advance time - should not change to disconnected
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.connectionStatus).toBe('connected');
  });
});
