/**
 * Story 36.2: Topic Clustering API Integration Tests
 * 
 * Tests for the topic clustering API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Topic Clustering API', () => {
  describe('POST /api/intent/workflows/{workflow_id}/steps/cluster-topics', () => {
    it('should require authentication', async () => {
      const response = await fetch(
        'http://localhost:3000/api/intent/workflows/test-workflow-id/steps/cluster-topics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should have proper endpoint structure', async () => {
      // Test that the endpoint exists and has proper structure
      // This is a basic smoke test to ensure the route is accessible
      const response = await fetch(
        'http://localhost:3000/api/intent/workflows/test-workflow-id/steps/cluster-topics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      )

      // Should either get 401 (auth) or 404/409 (validation), but not 500
      expect([401, 404, 409]).toContain(response.status)
    })

    it('should handle invalid workflow ID', async () => {
      const response = await fetch(
        'http://localhost:3000/api/intent/workflows/invalid-workflow-id/steps/cluster-topics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      )

      // Should handle invalid workflow gracefully
      expect([401, 404, 409]).toContain(response.status)
    })
  })
})
