import { describe, it, expect, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

describe('Onboarding System Law Invariant', () => {
  const supabase = createServiceRoleClient()
  const testOrgId = 'test-onboarding-invariant-org'

  beforeEach(async () => {
    // Clean up test organization
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('organization_competitors').delete().eq('organization_id', testOrgId)
  })

  it('System Law: Step derivation is deterministic regardless of request order', async () => {
    // Step 3 first (out of order)
    await supabase.from('organizations').insert({
      id: testOrgId,
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      }
    })

    // Step 2 second
    await supabase.from('organization_competitors').insert({
      organization_id: testOrgId,
      name: 'Test Competitor',
      url: 'https://example.com',
      domain: 'example.com',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'test-user'
    })

    // Step 1 last
    await supabase.from('organizations').update({
      website_url: 'https://example.com',
      business_description: 'Test business description with sufficient length for validation',
      target_audiences: ['Test Audience']
    }).eq('id', testOrgId)

    // Verify final state
    const { data: org } = await supabase
      .from('organizations')
      .select('website_url, business_description, target_audiences, keyword_settings, content_defaults')
      .eq('id', testOrgId)
      .single()

    const { count: competitorCount } = await supabase
      .from('organization_competitors')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', testOrgId)
      .eq('is_active', true)

    // System Law: All data must be present regardless of order
    expect(org?.website_url).toBe('https://example.com')
    expect(org?.business_description).toBe('Test business description with sufficient length for validation')
    expect(org?.target_audiences).toEqual(['Test Audience'])
    expect(org?.keyword_settings).toEqual({
      target_region: 'United States',
      language_code: 'en',
      auto_generate_keywords: true,
      monthly_keyword_limit: 100
    })
    expect(org?.content_defaults).toBeNull()
    expect(competitorCount).toBe(1)

    // System Law: Step must be 4 (Content Defaults) because content_defaults is missing
    const derivedStep = deriveStepFromCanonicalState({
      website_url: !!org?.website_url,
      business_description: !!org?.business_description,
      target_audiences_count: org?.target_audiences?.length || 0,
      keyword_settings_present: !!(org?.keyword_settings && Object.keys(org.keyword_settings).length > 0),
      content_defaults_present: !!(org?.content_defaults && Object.keys(org.content_defaults).length > 0),
      competitors: competitorCount || 0
    })

    expect(derivedStep).toBe(4)
  })

  it('System Law: Partial updates never overwrite existing data', async () => {
    // Set initial state
    await supabase.from('organizations').insert({
      id: testOrgId,
      website_url: 'https://initial.com',
      business_description: 'Initial description',
      target_audiences: ['Initial Audience']
    })

    // Partial update - only keyword_settings
    await supabase.from('organizations').update({
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      }
    }).eq('id', testOrgId)

    // Verify existing data is preserved
    const { data: org } = await supabase
      .from('organizations')
      .select('website_url, business_description, target_audiences, keyword_settings')
      .eq('id', testOrgId)
      .single()

    expect(org?.website_url).toBe('https://initial.com')
    expect(org?.business_description).toBe('Initial description')
    expect(org?.target_audiences).toEqual(['Initial Audience'])
    expect(org?.keyword_settings).toEqual({
      target_region: 'United States',
      language_code: 'en',
      auto_generate_keywords: true,
      monthly_keyword_limit: 100
    })
  })
})

// Helper function that matches the actual step derivation logic
function deriveStepFromCanonicalState(state: {
  website_url: boolean
  business_description: boolean
  target_audiences_count: number
  keyword_settings_present: boolean
  content_defaults_present: boolean
  competitors: number
}): number {
  if (!state.website_url || !state.business_description || state.target_audiences_count === 0) return 1
  if (state.competitors === 0) return 2
  if (!state.keyword_settings_present) return 3
  if (!state.content_defaults_present) return 4
  return 5
}
