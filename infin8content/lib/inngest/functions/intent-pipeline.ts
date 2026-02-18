/**
 * Intent Pipeline Workers - Steps 4-9
 * Chained Inngest workers for automated workflow execution
 * Each worker includes concurrency guards, FSM validation, and proper error handling
 */

import { inngest } from '@/lib/inngest/client'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
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
    const start = await WorkflowFSM.transition(workflowId, 'LONGTAIL_START', {
      userId: 'system'
    })
    if (!start.applied) {
      console.log(`⚠️⚠️⚠️ [Inngest step4Longtails] SKIPPED workflow ${workflowId} - transition not applied`)
      return { skipped: true }
    }

    try {
      await expandSeedKeywordsToLongtails(workflowId)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'LONGTAIL_SUCCESS', 'system')
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to transition LONGTAIL_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'LONGTAIL_FAILED', {
        userId: 'system'
      })
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
    const start = await WorkflowFSM.transition(workflowId, 'FILTERING_START', {
      userId: 'system'
    })
    if (!start.applied) return { skipped: true }

    try {
      const orgId = await getOrganizationId(workflowId)
      const filterOptions = await getOrganizationFilterSettings()
      await filterKeywords(workflowId, orgId, filterOptions)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'FILTERING_SUCCESS', 'system')
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to transition FILTERING_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'FILTERING_FAILED', {
        userId: 'system'
      })
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
    const start = await WorkflowFSM.transition(workflowId, 'CLUSTERING_START', {
      userId: 'system'
    })
    if (!start.applied) return { skipped: true }

    try {
      const clusterer = new KeywordClusterer()
      await clusterer.clusterKeywords(workflowId)

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'CLUSTERING_SUCCESS', 'system')
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to transition CLUSTERING_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'CLUSTERING_FAILED', {
        userId: 'system'
      })
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
    const start = await WorkflowFSM.transition(workflowId, 'VALIDATION_START', {
      userId: 'system'
    })
    if (!start.applied) return { skipped: true }

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
      const result = await transitionWithAutomation(workflowId, 'VALIDATION_SUCCESS', 'system')
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to transition VALIDATION_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'VALIDATION_FAILED', {
        userId: 'system'
      })
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
    const start = await WorkflowFSM.transition(workflowId, 'SUBTOPICS_START', {
      userId: 'system'
    })
    if (!start.applied) return { skipped: true }

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
          await generator.generate((keyword as any).id)
        }
      }

      // Unified transition - automatic event emission guaranteed
      const result = await transitionWithAutomation(workflowId, 'SUBTOPICS_SUCCESS', 'system')
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to transition SUBTOPICS_SUCCESS')
      }

      return { success: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'SUBTOPICS_FAILED', {
        userId: 'system'
      })
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

    // Pure minimal: transition-driven only (no race window)
    const start = await WorkflowFSM.transition(workflowId, 'ARTICLES_START', {
      userId: 'system'
    })
    if (!start.applied) return { skipped: true }

    try {
      await queueArticlesForWorkflow(workflowId)

      await WorkflowFSM.transition(workflowId, 'ARTICLES_SUCCESS', {
        userId: 'system'
      })

      return { success: true, articlesQueued: true }

    } catch (error) {
      await WorkflowFSM.transition(workflowId, 'ARTICLES_FAILED', {
        userId: 'system'
      })
      throw error
    }
  }
)

