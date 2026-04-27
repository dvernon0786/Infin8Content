'use client'

import { useEffect, useState, use } from 'react'
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

const RANDOM_MESSAGES = [
  '🧠 Teaching AI to think about keywords...',
  '🔍 Scanning the internet for insights...',
  '⚡ Boosting your SEO superpowers...',
  '🚀 Launching keyword expansion protocols...',
  '🎯 Zeroing in on perfect keywords...',
  '💡 Generating brilliant ideas...',
  '🔗 Connecting the dots between topics...',
  '🌟 Making magic happen...',
  '⏳ Brewing the perfect keyword strategy...',
  '🎨 Painting your content roadmap...',
  '🧩 Fitting puzzle pieces together...',
  '💫 Sprinkling SEO dust...',
  '🔬 Running keyword experiments...',
  '📊 Crunching numbers like a boss...',
  '🌍 Analyzing global trends...',
  '🎪 Building your keyword circus...',
  '🎭 Orchestrating the perfect strategy...',
  '⚙️ Fine-tuning the algorithm...',
  '🏗️ Constructing your keyword empire...',
  '🎸 Harmonizing your content strategy...',
]

export default function WorkflowProgressPage({ params }: WorkflowProgressPageProps) {
  const router = useRouter()
  const [workflow, setWorkflow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  const workflowId = use(params).id

  // Change random message every 3 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % RANDOM_MESSAGES.length)
    }, 3000)

    return () => clearInterval(messageInterval)
  }, [])

  // Poll workflow state every 2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout
    let isMounted = true

    const pollWorkflow = async () => {
      try {
        const response = await fetch(`/api/intent/workflows/${workflowId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch workflow status')
        }

        const data = await response.json()
        if (!isMounted) return

        setWorkflow(data.workflow)

        const state = data.workflow?.state
        if (!state) return

        // Stop polling on failure states
        if (state.includes('_FAILED')) {
          clearInterval(interval)
          return
        }

        const currentStep = getStepFromState(state)

        // Redirect to Step 8 when pipeline is complete
        if (currentStep === 8) {
          clearInterval(interval)
          router.replace(`/workflows/${workflowId}/steps/8`)
          return
        }

        // Redirect to completion when everything is done
        if (state === 'completed') {
          clearInterval(interval)
          router.replace(`/workflows/${workflowId}/completed`)
          return
        }

      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    pollWorkflow()
    interval = setInterval(pollWorkflow, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
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

  const state = workflow?.state
  if (!state) return null

  const currentStep = getStepFromState(state)
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
      <div className="mx-auto max-w-3xl px-6 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        {/* Failure State */}
        {failedStage && (
          <Card className="w-full max-w-md border-destructive/30 bg-destructive/5">
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

        {/* Generating Button */}
        {!failedStage && (
          <div className="flex flex-col items-center gap-6">
            <Button
              disabled
              style={{
                background: '#4f6ef7',
                color: '#ffffff',
              }}
              className="px-8 py-6 rounded-full text-lg shadow-lg"
            >
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Generating
            </Button>
            <p className="text-muted-foreground text-center max-w-sm h-6 transition-opacity duration-500">
              {RANDOM_MESSAGES[messageIndex]}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
