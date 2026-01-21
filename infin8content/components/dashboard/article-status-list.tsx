/**
 * Dashboard article status list component with real-time updates and search/filtering
 * Story 15.1: Real-time Article Status Display
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeArticles } from '../../hooks/use-realtime-articles';
import { useDashboardFilters } from '../../hooks/use-dashboard-filters';
import { useArticleNavigation } from '../../hooks/use-article-navigation';
import { useBulkSelection, useMobileBulkSelection } from '../../hooks/use-bulk-selection';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Checkbox } from '../../components/ui/checkbox';
import { BulkActionsBar } from './bulk-actions-bar';
import { MobileBulkActions } from './mobile-bulk-actions';
import { VisualStatusIndicator } from '../../components/articles/visual-status-indicator';
import { SearchInput } from './search-input';
import { FilterDropdown, QuickFilters } from './filter-dropdown';
import { SortDropdown } from './sort-dropdown';
import { ActiveFilters } from './active-filters';
import { FilterSummary } from './active-filters';
import { getStatusConfig, statusConfigs } from '../../lib/constants/status-configs';
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
  Eye,
  Filter,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { DashboardErrorBoundary, useErrorHandler } from './error-boundary';
import type { DashboardArticle, DashboardUpdateEvent } from '../../lib/supabase/realtime';
import type { ArticleStatus } from '../../lib/types/dashboard.types';

interface ArticleStatusListProps {
  orgId: string;
  maxItems?: number;
  showCompleted?: boolean;
  showProgress?: boolean;
  className?: string;
  enableSearchFilter?: boolean;
  enableBulkSelection?: boolean;
  onDelete?: (articleIds: string[]) => Promise<void>;
  onExport?: (articleIds: string[], format: 'csv' | 'pdf') => Promise<void>;
  onArchive?: (articleIds: string[]) => Promise<void>;
  onChangeStatus?: (articleIds: string[], status: string) => Promise<void>;
  onAssignToTeam?: (articleIds: string[], teamMemberId: string) => Promise<void>;
  teamMembers?: Array<{ id: string; name: string; email: string }>;
}


export function ArticleStatusList({
  orgId,
  maxItems = 20,
  showCompleted = true,
  showProgress = true,
  className = '',
  enableSearchFilter = true,
  enableBulkSelection = true,
  onDelete,
  onExport,
  onArchive,
  onChangeStatus,
  onAssignToTeam,
  teamMembers = [],
}: ArticleStatusListProps) {
  const router = useRouter();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { handleError, createFallback } = useErrorHandler();
  
  // Use shared navigation hook
  const navigation = useArticleNavigation({
    onError: (error, context) => handleError(error, context),
    onSuccess: (articleId) => {
      console.log(`Successfully navigated to article: ${articleId}`);
    },
  });

  // Get real-time articles
  const {
    articles: rawArticles,
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

  // Apply search and filter functionality
  const filters = enableSearchFilter ? useDashboardFilters(rawArticles) : null;
  const filteredArticles = filters ? filters.filteredArticles : rawArticles;
  const availableStatuses = useMemo(() => {
    const statuses = new Set(rawArticles.map(article => article.status));
    return Array.from(statuses).sort() as ArticleStatus[];
  }, [rawArticles]);

  // Bulk selection hook (initialized after filteredArticles is available)
  const bulkSelection = enableBulkSelection 
    ? useMobileBulkSelection({
        articles: filteredArticles,
        onSelectionChange: (selectedIds) => {
          console.log('Selection changed:', selectedIds.size, 'articles selected');
        },
        enableKeyboardShortcuts: true,
        maxSelection: 100,
      })
    : null;

  // Apply maxItems limit to filtered results
  const displayArticles = useMemo(() => {
    let articles = filteredArticles;
    
    if (!showCompleted) {
      articles = articles.filter(article => article.status !== 'completed');
    }
    
    return articles.slice(0, maxItems);
  }, [filteredArticles, showCompleted, maxItems]);

  // Navigation handler using shared hook
  const handleArticleNavigation = (articleId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent card selection when clicking title
    }
    navigation.navigateToArticle(articleId);
  };

  // Keyboard navigation handler using shared hook
  const handleKeyDown = (articleId: string, e: React.KeyboardEvent) => {
    navigation.handleKeyDown(articleId, e);
  };

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

  // Get status configuration
  const getStatusConfig = (status: string) => {
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
              {/* Select all checkbox */}
              {bulkSelection && filteredArticles.length > 0 && (
                <div className="mr-2">
                  <Checkbox
                    checked={bulkSelection.isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        bulkSelection.selectAll();
                      } else {
                        bulkSelection.clearSelection();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              
              <FileText className="h-5 w-5" />
              Article Status
              <Badge variant="outline" className="text-xs">
                {displayArticles.length}
              </Badge>
              
              {/* Selection indicator */}
              {bulkSelection && bulkSelection.selectedCount > 0 && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {bulkSelection.selectedCount} selected
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {getConnectionIndicator()}
              
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={connectionStatus === 'reconnecting'}
                className="font-lato text-neutral-600 hover:text-[--brand-electric-blue] flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {connectionStatus === 'disconnected' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="font-lato text-neutral-600 hover:text-[--brand-electric-blue] flex items-center gap-2"
                >
                  <Wifi className="h-4 w-4" />
                  Reconnect
                </Button>
              )}
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          {enableSearchFilter && filters && (
            <div className="space-y-3 pt-3 border-t">
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <SearchInput
                    value={filters.search.query}
                    onChange={filters.setSearchQuery}
                    onClear={filters.clearSearch}
                    isLoading={filters.search.isSearching}
                    placeholder="Search articles..."
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <FilterDropdown
                    value={filters.filters}
                    onChange={filters.setFilters}
                    availableStatuses={availableStatuses}
                  />
                  
                  <SortDropdown
                    value={filters.filters.sortBy}
                    onChange={(sortBy) => filters.setFilters({ sortBy })}
                  />
                </div>
              </div>
              
              {/* Quick Filters */}
              <QuickFilters
                onFilterChange={filters.setFilters}
                disabled={false}
                selectedCount={bulkSelection?.selectedCount || 0}
                onClearSelection={bulkSelection ? () => bulkSelection.clearSelection() : undefined}
              />
              
              {/* Active Filters */}
              <ActiveFilters
                filters={filters.filters}
                search={filters.search}
                onClearFilter={filters.removeFilter}
                onClearAll={filters.clearAll}
              />
              
              {/* Filter Summary */}
              <FilterSummary
                filters={filters.filters}
                search={filters.search}
                totalArticles={rawArticles.length}
                filteredArticles={filteredArticles.length}
              />
            </div>
          )}
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

      {/* Bulk Actions Bar */}
      {bulkSelection && bulkSelection.selectedCount > 0 && (
        <>
          {/* Desktop Bulk Actions */}
          <div className="hidden md:block">
            <BulkActionsBar
              selectedArticles={bulkSelection.getSelectedArticles()}
              onClearSelection={() => bulkSelection.clearSelection()}
              onDelete={onDelete}
              onExport={onExport}
              onArchive={onArchive}
              onChangeStatus={onChangeStatus}
              onAssignToTeam={onAssignToTeam}
              teamMembers={teamMembers}
              className="mb-4"
            />
          </div>
          
          {/* Mobile Bulk Actions */}
          <div className="md:hidden">
            <MobileBulkActions
              selectedArticles={bulkSelection.getSelectedArticles()}
              onClearSelection={() => bulkSelection.clearSelection()}
              onDelete={onDelete}
              onExport={onExport}
              onArchive={onArchive}
              onChangeStatus={onChangeStatus}
              onAssignToTeam={onAssignToTeam}
              teamMembers={teamMembers}
            />
          </div>
        </>
      )}

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
            const isBulkSelected = bulkSelection?.isSelected(article.id) || false;
            
            return (
              <Card 
                key={article.id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${
                  isBulkSelected ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() => {
                  if (bulkSelection && bulkSelection.isSelectionMode) {
                    bulkSelection.toggleSelection(article.id);
                  } else {
                    setSelectedArticle(isSelected ? null : article.id);
                  }
                }}
                onTouchStart={(e) => {
                  if (bulkSelection) {
                    bulkSelection.handleTouchStart(e);
                  }
                }}
                onTouchMove={(e) => {
                  if (bulkSelection) {
                    bulkSelection.handleTouchMove(e);
                  }
                }}
                onTouchEnd={(e) => {
                  if (bulkSelection) {
                    bulkSelection.handleTouchEnd(e, article.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    {/* Bulk selection checkbox */}
                    {bulkSelection && (
                      <div className="mr-3 mt-1">
                        <Checkbox
                          checked={isBulkSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              bulkSelection.toggleSelection(article.id);
                            } else {
                              bulkSelection.toggleSelection(article.id);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 
                        ref={(el) => {
                          if (el && article.status === 'completed') {
                            navigation.registerElement(article.id, el);
                          }
                        }}
                        className={`
                          font-medium text-gray-900 truncate 
                          ${article.status === 'completed' 
                            ? 'cursor-pointer hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded' 
                            : ''
                          }
                          ${navigation.isNavigating ? 'opacity-50' : ''}
                        `}
                        title={article.status === 'completed' ? 'Click to view completed article' : undefined}
                        role={article.status === 'completed' ? 'button' : undefined}
                        tabIndex={article.status === 'completed' ? 0 : undefined}
                        aria-label={article.status === 'completed' 
                          ? `completed article: ${article.title || article.keyword}, click to view` 
                          : undefined
                        }
                        aria-busy={navigation.isNavigating}
                        onClick={(e) => {
                          if (article.status === 'completed') {
                            handleArticleNavigation(article.id, e);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (article.status === 'completed') {
                            handleKeyDown(article.id, e);
                          }
                        }}
                        onTouchStart={(e) => {
                          if (article.status === 'completed') {
                            navigation.handleTouchStart(article.id, e, e.currentTarget);
                          }
                        }}
                        onTouchMove={(e) => {
                          if (article.status === 'completed') {
                            navigation.handleTouchMove(article.id, e, e.currentTarget);
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (article.status === 'completed') {
                            navigation.handleTouchEnd(article.id, e, e.currentTarget);
                          }
                        }}
                      >
                        {article.title || article.keyword}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {article.keyword}
                      </p>
                    </div>
                    
                    {/* Enhanced Visual Status Indicator */}
                    <VisualStatusIndicator
                      status={article.status}
                      progress={article.progress}
                      title={article.title || article.keyword}
                      compact={true}
                      isRealtime={true}
                      connectionStatus={connectionStatus}
                      lastUpdated={lastUpdated}
                      onRetry={() => {
                        // Handle retry logic for failed articles
                        console.log('Retry article:', article.id);
                      }}
                    />
                  </div>
                  
                  {/* Progress bar for active articles - using VisualStatusIndicator for detailed view */}
                  {showProgress && article.status === 'generating' && article.progress && (
                    <div className="mb-3">
                      <VisualStatusIndicator
                        status={article.status}
                        progress={article.progress}
                        title={article.title || article.keyword}
                        compact={false}
                        isRealtime={true}
                        connectionStatus={connectionStatus}
                        lastUpdated={lastUpdated}
                        onAnimationComplete={() => {
                          console.log(`Article "${article.title}" completed!`);
                        }}
                      />
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
                        className="flex items-center gap-1 font-lato text-neutral-600 hover:text-[--brand-electric-blue]"
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
      {filteredArticles.length >= maxItems && rawArticles.length > maxItems && (
        <div className="text-center">
          <Button variant="outline" onClick={() => {}} className="font-lato text-neutral-600 hover:text-[--brand-electric-blue]">
            Load more articles
          </Button>
        </div>
      )}
    </div>
  </DashboardErrorBoundary>
);
}
