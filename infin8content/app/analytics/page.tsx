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
    <div className="container mx-auto px-4 py-6">
      <AnalyticsDashboard orgId={orgId} />
    </div>
  )
}
