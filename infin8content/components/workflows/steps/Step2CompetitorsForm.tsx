'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Step2CompetitorsFormProps {
  workflowId: string
}

export function Step2CompetitorsForm({ workflowId }: Step2CompetitorsFormProps) {
  const [state, setState] = useState<'idle' | 'running' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function runStep() {
    try {
      setState('running')
      setError(null)

      ;(window as any)?.analytics?.track('workflow_step_started', {
        workflow_id: workflowId,
        step: 2,
      })

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/competitor-analyze`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Step failed')
      }

      ;(window as any)?.analytics?.track('workflow_step_completed', {
        workflow_id: workflowId,
        step: 2,
      })
    } catch (err: any) {
      setState('error')
      setError(err.message)

      ;(window as any)?.analytics?.track('workflow_step_failed', {
        workflow_id: workflowId,
        step: 2,
        error: err.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Analyze competitor websites to extract seed keywords for your SEO strategy.
        This step uses DataForSEO to identify high-value keywords from competitor domains.
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
            Analyzing competitors…
          </>
        ) : (
          'Analyze competitors'
        )}
      </Button>
    </div>
  )
}
