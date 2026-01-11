/**
 * Dashboard article status list component with real-time updates
 * Story 15.1: Real-time Article Status Display
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRealtimeArticles } from '@/hooks/use-realtime-articles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  FileText,
  TrendingUp,
  Eye
} from 'lucide-react';
import { DashboardErrorBoundary, useErrorHandler } from './error-boundary';
import type { DashboardArticle, DashboardUpdateEvent } from '@/lib/supabase/realtime';

interface ArticleStatusListProps {
  orgId: string;
  maxItems?: number;
  showCompleted?: boolean;
  showProgress?: boolean;
  className?: string;
}

interface StatusConfig {
  color: string;
  icon: React.ReactNode;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

const statusConfigs: Record<string, StatusConfig> = {
  queued: {
    color: 'text-blue-600',
    icon: <Clock className="h-4 w-4" />,
    label: 'Queued',
    variant: 'secondary',
  },
  generating: {
    color: 'text-orange-600',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: 'Generating',
    variant: 'default',
  },
  completed: {
    color: 'text-green-600',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Completed',
    variant: 'outline',
  },
  failed: {
    color: 'text-red-600',
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Failed',
    variant: 'destructive',
  },
  cancelled: {
    color: 'text-gray-600',
    icon: <AlertCircle className="h-4 w-4" />,
    label: 'Cancelled',
    variant: 'secondary',
  },
};

export function ArticleStatusList({
  orgId,
  maxItems = 20,
  showCompleted = true,
  showProgress = true,
  className = '',
}: ArticleStatusListProps) {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { handleError, createFallback } = useErrorHandler();

  const {
    articles,
    isConnected,
    connectionStatus,
    isPollingMode,
    error,
    lastUpdated,
    refresh,
    reconnect,
  } = useRealtimeArticles({
    orgId,
    onDashboardUpdate: handleDashboardUpdate,
    onError: (err) => handleError(err, 'useRealtimeArticles'),
    onConnectionChange: (connected) => {
      console.log('Dashboard connection changed:', connected);
    },
    pollingInterval: 5000,
    enablePolling: true,
  });

  function handleDashboardUpdate(event: DashboardUpdateEvent) {
    try {
      console.log('Dashboard update received:', event);
      setLastUpdate(event.timestamp);
      
      // Show a brief notification for completed articles
      if (event.type === 'article_completed') {
        // Could integrate with a toast notification system here
        console.log(`Article "${event.metadata?.title}" completed!`);
      }
    } catch (err) {
      handleError(err as Error, 'handleDashboardUpdate');
    }
  }

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    console.log('🎯 Dashboard component rendering with', articles.length, 'articles');
    console.log('📝 Articles:', articles.map(a => ({ id: a.id, status: a.status, title: a.title })));
    
    let filtered = articles;
    
    if (!showCompleted) {
      filtered = filtered.filter(article => article.status !== 'completed');
    }
    
    // Sort by updated_at desc, then by status priority
    const statusPriority = {
      generating: 0,
      queued: 1,
      failed: 2,
      completed: 3,
      cancelled: 4,
    };
    
    return filtered
      .sort((a, b) => {
        const priorityDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                           statusPriority[b.status as keyof typeof statusPriority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Same priority, sort by update time
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, maxItems);
  }, [articles, showCompleted, maxItems]);

  // Get status configuration
  const getStatusConfig = (status: string): StatusConfig => {
    return statusConfigs[status] || statusConfigs.queued;
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get connection status indicator
  const getConnectionIndicator = () => {
    if (isPollingMode) {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">Polling mode</span>
        </div>
      );
    }
    
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="h-4 w-4" />
          <span className="text-sm">Live</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-red-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Disconnected</span>
      </div>
    );
  };

  return (
    <DashboardErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ArticleStatusList error:', error, errorInfo);
        // In production, send to error reporting service
      }}
    >
      <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Article Status
              <Badge variant="outline" className="text-xs">
                {filteredArticles.length}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {getConnectionIndicator()}
              
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={connectionStatus === 'reconnecting'}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {connectionStatus === 'disconnected' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="flex items-center gap-2"
                >
                  <Wifi className="h-4 w-4" />
                  Reconnect
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {error && (
          <CardContent className="pt-0">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    {error.message}
                    {isPollingMode && ' Using polling fallback.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        )}
        
        {lastUpdated && (
          <CardContent className="pt-0">
            <div className="text-xs text-gray-500">
              Last update: {formatTimeAgo(lastUpdated)}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Articles list */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500">
                {showCompleted 
                  ? "No articles have been created yet."
                  : "No active articles. All articles are completed."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article) => {
            const statusConfig = getStatusConfig(article.status);
            const isSelected = selectedArticle === article.id;
            
            return (
              <Card 
                key={article.id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedArticle(isSelected ? null : article.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {article.title || article.keyword}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {article.keyword}
                      </p>
                    </div>
                    
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  {/* Progress bar for active articles */}
                  {showProgress && article.progress && article.status === 'generating' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{article.progress.current_stage}</span>
                        <span className="text-gray-500">
                          {article.progress.progress_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={article.progress.progress_percentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>
                          Section {article.progress.current_section} of {article.progress.total_sections}
                        </span>
                        <span>{article.progress.word_count} words</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Article metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>Created {formatTimeAgo(article.created_at)}</span>
                      <span>Updated {formatTimeAgo(article.updated_at)}</span>
                    </div>
                    
                    {article.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to article or show details
                          console.log('View article:', article.id);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    )}
                  </div>
                  
                  {/* Error display */}
                  {article.status === 'failed' && article.progress?.error_message && (
                    <Card className="border-red-200 bg-red-50 mt-3">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="text-sm text-red-800">
                            {article.progress.error_message}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Expanded details */}
                  {isSelected && article.progress && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Progress:</span>
                          <div className="text-gray-600">
                            {article.progress.progress_percentage.toFixed(1)}% complete
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Sections:</span>
                          <div className="text-gray-600">
                            {article.progress.current_section} / {article.progress.total_sections}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Word Count:</span>
                          <div className="text-gray-600">{article.progress.word_count}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Citations:</span>
                          <div className="text-gray-600">{article.progress.citations_count}</div>
                        </div>
                        {article.progress.estimated_time_remaining && (
                          <div>
                            <span className="font-medium text-gray-700">Est. Time:</span>
                            <div className="text-gray-600">
                              {Math.ceil(article.progress.estimated_time_remaining / 60)} min
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">API Cost:</span>
                          <div className="text-gray-600">${article.progress.api_cost.toFixed(4)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Load more indicator */}
      {filteredArticles.length >= maxItems && articles.length > maxItems && (
        <div className="text-center">
          <Button variant="outline" onClick={() => {}}>
            Load more articles
          </Button>
        </div>
      )}
    </div>
  </DashboardErrorBoundary>
);
}
