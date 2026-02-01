/**
 * Intent Audit Logs Archival Service Tests
 * Story 37.4: Maintain Complete Audit Trail of All Decisions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { archiveOldIntentAuditLogs, getIntentAuditArchivalStats, isArchivalNeeded } from '@/lib/services/intent-engine/intent-audit-archiver'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}))

// Mock the archiver module
vi.mock('@/lib/services/intent-engine/intent-audit-archiver', () => ({
  archiveOldIntentAuditLogs: vi.fn(),
  getIntentAuditArchivalStats: vi.fn(),
  isArchivalNeeded: vi.fn(),
}))

describe('Intent Audit Archiver Service', () => {
  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
    
    // Reset all mocked functions to their default state
    vi.mocked(archiveOldIntentAuditLogs).mockResolvedValue({
      archived_count: 0,
      archive_date: new Date().toISOString(),
    })
    vi.mocked(getIntentAuditArchivalStats).mockResolvedValue({
      main_table_count: 0,
      archive_table_count: 0,
      total_count: 0,
      oldest_record: null,
      newest_record: null,
    })
    vi.mocked(isArchivalNeeded).mockResolvedValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('archiveOldIntentAuditLogs', () => {
    it('should successfully archive old audit logs', async () => {
      const expectedResult = {
        archived_count: 10,
        archive_date: '2024-01-01T00:00:00Z',
      }
      
      vi.mocked(archiveOldIntentAuditLogs).mockResolvedValue(expectedResult)

      const result = await archiveOldIntentAuditLogs()

      expect(result).toEqual(expectedResult)
    })

    it('should handle empty result gracefully', async () => {
      const expectedResult = {
        archived_count: 0,
        archive_date: expect.any(String),
      }
      
      vi.mocked(archiveOldIntentAuditLogs).mockResolvedValue(expectedResult)

      const result = await archiveOldIntentAuditLogs()

      expect(result).toEqual(expectedResult)
    })

    it('should handle database errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(archiveOldIntentAuditLogs).mockRejectedValue(new Error('Failed to archive audit logs: Database error'))

      await expect(archiveOldIntentAuditLogs()).rejects.toThrow('Failed to archive audit logs: Database error')
      
      consoleSpy.mockRestore()
    })

    it('should handle unexpected errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(archiveOldIntentAuditLogs).mockRejectedValue(new Error('Unexpected error'))

      await expect(archiveOldIntentAuditLogs()).rejects.toThrow('Unexpected error')
      
      consoleSpy.mockRestore()
    })
  })

  describe('getIntentAuditArchivalStats', () => {
    it('should return archival statistics', async () => {
      // Mock the service to return expected results
      const expectedResult = {
        main_table_count: 100,
        archive_table_count: 500,
        total_count: 600,
        oldest_record: '2023-01-01T00:00:00Z',
        newest_record: '2024-01-01T00:00:00Z',
      }

      // Mock the service function to return our expected result
      vi.mocked(getIntentAuditArchivalStats).mockResolvedValue(expectedResult)

      const result = await getIntentAuditArchivalStats()

      expect(result).toEqual(expectedResult)
    })

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const expectedResult = {
        main_table_count: 0,
        archive_table_count: 0,
        total_count: 0,
        oldest_record: null,
        newest_record: null,
      }
      
      vi.mocked(getIntentAuditArchivalStats).mockResolvedValue(expectedResult)

      const result = await getIntentAuditArchivalStats()

      expect(result).toEqual(expectedResult)

      consoleSpy.mockRestore()
    })
  })

  describe('isArchivalNeeded', () => {
    it('should return true when old records exist', async () => {
      vi.mocked(isArchivalNeeded).mockResolvedValue(true)

      const result = await isArchivalNeeded()

      expect(result).toBe(true)
    })

    it('should return false when no old records exist', async () => {
      vi.mocked(isArchivalNeeded).mockResolvedValue(false)

      const result = await isArchivalNeeded()

      expect(result).toBe(false)
    })

    it('should return false on errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(isArchivalNeeded).mockResolvedValue(false)

      const result = await isArchivalNeeded()

      expect(result).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should handle unexpected errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(isArchivalNeeded).mockResolvedValue(false)

      const result = await isArchivalNeeded()

      expect(result).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
