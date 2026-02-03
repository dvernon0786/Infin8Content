'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { WorkflowDashboardItem } from '@/lib/services/intent-engine/workflow-dashboard-service'

interface WorkflowCardProps {
  workflow: WorkflowDashboardItem
  onNavigate: () => void
}

/**
 * Workflow Card Component
 * Displays individual workflow status, progress, and actions
 */
export function WorkflowCard({ workflow, onNavigate }: WorkflowCardProps) {
  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800'
    if (status === 'failed') return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4" />
    if (status === 'failed') return <AlertCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onNavigate}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {workflow.current_step}
            </p>
          </div>
          <Badge className={getStatusColor(workflow.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(workflow.status)}
              {workflow.status.replace('step_', 'Step ').replace(/_/g, ' ')}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{workflow.progress_percentage}%</span>
          </div>
          <Progress value={workflow.progress_percentage} className="h-2" />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(workflow.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Updated</p>
            <p className="font-medium">{formatDate(workflow.updated_at)}</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate()
          }}
        >
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
