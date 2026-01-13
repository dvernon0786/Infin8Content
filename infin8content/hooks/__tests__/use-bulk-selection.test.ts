/**
 * Tests for bulk selection hook
 * Story 23.1: Multi-article Management Interface
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBulkSelection, useMobileBulkSelection } from '../use-bulk-selection';
import type { DashboardArticle } from '@/lib/types/dashboard.types';

// Mock articles data
const mockArticles: DashboardArticle[] = [
  { 
    id: '1', 
    title: 'Article 1', 
    keyword: 'test 1',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  { 
    id: '2', 
    title: 'Article 2', 
    keyword: 'test 2',
    status: 'generating',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  { 
    id: '3', 
    title: 'Article 3', 
    keyword: 'test 3',
    status: 'failed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  { 
    id: '4', 
    title: 'Article 4', 
    keyword: 'test 4',
    status: 'draft',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  { 
    id: '5', 
    title: 'Article 5', 
    keyword: 'test 5',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('useBulkSelection', () => {
  let onSelectionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelectionChange = vi.fn();
  });

  it('should initialize with no selections', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isPartiallySelected).toBe(false);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('should toggle selection for a single article', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.toggleSelection('1');
    });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('1')).toBe(true);
    expect(result.current.isPartiallySelected).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1']));
  });

  it('should toggle selection off for a selected article', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.toggleSelection('1');
    });

    act(() => {
      result.current.toggleSelection('1');
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('should select all articles', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(5);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isPartiallySelected).toBe(false);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2', '3', '4', '5']));
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.selectAll();
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('should toggle select all', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    // Select all
    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.isAllSelected).toBe(true);

    // Clear all
    act(() => {
      result.current.toggleSelectAll();
    });

    expect(result.current.selectedCount).toBe(0);
  });

  it('should select multiple articles', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.selectMultiple(['1', '3', '5']);
    });

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isSelected('1')).toBe(true);
    expect(result.current.isSelected('3')).toBe(true);
    expect(result.current.isSelected('5')).toBe(true);
    expect(result.current.isSelected('2')).toBe(false);
  });

  it('should get selected articles', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.selectMultiple(['1', '3']);
    });

    const selectedArticles = result.current.getSelectedArticles();
    expect(selectedArticles).toHaveLength(2);
    expect(selectedArticles[0].id).toBe('1');
    expect(selectedArticles[1].id).toBe('3');
  });

  it('should get selected IDs', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
      })
    );

    act(() => {
      result.current.selectMultiple(['1', '3', '5']);
    });

    const selectedIds = result.current.getSelectedIds();
    expect(selectedIds).toEqual(['1', '3', '5']);
  });

  it('should respect max selection limit', () => {
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
        maxSelection: 3,
      })
    );

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('should handle range selection with shift key simulation', () => {
    // Mock shift key behavior by testing the range selection logic
    const { result } = renderHook(() => 
      useBulkSelection({
        articles: mockArticles,
        onSelectionChange,
        enableKeyboardShortcuts: false, // Disable keyboard shortcuts for testing
      })
    );

    // Select first article
    act(() => {
      result.current.toggleSelection('1');
    });

    // Select third article (should select range 1-3)
    act(() => {
      result.current.toggleSelection('3');
    });

    // Note: The actual range selection logic depends on shift key state
    // This test verifies basic toggle functionality
    expect(result.current.selectedCount).toBe(2);
  });

  it('should clean up selections when articles change', () => {
    const { result, rerender } = renderHook(
      ({ articles }) => 
        useBulkSelection({
          articles,
          onSelectionChange,
        }),
      { initialProps: { articles: mockArticles } }
    );

    // Select some articles
    act(() => {
      result.current.selectMultiple(['1', '3']);
    });

    expect(result.current.selectedCount).toBe(2);

    // Change articles list (remove article 3)
    const newArticles = mockArticles.filter(a => a.id !== '3');
    rerender({ articles: newArticles });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('1')).toBe(true);
    expect(result.current.isSelected('3')).toBe(false);
  });
});

describe('useMobileBulkSelection', () => {
  it('should initialize with mobile-specific features', () => {
    const { result } = renderHook(() => 
      useMobileBulkSelection({
        articles: mockArticles,
        onSelectionChange: vi.fn(),
      })
    );

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedCount).toBe(0);
    expect(typeof result.current.enterSelectionMode).toBe('function');
    expect(typeof result.current.exitSelectionMode).toBe('function');
  });

  it('should enter selection mode', () => {
    const { result } = renderHook(() => 
      useMobileBulkSelection({
        articles: mockArticles,
        onSelectionChange: vi.fn(),
      })
    );

    act(() => {
      result.current.enterSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(true);
  });

  it('should exit selection mode and clear selections', () => {
    const { result } = renderHook(() => 
      useMobileBulkSelection({
        articles: mockArticles,
        onSelectionChange: vi.fn(),
      })
    );

    // Enter selection mode and select some articles
    act(() => {
      result.current.enterSelectionMode();
    });

    act(() => {
      result.current.toggleSelection('1');
    });

    expect(result.current.selectedCount).toBe(1);

    // Exit selection mode
    act(() => {
      result.current.exitSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should handle touch events', () => {
    const { result } = renderHook(() => 
      useMobileBulkSelection({
        articles: mockArticles,
        onSelectionChange: vi.fn(),
      })
    );

    const mockTouchEvent = {
      touches: [{ clientX: 100, clientY: 200 }],
      changedTouches: [{ clientX: 100, clientY: 200 }],
    } as any;

    // Test touch start
    act(() => {
      result.current.handleTouchStart(mockTouchEvent);
    });

    // Test touch move (should not trigger selection)
    act(() => {
      result.current.handleTouchMove({
        ...mockTouchEvent,
        touches: [{ clientX: 150, clientY: 250 }],
      });
    });

    // Test touch end with minimal movement (should trigger selection)
    act(() => {
      result.current.handleTouchEnd(mockTouchEvent, '1');
    });

    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('1')).toBe(true);
  });
});
