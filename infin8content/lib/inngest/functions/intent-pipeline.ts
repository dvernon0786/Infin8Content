/**
 * Intent Pipeline Workers - Steps 4-9
 * Chained Inngest workers for automated workflow execution
 * Each worker includes concurrency guards, FSM validation, and proper error handling
 */

import { inngest } from '@/lib/inngest/client'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { WorkflowEvent } from '@/lib/fsm/workflow-events'
import { 
  expandSeedKeywordsToLongtails
} from '@/lib/services/intent-engine/longtail-keyword-expander'
import { 
  filterKeywords,
  getOrganizationFilterSettings
} from '@/lib/services/intent-engine/keyword-filter'
import { 
  KeywordClusterer
} from '@/lib/services/intent-engine/keyword-clusterer'
import { 
  ClusterValidator
} from '@/lib/services/intent-engine/cluster-validator'
import { 
  KeywordSubtopicGenerator
} from '@/lib/services/keyword-engine/subtopic-generator'
import { 
  queueArticlesForWorkflow
} from '@/lib/services/intent-engine/article-queuing-processor'

// Helper function to get organization ID
async function getOrganizationId(workflowId: string): Promise<string> {
  const { createServiceRoleClient } = require('@/lib/supabase/server')
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('intent_workflows')
    .select('organization_id')
    .eq('id', workflowId)
    .single()
  
  if (error || !data) {
    throw new Error(`Failed to get organization ID for workflow ${workflowId}`)
  }
  
  return data.organization_id
}

/* ================================================================
   SHARED HELPER
================================================================ */

async function guardAndStart(
  workflowId: string,
  expectedIdleState: string,
  startEvent: WorkflowEvent
) {
  const currentState = await WorkflowFSM.getCurrentState(workflowId)

  if (currentState !== expectedIdleState) {
    return { skipped: true, currentState }
  }

  await WorkflowFSM.transition(workflowId, startEvent)
  return { skipped: false }
}

// Step 4: Long-tail Keyword Expansion
export const step4Longtails = inngest.createFunction(
  {
    id: 'intent-step4-longtails',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step4.longtails' },
  async ({ event }) => {
    const workflowId = event.data.workflowId

    const guard = await guardAndStart(
      workflowId,
      'step_4_longtails',
      'LONGTAIL_START'
    )
    if (guard.skipped) return guard

    try {
      await expandSeedKeywordsToLongtails(workflowId)

      await WorkflowFSM.transition(workflowId, 'LONGTAIL_SUCCESS')

      await inngest.send({
        name: 'intent.step5.filtering',
        data: { workflowId }
      })

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'LONGTAIL_FAILED')
      throw error
    }
  }
)

// Step 5: Keyword Filtering
export const step5Filtering = inngest.createFunction(
  {
    id: 'intent-step5-filtering',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step5.filtering' },
  async ({ event }) => {
    const workflowId = event.data.workflowId

    const guard = await guardAndStart(
      workflowId,
      'step_5_filtering',
      'FILTERING_START'
    )
    if (guard.skipped) return guard

    try {
      const { createServiceRoleClient } = require('@/lib/supabase/server')
      const supabase = createServiceRoleClient()

      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('organization_id')
        .eq('id', workflowId)
        .single()

      const orgId = workflow?.organization_id
      if (!orgId) throw new Error('Organization not found')

      const filterOptions = await getOrganizationFilterSettings(orgId)
      await filterKeywords(workflowId, orgId, filterOptions)

      await WorkflowFSM.transition(workflowId, 'FILTERING_SUCCESS')

      await inngest.send({
        name: 'intent.step6.clustering',
        data: { workflowId }
      })

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'FILTERING_FAILED')
      throw error
    }
  }
)

// Step 6: Topic Clustering
export const step6Clustering = inngest.createFunction(
  {
    id: 'intent-step6-clustering',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step6.clustering' },
  async ({ event }) => {
    const workflowId = event.data.workflowId

    const guard = await guardAndStart(
      workflowId,
      'step_6_clustering',
      'CLUSTERING_START'
    )
    if (guard.skipped) return guard

    try {
      const clusterer = new KeywordClusterer()
      await clusterer.clusterKeywords(workflowId)

      await WorkflowFSM.transition(workflowId, 'CLUSTERING_SUCCESS')

      await inngest.send({
        name: 'intent.step7.validation',
        data: { workflowId }
      })

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'CLUSTERING_FAILED')
      throw error
    }
  }
)

// Step 7: Cluster Validation
export const step7Validation = inngest.createFunction(
  {
    id: 'intent-step7-validation',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step7.validation' },
  async ({ event }) => {
    const workflowId = event.data.workflowId

    const guard = await guardAndStart(
      workflowId,
      'step_7_validation',
      'VALIDATION_START'
    )
    if (guard.skipped) return guard

    try {
      const validator = new ClusterValidator()
      await validator.validateWorkflowClusters(workflowId, [], [])

      await WorkflowFSM.transition(workflowId, 'VALIDATION_SUCCESS')

      await inngest.send({
        name: 'intent.step8.subtopics',
        data: { workflowId }
      })

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'VALIDATION_FAILED')
      throw error
    }
  }
)

// Step 8: Subtopic Generation
export const step8Subtopics = inngest.createFunction(
  {
    id: 'intent-step8-subtopics',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step8.subtopics' },
  async ({ event }) => {
    const workflowId = event.data.workflowId

    const guard = await guardAndStart(
      workflowId,
      'step_8_subtopics',
      'SUBTOPICS_START'
    )
    if (guard.skipped) return guard

    try {
      const { createServiceRoleClient } = require('@/lib/supabase/server')
      const supabase = createServiceRoleClient()

      const { data: keywords } = await supabase
        .from('keywords')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('longtail_status', 'completed')
        .eq('subtopics_status', 'not_started')

      const generator = new KeywordSubtopicGenerator()

      if (keywords?.length) {
        for (const keyword of keywords) {
          await generator.generate(keyword.id)
        }
      }

      await WorkflowFSM.transition(workflowId, 'SUBTOPICS_SUCCESS')

      await inngest.send({
        name: 'intent.step9.articles',
        data: { workflowId }
      })

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'SUBTOPICS_FAILED')
      throw error
    }
  }
)

// Step 9: Article Queuing
export const step9Articles = inngest.createFunction(
  {
    id: 'intent-step9-articles',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step9.articles' },
  async ({ event }) => {
    const workflowId = event.data.workflowId

    const guard = await guardAndStart(
      workflowId,
      'step_9_articles',
      'ARTICLES_START'
    )
    if (guard.skipped) return guard

    try {
      await queueArticlesForWorkflow(workflowId)

      await WorkflowFSM.transition(workflowId, 'ARTICLES_SUCCESS')

      return { success: true, articlesQueued: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'ARTICLES_FAILED')
      throw error
    }
  }
)
