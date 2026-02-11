'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type {
  DashboardResponse,
  WorkflowDashboardItem,
} from '@/lib/services/intent-engine/workflow-dashboard-service'

const STEP_NARRATIVE = [
  'Authentication',
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
export function WorkflowDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const subscriptionRef = useRef<any>(null)

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
    setupRealtime()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    const res = await fetch('/api/intent/workflows/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  function setupRealtime() {
    subscriptionRef.current = supabase
      .channel('intent_workflows_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'intent_workflows' },
        fetchDashboard
      )
      .subscribe()
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Workflows
          </h1>
          <p className="text-sm text-muted-foreground">
            Ongoing intent research pipelines
          </p>
        </div>

        <Button onClick={() => router.push('/workflows/new')}>
          Create workflow
        </Button>
      </header>

      {/* List */}
      <div className="divide-y rounded-xl border bg-background">
        {data?.workflows.map((workflow) => (
          <WorkflowRow
            key={workflow.id}
            workflow={workflow}
            onContinue={() =>
              router.push(
                `/workflows/${workflow.id}/steps/${workflow.current_step}`
              )
            }
          />
        ))}
      </div>
    </div>
  )
}

function WorkflowRow({
  workflow,
  onContinue,
}: {
  workflow: WorkflowDashboardItem
  onContinue: () => void
}) {
  const stepNumber = parseInt(workflow.current_step, 10) || 1
  const currentIndex = Math.max(0, stepNumber - 1)
  const progress = Math.round((stepNumber / 9) * 100)

  return (
    <div className="flex items-center justify-between px-6 py-5 hover:bg-muted/30 transition">
      {/* Left */}
      <div className="space-y-2 max-w-[70%]">
        <h2 className="font-medium text-base">
          {workflow.name}
        </h2>

        {/* Narrative Progress */}
        <div className="flex items-center gap-2 text-sm">
          {STEP_NARRATIVE.slice(0, 3).map((label, i) => (
            <span
              key={label}
              className={
                i === currentIndex
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              }
            >
              {label}
              {i < 2 && <span className="mx-1">→</span>}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-1 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-2">
        <span className="text-xs text-muted-foreground">
          Updated {new Date(workflow.updated_at).toLocaleDateString()}
        </span>

        <Button size="sm" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}
