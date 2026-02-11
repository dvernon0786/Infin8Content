'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Step4LongtailsFormProps {
  workflowId: string
}

export function Step4LongtailsForm({ workflowId }: Step4LongtailsFormProps) {
  const [state, setState] = useState<'idle' | 'running' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function runStep() {
    try {
      setState('running')
      setError(null)

      ;(window as any)?.analytics?.track('workflow_step_started', {
        workflow_id: workflowId,
        step: 4,
      })

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/longtail-expand`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Step failed')
      }

      ;(window as any)?.analytics?.track('workflow_step_completed', {
        workflow_id: workflowId,
        step: 4,
      })
    } catch (err: any) {
      setState('error')
      setError(err.message)

      ;(window as any)?.analytics?.track('workflow_step_failed', {
        workflow_id: workflowId,
        step: 4,
        error: err.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Expand seed keywords into long-tail variations using multiple intelligence sources.
        This step generates up to 12 long-tail keywords per seed using DataForSEO's comprehensive keyword data.
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
            Expanding longtails…
          </>
        ) : (
          'Expand longtails'
        )}
      </Button>
    </div>
  )
}
