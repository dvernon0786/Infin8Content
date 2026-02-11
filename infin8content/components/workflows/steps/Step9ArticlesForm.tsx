'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Step9ArticlesFormProps {
  workflowId: string
}

export function Step9ArticlesForm({ workflowId }: Step9ArticlesFormProps) {
  const [state, setState] = useState<'idle' | 'running' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function runStep() {
    try {
      setState('running')
      setError(null)

      ;(window as any)?.analytics?.track('workflow_step_started', {
        workflow_id: workflowId,
        step: 9,
      })

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/queue-articles`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Step failed')
      }

      ;(window as any)?.analytics?.track('workflow_step_completed', {
        workflow_id: workflowId,
        step: 9,
      })
    } catch (err: any) {
      setState('error')
      setError(err.message)

      ;(window as any)?.analytics?.track('workflow_step_failed', {
        workflow_id: workflowId,
        step: 9,
        error: err.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Queue approved subtopics for article generation and publication.
        This final step prepares your content for the automated article generation pipeline.
      </p>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={runStep}
        disabled={state === 'running'}
        className="min-w-[160px]"
      >
        {state === 'running' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Queueing articles…
          </>
        ) : (
          'Queue articles'
        )}
      </Button>
    </div>
  )
}
