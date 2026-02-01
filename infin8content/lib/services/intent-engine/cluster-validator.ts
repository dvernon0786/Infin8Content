import {
  ClusterValidationConfig,
  ClusterValidationResult,
  TopicCluster,
  Keyword,
  ClusterValidationSummary,
  ValidationError,
  ClusterValidationConfigSchema
} from './cluster-validator-types'

/**
 * Cluster Validator Service
 * 
 * Validates hub-and-spoke keyword clusters for structural correctness
 * and semantic coherence according to Story 36.3 requirements.
 */
export class ClusterValidator {
  private config: ClusterValidationConfig

  constructor(config: Partial<ClusterValidationConfig> = {}) {
    this.config = ClusterValidationConfigSchema.parse(config)
  }

  /**
   * Validate all clusters for a workflow
   */
  async validateWorkflowClusters(
    workflowId: string,
    clusters: TopicCluster[],
    keywords: Keyword[]
  ): Promise<ClusterValidationSummary> {
    if (!workflowId) {
      throw new ValidationError('Workflow ID is required', 'MISSING_WORKFLOW_ID')
    }

    if (!clusters.length) {
      throw new ValidationError('No clusters found for validation', 'NO_CLUSTERS')
    }

    // Group clusters by hub keyword
    const clustersByHub = this.groupClustersByHub(clusters)
    
    // Validate each hub-spoke cluster
    const results: ClusterValidationResult[] = []
    
    for (const [hubKeywordId, hubClusters] of clustersByHub) {
      const result = await this.validateSingleCluster(
        workflowId,
        hubKeywordId,
        hubClusters,
        keywords
      )
      results.push(result)
    }

    // Calculate summary
    const validClusters = results.filter(r => r.validation_status === 'valid').length
    const invalidClusters = results.filter(r => r.validation_status === 'invalid').length

    return {
      total_clusters: results.length,
      valid_clusters: validClusters,
      invalid_clusters: invalidClusters,
      results
    }
  }

  /**
   * Validate a single hub-spoke cluster
   */
  async validateSingleCluster(
    workflowId: string,
    hubKeywordId: string,
    clusters: TopicCluster[],
    keywords: Keyword[]
  ): Promise<ClusterValidationResult> {
    // Get hub keyword
    const hubKeyword = keywords.find(k => k.id === hubKeywordId)
    if (!hubKeyword) {
      throw new ValidationError(`Hub keyword not found: ${hubKeywordId}`, 'HUB_KEYWORD_NOT_FOUND')
    }

    // Get spoke keywords
    const spokeKeywordIds = clusters.map(c => c.spoke_keyword_id)
    const spokeKeywords = keywords.filter(k => spokeKeywordIds.includes(k.id))

    // Validate cluster size
    const sizeValidation = this.validateClusterSize(spokeKeywords.length)
    
    // Validate semantic coherence
    const coherenceValidation = await this.validateSemanticCoherence(
      hubKeyword,
      spokeKeywords,
      clusters
    )

    // Determine overall validation status
    const isValid = sizeValidation.isValid && coherenceValidation.isValid

    return {
      workflow_id: workflowId,
      hub_keyword_id: hubKeywordId,
      validation_status: isValid ? 'valid' : 'invalid',
      avg_similarity: coherenceValidation.avgSimilarity,
      spoke_count: spokeKeywords.length
    }
  }

  /**
   * Validate cluster size constraints
   */
  private validateClusterSize(spokeCount: number): { isValid: boolean; reason?: string } {
    if (spokeCount < this.config.minSpokes) {
      return {
        isValid: false,
        reason: `Cluster has ${spokeCount} spokes, minimum required is ${this.config.minSpokes}`
      }
    }

    if (spokeCount > this.config.maxSpokes) {
      return {
        isValid: false,
        reason: `Cluster has ${spokeCount} spokes, maximum allowed is ${this.config.maxSpokes}`
      }
    }

    return { isValid: true }
  }

  /**
   * Validate semantic coherence between hub and spokes
   */
  private async validateSemanticCoherence(
    hubKeyword: Keyword,
    spokeKeywords: Keyword[],
    clusters: TopicCluster[]
  ): Promise<{ isValid: boolean; avgSimilarity: number; invalidSpokes: string[] }> {
    const invalidSpokes: string[] = []
    const similarities: number[] = []

    for (const spokeKeyword of spokeKeywords) {
      // Get similarity score from cluster data
      const cluster = clusters.find(c => c.spoke_keyword_id === spokeKeyword.id)
      const similarity = cluster?.similarity_score

      if (similarity === undefined || similarity === null) {
        // If no similarity score, we can't validate - consider invalid
        invalidSpokes.push(spokeKeyword.keyword)
        continue
      }

      similarities.push(similarity)

      // Check if similarity meets threshold
      if (similarity < this.config.similarityThreshold) {
        invalidSpokes.push(spokeKeyword.keyword)
      }
    }

    // Calculate average similarity
    const avgSimilarity = similarities.length > 0 
      ? similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length 
      : 0

    // Cluster is valid if no invalid spokes and we have similarity data
    const isValid = invalidSpokes.length === 0 && similarities.length > 0

    return {
      isValid,
      avgSimilarity,
      invalidSpokes
    }
  }

  /**
   * Group clusters by hub keyword
   */
  private groupClustersByHub(clusters: TopicCluster[]): Map<string, TopicCluster[]> {
    const grouped = new Map<string, TopicCluster[]>()
    
    for (const cluster of clusters) {
      const hubId = cluster.hub_keyword_id
      if (!grouped.has(hubId)) {
        grouped.set(hubId, [])
      }
      grouped.get(hubId)!.push(cluster)
    }

    return grouped
  }

  /**
   * Get current configuration
   */
  getConfig(): ClusterValidationConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ClusterValidationConfig>): void {
    this.config = ClusterValidationConfigSchema.parse({ ...this.config, ...newConfig })
  }
}
