/**
 * Enhanced Real-time Progress Hook
 * Story 22.1: Generation Progress Visualization
 * Task 2: Real-time Progress Updates
 * 
 * Provides real-time updates for enhanced progress visualization including
 * parallel sections, research phase, context management, and performance metrics.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { 
  ParallelSection, 
  PerformanceMetrics, 
  ResearchPhase, 
  ContextManagement 
} from '@/components/dashboard/generation-progress';

export interface EnhancedArticleProgress {
  id: string;
  articleId: string;
  status: 'queued' | 'researching' | 'generating' | 'completed' | 'failed';
  overallProgress: number;
  parallelSections: ParallelSection[];
  performanceMetrics: PerformanceMetrics;
  researchPhase: ResearchPhase;
  contextManagement: ContextManagement;
  estimatedCompletion?: string;
  lastUpdated: string;
}

export interface UseEnhancedProgressProps {
  articleId: string;
  orgId: string;
  onProgressUpdate?: (progress: EnhancedArticleProgress) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
  enableRealtime?: boolean;
}

export function useEnhancedProgress({
  articleId,
  orgId,
  onProgressUpdate,
  onError,
  pollingInterval = 2000, // 2 seconds for more responsive updates
  enableRealtime = true,
}: UseEnhancedProgressProps) {
  const [progress, setProgress] = useState<EnhancedArticleProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isPollingMode, setIsPollingMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transform database progress data to EnhancedArticleProgress format
  const transformProgressData = useCallback((data: any): EnhancedArticleProgress | null => {
    if (!data) return null;

    try {
      // Extract parallel sections
      const parallelSections: ParallelSection[] = (data.parallel_sections || []).map((section: any) => ({
        sectionId: section.sectionId || section.id,
        sectionType: section.sectionType || 'h2',
        status: section.status || 'pending',
        progress: section.progress || 0,
        startTime: section.startTime || new Date().toISOString(),
        estimatedCompletion: section.estimatedCompletion,
        retryCount: section.retryCount || 0,
        wordCount: section.wordCount,
      }));

      // Extract performance metrics
      const performanceMetrics: PerformanceMetrics = {
        researchApiCalls: data.research_api_calls || 0,
        cacheHitRate: data.cache_hit_rate || 0,
        retryAttempts: data.retry_attempts || 0,
        totalApiCalls: (data.research_api_calls || 0) + (data.retry_attempts || 0),
        estimatedTimeRemaining: data.estimated_time_remaining || 0,
        costSavings: data.performance_metrics?.costSavings || 0,
        timeSavings: data.performance_metrics?.timeSavings || 0,
      };

      // Extract research phase
      const researchPhase: ResearchPhase = {
        status: data.research_phase?.status || 'pending',
        apiCallsMade: data.research_api_calls || 0,
        estimatedTotalCalls: data.research_phase?.estimatedTotalCalls || 2,
        cacheHitRate: data.cache_hit_rate || 0,
        keywords: data.research_phase?.keywords || [],
        sourcesFound: data.research_phase?.sourcesFound || 0,
      };

      // Extract context management
      const contextManagement: ContextManagement = {
        tokensUsed: data.context_management?.tokensUsed || 0,
        tokenLimit: data.context_management?.tokenLimit || 2000,
        cacheHits: data.context_management?.cacheHits || 0,
        sectionsSummarized: data.context_management?.sectionsSummarized || 0,
        optimizationRate: data.context_management?.optimizationRate || 0,
      };

      return {
        id: data.id,
        articleId: data.article_id || articleId,
        status: data.status || 'queued',
        overallProgress: data.progress_percentage || 0,
        parallelSections,
        performanceMetrics,
        researchPhase,
        contextManagement,
        estimatedCompletion: data.estimated_completion,
        lastUpdated: data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error transforming progress data:', error);
      return null;
    }
  }, [articleId]);

  // Fetch initial progress data
  const fetchProgress = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('article_progress')
        .select('*')
        .eq('article_id', articleId)
        .single();

      if (error) {
        console.error('Error fetching progress:', error);
        onError?.(error);
        return null;
      }

      const transformed = transformProgressData(data);
      if (transformed) {
        setProgress(transformed);
        setLastUpdate(transformed.lastUpdated);
        onProgressUpdate?.(transformed);
      }

      return transformed;
    } catch (error) {
      console.error('Progress fetch error:', error);
      onError?.(error as Error);
      return null;
    }
  }, [articleId, supabase, transformProgressData, onProgressUpdate, onError]);

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!enableRealtime || subscriptionRef.current) return;

    try {
      const subscription = supabase
        .channel(`article_progress_${articleId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'article_progress',
            filter: `article_id=eq.${articleId}`,
          },
          async (payload) => {
            console.log('Real-time progress update:', payload);
            
            if (payload.new) {
              const transformed = transformProgressData(payload.new);
              if (transformed) {
                setProgress(transformed);
                setLastUpdate(transformed.lastUpdated);
                onProgressUpdate?.(transformed);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionStatus('connected');
            setIsPollingMode(false);
            
            // Clear any existing polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            setConnectionStatus('disconnected');
            setIsPollingMode(true);
            
            // Start polling as fallback
            startPolling();
          }
        });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setIsPollingMode(true);
      startPolling();
    }
  }, [articleId, enableRealtime, supabase, transformProgressData, onProgressUpdate]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setIsPollingMode(true);
    setConnectionStatus('disconnected');

    pollingIntervalRef.current = setInterval(async () => {
      await fetchProgress();
    }, pollingInterval);
  }, [fetchProgress, pollingInterval]);

  // Cleanup functions
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    setConnectionStatus('reconnecting');
    cleanup();
    
    // Delay before reconnecting
    reconnectTimeoutRef.current = setTimeout(() => {
      setupRealtimeSubscription();
    }, 1000);
  }, [cleanup, setupRealtimeSubscription]);

  // Manual refresh
  const refresh = useCallback(async () => {
    return await fetchProgress();
  }, [fetchProgress]);

  // Initialize on mount
  useEffect(() => {
    // Fetch initial data
    fetchProgress();
    
    // Setup real-time subscription
    if (enableRealtime) {
      setupRealtimeSubscription();
    } else {
      startPolling();
    }

    return cleanup;
  }, [fetchProgress, setupRealtimeSubscription, startPolling, cleanup, enableRealtime]);

  // Handle connection issues
  useEffect(() => {
    if (!isConnected && enableRealtime && !isPollingMode) {
      // Try to reconnect after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnect();
      }, 5000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, enableRealtime, isPollingMode, reconnect]);

  return {
    progress,
    isConnected,
    connectionStatus,
    isPollingMode,
    lastUpdate,
    refresh,
    reconnect,
  };
}

// Hook for multiple articles (for dashboard view)
export function useEnhancedProgressDashboard(orgId: string, articleIds: string[]) {
  const [articlesProgress, setArticlesProgress] = useState<Map<string, EnhancedArticleProgress>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  
  const supabase = createClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!orgId || articleIds.length === 0) return;

    try {
      const subscription = supabase
        .channel(`org_progress_${orgId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'article_progress',
            filter: `org_id=eq.${orgId}`,
          },
          async (payload) => {
            if (payload.new) {
              const articleId = payload.new.article_id;
              if (articleIds.includes(articleId)) {
                // Transform and update the specific article progress
                setArticlesProgress(prev => {
                  const updated = new Map(prev);
                  // Note: In a real implementation, you'd use the same transform logic
                  // as useEnhancedProgress here
                  return updated;
                });
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionStatus('connected');
          } else {
            setIsConnected(false);
            setConnectionStatus('disconnected');
          }
        });

      subscriptionRef.current = subscription;

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error setting up dashboard subscription:', error);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [orgId, articleIds, supabase]);

  return {
    articlesProgress,
    isConnected,
    connectionStatus,
  };
}

export default useEnhancedProgress;
