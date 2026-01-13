/**
 * System Health Card Component
 * Story 22.2: Performance Metrics Dashboard
 * Task 5: Real-time System Health Monitoring
 * 
 * Displays system health indicators, CPU/memory usage,
 * active generation count, and queue status with real-time updates.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  activeGenerations: number;
  queueLength: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
  compact?: boolean;
  className?: string;
}

export function SystemHealthCard({ systemHealth, compact = false, className = '' }: SystemHealthCardProps) {
  const getStatusColor = (status: SystemHealth['systemStatus']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SystemHealth['systemStatus']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-3 w-3" />;
      case 'warning': return <AlertTriangle className="h-3 w-3" />;
      case 'critical': return <AlertTriangle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getCpuColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-orange-500';
    if (usage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMemoryColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 80) return 'bg-orange-500';
    if (usage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getQueueStatus = (queueLength: number) => {
    if (queueLength > 50) return { color: 'text-red-600', status: 'Critical' };
    if (queueLength > 20) return { color: 'text-orange-600', status: 'High' };
    if (queueLength > 10) return { color: 'text-yellow-600', status: 'Moderate' };
    return { color: 'text-green-600', status: 'Normal' };
  };

  const queueStatus = getQueueStatus(systemHealth.queueLength);
  const lastUpdated = new Date(systemHealth.lastUpdated);

  if (compact) {
    return (
      <Card className={cn(
        'transition-all duration-300',
        systemHealth.systemStatus === 'healthy' && 'border-green-200 bg-green-50/30',
        systemHealth.systemStatus === 'warning' && 'border-orange-200 bg-orange-50/30',
        systemHealth.systemStatus === 'critical' && 'border-red-200 bg-red-50/30',
        className
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-600" />
            System Health
            <Badge className={cn('text-xs', getStatusColor(systemHealth.systemStatus))}>
              {getStatusIcon(systemHealth.systemStatus)}
              {systemHealth.systemStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* CPU Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">CPU</span>
              <span className="font-medium">{systemHealth.cpuUsage}%</span>
            </div>
            <Progress 
              value={systemHealth.cpuUsage} 
              className="h-1"
            />
          </div>

          {/* Memory Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Memory</span>
              <span className="font-medium">{systemHealth.memoryUsage}%</span>
            </div>
            <Progress 
              value={systemHealth.memoryUsage} 
              className="h-1"
            />
          </div>

          {/* Activity */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-medium">{systemHealth.activeGenerations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Queue</span>
              <span className={cn('font-medium', queueStatus.color)}>
                {systemHealth.queueLength}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-300',
      systemHealth.systemStatus === 'healthy' && 'border-green-200 bg-green-50/30',
      systemHealth.systemStatus === 'warning' && 'border-orange-200 bg-orange-50/30',
      systemHealth.systemStatus === 'critical' && 'border-red-200 bg-red-50/30',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-600" />
          System Health
          <Badge className={cn('text-xs', getStatusColor(systemHealth.systemStatus))}>
            {getStatusIcon(systemHealth.systemStatus)}
            {systemHealth.systemStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">CPU Usage</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{systemHealth.cpuUsage}%</span>
              {systemHealth.cpuUsage >= 90 && (
                <Badge variant="outline" className="text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={systemHealth.cpuUsage} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            {systemHealth.cpuUsage >= 90 ? 'Critical CPU usage - investigate immediately' :
             systemHealth.cpuUsage >= 70 ? 'High CPU usage - monitor closely' :
             'CPU usage within normal range'}
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Memory Usage</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{systemHealth.memoryUsage}%</span>
              {systemHealth.memoryUsage >= 90 && (
                <Badge variant="outline" className="text-xs text-red-600">
                  <MemoryStick className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )}
            </div>
          </div>
          
          <Progress 
            value={systemHealth.memoryUsage} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            {systemHealth.memoryUsage >= 90 ? 'Critical memory usage - risk of OOM' :
             systemHealth.memoryUsage >= 80 ? 'High memory usage - consider scaling' :
             'Memory usage within acceptable range'}
          </div>
        </div>

        {/* Active Generations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active Generations</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{systemHealth.activeGenerations}</span>
              <Badge variant="outline" className="text-xs text-blue-600">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Currently processing article generations
          </div>
        </div>

        {/* Queue Length */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Queue Length</span>
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', queueStatus.color)}>
                {systemHealth.queueLength}
              </span>
              <Badge variant="outline" className={cn('text-xs', queueStatus.color)}>
                {queueStatus.status}
              </Badge>
            </div>
          </div>
          
          <Progress 
            value={Math.min(100, (systemHealth.queueLength / 100) * 100)} // 100 = 100%
            className="h-2"
          />
          
          <div className="text-xs text-gray-500">
            {systemHealth.queueLength > 50 ? 'Queue length critical - investigate bottlenecks' :
             systemHealth.queueLength > 20 ? 'Queue length high - monitor performance' :
             systemHealth.queueLength > 10 ? 'Queue length moderate - normal operation' :
             'Queue length normal'}
          </div>
        </div>

        {/* System Status Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
          <div className="space-y-1">
            <div className="text-gray-600">System Load</div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {systemHealth.cpuUsage >= 70 || systemHealth.memoryUsage >= 80 ? 'High' : 'Normal'}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-600">Processing Capacity</div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {systemHealth.activeGenerations >= 10 ? 'At Limit' : 
                 systemHealth.activeGenerations >= 5 ? 'Moderate' : 'Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <div>
            Status: {systemHealth.systemStatus}
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth.systemStatus === 'critical' && (
          <div className="p-3 bg-red-100 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <div className="font-medium">System Health Critical</div>
                <div className="text-xs text-red-700 mt-1">
                  {systemHealth.cpuUsage >= 90 && `• CPU usage critical (${systemHealth.cpuUsage}%)\n`}
                  {systemHealth.memoryUsage >= 90 && `• Memory usage critical (${systemHealth.memoryUsage}%)\n`}
                  {systemHealth.queueLength > 50 && `• Queue length critical (${systemHealth.queueLength} articles)\n`}
                  Immediate investigation required.
                </div>
              </div>
            </div>
          </div>
        )}

        {systemHealth.systemStatus === 'warning' && (
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <div className="font-medium">System Health Warning</div>
                <div className="text-xs text-orange-700 mt-1">
                  {systemHealth.cpuUsage >= 70 && `• High CPU usage (${systemHealth.cpuUsage}%)\n`}
                  {systemHealth.memoryUsage >= 80 && `• High memory usage (${systemHealth.memoryUsage}%)\n`}
                  {systemHealth.queueLength > 20 && `• High queue length (${systemHealth.queueLength} articles)\n`}
                  Monitor system performance closely.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SystemHealthCard;
