/**
 * Tests for Workflow Dashboard service functions
 * Story 39.6: Create Workflow Status Dashboard
 */

import { describe, it, expect } from 'vitest'
import {
  calculateProgress,
  getStepDescription,
  calculateSummary,
  calculateEstimatedCompletion,
} from '@/lib/services/intent-engine/workflow-dashboard-service'

describe('Workflow Dashboard Service', () => {
  describe('calculateProgress', () => {
    it('should return correct progress for each step', () => {
      expect(calculateProgress('step_0_auth')).toBe(5)
      expect(calculateProgress('step_1_icp')).toBe(15)
      expect(calculateProgress('step_2_competitors')).toBe(25)
      expect(calculateProgress('step_3_keywords')).toBe(35)
      expect(calculateProgress('step_4_longtails')).toBe(45)
      expect(calculateProgress('step_5_filtering')).toBe(55)
      expect(calculateProgress('step_6_clustering')).toBe(65)
      expect(calculateProgress('step_7_validation')).toBe(75)
      expect(calculateProgress('step_8_subtopics')).toBe(85)
      expect(calculateProgress('step_9_articles')).toBe(95)
      expect(calculateProgress('completed')).toBe(100)
      expect(calculateProgress('failed')).toBe(0)
    })

    it('should return 0 for unknown status', () => {
      expect(calculateProgress('unknown_status')).toBe(0)
    })
  })

  describe('getStepDescription', () => {
    it('should return correct descriptions for all steps', () => {
      expect(getStepDescription('step_0_auth')).toBe('Authentication')
      expect(getStepDescription('step_1_icp')).toBe('ICP Generation')
      expect(getStepDescription('step_2_competitors')).toBe('Competitor Analysis')
      expect(getStepDescription('step_3_keywords')).toBe('Seed Keyword Extraction')
      expect(getStepDescription('step_4_longtails')).toBe('Long-tail Expansion')
      expect(getStepDescription('step_5_filtering')).toBe('Keyword Filtering')
      expect(getStepDescription('step_6_clustering')).toBe('Topic Clustering')
      expect(getStepDescription('step_7_validation')).toBe('Cluster Validation')
      expect(getStepDescription('step_8_subtopics')).toBe('Subtopic Generation')
      expect(getStepDescription('step_9_articles')).toBe('Article Generation')
      expect(getStepDescription('completed')).toBe('Completed')
      expect(getStepDescription('failed')).toBe('Failed')
    })
  })

  describe('calculateSummary', () => {
    it('should calculate correct summary statistics', () => {
      const workflows = [
        { status: 'step_1_icp' },
        { status: 'completed' },
        { status: 'failed' },
      ] as any[]

      const summary = calculateSummary(workflows)
      expect(summary.total_workflows).toBe(3)
      expect(summary.completed_workflows).toBe(1)
      expect(summary.failed_workflows).toBe(1)
      expect(summary.in_progress_workflows).toBe(1)
    })
  })

  describe('calculateEstimatedCompletion', () => {
    it('should calculate estimated completion time', () => {
      const created = new Date('2024-01-01T00:00:00Z').toISOString()
      const updated = new Date('2024-01-01T01:00:00Z').toISOString()
      const result = calculateEstimatedCompletion(created, updated, 50)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should return undefined for completed workflows', () => {
      const created = new Date('2024-01-01T00:00:00Z').toISOString()
      const updated = new Date('2024-01-01T01:00:00Z').toISOString()
      const result = calculateEstimatedCompletion(created, updated, 100)
      expect(result).toBeUndefined()
    })

    it('should return undefined for failed workflows', () => {
      const created = new Date('2024-01-01T00:00:00Z').toISOString()
      const updated = new Date('2024-01-01T01:00:00Z').toISOString()
      const result = calculateEstimatedCompletion(created, updated, 0)
      expect(result).toBeUndefined()
    })
  })
})
