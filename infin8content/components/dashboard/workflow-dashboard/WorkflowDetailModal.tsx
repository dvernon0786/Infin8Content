'use client'

import React, { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, X } from 'lucide-react'
import type { WorkflowDashboardItem } from '@/lib/services/intent-engine/workflow-dashboard-service'
import { WORKFLOW_STEP_DESCRIPTIONS } from '@/lib/constants/intent-workflow-steps'
import type { WorkflowState } from '@/lib/fsm/workflow-events'
import { WORKFLOW_STEP_CONFIG } from '@/lib/intent-workflow/step-config'

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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRunningStep, setIsRunningStep] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  
  // ICP form state
  const [icpFormData, setIcpFormData] = useState({
    organizationName: '',
    organizationUrl: '',
    organizationLinkedInUrl: '',
  })

  if (!workflow) return null

  // Check if workflow can be cancelled (not already terminal)
  const canCancel = workflow.state !== 'completed' && workflow.state !== 'failed'
  
  // Detect the active step for execution
  const activeStep = WORKFLOW_STEP_CONFIG.find(
    (s) => s.step === workflow.state
  )

  const handleCancelWorkflow = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/intent/workflows/${workflow.id}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel workflow')
      }

      // Close modal and refresh parent
      onOpenChange(false)
      // Parent will handle refresh via real-time subscription
    } catch (error) {
      console.error('Failed to cancel workflow:', error)
      // TODO: Show error toast
    } finally {
      setIsCancelling(false)
      setShowCancelConfirm(false)
    }
  }

  const steps = WORKFLOW_STEP_CONFIG
    .filter(step => !step.hidden) // Hide internal steps from UI
    .map((step, index) => ({
      key: step.step,
      label: step.label,
      order: index,
    }))

  const currentStepOrder = steps.find(s => s.key === workflow.state)?.order ?? -1

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
      <DialogContent className="max-w-2xl w-full mx-4 sm:mx-auto sm:w-full max-h-[90vh] overflow-y-auto">
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
                    {WORKFLOW_STEP_DESCRIPTIONS[workflow.state as WorkflowState] || 'Unknown'}
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

              {/* Action Button / ICP Form */}
              {activeStep && canCancel && (
                <div className="pt-4 border-t space-y-2">
                  {stepError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md sm:p-2">
                      <p className="text-sm text-red-800 leading-tight">
                        {stepError}
                      </p>
                    </div>
                  )}

                  {/* ICP Input Form - only for step_0_auth */}
                  {workflow.state === 'step_0_auth' ? (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Organization Name *
                          </label>
                          <Input
                            placeholder="Enter organization name"
                            value={icpFormData.organizationName}
                            onChange={(e) => setIcpFormData(prev => ({
                              ...prev,
                              organizationName: e.target.value
                            }))}
                            disabled={isRunningStep}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Organization Website *
                          </label>
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            value={icpFormData.organizationUrl}
                            onChange={(e) => setIcpFormData(prev => ({
                              ...prev,
                              organizationUrl: e.target.value
                            }))}
                            disabled={isRunningStep}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Organization LinkedIn *
                          </label>
                          <Input
                            type="url"
                            placeholder="https://linkedin.com/company/example"
                            value={icpFormData.organizationLinkedInUrl}
                            onChange={(e) => setIcpFormData(prev => ({
                              ...prev,
                              organizationLinkedInUrl: e.target.value
                            }))}
                            disabled={isRunningStep}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full min-h-[44px] text-base sm:min-h-[40px] sm:text-sm"
                        disabled={isRunningStep}
                        onClick={async () => {
                          try {
                            setIsRunningStep(true)
                            setStepError(null)

                            // Validate form inputs
                            if (!icpFormData.organizationName || !icpFormData.organizationUrl || !icpFormData.organizationLinkedInUrl) {
                              setStepError('All fields are required to generate ICP')
                              return
                            }

                            // Validate URL format
                            try {
                              new URL(icpFormData.organizationUrl)
                              new URL(icpFormData.organizationLinkedInUrl)
                            } catch {
                              setStepError('Please enter valid URLs')
                              return
                            }

                            const res = await fetch(
                              `/api/intent/workflows/${workflow.id}/${activeStep.endpoint}`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  organization_name: icpFormData.organizationName,
                                  organization_url: icpFormData.organizationUrl,
                                  organization_linkedin_url: icpFormData.organizationLinkedInUrl,
                                }),
                              }
                            )

                            if (!res.ok) {
                              const body = await res.json()
                              throw new Error(body.error || 'Step failed')
                            }

                            // realtime subscription will refresh workflow
                          } catch (err: any) {
                            setStepError(err.message || 'Something went wrong')
                          } finally {
                            setIsRunningStep(false)
                          }
                        }}
                      >
                        {isRunningStep ? 'Generating ICP…' : activeStep.label}
                      </Button>
                    </div>
                  ) : (
                    /* Regular action button for other steps */
                    <Button
                      className="w-full min-h-[44px] text-base sm:min-h-[40px] sm:text-sm"
                      disabled={isRunningStep}
                      onClick={async () => {
                        try {
                          setIsRunningStep(true)
                          setStepError(null)

                          const res = await fetch(
                            `/api/intent/workflows/${workflow.id}/${activeStep.endpoint}`,
                            { method: 'POST' }
                          )

                          if (!res.ok) {
                            const body = await res.json()
                            throw new Error(body.error || 'Step failed')
                          }

                          // realtime subscription will refresh workflow
                        } catch (err: any) {
                          setStepError(err.message || 'Something went wrong')
                        } finally {
                          setIsRunningStep(false)
                        }
                      }}
                    >
                      {isRunningStep ? 'Running…' : activeStep.label}
                    </Button>
                  )}
                </div>
              )}

              {/* Cancel Button */}
              {canCancel && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isCancelling}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Cancel workflow
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancel workflow?
            </DialogTitle>
            <DialogDescription>
              This will permanently stop the workflow.
              You cannot resume it. You can start a new workflow anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              disabled={isCancelling}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelWorkflow}
              disabled={isCancelling}
              className="flex-1"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, cancel workflow'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
