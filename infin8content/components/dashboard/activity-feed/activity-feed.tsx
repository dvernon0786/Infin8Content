/**
 * Activity Feed Component
 * Story 23.2: Advanced Activity Feed
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { useActivityFeed } from '@/hooks/use-activity-feed';
import { activityRealtime } from '@/lib/supabase/activity-realtime';
import { getActivityComponent } from './activity-items';
import { ActivityFilter } from './activity-filter';
import type { ActivityFeedProps, ActivityWithUser, ActivityType } from '@/types/activity';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  orgId,
  className,
  maxItems = 50,
  showFilters = false,
  realTime = true,
  onActivityClick,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [availableTypes, setAvailableTypes] = useState<ActivityType[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; email: string; first_name: string | null }>>([]);
  
  // Fetch available types and users
  useEffect(() => {
    if (orgId) {
      activityRealtime.getActivityTypes(orgId).then(setAvailableTypes).catch(console.error);
      activityRealtime.getActivityUsers(orgId).then(setAvailableUsers).catch(console.error);
    }
  }, [orgId]);
  
  const {
    activities,
    isConnected,
    connectionStatus,
    isPollingMode,
    error,
    lastUpdated,
    refresh,
    reconnect,
    loadMore,
    hasMore,
    isLoading,
  } = useActivityFeed({
    orgId,
    limit: maxItems,
    activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    userId: selectedUser || undefined,
    dateRange: dateRange || undefined,
    onActivityUpdate: (event) => {
      console.log('Activity update received:', event);
    },
    onError: (error) => {
      console.error('Activity feed error:', error);
    },
    onConnectionChange: (connected) => {
      console.log('Activity feed connection changed:', connected);
    },
  });

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);

  const displayedActivities = expanded ? activities : activities.slice(0, 10);

  return (
    <div className={className}>
      {/* Filter Component */}
      {showFilters && (
        <ActivityFilter
          availableTypes={availableTypes}
          selectedTypes={selectedTypes}
          onTypeChange={setSelectedTypes}
          onDateRangeChange={setDateRange}
          onUserFilterChange={setSelectedUser}
          availableUsers={availableUsers}
          selectedUser={selectedUser}
          dateRange={dateRange}
        />
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Activity Feed</CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {connectionStatus}
                  {isPollingMode && ' (polling)'}
                </span>
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
              <span className="text-sm text-red-600 dark:text-red-400">
                Connection error: {error.message}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
              >
                Reconnect
              </Button>
            </div>
          )}
          
          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}
        </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Clock className="h-8 w-8 mb-2" />
              <span className="text-sm">No recent activity</span>
            </div>
          ) : (
            <div className="space-y-0">
              {displayedActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  {getActivityComponent(activity, onActivityClick)}
                  {index < displayedActivities.length - 1 && (
                    <Separator />
                  )}
                </React.Fragment>
              ))}
              
              {/* Load More Button */}
              {hasMore && activities.length > 10 && (
                <div className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expanded ? handleLoadMore : () => setExpanded(true)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : expanded ? (
                      'Load More'
                    ) : (
                      'Show More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};
