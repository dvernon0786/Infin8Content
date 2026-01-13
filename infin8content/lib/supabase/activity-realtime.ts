/**
 * Supabase realtime subscription handlers for activity feed
 * Story 23.2: Advanced Activity Feed
 */

import { createClient } from './client';
import { progressLogger } from '@/lib/utils/logger';
import type { Activity, ActivityType, ActivityWithUser } from '@/types/activity';

export interface ActivityEvent {
  type: 'activity_created';
  activity: ActivityWithUser;
  timestamp: string;
  orgId: string;
}

export class ActivityRealtime {
  private supabase;
  private subscription: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Subscribe to activity updates for an organization
   */
  subscribeToActivities(
    orgId: string,
    onActivityUpdate: (event: ActivityEvent) => void,
    onError?: (error: Error) => void,
    onConnectionChange?: (connected: boolean) => void,
    activityTypes?: ActivityType[]
  ) {
    // Clean up existing subscription
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    const channelName = `activities_${orgId}`;
    
    // Build filter for activity types if specified
    const typeFilter = activityTypes && activityTypes.length > 0 
      ? `activity_type=in.(${activityTypes.join(',')})` 
      : undefined;

    this.subscription = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `organization_id=eq.${orgId}${typeFilter ? `,${typeFilter}` : ''}`,
        },
        async (payload: any) => {
          progressLogger.log('Activity update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const activity = payload.new as Activity;
            
            // Use fallback user data for now - will be enhanced when schema is updated
            const fallbackUser = {
              id: activity.user_id,
              email: 'User',
              first_name: null
            };
            
            const activityWithUser: ActivityWithUser = {
              ...activity,
              user: fallbackUser
            };

            const event: ActivityEvent = {
              type: 'activity_created',
              activity: activityWithUser,
              timestamp: activity.created_at,
              orgId: activity.organization_id
            };
            
            onActivityUpdate(event);
          }
        }
      )
      .subscribe((status: any) => {
        progressLogger.log('Activity subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          onConnectionChange?.(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.isConnected = false;
          onConnectionChange?.(false);
          this.handleReconnection(orgId, onActivityUpdate, onError, onConnectionChange, activityTypes);
        }
      });

    return this.subscription;
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  private handleReconnection(
    orgId: string,
    onActivityUpdate: (event: ActivityEvent) => void,
    onError?: (error: Error) => void,
    onConnectionChange?: (connected: boolean) => void,
    activityTypes?: ActivityType[]
  ) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // In development, suppress this error as polling fallback handles it
      if (process.env.NODE_ENV === 'development') {
        progressLogger.log(`Max reconnection attempts reached, using polling fallback`);
        onConnectionChange?.(false);
        return;
      }
      
      const error = new Error(`Failed to reconnect activity feed after ${this.maxReconnectAttempts} attempts`);
      onError?.(error);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    progressLogger.log(`Attempting activity feed reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      try {
        this.subscribeToActivities(orgId, onActivityUpdate, onError, onConnectionChange, activityTypes);
      } catch (error) {
        progressLogger.error('Activity feed reconnection failed:', error);
        this.handleReconnection(orgId, onActivityUpdate, onError, onConnectionChange, activityTypes);
      }
    }, delay);
  }

  /**
   * Unsubscribe from activity updates
   */
  unsubscribe() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if currently connected
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnected) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  /**
   * Fetch historical activities with pagination
   */
  async fetchActivities(
    orgId: string,
    options: {
      limit?: number;
      offset?: number;
      activityTypes?: ActivityType[];
      userId?: string;
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<{ activities: ActivityWithUser[]; hasMore: boolean; total: number }> {
    try {
      // Use a direct query approach for now
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      
      // Build a simple query using the Supabase client
      // This will be enhanced once the schema is properly recognized
      const { data, error, count } = await this.supabase
        .from('activities' as any)
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Transform to ActivityWithUser format with fallback user data
      const activities = (data || []).map((activity: any) => ({
        ...activity,
        user: {
          id: activity.user_id,
          email: 'User',
          first_name: null
        }
      })) as ActivityWithUser[];

      const total = count || 0;
      const hasMore = activities.length === limit && (offset + activities.length) < total;

      return {
        activities,
        hasMore,
        total
      };
    } catch (error) {
      progressLogger.error('Failed to fetch activities:', error);
      throw error;
    }
  }

  /**
   * Get available activity types for an organization
   */
  async getActivityTypes(orgId: string): Promise<ActivityType[]> {
    try {
      const { data, error } = await this.supabase
        .from('activities' as any)
        .select('activity_type')
        .eq('organization_id', orgId)
        .not('activity_type', 'is', null);

      if (error) {
        throw error;
      }

      // Get unique activity types
      const types = [...new Set((data || []).map((a: any) => a.activity_type))] as ActivityType[];
      return types.length > 0 ? types : ['article_created', 'article_updated', 'comment_added', 'research_completed', 'user_joined'];
    } catch (error) {
      progressLogger.error('Failed to get activity types:', error);
      // Return default types if query fails
      return ['article_created', 'article_updated', 'comment_added', 'research_completed', 'user_joined'];
    }
  }

  /**
   * Get users who have activities in the organization
   */
  async getActivityUsers(orgId: string): Promise<Array<{ id: string; email: string; first_name: string | null }>> {
    try {
      const { data, error } = await this.supabase
        .from('activities' as any)
        .select('user_id')
        .eq('organization_id', orgId)
        .not('user_id', 'is', null);

      if (error) {
        throw error;
      }

      // Get unique user IDs and create fallback user objects
      const uniqueUserIds = [...new Set((data || []).map((a: any) => a.user_id))];
      return uniqueUserIds.map(userId => ({
        id: userId,
        email: 'User',
        first_name: null
      }));
    } catch (error) {
      progressLogger.error('Failed to get activity users:', error);
      return [];
    }
  }
}

/**
 * Singleton instance for activity realtime
 */
export const activityRealtime = new ActivityRealtime();

/**
 * Hook for subscribing to activities in React components
 */
export function useActivityRealtime() {
  return {
    subscribe: activityRealtime.subscribeToActivities.bind(activityRealtime),
    unsubscribe: activityRealtime.unsubscribe.bind(activityRealtime),
    isConnected: activityRealtime.isConnectionActive.bind(activityRealtime),
    getStatus: activityRealtime.getConnectionStatus.bind(activityRealtime),
    fetchActivities: activityRealtime.fetchActivities.bind(activityRealtime),
    getActivityTypes: activityRealtime.getActivityTypes.bind(activityRealtime),
    getActivityUsers: activityRealtime.getActivityUsers.bind(activityRealtime),
  };
}
