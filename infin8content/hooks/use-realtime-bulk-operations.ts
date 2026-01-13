/**
 * Real-time bulk operations hook
 * Story 23.1: Multi-article Management Interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { articleProgressRealtime, type DashboardUpdateEvent } from '@/lib/supabase/realtime';
import { bulkOperationsService } from '@/lib/services/bulk-operations';
import type { BulkOperationResult } from '@/lib/services/bulk-operations';

export interface RealtimeBulkOperationState {
  isRunning: boolean;
  progress: number;
  completed: number;
  failed: number;
  total: number;
  currentOperation?: string;
  errors: Array<{ id: string; error: string; articleId?: string }>;
  lastUpdate?: string;
}

export interface RealtimeBulkOperationActions {
  startOperation: (operation: string, articleIds: string[]) => void;
  updateProgress: (completed: number, failed: number, error?: { id: string; error: string; articleId?: string }) => void;
  completeOperation: () => void;
  resetState: () => void;
}

export function useRealtimeBulkOperations(orgId: string): RealtimeBulkOperationState & RealtimeBulkOperationActions {
  const [state, setState] = useState<RealtimeBulkOperationState>({
    isRunning: false,
    progress: 0,
    completed: 0,
    failed: 0,
    total: 0,
    errors: [],
  });

  const operationRef = useRef<{
    operation: string;
    articleIds: string[];
    startTime: number;
  } | null>(null);

  const subscriptionRef = useRef<any>(null);

  // Handle real-time updates from Supabase
  const handleRealtimeUpdate = useCallback((event: DashboardUpdateEvent) => {
    if (!operationRef.current) return;

    const { operation, articleIds } = operationRef.current;
    
    // Check if this update is related to our current bulk operation
    if (articleIds.includes(event.articleId)) {
      setState(prev => {
        const newCompleted = prev.completed + (event.status === 'completed' ? 1 : 0);
        const newFailed = prev.failed + (event.status === 'failed' ? 1 : 0);
        const newProgress = prev.total > 0 ? ((newCompleted + newFailed) / prev.total) * 100 : 0;

        // Add error if operation failed
        const newErrors = [...prev.errors];
        if (event.status === 'failed' && event.metadata?.error) {
          newErrors.push({
            id: event.articleId,
            error: event.metadata.error as string,
            articleId: event.articleId,
          });
        }

        return {
          ...prev,
          completed: newCompleted,
          failed: newFailed,
          progress: newProgress,
          errors: newErrors,
          lastUpdate: event.timestamp,
        };
      });
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orgId) return;

    // Subscribe to dashboard updates
    subscriptionRef.current = articleProgressRealtime.subscribeToDashboardUpdates(
      orgId,
      handleRealtimeUpdate,
      (error) => {
        console.error('Real-time bulk operation subscription error:', error);
      },
      (connected) => {
        console.log('Bulk operation real-time connection:', connected);
      }
    );

    return () => {
      if (subscriptionRef.current) {
        articleProgressRealtime.unsubscribeFromDashboard();
        subscriptionRef.current = null;
      }
    };
  }, [orgId, handleRealtimeUpdate]);

  // Start a bulk operation
  const startOperation = useCallback((operation: string, articleIds: string[]) => {
    operationRef.current = {
      operation,
      articleIds: [...articleIds],
      startTime: Date.now(),
    };

    setState({
      isRunning: true,
      progress: 0,
      completed: 0,
      failed: 0,
      total: articleIds.length,
      currentOperation: operation,
      errors: [],
      lastUpdate: new Date().toISOString(),
    });
  }, []);

  // Update operation progress
  const updateProgress = useCallback((
    completed: number, 
    failed: number, 
    error?: { id: string; error: string; articleId?: string }
  ) => {
    setState(prev => {
      const newProgress = prev.total > 0 ? ((completed + failed) / prev.total) * 100 : 0;
      const newErrors = error ? [...prev.errors, error] : prev.errors;

      return {
        ...prev,
        completed,
        failed,
        progress: newProgress,
        errors: newErrors,
        lastUpdate: new Date().toISOString(),
      };
    });
  }, []);

  // Complete operation
  const completeOperation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      progress: 100,
      lastUpdate: new Date().toISOString(),
    }));

    // Clear operation reference after a delay
    setTimeout(() => {
      operationRef.current = null;
    }, 2000);
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      isRunning: false,
      progress: 0,
      completed: 0,
      failed: 0,
      total: 0,
      errors: [],
      lastUpdate: undefined,
    });
    operationRef.current = null;
  }, []);

  return {
    ...state,
    startOperation,
    updateProgress,
    completeOperation,
    resetState,
  };
}

/**
 * Enhanced bulk operations hook with real-time updates
 */
export function useEnhancedBulkOperations(orgId: string) {
  const realtimeState = useRealtimeBulkOperations(orgId);
  const [operationHistory, setOperationHistory] = useState<Array<{
    id: string;
    operation: string;
    articleCount: number;
    completed: number;
    failed: number;
    duration: number;
    timestamp: string;
  }>>([]);

  // Execute bulk operation with real-time tracking
  const executeBulkOperation = useCallback(async (
    operation: string,
    articleIds: string[],
    operationFn: () => Promise<BulkOperationResult>
  ): Promise<BulkOperationResult> => {
    const startTime = Date.now();
    const operationId = `${operation}-${Date.now()}`;
    
    // Start real-time tracking
    realtimeState.startOperation(operation, articleIds);

    try {
      const result = await operationFn();
      
      // Complete real-time tracking
      realtimeState.completeOperation();
      
      // Add to history
      const duration = Date.now() - startTime;
      setOperationHistory(prev => [
        {
          id: operationId,
          operation,
          articleCount: articleIds.length,
          completed: result.processed,
          failed: articleIds.length - result.processed,
          duration,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 9), // Keep last 10 operations
      ]);

      return result;
    } catch (error) {
      // Handle operation failure
      realtimeState.completeOperation();
      
      const duration = Date.now() - startTime;
      setOperationHistory(prev => [
        {
          id: operationId,
          operation,
          articleCount: articleIds.length,
          completed: 0,
          failed: articleIds.length,
          duration,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);

      throw error;
    }
  }, [realtimeState]);

  // Clear operation history
  const clearHistory = useCallback(() => {
    setOperationHistory([]);
  }, []);

  return {
    ...realtimeState,
    operationHistory,
    executeBulkOperation,
    clearHistory,
  };
}

/**
 * Hook for bulk operation notifications
 */
export function useBulkOperationNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    autoHide?: boolean;
  }>>([]);

  const addNotification = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    autoHide: boolean = true
  ) => {
    const id = `notification-${Date.now()}`;
    const notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      autoHide,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 notifications

    // Auto-hide notification after 5 seconds
    if (autoHide) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}
