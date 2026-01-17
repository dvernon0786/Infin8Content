/**
 * Real-time Error Streaming Component
 * Implements real-time error streaming via Supabase subscriptions
 * Follows existing real-time patterns from performance dashboard
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Info, 
  Bug, 
  Pause, 
  Play,
  Settings,
  X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logging';

interface RealtimeError {
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

interface RealtimeErrorsProps {
  orgId: string;
  maxErrors?: number;
  filters?: {
    level?: string;
    component?: string;
  };
  className?: string;
}

export function RealtimeErrors({ 
  orgId, 
  maxErrors = 50, 
  filters: initialFilters = {},
  className = '' 
}: RealtimeErrorsProps) {
  const [errors, setErrors] = useState<RealtimeError[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [errorCount, setErrorCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  
  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const errorCountsRef = useRef({ debug: 0, info: 0, warn: 0, error: 0 });

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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const shouldFilterError = (error: RealtimeError): boolean => {
    if (filters.level && error.level !== filters.level) return false;
    if (filters.component && !error.component_path?.includes(filters.component)) return false;
    return true;
  };

  const addError = useCallback((newError: RealtimeError) => {
    if (isPaused) return;
    
    if (!shouldFilterError(newError)) return;

    setErrors(prev => {
      const updated = [newError, ...prev].slice(0, maxErrors);
      return updated;
    });

    setErrorCount(prev => prev + 1);
    errorCountsRef.current[newError.level as keyof typeof errorCountsRef.current] += 1;

    // Log the real-time error reception
    logger.debug('Real-time error received', {
      errorId: newError.id,
      level: newError.level,
      component: newError.component_path
    }, { componentPath: 'RealtimeErrors' });
  }, [isPaused, maxErrors, filters]);

  const setupSubscription = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      
      const supabase = createClient();
      supabaseRef.current = supabase;

      const channel = supabase
        .channel('realtime-errors')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'error_logs',
            filter: `created_at=gt.${new Date(Date.now() - 60000).toISOString()}` // Last minute
          },
          (payload: any) => {
            const newError = payload.new as RealtimeError;
            addError(newError);
          }
        )
        .subscribe((status: any) => {
          logger.info('Real-time subscription status changed', { status }, { componentPath: 'RealtimeErrors' });
          
          switch (status) {
            case 'SUBSCRIBED':
              setConnectionStatus('connected');
              setIsConnected(true);
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              setConnectionStatus('error');
              setIsConnected(false);
              break;
            case 'CLOSED':
              setConnectionStatus('disconnected');
              setIsConnected(false);
              break;
            default:
              break;
          }
        });

      channelRef.current = channel;

      // Set up connection health check
      const healthCheck = setInterval(() => {
        // Simple health check - just log the connection status
        logger.debug('Real-time connection health check', { 
          status: connectionStatus,
          channel: channelRef.current?.id 
        }, { componentPath: 'RealtimeErrors' });
      }, 30000);

      return () => {
        clearInterval(healthCheck);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      };

    } catch (error) {
      logger.error('Failed to setup real-time subscription', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, { componentPath: 'RealtimeErrors' });
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [orgId, addError]);

  const handleConnect = () => {
    setupSubscription();
  };

  const handleDisconnect = () => {
    if (channelRef.current && supabaseRef.current) {
      supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleClear = () => {
    setErrors([]);
    setErrorCount(0);
    errorCountsRef.current = { debug: 0, info: 0, warn: 0, error: 0 };
  };

  const handleRemoveError = (errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  useEffect(() => {
    const cleanup = setupSubscription();
    return cleanup;
  }, [setupSubscription]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
              Real-time Errors
              <Badge className={getConnectionStatusColor()}>
                {getConnectionStatusText()}
              </Badge>
              {errorCount > 0 && (
                <Badge variant="secondary">
                  {errorCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {!isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                >
                  <Wifi className="h-4 w-4" />
                  Connect
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  <WifiOff className="h-4 w-4" />
                  Disconnect
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <h4 className="font-medium">Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Errors</label>
                  <input
                    type="number"
                    value={maxErrors}
                    onChange={(e) => setErrors(prev => prev.slice(0, parseInt(e.target.value)))}
                    className="w-full p-2 border rounded"
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Level Filter</label>
                  <select
                    value={filters.level || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">All Levels</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Component Filter</label>
                <input
                  type="text"
                  value={filters.component || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, component: e.target.value }))}
                  placeholder="Filter by component path..."
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}

          {/* Error Counts Summary */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              Debug: {errorCountsRef.current.debug}
            </Badge>
            <Badge variant="outline" className="bg-blue-50">
              Info: {errorCountsRef.current.info}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50">
              Warning: {errorCountsRef.current.warn}
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              Error: {errorCountsRef.current.error}
            </Badge>
          </div>

          {/* Real-time Errors List */}
          <div className="space-y-2 max-h-96 overflow-auto">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isPaused ? 'Streaming paused' : 'Waiting for errors...'}
              </div>
            ) : (
              errors.map((error) => {
                const LevelIcon = levelIcons[error.level];
                return (
                  <div
                    key={error.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <LevelIcon className="h-4 w-4" />
                        <Badge className={levelColors[error.level]}>
                          {error.level.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-mono text-gray-600">
                          {formatTimestamp(error.created_at)}
                        </span>
                        {error.component_path && (
                          <Badge variant="outline" className="text-xs">
                            {error.component_path}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveError(error.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm">
                      {truncateMessage(error.message)}
                    </div>
                    {error.metadata && Object.keys(error.metadata).length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {Object.keys(error.metadata).length} metadata items
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {isConnected ? 'Live streaming active' : 'Streaming inactive'}
            </div>
            <div>
              {errors.length} / {maxErrors} errors displayed
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealtimeErrors;
