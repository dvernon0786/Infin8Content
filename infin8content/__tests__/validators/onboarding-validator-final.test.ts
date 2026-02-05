import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the audit logger
vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: vi.fn(),
}))

import { validateOnboardingComplete } from '@/lib/validators/onboarding-validator'
import { createClient } from '@/lib/supabase/server'
import { logActionAsync } from '@/lib/services/audit-logger'

const mockCreateClient = createClient as vi.MockedFunction<typeof createClient>
const mockLogActionAsync = logActionAsync as vi.MockedFunction<typeof logActionAsync>

describe('validateOnboardingComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default audit logger to resolve successfully
    mockLogActionAsync.mockResolvedValue(undefined)
  })

  it('returns valid=true when all requirements are met', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query
    const orgQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          onboarding_completed: true,
          website_url: 'https://example.com',
          business_description: 'Valid business description with enough characters',
          target_audiences: ['SMBs', 'Enterprises'],
          content_defaults: { language: 'en', tone: 'professional' },
          keyword_settings: { region: 'US', volume: 'high' },
        },
        error: null,
      }),
    }

    // Mock competitors query - matches the actual implementation
    const competitorsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return orgQuery
      if (table === 'competitors') return competitorsQuery
      return orgQuery
    })

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const result = await validateOnboardingComplete('org-id')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.missingSteps).toBeUndefined()
    // Verify audit logging was called (but don't assert exact parameters due to timing differences)
    expect(mockLogActionAsync).toHaveBeenCalled()
  })

  it('returns valid=false when onboarding is not completed', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query
    const orgQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          onboarding_completed: false,
          website_url: 'https://example.com',
          business_description: 'Valid business description',
          target_audiences: ['SMBs'],
          content_defaults: { language: 'en' },
          keyword_settings: { region: 'US' },
        },
        error: null,
      }),
    }

    // Mock competitors query
    const competitorsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return orgQuery
      if (table === 'competitors') return competitorsQuery
      return orgQuery
    })

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const result = await validateOnboardingComplete('org-id')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('ONBOARDING_NOT_COMPLETED')
    expect(result.missingSteps).toContain('Complete onboarding process')
    expect(mockLogActionAsync).toHaveBeenCalled()
  })

  it('returns valid=false when organization data is missing', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Organization not found'),
        }),
      }),
    }

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const result = await validateOnboardingComplete('org-id')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('ONBOARDING_NOT_COMPLETED')
    expect(result.missingSteps).toContain('Complete onboarding process')
  })

  it('returns valid=false when competitor count is too low', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query
    const orgQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          onboarding_completed: true,
          website_url: 'https://example.com',
          business_description: 'Valid business description',
          target_audiences: ['SMBs'],
          content_defaults: { language: 'en' },
          keyword_settings: { region: 'US' },
        },
        error: null,
      }),
    }

    // Mock competitors query with too few competitors
    const competitorsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        count: 2, // Too low
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return orgQuery
      if (table === 'competitors') return competitorsQuery
      return orgQuery
    })

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const result = await validateOnboardingComplete('org-id')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('COMPETITORS_INVALID_COUNT')
    expect(result.missingSteps).toContain('Add competitors (have 2, need 3-7)')
  })

  it('returns valid=false when website URL format is invalid', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query with invalid URL
    const orgQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          onboarding_completed: true,
          website_url: 'invalid-url-format',
          business_description: 'Valid business description with enough characters',
          target_audiences: ['SMBs', 'Enterprises'],
          content_defaults: { language: 'en', tone: 'professional' },
          keyword_settings: { region: 'US', volume: 'high' },
        },
        error: null,
      }),
    }

    // Mock competitors query
    const competitorsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      }),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') return orgQuery
      if (table === 'competitors') return competitorsQuery
      return orgQuery
    })

    mockCreateClient.mockResolvedValue(mockSupabase as any)

    const result = await validateOnboardingComplete('org-id')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('WEBSITE_URL_INVALID')
    expect(result.missingSteps).toContain('Fix website URL format')
  })
})
