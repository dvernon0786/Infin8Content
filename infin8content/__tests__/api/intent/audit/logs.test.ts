/**
 * Intent Audit Logs API Tests
 * Story 37.4: Maintain Complete Audit Trail of All Decisions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/intent/audit/logs/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { getIntentAuditLogs, getIntentAuditLogsCount } from '@/lib/services/intent-engine/intent-audit-logger'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('Intent Audit Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/intent/audit/logs', () => {
    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/intent/audit/logs')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should validate entity_type parameter', async () => {
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: 'org-123',
        role: 'owner',
      })

      // Create request with invalid entity_type
      const request = new NextRequest(
        'http://localhost:3000/api/intent/audit/logs?entity_type=invalid'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid entity_type. Must be one of: workflow, keyword, article',
      })
    })

    it('should validate date format', async () => {
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: 'org-123',
        role: 'owner',
      })

      // Create request with invalid date format
      const request = new NextRequest(
        'http://localhost:3000/api/intent/audit/logs?date_from=invalid-date'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid date_from format. Use ISO 8601 format.',
      })
    })

    it('should return audit logs for authenticated user', async () => {
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: 'org-123',
        role: 'owner',
      })

      // Mock audit logs
      const mockLogs = [
        {
          id: 'log-1',
          organization_id: 'org-123',
          workflow_id: 'workflow-123',
          entity_type: 'workflow',
          entity_id: 'entity-123',
          actor_id: 'user-123',
          action: 'workflow.step.completed',
          details: { step: 'step_4_longtails' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]
      
      vi.mocked(getIntentAuditLogs).mockResolvedValueOnce(mockLogs)

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/intent/audit/logs')

      // Call the API
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        logs: mockLogs,
        pagination: {
          limit: 100,
          offset: 0,
          hasMore: false,
        },
      })

      expect(vi.mocked(getIntentAuditLogs)).toHaveBeenCalledWith({
        organizationId: 'org-123',
        workflowId: undefined,
        actorId: undefined,
        action: undefined,
        entityType: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        limit: 100,
        offset: 0,
      })
    })

    it('should handle server errors gracefully', async () => {
      // Mock authenticated user
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: 'org-123',
        role: 'owner',
      })

      // Mock service error
      vi.mocked(getIntentAuditLogs).mockRejectedValueOnce(new Error('Service error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/intent/audit/logs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Intent Audit Logs API] Unexpected error:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
