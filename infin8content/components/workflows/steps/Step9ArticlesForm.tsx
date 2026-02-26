'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Step9ArticlesFormProps {
  workflowId: string
  workflowState?: string
}

export function Step9ArticlesForm({ workflowId, workflowState }: Step9ArticlesFormProps) {
  const [state, setState] = useState<'running' | 'completed' | 'error'>('running')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // 🚀 REDIRECT: Step 9 terminal state is queueing. Redirect to articles dashboard.
    if (workflowState === 'completed' || workflowState === 'step_9_articles_queued') {
      router.push('/dashboard/articles')
      return
    }

    if (workflowState === 'step_9_articles_failed') {
      setState('error')
      setError('Article queuing failed.')
      return
    }

    // 📡 REALTIME SUBSCRIPTION: Listen for workflow state changes directly
    const channel = supabase
      .channel(`workflow-status-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'intent_workflows',
          filter: `id=eq.${workflowId}`
        },
        (payload) => {
          const newState = payload.new.state
          if (newState === 'completed' || newState === 'step_9_articles_queued') {
            setState('completed')
            router.push('/dashboard/articles')
          } else if (newState === 'step_9_articles_failed') {
            setState('error')
            setError('Article queuing failed.')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workflowId, workflowState, router, supabase])


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
