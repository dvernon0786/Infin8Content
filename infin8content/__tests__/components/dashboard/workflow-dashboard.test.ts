/**
 * Tests for Workflow Dashboard service functions
 * Story 39.6: Create Workflow Status Dashboard
 */

import { describe, it, expect } from 'vitest'
import {
  getWorkflowDashboard,
} from '@/lib/services/intent-engine/workflow-dashboard-service'

describe('Workflow Dashboard Service', () => {
  describe('getWorkflowDashboard', () => {
    it('should return dashboard data for organization', async () => {
      // Mock the database calls and test the overall structure
      const result = await getWorkflowDashboard('org-123', 'user-123')
      
      expect(result).toBeDefined()
      expect(Array.isArray(result.workflows)).toBe(true)
      expect(typeof result.summary).toBe('object')
    })
  })
})
