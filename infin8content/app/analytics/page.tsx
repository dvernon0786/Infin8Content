/**
 * Analytics Dashboard Page
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.1: Design dashboard layout with metric cards
 *
 * Main page for displaying the analytics dashboard with
 * user experience and performance metrics.
 */

import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Infin8Content',
  description: 'Comprehensive analytics and insights for user experience and performance metrics',
}

interface AnalyticsPageProps {
  searchParams: Promise<{
    orgId?: string
  }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  // In a real implementation, orgId would come from authentication context
  const resolvedSearchParams = await searchParams
  const orgId = resolvedSearchParams.orgId || 'default-org-id'

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-poppins text-h2-desktop font-bold text-neutral-900 dashboard-header-title">Analytics Dashboard</h1>
          <p className="mt-1 font-lato text-body text-neutral-600">User experience and performance metrics</p>
        </div>
      </div>

      {/* Analytics Dashboard Component */}
      <div className="container mx-auto px-0">
        <AnalyticsDashboard orgId={orgId} />
      </div>
    </div>
  )
}
