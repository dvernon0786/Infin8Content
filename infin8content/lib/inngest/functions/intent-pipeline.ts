/**
 * Intent Pipeline Workers - Steps 4-9
 * Chained Inngest workers for automated workflow execution
 * Each worker includes concurrency guards, FSM validation, and proper error handling
 */

import { inngest } from '@/lib/inngest/client'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
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

// Step 4: Long-tail Keyword Expansion
export const step4Longtails = inngest.createFunction(
  {
    id: 'intent-step4-longtails',
    concurrency: { limit: 1, key: 'event.data.workflowId' },
    retries: 2
  },
  { event: 'intent.step4.longtails' },
  async ({ event, step }) => {
    const workflowId = event.data.workflowId
    
    console.log(`[Step4] Starting long-tail expansion for workflow ${workflowId}`)
    
    // FSM Guard - ensure we're in running state
    const currentState = await WorkflowFSM.getCurrentState(workflowId)
    if (currentState !== 'step_4_longtails_running') {
      console.log(`[Step4] Skipping - invalid state: ${currentState}`)
      return { skipped: true, currentState }
    }
    
    try {
      // Run existing service (no changes to service logic)
      await expandSeedKeywordsToLongtails(workflowId)
      
      // Transition to completed
      await WorkflowFSM.transition(workflowId, 'LONGTAIL_SUCCESS')
      console.log(`[Step4] Completed successfully for workflow ${workflowId}`)
      
      // Trigger next step
      await inngest.send({
        name: 'intent.step5.filtering',
        data: { workflowId }
      })
      
      return { success: true, workflowId }
      
    } catch (error) {
      console.error(`[Step4] Failed for workflow ${workflowId}:`, error)
      
      // Transition to failed state
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
  async ({ event, step }) => {
    const workflowId = event.data.workflowId
    
    console.log(`[Step5] Starting filtering for workflow ${workflowId}`)
    
    // FSM Guard
    const currentState = await WorkflowFSM.getCurrentState(workflowId)
    if (currentState !== 'step_5_filtering_running') {
      console.log(`[Step5] Skipping - invalid state: ${currentState}`)
      return { skipped: true, currentState }
    }
    
    try {
      // Run filtering service
      const orgId = await getOrganizationId(workflowId)
      const filterOptions = await getOrganizationFilterSettings(orgId)
      await filterKeywords(workflowId, orgId, filterOptions)
      
      // Transition to completed
      await WorkflowFSM.transition(workflowId, 'FILTERING_SUCCESS')
      console.log(`[Step5] Completed successfully for workflow ${workflowId}`)
      
      // Trigger next step
      await inngest.send({
        name: 'intent.step6.clustering',
        data: { workflowId }
      })
      
      return { success: true, workflowId }
      
    } catch (error) {
      console.error(`[Step5] Failed for workflow ${workflowId}:`, error)
      
      // Transition to failed state
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
  async ({ event, step }) => {
    const workflowId = event.data.workflowId
    
    console.log(`[Step6] Starting clustering for workflow ${workflowId}`)
    
    // FSM Guard
    const currentState = await WorkflowFSM.getCurrentState(workflowId)
    if (currentState !== 'step_6_clustering_running') {
      console.log(`[Step6] Skipping - invalid state: ${currentState}`)
      return { skipped: true, currentState }
    }
    
    try {
      // Run clustering service
      const clusterer = new KeywordClusterer()
      await clusterer.clusterKeywords(workflowId)
      
      // Transition to completed
      await WorkflowFSM.transition(workflowId, 'CLUSTERING_SUCCESS')
      console.log(`[Step6] Completed successfully for workflow ${workflowId}`)
      
      // Trigger next step
      await inngest.send({
        name: 'intent.step7.validation',
        data: { workflowId }
      })
      
      return { success: true, workflowId }
      
    } catch (error) {
      console.error(`[Step6] Failed for workflow ${workflowId}:`, error)
      
      // Transition to failed state
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
  async ({ event, step }) => {
    const workflowId = event.data.workflowId
    
    console.log(`[Step7] Starting validation for workflow ${workflowId}`)
    
    // FSM Guard
    const currentState = await WorkflowFSM.getCurrentState(workflowId)
    if (currentState !== 'step_7_validation_running') {
      console.log(`[Step7] Skipping - invalid state: ${currentState}`)
      return { skipped: true, currentState }
    }
    
    try {
      // Run validation service
      const validator = new ClusterValidator()
      await validator.validateWorkflowClusters(workflowId, [], [])
      
      // Transition to completed
      await WorkflowFSM.transition(workflowId, 'VALIDATION_SUCCESS')
      console.log(`[Step7] Completed successfully for workflow ${workflowId}`)
      
      // Trigger next step
      await inngest.send({
        name: 'intent.step8.subtopics',
        data: { workflowId }
      })
      
      return { success: true, workflowId }
      
    } catch (error) {
      console.error(`[Step7] Failed for workflow ${workflowId}:`, error)
      
      // Transition to failed state
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
  async ({ event, step }) => {
    const workflowId = event.data.workflowId
    
    console.log(`[Step8] Starting subtopics for workflow ${workflowId}`)
    
    // FSM Guard
    const currentState = await WorkflowFSM.getCurrentState(workflowId)
    if (currentState !== 'step_8_subtopics_running') {
      console.log(`[Step8] Skipping - invalid state: ${currentState}`)
      return { skipped: true, currentState }
    }
    
    try {
      // Run subtopic service
      const generator = new KeywordSubtopicGenerator()
      
      // Get all keywords ready for subtopic generation
      const { createServiceRoleClient } = require('@/lib/supabase/server')
      const supabase = createServiceRoleClient()
      
      const { data: keywords } = await supabase
        .from('keywords')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('subtopics_status', 'not_started')
        .eq('longtail_status', 'completed')
      
      if (!keywords || keywords.length === 0) {
        console.log(`[Step8] No keywords ready for subtopics in workflow ${workflowId}`)
      } else {
        // Generate subtopics for each keyword
        for (const keyword of keywords) {
          await generator.generate(keyword.id)
          console.log(`[Step8] Generated subtopics for keyword ${keyword.id}`)
        }
      }
      
      // Transition to completed
      await WorkflowFSM.transition(workflowId, 'SUBTOPICS_SUCCESS')
      console.log(`[Step8] Completed successfully for workflow ${workflowId}`)
      
      // Trigger next step
      await inngest.send({
        name: 'intent.step9.articles',
        data: { workflowId }
      })
      
      return { success: true, workflowId }
      
    } catch (error) {
      console.error(`[Step8] Failed for workflow ${workflowId}:`, error)
      
      // Transition to failed state
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
  async ({ event, step }) => {
    const workflowId = event.data.workflowId
    
    console.log(`[Step9] Starting articles for workflow ${workflowId}`)
    
    // FSM Guard
    const currentState = await WorkflowFSM.getCurrentState(workflowId)
    if (currentState !== 'step_9_articles_running') {
      console.log(`[Step9] Skipping - invalid state: ${currentState}`)
      return { skipped: true, currentState }
    }
    
    try {
      // Run article service
      await queueArticlesForWorkflow(workflowId)
      
      // Transition to completed - final step!
      await WorkflowFSM.transition(workflowId, 'ARTICLES_SUCCESS')
      console.log(`[Step9] Completed successfully for workflow ${workflowId} - WORKFLOW COMPLETE`)
      
      // No next step trigger - workflow is complete
      
      return { success: true, workflowId, completed: true }
      
    } catch (error) {
      console.error(`[Step9] Failed for workflow ${workflowId}:`, error)
      
      // Transition to failed state
      await WorkflowFSM.transition(workflowId, 'ARTICLES_FAILED')
      throw error
    }
  }
)
