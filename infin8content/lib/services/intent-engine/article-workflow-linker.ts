import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from './intent-audit-logger'
import { AuditAction } from '@/types/audit'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'

export interface LinkingResult {
  workflow_id: string
  workflow_state: string
  linking_status: 'completed' | 'completed_with_failures'
  total_articles: number
  linked_articles: number
  failed_articles: number
  processing_time_seconds: number
}

interface WorkflowRow {
  id: string
  state: string
  organization_id: string
}

export async function linkArticlesToWorkflow(
  workflowId: string,
  userId: string
): Promise<LinkingResult> {
  const supabase = createServiceRoleClient()
  const startTime = Date.now()

  // 1️⃣ Strict workflow state validation
  const { data: workflow, error } = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id')
    .eq('id', workflowId)
    .single() as { data: WorkflowRow | null; error: any }

  if (error || !workflow) {
    throw new Error('Workflow not found')
  }

  const typedWorkflow = workflow as unknown as WorkflowRow

  if (typedWorkflow.state !== 'step_9_articles') {
    throw new Error(
      `Workflow must be at step_9_articles. Current state: ${typedWorkflow.state}` 
    )
  }

  // 2️⃣ Fetch articles ready for linking
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, workflow_link_status')
    .eq('intent_workflow_id', workflowId)
    .in('status', ['completed', 'published'])
    .eq('workflow_link_status', 'not_linked')

  if (articlesError) {
    throw articlesError
  }

  const typedArticles = (articles || []) as unknown as Array<{
    id: string
    workflow_link_status: string
  }>

  const total = typedArticles.length ?? 0
  let linked = 0
  let failed = 0

  for (const article of typedArticles) {
    try {
      const { error: linkError } = await supabase
        .from('articles')
        .update({
          workflow_link_status: 'linked',
          linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)
        .eq('workflow_link_status', 'not_linked')

      if (linkError) {
        failed++
        continue
      }

      linked++

      await logIntentAction({
        organizationId: typedWorkflow.organization_id,
        workflowId,
        entityType: 'article',
        entityId: article.id,
        actorId: userId,
        action: AuditAction.WORKFLOW_ARTICLE_LINKED,
        details: {},
      })
    } catch {
      failed++
    }
  }

  // 3️⃣ LINKER LAYER: Only responsible for linking articles, NOT completing workflow
  // Terminal completion is driven by the article generation pipeline via ProgressService

  // For state query, we need to use internal FSM since unified engine doesn't export getCurrentState
  const { InternalWorkflowFSM } = await import('@/lib/fsm/fsm.internal')
  const currentState = await InternalWorkflowFSM.getCurrentState(workflowId)

  return {
    workflow_id: workflowId,
    workflow_state: currentState,
    linking_status:
      failed > 0 ? 'completed_with_failures' : 'completed',
    total_articles: total,
    linked_articles: linked,
    failed_articles: failed,
    processing_time_seconds: (Date.now() - startTime) / 1000,
  }
}
