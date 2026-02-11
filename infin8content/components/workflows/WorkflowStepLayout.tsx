'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { WorkflowState } from '@/lib/guards/workflow-step-gate'

interface WorkflowStepLayoutProps {
  workflow: WorkflowState
  step: number
  children: React.ReactNode
}

const STEP_LABELS = {
  1: 'Generate ICP',
  2: 'Analyze Competitors',
  3: 'Extract Seeds',
  4: 'Expand Longtails',
  5: 'Filter Keywords',
  6: 'Cluster Topics',
  7: 'Validate Clusters',
  8: 'Generate Subtopics',
  9: 'Queue Articles',
} as const

export function WorkflowStepLayout({
  workflow,
  step,
  children,
}: WorkflowStepLayoutProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleNext = () => {
    router.push(`/workflows/${workflow.id}/steps/${workflow.current_step}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-3 text-sm text-muted-foreground">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <span>›</span>
            <button
              onClick={() => router.push(`/workflows/${workflow.id}`)}
              className="hover:text-foreground transition-colors"
            >
              {workflow.name}
            </button>
            <span>›</span>
            <span className="text-foreground font-medium">
              Step {step}: {STEP_LABELS[step as keyof typeof STEP_LABELS]}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Step Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {workflow.current_step} of 9
            </span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(workflow.current_step / 9) * 100}%` }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold">
            {STEP_LABELS[step as keyof typeof STEP_LABELS]}
          </h1>
        </header>

        {/* Step Content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Navigation Footer */}
        <footer className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Back to Dashboard' : 'Previous Step'}
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {step} of 9
          </div>

          <Button
            onClick={handleNext}
            disabled={step >= 9}
            className="gap-2"
          >
            Next Step
            <ArrowRight className="w-4 h-4" />
          </Button>
        </footer>
      </div>
    </div>
  )
}
