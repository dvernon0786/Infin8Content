/**
 * Intent Pipeline Workers - Steps 4-9
 * Chained Inngest workers for automated workflow execution
 * Each worker includes concurrency guards, FSM validation, and proper error handling
 */

import { inngest } from '@/lib/inngest/client'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'
import { WorkflowEvent } from '@/lib/fsm/workflow-events'
import { createServiceRoleClient } from '@/lib/supabase/server'
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
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('intent_workflows')
    .select('organization_id')
    .eq('id', workflowId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to get organization ID for workflow ${workflowId}`)
  }

  return (data as any).organization_id
}

/* ================================================================
   PURE MINIMAL WORKERS
   No guardAndStart - transition-driven only
================================================================ */

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
    console.log(`🚨🚨🚨 [Inngest step4Longtails] WORKER TRIGGERED for workflow ${workflowId} 🚨🚨🚨`)

    // Pure minimal: transition-driven only (no race window)
    const start = await transitionWithAutomation(workflowId, 'LONGTAIL_START', SYSTEM_USER_ID)
    if (!start.success) {
      console.log(`⚠️⚠️⚠️ [Inngest step4Longtails] SKIPPED workflow ${workflowId} - transition not applied`)
      return { skipped: true }
    }

    try {
      await expandSeedKeywordsToLongtails(workflowId)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'LONGTAIL_SUCCESS', SYSTEM_USER_ID)

      if (!result.success) {
        const isConcurrent = result.error?.includes('concurrent') || result.error?.includes('not applied')
        if (isConcurrent) {
          console.log(`⚠️⚠️⚠️ [Inngest step4Longtails] SKIPPED workflow ${workflowId} - concurrent SUCCESS transition`)
          return { skipped: true }
        }
        throw new Error(result.error || 'Failed to transition LONGTAIL_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await transitionWithAutomation(workflowId, 'LONGTAIL_FAILED', SYSTEM_USER_ID)
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

    // Pure minimal: transition-driven only (no race window)
    const start = await transitionWithAutomation(workflowId, 'FILTERING_START', SYSTEM_USER_ID)
    if (!start.success) return { skipped: true }

    try {
      const orgId = await getOrganizationId(workflowId)
      const filterOptions = await getOrganizationFilterSettings()
      await filterKeywords(workflowId, orgId, filterOptions)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'FILTERING_SUCCESS', SYSTEM_USER_ID)

      if (!result.success) {
        const isConcurrent = result.error?.includes('concurrent') || result.error?.includes('not applied')
        if (isConcurrent) {
          console.log(`⚠️⚠️⚠️ [Inngest step5Filtering] SKIPPED workflow ${workflowId} - concurrent SUCCESS transition`)
          return { skipped: true }
        }
        throw new Error(result.error || 'Failed to transition FILTERING_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await transitionWithAutomation(workflowId, 'FILTERING_FAILED', SYSTEM_USER_ID)
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

    // Pure minimal: transition-driven only (no race window)
    const start = await transitionWithAutomation(workflowId, 'CLUSTERING_START', SYSTEM_USER_ID)
    if (!start.success) return { skipped: true }

    try {
      const clusterer = new KeywordClusterer()
      await clusterer.clusterKeywords(workflowId)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'CLUSTERING_SUCCESS', SYSTEM_USER_ID)

      if (!result.success) {
        const isConcurrent = result.error?.includes('concurrent') || result.error?.includes('not applied')
        if (isConcurrent) {
          console.log(`⚠️⚠️⚠️ [Inngest step6Clustering] SKIPPED workflow ${workflowId} - concurrent SUCCESS transition`)
          return { skipped: true }
        }
        throw new Error(result.error || 'Failed to transition CLUSTERING_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await transitionWithAutomation(workflowId, 'CLUSTERING_FAILED', SYSTEM_USER_ID)
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

    // Pure minimal: transition-driven only (no race window)
    const start = await transitionWithAutomation(workflowId, 'VALIDATION_START', SYSTEM_USER_ID)
    if (!start.success) return { skipped: true }

    try {
      const supabase = createServiceRoleClient()

      // First get organization_id from workflow for enterprise isolation
      const { data: workflow, error: workflowError } = await supabase
        .from('intent_workflows')
        .select('organization_id')
        .eq('id', workflowId)
        .single()

      if (workflowError || !workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      // Type guard for organization_id
      const typedWorkflow = workflow as unknown as { organization_id: string }

      // Fetch clusters and keywords for validation
      const { data: clusters } = await supabase
        .from('topic_clusters')
        .select('hub_keyword_id, spoke_keyword_id, similarity_score')
        .eq('workflow_id', workflowId)

      const { data: keywords } = await supabase
        .from('keywords')
        .select('id, keyword')
        .eq('workflow_id', workflowId)

      if (!clusters?.length || !keywords?.length) {
        throw new Error('No clusters or keywords found for validation')
      }

      const validator = new ClusterValidator()
      await validator.validateWorkflowClusters(workflowId, clusters as any, keywords as any)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'VALIDATION_SUCCESS', SYSTEM_USER_ID)

      if (!result.success) {
        const isConcurrent = result.error?.includes('concurrent') || result.error?.includes('not applied')
        if (isConcurrent) {
          console.log(`⚠️⚠️⚠️ [Inngest step7Validation] SKIPPED workflow ${workflowId} - concurrent SUCCESS transition`)
          return { skipped: true }
        }
        throw new Error(result.error || 'Failed to transition VALIDATION_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await transitionWithAutomation(workflowId, 'VALIDATION_FAILED', SYSTEM_USER_ID)
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

    // Pure minimal: transition-driven only (no race window)
    const start = await transitionWithAutomation(workflowId, 'SUBTOPICS_START', SYSTEM_USER_ID)
    if (!start.success) return { skipped: true }

    try {
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
          const subtopics = await generator.generate((keyword as any).id)
          await generator.store((keyword as any).id, subtopics)
        }
      }

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'SUBTOPICS_SUCCESS', SYSTEM_USER_ID)

      if (!result.success) {
        const isConcurrent = result.error?.includes('concurrent') || result.error?.includes('not applied')
        if (isConcurrent) {
          console.log(`⚠️⚠️⚠️ [Inngest step8Subtopics] SKIPPED workflow ${workflowId} - concurrent SUCCESS transition`)
          return { skipped: true }
        }
        throw new Error(result.error || 'Failed to transition SUBTOPICS_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await transitionWithAutomation(workflowId, 'SUBTOPICS_FAILED', SYSTEM_USER_ID)
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

    // Check state to properly handle retries
    const { getWorkflowState } = await import('@/lib/fsm/unified-workflow-engine')
    const currentState = await getWorkflowState(workflowId)

    const startEvent = currentState === 'step_9_articles_failed'
      ? 'ARTICLES_RETRY'
      : 'ARTICLES_START'

    // Pure minimal: transition-driven only (no race window)
    const start = await transitionWithAutomation(workflowId, startEvent, SYSTEM_USER_ID)
    if (!start.success) {
      console.log(`[Step9] Skipping due to failed transition: ${start.error}`)
      return { skipped: true }
    }

    try {
      const organizationId = await getOrganizationId(workflowId)
      const queueingResult = await queueArticlesForWorkflow(workflowId)

      // 🟠 PRODUCTION HARDENING: Prevent ghost triggers if no articles created
      if (queueingResult.articles_created === 0) {
        console.log(`[Step9] No articles created for workflow ${workflowId}, skipping generation trigger`)
        await transitionWithAutomation(workflowId, 'ARTICLES_SUCCESS', SYSTEM_USER_ID)
        return { success: true }
      }

      // 🎯 AUTOMATION TRIGGER: Kick off generation for each newly created article
      // This ensures we run the worker on the EXACT IDs that just had sections seeded.
      if (queueingResult.articles && queueingResult.articles.length > 0) {
        console.log(`[Step9] Triggering generation for ${queueingResult.articles.length} articles for org ${organizationId}`)

        // Batch trigger generation events
        const generationEvents = queueingResult.articles.map(article => ({
          name: 'article/generate',
          data: {
            articleId: article.id,
            workflowId: workflowId,
            organizationId: organizationId
          }
        }))

        // 🔎 PHASE 5 — Race Condition Check
        await new Promise(r => setTimeout(r, 500))

        await inngest.send(generationEvents)
      }

      await transitionWithAutomation(workflowId, 'ARTICLES_SUCCESS', SYSTEM_USER_ID)

      return {
        success: true,
        articlesQueued: queueingResult.articles_created,
        articles: queueingResult.articles.map(a => a.id)
      }

    } catch (error) {
      await transitionWithAutomation(workflowId, 'ARTICLES_FAILED', SYSTEM_USER_ID)
      throw error
    }
  }
)

// Step 10: Workflow Completion Handler
export const workflowCompleted = inngest.createFunction(
  {
    id: 'intent-workflow-completed',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'WORKFLOW_COMPLETED' },
  async ({ event }) => {
    const workflowId = event.data.workflowId
    console.log(`🏁 [Inngest workflowCompleted] WORKFLOW_COMPLETED received for workflow ${workflowId}`)

    // This handler completes the two-step transition:
    // 1. ARTICLES_SUCCESS moved state to 'step_9_articles_queued'
    // 2. WORKFLOW_COMPLETED moves state to 'completed'

    const supabase = createServiceRoleClient()
    const { data: workflow, error } = await supabase
      .from('intent_workflows')
      .select('state')
      .eq('id', workflowId)
      .single()

    if (error) {
      console.error(`❌ [Inngest workflowCompleted] Error fetching workflow ${workflowId}:`, error)
      return { success: false, error: error.message }
    }

    // Type assertion to handle TypeScript inference issue
    const workflowState = (workflow as any)?.state

    if (workflowState === 'completed') {
      console.log(`✅ [Inngest workflowCompleted] Workflow ${workflowId} is already in completed state`)
      return { success: true, alreadyCompleted: true }
    }

    console.log(`📍 [Inngest workflowCompleted] Workflow ${workflowId} current state: ${workflowState}`)

    // Transition to completed state
    const transitionResult = await transitionWithAutomation(workflowId, 'WORKFLOW_COMPLETED', SYSTEM_USER_ID)

    if (transitionResult.success) {
      console.log(`🎉 [Inngest workflowCompleted] Workflow ${workflowId} successfully transitioned to completed state`)
      return { success: true, transitioned: true, fromState: workflowState }
    } else {
      console.log(`⚠️ [Inngest workflowCompleted] Workflow ${workflowId} transition failed:`, transitionResult.error)
      return { success: false, error: transitionResult.error, fromState: workflowState }
    }
  }
)

