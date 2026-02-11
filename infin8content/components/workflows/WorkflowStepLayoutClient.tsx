'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { WorkflowState } from '@/lib/guards/workflow-step-gate'
import { cn } from '@/lib/utils'

interface WorkflowStepLayoutClientProps {
  workflow: WorkflowState
  step: number
  children: React.ReactNode
}

const STEP_NARRATIVE = [
  'ICP',
  'Competitors',
  'Seeds',
  'Longtails',
  'Filtering',
  'Clustering',
  'Validation',
  'Subtopics',
  'Articles',
]

const PROGRESS_WIDTH = [
  'w-[11%]',
  'w-[22%]',
  'w-[33%]',
  'w-[44%]',
  'w-[55%]',
  'w-[66%]',
  'w-[77%]',
  'w-[88%]',
  'w-full',
]

export function WorkflowStepLayoutClient({
  workflow,
  step,
  children,
}: WorkflowStepLayoutClientProps) {
  const router = useRouter()
  const stepIndex = workflow.current_step - 1

  // Analytics: page viewed
  useEffect(() => {
    ;(window as any)?.analytics?.track('workflow_step_viewed', {
      workflow_id: workflow.id,
      step: workflow.current_step,
    })
  }, [workflow.id, workflow.current_step])

  // Auto-advance if backend progressed beyond current step
  useEffect(() => {
    if (workflow.current_step > step) {
      router.replace(`/workflows/${workflow.id}/steps/${workflow.current_step}`)
    }
  }, [workflow.current_step, step, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-3 text-sm text-muted-foreground flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="hover:text-foreground transition"
          >
            ← Back to dashboard
          </button>

          <span className="font-medium text-foreground">
            {workflow.name}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        {/* Step header */}
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {STEP_NARRATIVE[step - 1]}
          </h1>

          {/* Narrative progress */}
          <div className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
            {STEP_NARRATIVE.map((label, i) => (
              <span
                key={label}
                className={cn(
                  i === step - 1 && 'font-medium text-foreground',
                  i !== step - 1 && 'opacity-70'
                )}
              >
                {label}
                {i < STEP_NARRATIVE.length - 1 && ' →'}
              </span>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-1 rounded-full bg-primary transition-all',
                PROGRESS_WIDTH[step - 1] ?? 'w-[11%]'
              )}
              role="progressbar"
              aria-valuenow={workflow.current_step}
              aria-valuemin={1}
              aria-valuemax={9}
            />
          </div>
        </header>

        {/* Failure state */}
        {workflow.status === 'failed' && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">
              This step failed
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              An error occurred while processing this step. Please try again or contact support if the issue persists.
            </p>
          </div>
        )}

        {/* Step content */}
        <section className="space-y-8">
          {children}
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>

          <span className="text-sm text-muted-foreground">
            Step {workflow.current_step} of 9
          </span>

          <Button
            onClick={() =>
              router.push(
                `/workflows/${workflow.id}/steps/${workflow.current_step}` 
              )
            }
            disabled={workflow.current_step >= 9}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </footer>
      </div>
    </div>
  )
}
