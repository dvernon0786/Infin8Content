/**
 * Keyword Clusterer Service
 * Story 36.2: Cluster Keywords into Hub-and-Spoke Structure
 * 
 * Implements semantic clustering of filtered keywords into hub-and-spoke topic model.
 * Uses embedding-based similarity for spoke assignment and deterministic hub selection.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { 
  RetryPolicy, 
  isRetryableError, 
  calculateBackoffDelay, 
  sleep, 
  classifyErrorType,
  retryWithPolicy 
} from './retry-utils'
import { emitAnalyticsEvent } from '../analytics/event-emitter'

export const CLUSTERING_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,        // initial + 2 retries
  initialDelayMs: 2000,  // 2 seconds
  backoffMultiplier: 2,  // exponential (2s, 4s, 8s)
  maxDelayMs: 8000      // 8 second cap
}

export interface Keyword {
  id: string
  organization_id: string
  competitor_url_id?: string
  seed_keyword?: string
  keyword: string
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
  longtail_status: string
  subtopics_status: string
  article_status: string
  parent_seed_keyword_id?: string
  is_filtered_out?: boolean
  filtered_reason?: 'duplicate' | 'low_volume'
  filtered_at?: string
  created_at: string
  updated_at: string
}

export interface ClusterOptions {
  similarityThreshold?: number  // Default: 0.6
  maxSpokesPerHub?: number     // Default: 8
  minClusterSize?: number      // Default: 3 (1 hub + 2 spokes)
  userSelectedOnly?: boolean   // Default: false - if true, only cluster user_selected keywords
}

export interface ClusterResult {
  workflow_id: string
  cluster_count: number
  keywords_clustered: number
  avg_cluster_size: number
  clusters: TopicCluster[]
  completed_at: string
  retry_count?: number
  last_error?: string
}

export interface TopicCluster {
  hub_keyword_id: string
  hub_keyword: string
  spoke_keyword_id: string
  spoke_keyword: string
  similarity_score: number
}

export class KeywordClusterer {
  private supabase = createServiceRoleClient()

  /**
   * Main clustering orchestration method
   */
  async clusterKeywords(
    workflowId: string, 
    options: ClusterOptions = {}
  ): Promise<ClusterResult> {
    const startTime = Date.now()
    const similarityThreshold = options.similarityThreshold ?? 0.4
    const maxSpokesPerHub = options.maxSpokesPerHub ?? 8
    const minClusterSize = options.minClusterSize ?? 3

    try {
      // Load filtered keywords for workflow (includes organization lookup)
      const keywords = await this.loadFilteredKeywords(workflowId, options.userSelectedOnly)
      
      // Enterprise compute guards
      // WARNING: Clustering is O(n²). Do not increase 100 keyword limit without redesigning algorithm.
      if (keywords.length < 2) {
        throw new Error(`Insufficient keywords for clustering: ${keywords.length} < 2`)
      }
      
      if (keywords.length > 100) {
        throw new Error(`Keyword limit exceeded for clustering: ${keywords.length} > 100`)
      }
      
      if (keywords.length < minClusterSize) {
        throw new Error(`Insufficient keywords for clustering: ${keywords.length} < ${minClusterSize}`)
      }

      // Clear existing clusters for idempotency
      await this.clearExistingClusters(workflowId)

      // Perform clustering
      const clusters = await this.performClustering(
        keywords, 
        similarityThreshold, 
        maxSpokesPerHub,
        minClusterSize
      )

      // Persist clusters
      await this.persistClusters(workflowId, clusters)

      const result: ClusterResult = {
        workflow_id: workflowId,
        cluster_count: this.countUniqueHubs(clusters),
        keywords_clustered: keywords.length,
        avg_cluster_size: clusters.length / this.countUniqueHubs(clusters),
        clusters,
        completed_at: new Date().toISOString()
      }

      // Emit start event
      if (keywords.length > 0) {
        emitAnalyticsEvent({
          event_type: 'workflow.topic_clustering.started',
          timestamp: new Date().toISOString(),
          organization_id: keywords[0].organization_id,
          workflow_id: workflowId,
          similarity_threshold: similarityThreshold,
          max_spokes_per_hub: maxSpokesPerHub
        })
      }

      // Emit completion event
      emitAnalyticsEvent({
        event_type: 'workflow.topic_clustering.completed',
        timestamp: new Date().toISOString(),
        organization_id: keywords[0].organization_id,
        workflow_id: workflowId,
        total_keywords: keywords.length,
        cluster_count: result.cluster_count,
        avg_cluster_size: result.avg_cluster_size,
        duration_ms: Date.now() - startTime
      })

      return result

    } catch (error) {
      const errorType = classifyErrorType(error)
      console.error(`Keyword clustering failed for workflow ${workflowId}:`, error)

      // Re-throw for API layer to handle
      throw error
    }
  }

  /**
   * Load filtered keywords for the workflow
   */
  private async loadFilteredKeywords(workflowId: string, userSelectedOnly: boolean = false): Promise<Keyword[]> {
    return await retryWithPolicy(
      async () => {
        // First get organization_id from workflow
        const { data: workflow, error: workflowError } = await this.supabase
          .from('intent_workflows')
          .select('organization_id')
          .eq('id', workflowId)
          .single()
          
        if (workflowError || !workflow) {
          throw new Error(`Workflow not found: ${workflowId}`)
        }

        // Type guard: ensure workflow is properly typed
        const typedWorkflow = workflow as unknown as { organization_id: string }

        // Then get keywords for that organization and workflow
        let query = this.supabase
          .from('keywords')
          .select('id, keyword, search_volume, organization_id, workflow_id, user_selected, selection_source')
          .eq('organization_id', typedWorkflow.organization_id)
          .eq('workflow_id', workflowId) // CRITICAL: Add workflow isolation
          .eq('is_filtered_out', false)
        
        // Add user_selected filter if specified
        if (userSelectedOnly) {
          query = query.eq('user_selected', true)
        }
        
        const { data, error } = await query
          .order('search_volume', { ascending: false })

        if (error || !data) {
          throw new Error(`Failed to load keywords: ${error?.message}`)
        }

        return data as unknown as Keyword[]
      },
      CLUSTERING_RETRY_POLICY,
      'loadFilteredKeywords'
    )
  }

  /**
   * Clear existing clusters for workflow (idempotency)
   */
  private async clearExistingClusters(workflowId: string): Promise<void> {
    return await retryWithPolicy(
      async () => {
        const { error } = await this.supabase
          .from('topic_clusters')
          .delete()
          .eq('workflow_id', workflowId)

        if (error) throw error
      },
      CLUSTERING_RETRY_POLICY,
      'clearExistingClusters'
    )
  }

  /**
   * Perform the actual clustering algorithm
   */
  private async performClustering(
    keywords: Keyword[],
    similarityThreshold: number,
    maxSpokesPerHub: number,
    minClusterSize: number
  ): Promise<TopicCluster[]> {
    const clusters: TopicCluster[] = []
    const unassignedKeywords = [...keywords]

    while (unassignedKeywords.length >= minClusterSize) {
      // Identify hub keyword (highest search volume)
      const hub = this.identifyHub(unassignedKeywords)
      
      // Remove hub from unassigned list
      const hubIndex = unassignedKeywords.findIndex(k => k.id === hub.id)
      unassignedKeywords.splice(hubIndex, 1)

      // Assign spokes to hub
      const spokeAssignments = await this.assignSpokesToHub(
        hub, 
        unassignedKeywords, 
        similarityThreshold, 
        maxSpokesPerHub
      )

      if (spokeAssignments.length >= minClusterSize - 1) {
        // Add valid cluster
        spokeAssignments.forEach(assignment => {
          clusters.push({
            hub_keyword_id: hub.id,
            hub_keyword: hub.keyword,
            spoke_keyword_id: assignment.spoke_keyword_id,
            spoke_keyword: assignment.spoke_keyword,
            similarity_score: assignment.similarity_score
          })

          // Remove assigned spoke from unassigned list
          const spokeIndex = unassignedKeywords.findIndex(k => k.id === assignment.spoke_keyword_id)
          if (spokeIndex !== -1) {
            unassignedKeywords.splice(spokeIndex, 1)
          }
        })
      } else {
        // Not enough spokes, put hub back and try different approach
        unassignedKeywords.push(hub)
        break
      }
    }

    return clusters
  }

  /**
   * Identify hub keyword based on highest search volume
   */
  identifyHub(keywords: Keyword[]): Keyword {
    if (keywords.length === 0) {
      throw new Error('No keywords available for hub identification')
    }

    // Sort by search volume descending and pick the highest
    return keywords.reduce((best, current) => 
      current.search_volume > best.search_volume ? current : best
    )
  }

  /**
   * Assign spokes to hub based on semantic similarity
   * TODO: Replace with embedding-based similarity when available
   */
  async assignSpokesToHub(
    hub: Keyword,
    potentialSpokes: Keyword[],
    similarityThreshold: number,
    maxSpokesPerHub: number
  ): Promise<{ spoke_keyword_id: string; spoke_keyword: string; similarity_score: number }[]> {
    
    // Calculate similarity scores
    const similarities = potentialSpokes.map(spoke => ({
      spoke_keyword_id: spoke.id,
      spoke_keyword: spoke.keyword,
      similarity_score: this.calculateTextSimilarity(hub.keyword, spoke.keyword)
    }))

    // Filter by threshold and sort by similarity descending
    const qualifiedSpokes = similarities
      .filter(s => s.similarity_score >= similarityThreshold)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, maxSpokesPerHub)

    return qualifiedSpokes
  }

  /**
   * Calculate text similarity using improved Jaccard similarity with word normalization
   * TODO: Replace with embedding-based cosine similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Normalize texts: lowercase, remove punctuation, split on whitespace
    const normalize = (text: string) => 
      text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2) // Remove very short words
    
    const words1 = new Set(normalize(text1))
    const words2 = new Set(normalize(text2))
    
    if (words1.size === 0 || words2.size === 0) {
      return 0
    }
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    // Jaccard similarity with a boost for partial word matches
    let jaccardScore = intersection.size / union.size
    
    // Add partial matching bonus for words that are substrings
    let partialBonus = 0
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 !== word2) {
          if (word1.includes(word2) || word2.includes(word1)) {
            partialBonus += 0.1
          }
        }
      }
    }
    
    const finalScore = Math.min(jaccardScore + partialBonus, 1.0)
    return finalScore
  }

  /**
   * Persist clusters to database
   */
  private async persistClusters(workflowId: string, clusters: TopicCluster[]): Promise<void> {
    if (clusters.length === 0) return

    return await retryWithPolicy(
      async () => {
        const clusterRecords = clusters.map(cluster => ({
          workflow_id: workflowId,
          hub_keyword_id: cluster.hub_keyword_id,
          spoke_keyword_id: cluster.spoke_keyword_id,
          similarity_score: cluster.similarity_score,
          user_selected: false,
          selection_source: 'ai'   // Explicit AI-generated clusters
        }))

        const { error } = await this.supabase
          .from('topic_clusters')
          .insert(clusterRecords)

        if (error) throw error
      },
      CLUSTERING_RETRY_POLICY,
      'persistClusters'
    )
  }

  /**
   * Count unique hubs in clusters
   */
  private countUniqueHubs(clusters: TopicCluster[]): number {
    const uniqueHubs = new Set(clusters.map(c => c.hub_keyword_id))
    return uniqueHubs.size
  }
}
