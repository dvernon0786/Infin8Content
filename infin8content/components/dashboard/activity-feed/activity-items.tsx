/**
 * Activity Item Components
 * Story 23.2: Advanced Activity Feed
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  MessageSquare, 
  Search, 
  UserPlus,
  ExternalLink,
  Eye
} from 'lucide-react';
import type { ActivityWithUser } from '@/types/activity';

interface BaseActivityItemProps {
  activity: ActivityWithUser;
  onClick?: (activity: ActivityWithUser) => void;
}

const BaseActivity: React.FC<BaseActivityItemProps> = ({ activity, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(activity);
  };

  const userName = activity.user.first_name || activity.user.email;

  return (
    <div 
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.activity_type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {getActivityDescription(activity)}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeAgo(activity.created_at)}
          </span>
          
          <Badge variant="secondary" className="text-xs">
            {activity.activity_type.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'article_created':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'article_updated':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'research_completed':
      return <Search className="h-4 w-4 text-orange-500" />;
    case 'user_joined':
      return <UserPlus className="h-4 w-4 text-indigo-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMs = now.getTime() - activityTime.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return activityTime.toLocaleDateString();
  }
};

const getActivityDescription = (activity: ActivityWithUser) => {
  const userName = activity.user.first_name || activity.user.email;
  const activityData = activity.activity_data as any;

  switch (activity.activity_type) {
    case 'article_created':
      return (
        <span>
          <strong>{userName}</strong> created article "{activityData?.title || activityData?.keyword || 'Untitled'}"
        </span>
      );
    case 'article_updated':
      return (
        <span>
          <strong>{userName}</strong> updated article "{activityData?.title || activityData?.keyword || 'Untitled'}"
        </span>
      );
    case 'comment_added':
      return (
        <span>
          <strong>{userName}</strong> added a comment
        </span>
      );
    case 'research_completed':
      return (
        <span>
          <strong>{userName}</strong> completed research for "{activityData?.keyword || 'Untitled'}"
        </span>
      );
    case 'user_joined':
      return (
        <span>
          <strong>{userName}</strong> joined the team
        </span>
      );
    default:
      return (
        <span>
          <strong>{userName}</strong> performed an action
        </span>
      );
  }
};

// Article Created Activity
export const ArticleCreatedActivity: React.FC<BaseActivityItemProps> = ({ activity, onClick }) => {
  const activityData = activity.activity_data as any;
  const userName = activity.user.first_name || activity.user.email;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(activity);
  };

  return (
    <div 
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border-l-4 border-green-500"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        <FileText className="h-5 w-5 text-green-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            <strong>{userName}</strong> created article 
            <span className="font-medium text-green-600 dark:text-green-400 ml-1">
              "{activityData?.title || activityData?.keyword || 'Untitled'}"
            </span>
          </div>
          
          {activity.article_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to article
                window.location.href = `/articles/${activity.article_id}`;
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {activityData?.keyword && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Keyword: {activityData.keyword}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </span>
          
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Article Created
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Article Updated Activity
export const ArticleUpdatedActivity: React.FC<BaseActivityItemProps> = ({ activity, onClick }) => {
  const activityData = activity.activity_data as any;
  const userName = activity.user.first_name || activity.user.email;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(activity);
  };

  return (
    <div 
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border-l-4 border-blue-500"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        <FileText className="h-5 w-5 text-blue-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-900 dark:text-gray-100">
            <strong>{userName}</strong> updated article 
            <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">
              "{activityData?.title || activityData?.keyword || 'Untitled'}"
            </span>
          </div>
          
          {activity.article_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to article
                window.location.href = `/articles/${activity.article_id}`;
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {activityData?.oldStatus && activityData?.newStatus && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Status changed: {activityData.oldStatus} → {activityData.newStatus}
          </div>
        )}
        
        {activityData?.change_reason && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Reason: {activityData.change_reason}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </span>
          
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Article Updated
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Comment Added Activity
export const CommentAddedActivity: React.FC<BaseActivityItemProps> = ({ activity, onClick }) => {
  const activityData = activity.activity_data as any;
  const userName = activity.user.first_name || activity.user.email;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(activity);
  };

  return (
    <div 
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border-l-4 border-purple-500"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        <MessageSquare className="h-5 w-5 text-purple-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <strong>{userName}</strong> added a comment
          {activityData?.article_title && (
            <span className="text-purple-600 dark:text-purple-400 ml-1">
              on "{activityData.article_title}"
            </span>
          )}
        </div>
        
        {activityData?.comment_preview && (
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
            "{activityData.comment_preview}"
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </span>
          
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Comment Added
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Research Completed Activity
export const ResearchCompletedActivity: React.FC<BaseActivityItemProps> = ({ activity, onClick }) => {
  const activityData = activity.activity_data as any;
  const userName = activity.user.first_name || activity.user.email;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(activity);
  };

  return (
    <div 
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border-l-4 border-orange-500"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        <Search className="h-5 w-5 text-orange-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <strong>{userName}</strong> completed research for 
          <span className="font-medium text-orange-600 dark:text-orange-400 ml-1">
            "{activityData?.keyword || 'Untitled'}"
          </span>
        </div>
        
        {activityData?.sources_found && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Found {activityData.sources_found} sources
          </div>
        )}
        
        {activityData?.research_time && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Research time: {activityData.research_time}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </span>
          
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Research Completed
          </Badge>
        </div>
      </div>
    </div>
  );
};

// User Joined Activity
export const UserJoinedActivity: React.FC<BaseActivityItemProps> = ({ activity, onClick }) => {
  const activityData = activity.activity_data as any;
  const userName = activity.user.first_name || activity.user.email;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(activity);
  };

  return (
    <div 
      className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors border-l-4 border-indigo-500"
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        <UserPlus className="h-5 w-5 text-indigo-500" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <strong>{userName}</strong> joined the team
        </div>
        
        {activityData?.role && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Role: {activityData.role}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </span>
          
          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            User Joined
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Activity factory function
export const getActivityComponent = (activity: ActivityWithUser, onClick?: (activity: ActivityWithUser) => void) => {
  switch (activity.activity_type) {
    case 'article_created':
      return <ArticleCreatedActivity activity={activity} onClick={onClick} />;
    case 'article_updated':
      return <ArticleUpdatedActivity activity={activity} onClick={onClick} />;
    case 'comment_added':
      return <CommentAddedActivity activity={activity} onClick={onClick} />;
    case 'research_completed':
      return <ResearchCompletedActivity activity={activity} onClick={onClick} />;
    case 'user_joined':
      return <UserJoinedActivity activity={activity} onClick={onClick} />;
    default:
      return <BaseActivity activity={activity} onClick={onClick} />;
  }
};
