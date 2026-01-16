/**
 * Admin Performance Dashboard Page
 * Story 32.2: Efficiency & Performance Metrics
 * 
 * Admin dashboard page for monitoring system efficiency,
 * performance metrics, and real-time analytics.
 */

import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import { EfficiencyMetricsCard } from '@/components/admin/performance/efficiency-metrics-card'
import { RealTimeMonitor } from '@/components/admin/performance/real-time-monitor'

export default async function AdminPerformancePage() {
  const user = await getCurrentUser()
  
  if (!user || !user.org_id) {
    redirect('/login')
  }

  // Fetch efficiency data from API
  const efficiencyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/metrics/efficiency-summary`, {
    cache: 'no-store'
  })
  
  if (!efficiencyResponse.ok) {
    console.error('Failed to fetch efficiency data')
    redirect('/login')
  }

  const efficiencyData = await efficiencyResponse.json()
  const efficiencySummary = efficiencyData.data

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance & Efficiency</h1>
          <p className="text-gray-600 mt-2">
            Monitor system performance metrics and efficiency indicators
          </p>
        </div>
      </div>

      {/* Efficiency Metrics Overview */}
      <EfficiencyMetricsCard {...efficiencySummary} />

      {/* Real-time Performance Monitoring */}
      <RealTimeMonitor 
        orgId={user.org_id}
        refreshInterval={5000}
      />

      {/* Additional performance metrics can be added here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder for future metrics components */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Historical Trends</h3>
          <p className="text-gray-500">Performance trends over time coming soon</p>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-2">System Health</h3>
          <p className="text-gray-500">Detailed system health metrics coming soon</p>
        </div>
      </div>
    </div>
  )
}
