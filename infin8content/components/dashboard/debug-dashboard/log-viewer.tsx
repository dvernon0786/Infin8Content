/**
 * Debug Log Viewer Component
 * Displays error logs with filtering, search, and pagination
 * Extends existing performance dashboard patterns
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  Bug, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Trash2
} from 'lucide-react';
import { logger } from '@/lib/logging';

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  component_path?: string;
  created_at: string;
  metadata?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  stack_trace?: string;
}

interface LogViewerProps {
  orgId: string;
  refreshInterval?: number;
  className?: string;
}

export function LogViewer({ orgId, refreshInterval = 30000, className = '' }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: '' as 'debug' | 'info' | 'warn' | 'error' | '',
    component: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const levelColors = {
    debug: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
    warn: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  const levelIcons = {
    debug: Bug,
    info: Info,
    warn: AlertTriangle,
    error: AlertTriangle
  };

  const fetchLogs = useCallback(async (resetPagination = false) => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: resetPagination ? '0' : pagination.offset.toString()
      });

      if (filters.level) params.append('level', filters.level);
      if (filters.component) params.append('component', filters.component);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/debug/logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      
      if (resetPagination) {
        setLogs(data.logs);
        setPagination({
          ...pagination,
          offset: 0,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        });
      } else {
        setLogs(data.logs);
        setPagination({
          ...pagination,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('Failed to fetch debug logs', { error: err instanceof Error ? err.message : 'Unknown error' }, { componentPath: 'LogViewer' });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleSearch = () => {
    fetchLogs(true);
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all filtered logs? This action cannot be undone.')) {
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.component) params.append('component', filters.component);

      const response = await fetch(`/api/admin/debug/logs?${params}`, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error('Failed to clear logs');
      }
      
      await fetchLogs(true);
      logger.info('Debug logs cleared', { filters });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  useEffect(() => {
    fetchLogs(true);
  }, [filters.level, filters.component, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchLogs();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchLogs]);

  useEffect(() => {
    if (pagination.offset !== 0) {
      fetchLogs();
    }
  }, [pagination.offset]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearLogs}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Component filter..."
              value={filters.component}
              onChange={(e) => handleFilterChange('component', e.target.value)}
              className="w-48"
            />

            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-64"
            />

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-40"
              />
              <span>to</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-40"
              />
            </div>

            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.level && (
              <Badge variant="secondary">
                Level: {filters.level}
                <button
                  onClick={() => handleFilterChange('level', '')}
                  className="ml-1 text-xs hover:bg-gray-200 rounded px-1"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.component && (
              <Badge variant="secondary">
                Component: {filters.component}
                <button
                  onClick={() => handleFilterChange('component', '')}
                  className="ml-1 text-xs hover:bg-gray-200 rounded px-1"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary">
                Search: {filters.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 text-xs hover:bg-gray-200 rounded px-1"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Logs ({pagination.total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs found matching the current filters.
            </div>
          ) : (
            <div className="h-96 overflow-auto">
              <div className="space-y-2">
                {logs.map((log) => {
                  const LevelIcon = levelIcons[log.level];
                  return (
                    <div
                      key={log.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <LevelIcon className="h-4 w-4" />
                          <Badge className={levelColors[log.level]}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-mono text-gray-600">
                            {formatTimestamp(log.created_at)}
                          </span>
                          {log.component_path && (
                            <Badge variant="outline" className="text-xs">
                              {log.component_path}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        {truncateMessage(log.message)}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          {Object.keys(log.metadata).length} metadata items
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
              disabled={pagination.offset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {Math.floor(pagination.offset / pagination.limit) + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.offset + pagination.limit)}
              disabled={!pagination.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(levelIcons[selectedLog.level], { className: "h-5 w-5" })}
                  Log Details
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {selectedLog.id}
                </div>
                <div>
                  <strong>Level:</strong> <Badge className={levelColors[selectedLog.level]}>{selectedLog.level.toUpperCase()}</Badge>
                </div>
                <div>
                  <strong>Timestamp:</strong> {formatTimestamp(selectedLog.created_at)}
                </div>
                <div>
                  <strong>Component:</strong> {selectedLog.component_path || 'N/A'}
                </div>
                {selectedLog.user_id && (
                  <div>
                    <strong>User ID:</strong> {selectedLog.user_id}
                  </div>
                )}
                {selectedLog.session_id && (
                  <div>
                    <strong>Session ID:</strong> {selectedLog.session_id}
                  </div>
                )}
              </div>
              
              <div>
                <strong>Message:</strong>
                <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.stack_trace && (
                <div>
                  <strong>Stack Trace:</strong>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap">
                    {selectedLog.stack_trace}
                  </div>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <strong>Metadata:</strong>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
                    <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default LogViewer;
