/**
 * Tests for GET /api/intent/workflows/dashboard endpoint
 * Story 39.6: Create Workflow Status Dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/intent/workflows/dashboard/route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync } from '@/lib/services/audit-logger'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/services/audit-logger')

describe('GET /api/intent/workflows/dashboard', () => {
  let mockSupabase: any
  let mockCurrentUser: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockCurrentUser = {
      id: 'user-123',
      org_id: 'org-123',
      email: 'test@example.com'
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)
    
    mockSupabase = {
      from: vi.fn(() => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }
      })
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
    vi.mocked(logActionAsync).mockResolvedValue(undefined)
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when user lacks organization', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-123', org_id: null })

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Dashboard Data Fetching', () => {
    it('should return dashboard data with workflows for authenticated user', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          status: 'step_1_icp',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          created_by: 'user-123',
          workflow_data: {}
        }
      ]
      
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockWorkflows, error: null })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.workflows).toHaveLength(1)
      expect(data.workflows[0].id).toBe('workflow-1')
      expect(data.workflows[0].status).toBe('step_1_icp')
    })

    it('should calculate progress percentage correctly', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          status: 'step_1_icp',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          created_by: 'user-123',
          workflow_data: {}
        },
        {
          id: 'workflow-2',
          name: 'Test Workflow 2',
          status: 'completed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T02:00:00Z',
          created_by: 'user-123',
          workflow_data: {}
        }
      ]
      
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockWorkflows, error: null })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.workflows[0].progress_percentage).toBe(20)
      expect(data.workflows[1].progress_percentage).toBe(100)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch dashboard data')
    })

    it('should return empty workflows array when no workflows exist', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.workflows).toEqual([])
      expect(data.summary.total_workflows).toBe(0)
    })

    it('should provide accurate summary statistics', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          status: 'step_1_icp',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          created_by: 'user-123',
          workflow_data: {}
        },
        {
          id: 'workflow-2',
          name: 'Test Workflow 2',
          status: 'completed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T02:00:00Z',
          created_by: 'user-123',
          workflow_data: {}
        },
        {
          id: 'workflow-3',
          name: 'Test Workflow 3',
          status: 'failed',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T03:00:00Z',
          created_by: 'user-123',
          workflow_data: {}
        }
      ]
      
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockWorkflows, error: null })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.summary.total_workflows).toBe(3)
      expect(data.summary.completed_workflows).toBe(1)
      expect(data.summary.failed_workflows).toBe(1)
    })
  })

  describe('Audit Logging', () => {
    it('should log dashboard view events', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      await GET(request)

      expect(vi.mocked(logActionAsync)).toHaveBeenCalled()
    })
  })

  describe('Organization Isolation', () => {
    it('should query workflows filtered by organization_id', async () => {
      const eqMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabase.from = vi.fn(() => ({
        select: selectMock,
        eq: eqMock,
        order: orderMock
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      await GET(request)

      expect(eqMock).toHaveBeenCalledWith('organization_id', 'org-123')
    })

    it('should not expose workflows from other organizations', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Org A Workflow',
          status: 'step_1_icp',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          created_by: 'user-123',
          organization_id: 'org-123',
          workflow_data: {}
        }
      ]

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockWorkflows, error: null })
      }))
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/dashboard')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.workflows).toHaveLength(1)
      expect(data.workflows[0].id).toBe('workflow-1')
    })
  })
})
