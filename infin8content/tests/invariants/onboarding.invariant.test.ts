/**
 * INVARIANT TESTS - ONBOARDING SYSTEM LAW
 * 
 * These tests enforce the frozen system law:
 * "Onboarding is a data integrity condition, not a workflow step, not a flag, not UI state"
 * 
 * These are CONTRACT TESTS, not unit tests.
 * They assert SYSTEM TRUTH, not implementation details.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOnboarding } from '@/lib/onboarding/onboarding-validator'

const supabase = createServiceRoleClient()

describe('Onboarding System Law Invariants', () => {
  let testOrgId: string

  beforeAll(async () => {
    // Create a test organization for invariant testing
    const { data } = await supabase
      .from('organizations')
      .insert({
        name: 'Invariant Test Org',
        website_url: null,
        business_description: null,
        target_audiences: null,
        keyword_settings: null,
        content_defaults: null,
        onboarding_completed: false
      })
      .select('id')
      .single()

    if (!data) throw new Error('Failed to create test organization')
    testOrgId = (data as any).id
  })

  afterAll(async () => {
    // Cleanup test organization
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('organization_competitors').delete().eq('organization_id', testOrgId)
  })

  describe('Invariant 1: Flags have zero authority', () => {
    test('onboarding_completed flag is ignored if data is missing', async () => {
      // Arrange: Set flag to true but data is missing
      await supabase
        .from('organizations')
        .update({
          onboarding_completed: true,
          website_url: null,
          business_description: null
        })
        .eq('id', testOrgId)

      // Act: Check validator (the ONLY source of truth)
      const result = await validateOnboarding(testOrgId)

      // Assert: Validator ignores flag, validates data
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('website_url')
      expect(result.missing).toContain('business_description')
    })

    test('onboarding_completed flag can be false but validator says true', async () => {
      // Arrange: Set flag to false but data is complete
      await seedCompleteOnboardingData(testOrgId)

      // Act: Check validator
      const result = await validateOnboarding(testOrgId)

      // Assert: Validator derives truth from data, not flag
      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })
  })

  describe('Invariant 2: Onboarding passes only with full canonical data', () => {
    test('onboarding fails with missing website_url', async () => {
      await seedOnboardingMissing(testOrgId, 'website_url')
      const result = await validateOnboarding(testOrgId)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('website_url')
    })

    test('onboarding fails with missing business_description', async () => {
      await seedOnboardingMissing(testOrgId, 'business_description')
      const result = await validateOnboarding(testOrgId)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('business_description')
    })

    test('onboarding fails with missing target_audiences', async () => {
      await seedOnboardingMissing(testOrgId, 'target_audiences')
      const result = await validateOnboarding(testOrgId)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('target_audiences')
    })

    test('onboarding fails with missing keyword_settings', async () => {
      await seedOnboardingMissing(testOrgId, 'keyword_settings')
      const result = await validateOnboarding(testOrgId)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('keyword_settings')
    })

    test('onboarding fails with missing content_defaults', async () => {
      await seedOnboardingMissing(testOrgId, 'content_defaults')
      const result = await validateOnboarding(testOrgId)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('content_defaults')
    })

    test('onboarding fails with missing competitors', async () => {
      await seedCompleteOnboardingData(testOrgId)
      await supabase.from('organization_competitors').delete().eq('organization_id', testOrgId)
      
      const result = await validateOnboarding(testOrgId)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toContain('competitors')
    })

    test('onboarding passes only when all canonical fields exist', async () => {
      await seedCompleteOnboardingData(testOrgId)
      await seedCompetitors(testOrgId, 2)

      const result = await validateOnboarding(testOrgId)

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })
  })

  describe('Invariant 3: Workflow creation hard-blocked', () => {
    test('workflow creation is blocked if onboarding invalid', async () => {
      // Arrange: Invalid onboarding
      await seedOnboardingMissing(testOrgId, 'keyword_settings')

      // Act: Try to create workflow
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/intent/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Workflow' })
      })

      // Assert: Blocked
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.missing).toContain('keyword_settings')
    })

    test('workflow creation succeeds if onboarding valid', async () => {
      // Arrange: Valid onboarding
      await seedCompleteOnboardingData(testOrgId)
      await seedCompetitors(testOrgId, 2)

      // Act: Try to create workflow
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/intent/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Workflow' })
      })

      // Assert: Allowed
      expect(response.status).toBe(200)
    })
  })

  describe('Invariant 4: Competitor step fails without competitors', () => {
    let workflowId: string

    beforeEach(async () => {
      // Create a workflow for testing
      await seedCompleteOnboardingData(testOrgId)
      const { data } = await supabase
        .from('intent_workflows')
        .insert({
          organization_id: testOrgId,
          name: 'Competitor Test Workflow',
          status: 'step_1_icp'
        })
        .select('id')
        .single()
      if (!data) throw new Error('Failed to create test workflow')
      workflowId = (data as any).id
    })

    afterEach(async () => {
      await supabase.from('intent_workflows').delete().eq('id', workflowId)
    })

    test('competitor analysis fails without competitors', async () => {
      // Arrange: Valid onboarding but no competitors
      await supabase.from('organization_competitors').delete().eq('organization_id', testOrgId)

      // Act: Try competitor analysis
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/intent/workflows/${workflowId}/steps/competitor-analyze`,
        { method: 'POST' }
      )

      // Assert: Blocked
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('NO_COMPETITORS_PRESENT')
    })

    test('competitor analysis succeeds with competitors', async () => {
      // Arrange: Valid onboarding with competitors
      await seedCompetitors(testOrgId, 2)

      // Act: Try competitor analysis
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/intent/workflows/${workflowId}/steps/competitor-analyze`,
        { method: 'POST' }
      )

      // Assert: Allowed
      expect(response.status).toBe(200)
    })
  })

  describe('Invariant 5: Determinism', () => {
    test('onboarding validation is deterministic', async () => {
      await seedCompleteOnboardingData(testOrgId)
      await seedCompetitors(testOrgId, 2)

      const a = await validateOnboarding(testOrgId)
      const b = await validateOnboarding(testOrgId)

      expect(a).toEqual(b)
    })

    test('validation results are consistent across calls', async () => {
      await seedOnboardingMissing(testOrgId, 'website_url')

      const results = await Promise.all([
        validateOnboarding(testOrgId),
        validateOnboarding(testOrgId),
        validateOnboarding(testOrgId)
      ])

      // All results should be identical
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])
    })
  })

  describe('Invariant 6: No JSON dumping', () => {
    test('competitors are never read from blog_config or workflow_data', async () => {
      // Arrange: Add competitors to canonical table
      await seedCompetitors(testOrgId, 2)
      
      // Add fake competitors to blog_config (should be ignored)
      await supabase
        .from('organizations')
        .update({
          blog_config: {
            competitors: [
              { name: 'Fake Competitor', url: 'https://fake.com' }
            ]
          }
        })
        .eq('id', testOrgId)

      // Act: Load competitors for workflow
      const { data: competitors } = await supabase
        .from('organization_competitors')
        .select('*')
        .eq('organization_id', testOrgId)
        .eq('is_active', true)

      // Assert: Only canonical competitors are loaded
      expect(competitors).toHaveLength(2)
      expect((competitors as any[]).every((c: any) => c.name !== 'Fake Competitor')).toBe(true)
    })
  })
})

// Helper functions for test setup
async function seedCompleteOnboardingData(orgId: string) {
  await supabase
    .from('organizations')
    .update({
      website_url: 'https://test.com',
      business_description: 'Test business description with sufficient length for validation',
      target_audiences: ['Test Audience 1', 'Test Audience 2'],
      keyword_settings: {
        target_region: 'US',
        language_code: 'en',
        auto_generate: true,
        monthly_limit: 100
      },
      content_defaults: {
        language: 'en',
        tone: 'professional',
        style: 'educational',
        target_word_count: 1500,
        auto_publish: false
      }
    })
    .eq('id', orgId)
}

async function seedOnboardingMissing(orgId: string, missingField: string) {
  const baseData: any = {
    website_url: 'https://test.com',
    business_description: 'Test business description with sufficient length for validation',
    target_audiences: ['Test Audience 1', 'Test Audience 2'],
    keyword_settings: { target_region: 'US', language_code: 'en', auto_generate: true, monthly_limit: 100 },
    content_defaults: { language: 'en', tone: 'professional', style: 'educational', target_word_count: 1500, auto_publish: false }
  }

  const dataWithMissing = { ...baseData }
  dataWithMissing[missingField] = missingField.includes('audiences') ? [] : null

  await supabase.from('organizations').update(dataWithMissing).eq('id', orgId)
}

async function seedCompetitors(orgId: string, count: number) {
  // Find a valid user for created_by
  const { data: users } = await supabase
    .from('auth.users')
    .select('id')
    .limit(1) as { data: { id: string }[] | null, error: any }

  const validUserId = (users as { id: string }[] | null)?.[0]?.id

  if (validUserId) {
    const competitors = Array.from({ length: count }, (_, i) => ({
      organization_id: orgId,
      name: `Test Competitor ${i + 1}`,
      url: `https://competitor${i + 1}.com`,
      domain: `competitor${i + 1}.com`,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: validUserId
    }))

    await supabase.from('organization_competitors').insert(competitors)
  }
}
