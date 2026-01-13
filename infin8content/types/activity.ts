/**
 * Activity feed types for real-time team collaboration
 * Story 23.2: Advanced Activity Feed
 */

export type ActivityType = 
  | 'article_created'
  | 'article_updated' 
  | 'comment_added'
  | 'research_completed'
  | 'user_joined';

export interface Activity {
  id: string;
  organization_id: string;
  user_id: string;
  article_id: string | null;
  activity_type: ActivityType;
  activity_data: Record<string, unknown>;
  created_at: string;
}

export interface ActivityWithUser extends Activity {
  user: {
    id: string;
    email: string;
    first_name: string | null;
  };
}

export interface ActivityEvent {
  type: 'activity_created';
  activity: ActivityWithUser;
  timestamp: string;
  orgId: string;
}

export interface UseActivityFeedOptions {
  orgId: string;
  limit?: number;
  activityTypes?: ActivityType[];
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  onActivityUpdate?: (event: ActivityEvent) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseActivityFeedReturn {
  activities: ActivityWithUser[];
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isPollingMode: boolean;
  error: Error | null;
  lastUpdated: string | null;
  refresh: () => void;
  reconnect: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export interface ActivityFeedProps {
  orgId: string;
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  realTime?: boolean;
  onActivityClick?: (activity: ActivityWithUser) => void;
}

export interface ActivityFilterProps {
  availableTypes: ActivityType[];
  selectedTypes: ActivityType[];
  onTypeChange: (types: ActivityType[]) => void;
  onDateRangeChange: (range: { start: string; end: string } | null) => void;
  onUserFilterChange: (userId: string | null) => void;
  availableUsers: Array<{ id: string; email: string; first_name: string | null }>;
  selectedUser: string | null;
  dateRange: { start: string; end: string } | null;
}

export interface ActivityItemProps {
  activity: ActivityWithUser;
  onClick?: (activity: ActivityWithUser) => void;
  compact?: boolean;
}
