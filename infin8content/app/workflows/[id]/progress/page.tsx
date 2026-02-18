'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { getStepFromState } from '@/lib/services/workflow-engine/workflow-progression'

interface WorkflowProgressPageProps {
  params: Promise<{ id: string }>
}

const PIPELINE_STAGES = [
  { step: 4, name: 'Longtail Expansion', state: 'step_4_longtails' },
  { step: 5, name: 'Keyword Filtering', state: 'step_5_filtering' },
  { step: 6, name: 'Topic Clustering', state: 'step_6_clustering' },
  { step: 7, name: 'Cluster Validation', state: 'step_7_validation' },
]

export default function WorkflowProgressPage({ params }: WorkflowProgressPageProps) {
  const router = useRouter()
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const workflowId = params.then(p => p.id)

  // Poll workflow state every 2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout

    const pollWorkflow = async () => {
      try {
        const id = await workflowId
        const response = await fetch(`/api/intent/workflows/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch workflow status')
        }

        const data = await response.json()
        setWorkflow(data.workflow)

        const currentStep = getStepFromState(data.workflow.state)

        // Redirect to Step 8 when pipeline is complete
        if (currentStep === 8) {
          router.replace(`/workflows/${id}/steps/8`)
          return
        }

        // Redirect to completion when everything is done
        if (data.workflow.state === 'completed') {
          router.replace(`/workflows/${id}/completed`)
          return
        }

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    pollWorkflow()
    interval = setInterval(pollWorkflow, 2000)

    return () => clearInterval(interval)
  }, [router, workflowId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStep = getStepFromState(workflow.state)
  const currentStage = PIPELINE_STAGES.find(s => s.step === currentStep)
  const failedStage = PIPELINE_STAGES.find(s => workflow.state.includes(`${s.state}_failed`))

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-3 text-sm text-muted-foreground flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </button>

          <span className="font-medium text-foreground">
            {workflow.name}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Processing Workflow
          </h1>
          <p className="text-muted-foreground">
            We're analyzing your keywords and generating insights. This usually takes 2-5 minutes.
          </p>
        </div>

        {/* Failure State */}
        {failedStage && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                {failedStage.name} Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                An error occurred during {failedStage.name.toLowerCase()}. Please try again or contact support.
              </p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  Exit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {!failedStage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {currentStage.name}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Pipeline Complete
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentStep - 4) / 4) * 100)}%</span>
                </div>
                <Progress value={((currentStep - 4) / 4) * 100} className="w-full" />
              </div>

              {/* Stage List */}
              <div className="space-y-3">
                {PIPELINE_STAGES.map((stage) => {
                  const isCompleted = getStepFromState(workflow.state) > stage.step
                  const isCurrent = getStepFromState(workflow.state) === stage.step
                  const isFailed = workflow.state.includes(`${stage.state}_failed`)

                  return (
                    <div
                      key={stage.step}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      {isCompleted && !isFailed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {isCurrent && !isFailed && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      )}
                      {isFailed && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      {!isCompleted && !isCurrent && !isFailed && (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium">{stage.name}</div>
                        {isCurrent && !isFailed && (
                          <div className="text-sm text-muted-foreground">Processing...</div>
                        )}
                        {isCompleted && !isFailed && (
                          <div className="text-sm text-green-600">Completed</div>
                        )}
                        {isFailed && (
                          <div className="text-sm text-destructive">Failed</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• This process includes keyword expansion, filtering, clustering, and validation</p>
              <p>• You'll be redirected to the approval step when processing is complete</p>
              <p>• You can safely leave this page - the process continues in the background</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
