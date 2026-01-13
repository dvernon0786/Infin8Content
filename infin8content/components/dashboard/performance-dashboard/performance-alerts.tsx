/**
 * Performance Alerts Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 5: Real-time System Health Monitoring
 * 
 * Displays performance alerts, warnings, and critical notifications
 * for system health and performance degradation.
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  Clock,
  TrendingUp,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: string;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
}

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[];
  className?: string;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string, action: string) => void;
}

export function PerformanceAlerts({ 
  alerts, 
  className = '',
  onDismiss,
  onAction 
}: PerformanceAlertsProps) {
  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-100 border-orange-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'cpu_usage': return <Activity className="h-3 w-3" />;
      case 'memory_usage': return <Database className="h-3 w-3" />;
      case 'queue_length': return <Clock className="h-3 w-3" />;
      case 'generation_time': return <TrendingUp className="h-3 w-3" />;
      case 'api_calls': return <Zap className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'cpu_usage': return 'CPU Usage';
      case 'memory_usage': return 'Memory Usage';
      case 'queue_length': return 'Queue Length';
      case 'generation_time': return 'Generation Time';
      case 'api_calls': return 'API Calls';
      default: return metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getAlertActions = (alert: PerformanceAlert) => {
    const actions = [];
    
    switch (alert.metric) {
      case 'queue_length':
        actions.push({ label: 'View Queue', action: 'view_queue' });
        if (alert.type === 'critical') {
          actions.push({ label: 'Pause New Jobs', action: 'pause_jobs' });
        }
        break;
      case 'cpu_usage':
      case 'memory_usage':
        actions.push({ label: 'System Diagnostics', action: 'diagnostics' });
        if (alert.type === 'critical') {
          actions.push({ label: 'Scale Resources', action: 'scale_resources' });
        }
        break;
      case 'generation_time':
        actions.push({ label: 'View Generations', action: 'view_generations' });
        actions.push({ label: 'Optimize Settings', action: 'optimize_settings' });
        break;
      case 'api_calls':
        actions.push({ label: 'API Usage Report', action: 'api_report' });
        actions.push({ label: 'Optimize API Usage', action: 'optimize_api' });
        break;
    }
    
    return actions;
  };

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">
                Critical Alerts ({criticalAlerts.length})
              </h3>
            </div>
            
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <div key={alert.id} className={cn(
                  'p-3 rounded-lg border',
                  getAlertColor(alert.type)
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-xs', getAlertColor(alert.type))}>
                            {getMetricIcon(alert.metric)}
                            {getMetricLabel(alert.metric)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        
                        <div className="text-sm font-medium text-gray-800 mb-1">
                          {alert.message}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          Current: {alert.currentValue} | Threshold: {alert.threshold}
                        </div>
                        
                        {/* Alert Actions */}
                        {onAction && (
                          <div className="flex items-center gap-2 mt-2">
                            {getAlertActions(alert).map(action => (
                              <Button
                                key={action.action}
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => onAction(alert.id, action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Dismiss Button */}
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">
                Warnings ({warningAlerts.length})
              </h3>
            </div>
            
            <div className="space-y-3">
              {warningAlerts.map(alert => (
                <div key={alert.id} className={cn(
                  'p-3 rounded-lg border',
                  getAlertColor(alert.type)
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-xs', getAlertColor(alert.type))}>
                            {getMetricIcon(alert.metric)}
                            {getMetricLabel(alert.metric)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        
                        <div className="text-sm font-medium text-gray-800 mb-1">
                          {alert.message}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          Current: {alert.currentValue} | Threshold: {alert.threshold}
                        </div>
                        
                        {/* Alert Actions */}
                        {onAction && (
                          <div className="flex items-center gap-2 mt-2">
                            {getAlertActions(alert).map(action => (
                              <Button
                                key={action.action}
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => onAction(alert.id, action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Dismiss Button */}
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PerformanceAlerts;
