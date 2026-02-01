/**
 * Unit Tests for Subtopic Approval Processor Service
 * Story 37-2: Review and Approve Subtopics Before Article Generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  processSubtopicApproval,
  areSubtopicsApproved,
  getApprovedKeywordIds,
  SubtopicApprovalRequest,
  SubtopicApprovalResponse
} from '@/lib/services/keyword-engine/subtopic-approval-processor'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/services/audit-logger')

describe('Subtopic Approval Processor', () => {
  const mockKeywordId = '123e4567-e89b-12d3-a456-426614174000'
  const mockUserId = 'user-123'
  const mockOrgId = 'org-456'
  const mockHeaders = new Headers()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processSubtopicApproval', () => {
    it('should approve subtopics and update keyword status to ready', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'approved',
        feedback: 'Good subtopics'
      }

      // Mock dependencies
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: mockUserId,
        org_id: mockOrgId,
        role: 'admin'
      })

      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockKeywordId,
                  organization_id: mockOrgId,
                  subtopics_status: 'complete',
                  subtopics: [{ title: 'Test Subtopic', keywords: ['test'] }]
                },
                error: null
              })
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockKeywordId },
                  error: null
                })
              }))
            }))
          })),
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'approval-123' },
                error: null
              })
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const { logActionAsync } = await import('@/lib/services/audit-logger')
      vi.mocked(logActionAsync).mockResolvedValue(undefined)

      const result = await processSubtopicApproval(mockKeywordId, request, mockHeaders)

      expect(result.success).toBe(true)
      expect(result.decision).toBe('approved')
      expect(result.message).toContain('approved')
    })

    it('should reject subtopics and update keyword status to not_started', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'rejected',
        feedback: 'Need better subtopics'
      }

      // Mock dependencies
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: mockUserId,
        org_id: mockOrgId,
        role: 'admin'
      })

      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockKeywordId,
                  organization_id: mockOrgId,
                  subtopics_status: 'complete',
                  subtopics: [{ title: 'Test Subtopic', keywords: ['test'] }]
                },
                error: null
              })
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockKeywordId },
                  error: null
                })
              }))
            }))
          })),
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'approval-123' },
                error: null
              })
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const { logActionAsync } = await import('@/lib/services/audit-logger')
      vi.mocked(logActionAsync).mockResolvedValue(undefined)

      const result = await processSubtopicApproval(mockKeywordId, request, mockHeaders)

      expect(result.success).toBe(true)
      expect(result.decision).toBe('rejected')
      expect(result.message).toContain('rejected')
    })

    it('should throw error for invalid decision', async () => {
      const request = {
        decision: 'invalid',
        feedback: 'test'
      } as any

      await expect(processSubtopicApproval(mockKeywordId, request))
        .rejects.toThrow('Decision must be either "approved" or "rejected"')
    })

    it('should throw error when user is not authenticated', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'approved'
      }

      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      await expect(processSubtopicApproval(mockKeywordId, request))
        .rejects.toThrow('Authentication required')
    })

    it('should throw error when user is not admin', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'approved'
      }

      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: mockUserId,
        org_id: mockOrgId,
        role: 'user'
      })

      await expect(processSubtopicApproval(mockKeywordId, request))
        .rejects.toThrow('Admin access required')
    })

    it('should throw error when keyword not found', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'approved'
      }

      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: mockUserId,
        org_id: mockOrgId,
        role: 'admin'
      })

      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      await expect(processSubtopicApproval(mockKeywordId, request))
        .rejects.toThrow('Keyword not found')
    })

    it('should throw error when subtopics_status is not complete', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'approved'
      }

      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: mockUserId,
        org_id: mockOrgId,
        role: 'admin'
      })

      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockKeywordId,
                  organization_id: mockOrgId,
                  subtopics_status: 'not_started',
                  subtopics: []
                },
                error: null
              })
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      await expect(processSubtopicApproval(mockKeywordId, request))
        .rejects.toThrow('Subtopics must be complete before approval')
    })

    it('should throw error when keyword belongs to different organization', async () => {
      const request: SubtopicApprovalRequest = {
        decision: 'approved'
      }

      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: mockUserId,
        org_id: mockOrgId,
        role: 'admin'
      })

      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockKeywordId,
                  organization_id: 'different-org',
                  subtopics_status: 'complete',
                  subtopics: []
                },
                error: null
              })
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      await expect(processSubtopicApproval(mockKeywordId, request))
        .rejects.toThrow('Access denied: keyword belongs to different organization')
    })
  })

  describe('areSubtopicsApproved', () => {
    it('should return true when subtopics are approved', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { decision: 'approved' },
                    error: null
                  })
                }))
              }))
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const result = await areSubtopicsApproved(mockKeywordId)
      expect(result).toBe(true)
    })

    it('should return false when subtopics are rejected', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { decision: 'rejected' },
                    error: null
                  })
                }))
              }))
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const result = await areSubtopicsApproved(mockKeywordId)
      expect(result).toBe(false)
    })

    it('should return false when no approval exists', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' }
                  })
                }))
              }))
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const result = await areSubtopicsApproved(mockKeywordId)
      expect(result).toBe(false)
    })

    it('should return false for invalid keyword ID', async () => {
      const result = await areSubtopicsApproved('')
      expect(result).toBe(false)
    })
  })

  describe('getApprovedKeywordIds', () => {
    it('should return keyword ID when subtopics are approved', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    then: vi.fn((resolve) => resolve({
                      data: [{ entity_id: mockKeywordId }],
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const result = await getApprovedKeywordIds([mockKeywordId])
      expect(result).toContain(mockKeywordId)
    })

    it('should return empty array when no keywords are approved', async () => {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    then: vi.fn((resolve) => resolve({
                      data: [],
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any)

      const result = await getApprovedKeywordIds(['keyword1', 'keyword2'])
      expect(result).toEqual([])
    })

    it('should return empty array for invalid input', async () => {
      const result = await getApprovedKeywordIds([])
      expect(result).toEqual([])
    })
  })
})
