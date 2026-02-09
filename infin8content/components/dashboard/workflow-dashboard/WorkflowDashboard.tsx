'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardResponse, WorkflowDashboardItem } from '@/lib/services/intent-engine/workflow-dashboard-service'
import { WorkflowCard } from './WorkflowCard'
import { WorkflowFilters } from './WorkflowFilters'
import { WorkflowDetailModal } from './WorkflowDetailModal'

/**
 * Workflow Dashboard Component
 * Story 39.6: Create Workflow Status Dashboard
 * 
 * Main container for displaying all workflows with real-time status,
 * progress tracking, and filtering capabilities.
 */
export function WorkflowDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null)
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDashboardItem | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    fetchDashboard()
    setupRealtimeSubscription()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/intent/workflows/dashboard')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch dashboard')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = async () => {
    try {
      const supabase = createClient()
      
      subscriptionRef.current = supabase
        .channel('intent_workflows_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'intent_workflows',
          },
          () => {
            fetchDashboard()
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('Realtime subscription failed, dashboard will use polling fallback')
            setError(null)
          }
        })
    } catch (err) {
      console.error('Failed to setup realtime subscription:', err)
      setError(null)
    }
  }

  const filteredWorkflows = dashboardData?.workflows.filter(workflow => {
    if (selectedStatus && workflow.status !== selectedStatus) return false
    if (selectedCreator && workflow.created_by !== selectedCreator) return false
    
    if (selectedDateRange) {
      const now = new Date()
      const createdDate = new Date(workflow.created_at)
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (selectedDateRange) {
        case 'today':
          if (daysDiff >= 1) return false
          break
        case 'this_week':
          if (daysDiff > 7) return false
          break
        case 'this_month':
          if (daysDiff > 30) return false
          break
        case 'all_time':
          break
      }
    }
    
    return true
  }) || []

  const creators = Array.from(new Set(dashboardData?.workflows.map(w => w.created_by) || []))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboard} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track the progress of your intent workflows
          </p>
        </div>
        <Button onClick={fetchDashboard} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.summary.total_workflows}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.summary.in_progress_workflows}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.summary.completed_workflows}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboardData.summary.failed_workflows}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {dashboardData && (
        <WorkflowFilters
          statuses={dashboardData.filters.statuses}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          creators={creators}
          selectedCreator={selectedCreator}
          onCreatorChange={setSelectedCreator}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
        />
      )}

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {selectedStatus
                  ? `No workflows with status "${selectedStatus}"`
                  : 'No workflows found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onNavigate={() => {
                setSelectedWorkflow(workflow)
                setDetailModalOpen(true)
              }}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      <WorkflowDetailModal
        workflow={selectedWorkflow}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  )
}
