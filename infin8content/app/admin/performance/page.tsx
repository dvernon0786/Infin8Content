/**
 * Admin Performance Dashboard Page
 * Story 22.2: Performance Metrics Dashboard
 * 
 * Admin dashboard page for monitoring system performance,
 * Epic 20 optimization effectiveness, and real-time system health.
 */

import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import { PerformanceDashboard } from '@/components/dashboard/performance-dashboard'

export default async function AdminPerformancePage() {
  const user = await getCurrentUser()
  
  if (!user || !user.org_id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-6">
      <PerformanceDashboard 
        orgId={user.org_id}
        refreshInterval={30000} // 30 seconds
        showAlerts={true}
      />
    </div>
  )
}
