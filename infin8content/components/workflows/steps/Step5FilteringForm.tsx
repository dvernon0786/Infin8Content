'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Step5FilteringFormProps {
  workflowId: string
}

export function Step5FilteringForm({ workflowId }: Step5FilteringFormProps) {
  const [state, setState] = useState<'idle' | 'running' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function runStep() {
    try {
      setState('running')
      setError(null)

      ;(window as any)?.analytics?.track('workflow_step_started', {
        workflow_id: workflowId,
        step: 5,
      })

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/filter-keywords`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Step failed')
      }

      ;(window as any)?.analytics?.track('workflow_step_completed', {
        workflow_id: workflowId,
        step: 5,
      })
    } catch (err: any) {
      setState('error')
      setError(err.message)

      ;(window as any)?.analytics?.track('workflow_step_failed', {
        workflow_id: workflowId,
        step: 5,
        error: err.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Filter keywords based on relevance, search volume, and competition metrics.
        This step ensures only high-quality keywords proceed to the clustering phase.
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
            Filtering keywords…
          </>
        ) : (
          'Filter keywords'
        )}
      </Button>
    </div>
  )
}
