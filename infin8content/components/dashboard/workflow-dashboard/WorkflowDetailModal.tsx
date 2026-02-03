'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WorkflowDashboardItem } from '@/lib/services/intent-engine/workflow-dashboard-service'

interface WorkflowDetailModalProps {
  workflow: WorkflowDashboardItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Workflow Detail Modal Component
 * Displays detailed step-by-step progress for a workflow
 */
export function WorkflowDetailModal({
  workflow,
  open,
  onOpenChange,
}: WorkflowDetailModalProps) {
  if (!workflow) return null

  const steps = [
    { key: 'step_0_auth', label: 'Authentication', order: 0 },
    { key: 'step_1_icp', label: 'ICP Generation', order: 1 },
    { key: 'step_2_competitors', label: 'Competitor Analysis', order: 2 },
    { key: 'step_3_keywords', label: 'Keyword Research', order: 3 },
    { key: 'step_4_topics', label: 'Topic Generation', order: 4 },
    { key: 'step_5_generation', label: 'Article Generation', order: 5 },
  ]

  const currentStepOrder = steps.find(s => s.key === workflow.status)?.order ?? -1

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{workflow.name}</DialogTitle>
          <DialogDescription>
            Detailed workflow progress and step information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm font-semibold">
                  {workflow.progress_percentage}%
                </span>
              </div>
              <Progress value={workflow.progress_percentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Step Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = currentStepOrder > step.order
                  const isCurrent = currentStepOrder === step.order
                  const isBlocked = currentStepOrder < step.order

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isCompleted
                            ? 'bg-green-100 text-green-800'
                            : isCurrent
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.label}</p>
                      </div>
                      {isCompleted && (
                        <Badge variant="outline" className="bg-green-50">
                          Completed
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="outline" className="bg-blue-50">
                          In Progress
                        </Badge>
                      )}
                      {isBlocked && (
                        <Badge variant="outline" className="bg-gray-50">
                          Pending
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {workflow.status.replace('step_', 'Step ').replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Created By
                  </p>
                  <p className="text-sm font-medium mt-1">{workflow.created_by}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Created
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(workflow.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Last Updated
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(workflow.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
