'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Step9ArticlesFormProps {
  workflowId: string
  workflowState?: string
}

export function Step9ArticlesForm({ workflowId, workflowState }: Step9ArticlesFormProps) {
  const [state, setState] = useState<'running' | 'completed' | 'error'>('running')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we're already passed step 9, show completed immediately
    if (workflowState === 'completed' || workflowState === 'step_9_articles_queued') {
      setState('completed')
    } else if (workflowState === 'step_9_articles_failed') {
      setState('error')
      setError('Article queuing failed.')
    } else {
      // Poll workflow state every 3 seconds to get actual completion status from FSM
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/intent/workflows/${workflowId}`)
          if (res.ok) {
            try {
              const text = await res.text()
              const data = JSON.parse(text)
              if (data.state === 'completed' || data.state === 'step_9_articles_queued') {
                setState('completed')
                clearInterval(interval)

                  ; (window as any)?.analytics?.track('workflow_step_completed', {
                    workflow_id: workflowId,
                    step: 9,
                  })
              } else if (data.state === 'step_9_articles_failed') {
                setState('error')
                setError('Article queuing failed. Please check the logs.')
                clearInterval(interval)
              }
            } catch (parseError) {
              // Ignore bad JSON payloads to prevent UI crash
            }
          }
        } catch (e) {
          // Ignore network errors during polling to prevent crashes
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [workflowId, workflowState])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Queueing approved subtopics for article generation and publication.
        This final step prepares your content for the automated article generation pipeline.
      </p>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm flex items-center">
          <AlertCircle className="h-5 w-5 text-destructive mr-2" />
          <span className="text-destructive font-medium">{error}</span>
        </div>
      ) : state === 'completed' ? (
        <div className="rounded-md border border-green-300/30 bg-green-50 p-4 text-sm flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Articles have been successfully queued for generation!</span>
        </div>
      ) : (
        <div className="rounded-md border bg-muted/50 p-4 text-sm flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Automatically queueing articles...</span>
        </div>
      )}
    </div>
  )
}
