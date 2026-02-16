'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  DashboardResponse,
  WorkflowDashboardItem,
} from '@/lib/services/intent-engine/workflow-dashboard-service'

// Pure FSM state order for step calculation
const STATE_ORDER: string[] = [
  'step_1_icp',
  'step_2_competitors', 
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation',
  'step_8_subtopics',
  'step_9_articles',
  'completed'
]

// Helper function to get step number from state
function getStateStepNumber(state: string): number {
  const index = STATE_ORDER.indexOf(state)
  return index >= 0 ? index + 1 : 1
}

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

function getNarrative(step: number) {
  return STEP_NARRATIVE.map((label, i) => ({
    label,
    state:
      i + 1 < step ? 'done' :
      i + 1 === step ? 'current' :
      'upcoming',
  }))
}

function EmptyState() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h2 className="text-xl font-medium tracking-tight">
        No workflows yet
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create your first intent workflow to start discovering
        topics worth ranking for.
      </p>
      <Button className="mt-6" onClick={() => router.push('/workflows/new')}>
        Create workflow
      </Button>
    </div>
  )
}
export function WorkflowDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const subscriptionRef = useRef<any>(null)

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    fetchDashboard()
    setupRealtime()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!data?.workflows.length) return
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(i => Math.min(i + 1, data.workflows.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(i => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [data])

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
      {data?.workflows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y rounded-xl border bg-background">
          {data?.workflows.map((workflow, i) => (
            <WorkflowRow
              key={workflow.id}
              workflow={workflow}
              isFocused={i === focusedIndex}
              onFocus={() => setFocusedIndex(i)}
              onContinue={() =>
                router.push(
                  `/workflows/${workflow.id}/steps/${getStateStepNumber(workflow.state)}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkflowRow({
  workflow,
  onContinue,
  isFocused,
  onFocus,
}: {
  workflow: WorkflowDashboardItem
  onContinue: () => void
  isFocused: boolean
  onFocus: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const stepNumber = getStateStepNumber(workflow.state)
  const narrative = getNarrative(stepNumber)
  const progress = Math.round((stepNumber / 9) * 100)
  const showExpanded = hovered || isFocused

  return (
    <div
      tabIndex={0}
      onFocus={onFocus}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => e.key === 'Enter' && onContinue()}
      className={cn(
        'group relative px-6 py-5 outline-none transition',
        'hover:bg-muted/30 focus:bg-muted/30',
        'focus-visible:ring-1 focus-visible:ring-muted-foreground/20'
      )}
    >
      <div className="flex items-start justify-between gap-6">
        {/* LEFT */}
        <div className="space-y-2 max-w-[70%]">
          <h3 className="font-medium leading-tight">
            {workflow.name}
          </h3>

          {/* Narrative */}
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
            {narrative
              .slice(0, showExpanded ? narrative.length : 3)
              .map((step, i) => (
                <span
                  key={step.label}
                  className={cn(
                    step.state === 'current' && 'font-medium text-foreground',
                    step.state !== 'current' && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                  {i < narrative.length - 1 && ' →'}
                </span>
              ))}

            {!showExpanded && narrative.length > 3 && (
              <span className="text-muted-foreground">…</span>
            )}
          </div>

          {/* Hover detail */}
          {showExpanded && (
            <p className="text-xs text-muted-foreground">
              Currently working on <strong>{STEP_NARRATIVE[stepNumber - 1]}</strong>
            </p>
          )}

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-muted">
            <div
              className={cn(
                'h-1 rounded-full bg-primary transition-all',
                PROGRESS_WIDTH[stepNumber - 1] ?? 'w-[11%]'
              )}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            Updated {new Date(workflow.updated_at).toLocaleDateString()}
          </span>

          <button
            onClick={onContinue}
            className={cn(
              'text-sm font-medium',
              'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
              'transition-opacity'
            )}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
