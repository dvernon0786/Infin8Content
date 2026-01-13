/**
 * Activity Filter Component
 * Story 23.2: Advanced Activity Feed
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Filter,
  X,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import type { ActivityFilterProps, ActivityType } from '@/types/activity';

const activityTypeLabels: Record<ActivityType, string> = {
  article_created: 'Article Created',
  article_updated: 'Article Updated', 
  comment_added: 'Comment Added',
  research_completed: 'Research Completed',
  user_joined: 'User Joined'
};

export const ActivityFilter: React.FC<ActivityFilterProps> = ({
  availableTypes,
  selectedTypes,
  onTypeChange,
  onDateRangeChange,
  onUserFilterChange,
  availableUsers,
  selectedUser,
  dateRange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempSelectedTypes, setTempSelectedTypes] = useState<ActivityType[]>(selectedTypes);
  const [tempSelectedUser, setTempSelectedUser] = useState<string | null>(selectedUser);
  const [tempDateRange, setTempDateRange] = useState<{ start: string; end: string } | null>(dateRange);

  // Sync with props
  useEffect(() => {
    setTempSelectedTypes(selectedTypes);
    setTempSelectedUser(selectedUser);
    setTempDateRange(dateRange);
  }, [selectedTypes, selectedUser, dateRange]);

  const handleTypeToggle = (type: ActivityType) => {
    const newTypes = tempSelectedTypes.includes(type)
      ? tempSelectedTypes.filter(t => t !== type)
      : [...tempSelectedTypes, type];
    
    setTempSelectedTypes(newTypes);
    onTypeChange(newTypes);
  };

  const handleUserChange = (userId: string) => {
    const newUserId = userId === 'all' ? null : userId;
    setTempSelectedUser(newUserId);
    onUserFilterChange(newUserId);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newRange = tempDateRange || { start: '', end: '' };
    const updatedRange = { ...newRange, [field]: value };
    
    // Only update if both dates are provided or both are empty
    if ((updatedRange.start && updatedRange.end) || (!updatedRange.start && !updatedRange.end)) {
      setTempDateRange(updatedRange);
      onDateRangeChange(updatedRange.start && updatedRange.end ? updatedRange : null);
    }
  };

  const clearAllFilters = () => {
    setTempSelectedTypes([]);
    setTempSelectedUser(null);
    setTempDateRange(null);
    onTypeChange([]);
    onUserFilterChange(null);
    onDateRangeChange(null);
  };

  const hasActiveFilters = tempSelectedTypes.length > 0 || tempSelectedUser || tempDateRange;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tempSelectedTypes.length + (tempSelectedUser ? 1 : 0) + (tempDateRange ? 1 : 0)} active
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Activity Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              Activity Types
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map(type => (
                <Badge
                  key={type}
                  variant={tempSelectedTypes.includes(type) ? "default" : "secondary"}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleTypeToggle(type)}
                >
                  {activityTypeLabels[type]}
                </Badge>
              ))}
            </div>
          </div>

          {/* User Filter */}
          {availableUsers.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 flex items-center">
                <User className="h-4 w-4 mr-1" />
                User
              </label>
              <Select value={tempSelectedUser || 'all'} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                placeholder="Start date"
                value={tempDateRange?.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">to</span>
              <Input
                type="date"
                placeholder="End date"
                value={tempDateRange?.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select both start and end dates to filter by date range
            </p>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-2">Active Filters:</div>
              <div className="flex flex-wrap gap-1">
                {tempSelectedTypes.map(type => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {activityTypeLabels[type]}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleTypeToggle(type)}
                    />
                  </Badge>
                ))}
                {tempSelectedUser && (
                  <Badge variant="outline" className="text-xs">
                    User: {availableUsers.find(u => u.id === tempSelectedUser)?.first_name || availableUsers.find(u => u.id === tempSelectedUser)?.email}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleUserChange('all')}
                    />
                  </Badge>
                )}
                {tempDateRange && (
                  <Badge variant="outline" className="text-xs">
                    {tempDateRange.start} to {tempDateRange.end}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        setTempDateRange(null);
                        onDateRangeChange(null);
                      }}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
