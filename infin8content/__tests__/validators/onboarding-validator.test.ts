import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock the audit logger to avoid side-effects
vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: vi.fn().mockResolvedValue(undefined),
}))

import { validateOnboardingComplete } from '@/lib/validators/onboarding-validator'
import { createClient } from '@/lib/supabase/server'

const mockCreateClient = createClient as vi.MockedFunction<typeof createClient>

describe('validateOnboardingComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isValid=true with empty arrays when all requirements are met', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query - happy path
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

    // Mock competitors query - valid count
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
    
    expect(result).toEqual({
      isValid: true,
      missingSteps: [],
      errors: [],
    })
  })

  it('returns isValid=false with missingSteps when onboarding not completed', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query - onboarding not completed
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

    // Mock competitors query - valid count
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
    
    expect(result.isValid).toBe(false)
    expect(result.missingSteps).toContain('Complete onboarding process')
    expect(result.errors).toContain('ONBOARDING_NOT_COMPLETED')
    expect(result.missingSteps).toEqual(expect.any(Array))
    expect(result.errors).toEqual(expect.any(Array))
  })

  it('returns isValid=false with missingSteps when organization data missing', async () => {
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
    
    expect(result.isValid).toBe(false)
    expect(result.missingSteps).toContain('Complete onboarding process')
    expect(result.errors).toContain('ONBOARDING_NOT_COMPLETED')
    expect(result.missingSteps).toEqual(expect.any(Array))
    expect(result.errors).toEqual(expect.any(Array))
  })

  it('returns isValid=false with missingSteps when competitor count too low', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query - valid org
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

    // Mock competitors query - too few competitors
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
    
    expect(result.isValid).toBe(false)
    expect(result.missingSteps).toContain('Add competitors (have 2, need 3-7)')
    expect(result.errors).toContain('COMPETITORS_INVALID_COUNT')
    expect(result.missingSteps).toEqual(expect.any(Array))
    expect(result.errors).toEqual(expect.any(Array))
  })

  it('returns isValid=false with missingSteps when website URL format invalid', async () => {
    const mockSupabase = {
      from: vi.fn()
    }

    // Mock organizations query - invalid URL
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

    // Mock competitors query - valid count
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
    
    expect(result.isValid).toBe(false)
    expect(result.missingSteps).toContain('Fix website URL format')
    expect(result.errors).toContain('WEBSITE_URL_INVALID')
    expect(result.missingSteps).toEqual(expect.any(Array))
    expect(result.errors).toEqual(expect.any(Array))
  })
})
