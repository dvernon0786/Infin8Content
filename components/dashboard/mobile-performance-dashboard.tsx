/**
 * Mobile Performance Dashboard Component
 * 
 * Integrates mobile performance monitoring with real-time metrics
 * and optimization suggestions for the dashboard.
 */

"use client"

import React, { useEffect, useState } from 'react'
import { useMobilePerformance } from '../../hooks/use-mobile-performance'
import { Card, CardHeader, CardTitle, CardContent } from '../../infin8content/components/ui/card'
import { Badge } from '../../infin8content/components/ui/badge'
import { Button } from '../../infin8content/components/ui/button'
import { MobileCard } from '../../infin8content/components/mobile/mobile-card'

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
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  const formatResponseTime = (ms: number): string => {
    return `${ms.toFixed(0)}ms`
  }

  const getPerformanceColor = (optimized: boolean): string => {
    return optimized ? 'green' : 'orange'
  }

  const getNetworkQualityColor = (speed: string): string => {
    switch (speed) {
      case '4g': return 'green'
      case '3g': return 'yellow'
      case '2g':
      case 'slow-2g': return 'red'
      default: return 'gray'
    }
  }

  const getDevicePerformanceColor = (performance: string): string => {
    switch (performance) {
      case 'high': return 'green'
      case 'medium': return 'yellow'
      case 'low': return 'red'
      default: return 'gray'
    }
  }

  // Desktop version
  const DesktopPerformanceCard = () => (
    <Card className="hidden md:block">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Mobile Performance
        </CardTitle>
        <Badge 
          variant={isPerformanceOptimized ? "default" : "secondary"}
          className={isPerformanceOptimized ? "bg-green-500" : "bg-orange-500"}
        >
          {isPerformanceOptimized ? "Optimized" : "Needs Optimization"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Touch Response */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Touch Response</span>
            <span className={`text-sm font-medium ${
              metrics.touchResponseTime < 200 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {formatResponseTime(metrics.touchResponseTime)}
            </span>
          </div>

          {/* Animation Frame Rate */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Frame Rate</span>
            <span className={`text-sm font-medium ${
              metrics.animationFrameRate >= 55 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {metrics.animationFrameRate.toFixed(0)}fps
            </span>
          </div>

          {/* Memory Usage */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Memory</span>
            <span className={`text-sm font-medium ${
              metrics.memoryUsage < 50 * 1024 * 1024 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {formatMemoryUsage(metrics.memoryUsage)}
            </span>
          </div>

          {/* Network Speed */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant="outline" className={`text-xs ${
              getNetworkQualityColor(metrics.networkSpeed) === 'green' ? 'border-green-500 text-green-600' :
              getNetworkQualityColor(metrics.networkSpeed) === 'yellow' ? 'border-yellow-500 text-yellow-600' :
              getNetworkQualityColor(metrics.networkSpeed) === 'red' ? 'border-red-500 text-red-600' :
              'border-gray-500 text-gray-600'
            }`}>
              {metrics.networkSpeed.toUpperCase()}
            </Badge>
          </div>

          {/* Device Performance */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Device</span>
            <Badge variant="outline" className={`text-xs ${
              getDevicePerformanceColor(metrics.devicePerformance) === 'green' ? 'border-green-500 text-green-600' :
              getDevicePerformanceColor(metrics.devicePerformance) === 'yellow' ? 'border-yellow-500 text-yellow-600' :
              'border-red-500 text-red-600' : 'border-gray-500 text-gray-600'
            }`}>
              {metrics.devicePerformance.toUpperCase()}
            </Badge>
          </div>

          {/* Optimization Button */}
          <div className="pt-2">
            <Button 
              onClick={handleOptimize}
              size="sm"
              variant="outline"
              className="w-full"
              disabled={isPerformanceOptimized}
            >
              {isPerformanceOptimized ? "Already Optimized" : "Optimize Now"}
            </Button>
            {lastOptimized && (
              <p className="text-xs text-muted-foreground mt-1">
                Last optimized: {lastOptimized.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Performance Suggestions */}
          {performanceSuggestions.length > 0 && (
            <div className="pt-2">
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Suggestions ({performanceSuggestions.length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {performanceSuggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Mobile version
  const MobilePerformanceCard = () => (
    <MobileCard
      title="Performance"
      badge={isPerformanceOptimized ? "Good" : "Slow"}
      badgeColor={isPerformanceOptimized ? "green" : "orange"}
      className="md:hidden"
      testId="mobile-performance-card"
    >
      <div className="space-y-3">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className={`text-lg font-bold ${
              metrics.touchResponseTime < 200 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {formatResponseTime(metrics.touchResponseTime)}
            </div>
            <div className="text-xs text-muted-foreground">Touch</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              metrics.animationFrameRate >= 55 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {metrics.animationFrameRate.toFixed(0)}fps
            </div>
            <div className="text-xs text-muted-foreground">FPS</div>
          </div>
        </div>

        {/* Network and Device */}
        <div className="flex justify-between items-center">
          <Badge variant="outline" className={`text-xs ${
            getNetworkQualityColor(metrics.networkSpeed) === 'green' ? 'border-green-500 text-green-600' :
            getNetworkQualityColor(metrics.networkSpeed) === 'yellow' ? 'border-yellow-500 text-yellow-600' :
            getNetworkQualityColor(metrics.networkSpeed) === 'red' ? 'border-red-500 text-red-600' :
            'border-gray-500 text-gray-600'
          }`}>
            {metrics.networkSpeed.toUpperCase()}
          </Badge>
          <Badge variant="outline" className={`text-xs ${
            getDevicePerformanceColor(metrics.devicePerformance) === 'green' ? 'border-green-500 text-green-600' :
            getDevicePerformanceColor(metrics.devicePerformance) === 'yellow' ? 'border-yellow-500 text-yellow-600' :
            'border-red-500 text-red-600' : 'border-gray-500 text-gray-600'
          }`}>
            {metrics.devicePerformance.toUpperCase()}
          </Badge>
        </div>

        {/* Memory Usage */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Memory</span>
          <span className={`text-sm font-medium ${
            metrics.memoryUsage < 50 * 1024 * 1024 ? 'text-green-600' : 'text-orange-600'
          }`}>
            {formatMemoryUsage(metrics.memoryUsage)}
          </span>
        </div>

        {/* Optimization Button */}
        <Button 
          onClick={handleOptimize}
          size="sm"
          variant="outline"
          className="w-full"
          disabled={isPerformanceOptimized}
        >
          {isPerformanceOptimized ? "✓ Optimized" : "Optimize"}
        </Button>

        {/* Expandable Suggestions */}
        {performanceSuggestions.length > 0 && (
          <details className="text-sm">
            <summary 
              className="cursor-pointer text-muted-foreground hover:text-foreground text-xs"
              onClick={(e) => {
                e.preventDefault()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? "Hide" : "Show"} Tips ({performanceSuggestions.length})
            </summary>
            {isExpanded && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {performanceSuggestions.slice(0, 2).map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        )}
      </div>
    </MobileCard>
  )

  return (
    <>
      <DesktopPerformanceCard />
      <MobilePerformanceCard />
    </>
  )
}

export default MobilePerformanceDashboard
