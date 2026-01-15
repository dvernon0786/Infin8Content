/**
 * Mobile Performance Dashboard Component
 * 
 * Integrates mobile performance monitoring with real-time metrics
 * and optimization suggestions for the dashboard.
 */

"use client"

import React, { useEffect, useState } from 'react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileCard } from '@/components/mobile/mobile-card'

interface PerformanceMetrics {
  touchResponseTime: number
  pageLoadTime: number
  animationFrameRate: number
  memoryUsage: number
  networkSpeed: string
  devicePerformance: 'high' | 'medium' | 'low'
}

export const MobilePerformanceDashboard: React.FC = () => {
  const { 
    metrics, 
    performanceSuggestions, 
    isPerformanceOptimized,
    optimizeForMobile,
    getNetworkConfig
  } = useMobilePerformance()

  const [isExpanded, setIsExpanded] = useState(false)
  const [lastOptimized, setLastOptimized] = useState<Date | null>(null)

  // Auto-optimize on mount and when metrics change significantly
  useEffect(() => {
    if (!isPerformanceOptimized && metrics.touchResponseTime > 0) {
      handleOptimize()
    }
  }, [metrics, isPerformanceOptimized])

  const handleOptimize = () => {
    optimizeForMobile()
    setLastOptimized(new Date())
  }

  const formatMemoryUsage = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDevicePerformanceColor = (performance: string): string => {
    switch (performance) {
      case 'high': return 'green'
      case 'medium': return 'yellow'
      case 'low': return 'red'
      default: return 'gray'
    }
  }

  const getNetworkSpeedColor = (speed: string): string => {
    switch (speed) {
      case '4g': return 'green'
      case '3g': return 'yellow'
      case '2g': return 'red'
      default: return 'gray'
    }
  }

  if (!metrics.touchResponseTime) {
    return (
      <MobileCard>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading performance metrics...</p>
          </div>
        </CardContent>
      </MobileCard>
    )
  }

  return (
    <MobileCard>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Mobile Performance
          <div className="flex items-center gap-2">
            <Badge 
              variant={isPerformanceOptimized ? "default" : "secondary"}
              className="text-xs"
            >
              {isPerformanceOptimized ? 'Optimized' : 'Needs Optimization'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {metrics.touchResponseTime}ms
            </div>
            <div className="text-xs text-muted-foreground">Touch Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {metrics.animationFrameRate}fps
            </div>
            <div className="text-xs text-muted-foreground">Animation</div>
          </div>
        </div>

        {/* Performance Status */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Page Load</span>
            <Badge variant="outline" className={`text-xs ${
              metrics.pageLoadTime < 2000 ? 'border-green-500 text-green-600' :
              metrics.pageLoadTime < 3000 ? 'border-yellow-500 text-yellow-600' :
              'border-red-500 text-red-600'
            }`}>
              {metrics.pageLoadTime}ms
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant="outline" className={`text-xs ${
              getNetworkSpeedColor(metrics.networkSpeed) === 'green' ? 'border-green-500 text-green-600' :
              getNetworkSpeedColor(metrics.networkSpeed) === 'yellow' ? 'border-yellow-500 text-yellow-600' :
              getNetworkSpeedColor(metrics.networkSpeed) === 'red' ? 'border-red-500 text-red-600' : 'border-gray-500 text-gray-600'
            }`}>
              {metrics.networkSpeed.toUpperCase()}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Device</span>
            <Badge variant="outline" className={`text-xs ${
              getDevicePerformanceColor(metrics.devicePerformance) === 'green' ? 'border-green-500 text-green-600' :
              getDevicePerformanceColor(metrics.devicePerformance) === 'yellow' ? 'border-yellow-500 text-yellow-600' :
              getDevicePerformanceColor(metrics.devicePerformance) === 'red' ? 'border-red-500 text-red-600' : 'border-gray-500 text-gray-600'
            }`}>
              {metrics.devicePerformance.toUpperCase()}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Memory</span>
            <span className={`text-sm font-medium ${
              metrics.memoryUsage < 50 * 1024 * 1024 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {formatMemoryUsage(metrics.memoryUsage)}
            </span>
          </div>
        </div>

        {/* Optimization Button */}
        <div className="pt-2">
          <Button 
            onClick={handleOptimize}
            size="sm"
            className="w-full"
            disabled={isPerformanceOptimized}
          >
            {isPerformanceOptimized ? '✅ Optimized' : '🚀 Optimize Performance'}
          </Button>
          {lastOptimized && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Last optimized: {lastOptimized.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Performance Suggestions</h4>
            <div className="space-y-2">
              {performanceSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {suggestion}
                </div>
              ))}
            </div>
            
            <div className="text-xs text-muted-foreground">
              <div>Network Config: {(getNetworkConfig() as any)?.type || 'Unknown'}</div>
              <div>Device Memory: {(navigator as any).deviceMemory || 'Unknown'} GB</div>
              <div>CPU Cores: {navigator.hardwareConcurrency || 'Unknown'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </MobileCard>
  )
}
