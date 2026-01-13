/**
 * Bulk selection hook for articles
 * Provides selection management functionality for dashboard
 */

import { useState, useCallback, useRef } from 'react';
import type { DashboardArticle } from '@/lib/supabase/realtime';

export interface Article {
  id: string;
  title?: string;
  status?: string;
  keyword?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UseBulkSelectionOptions {
  articles: DashboardArticle[];
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enableKeyboardShortcuts?: boolean;
  maxSelection?: number;
}

export interface BulkSelectionState {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  selectedCount: number;
  isAllSelected: boolean;
}

export interface BulkSelectionActions {
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedArticles: () => DashboardArticle[];
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent, articleId: string) => void;
}

export type BulkSelectionHook = BulkSelectionState & BulkSelectionActions;

/**
 * Standard bulk selection hook for desktop
 */
export function useBulkSelection(options: UseBulkSelectionOptions): BulkSelectionHook {
  const { articles, onSelectionChange, enableKeyboardShortcuts = false, maxSelection = Infinity } = options;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const selectedCount = selectedIds.size;
  const isAllSelected = articles.length > 0 && selectedIds.size === articles.length;

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else if (newSet.size < maxSelection) {
        newSet.add(id);
      }
      onSelectionChange?.(newSet);
      return newSet;
    });
  }, [onSelectionChange, maxSelection]);

  const selectAll = useCallback(() => {
    const allIds = new Set(articles.map(article => article.id));
    // Respect maxSelection limit
    if (allIds.size > maxSelection) {
      const limitedIds = Array.from(allIds).slice(0, maxSelection);
      setSelectedIds(new Set(limitedIds));
      onSelectionChange?.(new Set(limitedIds));
    } else {
      setSelectedIds(allIds);
      onSelectionChange?.(allIds);
    }
    setIsSelectionMode(true);
  }, [articles, onSelectionChange, maxSelection]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedArticles = useCallback(() => {
    return articles.filter(article => selectedIds.has(article.id));
  }, [articles, selectedIds]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default to enable smooth touch interactions
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, articleId: string) => {
    const touch = e.changedTouches[0];
    const startPos = touchStartPos.current;
    
    if (startPos) {
      const deltaX = Math.abs(touch.clientX - startPos.x);
      const deltaY = Math.abs(touch.clientY - startPos.y);
      
      // Only toggle selection if it's a tap (not a swipe)
      if (deltaX < 10 && deltaY < 10) {
        toggleSelection(articleId);
      }
      
      touchStartPos.current = null;
    }
  }, [toggleSelection]);

  return {
    selectedIds,
    isSelectionMode,
    selectedCount,
    isAllSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedArticles,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

/**
 * Mobile-optimized bulk selection hook with enhanced touch handling
 */
export function useMobileBulkSelection(options: UseBulkSelectionOptions): BulkSelectionHook {
  const bulkSelection = useBulkSelection(options);
  
  // For mobile, we might want to add additional mobile-specific logic
  // For now, it's the same as the standard hook
  return bulkSelection;
}

/**
 * Bulk operation progress hook for tracking bulk actions
 */
export interface BulkOperationProgress {
  isRunning: boolean;
  total: number;
  completed: number;
  failed: number;
  progress: number;
  startOperation: (total: number) => void;
  completeOperation: () => void;
  resetProgress: () => void;
  updateProgress: (completed: number, failed?: number) => void;
}

export function useBulkOperationProgress(): BulkOperationProgress {
  const [isRunning, setIsRunning] = useState(false);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [failed, setFailed] = useState(0);

  const progress = total > 0 ? (completed / total) * 100 : 0;

  const startOperation = useCallback((totalItems: number) => {
    setIsRunning(true);
    setTotal(totalItems);
    setCompleted(0);
    setFailed(0);
  }, []);

  const completeOperation = useCallback(() => {
    setIsRunning(false);
    setCompleted(total);
  }, [total]);

  const resetProgress = useCallback(() => {
    setIsRunning(false);
    setTotal(0);
    setCompleted(0);
    setFailed(0);
  }, []);

  const updateProgress = useCallback((completedItems: number, failedItems: number = 0) => {
    setCompleted(completedItems);
    setFailed(failedItems);
  }, []);

  return {
    isRunning,
    total,
    completed,
    failed,
    progress,
    startOperation,
    completeOperation,
    resetProgress,
    updateProgress,
  };
}