import { describe, it, expect, beforeEach } from 'vitest'
import { ClusterValidator } from '@/lib/services/intent-engine/cluster-validator'
import {
  TopicCluster,
  Keyword,
  ClusterValidationResult
} from '@/lib/services/intent-engine/cluster-validator-types'

describe('ClusterValidator', () => {
  let validator: ClusterValidator
  let mockClusters: TopicCluster[]
  let mockKeywords: Keyword[]

  beforeEach(() => {
    validator = new ClusterValidator()
    
    // Setup test data
    mockKeywords = [
      {
        id: 'hub-1',
        keyword: 'content marketing',
        search_volume: 10000,
        competition_level: 'high',
        competition_index: 80,
        keyword_difficulty: 70
      },
      {
        id: 'spoke-1',
        keyword: 'content marketing strategy',
        search_volume: 5000,
        competition_level: 'medium',
        competition_index: 60,
        keyword_difficulty: 50
      },
      {
        id: 'spoke-2',
        keyword: 'content marketing tips',
        search_volume: 3000,
        competition_level: 'medium',
        competition_index: 50,
        keyword_difficulty: 40
      },
      {
        id: 'spoke-3',
        keyword: 'content marketing examples',
        search_volume: 2000,
        competition_level: 'low',
        competition_index: 30,
        keyword_difficulty: 30
      }
    ]

    mockClusters = [
      {
        id: 'cluster-1',
        workflow_id: 'workflow-1',
        hub_keyword_id: 'hub-1',
        spoke_keyword_id: 'spoke-1',
        similarity_score: 0.8,
        created_at: '2026-02-01T00:00:00Z'
      },
      {
        id: 'cluster-2',
        workflow_id: 'workflow-1',
        hub_keyword_id: 'hub-1',
        spoke_keyword_id: 'spoke-2',
        similarity_score: 0.7,
        created_at: '2026-02-01T00:00:00Z'
      },
      {
        id: 'cluster-3',
        workflow_id: 'workflow-1',
        hub_keyword_id: 'hub-1',
        spoke_keyword_id: 'spoke-3',
        similarity_score: 0.6,
        created_at: '2026-02-01T00:00:00Z'
      }
    ]
  })

  describe('validateWorkflowClusters', () => {
    it('should validate clusters with correct configuration', async () => {
      const result = await validator.validateWorkflowClusters(
        'workflow-1',
        mockClusters,
        mockKeywords
      )

      expect(result.total_clusters).toBe(1)
      expect(result.valid_clusters).toBe(1)
      expect(result.invalid_clusters).toBe(0)
      expect(result.results).toHaveLength(1)
      
      const validation = result.results[0]
      expect(validation.validation_status).toBe('valid')
      expect(validation.hub_keyword_id).toBe('hub-1')
      expect(validation.spoke_count).toBe(3)
      expect(validation.avg_similarity).toBeCloseTo(0.7, 1)
    })

    it('should reject clusters with too few spokes', async () => {
      // Create cluster with only 1 spoke (below minimum of 2)
      const smallCluster = mockClusters.slice(0, 1)
      
      const result = await validator.validateWorkflowClusters(
        'workflow-1',
        smallCluster,
        mockKeywords
      )

      expect(result.total_clusters).toBe(1)
      expect(result.valid_clusters).toBe(0)
      expect(result.invalid_clusters).toBe(1)
      
      const validation = result.results[0]
      expect(validation.validation_status).toBe('invalid')
      expect(validation.spoke_count).toBe(1)
    })

    it('should reject clusters with too many spokes', async () => {
      // Create validator with max 2 spokes
      const strictValidator = new ClusterValidator({ maxSpokes: 2 })
      
      const result = await strictValidator.validateWorkflowClusters(
        'workflow-1',
        mockClusters,
        mockKeywords
      )

      expect(result.valid_clusters).toBe(0)
      expect(result.invalid_clusters).toBe(1)
      
      const validation = result.results[0]
      expect(validation.validation_status).toBe('invalid')
      expect(validation.spoke_count).toBe(3)
    })

    it('should reject clusters with low similarity scores', async () => {
      // Create clusters with low similarity
      const lowSimilarityClusters = mockClusters.map((cluster, index) => ({
        ...cluster,
        similarity_score: 0.3 // Below default threshold of 0.6
      }))
      
      const result = await validator.validateWorkflowClusters(
        'workflow-1',
        lowSimilarityClusters,
        mockKeywords
      )

      expect(result.valid_clusters).toBe(0)
      expect(result.invalid_clusters).toBe(1)
      
      const validation = result.results[0]
      expect(validation.validation_status).toBe('invalid')
      expect(validation.avg_similarity).toBeCloseTo(0.3, 1)
    })

    it('should handle missing similarity scores', async () => {
      // Create clusters without similarity scores
      const noSimilarityClusters = mockClusters.map(cluster => ({
        ...cluster,
        similarity_score: undefined
      }))
      
      const result = await validator.validateWorkflowClusters(
        'workflow-1',
        noSimilarityClusters,
        mockKeywords
      )

      expect(result.valid_clusters).toBe(0)
      expect(result.invalid_clusters).toBe(1)
      
      const validation = result.results[0]
      expect(validation.validation_status).toBe('invalid')
      expect(validation.avg_similarity).toBe(0)
    })

    it('should throw error for missing workflow ID', async () => {
      await expect(
        validator.validateWorkflowClusters('', mockClusters, mockKeywords)
      ).rejects.toThrow('Workflow ID is required')
    })

    it('should throw error for no clusters', async () => {
      await expect(
        validator.validateWorkflowClusters('workflow-1', [], mockKeywords)
      ).rejects.toThrow('No clusters found for validation')
    })

    it('should handle multiple hub clusters', async () => {
      // Add second hub with its spokes
      const secondHubKeywords = [
        {
          id: 'hub-2',
          keyword: 'social media marketing',
          search_volume: 8000,
          competition_level: 'high',
          competition_index: 75,
          keyword_difficulty: 65
        },
        {
          id: 'spoke-4',
          keyword: 'social media strategy',
          search_volume: 4000,
          competition_level: 'medium',
          competition_index: 55,
          keyword_difficulty: 45
        },
        {
          id: 'spoke-5',
          keyword: 'social media tips',
          search_volume: 2500,
          competition_level: 'low',
          competition_index: 35,
          keyword_difficulty: 35
        }
      ]

      const secondHubClusters = [
        {
          id: 'cluster-4',
          workflow_id: 'workflow-1',
          hub_keyword_id: 'hub-2',
          spoke_keyword_id: 'spoke-4',
          similarity_score: 0.75,
          created_at: '2026-02-01T00:00:00Z'
        },
        {
          id: 'cluster-5',
          workflow_id: 'workflow-1',
          hub_keyword_id: 'hub-2',
          spoke_keyword_id: 'spoke-5',
          similarity_score: 0.65,
          created_at: '2026-02-01T00:00:00Z'
        }
      ]

      const allKeywords = [...mockKeywords, ...secondHubKeywords]
      const allClusters = [...mockClusters, ...secondHubClusters]

      const result = await validator.validateWorkflowClusters(
        'workflow-1',
        allClusters,
        allKeywords
      )

      expect(result.total_clusters).toBe(2)
      expect(result.valid_clusters).toBe(2)
      expect(result.invalid_clusters).toBe(0)
      expect(result.results).toHaveLength(2)
    })
  })

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = validator.getConfig()
      expect(config.minSpokes).toBe(2)
      expect(config.maxSpokes).toBe(8)
      expect(config.similarityThreshold).toBe(0.6)
    })

    it('should accept custom configuration', () => {
      const customValidator = new ClusterValidator({
        minSpokes: 1,
        maxSpokes: 10,
        similarityThreshold: 0.7
      })

      const config = customValidator.getConfig()
      expect(config.minSpokes).toBe(1)
      expect(config.maxSpokes).toBe(10)
      expect(config.similarityThreshold).toBe(0.7)
    })

    it('should update configuration', () => {
      validator.updateConfig({ similarityThreshold: 0.8 })
      
      const config = validator.getConfig()
      expect(config.similarityThreshold).toBe(0.8)
      expect(config.minSpokes).toBe(2) // Other values unchanged
    })
  })

  describe('validateSingleCluster', () => {
    it('should validate a single cluster correctly', async () => {
      const result = await validator.validateSingleCluster(
        'workflow-1',
        'hub-1',
        mockClusters,
        mockKeywords
      )

      expect(result.workflow_id).toBe('workflow-1')
      expect(result.hub_keyword_id).toBe('hub-1')
      expect(result.validation_status).toBe('valid')
      expect(result.spoke_count).toBe(3)
      expect(result.avg_similarity).toBeCloseTo(0.7, 1)
    })

    it('should throw error for missing hub keyword', async () => {
      await expect(
        validator.validateSingleCluster(
          'workflow-1',
          'non-existent-hub',
          mockClusters,
          mockKeywords
        )
      ).rejects.toThrow('Hub keyword not found')
    })
  })
})
